/* 첫 실행: 끊긴 타이머 복구 또는 첫 화면 열기 */
((GT) => {
  'use strict';

  const store = GT.store;

  if (!store.canStore) GT.util.$('storageNotice').hidden = false;
  GT.ui.applyFont();

  // 진행 중에 창이 닫혔던 경우 → 마지막으로 확인된 시각까지로 처리
  const s = store.session.get();
  if (s && s.start && s.duration) {
    store.session.clear();
    const lastAt = s.leftAt || s.lastSeen || s.start;
    const held = lastAt - s.start;
    let r;
    if (s.phase === 'bonus' && s.bonusStart) r = { ok: true, held: s.duration, bonus: lastAt - s.bonusStart, reason: 'done' };
    else if (held >= s.duration) r = { ok: true, held: s.duration, bonus: held - s.duration, reason: 'done' };
    else r = { ok: false, held: held, reason: 'reload' };
    GT.result.finish(r, s);
  } else {
    GT.ui.route(false);
  }
})(window.GT = window.GT || {});
