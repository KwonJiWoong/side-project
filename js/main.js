// 웹퍼블리셔 포트폴리오 - 메뉴 / 글자 크기 / 어두운 화면 / 현재 위치 표시

document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;

  /* ---------- 저장소 (막혀 있어도 오류 없이 동작) ---------- */
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* 무시 */ } }
  };

  /* ---------- 모바일 메뉴 열기/닫기 ---------- */
  const menuBtn = document.querySelector('.nav__menu-btn');
  const menuText = document.querySelector('.nav__menu-text');
  const navList = document.getElementById('navList');

  function setMenu(open) {
    navList.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuText.textContent = open ? '메뉴 닫기' : '메뉴 열기';
  }

  if (menuBtn && navList) {
    menuBtn.addEventListener('click', () => setMenu(!navList.classList.contains('is-open')));
    navList.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenu(false));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navList.classList.contains('is-open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  /* ---------- 글자 크기 (보통 / 크게 / 아주 크게) ---------- */
  const SIZE_NAMES = ['보통', '크게', '아주 크게'];
  const fontDown = document.getElementById('fontDown');
  const fontUp = document.getElementById('fontUp');
  const sizeText = document.getElementById('sizeText');
  let size = Number(store.get('pf-size')) || 0;

  function applySize() {
    if (size > 0) root.setAttribute('data-size', String(size));
    else root.removeAttribute('data-size');
    sizeText.textContent = SIZE_NAMES[size];
    fontDown.disabled = size === 0;
    fontUp.disabled = size === SIZE_NAMES.length - 1;
    store.set('pf-size', String(size));
  }

  fontDown.addEventListener('click', () => { if (size > 0) { size -= 1; applySize(); } });
  fontUp.addEventListener('click', () => { if (size < SIZE_NAMES.length - 1) { size += 1; applySize(); } });
  applySize();

  /* ---------- 어두운 화면 ---------- */
  const themeBtn = document.getElementById('themeBtn');

  function applyTheme(dark) {
    if (dark) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    themeBtn.setAttribute('aria-pressed', String(dark));
    store.set('pf-theme', dark ? 'dark' : 'light');
  }

  themeBtn.addEventListener('click', () => applyTheme(themeBtn.getAttribute('aria-pressed') !== 'true'));
  applyTheme(store.get('pf-theme') === 'dark');

  /* ---------- 현재 보고 있는 메뉴 표시 ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav__link'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  function setCurrent(id) {
    navLinks.forEach((link) => {
      if (link.getAttribute('href') === '#' + id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setCurrent(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach((section) => observer.observe(section));
  }

  /* ---------- 이미지 스켈레톤 (나중에 이미지 추가 시 사용) ---------- */
  document.querySelectorAll('[data-skeleton]').forEach((img) => {
    const frame = img.closest('.img-frame');
    if (!frame) return;
    if (img.complete && img.naturalWidth > 0) {
      frame.classList.add('is-loaded');
      return;
    }
    img.addEventListener('load', () => frame.classList.add('is-loaded'));
    img.addEventListener('error', () => frame.classList.add('is-error'));
  });
});
