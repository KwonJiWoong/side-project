/* 오늘의 초대장 고르기
   - 날짜 + 유형으로 정해지는 값이라 같은 날 다시 열어도 같은 초대장
   - 최근 7일에 받은 초대장은 빼고 고름 */
import { addDays } from './date.js';

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function recentIds(days, todayKey) {
  const ids = new Set();
  for (let i = 1; i <= 7; i += 1) {
    const rec = days[addDays(todayKey, -i)];
    if (rec?.eventId) ids.add(rec.eventId);
    if (rec?.firstId) ids.add(rec.firstId);
  }
  return ids;
}

export function pickEvent(events, type, todayKey, days, exclude = []) {
  const mine = events.filter((ev) => ev.types.includes(type));
  const recent = recentIds(days, todayKey);
  let pool = mine.filter((ev) => !recent.has(ev.id) && !exclude.includes(ev.id));
  if (!pool.length) pool = mine.filter((ev) => !exclude.includes(ev.id));
  if (!pool.length) return null;
  const salt = exclude.length ? `-swap${exclude.length}` : '';
  return pool[hash(`${todayKey}-${type}${salt}`) % pool.length];
}
