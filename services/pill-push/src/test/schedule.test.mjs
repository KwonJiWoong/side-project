import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import webpush from 'web-push';
import { isDue, toBucket, currentBucket, localDayKey, messageFor, validSchedule, validSubscription } from '../schedule.mjs';
import { parseRequest, rowsFor } from '../api.mjs';

const KST = 'Asia/Seoul';
const at = (iso) => new Date(iso);

test('먹는 날 규칙', () => {
  assert.equal(isDue({ repeat: { type: 'daily' }, until: '' }, '2026-11-06'), true);
  assert.equal(isDue({ repeat: { type: 'week', days: [1] }, until: '' }, '2026-11-09'), true);  // 월
  assert.equal(isDue({ repeat: { type: 'week', days: [1] }, until: '' }, '2026-11-10'), false);
  assert.equal(isDue({ repeat: { type: 'every', n: 2, from: '2026-11-06' }, until: '' }, '2026-11-08'), true);
  assert.equal(isDue({ repeat: { type: 'every', n: 2, from: '2026-11-06' }, until: '' }, '2026-11-07'), false);
  assert.equal(isDue({ repeat: { type: 'every', n: 2, from: '2026-11-06' }, until: '' }, '2026-11-05'), false);
  assert.equal(isDue({ repeat: { type: 'daily' }, until: '2026-11-07' }, '2026-11-08'), false);
});

test('한국 시각 → 발송 칸(UTC)', () => {
  const now = at('2026-11-06T00:00:00Z');
  assert.equal(toBucket('08:00', KST, now), '23:00');
  assert.equal(toBucket('12:30', KST, now), '03:30');
  assert.equal(toBucket('08:03', KST, now), '23:00');   // 5분 단위로 내림
  assert.equal(toBucket('00:30', KST, now), '15:30');
  assert.equal(currentBucket(at('2026-11-05T23:02:10Z')), '23:00');
});

test('새벽 4시 전은 전날', () => {
  assert.equal(localDayKey(KST, 4, at('2026-11-06T16:30:00Z')), '2026-11-06'); // 11/7 01:30 KST
  assert.equal(localDayKey(KST, 4, at('2026-11-06T19:30:00Z')), '2026-11-07'); // 11/7 04:30 KST
});

test('알림 문구: 오늘 먹는 약만 세고 이름은 안 넣음', () => {
  const item = { slot: 'morning', time: '08:00', kind: 'with', tz: KST, dayStartHour: 4,
    rules: [{ repeat: { type: 'daily' }, until: '' }, { repeat: { type: 'week', days: [1] }, until: '' }] };
  const fri = messageFor(item, at('2026-11-05T23:00:00Z'));  // 11/6 금 08:00
  assert.deepEqual(fri, { title: '아침 약 드실 시간이에요', body: '오전 8시 · 식사 때 약 1개. 이미 드셨으면 넘어가세요.', slot: 'morning' });
  const before = messageFor({ ...item, kind: 'before', time: '07:30' }, at('2026-11-05T22:30:00Z'));
  assert.equal(before.body, '오전 7시 30분 · 식사 30분 전 약 1개. 이미 드셨으면 넘어가세요.');
  const mon = messageFor(item, at('2026-11-08T23:00:00Z'));  // 11/9 월
  assert.match(mon.body, /약 2개/);
  const onlyWeekly = { ...item, rules: [item.rules[1]] };
  assert.equal(messageFor(onlyWeekly, at('2026-11-05T23:00:00Z')), null);
});

test('자기 전 00:30 약은 전날 기준으로 계산', () => {
  const item = { slot: 'bed', time: '00:30', tz: KST, dayStartHour: 4,
    rules: [{ repeat: { type: 'week', days: [5] }, until: '' }] };     // 금요일 자기 전
  assert.ok(messageFor(item, at('2026-11-06T15:30:00Z')));            // 11/7(토) 00:30 = 금요일 밤
  assert.equal(messageFor(item, at('2026-11-05T15:30:00Z')), null);   // 11/6(금) 00:30 = 목요일 밤
});

test('일정 검사', () => {
  assert.ok(validSchedule({ timeZone: KST, dayStartHour: 4, slots: [{ slot: 'morning', time: '08:00', rules: [{ repeat: { type: 'daily' }, until: '' }] }] }));
  assert.equal(validSchedule({ slots: [{ slot: 'x', time: '08:00', rules: [{}] }] }), null);
  assert.equal(validSchedule({ slots: [{ slot: 'morning', time: '25:00', rules: [{}] }] }), null);
  assert.equal(validSchedule({ timeZone: 'Nowhere/City', slots: [] }), null);
  assert.equal(validSchedule({ slots: [{ slot: 'morning', time: '08:00', rules: [{ repeat: { type: 'every', n: 1, from: '2026-11-06' } }] }] }), null);
});

test('같은 시간대에 시각이 다른 약 (식사 전 · 뒤)', () => {
  const v = validSchedule({ timeZone: KST, dayStartHour: 4, slots: [
    { slot: 'morning', time: '07:30', kind: 'before', rules: [{ repeat: { type: 'daily' }, until: '' }] },
    { slot: 'morning', time: '08:30', kind: 'after', rules: [{ repeat: { type: 'daily' }, until: '' }] }] });
  assert.equal(v.slots.length, 2);
  assert.equal(validSchedule({ slots: [
    { slot: 'morning', time: '07:30', rules: [{}] }, { slot: 'morning', time: '07:30', rules: [{}] }] }), null);   // 같은 시각 두 번
  assert.equal(validSchedule({ slots: [{ slot: 'morning', time: '07:30', kind: 'x', rules: [{}] }] }), null);
});

test('푸시 주소는 알려진 서비스만', () => {
  const keys = { p256dh: 'BAAA', auth: 'abc' };
  assert.ok(validSubscription({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys }));
  assert.ok(validSubscription({ endpoint: 'https://web.push.apple.com/QG', keys }));
  assert.equal(validSubscription({ endpoint: 'https://evil.example.com/x', keys }), null);
  assert.equal(validSubscription({ endpoint: 'http://fcm.googleapis.com/x', keys }), null);
  assert.equal(validSubscription({ endpoint: 'https://fcm.googleapis.com.evil.com/x', keys }), null);
});

test('요청 읽기 · 저장할 줄 만들기', () => {
  const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'BAAA', auth: 'abc' } };
  const schedule = { timeZone: KST, dayStartHour: 4, slots: [
    { slot: 'morning', label: '아침', time: '08:00', rules: [{ repeat: { type: 'daily' }, until: '' }] },
    { slot: 'bed', label: '자기 전', time: '22:00', rules: [{ repeat: { type: 'week', days: [1, 4] }, until: '2026-12-31' }] }
  ] };
  const req = parseRequest({ body: JSON.stringify({ action: 'subscribe', subscription: sub, schedule }) });
  assert.equal(req.action, 'subscribe');
  const { pk, rows } = rowsFor(req.subscription, req.schedule, at('2026-11-06T00:00:00Z'));
  assert.match(pk, /^S#/);
  assert.deepEqual(rows.map((r) => [r.sk, r.bucket]), [['slot#morning#0800', '23:00'], ['slot#bed#2200', '13:00']]);
  assert.ok(!JSON.stringify(rows).includes('아침'));  // 이름 · 라벨은 저장 안 함
  assert.equal(parseRequest({ body: '{"action":"hack"}' }).error, '할 일을 알 수 없어요.');
  assert.ok(parseRequest({ body: 'x'.repeat(20000) }).error);
  assert.equal(parseRequest({ body: JSON.stringify({ action: 'unsubscribe', endpoint: sub.endpoint }) }).action, 'unsubscribe');
});

test('알림 암호화 (실제 키로 요청 만들기)', () => {
  const v = webpush.generateVAPIDKeys();
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys: {
    p256dh: ecdh.getPublicKey().toString('base64url'), auth: crypto.randomBytes(16).toString('base64url') } };
  const r = webpush.generateRequestDetails(sub, JSON.stringify({ title: 't' }), {
    vapidDetails: { subject: 'mailto:kjobaba@naver.com', publicKey: v.publicKey, privateKey: v.privateKey }, TTL: 3600 });
  assert.equal(r.method, 'POST');
  assert.ok(r.headers.Authorization.startsWith('vapid '));
  assert.equal(r.headers['Content-Encoding'], 'aes128gcm');
});
