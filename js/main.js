// 웹퍼블리셔 포트폴리오 - 보기 설정 / 메뉴 / 현재 위치 표시
(() => {
  'use strict';

  /* 기본 요소 */
  const root = document.documentElement;
  const el = {
    sizeText: document.getElementById('sizeText'),
    fontDown: document.getElementById('fontDown'),
    fontUp: document.getElementById('fontUp'),
    contrast: document.getElementById('contrastBtn'),
    menuBtn: document.getElementById('menuBtn'),
    menuText: document.getElementById('menuText'),
    navList: document.getElementById('navList'),
    navLinks: Array.from(document.querySelectorAll('[data-nav]')),
    copyBtn: document.getElementById('copyEmailBtn'),
    copyStatus: document.getElementById('copyStatus'),
    toTop: document.getElementById('toTopBtn'),
    hero: document.getElementById('hero'),
    footer: document.getElementById('footer')
  };
  const SIZE_LABELS = ['보통', '크게', '아주 크게'];

  /* 저장소 */
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* 무시 */ } }
  };

  /* 상태 */
  const savedSize = Number(store.get('portfolio-size'));
  const state = {
    size: Number.isInteger(savedSize) && savedSize >= 0 && savedSize < SIZE_LABELS.length ? savedSize : 0,
    isContrast: store.get('portfolio-contrast') === 'high',
    isMenuOpen: false,
    current: ''
  };

  /* 그리기 */
  function renderView() {
    if (state.size > 0) root.setAttribute('data-size', String(state.size));
    else root.removeAttribute('data-size');
    el.sizeText.textContent = SIZE_LABELS[state.size];
    el.fontDown.disabled = state.size === 0;
    el.fontUp.disabled = state.size === SIZE_LABELS.length - 1;

    if (state.isContrast) root.setAttribute('data-contrast', 'high');
    else root.removeAttribute('data-contrast');
    el.contrast.setAttribute('aria-pressed', String(state.isContrast));
  }

  function renderMenu() {
    el.menuBtn.setAttribute('aria-expanded', String(state.isMenuOpen));
    el.menuText.textContent = state.isMenuOpen ? '메뉴 닫기' : '메뉴 열기';
  }

  function renderCurrent() {
    el.navLinks.forEach((link) => {
      if (link.dataset.nav === state.current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  /* 이벤트 - 글자 크기 · 고대비 */
  function changeSize(step) {
    const next = state.size + step;
    if (next < 0 || next >= SIZE_LABELS.length) return;
    state.size = next;
    store.set('portfolio-size', String(state.size));
    renderView();
  }

  el.fontDown.addEventListener('click', () => changeSize(-1));
  el.fontUp.addEventListener('click', () => changeSize(1));
  el.contrast.addEventListener('click', () => {
    state.isContrast = !state.isContrast;
    store.set('portfolio-contrast', state.isContrast ? 'high' : 'normal');
    renderView();
  });

  /* 이벤트 - 메뉴 열기/닫기 */
  el.menuBtn.addEventListener('click', () => {
    state.isMenuOpen = !state.isMenuOpen;
    renderMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !state.isMenuOpen) return;
    state.isMenuOpen = false;
    renderMenu();
    el.menuBtn.focus();
  });

  /* 이벤트 - 메뉴로 이동하면 그 섹션 제목으로 포커스 */
  el.navList.addEventListener('click', (e) => {
    const link = e.target.closest('[data-nav]');
    if (!link) return;
    const section = document.getElementById(link.dataset.nav);
    const title = section ? document.getElementById(section.getAttribute('aria-labelledby')) : null;
    if (!title) return;
    e.preventDefault();
    state.isMenuOpen = false;
    state.current = link.dataset.nav;
    renderMenu();
    renderCurrent();
    section.scrollIntoView();
    title.focus({ preventScroll: true });
    history.replaceState(null, '', '#' + link.dataset.nav);
  });

  /* 이벤트 - 스크롤 위치에 따라 현재 메뉴 표시 */
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        state.current = entry.target.id;
        renderCurrent();
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    el.navLinks.forEach((link) => {
      const section = document.getElementById(link.dataset.nav);
      if (section) observer.observe(section);
    });
  }

  /* 이벤트 - 이메일 주소 복사 */
  function copyByTextarea(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.className = 'sr-only';
    document.body.appendChild(area);
    area.select();
    let isCopied = false;
    try { isCopied = document.execCommand('copy'); } catch (e) { isCopied = false; }
    area.remove();
    return isCopied;
  }

  function showCopyResult(isCopied, text) {
    el.copyStatus.textContent = isCopied
      ? '✓ 이메일 주소를 복사했어요. 메일 쓰는 곳에 붙여 넣어 주세요.'
      : '복사하지 못했어요. 위에 보이는 주소 ' + text + '를 직접 적어 주세요.';
  }

  if (el.copyBtn && el.copyStatus) {
    el.copyBtn.addEventListener('click', () => {
      const text = el.copyBtn.dataset.copy;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(() => showCopyResult(true, text))
          .catch(() => showCopyResult(copyByTextarea(text), text));
      } else {
        showCopyResult(copyByTextarea(text), text);
      }
    });
  }

  /* 이벤트 - 맨 위로 버튼: 첫 화면과 푸터가 안 보일 때만 띄움 */
  if (el.toTop && el.hero && el.footer && 'IntersectionObserver' in window) {
    const seen = { hero: true, footer: false };
    const topObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        seen[entry.target.id] = entry.isIntersecting;
      });
      el.toTop.hidden = seen.hero || seen.footer;
    });
    topObserver.observe(el.hero);
    topObserver.observe(el.footer);
  }

  /* 시작 */
  renderView();
  renderMenu();
  renderCurrent();
})();
