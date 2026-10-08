(() => {
  'use strict';

  /* 기본 요소 */
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const SIZE_LABELS = ['보통', '크게', '아주 크게'];
  const DESKTOP = window.matchMedia('(min-width: 1024px)');
  const el = {
    sizeText: $('sizeText'),
    fontDown: $('fontDown'),
    fontUp: $('fontUp'),
    contrast: $('contrastBtn'),
    tocBox: $('tocBox'),
    notice: $('notice')
  };

  /* 저장소 (사용 불가 환경 대비) */
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* 무시 */ } }
  };

  /* 상태 */
  const state = { size: 0 };

  /* 알림 */
  let noticeTimer = null;
  function say(message) {
    clearTimeout(noticeTimer);
    el.notice.textContent = '';
    window.requestAnimationFrame(() => { el.notice.textContent = message; });
    noticeTimer = setTimeout(() => { el.notice.textContent = ''; }, 4000);
  }

  /* 글자 크기 · 고대비 */
  function setSize(level) {
    state.size = Math.max(0, Math.min(2, level));
    if (state.size) root.setAttribute('data-size', String(state.size));
    else root.removeAttribute('data-size');
    el.sizeText.textContent = SIZE_LABELS[state.size];
    el.fontDown.disabled = state.size === 0;
    el.fontUp.disabled = state.size === 2;
    store.set('guide-size', String(state.size));
  }
  function setContrast(isOn) {
    if (isOn) root.setAttribute('data-contrast', 'high');
    else root.removeAttribute('data-contrast');
    el.contrast.setAttribute('aria-pressed', String(isOn));
    store.set('guide-contrast', isOn ? '1' : '0');
  }
  el.fontDown.addEventListener('click', () => { setSize(state.size - 1); say('글자 크기: ' + SIZE_LABELS[state.size]); });
  el.fontUp.addEventListener('click', () => { setSize(state.size + 1); say('글자 크기: ' + SIZE_LABELS[state.size]); });
  el.contrast.addEventListener('click', () => {
    const isOn = el.contrast.getAttribute('aria-pressed') !== 'true';
    setContrast(isOn);
    say(isOn ? '고대비 보기를 켰어요.' : '고대비 보기를 껐어요.');
  });

  /* 목차: PC는 펼침, 모바일은 접힘. 모바일에서 항목을 고르면 닫기 */
  function syncToc() { el.tocBox.open = DESKTOP.matches; }
  DESKTOP.addEventListener('change', syncToc);
  el.tocBox.addEventListener('click', (e) => {
    if (e.target.closest('.toc__link') && !DESKTOP.matches) el.tocBox.open = false;
  });

  /* 목차: 지금 읽는 섹션 표시 */
  const tocLinks = Array.from(document.querySelectorAll('.toc__link'));
  function markCurrent(id) {
    tocLinks.forEach((a) => {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) markCurrent(entry.target.querySelector('.doc__h2').id);
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    document.querySelectorAll('.doc__section').forEach((section) => observer.observe(section));
  }

  /* 체크리스트: 이 기기에 저장 */
  const checks = Array.from(document.querySelectorAll('[data-check]'));
  const checkKey = 'guide-checks-' + (location.pathname.split('/').pop() || 'index.html');
  function loadChecks() {
    let saved = [];
    try { saved = JSON.parse(store.get(checkKey)) || []; } catch (e) { saved = []; }
    if (!Array.isArray(saved)) saved = [];
    checks.forEach((box) => { box.checked = saved.includes(box.dataset.check); });
  }
  function saveChecks() {
    store.set(checkKey, JSON.stringify(checks.filter((box) => box.checked).map((box) => box.dataset.check)));
  }
  checks.forEach((box) => box.addEventListener('change', saveChecks));
  const resetBtn = document.querySelector('[data-reset-checks]');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      checks.forEach((box) => { box.checked = false; });
      saveChecks();
      say('체크를 모두 지웠어요.');
    });
  }

  /* 시작 */
  setSize(Number(store.get('guide-size')) || 0);
  setContrast(store.get('guide-contrast') === '1');
  syncToc();
  loadChecks();
})();
