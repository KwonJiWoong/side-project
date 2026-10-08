// 웹 퍼블리셔 포트폴리오 — 모바일 메뉴 토글 + 라이트/다크 테마 토글
// (테마를 새로고침 후에도 유지하려면 localStorage 저장 로직을 프로젝트에 맞게 추가하세요.)

document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;

  /* ---------- 모바일 메뉴 토글 ---------- */
  const menuBtn = document.querySelector('.nav__menu-btn');
  const navLinks = document.querySelector('.nav__links');

  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    // 메뉴 안의 링크를 클릭하면 자동으로 닫기 (모바일 UX)
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- 라이트 / 다크 테마 토글 ---------- */
  const themeButtons = document.querySelectorAll('[data-theme-btn]');

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    themeButtons.forEach((btn) => {
      const isActive = btn.dataset.themeBtn === theme;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => setTheme(btn.dataset.themeBtn));
  });

  /* ---------- 프로젝트 카루셀 (카드 넘기는 모션, 끝까지 가면 처음으로 무한 반복) ---------- */
  const carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    const viewport = carousel.querySelector('[data-carousel-viewport]');
    const track = carousel.querySelector('[data-carousel-track]');
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');
    const dotsWrap = carousel.querySelector('[data-carousel-dots]');
    const originalSlides = Array.from(track.children);
    const slideCount = originalSlides.length;

    if (track && viewport && slideCount > 1) {
      // 무한 루프를 흉내내기 위해 첫 슬라이드/마지막 슬라이드를 하나씩 복제해 양 끝에 붙인다
      const firstClone = originalSlides[0].cloneNode(true);
      const lastClone = originalSlides[slideCount - 1].cloneNode(true);
      firstClone.setAttribute('aria-hidden', 'true');
      lastClone.setAttribute('aria-hidden', 'true');
      track.appendChild(firstClone);
      track.insertBefore(lastClone, track.firstChild);

      let index = 1; // 1 = 진짜 첫 슬라이드 (0번 자리는 복제된 마지막 슬라이드)
      let isAnimating = false;

      const dots = originalSlides.map((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel__dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', (i + 1) + '번째 프로젝트로 이동');
        dot.addEventListener('click', () => goTo(i + 1));
        if (dotsWrap) dotsWrap.appendChild(dot);
        return dot;
      });

      function updateDots() {
        const realIndex = ((index - 1) + slideCount) % slideCount;
        dots.forEach((dot, i) => {
          const isActive = i === realIndex;
          dot.classList.toggle('is-active', isActive);
          dot.setAttribute('aria-selected', String(isActive));
        });
      }

      function setPosition(withTransition) {
        track.style.transition = withTransition ? '' : 'none';
        track.style.transform = 'translateX(-' + (index * 100) + '%)';
      }

      function goTo(newIndex) {
        if (isAnimating) return;
        isAnimating = true;
        index = newIndex;
        setPosition(true);
        updateDots();
      }

      function next() { goTo(index + 1); }
      function prev() { goTo(index - 1); }

      track.addEventListener('transitionend', () => {
        isAnimating = false;
        // 복제된 끝 슬라이드까지 갔다면, 화면 깜빡임 없이 진짜 슬라이드로 순간 이동
        if (index === slideCount + 1) {
          index = 1;
          setPosition(false);
        } else if (index === 0) {
          index = slideCount;
          setPosition(false);
        }
      });

      if (prevBtn) prevBtn.addEventListener('click', prev);
      if (nextBtn) nextBtn.addEventListener('click', next);

      setPosition(false);
      updateDots();

      // 터치 / 드래그로 좌우로 밀어서 넘기기
      let startX = 0;
      let currentX = 0;
      let isDragging = false;

      function onDragStart(x) {
        if (isAnimating) return;
        isDragging = true;
        startX = x;
        currentX = x;
        track.style.transition = 'none';
      }
      function onDragMove(x) {
        if (!isDragging) return;
        currentX = x;
        const delta = currentX - startX;
        const percent = (delta / viewport.clientWidth) * 100;
        track.style.transform = 'translateX(calc(-' + (index * 100) + '% + ' + percent + '%))';
      }
      function onDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        const delta = currentX - startX;
        const threshold = viewport.clientWidth * 0.15;
        if (delta > threshold) {
          prev();
        } else if (delta < -threshold) {
          next();
        } else {
          setPosition(true);
        }
        startX = 0;
        currentX = 0;
      }

      viewport.addEventListener('pointerdown', (e) => onDragStart(e.clientX));
      viewport.addEventListener('pointermove', (e) => onDragMove(e.clientX));
      viewport.addEventListener('pointerup', onDragEnd);
      viewport.addEventListener('pointercancel', onDragEnd);
      viewport.addEventListener('pointerleave', () => { if (isDragging) onDragEnd(); });

      // 화면 크기가 바뀌면(모바일 회전 등) 애니메이션 없이 위치만 다시 맞춘다
      window.addEventListener('resize', () => setPosition(false));
    }
  }

  /* ---------- 이미지 스켈레톤 로딩 ----------
     <div class="img-frame skeleton"><img data-skeleton ...></div> 형태로 쓰면
     이미지 로딩이 끝나는 순간 자동으로 스켈레톤이 사라집니다. 로딩이 느린 이미지를
     나중에 추가할 때를 대비해 미리 넣어둔 유틸리티입니다. */
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
