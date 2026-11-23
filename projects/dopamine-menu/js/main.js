(() => {
  'use strict';

  /* 기본 요소 */
  const TIMES = [5, 15, 30];
  const CHANGE_LIMIT = 3;
  const RECENT_SIZE = 3;
  const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];
  const PAGE_TITLE = document.title;
  const KEY = {
    today: 'dopamine-today',
    recent: 'dopamine-recent',
    timer: 'dopamine-timer',
    stamps: 'dopamine-stamps'
  };

  const $ = (id) => document.getElementById(id);
  const el = {
    storageNote: $('storageNote'),
    order: $('order'), orderTitle: $('orderTitle'),
    tabs: Array.from(document.querySelectorAll('[role="tab"]')),
    tablist: document.querySelector('[role="tablist"]'),
    panel: $('orderPanel'), lead: $('orderLead'),
    loadError: $('loadError'), retry: $('retryBtn'),
    ticket: $('ticket'), ticketInner: $('ticketInner'), front: $('ticketFront'), back: $('ticketBack'),
    ticketMeta: $('ticketMeta'), ticketTitle: $('ticketTitle'), ticketDesc: $('ticketDesc'),
    draw: $('drawBtn'), start: $('startBtn'), change: $('changeBtn'), changeLeft: $('changeLeft'), limitNote: $('limitNote'),
    timer: $('timer'), timerTitle: $('timerTitle'), timerHeading: $('timerHeading'),
    timerWhat: $('timerWhat'), timerDesc: $('timerDesc'), timerLeft: $('timerLeft'),
    timerProgress: $('timerProgress'), timerEnd: $('timerEnd'), timerDone: $('timerDone'),
    stamp: $('stampBtn'), quit: $('quitBtn'),
    boardTitle: $('boardTitle'), boardRange: $('boardRange'), boardDays: $('boardDays'),
    boardEmpty: $('boardEmpty'), boardListTitle: $('boardListTitle'), boardTotal: $('boardTotal'), boardList: $('boardList'),
    notice: $('notice')
  };

  /* 저장소 (사용 불가 환경이면 메모리에만 보관) */
  const store = (() => {
    let isOk = true;
    const memory = {};
    try {
      localStorage.setItem('dopamine-test', '1');
      localStorage.removeItem('dopamine-test');
    } catch (e) {
      isOk = false;
    }
    return {
      isOk,
      get(key) {
        if (!isOk) return key in memory ? memory[key] : null;
        try { return localStorage.getItem(key); } catch (e) { return null; }
      },
      set(key, value) {
        if (!isOk) { memory[key] = value; return; }
        try { localStorage.setItem(key, value); } catch (e) { /* 무시 */ }
      },
      remove(key) {
        if (!isOk) { delete memory[key]; return; }
        try { localStorage.removeItem(key); } catch (e) { /* 무시 */ }
      }
    };
  })();

  function readJSON(key) {
    try { return JSON.parse(store.get(key)); } catch (e) { return null; }
  }
  function writeJSON(key, value) { store.set(key, JSON.stringify(value)); }

  /* 도우미 함수 */
  const pad2 = (n) => String(n).padStart(2, '0');
  const toDateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const isObject = (v) => v !== null && typeof v === 'object';

  function getMonday(d) {
    const day = (d.getDay() + 6) % 7; // 월=0 … 일=6
    return addDays(d, -day);
  }

  function formatClock(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
  }

  function formatHour(ms) {
    const d = new Date(ms);
    const h = d.getHours();
    const half = h < 12 ? '오전' : '오후';
    return `${half} ${h % 12 === 0 ? 12 : h % 12}시 ${pad2(d.getMinutes())}분`;
  }

  const formatMonthDay = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일`;
  const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

  /* 상태 */
  const state = {
    status: 'loading',            // loading | ready | error
    activities: [],
    byId: {},
    categories: {},
    time: 5,
    today: null,                  // { date, changesLeft, picks: { 5: id } }
    recent: { 5: [], 15: [], 30: [] },
    timer: null,                  // { id, title, desc, category, time, startAt, duration, isDone }
    stamps: null,                 // { weekStart, items: [] }
    newStampDate: null
  };
  let ticker = null;

  /* 저장값 불러오기 */
  function ensureToday() {
    const key = toDateKey(new Date());
    if (state.today && state.today.date === key) return;
    const saved = readJSON(KEY.today);
    if (isObject(saved) && saved.date === key && isObject(saved.picks)) {
      const left = Number(saved.changesLeft);
      state.today = {
        date: key,
        changesLeft: Number.isInteger(left) ? Math.min(Math.max(left, 0), CHANGE_LIMIT) : CHANGE_LIMIT,
        picks: saved.picks
      };
    } else {
      state.today = { date: key, changesLeft: CHANGE_LIMIT, picks: {} };
      writeJSON(KEY.today, state.today);
    }
  }

  function ensureWeek() {
    const weekStart = toDateKey(getMonday(new Date()));
    if (state.stamps && state.stamps.weekStart === weekStart) return;
    const saved = readJSON(KEY.stamps);
    if (isObject(saved) && saved.weekStart === weekStart && Array.isArray(saved.items)) {
      state.stamps = { weekStart, items: saved.items.filter((it) => isObject(it) && typeof it.title === 'string' && typeof it.date === 'string') };
    } else {
      state.stamps = { weekStart, items: [] };
      writeJSON(KEY.stamps, state.stamps);
    }
  }

  function loadRecent() {
    const saved = readJSON(KEY.recent);
    TIMES.forEach((t) => {
      state.recent[t] = isObject(saved) && Array.isArray(saved[t]) ? saved[t].slice(0, RECENT_SIZE) : [];
    });
  }

  function loadTimer() {
    const saved = readJSON(KEY.timer);
    const isValid = isObject(saved) && typeof saved.title === 'string'
      && Number.isFinite(saved.startAt) && Number.isFinite(saved.duration) && TIMES.includes(saved.time);
    state.timer = isValid ? saved : null;
    if (!isValid) store.remove(KEY.timer);
  }

  /* 데이터 */
  async function loadActivities() {
    state.status = 'loading';
    renderOrder();
    try {
      const res = await fetch('data/activities.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('응답 오류');
      const data = await res.json();
      const items = Array.isArray(data.activities) ? data.activities.filter((a) =>
        isObject(a) && typeof a.id === 'string' && typeof a.title === 'string' && TIMES.includes(a.time)) : [];
      if (!items.length) throw new Error('빈 데이터');
      state.activities = items;
      state.byId = Object.fromEntries(items.map((a) => [a.id, a]));
      state.categories = isObject(data.categories) ? data.categories : {};
      state.status = 'ready';
    } catch (e) {
      state.status = 'error';
    }
    renderOrder();
  }

  const getPool = (time) => state.activities.filter((a) => a.time === time);
  const getPick = (time) => state.byId[state.today.picks[time]] || null;
  const getCategoryLabel = (key) => state.categories[key] || '딴짓';

  function drawActivity(time) {
    const pool = getPool(time);
    const current = state.today.picks[time];
    const recent = state.recent[time];
    let candidates = pool.filter((a) => !recent.includes(a.id) && a.id !== current);
    if (!candidates.length) candidates = pool.filter((a) => a.id !== current);
    if (!candidates.length) candidates = pool;
    const pick = pickRandom(candidates);

    state.today.picks[time] = pick.id;
    state.recent[time] = [pick.id, ...recent.filter((id) => id !== pick.id)].slice(0, RECENT_SIZE);
    writeJSON(KEY.today, state.today);
    writeJSON(KEY.recent, state.recent);
    return pick;
  }

  /* 알림 */
  function say(message) {
    el.notice.textContent = '';
    requestAnimationFrame(() => { el.notice.textContent = message; });
  }

  /* 그리기: 메뉴판 */
  function renderTabs() {
    el.tabs.forEach((tab) => {
      const isSelected = Number(tab.dataset.time) === state.time;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
    });
    el.panel.setAttribute('aria-labelledby', `tab${state.time}`);
  }

  function setFace(isFlipped) {
    el.ticket.dataset.flipped = String(isFlipped);
    el.front.inert = isFlipped;
    el.front.setAttribute('aria-hidden', String(isFlipped));
    el.back.inert = !isFlipped;
    el.back.setAttribute('aria-hidden', String(!isFlipped));
  }

  function fillTicket(pick) {
    el.ticketMeta.textContent = `${getCategoryLabel(pick.category)} · ${pick.time}분`;
    el.ticketTitle.textContent = pick.title;
    el.ticketDesc.textContent = pick.desc || '';
  }

  function renderOrder() {
    renderTabs();
    el.order.hidden = Boolean(state.timer);

    const isReady = state.status === 'ready';
    el.loadError.hidden = state.status !== 'error';
    el.ticket.hidden = state.status === 'error';
    el.lead.hidden = state.status !== 'loading';

    if (!isReady) {
      el.lead.textContent = '메뉴를 불러오고 있어요.';
      setFace(false);
      el.draw.hidden = state.status === 'error';
      el.draw.disabled = true;
      el.start.hidden = true;
      el.change.hidden = true;
      el.limitNote.hidden = true;
      return;
    }

    const pick = getPick(state.time);
    const left = state.today.changesLeft;

    if (pick) fillTicket(pick);
    setFace(Boolean(pick));
    el.draw.hidden = Boolean(pick);
    el.draw.disabled = false;
    el.start.hidden = !pick;
    el.change.hidden = !pick || left === 0;
    el.changeLeft.textContent = String(left);
    el.limitNote.hidden = !pick || left > 0;
  }

  /* 그리기: 타이머 */
  function getRemaining() {
    return state.timer.startAt + state.timer.duration - Date.now();
  }

  function renderClock() {
    const t = state.timer;
    const remaining = t.isDone ? 0 : getRemaining();
    const passed = Math.min(Math.max(1 - remaining / t.duration, 0), 1);
    el.timerLeft.textContent = formatClock(remaining);
    el.timerProgress.value = Math.round(passed * 100);
    el.timerProgress.textContent = `${Math.round(passed * 100)}%`;
    document.title = t.isDone ? `다 했어요! · ${PAGE_TITLE}` : `${formatClock(remaining)} 남음 · ${PAGE_TITLE}`;
  }

  function renderTimer() {
    const t = state.timer;
    el.timer.hidden = !t;
    if (!t) {
      document.title = PAGE_TITLE;
      syncTicker();
      return;
    }
    el.timerWhat.textContent = t.title;
    el.timerDesc.textContent = t.desc || '';
    el.timerHeading.textContent = t.isDone ? '다 했어요!' : '지금 하는 중이에요';
    el.timerEnd.textContent = t.isDone ? '' : `${t.time}분 · 끝나는 시각 ${formatHour(t.startAt + t.duration)}`;
    el.timerEnd.hidden = t.isDone;
    el.timerDone.hidden = !t.isDone;
    renderClock();
    syncTicker();
  }

  function syncTicker() {
    const isRunning = Boolean(state.timer) && !state.timer.isDone;
    if (isRunning && !ticker) ticker = setInterval(tickTimer, 1000);
    if (!isRunning && ticker) {
      clearInterval(ticker);
      ticker = null;
    }
  }

  function finishTimer(message) {
    state.timer.isDone = true;
    writeJSON(KEY.timer, state.timer);
    renderTimer();
    say(message);
  }

  function tickTimer() {
    if (!state.timer || state.timer.isDone) return;
    if (getRemaining() <= 0) finishTimer('시간이 다 됐어요. 다 했어요, 도장 찍기 버튼을 눌러 주세요.');
    else renderClock();
  }

  /* 그리기: 도장판 */
  function makeSvg(className, href) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    svg.setAttribute('class', className);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    use.setAttribute('href', href);
    svg.appendChild(use);
    return svg;
  }

  function makeText(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }

  function renderBoard() {
    ensureWeek();
    const monday = getMonday(new Date());
    const todayKey = toDateKey(new Date());
    const items = state.stamps.items;

    el.boardRange.textContent = `${formatMonthDay(monday)}(월) ~ ${formatMonthDay(addDays(monday, 6))}(일)`;

    const days = document.createDocumentFragment();
    DAY_NAMES.forEach((name, i) => {
      const key = toDateKey(addDays(monday, i));
      const count = items.filter((it) => it.date === key).length;
      const li = document.createElement('li');
      li.className = 'board__day';
      if (key === todayKey) li.setAttribute('aria-current', 'date');

      li.appendChild(makeText('span', 'board__dayname', name));
      if (count > 0) {
        li.appendChild(makeSvg(`board__stamp${key === state.newStampDate ? ' board__stamp--new' : ''}`, '#s-done'));
        li.appendChild(makeText('span', 'board__count', `${count}개`));
        li.appendChild(makeText('span', 'sr-only', ' 도장'));
      } else {
        li.appendChild(makeText('span', 'board__slot', ''));
        li.appendChild(makeText('span', 'sr-only', '도장 없음'));
      }
      if (key === todayKey) li.appendChild(makeText('span', 'board__today', '오늘'));
      days.appendChild(li);
    });
    el.boardDays.replaceChildren(days);

    const hasItems = items.length > 0;
    el.boardEmpty.hidden = hasItems;
    el.boardListTitle.hidden = !hasItems;
    el.boardList.hidden = !hasItems;
    el.boardTotal.textContent = hasItems ? `(${items.length}개)` : '';

    const list = document.createDocumentFragment();
    items.slice().reverse().forEach((it) => {
      const dayIndex = (new Date(`${it.date}T00:00:00`).getDay() + 6) % 7;
      const li = document.createElement('li');
      li.className = 'board__item';
      li.appendChild(makeText('span', 'board__when', `${DAY_NAMES[dayIndex]} · ${it.time}분`));
      li.appendChild(makeText('span', 'board__what', it.title));
      list.appendChild(li);
    });
    el.boardList.replaceChildren(list);
    state.newStampDate = null;
  }

  function renderAll() {
    renderOrder();
    renderTimer();
    renderBoard();
  }

  /* 동작 */
  function selectTab(time, shouldFocus) {
    state.time = time;
    renderOrder();
    if (shouldFocus) el.tabs.find((tab) => Number(tab.dataset.time) === time).focus();
  }

  function onDraw() {
    ensureToday();
    if (state.status !== 'ready') return;
    const pick = drawActivity(state.time);
    renderOrder();
    el.ticketTitle.focus();
    say(`오늘의 추천은 ${pick.title}이에요. ${pick.desc}`);
  }

  function onChange() {
    ensureToday();
    if (state.status !== 'ready' || state.today.changesLeft <= 0) {
      renderOrder();
      return;
    }
    state.today.changesLeft -= 1;
    const pick = drawActivity(state.time);
    el.ticketInner.classList.remove('ticket__inner--spin');
    void el.ticketInner.offsetWidth; // 애니메이션 다시 시작
    el.ticketInner.classList.add('ticket__inner--spin');
    renderOrder();
    const left = state.today.changesLeft;
    if (left > 0) el.change.focus();
    else el.ticketTitle.focus();
    say(`다른 메뉴로 바꿨어요. ${pick.title}. 오늘 남은 변경은 ${left}번이에요.`);
  }

  function onStart() {
    ensureToday();
    const pick = getPick(state.time);
    if (!pick) return;
    state.timer = {
      id: pick.id, title: pick.title, desc: pick.desc || '', category: pick.category, time: pick.time,
      startAt: Date.now(), duration: pick.time * 60 * 1000, isDone: false
    };
    writeJSON(KEY.timer, state.timer);
    renderOrder();
    renderTimer();
    el.timerTitle.focus();
    say(`${pick.time}분 타이머를 시작했어요. 화면을 꺼도 시간은 계속 흘러가요.`);
  }

  function onStamp() {
    if (!state.timer) return;
    ensureToday();
    ensureWeek();
    const t = state.timer;
    const todayKey = toDateKey(new Date());
    state.stamps.items.push({ date: todayKey, id: t.id, title: t.title, time: t.time, category: t.category });
    writeJSON(KEY.stamps, state.stamps);

    if (state.today.picks[t.time] === t.id) {
      delete state.today.picks[t.time];
      writeJSON(KEY.today, state.today);
    }
    state.timer = null;
    store.remove(KEY.timer);
    state.newStampDate = todayKey;
    state.time = t.time;

    renderAll();
    el.boardTitle.focus();
    say(`오늘 칸에 도장을 찍었어요. 이번 주 도장은 모두 ${state.stamps.items.length}개예요.`);
  }

  function onQuit() {
    state.timer = null;
    store.remove(KEY.timer);
    renderOrder();
    renderTimer();
    if (!el.start.hidden) el.start.focus();
    else el.orderTitle.focus();
    say('타이머를 멈추고 메뉴로 돌아왔어요.');
  }

  /* 이벤트 */
  el.tablist.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) selectTab(Number(tab.dataset.time), false);
  });
  el.tablist.addEventListener('keydown', (e) => {
    const index = TIMES.indexOf(state.time);
    const last = TIMES.length - 1;
    const moves = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    selectTab(TIMES[moves[e.key]], true);
  });

  el.retry.addEventListener('click', () => {
    loadActivities().then(() => {
      if (state.status === 'ready') el.draw.focus();
      say(state.status === 'ready' ? '메뉴를 불러왔어요.' : '아직 메뉴를 불러오지 못했어요.');
    });
  });
  el.draw.addEventListener('click', onDraw);
  el.change.addEventListener('click', onChange);
  el.start.addEventListener('click', onStart);
  el.ticketInner.addEventListener('animationend', () => el.ticketInner.classList.remove('ticket__inner--spin'));

  el.stamp.addEventListener('click', onStamp);
  el.quit.addEventListener('click', onQuit);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const before = state.today.date;
    ensureToday();
    if (before !== state.today.date) renderOrder();
    renderBoard();
    tickTimer();
  });

  /* 시작 */
  el.storageNote.hidden = store.isOk;

  ensureToday();
  ensureWeek();
  loadRecent();
  loadTimer();
  if (state.timer) state.time = state.timer.time;
  renderAll();
  tickTimer();
  loadActivities();
})();
