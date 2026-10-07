(() => {
  'use strict';

  /* 음식 종류 */
  const KINDS = { all: '전부', ko: '한식', cn: '중식', jp: '일식', we: '양식' };

  /* 메뉴 데이터 */
  const M = (kind, name, emoji, desc, time, feel) => ({ kind, name, emoji, desc, time, feel });
  const MEALS = {
    breakfast: {
      label: '아침',
      items: [
        M('ko', '누룽지', '🍚', '구수한 누룽지를 푹 끓여 속을 편안하게 시작해요.', '약 15분', '가볍게'),
        M('ko', '계란찜과 밥', '🥚', '부드러운 계란찜에 따뜻한 밥 한 공기면 든든해요.', '약 15분', '든든하게'),
        M('ko', '야채죽', '🥣', '잘게 썬 채소를 넣어 끓인 죽으로 아침 속이 편안해요.', '약 30분', '가볍게'),
        M('ko', '된장국 백반', '🍲', '구수한 된장국에 밥과 나물 반찬을 곁들여요.', '약 25분', '든든하게'),
        M('ko', '소고기미역국', '🍲', '부드러운 소고기와 미역으로 몸이 따뜻해져요.', '약 30분', '따뜻하게'),
        M('ko', '김치콩나물국', '🥬', '칼칼하고 시원한 국물로 아침 입맛을 깨워요.', '약 20분', '따뜻하게'),
        M('ko', '황태해장국', '🐟', '구수한 황태 국물이 속을 부드럽게 풀어 줘요.', '약 25분', '따뜻하게'),
        M('ko', '호박죽', '🎃', '달큰한 단호박을 곱게 갈아 부드럽게 넘어가요.', '약 30분', '가볍게'),
        M('cn', '흰죽과 짜사이', '🥣', '담백한 흰죽에 짭짤한 짜사이를 곁들여요.', '약 30분', '가볍게'),
        M('cn', '토마토 달걀볶음', '🍅', '새콤한 토마토와 부드러운 달걀을 함께 볶아요.', '약 10분', '가볍게'),
        M('cn', '찐만두', '🥟', '김이 모락모락 나는 만두를 간장에 콕 찍어 드세요.', '약 15분', '든든하게'),
        M('jp', '연어구이 정식', '🐟', '노릇한 연어구이에 밥과 미소국을 곁들여요.', '약 20분', '든든하게'),
        M('jp', '달걀말이와 미소국', '🍳', '폭신한 달걀말이와 따뜻한 미소국이 잘 어울려요.', '약 15분', '가볍게'),
        M('jp', '오차즈케', '🍵', '밥에 따뜻한 녹차를 부어 술술 넘어가요.', '약 10분', '가볍게'),
        M('we', '토스트와 과일', '🍞', '노릇하게 구운 식빵에 제철 과일을 곁들여요.', '약 10분', '가볍게'),
        M('we', '오트밀', '🥣', '우유에 귀리를 끓여 부드럽고 속이 편해요.', '약 10분', '가볍게'),
        M('we', '스크램블 에그와 빵', '🍳', '부드럽게 익힌 달걀을 빵에 올려 드세요.', '약 10분', '든든하게'),
        M('we', '양송이 수프', '🍄', '고소한 양송이 수프에 빵을 찍어 드세요.', '약 20분', '따뜻하게')
      ]
    },
    lunch: {
      label: '점심',
      items: [
        M('ko', '잔치국수', '🍜', '멸치 육수에 만 국수로 속이 편안한 한 끼예요.', '약 25분', '가볍게'),
        M('ko', '비빔밥', '🥗', '여러 가지 나물을 골고루 넣어 영양이 가득해요.', '약 20분', '든든하게'),
        M('ko', '칼국수', '🍜', '쫄깃한 면과 뜨끈한 국물이 잘 어울려요.', '약 35분', '따뜻하게'),
        M('ko', '콩나물국밥', '🍲', '시원한 콩나물 국물에 밥을 말아 든든해요.', '약 20분', '따뜻하게'),
        M('ko', '김치찌개', '🍲', '잘 익은 김치로 끓인 집밥의 대표 메뉴예요.', '약 30분', '든든하게'),
        M('ko', '김밥과 어묵국', '🍙', '한 입 크기 김밥에 따뜻한 어묵국을 곁들여요.', '약 30분', '가볍게'),
        M('ko', '된장찌개 백반', '🍲', '구수한 된장찌개에 채소 반찬을 곁들여요.', '약 25분', '든든하게'),
        M('ko', '냉면', '🍜', '새콤하고 시원한 육수로 입맛을 되살려요.', '약 20분', '시원하게'),
        M('ko', '수제비', '🥣', '손으로 뜯은 반죽을 멸치 육수에 끓여요.', '약 35분', '따뜻하게'),
        M('cn', '짜장면', '🍜', '달콤 짭짤한 춘장 소스로 누구나 좋아해요.', '약 30분', '든든하게'),
        M('cn', '짬뽕', '🌶️', '해물이 듬뿍 들어간 얼큰한 국물 요리예요.', '약 35분', '따뜻하게'),
        M('cn', '볶음밥', '🍛', '달걀과 채소를 넣어 고슬고슬하게 볶아요.', '약 15분', '든든하게'),
        M('cn', '울면', '🍜', '걸쭉하고 순한 국물로 맵지 않아 편안해요.', '약 30분', '따뜻하게'),
        M('jp', '우동', '🍜', '통통한 면발과 맑은 국물이 속을 달래 줘요.', '약 15분', '따뜻하게'),
        M('jp', '돈가스', '🍱', '바삭하게 튀긴 돈가스에 양배추를 곁들여요.', '약 30분', '든든하게'),
        M('jp', '메밀소바', '🍜', '시원한 쯔유에 메밀면을 적셔 드세요.', '약 15분', '시원하게'),
        M('jp', '규동', '🍚', '달큰하게 조린 소고기를 밥 위에 올려요.', '약 20분', '든든하게'),
        M('we', '토마토 스파게티', '🍝', '새콤한 토마토 소스로 가볍게 즐겨요.', '약 20분', '가볍게'),
        M('we', '크림 파스타', '🍝', '부드럽고 고소한 크림 소스가 잘 어울려요.', '약 20분', '든든하게'),
        M('we', '오므라이스', '🍳', '폭신한 달걀로 볶음밥을 감싸 소스를 뿌려요.', '약 25분', '든든하게'),
        M('we', '샌드위치와 수프', '🥪', '채소 듬뿍 샌드위치에 따뜻한 수프를 곁들여요.', '약 15분', '가볍게')
      ]
    },
    dinner: {
      label: '저녁',
      items: [
        M('ko', '생선구이 정식', '🐟', '노릇하게 구운 생선에 밥과 국을 함께 차려요.', '약 25분', '가볍게'),
        M('ko', '갈비찜', '🍖', '부드럽게 푹 익힌 갈비로 정성 가득한 저녁이에요.', '약 90분', '든든하게'),
        M('ko', '순두부찌개', '🍲', '보들보들한 순두부를 뜨끈하게 끓여 드세요.', '약 20분', '따뜻하게'),
        M('ko', '삼계탕', '🍗', '닭 한 마리를 푹 고아 기력을 채워 줘요.', '약 60분', '따뜻하게'),
        M('ko', '제육볶음', '🥘', '매콤달콤한 양념으로 밥 한 공기가 뚝딱이에요.', '약 25분', '든든하게'),
        M('ko', '소고기무국', '🍲', '시원한 무와 소고기로 맑고 깊은 국물을 내요.', '약 40분', '따뜻하게'),
        M('ko', '두부김치', '🥬', '따뜻한 두부에 볶은 김치를 올려 가볍게 드세요.', '약 20분', '가볍게'),
        M('ko', '잡채밥', '🍝', '쫄깃한 당면과 채소를 밥 위에 올려 드세요.', '약 40분', '든든하게'),
        M('ko', '고등어조림', '🐟', '무와 함께 칼칼하게 조려 밥반찬으로 최고예요.', '약 35분', '든든하게'),
        M('ko', '불고기', '🥩', '달콤한 간장 양념 소고기로 온 가족이 좋아해요.', '약 30분', '든든하게'),
        M('cn', '탕수육', '🍖', '바삭한 튀김에 새콤달콤한 소스를 곁들여요.', '약 40분', '든든하게'),
        M('cn', '마파두부덮밥', '🌶️', '부드러운 두부와 매콤한 소스를 밥에 올려요.', '약 20분', '따뜻하게'),
        M('cn', '팔보채', '🦐', '해산물과 채소를 걸쭉한 소스로 볶아요.', '약 30분', '든든하게'),
        M('cn', '고추잡채와 꽃빵', '🫑', '아삭한 고추잡채를 폭신한 꽃빵에 싸 드세요.', '약 30분', '든든하게'),
        M('jp', '샤부샤부', '🍲', '맑은 육수에 고기와 채소를 살짝 데쳐 드세요.', '약 30분', '따뜻하게'),
        M('jp', '연어덮밥', '🍣', '신선한 연어를 밥 위에 올려 간장에 곁들여요.', '약 15분', '가볍게'),
        M('jp', '스키야키', '🥘', '달큰한 간장 국물에 소고기와 채소를 익혀요.', '약 30분', '든든하게'),
        M('jp', '튀김 정식', '🍤', '바삭한 새우·채소 튀김에 밥과 국을 곁들여요.', '약 35분', '든든하게'),
        M('we', '함박스테이크', '🍔', '부드러운 고기 반죽을 구워 소스를 얹어요.', '약 35분', '든든하게'),
        M('we', '비프 스튜', '🍲', '소고기와 채소를 푹 끓여 몸이 따뜻해져요.', '약 90분', '따뜻하게'),
        M('we', '연어 스테이크', '🐟', '노릇하게 구운 연어에 구운 채소를 곁들여요.', '약 25분', '가볍게'),
        M('we', '치킨 크림 리조또', '🍚', '닭고기와 크림으로 부드럽게 끓인 쌀 요리예요.', '약 30분', '든든하게')
      ]
    }
  };

  const SIZE_LABELS = ['보통', '크게', '아주 크게'];

  /* 요소 */
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const el = {
    title: $('siteTitle'), home: $('homeBtn'),
    fontDown: $('fontDown'), fontUp: $('fontUp'), sizeText: $('sizeText'), contrast: $('contrastBtn'),
    mealBtns: document.querySelectorAll('.meal-btn'),
    kindBtns: document.querySelectorAll('.kind-btn'),
    meal: $('cardMeal'), emoji: $('cardEmoji'), name: $('cardName'), desc: $('cardDesc'),
    kind: $('cardKind'), time: $('cardTime'), feel: $('cardFeel'), link: $('recipeLink'),
    next: $('nextBtn'), notice: $('notice'), details: $('allDetails'),
    list: $('menuList'), count: $('menuCount')
  };

  const state = { meal: 'lunch', kind: 'all', index: 0, size: 0, queues: {} };

  /* 저장소 (사용 불가 환경 대비) */
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* 무시 */ } }
  };

  /* 안내 메시지 */
  function say(message) { el.notice.textContent = message ? '✓ ' + message : ''; }

  /* 시간대에 맞는 끼니 */
  function defaultMeal() {
    const h = new Date().getHours();
    if (h >= 5 && h < 10) return 'breakfast';
    if (h >= 10 && h < 15) return 'lunch';
    return 'dinner';
  }

  /* 현재 끼니·종류에 맞는 메뉴 목록 */
  function currentItems() {
    const items = MEALS[state.meal].items;
    return state.kind === 'all' ? items : items.filter((item) => item.kind === state.kind);
  }

  /* 같은 메뉴가 연달아 나오지 않게 섞어서 하나씩 꺼내기 */
  function nextIndex(current) {
    const key = state.meal + '-' + state.kind;
    const total = currentItems().length;
    let idx;
    do {
      if (!state.queues[key] || state.queues[key].length === 0) {
        const arr = Array.from({ length: total }, (_, i) => i);
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        state.queues[key] = arr;
      }
      idx = state.queues[key].pop();
    } while (idx === current && total > 1);
    return idx;
  }

  /* 추천 카드 표시 */
  function showCard() {
    const item = currentItems()[state.index];
    el.meal.textContent = MEALS[state.meal].label + ' · ' + KINDS[item.kind] + ' 추천';
    el.emoji.textContent = item.emoji;
    el.name.textContent = item.name;
    el.desc.textContent = item.desc;
    el.kind.textContent = KINDS[item.kind];
    el.time.textContent = item.time;
    el.feel.textContent = item.feel;
    el.link.href = 'https://search.naver.com/search.naver?query=' + encodeURIComponent(item.name + ' 만드는 법');
    el.list.querySelectorAll('.menu-btn').forEach((btn, i) => {
      if (i === state.index) btn.setAttribute('aria-current', 'true');
      else btn.removeAttribute('aria-current');
    });
  }

  /* 전체 메뉴 목록 만들기 */
  function buildList() {
    const items = currentItems();
    el.list.textContent = '';
    el.count.textContent = '(' + items.length + '가지)';
    items.forEach((item, i) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      const icon = document.createElement('span');
      const text = document.createElement('span');
      btn.type = 'button';
      btn.className = 'menu-btn';
      btn.dataset.index = String(i);
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = item.emoji;
      text.textContent = item.name + (state.kind === 'all' ? ' (' + KINDS[item.kind] + ')' : '');
      btn.append(icon, text);
      li.append(btn);
      el.list.append(li);
    });
  }

  /* 목록·카드 새로 그리기 */
  function refresh(message) {
    el.mealBtns.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.meal === state.meal)));
    el.kindBtns.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.kind === state.kind)));
    buildList();
    state.index = nextIndex(-1);
    showCard();
    say(message);
  }

  /* 끼니 바꾸기 */
  function setMeal(meal, message) {
    state.meal = meal;
    refresh(message === undefined ? MEALS[meal].label + ' 메뉴로 바꿨어요.' : message);
  }

  /* 음식 종류 바꾸기 */
  function setKind(kind) {
    state.kind = kind;
    refresh(kind === 'all' ? '모든 종류의 메뉴를 보여드려요.' : KINDS[kind] + ' 메뉴만 보여드려요.');
  }

  /* 다른 메뉴 추천 */
  function recommend() {
    state.index = nextIndex(state.index);
    showCard();
    say('새 메뉴로 바꿨어요.');
  }

  /* 글자 크기 */
  function setSize(level) {
    state.size = level;
    root.setAttribute('data-size', String(level));
    el.sizeText.textContent = SIZE_LABELS[level];
    store.set('menu-size', String(level));
  }

  /* 고대비 */
  function setContrast(on) {
    if (on) root.setAttribute('data-contrast', 'high');
    else root.removeAttribute('data-contrast');
    el.contrast.setAttribute('aria-pressed', String(on));
    store.set('menu-contrast', on ? '1' : '0');
  }

  /* 이벤트 */
  el.mealBtns.forEach((btn) => btn.addEventListener('click', () => setMeal(btn.dataset.meal)));
  el.kindBtns.forEach((btn) => btn.addEventListener('click', () => setKind(btn.dataset.kind)));
  el.next.addEventListener('click', recommend);

  el.list.addEventListener('click', (e) => {
    const btn = e.target.closest('.menu-btn');
    if (!btn) return;
    state.index = Number(btn.dataset.index);
    showCard();
    say('선택하신 메뉴를 보여드려요.');
    window.scrollTo({ top: 0 });
    el.title.focus();
  });

  el.fontUp.addEventListener('click', () => {
    if (state.size >= SIZE_LABELS.length - 1) return say('가장 큰 글자예요. 더 키울 수 없어요.');
    setSize(state.size + 1);
    say('글자를 키웠어요.');
  });
  el.fontDown.addEventListener('click', () => {
    if (state.size <= 0) return say('가장 작은 글자예요. 더 줄일 수 없어요.');
    setSize(state.size - 1);
    say('글자를 줄였어요.');
  });
  el.contrast.addEventListener('click', () => {
    const on = el.contrast.getAttribute('aria-pressed') !== 'true';
    setContrast(on);
    say(on ? '고대비로 바꿨어요.' : '원래 색으로 돌아왔어요.');
  });

  el.home.addEventListener('click', () => {
    el.details.open = false;
    state.kind = 'all';
    setMeal(defaultMeal(), '처음 화면으로 돌아왔어요.');
    window.scrollTo({ top: 0 });
    el.title.focus();
  });

  /* 시작 */
  const savedSize = Number(store.get('menu-size'));
  setSize(savedSize >= 0 && savedSize < SIZE_LABELS.length ? savedSize : 0);
  setContrast(store.get('menu-contrast') === '1');
  setMeal(defaultMeal(), '');
})();
