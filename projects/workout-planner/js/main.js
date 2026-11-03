(() => {
  'use strict';

  /* 저장소 (localStorage를 쓸 수 없어도 동작) */
  const KEY = { records: 'fr-records', goal: 'fr-goal', my: 'fr-my-routine' };

  const store = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    }
  };

  /* 날짜 도우미 (로컬 시간 기준) */
  const pad = (n) => String(n).padStart(2, '0');
  const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const startOfWeek = (d) => addDays(d, -((d.getDay() + 6) % 7)); // 월요일 시작

  const getRecords = () => {
    const list = store.get(KEY.records, []);
    return new Set(Array.isArray(list) ? list.filter((v) => /^\d{4}-\d{2}-\d{2}$/.test(v)) : []);
  };
  const saveRecords = (set) => store.set(KEY.records, [...set].sort());

  /* SVG 아이콘 만들기 */
  const makeIcon = (name, className) => {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    const use = document.createElementNS(ns, 'use');
    svg.setAttribute('class', `ico ${className || ''}`.trim());
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    use.setAttribute('href', `#${name}`);
    svg.append(use);
    return svg;
  };

  /* 공통 알림창 */
  function showAlert({ title, message, type = 'success', okText = '확인', cancelText = '' }) {
    const box = document.getElementById('alert');
    return new Promise((resolve) => {
      if (!box || typeof box.showModal !== 'function') {
        resolve(cancelText ? window.confirm(message) : true);
        return;
      }
      const ok = document.getElementById('alert-ok');
      const cancel = document.getElementById('alert-cancel');
      box.dataset.type = type;
      box.querySelector('.alert__ico use').setAttribute('href', type === 'success' ? '#i-check' : '#i-alert');
      document.getElementById('alert-title').textContent = title;
      document.getElementById('alert-message').textContent = message;
      ok.textContent = okText;
      cancel.textContent = cancelText;
      cancel.hidden = !cancelText;
      box.returnValue = '';
      box.addEventListener('close', () => resolve(box.returnValue === 'ok'), { once: true });
      box.showModal();
      (cancelText ? cancel : ok).focus(); // 위험한 동작은 취소에 먼저 포커스
    });
  }

  /* 입력 오류 표시 */
  function setError(input, message) {
    const error = document.getElementById(`${input.id}-error`);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (!error) return;
    error.querySelector('[data-msg]').textContent = message;
    error.hidden = !message;
  }

  function checkNumber(input, min, max) {
    const raw = input.value.trim();
    const n = Number(raw);
    const ok = raw !== '' && Number.isInteger(n) && n >= min && n <= max;
    setError(input, ok ? '' : `${min}~${max} 사이의 숫자를 입력해 주세요.`);
    return ok ? n : null;
  }

  /* ===== 부위별 루틴 탭 ===== */
  function initTabs() {
    const tablist = document.querySelector('[role="tablist"]');
    if (!tablist) return;
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];

    const select = (tab, { focus = false, updateHash = true } = {}) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      if (updateHash) history.replaceState(null, '', `#${tab.dataset.part}`);
    };

    tablist.addEventListener('click', (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (tab) select(tab);
    });

    // 방향키 · Home · End 로 탭 이동
    tablist.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const last = tabs.length - 1;
      const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select(tabs[next], { focus: true });
    });

    const fromHash = tabs.find((t) => `#${t.dataset.part}` === location.hash);
    if (fromHash) select(fromHash, { updateHash: false });
  }

  /* ===== 운동 타이머 ===== */
  function initTimer() {
    const form = document.getElementById('timer-form');
    if (!form) return;

    const $ = (id) => document.getElementById(id);
    const el = {
      name: $('timer-name-input'), work: $('timer-work'), rest: $('timer-rest'), sets: $('timer-sets'),
      fieldset: $('timer-fieldset'), title: $('timer-name'), ring: $('ring'), bar: $('ring-bar'),
      phase: $('timer-phase'), time: $('timer-time'), set: $('timer-set'), dots: $('timer-dots'),
      toggle: $('timer-toggle'), toggleText: $('timer-toggle-text'), reset: $('timer-reset'),
      skip: $('timer-skip'), skipText: $('timer-skip-text'), goal: $('timer-goal'),
      sound: $('timer-sound'), status: $('timer-status')
    };
    const toggleIcon = el.toggle.querySelector('use');
    const CIRCLE = 2 * Math.PI * 54;
    const LABEL = { ready: '준비', work: '운동', rest: '휴식', done: '완료' };
    const state = { phase: 'ready', set: 1, remain: 0, total: 0, end: 0, timerId: null, cfg: null };
    let audio = null;

    el.bar.setAttribute('stroke-dasharray', CIRCLE.toFixed(2));

    // 주소의 값으로 미리 채우기 (예: timer.html?name=스쿼트&sets=4&rest=90)
    const params = new URLSearchParams(location.search);
    ['name', 'work', 'rest', 'sets'].forEach((key) => {
      const value = params.get(key);
      if (value !== null) el[key].value = key === 'name' ? value.slice(0, 20) : value;
    });

    // 목표 횟수 (루틴에서 넘어온 경우)
    const reps = (params.get('reps') || '').trim().slice(0, 12);
    if (reps) {
      el.goal.textContent = `세트마다 목표 ${/^\d+$/.test(reps) ? `${reps}회` : reps}`;
      el.goal.hidden = false;
    }

    const format = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
    const announce = (text) => { el.status.textContent = text; };
    const isActive = () => state.phase === 'work' || state.phase === 'rest';

    function beep(freq = 880, duration = 0.15) {
      if (el.sound.getAttribute('aria-pressed') !== 'true') return;
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        audio = audio || new Ctx();
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
        osc.connect(gain).connect(audio.destination);
        osc.start();
        osc.stop(audio.currentTime + duration);
      } catch (e) { /* 소리를 낼 수 없는 환경은 무시 */ }
    }

    function readConfig() {
      const work = checkNumber(el.work, 5, 600);
      const rest = checkNumber(el.rest, 0, 600);
      const sets = checkNumber(el.sets, 1, 20);
      if (work === null || rest === null || sets === null) return null;
      return { name: el.name.value.trim(), work, rest, sets };
    }

    function renderDots() {
      const { sets } = state.cfg;
      if (el.dots.children.length !== sets) {
        el.dots.replaceChildren(...Array.from({ length: sets }, () => {
          const li = document.createElement('li');
          li.className = 'timer__dot';
          return li;
        }));
      }
      [...el.dots.children].forEach((dot, i) => {
        const index = i + 1;
        const done = state.phase === 'done' || index < state.set || (index === state.set && state.phase === 'rest');
        dot.dataset.state = done ? 'done' : (index === state.set && isActive() ? 'current' : '');
      });
    }

    function render() {
      const ratio = state.total ? state.remain / state.total : 1;
      el.ring.dataset.phase = state.phase;
      el.phase.textContent = LABEL[state.phase];
      el.time.textContent = format(state.remain);
      el.set.textContent = `${Math.min(state.set, state.cfg.sets)} / ${state.cfg.sets} 세트`;
      el.bar.setAttribute('stroke-dashoffset', (CIRCLE * (1 - ratio)).toFixed(2));
      renderDots();
    }

    function setButtons(label, icon) {
      el.toggleText.textContent = label;
      toggleIcon.setAttribute('href', icon);
      el.fieldset.disabled = isActive();
      el.skip.disabled = !isActive();
      el.skipText.textContent = state.phase === 'rest' ? '다음 세트' : '세트 완료';
    }

    function prepare() {
      const cfg = readConfig();
      if (!cfg) return false;
      Object.assign(state, { cfg, phase: 'ready', set: 1, total: cfg.work, remain: cfg.work });
      el.title.textContent = cfg.name || '자유 운동';
      document.title = `${cfg.name ? `${cfg.name} · ` : ''}운동 타이머 | 핏루틴`;
      render();
      return true;
    }

    const stopTick = () => {
      clearInterval(state.timerId);
      state.timerId = null;
    };

    function startPhase(phase) {
      const { cfg } = state;
      state.phase = phase;
      state.total = phase === 'work' ? cfg.work : cfg.rest;
      state.remain = state.total;
      state.end = Date.now() + state.total * 1000;
      announce(phase === 'work' ? `${state.set}세트 운동 시작` : `휴식 ${cfg.rest}초`);
      beep(phase === 'work' ? 880 : 520, 0.25);
      el.skipText.textContent = phase === 'rest' ? '다음 세트' : '세트 완료';
      render();
    }

    function finish() {
      stopTick();
      state.phase = 'done';
      state.remain = 0;
      state.set = state.cfg.sets;
      render();
      setButtons('다시 시작', '#i-play');
      beep(1046, 0.4);

      const records = getRecords();
      records.add(toKey(new Date()));
      const saved = saveRecords(records);
      announce('모든 세트를 마쳤어요');
      showAlert({
        title: '운동 완료!',
        message: `${state.cfg.sets}세트를 모두 마쳤어요.${saved ? ' 오늘 날짜가 주간 기록에 체크됐어요.' : ''}`,
        okText: saved ? '기록 보기' : '확인',
        cancelText: saved ? '닫기' : ''
      }).then((ok) => { if (ok && saved) location.href = 'record.html'; });
    }

    function next() {
      if (state.phase === 'work') {
        if (state.set >= state.cfg.sets) return finish();
        if (state.cfg.rest > 0) return startPhase('rest');
        state.set += 1;
        return startPhase('work');
      }
      state.set += 1;
      return startPhase('work');
    }

    function tick() {
      const left = Math.max(0, Math.ceil((state.end - Date.now()) / 1000));
      if (left !== state.remain) {
        state.remain = left;
        if (left > 0 && left <= 3) beep(660, 0.08); // 마지막 3초 알림
        render();
      }
      if (left === 0) next();
    }

    function play() {
      if (!isActive()) {
        if (!prepare()) {
          form.querySelector('[aria-invalid="true"]').focus();
          return;
        }
        startPhase('work');
      } else {
        state.end = Date.now() + state.remain * 1000;
        announce('다시 시작');
      }
      state.timerId = setInterval(tick, 200);
      setButtons('일시정지', '#i-pause');
    }

    function pause() {
      stopTick();
      setButtons('계속', '#i-play');
      announce('일시정지');
    }

    el.toggle.addEventListener('click', () => (state.timerId ? pause() : play()));

    // 세트 완료 · 휴식 건너뛰고 다음 세트
    el.skip.addEventListener('click', () => {
      if (!isActive()) return;
      next();
      if (state.timerId) state.end = Date.now() + state.remain * 1000;
    });

    // 진행 중에 페이지를 떠나면 확인
    window.addEventListener('beforeunload', (e) => {
      if (!isActive()) return;
      e.preventDefault();
      e.returnValue = '';
    });

    el.reset.addEventListener('click', () => {
      stopTick();
      state.phase = 'ready';
      setButtons('시작', '#i-play');
      if (prepare()) announce('처음으로 돌렸어요');
    });

    el.sound.addEventListener('click', () => {
      const on = el.sound.getAttribute('aria-pressed') !== 'true';
      el.sound.setAttribute('aria-pressed', String(on));
    });

    // 빠른 설정
    form.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-preset]');
      if (!btn) return;
      const [work, rest, sets] = btn.dataset.preset.split(',');
      Object.assign(el.work, { value: work });
      Object.assign(el.rest, { value: rest });
      Object.assign(el.sets, { value: sets });
      if (prepare()) announce(`${btn.textContent.trim()}로 설정했어요`);
    });

    form.addEventListener('input', () => { if (!isActive()) prepare(); });
    form.addEventListener('submit', (e) => e.preventDefault());

    // 다른 탭에 있다 돌아와도 남은 시간을 바로 맞춤
    document.addEventListener('visibilitychange', () => { if (state.timerId) tick(); });

    if (!prepare()) {
      form.reset();
      prepare();
    }
  }

  /* ===== 주간 기록 ===== */
  function initRecord() {
    const list = document.getElementById('week-list');
    if (!list) return;

    const $ = (id) => document.getElementById(id);
    const DOW = ['월', '화', '수', '목', '금', '토', '일'];
    const goalSelect = $('goal-select');
    let records = getRecords();
    let offset = 0;

    const goal = Number(store.get(KEY.goal, 4));
    if (goal >= 1 && goal <= 7) goalSelect.value = String(goal);

    function renderStats() {
      const today = new Date();
      const todayKey = toKey(today);
      const weekStart = startOfWeek(today);
      let week = 0;
      for (let i = 0; i < 7; i += 1) if (records.has(toKey(addDays(weekStart, i)))) week += 1;

      // 연속 운동일: 오늘 기록이 없으면 어제부터 셈
      let streak = 0;
      let day = records.has(todayKey) ? today : addDays(today, -1);
      while (records.has(toKey(day))) {
        streak += 1;
        day = addDays(day, -1);
      }

      const monthPrefix = todayKey.slice(0, 7);
      const month = [...records].filter((k) => k.startsWith(monthPrefix)).length;

      $('stat-week').textContent = week;
      $('stat-streak').textContent = streak;
      $('stat-month').textContent = month;
      $('stat-total').textContent = records.size;

      const target = Number(goalSelect.value);
      const bar = $('goal-bar');
      bar.max = target;
      bar.value = Math.min(week, target);
      bar.textContent = `${week} / ${target}일`;
      $('goal-msg').textContent = week >= target
        ? `목표 달성! 이번 주 ${week}일 운동했어요.`
        : `이번 주 ${week}일 운동 · 목표까지 ${target - week}일 남았어요.`;
    }

    function renderWeek() {
      const today = new Date();
      const todayKey = toKey(today);
      const start = addDays(startOfWeek(today), offset * 7);
      const end = addDays(start, 6);
      const range = `${start.getMonth() + 1}월 ${start.getDate()}일 – ${end.getMonth() + 1}월 ${end.getDate()}일`;
      $('week-title').textContent = offset === 0 ? `이번 주 · ${range}` : range;

      list.replaceChildren(...DOW.map((dow, i) => {
        const date = addDays(start, i);
        const key = toKey(date);
        const isToday = key === todayKey;
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `week__day${isToday ? ' week__day--today' : ''}`;
        btn.dataset.date = key;
        btn.disabled = date > today && !isToday;
        btn.setAttribute('aria-pressed', String(records.has(key)));
        btn.setAttribute('aria-label', `${date.getMonth() + 1}월 ${date.getDate()}일 ${dow}요일${isToday ? ', 오늘' : ''}`);

        const dowEl = document.createElement('span');
        dowEl.className = 'week__dow';
        dowEl.textContent = dow;
        const dateEl = document.createElement('span');
        dateEl.className = 'week__date';
        dateEl.textContent = date.getDate();
        btn.append(dowEl, dateEl, makeIcon('i-check', 'week__mark'));
        if (isToday) {
          const badge = document.createElement('span');
          badge.className = 'week__badge';
          badge.textContent = '오늘';
          btn.append(badge);
        }
        li.append(btn);
        return li;
      }));

      $('week-next').disabled = offset >= 0;
      $('week-today').disabled = offset === 0;
    }

    list.addEventListener('click', (e) => {
      const btn = e.target.closest('.week__day');
      if (!btn || btn.disabled) return;
      const key = btn.dataset.date;
      const on = !records.has(key);
      if (on) records.add(key); else records.delete(key);
      saveRecords(records);
      btn.setAttribute('aria-pressed', String(on));
      renderStats();
    });

    $('week-prev').addEventListener('click', () => { offset -= 1; renderWeek(); });
    $('week-next').addEventListener('click', () => { if (offset < 0) { offset += 1; renderWeek(); } });
    $('week-today').addEventListener('click', () => { offset = 0; renderWeek(); });

    goalSelect.addEventListener('change', () => {
      store.set(KEY.goal, Number(goalSelect.value));
      renderStats();
    });

    // 다른 탭(타이머)에서 기록이 바뀌면 다시 그림
    window.addEventListener('storage', (e) => {
      if (e.key !== KEY.records) return;
      records = getRecords();
      renderWeek();
      renderStats();
    });

    renderWeek();
    renderStats();
  }

  /* ===== 나만의 루틴 ===== */
  function initMyRoutine() {
    const form = document.getElementById('my-form');
    if (!form) return;

    const $ = (id) => document.getElementById(id);
    const list = $('my-list');
    const tpl = $('my-item-tpl');
    const field = { name: $('my-name'), part: $('my-part'), sets: $('my-sets'), reps: $('my-reps'), rest: $('my-rest') };

    const saved = store.get(KEY.my, []);
    let items = Array.isArray(saved)
      ? saved.filter((v) => v && typeof v.id === 'string' && typeof v.name === 'string')
      : [];

    const save = () => store.set(KEY.my, items);
    const announce = (text) => { $('my-status').textContent = text; };

    function checkName() {
      const ok = field.name.value.trim() !== '';
      setError(field.name, ok ? '' : '운동 이름을 입력해 주세요.');
      return ok;
    }

    function buildItem(item) {
      const node = tpl.content.firstElementChild.cloneNode(true);
      const query = new URLSearchParams({ name: item.name, sets: item.sets, rest: item.rest, reps: item.reps });
      node.querySelector('[data-field="part"]').textContent = item.part;
      node.querySelector('[data-field="name"]').textContent = item.name;
      node.querySelector('[data-field="meta"]').textContent = `${item.sets}세트 × ${item.reps}회 · 휴식 ${item.rest}초`;
      node.querySelector('[data-field="timer"]').href = `timer.html?${query}`;
      node.querySelector('[data-field="timer"]').setAttribute('aria-label', `${item.name} 타이머로 시작`);
      const del = node.querySelector('[data-act="delete"]');
      del.dataset.id = item.id;
      del.setAttribute('aria-label', `${item.name} 삭제`);
      return node;
    }

    function render() {
      const totalSets = items.reduce((sum, item) => sum + Number(item.sets || 0), 0);
      $('my-count').textContent = items.length ? `${items.length}개 운동 · 총 ${totalSets}세트` : '0개 운동';
      $('my-empty').hidden = items.length > 0;
      list.replaceChildren(...items.map(buildItem));
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const okName = checkName();
      const sets = checkNumber(field.sets, 1, 10);
      const reps = checkNumber(field.reps, 1, 100);
      if (!okName || sets === null || reps === null) {
        form.querySelector('[aria-invalid="true"]').focus();
        return;
      }
      const item = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: field.name.value.trim().slice(0, 20),
        part: field.part.value,
        sets,
        reps,
        rest: Number(field.rest.value)
      };
      items.push(item);
      save();
      render();
      form.reset();
      announce(`‘${item.name}’을(를) 내 루틴에 추가했어요.`);
      field.name.focus();
    });

    // 오류가 표시된 칸은 입력할 때마다 다시 확인
    form.addEventListener('input', (e) => {
      const input = e.target;
      if (input.getAttribute('aria-invalid') !== 'true') return;
      if (input === field.name) checkName();
      if (input === field.sets) checkNumber(field.sets, 1, 10);
      if (input === field.reps) checkNumber(field.reps, 1, 100);
    });

    list.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-act="delete"]');
      if (!btn) return;
      const item = items.find((v) => v.id === btn.dataset.id);
      if (!item) return;
      const ok = await showAlert({
        type: 'error',
        title: '운동을 삭제할까요?',
        message: `‘${item.name}’을(를) 내 루틴에서 지워요. 되돌릴 수 없어요.`,
        okText: '삭제',
        cancelText: '취소'
      });
      if (!ok) {
        btn.focus();
        return;
      }
      items = items.filter((v) => v.id !== item.id);
      save();
      render();
      announce(`‘${item.name}’을(를) 삭제했어요.`);
      $('list-title').focus();
    });

    render();
  }

  initTabs();
  initTimer();
  initRecord();
  initMyRoutine();
})();
