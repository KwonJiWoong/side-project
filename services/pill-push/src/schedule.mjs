/* 일정 계산 (사이트 js/main.js의 isDue와 같은 규칙)
   서버는 약 이름을 모르고, 시간대별 시각과 '언제 먹는지' 규칙만 받음 */

export const SLOT_IDS = ['morning', 'lunch', 'evening', 'bed'];
export const SLOT_LABELS = { morning: '아침', lunch: '점심', evening: '저녁', bed: '자기 전' };
export const BUCKET_MIN = 5;

const isKey = (k) => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);
const keyToUtc = (k) => Date.UTC(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10)));
export const dayOfWeek = (k) => new Date(keyToUtc(k)).getUTCDay();
export const dayDiff = (a, b) => Math.round((keyToUtc(b) - keyToUtc(a)) / 86400000);

/* 이 날(key) 먹는 약인지 */
export function isDue(rule, key) {
  if (rule.until && key > rule.until) return false;
  const r = rule.repeat || { type: 'daily' };
  if (r.type === 'week') return Array.isArray(r.days) && r.days.includes(dayOfWeek(key));
  if (r.type === 'every') { const d = dayDiff(r.from, key); return d >= 0 && d % r.n === 0; }
  return true;
}

/* 시간대(tz)의 지금 시각 정보 */
function partsIn(tz, date) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { key: p.year + '-' + p.month + '-' + p.day, hour: Number(p.hour), minute: Number(p.minute) };
}

/* UTC와 시간대의 차이 (분) */
export function offsetMinutes(tz, date = new Date()) {
  const p = partsIn(tz, date);
  const local = keyToUtc(p.key) + (p.hour * 60 + p.minute) * 60000;
  const utc = Math.floor(date.getTime() / 60000) * 60000;
  return Math.round((local - utc) / 60000);
}

/* 'HH:MM'(그 사람 시간) → 발송 칸 'HH:MM'(UTC, 5분 단위) */
export function toBucket(time, tz, date = new Date()) {
  const [h, m] = time.split(':').map(Number);
  const utcMin = (((h * 60 + m - offsetMinutes(tz, date)) % 1440) + 1440) % 1440;
  const b = Math.floor(utcMin / BUCKET_MIN) * BUCKET_MIN;
  return String(Math.floor(b / 60)).padStart(2, '0') + ':' + String(b % 60).padStart(2, '0');
}

/* 지금(UTC) 발송 칸 */
export function currentBucket(date = new Date()) {
  const min = date.getUTCHours() * 60 + date.getUTCMinutes();
  const b = Math.floor(min / BUCKET_MIN) * BUCKET_MIN;
  return String(Math.floor(b / 60)).padStart(2, '0') + ':' + String(b % 60).padStart(2, '0');
}

/* 그 사람 기준 '오늘' (새벽 dayStartHour시 전은 전날) */
export function localDayKey(tz, dayStartHour, date = new Date()) {
  return partsIn(tz, new Date(date.getTime() - dayStartHour * 3600000)).key;
}

const fmtClock = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const part = h === 0 ? '밤 ' : h < 6 ? '새벽 ' : h < 12 ? '오전 ' : h === 12 ? '낮 ' : '오후 ';
  return part + (h % 12 || 12) + '시' + (m ? ' ' + m + '분' : '');
};

/* 발송 칸 하나(item)에 대해 지금 보낼 알림 (없으면 null)
   잠금 화면에 보일 수 있어서 약 이름은 넣지 않음 */
export function messageFor(item, date = new Date()) {
  const key = localDayKey(item.tz, item.dayStartHour, date);
  const count = (item.rules || []).filter((r) => isDue(r, key)).length;
  if (!count) return null;
  const label = SLOT_LABELS[item.slot] || '';
  return {
    title: label + ' 약 드실 시간이에요',
    body: fmtClock(item.time) + ' · 약 ' + count + '개. 이미 드셨으면 넘어가세요.',
    slot: item.slot
  };
}

/* 받은 일정 검사 (이상하면 null) */
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
function validRepeat(r) {
  if (!r || r.type === 'daily') return { type: 'daily' };
  if (r.type === 'week' && Array.isArray(r.days) && r.days.length && r.days.length <= 7 &&
      r.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) return { type: 'week', days: [...new Set(r.days)].sort() };
  if (r.type === 'every' && Number.isInteger(r.n) && r.n >= 2 && r.n <= 30 && isKey(r.from)) return { type: 'every', n: r.n, from: r.from };
  return null;
}
export function validSchedule(s) {
  if (!s || typeof s !== 'object') return null;
  let tz = 'Asia/Seoul';
  if (typeof s.timeZone === 'string' && s.timeZone.length <= 64) {
    try { new Intl.DateTimeFormat('en', { timeZone: s.timeZone }); tz = s.timeZone; } catch (e) { return null; }
  }
  const dayStartHour = Number.isInteger(s.dayStartHour) && s.dayStartHour >= 0 && s.dayStartHour <= 6 ? s.dayStartHour : 4;
  if (!Array.isArray(s.slots) || s.slots.length > SLOT_IDS.length) return null;
  const seen = new Set();
  const slots = [];
  for (const x of s.slots) {
    if (!x || !SLOT_IDS.includes(x.slot) || seen.has(x.slot) || !TIME_RE.test(x.time || '')) return null;
    if (!Array.isArray(x.rules) || !x.rules.length || x.rules.length > 30) return null;
    const rules = [];
    for (const r of x.rules) {
      const repeat = validRepeat(r && r.repeat);
      if (!repeat) return null;
      const until = r.until ? (isKey(r.until) ? r.until : null) : '';
      if (until === null) return null;
      rules.push({ repeat, until });
    }
    seen.add(x.slot);
    slots.push({ slot: x.slot, time: x.time, rules });
  }
  return { timeZone: tz, dayStartHour, slots };
}

/* 웹 푸시 주소는 알려진 푸시 서비스만 (다른 곳으로 요청을 보내게 하는 악용 방지) */
const PUSH_HOSTS = [
  /(^|\.)fcm\.googleapis\.com$/,
  /(^|\.)android\.googleapis\.com$/,
  /(^|\.)push\.services\.mozilla\.com$/,
  /(^|\.)push\.apple\.com$/,
  /(^|\.)notify\.windows\.com$/
];
export function validSubscription(sub) {
  if (!sub || typeof sub !== 'object' || typeof sub.endpoint !== 'string' || sub.endpoint.length > 1024) return null;
  let url;
  try { url = new URL(sub.endpoint); } catch (e) { return null; }
  if (url.protocol !== 'https:' || !PUSH_HOSTS.some((re) => re.test(url.hostname))) return null;
  const k = sub.keys || {};
  const b64 = /^[A-Za-z0-9_-]+={0,2}$/;
  if (typeof k.p256dh !== 'string' || typeof k.auth !== 'string' || !b64.test(k.p256dh) || !b64.test(k.auth) ||
      k.p256dh.length > 200 || k.auth.length > 64) return null;
  return { endpoint: sub.endpoint, keys: { p256dh: k.p256dh, auth: k.auth } };
}
export const validEndpoint = (e) => validSubscription({ endpoint: e, keys: { p256dh: 'a', auth: 'a' } }) ? e : null;
