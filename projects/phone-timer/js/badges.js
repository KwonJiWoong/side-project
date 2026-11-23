/* 배지: 데이터 · 받은 날짜 계산 · 메달 그림 */
((GT) => {
  'use strict';

  const util = GT.util;

  // 메달 색 (흰 아이콘과 대비 7:1 이상) · 잠긴 메달 색
  const COLOR = { green: '#2b5a1b', clay: '#8a3410', gold: '#6e5208', off: '#d8d3c6', offIcon: '#5d6357' };

  // 아이콘: 24×24 격자, 선으로 (흰색)
  const ICON = {
    flower: '<path d="M7 4.5c0 5.5 2.2 8.5 5 8.5s5-3 5-8.5l-2.6 2.3L12 3l-2.4 3.8z"/><path d="M12 13v8M12 18.5c-1.8-2.4-4-2.8-5.5-2M12 18.5c1.8-2.4 4-2.8 5.5-2"/>',
    redo: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9M19.5 4.5V9H15"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5M12 2.5V6"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    leaf: '<path d="M5 19c0-8 5-13.5 14-14 0 9-5.5 14-14 14zM5 19l7-7"/>',
    garden: '<path d="M4 20h16M7 20v-6M7 14c-2.5 0-3.5-2-3.5-4 2 0 3.5 1.5 3.5 4zM7 14c0-3 1.5-5 4-5 0 3-1.5 5-4 5zM16.5 20v-8"/><circle cx="16.5" cy="9" r="3"/>',
    week3: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><text x="12" y="18.3" text-anchor="middle" font-size="8.5" font-weight="800" font-family="sans-serif" stroke="none" fill="currentColor">3</text>',
    week5: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><text x="12" y="18.3" text-anchor="middle" font-size="8.5" font-weight="800" font-family="sans-serif" stroke="none" fill="currentColor">5</text>'
  };

  /**
   * 배지 목록. test(s)는 기록을 하나씩 더한 누적 상태 s를 보고 받았는지 판단
   * s: { okCount, lastOk, prevOk, maxHeld, maxBonus, weekDays(주별 성공 날 수 최대), total, kinds(꽃 피운 종류 수) }
   */
  const BADGES = [
    { id: 'first', name: '첫 꽃', desc: '처음으로 꽃을 피웠어요', icon: 'flower', color: 'green', test: (s) => s.okCount >= 1 },
    { id: 'again', name: '다시 피움', desc: '시든 다음 타이머에서 꽃을 피웠어요', icon: 'redo', color: 'clay', test: (s) => s.lastOk && s.prevOk === false },
    { id: 'long', name: '한 번에 50분', desc: '50분 넘게 내려놓고 꽃을 피웠어요', icon: 'timer', color: 'green', test: (s) => s.maxHeld >= 50 },
    { id: 'bonus', name: '보너스 30분', desc: '꽃이 핀 뒤 보너스 30분을 다 채웠어요', icon: 'star', color: 'gold', test: (s) => s.maxBonus >= 30 },
    { id: 'week3', name: '한 주 3일', desc: '한 주에 3일 꽃을 피웠어요', icon: 'week3', color: 'clay', test: (s) => s.weekDays >= 3 },
    { id: 'week5', name: '한 주 5일', desc: '한 주에 5일 꽃을 피웠어요', icon: 'week5', color: 'gold', test: (s) => s.weekDays >= 5 },
    { id: 'hours10', name: '10시간 모음', desc: '모은 시간이 10시간이 됐어요', icon: 'leaf', color: 'green', test: (s) => s.total >= 600 },
    { id: 'allKinds', name: '여덟 가지 꽃', desc: '식물 8종을 모두 꽃 피웠어요', icon: 'garden', color: 'gold', test: (s) => s.kinds >= GT.plants.SPECIES.length }
  ];

  /* ===== 받은 배지 계산 (기록에서 매번 다시 셈 → 따로 저장하지 않음) ===== */
  // 결과: { 배지 id: 받은 날(ISO) }
  function earned(records) {
    const got = {};
    const s = { okCount: 0, lastOk: null, prevOk: null, maxHeld: 0, maxBonus: 0, weekDays: 0, total: 0, kinds: 0 };
    const weeks = {};
    const kinds = {};

    records.forEach((r) => {
      if (r.fast) return; // 확인용 빠른 모드 기록은 빼고
      s.prevOk = s.lastOk;
      s.lastOk = !!r.ok;
      s.total += r.minutes || 0;
      if (r.ok) {
        const at = new Date(r.at);
        const wk = util.weekStart(at).getTime();
        weeks[wk] = weeks[wk] || {};
        weeks[wk][util.dayKey(at)] = true;
        s.okCount += 1;
        s.maxHeld = Math.max(s.maxHeld, (r.minutes || 0) - (r.bonus || 0));
        s.maxBonus = Math.max(s.maxBonus, r.bonus || 0);
        s.weekDays = Math.max(s.weekDays, Object.keys(weeks[wk]).length);
        kinds[r.plant] = true;
        s.kinds = Object.keys(kinds).length;
      }
      BADGES.forEach((b) => {
        if (!got[b.id] && b.test(s)) got[b.id] = r.at;
      });
    });
    return got;
  }

  // before에는 없고 after에 새로 생긴 배지
  const newOnes = (before, after) => BADGES.filter((b) => after[b.id] && !before[b.id]);

  /* ===== 메달 그림 (화면·사진 공용, 색값을 직접 씀) ===== */
  function svg(id, on) {
    const b = BADGES.find((x) => x.id === id) || BADGES[0];
    const fill = on ? COLOR[b.color] : COLOR.off;
    const line = on ? '#ffffff' : COLOR.offIcon;
    return '<svg class="medal" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<circle cx="32" cy="32" r="30" fill="' + fill + '"/>' +
      '<circle cx="32" cy="32" r="25.5" fill="none" stroke="' + line + '" stroke-opacity="0.45" stroke-width="1.5"/>' +
      '<g transform="translate(14 14) scale(1.5)" fill="none" stroke="' + line + '" color="' + line + '" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + ICON[b.icon] + '</g>' +
    '</svg>';
  }

  GT.badges = { BADGES: BADGES, earned: earned, newOnes: newOnes, svg: svg };
})(window.GT = window.GT || {});
