/* 자라는 시간 — 폰 내려놓기 타이머 */
(function () {
  'use strict';

  var P = window.Plants;

  /* ===== 기본값 ===== */
  var FAST = /[?&]fast(?:[=&]|$)/.test(location.search); // 확인용: 주소 끝에 ?fast → 1분을 1초로
  var MINUTE = FAST ? 1000 : 60000;
  var GRACE = 10000;              // 이탈 유예 10초
  var DATA_KEY = 'growtime-v1';
  var SESSION_KEY = 'growtime-session';
  var CIRCUMFERENCE = 2 * Math.PI * 100; // 게이지 원 둘레 (r=100)
  var RUN_CAPTIONS = ['씨앗을 심었어요', '새싹이 났어요', '잎이 자랐어요', '꽃이 피었어요'];
  var THEME_COLORS = { run: '#0d120d', other: '#f6f3ea' };

  var $ = function (id) { return document.getElementById(id); };

  /* ===== 저장소 (쓸 수 없으면 메모리에만 보관) ===== */
  var canStore = (function () {
    try {
      localStorage.setItem('__gt', '1');
      localStorage.removeItem('__gt');
      return true;
    } catch (e) { return false; }
  })();
  var memory = {};

  function load(key, fallback) {
    try {
      var raw = canStore ? localStorage.getItem(key) : memory[key];
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function save(key, value) {
    var raw = JSON.stringify(value);
    if (canStore) {
      try { localStorage.setItem(key, raw); return; } catch (e) { /* 용량 초과 등 → 메모리로 */ }
    }
    memory[key] = raw;
  }

  function remove(key) {
    if (canStore) { try { localStorage.removeItem(key); } catch (e) { /* 무시 */ } }
    delete memory[key];
  }

  var data = load(DATA_KEY, null) || {};
  if (!Array.isArray(data.records)) data.records = [];
  if (!data.settings || typeof data.settings !== 'object') data.settings = {};
  var settings = data.settings;
  if (typeof settings.sound !== 'boolean') settings.sound = true;

  function saveData() { save(DATA_KEY, data); }

  /* ===== 계산 도우미 ===== */
  function totalMinutes() {
    return data.records.reduce(function (sum, r) { return sum + (r.minutes || 0); }, 0);
  }

  function isUnlocked(sp, total) { return sp.unlock <= (total === undefined ? totalMinutes() : total); }

  function fmtMin(min) {
    if (min < 60) return min + '분';
    var h = Math.floor(min / 60);
    var m = min % 60;
    return h + '시간' + (m ? ' ' + m + '분' : '');
  }

  function fmtClock(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(sec);
  }

  // 받침 유무에 따라 조사 고르기 (튤립‘이’ / 데이지‘가’)
  function josa(word, withBatchim, without) {
    var code = word.charCodeAt(word.length - 1) - 0xac00;
    return code >= 0 && code <= 11171 && code % 28 ? withBatchim : without;
  }

  function ymd(date) {
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
  }

  function streakDays() {
    var days = {};
    data.records.forEach(function (r) { if (r.ok) days[ymd(new Date(r.at))] = true; });
    var d = new Date();
    if (!days[ymd(d)]) d.setDate(d.getDate() - 1); // 오늘 아직 안 했으면 어제부터 셈
    var count = 0;
    while (days[ymd(d)]) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }

  /* ===== 화면 전환 ===== */
  var screens = {
    setup: $('screen-setup'),
    run: $('screen-run'),
    result: $('screen-result'),
    garden: $('screen-garden')
  };
  var headings = {
    setup: $('setup-title'),
    run: $('run-title'),
    result: $('result-title'),
    garden: $('garden-title')
  };
  var metaTheme = document.querySelector('meta[name="theme-color"]');

  function show(name, focus) {
    Object.keys(screens).forEach(function (key) { screens[key].hidden = key !== name; });
    document.body.setAttribute('data-screen', name);
    metaTheme.setAttribute('content', name === 'run' ? THEME_COLORS.run : THEME_COLORS.other);

    document.querySelectorAll('[data-nav]').forEach(function (link) {
      if (link.getAttribute('data-nav') === name) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (focus !== false) {
      window.scrollTo(0, 0);
      headings[name].focus({ preventScroll: true });
    }
  }

  function route(focus) {
    if (run) return; // 진행 중에는 화면을 바꾸지 않음
    if (location.hash === '#garden') {
      renderGarden();
      show('garden', focus);
    } else {
      renderSetup();
      show('setup', focus);
    }
  }

  function go(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  window.addEventListener('hashchange', function () { route(); });

  // 같은 주소를 다시 눌러도 화면이 바뀌도록
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href="#timer"], a[href="#garden"]');
    if (!link) return;
    e.preventDefault();
    go(link.getAttribute('href'));
  });

  /* ===== 글자 크게 ===== */
  var fontToggle = $('font-toggle');

  function applyFont() {
    var on = settings.font === 'lg';
    if (on) document.documentElement.setAttribute('data-font', 'lg');
    else document.documentElement.removeAttribute('data-font');
    fontToggle.setAttribute('aria-pressed', String(on));
  }

  fontToggle.addEventListener('click', function () {
    settings.font = settings.font === 'lg' ? '' : 'lg';
    saveData();
    applyFont();
  });

  /* ===== 1. 시작 화면 ===== */
  var form = $('setup-form');
  var customWrap = $('custom-time');
  var customInput = $('custom-minutes');
  var customError = $('custom-error');
  var startLabel = $('start-label');
  var seedList = $('seed-list');

  function selectedMinutes() {
    var picked = form.querySelector('input[name="minutes"]:checked');
    if (!picked) return 25;
    if (picked.value !== 'custom') return Number(picked.value);
    var n = Number(customInput.value);
    return Number.isInteger(n) && n >= 1 && n <= 180 ? n : null;
  }

  function updateStartLabel() {
    var picked = form.querySelector('input[name="minutes"]:checked');
    customWrap.hidden = !(picked && picked.value === 'custom');
    var min = selectedMinutes();
    startLabel.textContent = min ? fmtMin(min) + ' 시작하기' : '시작하기';
  }

  function renderSetup() {
    var total = totalMinutes();

    // 지난번 고른 시간 기억
    if (settings.minutes) {
      var preset = form.querySelector('input[name="minutes"][value="' + settings.minutes + '"]');
      if (preset) preset.checked = true;
      else {
        form.querySelector('input[name="minutes"][value="custom"]').checked = true;
        customInput.value = settings.minutes;
      }
    }
    updateStartLabel();

    // 식물 목록
    var chosen = P.find(settings.plant);
    if (!isUnlocked(chosen, total)) chosen = P.SPECIES[0];

    seedList.innerHTML = P.SPECIES.map(function (sp) {
      var open = isUnlocked(sp, total);
      var id = 'seed-' + sp.id;
      var state = open
        ? '키울 수 있어요'
        : '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-lock"></use></svg>' + fmtMin(sp.unlock) + ' 모으면 열려요';
      return '<li class="seed">' +
        '<input class="seed__input" type="radio" name="plant" id="' + id + '" value="' + sp.id + '"' +
          (open ? '' : ' disabled') + (sp.id === chosen.id ? ' checked' : '') + ' aria-describedby="' + id + '-state">' +
        '<label class="seed__card" for="' + id + '">' + P.svg(sp.id, 3) +
          '<span class="seed__name">' + sp.name + '</span>' +
          '<span class="seed__state" id="' + id + '-state">' + state + '</span>' +
        '</label></li>';
    }).join('');

    $('unlock-desc').textContent = '지금까지 모은 시간 ' + fmtMin(total) + '. 시간을 모을수록 새 식물이 열려요.';
    $('sound-toggle').checked = settings.sound;
  }

  form.addEventListener('change', function (e) {
    if (e.target.name === 'minutes') {
      updateStartLabel();
      if (e.target.value === 'custom') customInput.focus();
    }
    if (e.target.name === 'plant') {
      settings.plant = e.target.value;
      saveData();
    }
    if (e.target.id === 'sound-toggle') {
      settings.sound = e.target.checked;
      saveData();
    }
  });

  customInput.addEventListener('input', function () {
    customInput.removeAttribute('aria-invalid');
    customError.textContent = '';
    updateStartLabel();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var min = selectedMinutes();
    if (!min) {
      customInput.setAttribute('aria-invalid', 'true');
      customError.textContent = '1부터 180 사이의 숫자(분)를 넣어 주세요. 예: 30';
      customInput.focus();
      return;
    }
    settings.minutes = min;
    saveData();

    unlockAudio(); // 소리는 버튼을 누른 순간에 준비해야 휴대폰에서 남
    if (!settings.guideSeen) openGuide(true);
    else startRun();
  });

  /* ===== 2. 안내 대화 상자 ===== */
  var guide = $('guide-dialog');
  var guideOk = $('guide-ok');
  var guideCancel = $('guide-cancel');
  var guideStartMode = false;

  if (!('wakeLock' in navigator)) {
    var lockNote = $('guide-lock-note');
    lockNote.textContent = '이 브라우저는 화면 켜짐 유지를 지원하지 않아요. 휴대폰 설정에서 ‘화면 자동 꺼짐’ 시간을 타이머보다 길게 바꿔 주세요.';
    lockNote.hidden = false;
  }

  function openGuide(startMode) {
    guideStartMode = startMode;
    guideOk.textContent = startMode ? '알겠어요, 시작할게요' : '알겠어요';
    guideCancel.textContent = startMode ? '다음에 할게요' : '닫기';
    guideCancel.hidden = !startMode;
    guide.showModal();
  }

  guideOk.addEventListener('click', function () {
    settings.guideSeen = true;
    saveData();
    guide.close();
    if (guideStartMode) startRun();
  });

  guideCancel.addEventListener('click', function () { guide.close(); });

  $('guide-open').addEventListener('click', function () { openGuide(false); });

  /* ===== 확인 대화 상자 ===== */
  var confirmBox = $('confirm-dialog');
  var confirmAction = null;

  function openConfirm(opt) {
    $('confirm-title').textContent = opt.title;
    $('confirm-desc').textContent = opt.desc;
    $('confirm-ok').textContent = opt.ok;
    $('confirm-cancel').textContent = opt.cancel;
    confirmAction = opt.onOk;
    confirmBox.showModal();
    $('confirm-cancel').focus(); // 되돌릴 수 없는 동작이라 기본은 ‘취소’
  }

  $('confirm-ok').addEventListener('click', function () {
    var action = confirmAction;
    confirmAction = null;
    confirmBox.close();
    if (action) action();
  });

  $('confirm-cancel').addEventListener('click', function () {
    confirmAction = null;
    confirmBox.close();
  });

  /* ===== 효과음 · 진동 ===== */
  var audioCtx = null;

  function unlockAudio() {
    if (!settings.sound || audioCtx) return;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { audioCtx = null; }
  }

  // 도·미·솔·도 차임
  function playChime() {
    if (!settings.sound || !audioCtx) return;
    var t0 = audioCtx.currentTime + 0.05;
    [523.25, 659.25, 783.99, 1046.5].forEach(function (freq, i) {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      var t = t0 + i * 0.18;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 1);
    });
  }

  /* ===== 화면 켜짐 유지 (Wake Lock) ===== */
  var wakeLock = null;
  var lockText = $('run-lock');

  function requestWakeLock() {
    if (!('wakeLock' in navigator)) {
      lockText.textContent = '이 브라우저는 화면 켜짐 유지를 지원하지 않아요. 화면이 꺼지면 식물이 시드니, 휴대폰 설정에서 ‘화면 자동 꺼짐’ 시간을 늘려 주세요.';
      return;
    }
    navigator.wakeLock.request('screen').then(function (lock) {
      wakeLock = lock;
      lockText.textContent = '화면이 꺼지지 않게 해 두었어요. 폰을 엎어두세요.';
      lock.addEventListener('release', function () { wakeLock = null; });
    }).catch(function () {
      lockText.textContent = '화면 켜짐 유지를 켜지 못했어요. 화면이 꺼지면 식물이 시드니, ‘화면 자동 꺼짐’ 시간을 늘려 주세요.';
    });
  }

  function releaseWakeLock() {
    if (wakeLock) wakeLock.release().catch(function () { /* 이미 해제됨 */ });
    wakeLock = null;
  }

  /* ===== 3. 진행 화면 ===== */
  var run = null;
  var ticker = null;
  var runPlant = $('run-plant');
  var runTime = $('run-time');
  var runLive = $('run-live');
  var runCaption = $('run-stage-label');
  var runAlert = $('run-alert');
  var gaugeBar = $('gauge-bar');
  var baseTitle = document.title;

  gaugeBar.setAttribute('stroke-dasharray', CIRCUMFERENCE.toFixed(2));
  gaugeBar.setAttribute('stroke-dashoffset', CIRCUMFERENCE.toFixed(2));

  function saveSession() {
    save(SESSION_KEY, {
      start: run.start,
      duration: run.duration,
      plant: run.plant,
      lastSeen: run.lastSeen,
      leftAt: run.leftAt
    });
  }

  function startRun() {
    var min = settings.minutes || 25;
    var plant = P.find(settings.plant);
    if (!isUnlocked(plant)) plant = P.SPECIES[0];

    var now = Date.now();
    run = {
      start: now,
      duration: min * MINUTE,
      plant: plant.id,
      lastSeen: now,
      lastSaved: 0,
      leftAt: null,
      stage: 0,
      remainMin: null
    };
    saveSession();

    runPlant.innerHTML = P.svg(plant.id, 0);
    runCaption.textContent = RUN_CAPTIONS[0];
    runAlert.hidden = true;
    lockText.textContent = '';

    show('run');
    requestWakeLock();
    runLive.textContent = plant.name + ' 씨앗을 심었어요. 남은 시간 ' + fmtMin(min) + '.';
    tick();
    ticker = setInterval(tick, 500);
  }

  function tick() {
    if (!run || document.hidden) return;
    var now = Date.now();
    var elapsed = now - run.start; // 시작 시각과의 차이로 계산 → 백그라운드 지연에도 정확
    if (elapsed >= run.duration) {
      finish(true, run.duration, 'done');
      return;
    }

    var remain = run.duration - elapsed;
    var ratio = elapsed / run.duration;
    var clock = fmtClock(remain);

    runTime.textContent = clock;
    runTime.setAttribute('datetime', 'PT' + Math.ceil(remain / 1000) + 'S');
    document.title = clock + ' 남음 - 자라는 시간';
    gaugeBar.setAttribute('stroke-dashoffset', (CIRCUMFERENCE * (1 - ratio)).toFixed(2));

    // 성장 단계가 바뀔 때만 다시 그림
    var stage = P.stageOf(ratio);
    if (stage !== run.stage) {
      run.stage = stage;
      runPlant.querySelector('.plant').setAttribute('data-stage', String(stage));
      runCaption.textContent = RUN_CAPTIONS[stage];
      runLive.textContent = RUN_CAPTIONS[stage] + '.';
    }

    // 스크린리더: 남은 시간은 1분 단위로만 안내
    var remainMin = Math.ceil(remain / MINUTE);
    if (run.remainMin !== null && remainMin !== run.remainMin) {
      runLive.textContent = '남은 시간 ' + fmtMin(remainMin) + '.';
    }
    run.remainMin = remainMin;

    run.lastSeen = now;
    if (now - run.lastSaved > 5000) {
      run.lastSaved = now;
      saveSession();
    }
  }

  // 이탈 감지: 다른 앱으로 넘어가거나 화면이 꺼지면 hidden
  document.addEventListener('visibilitychange', function () {
    if (!run) return;
    var now = Date.now();

    if (document.hidden) {
      run.leftAt = now;
      run.lastSeen = now;
      saveSession();
      return;
    }

    var leftAt = run.leftAt;
    if (leftAt === null) return;
    var away = now - leftAt;
    run.leftAt = null;

    if (leftAt - run.start >= run.duration) {
      finish(true, run.duration, 'done'); // 나가기 전에 이미 끝남
    } else if (away > GRACE) {
      finish(false, leftAt - run.start, 'left');
    } else {
      runAlert.innerHTML = '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-alert"></use></svg>' +
        '<span>다른 화면에 ' + Math.max(1, Math.round(away / 1000)) + '초 다녀왔어요. 10초 넘게 나가 있으면 식물이 시들어요.</span>';
      runAlert.hidden = false;
      requestWakeLock(); // 화면을 벗어나면 해제되므로 다시 요청
      saveSession();
      tick();
    }
  });

  $('quit-btn').addEventListener('click', function () {
    if (!run) return;
    var held = Math.floor((Date.now() - run.start) / MINUTE);
    openConfirm({
      title: '정말 그만둘까요?',
      desc: '지금 그만두면 식물이 시들어요. ' + (held >= 1
        ? '지금까지 버틴 ' + fmtMin(held) + '만큼 자란 식물은 정원에 기록돼요.'
        : '1분이 안 돼서 정원에는 기록되지 않아요.'),
      ok: '그만두기',
      cancel: '계속하기',
      onOk: function () { if (run) finish(false, Date.now() - run.start, 'quit'); }
    });
  });

  /* ===== 4. 결과 화면 ===== */
  var lastPlantedId = null;
  var REASONS = {
    left: '다른 화면에 10초 넘게 나가 있었어요. ',
    quit: '',
    reload: '타이머가 도는 중에 창이 닫혔거나 새로고침됐어요. '
  };

  function finish(ok, elapsed, reason, session) {
    var info = run || session;
    clearInterval(ticker);
    ticker = null;
    run = null;
    releaseWakeLock();
    remove(SESSION_KEY);
    document.title = baseTitle;
    if (confirmBox.open) confirmBox.close();

    elapsed = Math.max(0, Math.min(elapsed, info.duration));
    var minutes = Math.floor(elapsed / MINUTE);
    var stage = ok ? 3 : P.stageOf(elapsed / info.duration);
    var sp = P.find(info.plant);

    // 기록 (1분 이상 버틴 경우만, 실패해도 버틴 단계로 부분 보상)
    var before = totalMinutes();
    var record = null;
    if (minutes >= 1) {
      record = { id: Date.now(), plant: sp.id, stage: stage, minutes: minutes, ok: ok, at: new Date().toISOString() };
      data.records.push(record);
      saveData();
      lastPlantedId = record.id;
    }
    var after = totalMinutes();
    var unlocked = P.SPECIES.filter(function (s) { return !isUnlocked(s, before) && isUnlocked(s, after); });

    // 화면 채우기
    var box = screens.result;
    box.classList.toggle('result--success', ok);
    box.classList.toggle('result--fail', !ok);

    var plantBox = $('result-plant');
    plantBox.innerHTML = P.svg(sp.id, ok ? 2 : stage, { label: true, wilted: false });
    var svgEl = plantBox.querySelector('.plant');
    if (!ok) svgEl.setAttribute('aria-label', sp.name + ', ' + P.STAGES[stage] + ' 단계(시듦)');

    $('result-title').textContent = ok ? '꽃이 피었어요' : '시들었어요';

    var desc = $('result-desc');
    if (ok) {
      desc.innerHTML = '<strong>' + fmtMin(minutes) + '</strong> 동안 폰을 내려놓았어요. ' + sp.name + ' 꽃을 정원에 심어 보세요.';
    } else if (record) {
      desc.innerHTML = REASONS[reason] + '<strong>' + fmtMin(minutes) + '</strong> 버텼어요. ' + (stage ? '버틴 만큼 자란 ‘' + P.STAGES[stage] + '’을' : '심어 둔 ‘씨앗’을') + ' 정원에 기록했어요.';
    } else {
      desc.innerHTML = REASONS[reason] + '1분이 안 돼서 정원에는 기록하지 않았어요.';
    }

    var unlockBox = $('result-unlock');
    if (unlocked.length) {
      var names = unlocked.map(function (s) { return '‘' + s.name + '’'; }).join(', ');
      var lastName = unlocked[unlocked.length - 1].name;
      unlockBox.textContent = '새 식물 ' + names + josa(lastName, '이', '가') + ' 열렸어요! 다음 타이머부터 고를 수 있어요.';
      unlockBox.hidden = false;
    } else {
      unlockBox.hidden = true;
    }

    var gardenBtn = $('result-garden');
    gardenBtn.lastChild.textContent = ok ? '정원에 심기' : '정원 보러 가기';
    $('result-again').lastChild.textContent = ok ? '한 번 더 하기' : '다시 도전';

    show('result');
    history.replaceState(null, '', location.pathname + location.search); // 결과 화면은 주소 없이

    // 연출: 성공이면 꽃이 피고, 실패면 시듦
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (ok) svgEl.setAttribute('data-stage', '3');
        else svgEl.classList.add('plant--wilted');
      });
    });

    if (ok) {
      playChime();
      if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
    }
  }

  /* ===== 5. 내 정원 ===== */
  function renderGarden() {
    var total = totalMinutes();
    var records = data.records.slice().reverse(); // 최근 것부터

    $('stat-total').textContent = fmtMin(total);
    $('stat-streak').textContent = streakDays() + '일';
    $('stat-count').textContent = records.length + '그루';

    // 다음 해금까지
    var next = null;
    var prev = 0;
    P.SPECIES.forEach(function (sp) {
      if (!next && sp.unlock > total) next = sp;
      if (sp.unlock <= total) prev = sp.unlock;
    });
    var pct = next ? Math.round(((total - prev) / (next.unlock - prev)) * 100) : 100;
    $('next-text').textContent = next
      ? '‘' + next.name + '’까지 ' + fmtMin(next.unlock - total) + ' 남았어요. (모은 시간 ' + fmtMin(total) + ' / ' + fmtMin(next.unlock) + ')'
      : '모든 식물을 모았어요. 앞으로도 꾸준히 키워 보세요!';
    $('next-bar').setAttribute('aria-valuenow', String(pct));
    $('next-bar').setAttribute('aria-valuetext', pct + '%');
    $('next-fill').style.width = pct + '%';

    // 심은 식물
    $('plot').innerHTML = records.map(function (r) {
      var sp = P.find(r.plant);
      var date = new Date(r.at);
      var badge = r.ok
        ? '<span class="plot__badge"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-check"></use></svg>꽃 피움</span>'
        : '<span class="plot__badge plot__badge--part">' + P.STAGES[r.stage] + ' 단계</span>';
      return '<li class="plot__item' + (r.id === lastPlantedId ? ' plot__item--new' : '') + '">' +
        P.svg(sp.id, r.stage) +
        '<span class="plot__name">' + sp.name + '</span>' + badge +
        '<span class="plot__meta">' + fmtMin(r.minutes) + ' · ' + (date.getMonth() + 1) + '월 ' + date.getDate() + '일</span>' +
      '</li>';
    }).join('');
    lastPlantedId = null;

    var empty = records.length === 0;
    $('garden-empty').hidden = !empty;
    $('garden-clear').hidden = empty;
  }

  $('garden-clear').addEventListener('click', function () {
    openConfirm({
      title: '정원을 비울까요?',
      desc: '심은 식물과 모은 시간이 모두 지워지고, 열린 식물도 다시 잠겨요. 지운 뒤에는 되돌릴 수 없어요.',
      ok: '모두 지우기',
      cancel: '취소',
      onOk: function () {
        data.records = [];
        saveData();
        renderGarden();
        headings.garden.focus();
      }
    });
  });

  /* ===== 시작 ===== */
  if (!canStore) $('storage-notice').hidden = false;
  applyFont();

  // 진행 중에 창이 닫혔던 경우 → 마지막으로 확인된 시각까지 버틴 것으로 처리
  var leftover = load(SESSION_KEY, null);
  if (leftover && leftover.start && leftover.duration) {
    var held = (leftover.leftAt || leftover.lastSeen || leftover.start) - leftover.start;
    finish(held >= leftover.duration, held, 'reload', leftover);
  } else {
    route(false);
  }
})();
