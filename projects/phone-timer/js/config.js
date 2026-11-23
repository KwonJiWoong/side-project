/* 바꿀 수 있는 값: 시간 기준 · 저장 키 */
((GT) => {
  'use strict';

  const FAST = /[?&]fast(?:[=&]|$)/.test(location.search); // 확인용: 주소 끝에 ?fast → 1분을 1초로
  const MINUTE = FAST ? 1000 : 60000;

  GT.config = {
    FAST: FAST,
    MINUTE: MINUTE,
    GRACE: 10000,               // 이탈 유예 10초 (실제 시간)
    PAUSE_MAX: 5 * 60000,       // 급한 일 이어하기: 5분 이내, 한 번만 (실제 시간)
    BONUS_MAX: 30 * MINUTE,     // 꽃이 핀 뒤 보너스 시간 최대 30분
    KEYS: {
      data: 'growtime-v1',
      session: 'growtime-session'
    }
  };
})(window.GT = window.GT || {});
