/* 화면 모드 적용 (화면이 그려지기 전에 실행해 깜빡임 방지) */
(function () {
  var root = document.documentElement;
  var mode = '';
  var font = '';
  try {
    mode = JSON.parse(localStorage.getItem('fr-mode') || '""');
    font = JSON.parse(localStorage.getItem('fr-font') || '""');
  } catch (e) { /* 저장소를 쓸 수 없으면 일반용 */ }

  if (mode === 'general' || mode === 'senior') root.setAttribute('data-mode', mode);
  if (mode === 'senior' && font === 'lg') root.setAttribute('data-font', 'lg');

  // 첫 화면: 이미 고른 적이 있으면 바로 운동 화면으로
  if (root.getAttribute('data-page') === 'select' && root.hasAttribute('data-mode') && !/[?&]select=1/.test(location.search)) {
    location.replace('routine.html');
  }
})();
