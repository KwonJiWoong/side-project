(() => {
  'use strict';

  /* 기본 요소 */
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const PANELS = ['today', 'meds', 'health', 'history', 'times'];
  const SIZE_LABELS = ['보통', '크게', '아주 크게'];
  const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
  const SLOTS = [
    { id: 'morning', label: '아침' },
    { id: 'lunch', label: '점심' },
    { id: 'evening', label: '저녁' },
    { id: 'bed', label: '자기 전' }
  ];
  const MEALS = { before: '식사 전', after: '식사 후', any: '식사와 상관없이' };
  /* 간단 메모 (주소로 보낼 때 짧게 쓰려고 코드로 저장) */
  const TAGS = { water: '물과 함께', with: '식사와 함께', b30: '식전 30분', a30: '식후 30분', half: '반 알', one: '한 알', two: '두 알', nochew: '씹지 말기' };
  const TAG_GROUPS = [['with', 'b30', 'a30'], ['half', 'one', 'two']];
  const MOODS = { good: '좋아요', soso: '보통이에요', bad: '안 좋아요' };
  const KEEP_DAYS = 60;
  /* 하루가 바뀌는 시각: 새벽 4시 전은 전날로 침 (밤늦게 먹는 '자기 전' 약 때문) */
  const DAY_START_HOUR = 4;
  const DEFAULT_TIMES = { morning: '08:00', lunch: '12:30', evening: '18:30', bed: '22:00' };
  const KO_NUM = { 2: '이틀', 3: '사흘', 4: '나흘' };

  const el = {
    today: $('todayText'),
    progressBox: $('progressBox'),
    progressText: $('progressText'),
    pillBox: $('pillBox'),
    todayEmpty: $('todayEmpty'),
    todayEmptyBtn: $('todayEmptyBtn'),
    sample: $('sampleBtn'),
    slotList: $('slotList'),
    form: $('medForm'),
    formTitle: $('formTitle'),
    name: $('medName'),
    nameError: $('medNameError'),
    memo: $('medMemo'),
    timesError: $('timesError'),
    submitText: $('submitText'),
    cancelEdit: $('cancelEdit'),
    medList: $('medList'),
    medEmpty: $('medEmpty'),
    medCount: $('medCount'),
    undoBox: $('undoBox'),
    undoText: $('undoText'),
    undoBtnText: $('undoBtnText'),
    recordUndoBox: $('recordUndoBox'),
    recordUndoText: $('recordUndoText'),
    demoBar: $('demoBar'),
    demoLock: $('demoLock'),
    shareBox: $('shareBox'),
    importBox: $('importBox'),
    importLead: $('importLead'),
    importList: $('importList'),
    importNote: $('importNote'),
    restBox: $('restBox'),
    restList: $('restList'),
    repeatError: $('repeatError'),
    everyN: $('everyN'),
    everyStart: $('everyStart'),
    untilN: $('untilN'),
    pasteBox: $('pasteBox'),
    pushBox: $('pushBox'),
    healthForm: $('healthForm'),
    healthMemo: $('healthMemo'),
    healthSaved: $('healthSaved'),
    moodError: $('moodError'),
    historyBody: $('historyBody'),
    notice: $('notice'),
    sizeText: $('sizeText'),
    contrast: $('contrastBtn')
  };

  /* 아이콘 (HTML 상단 아이콘 모음 사용) */
  const ico = (name) => '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>';
  const chr = (name, cls) => '<svg class="chr' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#ch-' + name + '"></use></svg>';

  /* 입력한 글자 그대로 보이게 (태그 막기) */
  const esc = (str) => String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* 저장소 (사용 불가 환경 대비) */
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* 무시 */ } },
    json(key, fallback) {
      try { const v = JSON.parse(this.get(key)); return v && typeof v === 'object' ? v : fallback; } catch (e) { return fallback; }
    }
  };

  /* 날짜 도우미 */
  const pad = (n) => String(n).padStart(2, '0');
  const toKey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (key, n) => { const d = parse(key); d.setDate(d.getDate() + n); return toKey(d); };
  const fmt = (key) => { const d = parse(key); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + DAY_NAMES[d.getDay()] + '요일'; };
  const fmtShort = (key) => { const d = parse(key); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + DAY_NAMES[d.getDay()] + ')'; };
  const fmtTime = (iso) => {
    const d = new Date(iso);
    const h = d.getHours();
    return (h < 12 ? '오전 ' : '오후 ') + (h % 12 || 12) + '시 ' + d.getMinutes() + '분';
  };
  const today = () => toKey(new Date(Date.now() - DAY_START_HOUR * 3600000));
  const dayDiff = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);

  /* 먹는 시각: 'HH:MM' → 그날 기준 분 (새벽 4시 전은 다음 날로 이어서 셈) */
  const toMin = (hhmm) => {
    const [h, m] = String(hhmm).split(':').map(Number);
    const v = h * 60 + m;
    return v < DAY_START_HOUR * 60 ? v + 1440 : v;
  };
  const fmtClock = (hhmm) => {
    const [h, m] = String(hhmm).split(':').map(Number);
    const part = h === 0 ? '밤 ' : h < DAY_START_HOUR + 2 ? '새벽 ' : h < 12 ? '오전 ' : h === 12 ? '낮 ' : '오후 ';
    return part + (h % 12 || 12) + '시' + (m ? ' ' + m + '분' : '');
  };

  /* 지금 드실 때: 정한 시각 1시간 전부터 그 시간대로 봄 */
  function nowSlot() {
    const d = new Date();
    let now = d.getHours() * 60 + d.getMinutes();
    if (now < DAY_START_HOUR * 60) now += 1440;
    let cur = SLOTS[0].id;
    SLOTS.forEach((s) => { if (now >= toMin(state.slotTimes[s.id]) - 60) cur = s.id; });
    return cur;
  }

  /* 상태 */
  const state = {
    meds: [],
    log: {},
    health: {},
    size: 0,
    edit: null,
    confirm: null,
    demo: false,
    undoMeds: [],
    undoRecord: null,
    done: null,
    slotTimes: Object.assign({}, DEFAULT_TIMES)
  };
  const UNDO_MAX = 5;
  const normName = (n) => String(n).replace(/[~|]/g, ' ').replace(/\s+/g, ' ').trim();

  /* 먹는 날 · 기간
     repeat: { type: 'daily' } | { type: 'week', days: [0~6] } | { type: 'every', n: 2~14, from: 'YYYY-MM-DD' }
     until: 'YYYY-MM-DD' (이날까지 먹음) 또는 '' (계속) */
  const isKey = (k) => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);
  function normalizeMed(m) {
    m.tags = Array.isArray(m.tags) ? m.tags.filter((t) => TAGS[t]) : [];
    const r = m.repeat || {};
    if (r.type === 'week' && Array.isArray(r.days) && r.days.length) {
      m.repeat = { type: 'week', days: r.days.map(Number).filter((d) => d >= 0 && d <= 6).sort() };
      if (!m.repeat.days.length) m.repeat = { type: 'daily' };
    } else if (r.type === 'every' && r.n >= 2 && isKey(r.from)) {
      m.repeat = { type: 'every', n: Math.min(30, Math.floor(r.n)), from: r.from };
    } else {
      m.repeat = { type: 'daily' };
    }
    m.until = isKey(m.until) ? m.until : '';
    return m;
  }
  function isDue(m, key) {
    if (m.until && key > m.until) return false;
    const r = m.repeat;
    if (r.type === 'week') return r.days.includes(parse(key).getDay());
    if (r.type === 'every') { const d = dayDiff(r.from, key); return d >= 0 && d % r.n === 0; }
    return true;
  }
  const isEnded = (m, key) => Boolean(m.until && key > m.until);
  function nextDue(m, key) {
    for (let i = 1; i <= 60; i += 1) {
      const k = addDays(key, i);
      if (isEnded(m, k)) return '';
      if (isDue(m, k)) return k;
    }
    return '';
  }
  const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
  function repeatText(m) {
    const r = m.repeat;
    if (r.type === 'week') {
      if (r.days.length === 7) return '매일';
      return '매주 ' + WEEK_ORDER.filter((d) => r.days.includes(d)).map((d) => DAY_NAMES[d]).join('·') + '요일';
    }
    if (r.type === 'every') return (r.n === 7 ? '일주일' : (KO_NUM[r.n] || r.n + '일')) + '에 한 번';
    return '매일';
  }
  const untilText = (m) => (m.until ? fmtShort(m.until) + '까지' : '');
  const copy = (v) => JSON.parse(JSON.stringify(v));

  function load() {
    const meds = store.json('pill-meds', []);
    state.meds = Array.isArray(meds) ? meds.filter((m) => m && m.id && m.name && Array.isArray(m.times)) : [];
    state.meds.forEach(normalizeMed);
    const st = store.json('pill-slot-times', null);
    state.slotTimes = Object.assign({}, DEFAULT_TIMES);
    if (st) SLOTS.forEach((s) => { if (/^\d{2}:\d{2}$/.test(st[s.id])) state.slotTimes[s.id] = st[s.id]; });
    state.log = store.json('pill-log', {});
    state.health = store.json('pill-health', {});
    /* 예전 방식으로 저장된 예시 약 정리 (예시뿐이면 기록도 함께) */
    const isEx = (m) => /^ex\d$/.test(m.id) && / \(예시\)$/.test(m.name);
    if (state.meds.some(isEx)) {
      if (state.meds.every(isEx)) { state.log = {}; state.health = {}; }
      state.meds = state.meds.filter((m) => !isEx(m));
    }
    /* 되돌리기는 지운 그날 안에만 */
    const t = today();
    const um = store.json('pill-undo-meds', []);
    state.undoMeds = Array.isArray(um) ? um.filter((u) => u && u.day === t && u.med && u.med.id) : [];
    const ur = store.json('pill-undo-records', null);
    state.undoRecord = ur && ur.day === t ? ur : null;
  }
  function save() {
    /* 예시 화면은 저장하지 않음 */
    if (state.demo) return;
    /* 오래된 기록은 정리 */
    const limit = addDays(today(), -KEEP_DAYS);
    Object.keys(state.log).forEach((k) => { if (k < limit) delete state.log[k]; });
    Object.keys(state.health).forEach((k) => { if (k < limit) delete state.health[k]; });
    store.set('pill-meds', JSON.stringify(state.meds));
    store.set('pill-log', JSON.stringify(state.log));
    store.set('pill-health', JSON.stringify(state.health));
    store.set('pill-undo-meds', JSON.stringify(state.undoMeds));
    store.set('pill-undo-records', JSON.stringify(state.undoRecord));
    store.set('pill-slot-times', JSON.stringify(state.slotTimes));
    pushSync();
  }
  const findMed = (id) => state.meds.find((m) => m.id === id);

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
    store.set('pill-size', String(state.size));
  }
  function setContrast(on) {
    if (on) root.setAttribute('data-contrast', 'high');
    else root.removeAttribute('data-contrast');
    el.contrast.setAttribute('aria-pressed', String(on));
    store.set('pill-contrast', on ? '1' : '0');
  }
  $('fontDown').addEventListener('click', () => { setSize(state.size - 1); say('글자 크기: ' + SIZE_LABELS[state.size]); });
  $('fontUp').addEventListener('click', () => { setSize(state.size + 1); say('글자 크기: ' + SIZE_LABELS[state.size]); });
  el.contrast.addEventListener('click', () => {
    const on = el.contrast.getAttribute('aria-pressed') !== 'true';
    setContrast(on);
    say(on ? '고대비 보기를 켰어요.' : '고대비 보기를 껐어요.');
  });

  /* 오늘 기록 (먹을 횟수는 그날 기준으로 저장) */
  function todayEntries() {
    const list = [];
    SLOTS.forEach((slot) => {
      const t = today();
      state.meds.filter((m) => m.times.includes(slot.id) && isDue(m, t))
        .sort((a, b) => doseOffset(a, slot.id) - doseOffset(b, slot.id))
        .forEach((m) => list.push({ med: m, slot: slot.id, key: m.id + '@' + slot.id }));
    });
    return list;
  }
  function todayLog() {
    const t = today();
    const entries = todayEntries();
    const day = state.log[t] || { done: {} };
    const keys = entries.map((e) => e.key);
    Object.keys(day.done).forEach((k) => { if (!keys.includes(k)) delete day.done[k]; });
    day.total = entries.length;
    if (entries.length) state.log[t] = day;
    else delete state.log[t];
    return { day, entries };
  }

  /* 화면 그리기: 오늘 먹을 약 */
  function renderToday(focusSel) {
    el.today.textContent = fmt(today());
    const { day, entries } = todayLog();
    const has = entries.length > 0;
    const none = !state.meds.length;
    el.todayEmpty.hidden = !none;
    el.todayEmptyBtn.hidden = !none;
    el.sample.hidden = !none;
    el.progressBox.hidden = none;
    el.pillBox.hidden = !has;
    if (!none && !has) {
      el.progressText.textContent = '오늘은 먹을 약이 없어요. 정해진 날에만 먹는 약은 아래에서 확인해 주세요.';
      el.progressBox.classList.add('progress--done');
    }

    if (has) {
      const done = Object.keys(day.done).length;
      const all = done === entries.length;
      el.progressText.textContent = all
        ? '오늘 약을 모두 드셨어요. 잘하셨어요!'
        : '오늘 ' + entries.length + '번 중 ' + done + '번 먹었어요. ' + (entries.length - done) + '번 남았어요.';
      el.progressBox.classList.toggle('progress--done', all);
    }

    el.pillBox.innerHTML = SLOTS.map((slot) => {
      const items = entries.filter((e) => e.slot === slot.id);
      if (!items.length) return '';
      const took = items.filter((e) => day.done[e.key]).length;
      const left = items.length - took;
      const pills = items.map((e) => '<svg class="pillbox__pill"><use href="#ch-pill-' + (day.done[e.key] ? 'on' : 'off') + '"></use></svg>').join('');
      return '<li><button type="button" class="pillbox__cell pillbox__cell--' + slot.id + (left ? '' : ' is-done') + '" data-goto="' + slot.id + '">' +
        chr(slot.id) + '<span class="pillbox__label">' + slot.label + '</span>' +
        '<span class="pillbox__pills" aria-hidden="true">' + pills + '</span>' +
        '<span class="pillbox__state">' + (left ? left + '개 남음' : '✓ 다 먹음') + '</span>' +
        '<span class="sr-only"> - 눌러서 ' + slot.label + ' 약 보기</span></button></li>';
    }).join('');

    const now = nowSlot();
    el.slotList.innerHTML = SLOTS.map((slot) => {
      const items = entries.filter((e) => e.slot === slot.id);
      if (!items.length) return '';
      const doneCount = items.filter((e) => day.done[e.key]).length;
      const cards = items.map((e) => {
        const takenAt = day.done[e.key];
        const id = 'med-' + e.key.replace('@', '-');
        /* 먹는 시각 줄에 식사 전후가 나오므로 나머지 메모만 */
        const info = e.med.tags.filter((t) => !['b30', 'a30', 'with'].includes(t)).map((t) => TAGS[t]).concat(e.med.memo).filter(Boolean).map(esc).join(' · ');
        const special = e.med.repeat.type !== 'daily' || e.med.until;
        return '<li><article class="med-card' + (takenAt ? ' med-card--done' : '') + '" aria-labelledby="' + id + '">' +
          '<h4 class="med-card__name" id="' + id + '">' + esc(e.med.name) + '</h4>' +
          '<p class="med-card__time">' + ico('clock') + ' ' + doseText(e.med, slot.id) + '</p>' +
          (special ? '<p class="med-card__repeat">' + ico('calendar') + ' ' + [e.med.repeat.type !== 'daily' ? repeatText(e.med) + ' 먹는 약' : '', untilText(e.med)].filter(Boolean).join(' · ') + '</p>' : '') +
          (info ? '<p class="med-card__info">' + info + '</p>' : '') +
          (takenAt
            ? '<p class="med-card__state">' + ico('check') + ' ' + fmtTime(takenAt) + '에 먹었어요</p>' +
              '<button type="button" class="btn btn--block" data-act="undo" data-key="' + e.key + '">' + ico('undo') + ' 잘못 눌렀어요 (되돌리기)<span class="sr-only"> - ' + esc(e.med.name) + '</span></button>'
            : '<p class="med-card__state">' + ico('clock') + ' 아직 안 먹었어요</p>' +
              '<button type="button" class="btn btn--primary btn--block" data-act="take" data-key="' + e.key + '">' + ico('check') + ' 먹었어요<span class="sr-only"> - ' + slot.label + ' ' + esc(e.med.name) + '</span></button>') +
          '</article></li>';
      }).join('');
      return '<li><section class="slot slot--' + slot.id + '" aria-labelledby="slot-' + slot.id + '">' +
        '<header class="slot__head">' +
          '<h3 class="slot__title" id="slot-' + slot.id + '" tabindex="-1">' + chr(slot.id) + ' ' + slot.label + ' <span class="slot__time">' + (slot.id === 'bed' ? '' : '식사 ') + fmtClock(state.slotTimes[slot.id]) + '</span></h3>' +
          (slot.id === now ? '<p class="slot__now">' + ico('clock') + ' 지금 드실 때</p>' : '') +
          '<p class="slot__count">' + items.length + '개 중 ' + doneCount + '개 먹음</p>' +
        '</header>' +
        '<ul class="med-list">' + cards + '</ul>' +
      '</section></li>';
    }).join('');

    /* 오늘은 안 먹는 약 (정해진 날에만 먹는 약) */
    const t = today();
    const rest = state.meds.filter((m) => !isDue(m, t) && !isEnded(m, t));
    el.restList.innerHTML = rest.map((m) => {
      const next = nextDue(m, t);
      return '<li><strong>' + esc(m.name) + '</strong> · ' + repeatText(m) + (next ? ' · 다음: ' + fmtShort(next) : '') + '</li>';
    }).join('');
    el.restBox.hidden = !rest.length;

    if (focusSel) {
      const target = el.slotList.querySelector(focusSel);
      if (target) target.focus();
    }
  }

  /* 약통 칸을 누르면 그 시간대 약으로 */
  el.pillBox.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-goto]');
    if (!btn) return;
    const title = $('slot-' + btn.dataset.goto);
    if (!title) return;
    title.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    title.focus({ preventScroll: true });
  });

  el.slotList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const key = btn.dataset.key;
    const { day } = todayLog();
    const med = findMed(key.split('@')[0]);
    const slot = SLOTS.find((s) => s.id === key.split('@')[1]);
    if (btn.dataset.act === 'take') {
      day.done[key] = new Date().toISOString();
      say(slot.label + ' ' + med.name + ' 먹었다고 적었어요.');
    } else {
      delete day.done[key];
      say(slot.label + ' ' + med.name + ' 기록을 되돌렸어요.');
    }
    state.log[today()] = day;
    save();
    renderToday('button[data-key="' + key + '"]');
  });

  /* 화면 그리기: 등록한 약 */
  function renderMeds(focusSel) {
    el.medCount.textContent = state.meds.length + '개';
    el.medEmpty.hidden = state.meds.length > 0;
    el.shareBox.hidden = !state.meds.length || state.demo;
    el.pasteBox.hidden = !(isIOS && standalone) || state.demo;
    const last = state.undoMeds[state.undoMeds.length - 1];
    el.undoBox.hidden = !last;
    if (last) {
      const more = state.undoMeds.length - 1;
      el.undoText.textContent = '방금 ' + last.med.name + '을(를) 지웠어요. 잘못 지웠다면 되돌려 주세요.' +
        (more ? ' 그 전에 지운 약 ' + more + '개도 하나씩 되돌릴 수 있어요.' : '');
      el.undoBtnText.textContent = last.med.name + ' 되돌리기';
    }
    el.medList.innerHTML = state.meds.map((m) => {
      const times = SLOTS.filter((s) => m.times.includes(s.id)).map((s) => s.label).join(' · ');
      const open = state.confirm === m.id;
      return '<li><article class="my-med" aria-labelledby="my-' + m.id + '">' +
        '<h4 class="my-med__name" id="my-' + m.id + '">' + esc(m.name) + '</h4>' +
        '<p><strong>먹는 때</strong> ' + times + ' (' + (MEALS[m.meal] || MEALS.after) + ')</p>' +
        '<p><strong>먹는 날</strong> ' + repeatText(m) + (m.until ? ' · ' + untilText(m) : '') +
          (isEnded(m, today()) ? ' <strong class="my-med__ended">(다 먹었어요)</strong>' : '') + '</p>' +
        (m.tags.length ? '<p><strong>간단 메모</strong> ' + m.tags.map((t) => TAGS[t]).join(' · ') + '</p>' : '') +
        (m.memo ? '<p><strong>비고</strong> ' + esc(m.memo) + '</p>' : '') +
        '<p class="my-med__btns">' +
          '<button type="button" class="btn" data-act="edit" data-id="' + m.id + '">' + ico('edit') + ' 고치기<span class="sr-only"> - ' + esc(m.name) + '</span></button>' +
          '<button type="button" class="btn btn--danger" data-act="remove" data-id="' + m.id + '" aria-expanded="' + open + '" aria-controls="confirm-' + m.id + '">' + ico('trash') + ' 지우기<span class="sr-only"> - ' + esc(m.name) + '</span></button>' +
        '</p>' +
        '<div class="confirm" id="confirm-' + m.id + '" role="group" aria-labelledby="confirm-text-' + m.id + '"' + (open ? '' : ' hidden') + '>' +
          '<p class="confirm__text" id="confirm-text-' + m.id + '">' + esc(m.name) + '을(를) 지울까요? 오늘 먹을 약에서도 빠져요.</p>' +
          '<p class="confirm__btns">' +
            '<button type="button" class="btn btn--danger" data-act="remove-yes" data-id="' + m.id + '">' + ico('trash') + ' 네, 지울게요</button>' +
            '<button type="button" class="btn" data-act="remove-no" data-id="' + m.id + '">' + ico('close') + ' 아니요</button>' +
          '</p>' +
        '</div>' +
      '</article></li>';
    }).join('');

    if (focusSel) {
      const target = el.medList.querySelector(focusSel);
      if (target) target.focus();
    }
  }

  el.medList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const med = findMed(id);
    if (!med) return;
    switch (btn.dataset.act) {
      case 'edit':
        startEdit(med);
        break;
      case 'remove':
        state.confirm = state.confirm === id ? null : id;
        renderMeds(state.confirm ? '[data-act="remove-no"][data-id="' + id + '"]' : '[data-act="remove"][data-id="' + id + '"]');
        break;
      case 'remove-no':
        state.confirm = null;
        renderMeds('[data-act="remove"][data-id="' + id + '"]');
        break;
      case 'remove-yes':
        state.confirm = null;
        if (state.done === id) state.done = null;
        keepMedUndo(med);
        state.meds = state.meds.filter((m) => m.id !== id);
        if (state.edit === id) resetForm();
        save();
        renderAll();
        $('undoBtn').focus();
        say(med.name + '을(를) 지웠어요. 되돌리기를 누르면 다시 살아나요.');
        break;
    }
  });

  /* 지운 약 되돌리기 (지운 순서 반대로 하나씩) */
  function keepMedUndo(med) {
    const t = today();
    const done = {};
    const day = state.log[t];
    if (day && day.done) Object.keys(day.done).forEach((k) => { if (k.split('@')[0] === med.id) done[k] = day.done[k]; });
    state.undoMeds.push({ day: t, med: copy(med), index: state.meds.indexOf(med), done });
    if (state.undoMeds.length > UNDO_MAX) state.undoMeds.shift();
  }
  $('undoBtn').addEventListener('click', () => {
    const u = state.undoMeds.pop();
    if (!u) return;
    if (!findMed(u.med.id)) state.meds.splice(Math.min(u.index, state.meds.length), 0, u.med);
    if (u.day === today() && Object.keys(u.done).length) {
      const t = today();
      state.log[t] = state.log[t] || { done: {} };
      Object.assign(state.log[t].done, u.done);
    }
    save();
    renderAll();
    $(state.undoMeds.length ? 'undoBtn' : 'medsTitle').focus();
    say(u.med.name + '을(를) 되돌렸어요. 오늘 먹을 약에도 다시 나와요.');
  });

  /* 약 카드에 보일 안내 (먹는 때 + 간단 메모 + 비고) */
  /* 약마다 먹는 시각 = 식사 시각 ± 30분 (자기 전 약은 정한 시각 그대로) */
  function doseOffset(m, slotId) {
    if (slotId === 'bed') return 0;
    if (m.tags.includes('b30')) return -30;
    if (m.tags.includes('a30')) return 30;
    if (m.tags.includes('with')) return 0;
    if (m.meal === 'before') return -30;
    if (m.meal === 'after') return 30;
    return 0;
  }
  const addMin = (hhmm, d) => {
    const [h, mm] = String(hhmm).split(':').map(Number);
    const v = (((h * 60 + mm + d) % 1440) + 1440) % 1440;
    return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0');
  };
  const doseTime = (m, slotId) => addMin(state.slotTimes[slotId], doseOffset(m, slotId));
  const offsetText = (off, slotId) => (slotId === 'bed' ? '자기 전' : off < 0 ? '식사 30분 전' : off > 0 ? '식사 30분 뒤' : '식사 때');
  const doseText = (m, slotId) => fmtClock(doseTime(m, slotId)) + ' (' + offsetText(doseOffset(m, slotId), slotId) + ')';

  function medNote(m) {
    const timed = m.tags.includes('b30') || m.tags.includes('a30') || m.tags.includes('with');
    return [timed ? '' : (MEALS[m.meal] || MEALS.after)].concat(m.tags.map((t) => TAGS[t]), m.memo).filter(Boolean);
  }

  /* 간단 메모: 같은 묶음(식사 때, 알 수)은 하나만, 식전·식후는 '식사와 함께' 선택과 맞춤 */
  el.form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'tags' && t.checked) {
      const group = TAG_GROUPS.find((g) => g.includes(t.value));
      if (group) group.forEach((v) => { if (v !== t.value) $('tag-' + v).checked = false; });
      if (t.value === 'b30') $('meal-before').checked = true;
      if (t.value === 'a30') $('meal-after').checked = true;
      refreshPick(pickOf('mealGroup'));
    }
    if (t.name === 'meal') {
      if (t.value !== 'before') $('tag-b30').checked = false;
      if (t.value !== 'after') $('tag-a30').checked = false;
    }
  });

  /* 하나만 고르는 칸 (data-pick): 고르면 고른 것만 보이고 옆에 [다시 고르기]
     화살표 키로 고를 때는 바로 접지 않고 칸을 벗어날 때 접음 (키보드 사용자 배려) */
  const picks = Array.from(document.querySelectorAll('[data-pick]')).map((fs) => {
    const list = fs.querySelector(':scope > .choice-list');
    const row = document.createElement('div');
    row.className = 'pick__row';
    list.parentNode.insertBefore(row, list);
    row.appendChild(list);
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'btn pick__again';
    again.innerHTML = ico('undo') + ' 다시 고르기<span class="sr-only"> - ' + fs.querySelector('legend').firstChild.textContent.trim() + '</span>';
    row.appendChild(again);
    const radios = Array.from(list.querySelectorAll('input[type="radio"]'));
    const pick = { fs, list, radios, open: false };
    let byArrow = false;
    fs.addEventListener('keydown', (e) => { if (/^Arrow/.test(e.key) && radios.includes(e.target)) byArrow = true; });
    list.addEventListener('change', () => {
      if (byArrow) { byArrow = false; return; }
      pick.open = false;
      refreshPick(pick);
    });
    /* 손가락 · 마우스로 누르는 중에는 포커스가 잠깐 빠져도 접지 않음 */
    let pressing = false;
    fs.addEventListener('pointerdown', () => { pressing = true; });
    document.addEventListener('pointerup', () => { setTimeout(() => { pressing = false; }, 0); });
    /* 이미 고른 것을 다시 눌러도 접기 */
    list.addEventListener('click', (e) => {
      if (pressing && pick.open && e.target.type === 'radio' && e.target.checked) { pick.open = false; refreshPick(pick); }
    });
    fs.addEventListener('focusout', (e) => {
      if (pressing || !pick.open || fs.contains(e.relatedTarget) || !radios.some((r) => r.checked)) return;
      pick.open = false;
      refreshPick(pick);
    });
    again.addEventListener('click', () => {
      pick.open = true;
      refreshPick(pick);
      (radios.find((r) => r.checked) || radios[0]).focus();
    });
    return pick;
  });
  function refreshPick(pick) {
    const checked = pick.radios.find((r) => r.checked);
    const closed = Boolean(checked) && !pick.open;
    pick.fs.classList.toggle('is-picked', closed);
    pick.radios.forEach((r) => { r.closest('li').hidden = closed && r !== checked; });
  }
  /* 처음 상태로: 고른 게 있으면 접고, 없으면 펼침 */
  const resetPicks = (root) => picks.forEach((p) => { if (!root || root.contains(p.fs)) { p.open = false; refreshPick(p); } });
  const pickOf = (id) => picks.find((p) => p.fs.id === id);

  /* 약 이름: 자주 먹는 약 고르기 · 직접 쓰기 */
  function syncName() {
    const v = radioVal('preset');
    const custom = v === 'custom';
    $('nameBox').hidden = !custom;
    if (v && !custom) el.name.value = v;
  }
  function setName(name) {
    const preset = Array.from(el.form.querySelectorAll('input[name="preset"]')).find((r) => r.value === name);
    (preset || $('pre-custom')).checked = true;
    el.name.value = name;
    syncName();
  }
  function focusName() {
    if (!$('nameBox').hidden) { el.name.focus(); return; }
    const r = el.form.querySelector('input[name="preset"]:checked') || $('pre-0');
    r.focus();
  }
  el.form.addEventListener('change', (e) => {
    if (e.target.name !== 'preset') return;
    if (e.target.value === 'custom') {
      if (Array.from(el.form.querySelectorAll('input[name="preset"]')).some((r) => r.value === el.name.value)) el.name.value = '';
      syncName();
      if (!$('nameGroup').contains(document.activeElement) || document.activeElement === e.target) el.name.focus();
    } else {
      syncName();
    }
    showError($('nameGroup'), el.nameError, '');
  });

  /* 먹는 날 · 기간 고르기 칸 */
  const radioVal = (name) => (el.form.querySelector('input[name="' + name + '"]:checked') || {}).value;
  function fillSelects(med) {
    const t = today();
    let opts = '';
    for (let n = 2; n <= 14; n += 1) opts += '<option value="' + n + '">' + (n === 7 ? '일주일' : (KO_NUM[n] || n + '일')) + '에 한 번</option>';
    el.everyN.innerHTML = opts;
    el.everyN.value = med && med.repeat.type === 'every' ? String(med.repeat.n) : '2';
    let starts = '';
    if (med && med.repeat.type === 'every') {
      const next = isDue(med, t) ? t : nextDue(med, t);
      starts += '<option value="keep">지금처럼' + (next ? ' (다음: ' + fmtShort(next) + ')' : '') + '</option>';
    }
    starts += '<option value="0">오늘 (' + fmtShort(t) + ')</option><option value="1">내일 (' + fmtShort(addDays(t, 1)) + ')</option>';
    el.everyStart.innerHTML = starts;
    let days = '';
    if (med && med.until) {
      const left = dayDiff(t, med.until) + 1;
      days += '<option value="keep">지금처럼 (' + fmtShort(med.until) + '까지' + (left < 1 ? ', 이미 끝났어요' : '') + ')</option>';
    }
    [1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 28, 30, 60, 90].forEach((n) => {
      days += '<option value="' + n + '">' + n + '일 치 (' + fmtShort(addDays(t, n - 1)) + '까지)</option>';
    });
    el.untilN.innerHTML = days;
    el.untilN.value = med && med.until ? 'keep' : '7';
  }
  function syncSchedule() {
    $('weekBox').hidden = radioVal('repeat') !== 'week';
    $('everyBox').hidden = radioVal('repeat') !== 'every';
    $('untilBox').hidden = radioVal('until') !== 'days';
  }
  el.form.addEventListener('change', (e) => {
    if (e.target.name === 'repeat' || e.target.name === 'until') syncSchedule();
  });

  /* 약 등록 · 고치기 폼 */
  function showError(input, box, message) {
    box.textContent = message;
    box.hidden = !message;
    input.setAttribute('aria-invalid', String(Boolean(message)));
  }
  function checkedTimes() {
    return Array.from(el.form.querySelectorAll('input[name="times"]:checked')).map((i) => i.value);
  }
  function startEdit(med) {
    if (state.done) { state.done = null; renderDemo(); }
    state.edit = med.id;
    state.confirm = null;
    setName(med.name);
    el.memo.value = med.memo || '';
    el.form.querySelectorAll('input[name="tags"]').forEach((i) => { i.checked = med.tags.includes(i.value); });
    el.form.querySelectorAll('input[name="times"]').forEach((i) => { i.checked = med.times.includes(i.value); });
    el.form.querySelectorAll('input[name="meal"]').forEach((i) => { i.checked = i.value === (med.meal || 'after'); });
    $('rp-' + med.repeat.type).checked = true;
    el.form.querySelectorAll('input[name="wdays"]').forEach((i) => { i.checked = med.repeat.type === 'week' && med.repeat.days.includes(Number(i.value)); });
    $(med.until ? 'until-days' : 'until-none').checked = true;
    fillSelects(med);
    syncSchedule();
    resetPicks(el.form);
    el.formTitle.textContent = med.name + ' 고치기';
    el.submitText.textContent = '고친 내용 저장';
    el.cancelEdit.hidden = false;
    el.form.classList.add('form--edit');
    clearErrors();
    renderMeds();
    el.form.scrollIntoView({ block: 'start' });
    focusName();
    say(med.name + ' 정보를 고칠 수 있어요.');
  }
  function clearErrors() {
    showError($('nameGroup'), el.nameError, '');
    showError($('timesGroup'), el.timesError, '');
    showError($('repeatGroup'), el.repeatError, '');
  }
  function resetForm() {
    state.edit = null;
    el.form.reset();
    el.formTitle.textContent = '새 약 등록하기';
    el.submitText.textContent = '약 등록하기';
    el.cancelEdit.hidden = true;
    el.form.classList.remove('form--edit');
    fillSelects(null);
    syncSchedule();
    syncName();
    resetPicks(el.form);
    clearErrors();
  }

  el.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.name.value.trim();
    const times = checkedTimes();
    const timesGroup = $('timesGroup');
    /* 이름이 같은 약은 따로 등록하지 않음 (링크로 옮길 때 기록이 섞이지 않게) */
    const dup = name && state.meds.find((m) => m.id !== state.edit && normName(m.name) === normName(name));
    showError($('nameGroup'), el.nameError, !name
      ? (radioVal('preset') === 'custom' ? '약 이름을 적어 주세요. 예: 아스피린' : '약 이름을 골라 주세요. 없으면 [직접 쓰기]를 눌러 적어 주세요.')
      : dup ? '이미 \'' + name + '\' 약이 있어요. 다른 약이면 \'' + name + ' 저녁용\'처럼 이름을 다르게 적어 주세요. 같은 약이면 아래 등록한 약에서 [고치기]로 먹는 때를 더해 주세요.' : '');
    if (dup) {
      $('pre-custom').checked = true;
      $('nameBox').hidden = false;
      el.name.value = name + ' ';
      pickOf('nameGroup').open = false;
      refreshPick(pickOf('nameGroup'));
      el.name.focus();
      return;
    }
    showError(timesGroup, el.timesError, times.length ? '' : '먹는 때를 하나 이상 눌러 주세요. 예: 아침');
    const rtype = radioVal('repeat') || 'daily';
    const wdays = Array.from(el.form.querySelectorAll('input[name="wdays"]:checked')).map((i) => Number(i.value));
    showError($('repeatGroup'), el.repeatError, rtype === 'week' && !wdays.length ? '먹는 요일을 하나 이상 눌러 주세요. 예: 월' : '');
    if (!name) { pickOf('nameGroup').open = true; refreshPick(pickOf('nameGroup')); focusName(); return; }
    if (!times.length) { $('t-morning').focus(); return; }
    if (rtype === 'week' && !wdays.length) { $('wd-1').focus(); return; }

    const old = state.edit ? findMed(state.edit) : null;
    const t = today();
    let repeat = { type: 'daily' };
    if (rtype === 'week') repeat = { type: 'week', days: wdays.sort() };
    if (rtype === 'every') {
      const n = Number(el.everyN.value) || 2;
      const keep = el.everyStart.value === 'keep' && old && old.repeat.type === 'every';
      repeat = { type: 'every', n, from: keep ? old.repeat.from : addDays(t, Number(el.everyStart.value) || 0) };
    }
    let until = '';
    if (radioVal('until') === 'days') until = el.untilN.value === 'keep' && old ? old.until : addDays(t, (Number(el.untilN.value) || 1) - 1);

    const meal = (el.form.querySelector('input[name="meal"]:checked') || {}).value || 'after';
    const memo = el.memo.value.trim();
    const tags = Array.from(el.form.querySelectorAll('input[name="tags"]:checked')).map((i) => i.value);
    const wasEdit = state.edit;
    if (wasEdit) {
      Object.assign(findMed(wasEdit), { name, times, meal, tags, memo, repeat, until });
    } else {
      state.meds.push({ id: 'm' + Date.now().toString(36), name, times, meal, tags, memo, repeat, until });
    }
    save();
    resetForm();
    showDone(wasEdit || state.meds[state.meds.length - 1].id, Boolean(wasEdit));
  });

  /* 등록 완료 카드: 방금 적은 내용 확인 + 다음에 할 일 버튼 */
  function showDone(id, edited) {
    const m = findMed(id);
    if (!m) return;
    const t = today();
    const due = isDue(m, t);
    const next = due ? '' : nextDue(m, t);
    const times = SLOTS.filter((s) => m.times.includes(s.id)).map((s) => s.label + ' ' + doseText(m, s.id)).join(' · ');
    const rows = [
      ['먹는 때', times],
      ['먹는 날', repeatText(m) + (m.until ? ' · ' + untilText(m) : '')],
      m.tags.length ? ['간단 메모', m.tags.map((x) => TAGS[x]).join(' · ')] : null,
      m.memo ? ['비고', m.memo] : null
    ].filter(Boolean);
    const last = m.name.charCodeAt(m.name.length - 1);
    const josa = last >= 0xAC00 && last <= 0xD7A3 ? ((last - 0xAC00) % 28 ? '을' : '를') : '을(를)';
    $('doneText').textContent = m.name + (edited ? ' 정보를 고쳤어요' : josa + ' 등록했어요');
    $('doneInfo').innerHTML = rows.map((r) => '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>').join('') +
      (due ? '' : '<dd class="done__alert">오늘은 먹는 날이 아니에요.' + (next ? ' 다음 먹는 날: ' + fmtShort(next) : '') + '</dd>');
    state.done = id;
    renderAll();
    $('doneBox').scrollIntoView({ block: 'start' });
    $('doneTitle').focus({ preventScroll: true });
    say($('doneText').textContent + '.');
  }
  function closeDone() {
    state.done = null;
    renderDemo();
  }
  $('doneNew').addEventListener('click', () => {
    closeDone();
    el.form.scrollIntoView({ block: 'start' });
    focusName();
  });
  $('doneToday').addEventListener('click', () => {
    closeDone();
    history.pushState(null, '', '#today');
    showPanel('today', true);
  });
  $('doneEdit').addEventListener('click', () => {
    const med = findMed(state.done);
    closeDone();
    if (med) startEdit(med);
  });
  el.cancelEdit.addEventListener('click', () => {
    const id = state.edit;
    resetForm();
    renderMeds('[data-act="edit"][data-id="' + id + '"]');
    say('고치기를 그만뒀어요.');
  });

  /* 몸 상태 */
  function renderHealth() {
    const rec = state.health[today()];
    el.healthSaved.hidden = !rec;
    if (rec) {
      el.healthSaved.innerHTML = chr(rec.mood) + ' 오늘 기록: ' + MOODS[rec.mood] + ' (' + fmtTime(rec.at) + ' 저장)';
      const input = el.healthForm.querySelector('input[name="mood"][value="' + rec.mood + '"]');
      if (input) input.checked = true;
      resetPicks(el.healthForm);
      el.healthMemo.value = rec.memo || '';
    }
  }
  el.healthForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const checked = el.healthForm.querySelector('input[name="mood"]:checked');
    const group = el.healthForm.querySelector('.form__group');
    showError(group, el.moodError, checked ? '' : '몸 상태를 하나 눌러 주세요. 예: 보통이에요');
    if (!checked) { $('mood-good').focus(); return; }
    state.health[today()] = { mood: checked.value, memo: el.healthMemo.value.trim(), at: new Date().toISOString() };
    save();
    renderHealth();
    renderHistory();
    say('오늘 몸 상태를 저장했어요.');
  });

  /* 지난 기록 (최근 7일) */
  function renderHistory() {
    const t = today();
    let rows = '';
    for (let i = 0; i < 7; i += 1) {
      const key = addDays(t, -i);
      const day = state.log[key];
      const rec = state.health[key];
      let status = '<span class="history__status">기록 없음</span>';
      if (day && day.total) {
        const done = Object.keys(day.done || {}).length;
        if (done >= day.total) status = '<span class="history__status history__status--done">✓ 다 먹었어요</span> (' + day.total + '번)';
        else if (done > 0) status = '<span class="history__status history__status--miss">△ 일부만 먹었어요</span> (' + day.total + '번 중 ' + done + '번)';
        else status = '<span class="history__status history__status--miss">✕ 먹은 기록이 없어요</span> (' + day.total + '번)';
      }
      const mood = rec
        ? '<span class="history__status history__mood">' + chr(rec.mood) + MOODS[rec.mood] + '</span>' + (rec.memo ? '<span class="history__memo">' + esc(rec.memo) + '</span>' : '')
        : '기록 없음';
      rows += '<tr role="row">' +
        '<th scope="row" role="rowheader">' + fmtShort(key) + (i === 0 ? ' <span class="history__today">오늘</span>' : '') + '</th>' +
        '<td role="cell" data-label="먹은 약">' + status + '</td>' +
        '<td role="cell" data-label="몸 상태">' + mood + '</td>' +
      '</tr>';
    }
    el.historyBody.innerHTML = rows;
  }

  const resetBtn = $('resetBtn');
  const resetConfirm = $('resetConfirm');
  function toggleReset(open) {
    resetConfirm.hidden = !open;
    resetBtn.setAttribute('aria-expanded', String(open));
    (open ? $('resetNo') : resetBtn).focus();
  }
  resetBtn.addEventListener('click', () => toggleReset(resetConfirm.hidden));
  $('resetNo').addEventListener('click', () => toggleReset(false));
  $('resetYes').addEventListener('click', () => {
    const has = Object.keys(state.log).length || Object.keys(state.health).length;
    if (has) state.undoRecord = { day: today(), log: copy(state.log), health: copy(state.health) };
    state.log = {};
    state.health = {};
    save();
    el.healthForm.reset();
    resetPicks(el.healthForm);
    renderAll();
    resetConfirm.hidden = true;
    resetBtn.setAttribute('aria-expanded', 'false');
    (has ? $('recordUndoBtn') : resetBtn).focus();
    say(has ? '기록을 모두 지웠어요. 되돌리기를 누르면 다시 살아나요.' : '지울 기록이 없어요.');
  });
  function renderRecordUndo() {
    el.recordUndoBox.hidden = !state.undoRecord;
    if (state.undoRecord) el.recordUndoText.textContent = '기록을 모두 지웠어요. 잘못 지웠다면 되돌려 주세요.';
  }
  $('recordUndoBtn').addEventListener('click', () => {
    const u = state.undoRecord;
    if (!u) return;
    /* 지운 뒤 새로 남긴 기록은 그대로 두고 합치기 */
    Object.keys(u.log).forEach((k) => {
      const now = state.log[k];
      state.log[k] = now ? { total: now.total, done: Object.assign({}, u.log[k].done, now.done) } : u.log[k];
    });
    Object.keys(u.health).forEach((k) => { if (!state.health[k]) state.health[k] = u.health[k]; });
    state.undoRecord = null;
    save();
    renderAll();
    resetBtn.focus();
    say('지운 기록을 되돌렸어요.');
  });

  function renderAll() {
    renderDemo();
    renderInstall();
    renderToday();
    renderMeds();
    renderHealth();
    renderHistory();
    renderRecordUndo();
  }

  /* 예시 화면: 진짜 기록과 따로, 저장하지 않고 화면에서만 보여 줌 */
  function renderDemo() {
    el.demoBar.hidden = !state.demo;
    el.demoLock.hidden = !state.demo;
    el.form.hidden = state.demo || Boolean(state.done);
    $('doneBox').hidden = state.demo || !state.done;
    if (state.demo) root.setAttribute('data-demo', '');
    else root.removeAttribute('data-demo');
  }
  function endDemo(goForm) {
    state.demo = false;
    state.confirm = null;
    resetForm();
    el.healthForm.reset();
    resetPicks(el.healthForm);
    load();
    renderAll();
    if (goForm) focusName();
    else $(panelFromHash() + 'Title').focus();
    say('예시를 끝냈어요. 이제부터 적는 건 진짜 기록이에요.');
  }
  $('demoEnd').addEventListener('click', () => endDemo(false));
  $('demoEndForm').addEventListener('click', () => endDemo(true));

  el.sample.addEventListener('click', () => {
    state.demo = true;
    state.undoMeds = [];
    state.undoRecord = null;
    const t = today();
    const at = (key, h, m) => { const d = parse(key); d.setHours(h, m); return d.toISOString(); };
    state.meds = [
      { id: 'ex1', name: '혈압약 (예시)', times: ['morning'], meal: 'after', tags: ['a30', 'one'], memo: '' },
      { id: 'ex2', name: '비타민 (예시)', times: ['lunch'], meal: 'after', tags: ['water'], memo: '' },
      { id: 'ex3', name: '위장약 (예시)', times: ['morning', 'evening'], meal: 'before', tags: ['b30'], memo: '속이 쓰릴 때 꼭 챙기기' },
      { id: 'ex4', name: '골다공증약 (예시)', times: ['morning'], meal: 'before', tags: ['water'], memo: '', repeat: { type: 'week', days: [(parse(t).getDay() + 2) % 7] } }
    ].map(normalizeMed);
    state.log = {};
    state.health = {};
    [1, 2, 3].forEach((n) => {
      const key = addDays(t, -n);
      const done = { 'ex1@morning': at(key, 8, 10), 'ex3@morning': at(key, 7, 40), 'ex2@lunch': at(key, 12, 30) };
      if (n !== 2) done['ex3@evening'] = at(key, 18, 20);
      state.log[key] = { total: 4, done };
      state.health[key] = { mood: n === 2 ? 'soso' : 'good', memo: n === 2 ? '조금 피곤했어요' : '', at: at(key, 21, 0) };
    });
    state.log[t] = { total: 4, done: { 'ex3@morning': at(t, 7, 40), 'ex1@morning': at(t, 8, 10) } };
    renderAll();
    $('demoEnd').focus();
    say('예시 화면이에요. 마음껏 눌러 보셔도 저장되지 않아요. 다 보셨으면 예시 끝내기를 눌러 주세요.');
  });

  /* 약 목록 링크 공유
     링크에는 약 이름 · 먹는 때 · 식사 전후 · 간단 메모만 담음 (비고 · 기록은 빼고)
     주소 # 뒤에 넣어 서버로 전송되지 않음. TAGS 순서는 바꾸지 말 것 (예전 링크가 깨짐) */
  const TIME_BITS = { morning: 1, lunch: 2, evening: 4, bed: 8 };
  const MEAL_CODE = { before: 'b', after: 'a', any: 'n' };
  const TAG_KEYS = Object.keys(TAGS);
  const b64encode = (str) => {
    let bin = '';
    new TextEncoder().encode(str).forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const b64decode = (code) => {
    const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  };
  const compactDay = (k) => (k ? k.replace(/-/g, '') : '');
  const fullDay = (c) => (/^\d{8}$/.test(c) ? c.slice(0, 4) + '-' + c.slice(4, 6) + '-' + c.slice(6) : '');
  const packRepeat = (r) => (r.type === 'week' ? 'w' + r.days.reduce((n, d) => n | (1 << d), 0).toString(16)
    : r.type === 'every' ? 'e' + r.n + '.' + compactDay(r.from) : '');
  function unpackRepeat(c) {
    if (/^w[0-9a-f]+$/.test(c || '')) {
      const b = parseInt(c.slice(1), 16);
      return { type: 'week', days: [0, 1, 2, 3, 4, 5, 6].filter((d) => b & (1 << d)) };
    }
    const m = /^e(\d+)\.(\d{8})$/.exec(c || '');
    return m ? { type: 'every', n: Number(m[1]), from: fullDay(m[2]) } : { type: 'daily' };
  }
  const timesCode = (st) => (SLOTS.every((s) => st[s.id] === DEFAULT_TIMES[s.id]) ? '' : SLOTS.map((s) => st[s.id].replace(':', '')).join(''));
  function packMeds(meds, slotTimes) {
    const body = meds.map((m) => [
      m.name.replace(/[~|]/g, ' ').trim(),
      m.times.reduce((n, t) => n | (TIME_BITS[t] || 0), 0).toString(16),
      MEAL_CODE[m.meal] || 'a',
      m.tags.reduce((n, t) => { const i = TAG_KEYS.indexOf(t); return i < 0 ? n : n | (1 << i); }, 0).toString(16),
      packRepeat(m.repeat),
      compactDay(m.until)
    ].join('~')).join('|');
    return b64encode('2|' + timesCode(slotTimes || state.slotTimes) + '|' + body);
  }
  function unpackMeds(code) {
    try {
      const parts = b64decode(code).split('|');
      const ver = parts.shift();
      let slotTimes = null;
      if (ver === '2') {
        const tc = parts.shift() || '';
        if (/^\d{16}$/.test(tc)) {
          slotTimes = {};
          SLOTS.forEach((s, i) => { slotTimes[s.id] = tc.slice(i * 4, i * 4 + 2) + ':' + tc.slice(i * 4 + 2, i * 4 + 4); });
        }
      } else if (ver !== '1') return null;
      if (!parts.length || parts.length > 30) return null;
      const meds = parts.map((p) => {
        const [name, t, meal, g, rp, un] = p.split('~');
        const tb = parseInt(t, 16);
        const gb = parseInt(g, 16) || 0;
        const times = SLOTS.map((s) => s.id).filter((k) => tb & TIME_BITS[k]);
        const n = String(name || '').trim().slice(0, 30);
        if (!n || !times.length) return null;
        return {
          name: n,
          times,
          meal: Object.keys(MEAL_CODE).find((k) => MEAL_CODE[k] === meal) || 'after',
          tags: TAG_KEYS.filter((k, i) => gb & (1 << i)),
          memo: '',
          repeat: unpackRepeat(rp),
          until: fullDay(un || '')
        };
      });
      if (!meds.every(Boolean)) return null;
      meds.forEach(normalizeMed);
      return { meds, slotTimes };
    } catch (e) { return null; }
  }
  const shareUrl = () => location.href.split('#')[0] + '#share=' + packMeds(state.meds);
  const sameTimes = (a) => !a || SLOTS.every((s) => a[s.id] === state.slotTimes[s.id]);

  /* 아이폰 홈 화면 앱: 링크가 사파리로 열려서, 받은 링크를 붙여 넣어 받기 */
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  $('pasteForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('pasteInput');
    const m = /#share=([A-Za-z0-9_-]+)/.exec(input.value.trim());
    const ok = m && unpackMeds(m[1]);
    showError(input, $('pasteError'), ok ? '' : '약 목록 링크가 아니에요. 카톡에서 받은 링크 전체를 길게 눌러 복사한 뒤 붙여 넣어 주세요.');
    if (!ok) { input.focus(); return; }
    input.value = '';
    location.hash = 'share=' + m[1];
  });

  /* 보내기 */
  const shareBtn = $('shareBtn');
  shareBtn.hidden = typeof navigator.share !== 'function';
  function showLink(url) {
    $('shareLink').value = url;
    $('shareLinkBox').hidden = false;
  }
  shareBtn.addEventListener('click', () => {
    navigator.share({ title: '아 맞다 약! - 약 목록', text: '약 목록을 보내요. 링크를 누르면 약이 들어가요.', url: shareUrl() })
      .then(() => say('약 목록 링크를 보냈어요.'))
      .catch((e) => { if (e && e.name !== 'AbortError') { showLink(shareUrl()); say('보내기가 안 돼서 링크를 아래에 보여 드려요.'); } });
  });
  $('copyBtn').addEventListener('click', () => {
    const url = shareUrl();
    const done = () => say('링크를 복사했어요. 카톡 대화창에 붙여 넣어 보내세요.');
    const fail = () => {
      showLink(url);
      $('shareLink').focus();
      $('shareLink').select();
      say('자동 복사가 안 돼요. 아래 링크를 길게 눌러 복사해 주세요.');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, fail);
    else fail();
  });

  /* 받기 (링크로 열었을 때) */
  let incoming = null;
  function openImport() {
    const m = location.hash.match(/^#share=(.*)$/);
    if (!m) return;
    if (state.demo) { state.demo = false; load(); renderAll(); }
    incoming = unpackMeds(m[1]);
    const inApp = /KAKAOTALK/i.test(navigator.userAgent);
    if (incoming && packMeds(incoming.meds) === packMeds(state.meds) && sameTimes(incoming.slotTimes)) {
      incoming = null;
      history.replaceState(null, '', '#today');
      say('이미 같은 약 목록이 들어 있어요.');
      return;
    }
    /* 카톡 안 브라우저에 저장하면 나중에 못 찾으니 기본 인터넷 앱으로 열기 */
    if (incoming && inApp) location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(location.href);

    const has = state.meds.length > 0;
    el.importList.innerHTML = incoming ? incoming.meds.map((med) => {
      const times = SLOTS.filter((s) => med.times.includes(s.id)).map((s) => s.label).join(' · ');
      return '<li class="import__item"><p class="import__name">' + esc(med.name) + '</p><p>' + times + ' · ' + medNote(med).map(esc).join(' · ') + '</p>' +
        '<p><strong>' + repeatText(med) + '</strong>' + (med.until ? ' · ' + untilText(med) : '') + '</p></li>';
    }).join('') + (incoming.slotTimes && !sameTimes(incoming.slotTimes)
      ? '<li class="import__item"><p class="import__name">먹는 시각도 바뀌어요</p><p>' + SLOTS.map((s) => s.label + ' ' + fmtClock(incoming.slotTimes[s.id])).join(' · ') + '</p></li>' : '') : '';
    el.importLead.textContent = !incoming
      ? '링크가 잘못됐거나 중간에 잘렸어요. 보내 주신 분께 다시 보내 달라고 해 주세요.'
      : (inApp ? '카카오톡 안에서 열렸어요. 인터넷 앱이 새로 열리면 거기서 눌러 주세요. ' : '') +
        '약 ' + incoming.meds.length + '개가 들어 있어요. ' + (has ? '지금 등록한 약 ' + state.meds.length + '개 대신 이 목록으로 바꿀까요?' : '이 약들을 등록할까요?');
    el.importNote.hidden = !incoming || !has;
    if (incoming && isIOS && !standalone) {
      el.importLead.textContent += ' 홈 화면에 추가한 앱을 쓰신다면, 이 화면이 아니라 앱의 [약 등록 → 받은 링크로 약 넣기]에 링크를 붙여 넣어 주세요.';
    }
    $('importYes').hidden = !incoming;
    $('importYesText').textContent = has ? '받은 목록으로 바꾸기' : '이 약 등록하기';
    $('importNoText').textContent = incoming ? '안 받을래요' : '닫기';
    el.importBox.hidden = false;
    window.scrollTo(0, 0);
    $('importTitle').focus({ preventScroll: true });
  }
  function closeImport() {
    incoming = null;
    el.importBox.hidden = true;
    if (location.hash.indexOf('#share=') === 0) history.replaceState(null, '', '#today');
    showPanel(panelFromHash(), true);
  }
  $('importYes').addEventListener('click', () => {
    if (!incoming) return;
    const old = state.meds;
    const stamp = Date.now().toString(36);
    const used = new Set();
    /* 이름이 같은 약은 그대로 이어 받기 (오늘 먹은 기록 · 비고 유지) */
    if (incoming.slotTimes) state.slotTimes = Object.assign({}, incoming.slotTimes);
    const next = incoming.meds.map((m, i) => {
      /* 이름이 같은 약끼리 하나씩만 짝지음 (같은 약이 두 번 묶이지 않게) */
      const same = old.find((o) => !used.has(o.id) && normName(o.name) === normName(m.name));
      if (same) used.add(same.id);
      return Object.assign({}, m, { id: same ? same.id : 'm' + stamp + i, memo: same ? same.memo : '' });
    });
    old.filter((o) => !next.some((n) => n.id === o.id)).forEach((o) => keepMedUndo(o));
    state.meds = next;
    state.confirm = null;
    if (state.edit) resetForm();
    const count = next.length;
    save();
    renderAll();
    closeImport();
    say('받은 약 ' + count + '개를 넣었어요. 오늘 먹을 약에 나와요.');
  });
  $('importNo').addEventListener('click', () => {
    const had = Boolean(incoming);
    closeImport();
    if (had) say('받은 약 목록을 넣지 않았어요.');
  });

  /* 먹는 시각 정하기 */
  const timeForm = $('timeForm');
  function renderTimes() {
    SLOTS.forEach((s) => { $('time-' + s.id).value = state.slotTimes[s.id]; });
  }
  timeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const next = {};
    SLOTS.forEach((s) => { next[s.id] = $('time-' + s.id).value; });
    const empty = SLOTS.find((s) => !/^\d{2}:\d{2}$/.test(next[s.id]));
    const wrong = !empty && SLOTS.find((s, i) => i > 0 && toMin(next[s.id]) <= toMin(next[SLOTS[i - 1].id]));
    const err = $('timeError');
    err.textContent = empty ? empty.label + ' 시각을 정해 주세요.'
      : wrong ? '아침 → 점심 → 저녁 → 자기 전 순서로 시각을 정해 주세요. ' + wrong.label + ' 시각이 앞 시각보다 빨라요.' : '';
    err.hidden = !err.textContent;
    if (empty || wrong) { $('time-' + (empty || wrong).id).focus(); return; }
    state.slotTimes = next;
    save();
    renderAll();
    say('먹는 시각을 저장했어요. ' + SLOTS.map((s) => s.label + ' ' + fmtClock(next[s.id])).join(', '));
  });
  $('timeDefault').addEventListener('click', () => {
    SLOTS.forEach((s) => { $('time-' + s.id).value = DEFAULT_TIMES[s.id]; });
    say('처음 시각으로 바꿨어요. 시각 저장을 눌러야 적용돼요.');
  });

  /* 웹 푸시 알림 (서버 붙이면 사용)
     - PUSH.publicKey(VAPID 공개 키)와 PUSH.endpoint(구독 저장 주소)를 넣으면 '알림 받기'가 나타남
     - 서버로 보내는 것: 구독 정보 + 시간대별 시각과 '언제 먹는지' 규칙만 (약 이름 · 비고 · 기록은 보내지 않음)
       POST endpoint  { action: 'subscribe' | 'update', subscription, schedule }
       POST endpoint  { action: 'unsubscribe', endpoint }
     - 서버는 schedule을 보고 정한 시각에 sw.js로 { title, body, slot }을 보냄
     - 아이폰은 iOS 16.4 이상 + 홈 화면에 추가한 앱에서만 알림을 받을 수 있음 */
  const PUSH = { publicKey: '', endpoint: '' };
  const pushReady = () => Boolean(PUSH.publicKey && PUSH.endpoint) && 'serviceWorker' in navigator && 'PushManager' in window;
  const keyToBytes = (b64) => {
    const raw = atob((b64 + '='.repeat((4 - b64.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  };
  function pushSchedule() {
    return {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dayStartHour: DAY_START_HOUR,
      slots: SLOTS.flatMap((s) => {
        const groups = {};
        state.meds.filter((m) => m.times.includes(s.id)).forEach((m) => {
          const off = doseOffset(m, s.id);
          (groups[off] = groups[off] || []).push({ repeat: m.repeat, until: m.until });
        });
        return Object.keys(groups).map(Number).sort((a, b) => a - b).map((off) => ({
          slot: s.id,
          time: addMin(state.slotTimes[s.id], off),
          kind: s.id === 'bed' ? 'bed' : off < 0 ? 'before' : off > 0 ? 'after' : 'with',
          rules: groups[off]
        }));
      })
    };
  }
  const postPush = (body) => fetch(PUSH.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let pushTimer = null;
  function pushSync() {
    if (!pushReady() || store.get('pill-push') !== '1') return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription().then((sub) => {
          if (sub) return { sub, action: 'update' };
          /* 브라우저가 알림 주소를 바꿨으면 다시 받기 */
          if (!('Notification' in window) || Notification.permission !== 'granted') return null;
          return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(PUSH.publicKey) })
            .then((s) => ({ sub: s, action: 'subscribe' }));
        }))
        .then((r) => r && postPush({ action: r.action, subscription: r.sub, schedule: pushSchedule() }))
        .then((res) => { if (res && res.ok) store.set('pill-push-sync', String(Date.now())); })
        .catch(() => { /* 다음 저장 · 다음 실행 때 다시 보냄 */ });
    }, 1500);
  }
  /* 서버는 90일 동안 소식이 없으면 구독을 지우므로, 7일마다 한 번 다시 알려 줌 */
  const pushStale = () => Date.now() - (Number(store.get('pill-push-sync')) || 0) > 7 * 86400000;
  function renderPush(message) {
    el.pushBox.hidden = !pushReady();
    if (el.pushBox.hidden) return;
    const on = store.get('pill-push') === '1';
    const blocked = 'Notification' in window && Notification.permission === 'denied';
    const needHome = isIOS && !standalone;
    $('pushBtnText').textContent = on ? '알림 끄기' : '동의하고 알림 받기';
    $('pushAgreeBox').hidden = on;
    $('pushAgreeMore').hidden = on;
    $('pushBtn').disabled = blocked || needHome;
    $('pushState').textContent = message || (needHome ? '아이폰은 홈 화면에 추가한 앱에서만 알림을 받을 수 있어요. 공유 버튼 → [홈 화면에 추가]를 눌러 주세요.'
      : blocked ? '알림이 꺼져 있어요. 휴대폰 [설정 → 알림]에서 이 앱의 알림을 켜 주세요.'
      : on ? '알림을 받고 있어요.' : '');
  }
  $('pushBtn').addEventListener('click', () => {
    const on = store.get('pill-push') === '1';
    /* 켜기 전에 저장 항목 동의 받기 */
    if (!on) {
      const agree = $('pushAgree');
      showError(agree, $('pushAgreeError'), agree.checked ? '' : '알림을 받으려면 위 동의 칸에 체크해 주세요.');
      if (!agree.checked) { agree.focus(); return; }
      store.set('pill-push-consent', new Date().toISOString());
    }
    navigator.serviceWorker.ready.then((reg) => {
      if (on) {
        return reg.pushManager.getSubscription().then((sub) => {
          if (!sub) return null;
          return postPush({ action: 'unsubscribe', endpoint: sub.endpoint }).then(() => sub.unsubscribe());
        }).then(() => { store.set('pill-push', '0'); renderPush('알림을 껐어요.'); say('알림을 껐어요.'); });
      }
      return Notification.requestPermission().then((perm) => {
        if (perm !== 'granted') { renderPush(); return null; }
        return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(PUSH.publicKey) })
          .then((sub) => postPush({ action: 'subscribe', subscription: sub, schedule: pushSchedule() }))
          .then((res) => {
            if (res && !res.ok) throw new Error('server');
            store.set('pill-push', '1');
            store.set('pill-push-sync', String(Date.now()));
            renderPush('알림을 켰어요. 정한 시각에 알려 드려요.');
            say('알림을 켰어요.');
          });
      });
    }).catch(() => { renderPush('지금은 알림을 켤 수 없어요. 잠시 뒤 다시 눌러 주세요.'); });
  });

  /* 홈 화면에 추가 안내
     - 안드로이드(크롬 · 삼성 인터넷): 브라우저가 주는 설치 창을 버튼으로 띄움
     - 아이폰 · 그 밖: 직접 하는 순서를 보여 줌
     - '나중에 할게요'는 14일 동안 숨김, 카톡 안 브라우저 · 예시 화면에서는 숨김 */
  let installEvent = null;
  const INSTALL_HIDE_DAYS = 14;
  function renderInstall() {
    const box = $('installBox');
    const later = Number(store.get('pill-install-later')) || 0;
    const inApp = /KAKAOTALK|NAVER|Instagram|FBAN|FBAV/i.test(navigator.userAgent);
    box.hidden = standalone || inApp || state.demo || Date.now() - later < INSTALL_HIDE_DAYS * 86400000;
    if (box.hidden) return;
    const steps = isIOS
      ? ['화면 아래(아이패드는 위)의 <strong>공유 버튼</strong>(네모에서 화살표가 위로 나온 모양)을 눌러요.', '목록을 내려서 <strong>[홈 화면에 추가]</strong>를 눌러요.', '오른쪽 위 <strong>[추가]</strong>를 누르면 끝이에요.']
      : ['화면 위나 아래의 <strong>메뉴 버튼</strong>(점 세 개 또는 줄 세 개)을 눌러요.', '<strong>[홈 화면에 추가]</strong> 또는 <strong>[앱 설치]</strong>를 눌러요.', '<strong>[추가]</strong> 또는 <strong>[설치]</strong>를 누르면 끝이에요.'];
    $('installBtn').hidden = !installEvent;
    $('installSteps').hidden = Boolean(installEvent);
    $('installSteps').innerHTML = steps.map((t) => '<li>' + t + '</li>').join('');
    $('installNote').hidden = !(isIOS && state.meds.length);
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e;
    renderInstall();
  });
  $('installBtn').addEventListener('click', () => {
    if (!installEvent) return;
    installEvent.prompt();
    installEvent.userChoice.then((r) => {
      installEvent = null;
      renderInstall();
      if (r.outcome !== 'accepted') say('홈 화면 추가를 그만뒀어요. 언제든 다시 누르실 수 있어요.');
    });
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    $('installBox').hidden = true;
    say('홈 화면에 추가했어요. 이제 첫 화면의 아이콘을 눌러 여세요.');
  });
  $('installLater').addEventListener('click', () => {
    store.set('pill-install-later', String(Date.now()));
    $('installBox').hidden = true;
    $('todayTitle').focus();
    say('안내를 닫았어요. 2주 뒤에 다시 알려 드릴게요.');
  });

  /* 화면(메뉴) 전환: 한 화면에 한 가지 목적 */
  function panelFromHash() {
    const hash = location.hash.slice(1);
    return PANELS.includes(hash) ? hash : 'today';
  }
  function showPanel(id, focus) {
    PANELS.forEach((p) => { $(p).hidden = p !== id; });
    /* 다른 화면에 갔다 오면 완료 카드 대신 새 약 적는 칸 */
    if (id !== 'meds' && state.done) { state.done = null; renderDemo(); }
    document.querySelectorAll('.gnb__link').forEach((a) => {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (id === 'today') { renderToday(); renderInstall(); }
    if (id === 'history') renderHistory();
    if (id === 'times') { renderTimes(); renderPush(); $('timeError').hidden = true; }
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
  window.addEventListener('popstate', () => showPanel(panelFromHash(), true));

  /* 날짜가 바뀌었을 때 (화면을 켜 둔 채 자정이 지나면) */
  let lastDay = today();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && today() !== lastDay) {
      lastDay = today();
      renderAll();
    }
  });

  /* 시작 */
  setSize(Number(store.get('pill-size')) || 0);
  setContrast(store.get('pill-contrast') === '1');
  load();
  renderAll();
  save();
  fillSelects(null);
  syncSchedule();
  syncName();
  resetPicks();
  showPanel(panelFromHash(), false);
  openImport();
  if (pushStale()) pushSync();
  /* 홈 화면 앱 · 알림용 서비스 워커 (https에서만) */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* 무시 */ });
  }
  /* 저장 공간이 부족해도 기록을 지우지 말아 달라고 요청 (홈 화면 앱은 대부분 허락됨) */
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { /* 무시 */ });
  window.addEventListener('hashchange', openImport);
})();

/* 보기 설정 접기 (모바일) */
(() => {
  const set = document.querySelector('.view-set');
  const btn = document.getElementById('viewBtn');
  if (!set || !btn) return;
  set.classList.add('view-set--ready');
  btn.addEventListener('click', () => {
    const open = !set.classList.contains('is-open');
    set.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
  });
})();
