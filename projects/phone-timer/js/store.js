/* 저장소: 기록 · 설정 · 진행 중 세션, 모은 시간 · 해금 계산 */
(function (GT) {
  'use strict';

  var KEYS = GT.config.KEYS;
  var util = GT.util;

  /* ===== 저장소 (쓸 수 없으면 메모리에만 보관) ===== */
  var canStore = (function () {
    try {
      localStorage.setItem('__gt', '1');
      localStorage.removeItem('__gt');
      return true;
    } catch (e) { return false; }
  })();
  var memory = {};

  function load(key, fallback) {
    try {
      var raw = canStore ? localStorage.getItem(key) : memory[key];
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function save(key, value) {
    var raw = JSON.stringify(value);
    if (canStore) {
      try { localStorage.setItem(key, raw); return; } catch (e) { /* 용량 초과 등 → 메모리로 */ }
    }
    memory[key] = raw;
  }

  function remove(key) {
    if (canStore) { try { localStorage.removeItem(key); } catch (e) { /* 무시 */ } }
    delete memory[key];
  }

  /* ===== 기록 · 설정 ===== */
  var data = load(KEYS.data, null) || {};
  if (!Array.isArray(data.records)) data.records = [];
  if (!data.settings || typeof data.settings !== 'object') data.settings = {};
  if (typeof data.settings.sound !== 'boolean') data.settings.sound = true;

  function saveData() { save(KEYS.data, data); }

  function addRecord(record) {
    data.records.push(record);
    saveData();
  }

  function clearRecords() {
    data.records = [];
    saveData();
  }

  /* ===== 계산 ===== */
  function totalMinutes() {
    return data.records.reduce(function (sum, r) { return sum + (r.minutes || 0); }, 0);
  }

  function isUnlocked(sp, total) {
    return sp.unlock <= (total === undefined ? totalMinutes() : total);
  }

  function weekKeyOf(r) { return util.weekStart(new Date(r.at)).getTime(); }

  // 이번 주(월~일)에 성공한 날 수
  function weekSuccessDays() {
    var start = util.weekStart(new Date()).getTime();
    var days = {};
    data.records.forEach(function (r) {
      var at = new Date(r.at);
      if (r.ok && at.getTime() >= start) days[util.dayKey(at)] = true;
    });
    return Object.keys(days).length;
  }

  /* ===== 진행 중 세션 (창이 닫혀도 복구) ===== */
  var session = {
    get: function () { return load(KEYS.session, null); },
    set: function (value) { save(KEYS.session, value); },
    clear: function () { remove(KEYS.session); }
  };

  GT.store = {
    canStore: canStore,
    data: data,
    settings: data.settings,
    saveData: saveData,
    addRecord: addRecord,
    clearRecords: clearRecords,
    totalMinutes: totalMinutes,
    isUnlocked: isUnlocked,
    weekKeyOf: weekKeyOf,
    weekSuccessDays: weekSuccessDays,
    session: session
  };
})(window.GT = window.GT || {});
