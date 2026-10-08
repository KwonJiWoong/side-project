(() => {
  'use strict';

  /* 기본 요소 */
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const PANELS = ['water', 'guide', 'month'];
  const SIZE_LABELS = ['보통', '크게', '아주 크게'];
  const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

  const el = {
    today: $('todayText'),
    summary: $('waterSummary'),
    empty: $('myEmpty'),
    myList: $('myList'),
    picker: document.querySelector('.picker'),
    notice: $('notice'),
    filterStatus: $('filterStatus'),
    monthLabel: $('monthLabel'),
    monthList: $('monthList'),
    thisMonth: $('thisMonth'),
    sizeText: $('sizeText'),
    contrast: $('contrastBtn')
  };

  /* 아이콘 (HTML 상단 아이콘 모음 사용) */
  const ico = (name) => '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>';

  /* 저장소 (사용 불가 환경 대비) */
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* 무시 */ } }
  };

  /* 식물 데이터: 안내 카드(HTML)에서 읽어 옴 */
  const PLANTS = {};
  document.querySelectorAll('.guide-card').forEach((card) => {
    const id = card.dataset.id;
    PLANTS[id] = {
      id,
      name: card.dataset.name,
      type: card.dataset.type,
      interval: Number(card.dataset.interval),
      img: 'images/' + id + '.svg'
    };
  });

  /* 이달의 할 일 데이터 */
  const T = (title, desc) => ({ title, desc });
  const MONTHS = [
    [T('창가 냉기 조심', '밤에는 화분을 창문에서 한 뼘 떨어뜨려 주세요.'), T('물은 따뜻한 낮에', '차가운 물 대신 실온에 둔 물을 낮에 주세요.'), T('물 주기 간격 늘리기', '겨울엔 흙이 천천히 말라요. 평소보다 드물게 주세요.')],
    [T('씨앗과 흙 준비', '봄에 심을 씨앗, 흙, 화분을 미리 챙겨 두세요.'), T('대파 뿌리 심기', '사 온 대파 뿌리를 화분에 꽂아 두면 다시 자라요.'), T('맑은 날 환기', '햇빛 좋은 낮에 잠깐 창문을 열어 바람을 쐬어 주세요.')],
    [T('흙 뒤집기', '묵은 흙을 뒤집고 퇴비를 섞어 새 흙을 만들어요.'), T('분갈이하기', '실내 식물 화분이 작아졌다면 한 치수 큰 화분으로 옮겨요.'), T('상추 씨앗 뿌리기', '하순부터 상추 씨앗을 뿌릴 수 있어요.')],
    [T('상추·깻잎 심기', '날이 풀리면 상추와 깻잎을 심기 좋아요.'), T('바질 씨앗 뿌리기', '따뜻한 창가에서 바질 씨앗을 틔워 보세요.'), T('모종 준비', '하순에 방울토마토 모종을 미리 알아봐요.')],
    [T('고추·토마토 모종 심기', '서리가 끝나는 5월 초가 가장 좋아요.'), T('지지대 세우기', '모종을 심을 때 지지대도 함께 꽂아 주세요.'), T('상추 첫 수확', '바깥 잎부터 한 장씩 따 드세요.')],
    [T('토마토 곁순 따기', '잎과 줄기 사이 곁순을 손으로 따 주세요.'), T('장마 준비', '화분 밑 구멍이 막히지 않았는지 확인해요.'), T('물은 아침에', '해가 뜨거워지기 전 아침에 주는 게 좋아요.')],
    [T('한낮 물 주기 피하기', '아침이나 해 질 무렵에 물을 주세요.'), T('장마철 과습 주의', '비가 계속되면 흙이 마를 때까지 기다려요.'), T('깻잎 순 자르기', '맨 윗순을 잘라 주면 잎이 더 많이 나요.')],
    [T('강한 햇빛 가리기', '잎이 타지 않게 한낮에는 발이나 천으로 가려 주세요.'), T('토마토·고추 수확', '빨갛게 익은 것부터 부지런히 따 주세요.'), T('가을 상추 준비', '하순에 가을 상추 씨앗을 준비해요.')],
    [T('가을 상추 심기', '선선해지면 상추를 다시 심기 좋아요.'), T('고추 마지막 수확', '찬 바람 불기 전에 남은 고추를 따 주세요.'), T('영양제 마무리', '실내 식물 영양제는 이달까지만 주세요.')],
    [T('추위 약한 식물 들이기', '바질처럼 추위에 약한 식물은 실내로 옮겨요.'), T('가을 상추 수확', '잎이 손바닥만 해지면 따 드세요.'), T('물 주기 조금씩 줄이기', '날이 서늘해지면 흙이 늦게 말라요.')],
    [T('텃밭 정리', '다 자란 포기와 마른 잎을 치워 주세요.'), T('화분 실내로', '베란다가 추워지면 화분을 거실 쪽으로 옮겨요.'), T('물 주기 줄이기', '겉흙이 충분히 마른 뒤에 주세요.')],
    [T('잎에 물 뿌리기', '난방으로 건조하면 실내 식물 잎에 물을 살짝 뿌려요.'), T('실온 물 주기', '받아 둔 물을 하루 두었다가 주세요.'), T('내년 계획 세우기', '내년에 키우고 싶은 식물을 적어 보세요.')]
  ];

  /* 날짜 도우미 */
  const pad = (n) => String(n).padStart(2, '0');
  const toKey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (key, n) => { const d = parse(key); d.setDate(d.getDate() + n); return toKey(d); };
  const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / 86400000);
  const fmt = (key) => { const d = parse(key); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + DAY_NAMES[d.getDay()] + '요일'; };
  const fmtShort = (key) => { const d = parse(key); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일'; };
  const ago = (n) => (n === 0 ? '오늘' : n === 1 ? '어제' : n + '일 전');
  const intervalText = (n) => {
    if (n === 1) return '매일';
    if (n === 30) return '한 달에 한 번';
    if (n >= 14 && n % 7 === 0) return (n / 7) + '주마다';
    return n + '일마다';
  };
  const today = () => toKey(new Date());

  /* 상태 */
  const state = { mine: [], month: new Date().getMonth(), size: 0, confirm: null, edit: null };

  function load() {
    try {
      const data = JSON.parse(store.get('garden-mine'));
      if (Array.isArray(data)) state.mine = data.filter((p) => PLANTS[p.id] && Array.isArray(p.history));
    } catch (e) { state.mine = []; }
  }
  function save() { store.set('garden-mine', JSON.stringify(state.mine)); }
  const findMine = (id) => state.mine.find((p) => p.id === id);

  /* 알림 */
  let noticeTimer = null;
  function say(message) {
    clearTimeout(noticeTimer);
    el.notice.textContent = '';
    window.requestAnimationFrame(() => { el.notice.textContent = message; });
    noticeTimer = setTimeout(() => { el.notice.textContent = ''; }, 5000);
  }

  /* 글자 크기 · 고대비 */
  function setSize(level) {
    state.size = Math.max(0, Math.min(2, level));
    if (state.size) root.setAttribute('data-size', String(state.size));
    else root.removeAttribute('data-size');
    el.sizeText.textContent = SIZE_LABELS[state.size];
    $('fontDown').disabled = state.size === 0;
    $('fontUp').disabled = state.size === 2;
    store.set('garden-size', String(state.size));
  }
  function setContrast(on) {
    if (on) root.setAttribute('data-contrast', 'high');
    else root.removeAttribute('data-contrast');
    el.contrast.setAttribute('aria-pressed', String(on));
    store.set('garden-contrast', on ? '1' : '0');
  }
  $('fontDown').addEventListener('click', () => { setSize(state.size - 1); say('글자 크기: ' + SIZE_LABELS[state.size]); });
  $('fontUp').addEventListener('click', () => { setSize(state.size + 1); say('글자 크기: ' + SIZE_LABELS[state.size]); });
  el.contrast.addEventListener('click', () => {
    const on = el.contrast.getAttribute('aria-pressed') !== 'true';
    setContrast(on);
    say(on ? '고대비 보기를 켰어요.' : '고대비 보기를 껐어요.');
  });

  setSize(Number(store.get('garden-size')) || 0);
  setContrast(store.get('garden-contrast') === '1');

  /* 텃밭 기능이 없는 페이지는 여기까지 */
  if (!el.myList) return;

  /* 물 주기 상태 계산 */
  function getStatus(item) {
    const plant = PLANTS[item.id];
    const t = today();
    const last = item.history[0];
    if (!last) return { type: 'none', text: '아직 물 준 기록이 없어요', due: false };
    const next = addDays(last, plant.interval);
    const d = diffDays(next, t);
    if (last === t) return { type: 'ok', text: '오늘 물 줬어요', next, due: false };
    if (d < 0) return { type: 'due', text: '물 줄 날이 ' + (-d) + '일 지났어요', next, due: true };
    if (d === 0) return { type: 'due', text: '오늘 물 주세요', next, due: true };
    if (d === 1) return { type: 'ok', text: '내일 주면 돼요', next, due: false };
    return { type: 'ok', text: d + '일 뒤에 주면 돼요', next, due: false };
  }

  /* 최근 7일 기록 */
  function weekHtml(item) {
    const t = today();
    let html = '';
    for (let i = 6; i >= 0; i--) {
      const key = addDays(t, -i);
      const done = item.history.includes(key);
      const d = parse(key);
      html += '<li class="week__day' + (i === 0 ? ' week__day--today' : '') + '">' +
        '<span aria-hidden="true">' + DAY_NAMES[d.getDay()] + '</span>' +
        '<span class="week__mark' + (done ? '' : ' week__mark--empty') + '" aria-hidden="true">' +
        (done ? ico('drop') : '') + '</span>' +
        '<span class="sr-only">' + fmtShort(key) + (i === 0 ? '(오늘)' : '') + ' ' + (done ? '물 줌' : '안 줌') + '</span></li>';
    }
    return html;
  }

  /* 내 식물 카드 */
  function cardHtml(item) {
    const p = PLANTS[item.id];
    const s = getStatus(item);
    const t = today();
    const last = item.history[0];
    const icon = s.type === 'ok' ? ico('check-circle') : ico('drop');
    const nextText = !s.next ? '기록 후 알려 드려요'
      : s.next <= t && last !== t ? '오늘' : fmtShort(s.next);
    const wateredToday = last === t;
    const id = p.id;
    const editOpen = state.edit === id;
    const confirmOpen = state.confirm === id;

    return '<li><article class="plant-card' + (s.due ? ' plant-card--due' : '') + '" aria-labelledby="my-' + id + '">' +
      '<header class="plant-card__head">' +
        '<img class="plant-card__img" src="' + p.img + '" alt="" width="120" height="120">' +
        '<hgroup><h3 class="plant-card__name" id="my-' + id + '">' + p.name + '</h3>' +
        '<p class="status status--' + s.type + '">' + icon + s.text + '</p></hgroup>' +
      '</header>' +
      '<dl class="plant-card__info">' +
        '<dt class="plant-card__label">마지막 물 준 날</dt><dd class="plant-card__value">' + (last ? fmtShort(last) + ' (' + ago(diffDays(t, last)) + ')' : '없음') + '</dd>' +
        '<dt class="plant-card__label">다음에 줄 날</dt><dd class="plant-card__value">' + nextText + '</dd>' +
        '<dt class="plant-card__label">물 주는 간격</dt><dd class="plant-card__value">' + intervalText(p.interval) + '</dd>' +
      '</dl>' +
      '<section aria-labelledby="week-' + id + '"><h4 class="week__title" id="week-' + id + '">최근 7일 물 준 날</h4>' +
        '<ol class="week">' + weekHtml(item) + '</ol>' +
        '<p class="week__legend" aria-hidden="true">' + ico('drop') + ' 물 준 날 · 굵은 테두리는 오늘</p></section>' +
      '<div class="plant-card__actions">' +
        (wateredToday
          ? '<button type="button" class="btn btn--block" data-act="undo" data-id="' + id + '">' + ico('undo') + ' 오늘 준 기록 지우기</button>'
          : '<button type="button" class="btn btn--primary btn--block" data-act="water" data-id="' + id + '">' + ico('drop') + ' 오늘 물 줬어요</button>') +
        '<div class="plant-card__sub">' +
          '<button type="button" class="btn" data-act="edit" data-id="' + id + '" aria-expanded="' + editOpen + '" aria-controls="form-' + id + '">' + ico('calendar') + ' 날짜 고르기</button>' +
          '<button type="button" class="btn btn--danger" data-act="remove" data-id="' + id + '" aria-expanded="' + confirmOpen + '" aria-controls="confirm-' + id + '">' + ico('trash') + ' 목록에서 빼기</button>' +
        '</div>' +
        '<form class="date-form" id="form-' + id + '" data-id="' + id + '" novalidate' + (editOpen ? '' : ' hidden') + '>' +
          '<label class="date-form__label" for="date-' + id + '">물 준 날짜를 골라 주세요</label>' +
          '<input class="date-form__input" type="date" id="date-' + id + '" max="' + t + '" value="' + t + '" aria-describedby="err-' + id + '">' +
          '<p class="date-form__error" id="err-' + id + '"></p>' +
          '<button type="submit" class="btn btn--primary btn--block">' + ico('check') + ' 이 날짜로 기록하기</button>' +
        '</form>' +
        '<div class="confirm" id="confirm-' + id + '" role="group" aria-labelledby="confirm-text-' + id + '"' + (confirmOpen ? '' : ' hidden') + '>' +
          '<p class="confirm__text" id="confirm-text-' + id + '">' + p.name + '을(를) 목록에서 뺄까요? 물 준 기록도 함께 지워져요.</p>' +
          '<div class="confirm__btns">' +
            '<button type="button" class="btn btn--danger" data-act="remove-yes" data-id="' + id + '">' + ico('trash') + ' 네, 뺄게요</button>' +
            '<button type="button" class="btn" data-act="remove-no" data-id="' + id + '">' + ico('close') + ' 아니요</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</article></li>';
  }

  /* 오늘 요약 */
  function renderSummary() {
    if (!state.mine.length) { el.summary.innerHTML = ''; return; }
    const due = state.mine.filter((item) => getStatus(item).due).map((item) => PLANTS[item.id].name);
    el.summary.classList.toggle('summary--due', due.length > 0);
    el.summary.innerHTML = due.length
      ? ico('drop') + ' 오늘 물 줄 식물이 ' + due.length + '개 있어요: ' + due.join(', ')
      : ico('check-circle') + ' 오늘은 물 줄 식물이 없어요.';
  }

  /* 식물 고르기 버튼 · 안내 카드 추가 버튼 */
  function renderPicker() {
    el.picker.querySelectorAll('.picker__list').forEach((list) => {
      list.innerHTML = Object.values(PLANTS).filter((p) => p.type === list.dataset.group).map((p) =>
        '<li><button type="button" class="btn btn--toggle picker__btn" data-pick="' + p.id + '" aria-pressed="false">' +
        '<img class="picker__img" src="' + p.img + '" alt="" width="40" height="40"> ' + p.name + '</button></li>'
      ).join('');
    });
  }
  function syncPressed() {
    document.querySelectorAll('[data-pick], [data-add]').forEach((btn) => {
      const id = btn.dataset.pick || btn.dataset.add;
      const on = Boolean(findMine(id));
      btn.setAttribute('aria-pressed', String(on));
      if (btn.dataset.add) btn.innerHTML = on ? ico('check') + ' 내 식물에 있어요' : ico('plus') + ' 내 식물에 추가';
    });
  }

  function render(focusSel) {
    el.today.textContent = fmt(today());
    el.myList.innerHTML = state.mine.map(cardHtml).join('');
    el.empty.hidden = state.mine.length > 0;
    renderSummary();
    syncPressed();
    if (focusSel) {
      const target = document.querySelector(focusSel);
      if (target) target.focus();
    }
  }

  /* 내 식물 추가 / 빼기 */
  function addPlant(id) {
    state.mine.push({ id, history: [] });
    save();
    render();
    say(PLANTS[id].name + '을(를) 내 식물에 넣었어요. 물 주기 확인에서 볼 수 있어요.');
  }
  function removePlant(id, focusSel) {
    state.mine = state.mine.filter((p) => p.id !== id);
    state.confirm = null;
    if (state.edit === id) state.edit = null;
    save();
    render(focusSel);
    say(PLANTS[id].name + '을(를) 목록에서 뺐어요.');
  }
  function togglePlant(id, fromGuide) {
    const item = findMine(id);
    if (!item) { addPlant(id); return; }
    if (!item.history.length) {
      removePlant(id, fromGuide ? '[data-add="' + id + '"]' : '[data-pick="' + id + '"]');
      return;
    }
    // 기록이 있으면 확인 단계를 거침
    state.confirm = id;
    if (fromGuide) showPanel('water', false);
    render('[data-act="remove-yes"][data-id="' + id + '"]');
  }

  /* 물 기록 */
  function addRecord(id, key) {
    const item = findMine(id);
    if (!item.history.includes(key)) item.history.push(key);
    item.history.sort().reverse();
    item.history = item.history.slice(0, 60);
    save();
  }

  /* 카드 버튼 동작 */
  el.myList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const name = PLANTS[id].name;
    const t = today();

    switch (btn.dataset.act) {
      case 'water':
        addRecord(id, t);
        render('[data-act="undo"][data-id="' + id + '"]');
        say(name + '에 물 준 기록을 남겼어요.');
        break;
      case 'undo': {
        const item = findMine(id);
        item.history = item.history.filter((k) => k !== t);
        save();
        render('[data-act="water"][data-id="' + id + '"]');
        say(name + '의 오늘 기록을 지웠어요.');
        break;
      }
      case 'edit':
        state.edit = state.edit === id ? null : id;
        state.confirm = null;
        render(state.edit ? '#date-' + id : '[data-act="edit"][data-id="' + id + '"]');
        break;
      case 'remove':
        state.confirm = state.confirm === id ? null : id;
        state.edit = null;
        render(state.confirm ? '[data-act="remove-no"][data-id="' + id + '"]' : '[data-act="remove"][data-id="' + id + '"]');
        break;
      case 'remove-yes':
        removePlant(id, '#pickerTitle');
        break;
      case 'remove-no':
        state.confirm = null;
        render('[data-act="remove"][data-id="' + id + '"]');
        break;
      default:
        break;
    }
  });

  /* 날짜 고르기 폼 */
  el.myList.addEventListener('submit', (e) => {
    const form = e.target.closest('.date-form');
    if (!form) return;
    e.preventDefault();
    const id = form.dataset.id;
    const input = form.querySelector('.date-form__input');
    const error = form.querySelector('.date-form__error');
    const value = input.value;
    let message = '';
    if (!value) message = '날짜가 비어 있어요. 달력 버튼을 눌러 물 준 날을 골라 주세요.';
    else if (value > today()) message = '오늘 이후 날짜는 기록할 수 없어요. 오늘이나 지난 날짜를 골라 주세요.';

    if (message) {
      error.textContent = message;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    addRecord(id, value);
    state.edit = null;
    render('[data-act="edit"][data-id="' + id + '"]');
    say(PLANTS[id].name + ' · ' + fmtShort(value) + ' 물 준 기록을 남겼어요.');
  });

  /* 식물 고르기 · 안내 카드 추가 */
  el.picker.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pick]');
    if (btn) togglePlant(btn.dataset.pick, false);
  });
  document.querySelectorAll('[data-add]').forEach((btn) => {
    btn.hidden = false;
    btn.addEventListener('click', () => togglePlant(btn.dataset.add, true));
  });

  /* 종류 필터 */
  const TYPE_LABELS = { all: '전체', veg: '채소', herb: '허브', indoor: '실내 식물' };
  document.querySelectorAll('.filter__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.filter;
      document.querySelectorAll('.filter__btn').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      let count = 0;
      document.querySelectorAll('.guide-list__item').forEach((li) => {
        const show = type === 'all' || li.dataset.type === type;
        li.hidden = !show;
        if (show) count++;
      });
      el.filterStatus.textContent = TYPE_LABELS[type] + ' ' + count + '가지를 보여 드려요.';
    });
  });

  /* 이달의 할 일 */
  function renderMonth() {
    const now = new Date().getMonth();
    el.monthLabel.textContent = (state.month + 1) + '월' + (state.month === now ? ' (이번 달)' : '');
    el.monthList.innerHTML = MONTHS[state.month].map((item) =>
      '<li class="todo__item"><p class="todo__text"><strong class="todo__title">' + item.title + '</strong>' + item.desc + '</p></li>'
    ).join('');
    el.thisMonth.hidden = state.month === now;
  }
  $('prevMonth').addEventListener('click', () => { state.month = (state.month + 11) % 12; renderMonth(); });
  $('nextMonth').addEventListener('click', () => { state.month = (state.month + 1) % 12; renderMonth(); });
  el.thisMonth.addEventListener('click', () => {
    state.month = new Date().getMonth();
    renderMonth();
    $('prevMonth').focus();
  });

  /* 화면(메뉴) 전환: 한 화면에 한 가지 목적 */
  function panelFromHash() {
    const hash = location.hash.slice(1);
    if (PANELS.includes(hash)) return { panel: hash };
    if (hash.startsWith('plant-') && $(hash)) return { panel: 'guide', target: hash };
    return { panel: 'water' };
  }
  function showPanel(id, focus) {
    PANELS.forEach((p) => { $(p).hidden = p !== id; });
    document.querySelectorAll('.gnb__link').forEach((a) => {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (focus) {
      window.scrollTo(0, 0);
      $(id + 'Title').focus({ preventScroll: true });
    }
  }
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    if (!PANELS.includes(id)) return;
    e.preventDefault();
    if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    showPanel(id, true);
  });
  window.addEventListener('popstate', () => {
    const r = panelFromHash();
    showPanel(r.panel, true);
  });

  /* 시작 */
  load();
  renderPicker();
  render();
  renderMonth();
  const start = panelFromHash();
  showPanel(start.panel, false);
  if (start.target) $(start.target).scrollIntoView();
})();
