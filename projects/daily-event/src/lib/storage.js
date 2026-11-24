/* 기록 저장 (이 기기 브라우저의 localStorage) */
const KEY = 'daily-event';
const EMPTY = { v: 1, type: null, days: {}, handoffClosed: false };

export function storageAvailable() {
  try {
    const test = `${KEY}-test`;
    localStorage.setItem(test, '1');
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const data = JSON.parse(raw);
    return { ...EMPTY, ...data, days: data.days || {} };
  } catch {
    return { ...EMPTY };
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
