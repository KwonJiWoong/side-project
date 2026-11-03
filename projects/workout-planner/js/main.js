(() => {
  'use strict';

  /* 저장소 (localStorage를 쓸 수 없어도 동작) */
  const KEY = {
    records: 'fr-records', goal: 'fr-goal', mode: 'fr-mode', font: 'fr-font', theme: 'fr-theme',
    routines: 'fr-routines', oldMy: 'fr-my-routine'
  };

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

  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const isSenior = () => root.dataset.mode === 'senior';

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

  /* 숫자 범위 확인 (벗어나면 null) */
  const toInt = (v, min, max) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= min && n <= max ? n : null;
  };

  /* 횟수 표시: 숫자만 있으면 '회'를 붙임 */
  const repsLabel = (reps) => (/^\d+$/.test(String(reps)) ? `${reps}회` : String(reps));

  /* 루틴 전체 진행 주소 만들기 */
  const planUrl = (list) => `timer.html?plan=${encodeURIComponent(JSON.stringify(list.map((i) => {
    const o = { n: i.name, s: i.sets, r: i.rest };
    if (i.reps) o.p = repsLabel(i.reps);
    return o;
  })))}`;

  /* 공통 알림창 */
  function showAlert({ title, message, type = 'success', okText = '확인', cancelText = '' }) {
    const box = $('alert');
    return new Promise((resolve) => {
      if (!box || typeof box.showModal !== 'function') {
        resolve(cancelText ? window.confirm(message) : true);
        return;
      }
      const ok = $('alert-ok');
      const cancel = $('alert-cancel');
      box.dataset.type = type;
      box.querySelector('.alert__ico use').setAttribute('href', type === 'success' ? '#i-check' : '#i-alert');
      $('alert-title').textContent = title;
      $('alert-message').textContent = message;
      ok.textContent = okText;
      cancel.textContent = cancelText;
      cancel.hidden = !cancelText;
      box.returnValue = '';
      box.addEventListener('close', () => resolve(box.returnValue === 'ok'), { once: true });
      box.showModal();
      (type === 'error' && cancelText ? cancel : ok).focus(); // 위험한 동작은 취소에 먼저 포커스
    });
  }

  /* 입력 오류 표시 */
  function setError(input, message) {
    const error = $(`${input.id}-error`);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (!error) return;
    error.querySelector('[data-msg]').textContent = message;
    error.hidden = !message;
  }

  function checkNumber(input, min, max) {
    const n = toInt(input.value.trim() === '' ? NaN : input.value.trim(), min, max);
    setError(input, n === null ? `${min}~${max} 사이의 숫자를 입력해 주세요.` : '');
    return n;
  }

  function checkText(input, message) {
    const ok = input.value.trim() !== '';
    setError(input, ok ? '' : message);
    return ok;
  }

  /* ===== 첫 화면: 일반용 / 노약자용 선택 ===== */
  function initModeSelect() {
    const choices = [...document.querySelectorAll('[data-choose-mode]')];
    if (!choices.length) return;
    const current = root.dataset.mode || '';
    choices.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.chooseMode === current)));

    choices.forEach((btn) => btn.addEventListener('click', () => {
      const mode = btn.dataset.chooseMode;
      store.set(KEY.mode, mode);
      location.href = 'routine.html';
    }));
  }

  /* ===== 화면 밝기: 자동(시간) / 밝게 / 어둡게 ===== */
  function initTheme() {
    const meta = document.querySelector('meta[name="theme-color"]');
    const toggle = $('theme-toggle');
    const radios = [...document.querySelectorAll('input[name="theme"]')];
    const byTime = () => {
      const hour = new Date().getHours();
      return hour >= 7 && hour < 19 ? 'light' : 'dark';
    };

    function apply(pref) {
      const theme = pref === 'auto' ? byTime() : pref;
      root.dataset.themePref = pref;
      root.dataset.theme = theme;
      if (meta) meta.content = getComputedStyle(root).getPropertyValue('--color-bg').trim() || meta.content;
      if (toggle) {
        const dark = theme === 'dark';
        toggle.setAttribute('aria-pressed', String(dark));
        toggle.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
        toggle.querySelector('[data-theme-label]').textContent = dark ? '밝게' : '어둡게';
      }
      radios.forEach((r) => { r.checked = r.value === pref; });
    }

    // 머리글 버튼: 지금과 반대 밝기로 고정
    if (toggle) {
      toggle.addEventListener('click', () => {
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        store.set(KEY.theme, next);
        apply(next);
      });
    }

    // 첫 화면 선택지
    radios.forEach((r) => r.addEventListener('change', () => {
      store.set(KEY.theme, r.value);
      apply(r.value);
    }));

    // 자동일 때 시간이 바뀌면 다시 맞춤
    setInterval(() => { if (root.dataset.themePref === 'auto') apply('auto'); }, 60000);

    // 다른 탭에서 바꾸면 함께 바뀜
    window.addEventListener('storage', (e) => {
      if (e.key === KEY.theme) apply(store.get(KEY.theme, 'auto'));
    });

    apply(root.dataset.themePref || 'auto');
  }

  /* ===== 머리글: 글자 크게 (노약자용) ===== */
  function initFontToggle() {
    const btn = $('font-toggle');
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(root.dataset.font === 'lg'));
    btn.addEventListener('click', () => {
      const on = root.dataset.font !== 'lg';
      if (on) root.dataset.font = 'lg'; else delete root.dataset.font;
      btn.setAttribute('aria-pressed', String(on));
      store.set(KEY.font, on ? 'lg' : '');
    });
  }

  /* ===== 루틴 탭 ===== */
  function initTabs() {
    document.querySelectorAll('[role="tablist"]').forEach((tablist) => {
      const tabs = [...tablist.querySelectorAll('[role="tab"]')];

      const select = (tab, { focus = false, updateHash = true } = {}) => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
          $(t.getAttribute('aria-controls')).hidden = !on;
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
    });
  }

  /* ===== 운동 타이머 ===== */
  function initTimer() {
    const form = $('timer-form');
    if (!form) return;

    const el = {
      name: $('timer-name-input'), work: $('timer-work'), rest: $('timer-rest'), sets: $('timer-sets'),
      fieldset: $('timer-fieldset'), title: $('timer-name'), goal: $('timer-goal'), step: $('timer-step'),
      ring: $('ring'), bar: $('ring-bar'), phase: $('timer-phase'), time: $('timer-time'), set: $('timer-set'),
      dots: $('timer-dots'), toggle: $('timer-toggle'), toggleText: $('timer-toggle-text'),
      skip: $('timer-skip'), skipText: $('timer-skip-text'), reset: $('timer-reset'), sound: $('timer-sound'),
      status: $('timer-status'), plan: $('plan'), planList: $('plan-list'), settings: $('timer-settings')
    };
    const toggleIcon = el.toggle.querySelector('use');
    const CIRCLE = 2 * Math.PI * 54;
    const LABEL = { ready: '준비', work: '운동', rest: '휴식', done: '완료' };
    const DEFAULT_WORK = 40; // 횟수로 하는 운동의 기본 운동 시간
    const state = { phase: 'ready', set: 1, remain: 0, total: 0, end: 0, timerId: null, cfg: null, idx: 0, pending: false };
    let audio = null;

    el.bar.setAttribute('stroke-dasharray', CIRCLE.toFixed(2));

    const params = new URLSearchParams(location.search);

    // 루틴 전체 진행 (timer.html?plan=[...])
    const plan = (() => {
      try {
        const list = JSON.parse(params.get('plan') || 'null');
        if (!Array.isArray(list)) return null;
        const clean = list.slice(0, 15).map((o) => ({
          name: String((o && o.n) || '').trim().slice(0, 20),
          sets: toInt(o && o.s, 1, 20),
          rest: toInt(o && o.r, 0, 600),
          reps: String((o && o.p) || '').slice(0, 12),
          work: toInt(o && o.w, 5, 600) || DEFAULT_WORK
        })).filter((o) => o.name && o.sets !== null && o.rest !== null);
        return clean.length ? clean : null;
      } catch (e) {
        return null;
      }
    })();

    // 한 가지 운동: 주소의 값으로 미리 채우기
    let urlReps = '';
    if (!plan) {
      const has = ['work', 'rest', 'sets'].some((k) => params.has(k));
      if (!has && isSenior()) { // 노약자용 기본값: 30초 운동 × 3세트
        el.work.value = 30;
        el.sets.value = 3;
      }
      ['name', 'work', 'rest', 'sets'].forEach((key) => {
        const value = params.get(key);
        if (value !== null) el[key].value = key === 'name' ? value.slice(0, 20) : value;
      });
      urlReps = (params.get('reps') || '').trim().slice(0, 12);
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
      return { name: el.name.value.trim(), work, rest, sets, reps: urlReps };
    }

    function applyCfg(cfg) {
      state.cfg = cfg;
      el.title.textContent = cfg.name || '자유 운동';
      el.goal.textContent = cfg.reps ? `세트마다 목표 ${repsLabel(cfg.reps)}` : '';
      el.goal.hidden = !cfg.reps;
      document.title = `${cfg.name ? `${cfg.name} · ` : ''}운동 타이머 | 핏루틴`;
      if (plan) {
        el.step.textContent = `운동 ${state.idx + 1} / ${plan.length}`;
        el.step.hidden = false;
      }
    }

    function renderPlan() {
      if (!plan) return;
      el.planList.replaceChildren(...plan.map((item, i) => {
        const li = document.createElement('li');
        const done = i < state.idx || state.phase === 'done';
        const now = i === state.idx && state.phase !== 'done';
        li.className = 'plan__item';
        li.dataset.state = done ? 'done' : (now ? 'current' : '');
        if (now) li.setAttribute('aria-current', 'step');

        const num = document.createElement('span');
        num.className = 'plan__num';
        num.textContent = pad(i + 1);
        const info = document.createElement('span');
        info.className = 'plan__info';
        const name = document.createElement('span');
        name.className = 'plan__name';
        name.textContent = item.name;
        const meta = document.createElement('span');
        meta.className = 'plan__meta';
        meta.textContent = `${item.sets}세트 · ${item.reps ? repsLabel(item.reps) : `${item.work}초`} · 휴식 ${item.rest}초`;
        info.append(name, meta);
        const status = document.createElement('span');
        status.className = 'plan__state';
        status.textContent = done ? '완료' : (now ? '진행 중' : '대기');
        if (done) status.prepend(makeIcon('i-check'));
        li.append(num, info, status);
        return li;
      }));
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

    const skipLabel = () => {
      if (state.phase !== 'rest') return '세트 완료';
      return state.pending ? '다음 운동' : '다음 세트';
    };

    function setButtons(label, icon) {
      el.toggleText.textContent = label;
      toggleIcon.setAttribute('href', icon);
      el.fieldset.disabled = isActive();
      el.skip.disabled = !isActive();
      el.skipText.textContent = skipLabel();
    }

    function prepare() {
      let cfg;
      if (plan) {
        state.idx = 0;
        cfg = plan[0];
      } else {
        cfg = readConfig();
        if (!cfg) return false;
      }
      Object.assign(state, { phase: 'ready', set: 1, total: cfg.work, remain: cfg.work, pending: false });
      applyCfg(cfg);
      render();
      renderPlan();
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
      if (phase === 'work') announce(state.set === 1 && plan ? `${cfg.name} 시작` : `${state.set}세트 운동 시작`);
      else announce(state.pending ? `휴식 ${cfg.rest}초 뒤 다음 운동` : `휴식 ${cfg.rest}초`);
      beep(phase === 'work' ? 880 : 520, 0.25);
      el.skipText.textContent = skipLabel();
      render();
    }

    function nextExercise() {
      state.idx += 1;
      state.pending = false;
      state.set = 1;
      applyCfg(plan[state.idx]);
      renderPlan();
      startPhase('work');
    }

    function finish() {
      stopTick();
      state.phase = 'done';
      state.remain = 0;
      state.set = state.cfg.sets;
      render();
      renderPlan();
      setButtons('다시 시작', '#i-play');
      beep(1046, 0.4);

      const records = getRecords();
      records.add(toKey(new Date()));
      const saved = saveRecords(records);
      announce('운동을 모두 마쳤어요');
      showAlert({
        title: '운동 완료!',
        message: `${plan ? `${plan.length}가지 운동, 루틴을 모두 마쳤어요.` : `${state.cfg.sets}세트를 모두 마쳤어요.`}${saved ? ' 오늘 날짜가 주간 기록에 체크됐어요.' : ''}`,
        okText: saved ? '기록 보기' : '확인',
        cancelText: saved ? '닫기' : ''
      }).then((ok) => { if (ok && saved) location.href = 'record.html'; });
    }

    function next() {
      if (state.phase === 'work') {
        if (state.set >= state.cfg.sets) {
          if (plan && state.idx < plan.length - 1) {
            state.pending = true;
            return state.cfg.rest > 0 ? startPhase('rest') : nextExercise();
          }
          return finish();
        }
        if (state.cfg.rest > 0) return startPhase('rest');
        state.set += 1;
        return startPhase('work');
      }
      if (state.pending) return nextExercise();
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

    // 세트 완료 · 휴식 건너뛰기
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
      el.work.value = work;
      el.rest.value = rest;
      el.sets.value = sets;
      if (prepare()) announce(`${btn.textContent.trim()}로 설정했어요`);
    });

    form.addEventListener('input', (e) => {
      if (e.target === el.name) urlReps = ''; // 다른 운동으로 바꾸면 목표 횟수 지움
      if (!isActive()) prepare();
    });
    form.addEventListener('submit', (e) => e.preventDefault());

    // 다른 탭에 있다 돌아와도 남은 시간을 바로 맞춤
    document.addEventListener('visibilitychange', () => { if (state.timerId) tick(); });

    if (plan) {
      el.plan.hidden = false;
      el.settings.hidden = true;
    }

    if (!prepare()) {
      form.reset();
      prepare();
    }
  }

  /* SVG 아이콘 만들기 */
  function makeIcon(name, className) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    const use = document.createElementNS(ns, 'use');
    svg.setAttribute('class', `ico ${className || ''}`.trim());
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    use.setAttribute('href', `#${name}`);
    svg.append(use);
    return svg;
  }

  /* ===== 주간 기록 ===== */
  function initRecord() {
    const list = $('week-list');
    if (!list) return;

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

  /* ===== 나만의 루틴 (여러 개 · 순서 · 수정) ===== */
  function initMyRoutine() {
    const form = $('my-form');
    if (!form) return;

    const list = $('my-list');
    const tpl = $('my-item-tpl');
    const select = $('rt-select');
    const rtForm = $('rt-form');
    const field = { name: $('my-name'), part: $('my-part'), sets: $('my-sets'), reps: $('my-reps'), rest: $('my-rest') };
    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const announce = (text) => { $('my-status').textContent = text; };

    const cleanItem = (v) => {
      if (!v || typeof v.id !== 'string' || typeof v.name !== 'string' || !v.name.trim()) return null;
      return {
        id: v.id,
        name: v.name.trim().slice(0, 20),
        part: String(v.part || '전신').slice(0, 10),
        sets: toInt(v.sets, 1, 10) || 3,
        reps: toInt(v.reps, 1, 100) || 10,
        rest: toInt(v.rest, 0, 600) ?? 60
      };
    };

    // 저장된 루틴 불러오기 (예전 한 줄 목록은 '내 루틴'으로 옮김)
    function load() {
      const saved = store.get(KEY.routines, null);
      let routines = saved && Array.isArray(saved.routines)
        ? saved.routines
          .filter((r) => r && typeof r.id === 'string' && typeof r.name === 'string')
          .map((r) => ({ id: r.id, name: r.name.slice(0, 20), items: (Array.isArray(r.items) ? r.items : []).map(cleanItem).filter(Boolean) }))
        : [];
      if (!routines.length) {
        const old = store.get(KEY.oldMy, []);
        routines = [{ id: uid(), name: '내 루틴', items: Array.isArray(old) ? old.map(cleanItem).filter(Boolean) : [] }];
      }
      const current = saved && routines.some((r) => r.id === saved.current) ? saved.current : routines[0].id;
      return { routines, current };
    }

    let data = load();
    let editId = null;
    let rtMode = null; // 'new' | 'rename'
    const save = () => store.set(KEY.routines, data);
    const cur = () => data.routines.find((r) => r.id === data.current);
    save();

    function buildItem(item, i, total) {
      const node = tpl.content.firstElementChild.cloneNode(true);
      const query = new URLSearchParams({ name: item.name, reps: item.reps, sets: item.sets, rest: item.rest });
      node.querySelector('[data-field="num"]').textContent = pad(i + 1);
      node.querySelector('[data-field="part"]').textContent = item.part;
      node.querySelector('[data-field="name"]').textContent = item.name;
      node.querySelector('[data-field="meta"]').textContent = `${item.sets}세트 × ${item.reps}회 · 휴식 ${item.rest}초`;
      const timer = node.querySelector('[data-field="timer"]');
      timer.href = `timer.html?${query}`;
      timer.setAttribute('aria-label', `${item.name}만 하기`);
      node.querySelectorAll('[data-act]').forEach((btn) => {
        const act = btn.dataset.act;
        btn.dataset.id = item.id;
        btn.setAttribute('aria-label', `${item.name} ${{ edit: '수정', delete: '삭제', up: '위로 옮기기', down: '아래로 옮기기' }[act]}`);
        if (act === 'up') btn.disabled = i === 0;
        if (act === 'down') btn.disabled = i === total - 1;
      });
      if (item.id === editId) node.querySelector('.my-item').classList.add('my-item--editing');
      return node;
    }

    function render() {
      const routine = cur();
      const { items } = routine;
      const totalSets = items.reduce((sum, item) => sum + item.sets, 0);

      select.replaceChildren(...data.routines.map((r) => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = `${r.name} (${r.items.length}개 운동)`;
        opt.selected = r.id === data.current;
        return opt;
      }));

      $('list-title').textContent = routine.name;
      $('my-count').textContent = items.length ? `${items.length}개 운동 · 총 ${totalSets}세트` : '0개 운동';
      $('my-empty').hidden = items.length > 0;
      const start = $('rt-start');
      start.hidden = !items.length;
      if (items.length) start.href = planUrl(items);
      list.replaceChildren(...items.map((item, i) => buildItem(item, i, items.length)));
    }

    /* 루틴 이름 폼 (새 루틴 / 이름 바꾸기) */
    function openRtForm(mode) {
      rtMode = mode;
      rtForm.hidden = false;
      $('rt-new').setAttribute('aria-expanded', String(mode === 'new'));
      $('rt-rename').setAttribute('aria-expanded', String(mode === 'rename'));
      $('rt-form-label').textContent = mode === 'new' ? '새 루틴 이름' : '바꿀 이름';
      $('rt-form-submit-text').textContent = mode === 'new' ? '만들기' : '이름 바꾸기';
      $('rt-name').value = mode === 'rename' ? cur().name : '';
      setError($('rt-name'), '');
      $('rt-name').focus();
    }

    function closeRtForm() {
      const opener = rtMode === 'rename' ? $('rt-rename') : $('rt-new');
      rtMode = null;
      rtForm.hidden = true;
      $('rt-new').setAttribute('aria-expanded', 'false');
      $('rt-rename').setAttribute('aria-expanded', 'false');
      return opener;
    }

    $('rt-new').addEventListener('click', () => openRtForm('new'));
    $('rt-rename').addEventListener('click', () => openRtForm('rename'));
    $('rt-form-cancel').addEventListener('click', () => closeRtForm().focus());

    rtForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('rt-name');
      if (!checkText(input, '루틴 이름을 입력해 주세요.')) {
        input.focus();
        return;
      }
      const name = input.value.trim().slice(0, 20);
      const isNew = rtMode === 'new';
      if (isNew) {
        const routine = { id: uid(), name, items: [] };
        data.routines.push(routine);
        data.current = routine.id;
        cancelEdit();
        announce(`‘${name}’ 루틴을 만들었어요. 이제 운동을 추가해 보세요.`);
      } else {
        cur().name = name;
        announce(`루틴 이름을 ‘${name}’(으)로 바꿨어요.`);
      }
      save();
      render();
      closeRtForm();
      (isNew ? field.name : select).focus();
    });

    select.addEventListener('change', () => {
      data.current = select.value;
      cancelEdit();
      save();
      render();
      announce(`‘${cur().name}’ 루틴을 골랐어요.`);
    });

    $('rt-delete').addEventListener('click', async () => {
      const routine = cur();
      const ok = await showAlert({
        type: 'error',
        title: '루틴을 삭제할까요?',
        message: `‘${routine.name}’ 루틴과 그 안의 운동 ${routine.items.length}개를 지워요. 되돌릴 수 없어요.`,
        okText: '삭제',
        cancelText: '취소'
      });
      if (!ok) {
        $('rt-delete').focus();
        return;
      }
      data.routines = data.routines.filter((r) => r.id !== routine.id);
      if (!data.routines.length) data.routines.push({ id: uid(), name: '내 루틴', items: [] });
      data.current = data.routines[0].id;
      cancelEdit();
      save();
      render();
      announce(`‘${routine.name}’ 루틴을 삭제했어요.`);
      select.focus();
    });

    /* 운동 추가 · 수정 */
    function cancelEdit() {
      editId = null;
      $('add-title').textContent = '운동 추가하기';
      $('my-submit-text').textContent = '루틴에 추가';
      $('my-cancel').hidden = true;
      form.reset();
      Object.values(field).forEach((input) => setError(input, ''));
    }

    function startEdit(item) {
      editId = item.id;
      field.name.value = item.name;
      field.part.value = item.part;
      field.sets.value = item.sets;
      field.reps.value = item.reps;
      field.rest.value = String(item.rest);
      if (field.rest.value !== String(item.rest)) field.rest.value = '60';
      $('add-title').textContent = '운동 수정하기';
      $('my-submit-text').textContent = '수정 저장';
      $('my-cancel').hidden = false;
      render();
      field.name.focus();
      field.name.scrollIntoView({ block: 'center' });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const okName = checkText(field.name, '운동 이름을 입력해 주세요.');
      const sets = checkNumber(field.sets, 1, 10);
      const reps = checkNumber(field.reps, 1, 100);
      if (!okName || sets === null || reps === null) {
        form.querySelector('[aria-invalid="true"]').focus();
        return;
      }
      const values = { name: field.name.value.trim().slice(0, 20), part: field.part.value, sets, reps, rest: Number(field.rest.value) };
      const routine = cur();
      const editedId = editId;
      if (editedId) {
        Object.assign(routine.items.find((v) => v.id === editedId), values);
        announce(`‘${values.name}’을(를) 수정했어요.`);
      } else {
        routine.items.push({ id: uid(), ...values });
        announce(`‘${values.name}’을(를) ${routine.name}에 추가했어요.`);
      }
      save();
      cancelEdit();
      render();
      if (editedId) {
        const btn = list.querySelector(`[data-act="edit"][data-id="${editedId}"]`);
        if (btn) btn.focus();
      } else {
        field.name.focus();
      }
    });

    $('my-cancel').addEventListener('click', () => {
      const id = editId;
      cancelEdit();
      render();
      const btn = list.querySelector(`[data-act="edit"][data-id="${id}"]`);
      (btn || field.name).focus();
    });

    // 오류가 표시된 칸은 입력할 때마다 다시 확인
    form.addEventListener('input', (e) => {
      const input = e.target;
      if (input.getAttribute('aria-invalid') !== 'true') return;
      if (input === field.name) checkText(field.name, '운동 이름을 입력해 주세요.');
      if (input === field.sets) checkNumber(field.sets, 1, 10);
      if (input === field.reps) checkNumber(field.reps, 1, 100);
    });

    /* 목록: 수정 · 삭제 · 순서 */
    list.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const routine = cur();
      const index = routine.items.findIndex((v) => v.id === btn.dataset.id);
      if (index < 0) return;
      const item = routine.items[index];
      const act = btn.dataset.act;

      if (act === 'edit') {
        startEdit(item);
        return;
      }

      if (act === 'up' || act === 'down') {
        const to = act === 'up' ? index - 1 : index + 1;
        if (to < 0 || to >= routine.items.length) return;
        [routine.items[index], routine.items[to]] = [routine.items[to], routine.items[index]];
        save();
        render();
        announce(`‘${item.name}’을(를) ${to + 1}번째로 옮겼어요.`);
        const same = list.querySelector(`[data-act="${act}"][data-id="${item.id}"]`);
        const other = list.querySelector(`[data-act="${act === 'up' ? 'down' : 'up'}"][data-id="${item.id}"]`);
        (same && !same.disabled ? same : other).focus();
        return;
      }

      const ok = await showAlert({
        type: 'error',
        title: '운동을 삭제할까요?',
        message: `‘${item.name}’을(를) ${routine.name}에서 지워요. 되돌릴 수 없어요.`,
        okText: '삭제',
        cancelText: '취소'
      });
      if (!ok) {
        btn.focus();
        return;
      }
      routine.items = routine.items.filter((v) => v.id !== item.id);
      if (editId === item.id) cancelEdit();
      save();
      render();
      announce(`‘${item.name}’을(를) 삭제했어요.`);
      $('list-title').focus();
    });

    render();
  }

  initModeSelect();
  initTheme();
  initFontToggle();
  initTabs();
  initTimer();
  initRecord();
  initMyRoutine();
})();
