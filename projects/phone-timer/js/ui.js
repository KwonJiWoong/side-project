/* 화면 전환 · 주소, 확인 창, 글자 크게 */
(function (GT) {
  'use strict';

  var $ = GT.util.$;
  var store = GT.store;

  /* ===== 화면 전환 ===== */
  var THEME_COLORS = { run: '#0d120d', other: '#f6f3ea' };
  var screens = {
    setup: $('screen-setup'),
    run: $('screen-run'),
    result: $('screen-result'),
    garden: $('screen-garden')
  };
  var headings = {
    setup: $('setup-title'),
    run: $('run-title'),
    result: $('result-title'),
    garden: $('garden-title')
  };
  var metaTheme = document.querySelector('meta[name="theme-color"]');

  // focus=false: 첫 화면처럼 포커스를 옮기지 않을 때
  function show(name, focus) {
    Object.keys(screens).forEach(function (key) { screens[key].hidden = key !== name; });
    document.body.setAttribute('data-screen', name);
    metaTheme.setAttribute('content', name === 'run' ? THEME_COLORS.run : THEME_COLORS.other);

    document.querySelectorAll('[data-nav]').forEach(function (link) {
      if (link.getAttribute('data-nav') === name) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (focus !== false) {
      window.scrollTo(0, 0);
      headings[name].focus({ preventScroll: true });
    }
  }

  // 주소(#timer, #garden)에 맞는 화면 열기
  function route(focus) {
    if (GT.timer.isRunning()) return; // 진행 중에는 화면을 바꾸지 않음
    if (location.hash === '#garden') {
      GT.garden.render();
      show('garden', focus);
    } else {
      GT.setup.render();
      show('setup', focus);
    }
  }

  function go(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  window.addEventListener('hashchange', function () { route(); });

  // 같은 주소를 다시 눌러도 화면이 바뀌도록
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href="#timer"], a[href="#garden"]');
    if (!link) return;
    e.preventDefault();
    go(link.getAttribute('href'));
  });

  /* ===== 확인 창 ===== */
  var confirmBox = $('confirm-dialog');
  var confirmOk = $('confirm-ok');
  var confirmCancel = $('confirm-cancel');
  var confirmOpt = null;

  /**
   * opt: title, desc, ok, cancel, onOk, onCancel,
   *      okPrimary(이어가기처럼 안전한 동작), cancelDanger, required(Esc로 닫기 막기)
   */
  function confirm(opt) {
    confirmOpt = opt;
    $('confirm-title').textContent = opt.title;
    $('confirm-desc').textContent = opt.desc;
    confirmOk.textContent = opt.ok;
    confirmCancel.textContent = opt.cancel;
    confirmOk.className = 'btn btn--lg btn--block ' + (opt.okPrimary ? 'btn--primary' : 'btn--danger-fill');
    confirmCancel.className = 'btn btn--lg btn--block' + (opt.cancelDanger ? ' btn--danger' : '');
    if (!confirmBox.open) confirmBox.showModal();
    (opt.okPrimary ? confirmOk : confirmCancel).focus(); // 되돌릴 수 없는 동작은 기본 포커스를 안전한 쪽에
  }

  // choice: 'ok' | 'cancel' | 없음(고르지 않고 닫기)
  function closeConfirm(choice) {
    var opt = confirmOpt;
    confirmOpt = null;
    if (confirmBox.open) confirmBox.close();
    if (!opt) return;
    if (choice === 'ok' && opt.onOk) opt.onOk();
    if (choice === 'cancel' && opt.onCancel) opt.onCancel();
  }

  confirmOk.addEventListener('click', function () { closeConfirm('ok'); });
  confirmCancel.addEventListener('click', function () { closeConfirm('cancel'); });

  // Esc: 꼭 골라야 하는 창은 닫히지 않게
  confirmBox.addEventListener('cancel', function (e) {
    if (confirmOpt && confirmOpt.required) e.preventDefault();
    else closeConfirm('cancel');
  });

  /* ===== 글자 크게 ===== */
  var fontToggle = $('font-toggle');

  function applyFont() {
    var on = store.settings.font === 'lg';
    if (on) document.documentElement.setAttribute('data-font', 'lg');
    else document.documentElement.removeAttribute('data-font');
    fontToggle.setAttribute('aria-pressed', String(on));
  }

  fontToggle.addEventListener('click', function () {
    store.settings.font = store.settings.font === 'lg' ? '' : 'lg';
    store.saveData();
    applyFont();
  });

  GT.ui = {
    screens: screens,
    headings: headings,
    show: show,
    route: route,
    go: go,
    confirm: confirm,
    closeConfirm: closeConfirm,
    applyFont: applyFont
  };
})(window.GT = window.GT || {});
