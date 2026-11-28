/* 날짜 도구 — 모두 이 기기의 현지 시간 기준 */
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

export function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const date = fromKey(key);
  date.setDate(date.getDate() + n);
  return toKey(date);
}

/* 11월 24일 화요일 */
export function formatLong(key) {
  const d = fromKey(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEK[d.getDay()]}요일`;
}

/* 11.24 */
export function formatDot(key) {
  const d = fromKey(key);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`;
}

/* 한 달 달력: 일요일 시작, 빈칸은 null */
export function monthWeeks(year, month) {
  const first = new Date(year, month, 1).getDay();
  const last = new Date(year, month + 1, 0).getDate();
  const cells = Array(first).fill(null);
  for (let day = 1; day <= last; day += 1) cells.push(toKey(new Date(year, month, day)));
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export const WEEKDAYS = WEEK;
