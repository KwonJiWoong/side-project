/* 5분마다 실행: 지금 시각에 약 먹을 사람에게 알림 보내기
   주소가 없어진 구독(404 · 410)은 지움 */
import webpush from 'web-push';
import { currentBucket, messageFor } from './schedule.mjs';
import { rowsInBucket, deleteSubscription } from './db.mjs';

const CONCURRENCY = 20;
webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

export async function handler(event) {
  const now = event && event.time ? new Date(event.time) : new Date();
  const bucket = currentBucket(now);
  const jobs = [];
  for await (const row of rowsInBucket(bucket)) {
    const msg = messageFor(row, now);
    if (msg) jobs.push({ row, msg });
  }
  let sent = 0;
  let gone = 0;
  let failed = 0;
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    await Promise.all(jobs.slice(i, i + CONCURRENCY).map(async ({ row, msg }) => {
      try {
        await webpush.sendNotification(row.sub, JSON.stringify(msg), { TTL: 3600, urgency: 'high', topic: 'pill-' + row.slot });
        sent += 1;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) { gone += 1; await deleteSubscription(row.pk); }
        else { failed += 1; console.error('push send error', e.statusCode || e.name); }
      }
    }));
  }
  /* 기록에는 숫자만 남김 (주소 · 일정은 남기지 않음) */
  console.log(JSON.stringify({ bucket, due: jobs.length, sent, gone, failed }));
  return { bucket, sent, gone, failed };
}
