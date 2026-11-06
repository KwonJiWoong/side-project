/* DynamoDB: 구독 하나 = 시간대(아침·점심·저녁·자기 전)마다 한 줄
   pk = S#<주소 해시>, sk = slot#<시간대>, bucket = 보낼 시각(UTC 5분 단위, 색인)
   약 이름 · 먹은 기록은 저장하지 않음. 90일 동안 갱신이 없으면 자동 삭제(expireAt) */
import { createHash } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.TABLE_NAME;
export const KEEP_DAYS = 90;
const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions: { removeUndefinedValues: true } });

export const subId = (endpoint) => 'S#' + createHash('sha256').update(endpoint).digest('base64url');

async function batchWrite(requests) {
  for (let i = 0; i < requests.length; i += 25) {
    let items = { [TABLE]: requests.slice(i, i + 25) };
    for (let tries = 0; items && Object.keys(items).length && tries < 5; tries += 1) {
      const res = await doc.send(new BatchWriteCommand({ RequestItems: items }));
      items = res.UnprocessedItems;
      if (items && Object.keys(items).length) await new Promise((r) => setTimeout(r, 100 * 2 ** tries));
    }
  }
}

export async function rowsOf(pk) {
  const res = await doc.send(new QueryCommand({ TableName: TABLE, KeyConditionExpression: 'pk = :pk', ExpressionAttributeValues: { ':pk': pk } }));
  return res.Items || [];
}

/* 구독 저장: 예전 줄 지우고 새로 씀 */
export async function saveSubscription(pk, rows) {
  const old = await rowsOf(pk);
  const keep = new Set(rows.map((r) => r.sk));
  const reqs = old.filter((o) => !keep.has(o.sk)).map((o) => ({ DeleteRequest: { Key: { pk: o.pk, sk: o.sk } } }))
    .concat(rows.map((r) => ({ PutRequest: { Item: r } })));
  await batchWrite(reqs);
}

export async function deleteSubscription(pk) {
  const old = await rowsOf(pk);
  await batchWrite(old.map((o) => ({ DeleteRequest: { Key: { pk: o.pk, sk: o.sk } } })));
}

/* 이 발송 칸의 모든 줄 */
export async function* rowsInBucket(bucket) {
  let start;
  do {
    const res = await doc.send(new QueryCommand({
      TableName: TABLE, IndexName: 'byBucket', KeyConditionExpression: 'bucket = :b',
      ExpressionAttributeValues: { ':b': bucket }, ExclusiveStartKey: start
    }));
    for (const it of res.Items || []) yield it;
    start = res.LastEvaluatedKey;
  } while (start);
}
