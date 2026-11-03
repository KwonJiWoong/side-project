/* 화면 모드 · 밝기 적용 (화면이 그려지기 전에 실행해 깜빡임 방지) */
(function () {
  var root = document.documentElement;
  var mode = '';
  var font = '';
  var theme = 'auto';
  try {
    mode = JSON.parse(localStorage.getItem('fr-mode') || '""');
    font = JSON.parse(localStorage.getItem('fr-font') || '""');
    theme = JSON.parse(localStorage.getItem('fr-theme') || '"auto"');
  } catch (e) { /* 저장소를 쓸 수 없으면 일반용 · 자동 밝기 */ }

  if (mode === 'general' || mode === 'senior') root.setAttribute('data-mode', mode);
  if (mode === 'senior' && font === 'lg') root.setAttribute('data-font', 'lg');

  // 밝기: 자동이면 오전 7시~오후 7시는 밝게, 나머지는 어둡게
  if (theme !== 'light' && theme !== 'dark') theme = 'auto';
  var hour = new Date().getHours();
  var resolved = theme === 'auto' ? (hour >= 7 && hour < 19 ? 'light' : 'dark') : theme;
  root.setAttribute('data-theme-pref', theme);
  root.setAttribute('data-theme', resolved);

  // 첫 화면: 이미 고른 적이 있으면 바로 운동 화면으로
  if (root.getAttribute('data-page') === 'select' && root.hasAttribute('data-mode') && !/[?&]select=1/.test(location.search)) {
    location.replace('routine.html');
  }
})();
