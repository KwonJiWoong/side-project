/* 안내 페이지 (개인정보처리방침 · 없는 페이지): 메인에서 고른 글자 크기 · 고대비 그대로 적용 */
(() => {
  'use strict';
  const root = document.documentElement;
  try {
    const size = Number(localStorage.getItem('pill-size')) || 0;
    if (size > 0 && size <= 2) root.setAttribute('data-size', String(size));
    if (localStorage.getItem('pill-contrast') === '1') root.setAttribute('data-contrast', 'high');
  } catch (e) { /* 저장소를 못 쓰면 기본 보기 */ }
})();
