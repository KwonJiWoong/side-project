/* 화면 그리기 전에 먼저 실행: 고른 글자 크기 · 고대비 적용, 스크립트가 돈다는 표시(.js)
   (나중에 바뀌면 화면이 출렁여서 미리 맞춤) */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  try {
    const size = Number(localStorage.getItem('pill-size')) || 0;
    if (size > 0 && size <= 2) root.setAttribute('data-size', String(size));
    if (localStorage.getItem('pill-contrast') === '1') root.setAttribute('data-contrast', 'high');
  } catch (e) { /* 저장소를 못 쓰면 기본 보기 */ }
})();
