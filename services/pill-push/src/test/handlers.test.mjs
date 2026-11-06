/* 구독 API · 발송 흐름 (DynamoDB와 푸시 전송은 가짜로) */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import webpush from 'web-push';

process.env.VAPID_SUBJECT = 'mailto:kjobaba@naver.com';
const keys = webpush.generateVAPIDKeys();
process.env.VAPID_PUBLIC_KEY = keys.publicKey;
process.env.VAPID_PRIVATE_KEY = keys.privateKey;

const ddb = mockClient(DynamoDBDocumentClient);
const store = new Map();
ddb.on(BatchWriteCommand).callsFake((input) => {
  for (const r of Object.values(input.RequestItems)[0]) {
    if (r.PutRequest) store.set(r.PutRequest.Item.pk + '|' + r.PutRequest.Item.sk, r.PutRequest.Item);
    if (r.DeleteRequest) store.delete(r.DeleteRequest.Key.pk + '|' + r.DeleteRequest.Key.sk);
  }
  return {};
});
ddb.on(QueryCommand).callsFake((input) => {
  const v = input.ExpressionAttributeValues;
  const items = [...store.values()].filter((it) => (input.IndexName ? it.bucket === v[':b'] : it.pk === v[':pk']));
  return { Items: items };
});

const { handler: api } = await import('../api.mjs');
const { handler: sender } = await import('../sender.mjs');
const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'BAAA', auth: 'abc' } };
const call = (body) => api({ body: JSON.stringify(body) });
const schedule = (slots) => ({ timeZone: 'Asia/Seoul', dayStartHour: 4, slots });
const daily = [{ repeat: { type: 'daily' }, until: '' }];

test('구독 → 갱신 → 발송 → 해지', async () => {
  let res = await call({ action: 'subscribe', subscription: sub, schedule: schedule([
    { slot: 'morning', time: '08:00', rules: daily }, { slot: 'evening', time: '18:30', rules: daily }]) });
  assert.equal(res.statusCode, 200);
  assert.equal(store.size, 2);

  res = await call({ action: 'update', subscription: sub, schedule: schedule([{ slot: 'morning', time: '07:30', rules: daily }]) });
  assert.equal(store.size, 1);                                  // 저녁 줄은 지워짐
  assert.equal([...store.values()][0].bucket, '22:30');

  const sent = [];
  webpush.sendNotification = async (s, payload) => { sent.push(JSON.parse(payload)); return { statusCode: 201 }; };
  let out = await sender({ time: '2026-11-05T22:30:00Z' });       // 11/6 07:30 KST
  assert.equal(out.sent, 1);
  assert.equal(sent[0].title, '아침 약 드실 시간이에요');
  out = await sender({ time: '2026-11-05T22:35:00Z' });
  assert.equal(out.sent, 1 - 1);                                 // 다른 칸은 안 보냄

  webpush.sendNotification = async () => { const e = new Error('gone'); e.statusCode = 410; throw e; };
  out = await sender({ time: '2026-11-06T22:30:00Z' });
  assert.equal(out.gone, 1);
  assert.equal(store.size, 0);                                   // 없어진 구독은 지움

  await call({ action: 'subscribe', subscription: sub, schedule: schedule([{ slot: 'lunch', time: '12:00', rules: daily }]) });
  res = await call({ action: 'unsubscribe', endpoint: sub.endpoint });
  assert.equal(res.statusCode, 200);
  assert.equal(store.size, 0);
});

test('약을 다 지우면 구독 줄도 지움', async () => {
  await call({ action: 'subscribe', subscription: sub, schedule: schedule([{ slot: 'lunch', time: '12:00', rules: daily }]) });
  const res = await call({ action: 'update', subscription: sub, schedule: schedule([]) });
  assert.equal(JSON.parse(res.body).slots, 0);
  assert.equal(store.size, 0);
});

test('잘못된 요청은 400', async () => {
  const res = await call({ action: 'subscribe', subscription: { endpoint: 'https://evil.com/x', keys: sub.keys }, schedule: schedule([]) });
  assert.equal(res.statusCode, 400);
});
