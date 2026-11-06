/* POST /push  구독 저장 · 갱신 · 해지
   { action: 'subscribe' | 'update', subscription, schedule }
   { action: 'unsubscribe', endpoint } */
import { validSchedule, validSubscription, validEndpoint, toBucket } from './schedule.mjs';
import { subId, saveSubscription, deleteSubscription, KEEP_DAYS } from './db.mjs';

const MAX_BODY = 16 * 1024;
const reply = (status, body) => ({
  statusCode: status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  body: JSON.stringify(body || {})
});

export function parseRequest(event) {
  let raw = event.body || '';
  if (event.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf8');
  if (!raw || raw.length > MAX_BODY) return { error: '보낸 내용이 비었거나 너무 커요.' };
  let data;
  try { data = JSON.parse(raw); } catch (e) { return { error: '보낸 내용을 읽을 수 없어요.' }; }
  if (data.action === 'unsubscribe') {
    const endpoint = validEndpoint(data.endpoint);
    return endpoint ? { action: 'unsubscribe', endpoint } : { error: '알림 주소가 올바르지 않아요.' };
  }
  if (data.action !== 'subscribe' && data.action !== 'update') return { error: '할 일을 알 수 없어요.' };
  const subscription = validSubscription(data.subscription);
  if (!subscription) return { error: '알림 주소가 올바르지 않아요.' };
  const schedule = validSchedule(data.schedule);
  if (!schedule) return { error: '먹는 시각 정보가 올바르지 않아요.' };
  return { action: data.action, subscription, schedule };
}

export function rowsFor(subscription, schedule, now = new Date()) {
  const pk = subId(subscription.endpoint);
  const expireAt = Math.floor(now.getTime() / 1000) + KEEP_DAYS * 86400;
  return {
    pk,
    rows: schedule.slots.map((s) => ({
      pk,
      sk: 'slot#' + s.slot,
      bucket: toBucket(s.time, schedule.timeZone, now),
      slot: s.slot,
      time: s.time,
      rules: s.rules,
      tz: schedule.timeZone,
      dayStartHour: schedule.dayStartHour,
      sub: subscription,
      updatedAt: now.toISOString(),
      expireAt
    }))
  };
}

export async function handler(event) {
  const req = parseRequest(event);
  if (req.error) return reply(400, { ok: false, message: req.error });
  try {
    if (req.action === 'unsubscribe') {
      await deleteSubscription(subId(req.endpoint));
      return reply(200, { ok: true });
    }
    const { pk, rows } = rowsFor(req.subscription, req.schedule);
    if (rows.length) await saveSubscription(pk, rows);
    else await deleteSubscription(pk);
    return reply(200, { ok: true, slots: rows.length });
  } catch (e) {
    console.error('push api error', e.name, e.message);
    return reply(500, { ok: false, message: '잠시 뒤 다시 해 주세요.' });
  }
}
