(() => {
  'use strict';

  /* 기본 요소 */
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const PANELS = ['today', 'meds', 'health', 'history'];
  const SIZE_LABELS = ['보통', '크게', '아주 크게'];
  const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
  const SLOTS = [
    { id: 'morning', label: '아침', icon: 'sunrise' },
    { id: 'lunch', label: '점심', icon: 'sun' },
    { id: 'evening', label: '저녁', icon: 'sunset' },
    { id: 'bed', label: '자기 전', icon: 'moon' }
  ];
  const MEALS = { before: '식사 전', after: '식사 후', any: '식사와 상관없이' };
  const MOODS = { good: '좋아요', soso: '보통이에요', bad: '안 좋아요' };
  const KEEP_DAYS = 60;

  const el = {
    today: $('todayText'),
    progressBox: $('progressBox'),
    progressText: $('progressText'),
    progressBar: $('progressBar'),
    todayEmpty: $('todayEmpty'),
    todayEmptyBtn: $('todayEmptyBtn'),
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
  const today = () => toKey(new Date());

  /* 지금 시간대 (참고용) */
  function nowSlot() {
    const h = new Date().getHours();
    if (h < 11) return 'morning';
    if (h < 16) return 'lunch';
    if (h < 21) return 'evening';
    return 'bed';
  }

  /* 상태 */
  const state = {
    meds: [],
    log: {},
    health: {},
    size: 0,
    edit: null,
    confirm: null
  };

  function load() {
    const meds = store.json('pill-meds', []);
    state.meds = Array.isArray(meds) ? meds.filter((m) => m && m.id && m.name && Array.isArray(m.times)) : [];
    state.log = store.json('pill-log', {});
    state.health = store.json('pill-health', {});
  }
  function save() {
    /* 오래된 기록은 정리 */
    const limit = addDays(today(), -KEEP_DAYS);
    Object.keys(state.log).forEach((k) => { if (k < limit) delete state.log[k]; });
    Object.keys(state.health).forEach((k) => { if (k < limit) delete state.health[k]; });
    store.set('pill-meds', JSON.stringify(state.meds));
    store.set('pill-log', JSON.stringify(state.log));
    store.set('pill-health', JSON.stringify(state.health));
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
      state.meds.forEach((m) => { if (m.times.includes(slot.id)) list.push({ med: m, slot: slot.id, key: m.id + '@' + slot.id }); });
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
    el.todayEmpty.hidden = has;
    el.todayEmptyBtn.hidden = has;
    el.progressBox.hidden = !has;

    if (has) {
      const done = Object.keys(day.done).length;
      const all = done === entries.length;
      el.progressText.textContent = all
        ? '오늘 약을 모두 드셨어요. 잘하셨어요!'
        : '오늘 ' + entries.length + '번 중 ' + done + '번 먹었어요. ' + (entries.length - done) + '번 남았어요.';
      el.progressBar.max = entries.length;
      el.progressBar.value = done;
      el.progressBox.classList.toggle('progress--done', all);
    }

    const now = nowSlot();
    el.slotList.innerHTML = SLOTS.map((slot) => {
      const items = entries.filter((e) => e.slot === slot.id);
      if (!items.length) return '';
      const doneCount = items.filter((e) => day.done[e.key]).length;
      const cards = items.map((e) => {
        const takenAt = day.done[e.key];
        const id = 'med-' + e.key.replace('@', '-');
        const info = [MEALS[e.med.meal] || MEALS.after, e.med.memo].filter(Boolean).map(esc).join(' · ');
        return '<li><article class="med-card' + (takenAt ? ' med-card--done' : '') + '" aria-labelledby="' + id + '">' +
          '<h4 class="med-card__name" id="' + id + '">' + esc(e.med.name) + '</h4>' +
          '<p class="med-card__info">' + info + '</p>' +
          (takenAt
            ? '<p class="med-card__state">' + ico('check') + ' ' + fmtTime(takenAt) + '에 먹었어요</p>' +
              '<button type="button" class="btn btn--block" data-act="undo" data-key="' + e.key + '">' + ico('undo') + ' 잘못 눌렀어요 (되돌리기)<span class="sr-only"> - ' + esc(e.med.name) + '</span></button>'
            : '<p class="med-card__state">' + ico('clock') + ' 아직 안 먹었어요</p>' +
              '<button type="button" class="btn btn--primary btn--block" data-act="take" data-key="' + e.key + '">' + ico('check') + ' 먹었어요<span class="sr-only"> - ' + slot.label + ' ' + esc(e.med.name) + '</span></button>') +
          '</article></li>';
      }).join('');
      return '<li><section class="slot" aria-labelledby="slot-' + slot.id + '">' +
        '<header class="slot__head">' +
          '<h3 class="slot__title" id="slot-' + slot.id + '">' + ico(slot.icon) + ' ' + slot.label + '</h3>' +
          (slot.id === now ? '<p class="slot__now">' + ico('clock') + ' 지금 드실 때</p>' : '') +
          '<p class="slot__count">' + items.length + '개 중 ' + doneCount + '개 먹음</p>' +
        '</header>' +
        '<ul class="med-list">' + cards + '</ul>' +
      '</section></li>';
    }).join('');

    if (focusSel) {
      const target = el.slotList.querySelector(focusSel);
      if (target) target.focus();
    }
  }

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
    el.medList.innerHTML = state.meds.map((m) => {
      const times = SLOTS.filter((s) => m.times.includes(s.id)).map((s) => s.label).join(' · ');
      const open = state.confirm === m.id;
      return '<li><article class="my-med" aria-labelledby="my-' + m.id + '">' +
        '<h4 class="my-med__name" id="my-' + m.id + '">' + esc(m.name) + '</h4>' +
        '<p><strong>먹는 때</strong> ' + times + ' (' + (MEALS[m.meal] || MEALS.after) + ')</p>' +
        (m.memo ? '<p><strong>메모</strong> ' + esc(m.memo) + '</p>' : '') +
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
        state.meds = state.meds.filter((m) => m.id !== id);
        if (state.edit === id) resetForm();
        save();
        renderAll();
        el.name.focus();
        say(med.name + '을(를) 지웠어요.');
        break;
    }
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
    state.edit = med.id;
    state.confirm = null;
    el.name.value = med.name;
    el.memo.value = med.memo || '';
    el.form.querySelectorAll('input[name="times"]').forEach((i) => { i.checked = med.times.includes(i.value); });
    el.form.querySelectorAll('input[name="meal"]').forEach((i) => { i.checked = i.value === (med.meal || 'after'); });
    el.formTitle.textContent = med.name + ' 고치기';
    el.submitText.textContent = '고친 내용 저장';
    el.cancelEdit.hidden = false;
    el.form.classList.add('form--edit');
    clearErrors();
    renderMeds();
    el.form.scrollIntoView({ block: 'start' });
    el.name.focus({ preventScroll: true });
    say(med.name + ' 정보를 고칠 수 있어요.');
  }
  function clearErrors() {
    showError(el.name, el.nameError, '');
    showError(el.form.querySelector('.form__group'), el.timesError, '');
  }
  function resetForm() {
    state.edit = null;
    el.form.reset();
    el.formTitle.textContent = '새 약 등록하기';
    el.submitText.textContent = '약 등록하기';
    el.cancelEdit.hidden = true;
    el.form.classList.remove('form--edit');
    clearErrors();
  }

  el.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.name.value.trim();
    const times = checkedTimes();
    const timesGroup = el.form.querySelector('.form__group');
    showError(el.name, el.nameError, name ? '' : '약 이름을 적어 주세요. 예: 혈압약');
    showError(timesGroup, el.timesError, times.length ? '' : '먹는 때를 하나 이상 눌러 주세요. 예: 아침');
    if (!name) { el.name.focus(); return; }
    if (!times.length) { $('t-morning').focus(); return; }

    const meal = (el.form.querySelector('input[name="meal"]:checked') || {}).value || 'after';
    const memo = el.memo.value.trim();
    const wasEdit = state.edit;
    if (wasEdit) {
      Object.assign(findMed(wasEdit), { name, times, meal, memo });
    } else {
      state.meds.push({ id: 'm' + Date.now().toString(36), name, times, meal, memo });
    }
    save();
    resetForm();
    renderAll();
    say(wasEdit ? name + ' 정보를 고쳤어요.' : name + '을(를) 등록했어요. 오늘 먹을 약에 나와요.');
    el.name.focus();
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
      el.healthSaved.innerHTML = ico('check') + ' 오늘 기록: ' + MOODS[rec.mood] + ' (' + fmtTime(rec.at) + ' 저장)';
      const input = el.healthForm.querySelector('input[name="mood"][value="' + rec.mood + '"]');
      if (input) input.checked = true;
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
        ? '<span class="history__status">' + MOODS[rec.mood] + '</span>' + (rec.memo ? '<span class="history__memo">' + esc(rec.memo) + '</span>' : '')
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
    state.log = {};
    state.health = {};
    save();
    el.healthForm.reset();
    renderAll();
    toggleReset(false);
    say('기록을 모두 지웠어요.');
  });

  function renderAll() {
    renderToday();
    renderMeds();
    renderHealth();
    renderHistory();
  }

  /* 화면(메뉴) 전환: 한 화면에 한 가지 목적 */
  function panelFromHash() {
    const hash = location.hash.slice(1);
    return PANELS.includes(hash) ? hash : 'today';
  }
  function showPanel(id, focus) {
    PANELS.forEach((p) => { $(p).hidden = p !== id; });
    document.querySelectorAll('.gnb__link').forEach((a) => {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (id === 'today') renderToday();
    if (id === 'history') renderHistory();
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
  showPanel(panelFromHash(), false);
})();
