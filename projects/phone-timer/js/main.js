/* 자라는 시간 — 폰 내려놓기 타이머 */
(function () {
  'use strict';

  var P = window.Plants;

  /* ===== 기본값 ===== */
  var FAST = /[?&]fast(?:[=&]|$)/.test(location.search); // 확인용: 주소 끝에 ?fast → 1분을 1초로
  var MINUTE = FAST ? 1000 : 60000;
  var GRACE = 10000;              // 이탈 유예 10초
  var PAUSE_MAX = 5 * 60000;      // 급한 일 이어하기: 5분 이내, 한 번만 (실제 시간 기준)
  var BONUS_MAX = 30 * MINUTE;    // 꽃이 핀 뒤 보너스 시간 최대 30분
  var DATA_KEY = 'growtime-v1';
  var SESSION_KEY = 'growtime-session';
  var CIRCUMFERENCE = 2 * Math.PI * 100; // 게이지 원 둘레 (r=100)
  var RUN_CAPTIONS = ['씨앗을 심었어요', '새싹이 났어요', '잎이 자랐어요', '꽃이 피었어요'];
  var THEME_COLORS = { run: '#0d120d', other: '#f6f3ea' };

  var $ = function (id) { return document.getElementById(id); };
  var ICON = function (name) { return '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>'; };

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

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function fmtClock(ms, up) {
    var s = Math.max(0, up ? Math.floor(ms / 1000) : Math.ceil(ms / 1000));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(s % 60);
  }

  function fmtAway(ms) {
    var s = Math.round(ms / 1000);
    return s < 60 ? s + '초' : Math.floor(s / 60) + '분' + (s % 60 ? ' ' + (s % 60) + '초' : '');
  }

  // 받침 유무에 따라 조사 고르기 (튤립‘이’ / 데이지‘가’)
  function josa(word, withBatchim, without) {
    var code = word.charCodeAt(word.length - 1) - 0xac00;
    return code >= 0 && code <= 11171 && code % 28 ? withBatchim : without;
  }

  function dayKey(date) {
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
  }

  // 그 주의 월요일 0시
  function weekStart(date) {
    var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }

  function weekSuccessDays() {
    var start = weekStart(new Date()).getTime();
    var days = {};
    data.records.forEach(function (r) {
      var at = new Date(r.at);
      if (r.ok && at.getTime() >= start) days[dayKey(at)] = true;
    });
    return Object.keys(days).length;
  }

  function md(date) { return (date.getMonth() + 1) + '월 ' + date.getDate() + '일'; }

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
    $('battery-note').hidden = !(min && min >= 50); // 오래 할 땐 충전 안내
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
      var state = open ? '키울 수 있어요' : ICON('lock') + fmtMin(sp.unlock) + ' 모으면 열려요';
      return '<li class="seed">' +
        '<input class="seed__input" type="radio" name="plant" id="' + id + '" value="' + sp.id + '"' +
          (open ? '' : ' disabled') + (sp.id === chosen.id ? ' checked' : '') + ' aria-describedby="' + id + '-state">' +
        '<label class="seed__card" for="' + id + '">' + P.svg(sp.id, 3) +
          '<span class="seed__name">' + sp.name + '</span>' +
          '<span class="seed__state" id="' + id + '-state">' + state + '</span>' +
        '</label></li>';
    }).join('');

    var openCount = P.SPECIES.filter(function (sp) { return isUnlocked(sp, total); }).length;
    $('unlock-desc').textContent = '모은 시간 ' + fmtMin(total) + ' · 식물 ' + openCount + '/' + P.SPECIES.length + '종. 시간을 모을수록 새 식물이 열려요.';
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
    guideCancel.textContent = '다음에 할게요';
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

  /* ===== 홈 화면에 추가 ===== */
  var installDialog = $('install-dialog');
  var installNow = $('install-now');
  var installPrompt = null;
  var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  if (standalone) $('install-open').hidden = true; // 이미 홈 화면 앱으로 연 경우

  // 안드로이드 Chrome 등: 바로 추가 버튼 제공
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    installPrompt = e;
    installNow.hidden = false;
  });

  window.addEventListener('appinstalled', function () {
    installPrompt = null;
    installNow.hidden = true;
    $('install-open').hidden = true;
  });

  $('install-open').addEventListener('click', function () { installDialog.showModal(); });
  $('install-close').addEventListener('click', function () { installDialog.close(); });

  installNow.addEventListener('click', function () {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.finally(function () {
      installPrompt = null;
      installNow.hidden = true;
      installDialog.close();
    });
  });

  /* ===== 확인 대화 상자 ===== */
  var confirmBox = $('confirm-dialog');
  var confirmOk = $('confirm-ok');
  var confirmCancel = $('confirm-cancel');
  var confirmOpt = null;

  /**
   * opt: title, desc, ok, cancel, onOk, onCancel,
   *      okPrimary(이어가기처럼 안전한 동작), cancelDanger, required(Esc로 닫기 막기)
   */
  function openConfirm(opt) {
    confirmOpt = opt;
    $('confirm-title').textContent = opt.title;
    $('confirm-desc').textContent = opt.desc;
    confirmOk.textContent = opt.ok;
    confirmCancel.textContent = opt.cancel;
    confirmOk.className = 'btn btn--lg btn--block ' + (opt.okPrimary ? 'btn--primary' : 'btn--danger-fill');
    confirmCancel.className = 'btn btn--lg btn--block' + (opt.cancelDanger ? ' btn--danger' : '');
    if (!confirmBox.open) confirmBox.showModal();
    (opt.okPrimary ? confirmOk : confirmCancel).focus(); // 되돌릴 수 없는 동작은 기본 포커스를 안전한 쪽에
  }

  function closeConfirm(choice) {
    var opt = confirmOpt;
    confirmOpt = null;
    if (confirmBox.open) confirmBox.close();
    if (!opt) return;
    if (choice === 'ok' && opt.onOk) opt.onOk();
    if (choice === 'cancel' && opt.onCancel) opt.onCancel();
  }

  confirmOk.addEventListener('click', function () { closeConfirm('ok'); });
  confirmCancel.addEventListener('click', function () { closeConfirm('cancel'); });

  // Esc: 꼭 골라야 하는 창은 닫히지 않게
  confirmBox.addEventListener('cancel', function (e) {
    if (confirmOpt && confirmOpt.required) e.preventDefault();
    else closeConfirm('cancel');
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
    // 아이폰 무음 모드에서도 울리도록 (iOS 17 이상). 다른 앱 음악을 오래 끊지 않게 잠깐만 바꿈
    var session = navigator.audioSession;
    if (session) { try { session.type = 'playback'; } catch (e) { /* 미지원 */ } }
    if (audioCtx.state === 'suspended') audioCtx.resume();

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

    if (session) {
      setTimeout(function () { try { session.type = 'auto'; } catch (e) { /* 무시 */ } }, 2000);
    }
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
      lockText.textContent = run && run.phase === 'bonus'
        ? '화면이 켜져 있어요. 확인했으면 위 버튼을 눌러 주세요.'
        : '화면이 꺼지지 않게 해 두었어요. 폰을 엎어두세요.';
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
  var runTimeTitle = $('run-time-title');
  var runLive = $('run-live');
  var runCaption = $('run-stage-label');
  var runAlert = $('run-alert');
  var gaugeBar = $('gauge-bar');
  var gaugeBonus = $('gauge-bonus');
  var doneBtn = $('done-btn');
  var quitBtn = $('quit-btn');
  var bonusDesc = $('bonus-desc');
  var baseTitle = document.title;

  [gaugeBar, gaugeBonus].forEach(function (c) {
    c.setAttribute('stroke-dasharray', CIRCUMFERENCE.toFixed(2));
    c.setAttribute('stroke-dashoffset', CIRCUMFERENCE.toFixed(2));
  });

  function saveSession() {
    save(SESSION_KEY, {
      start: run.start,
      duration: run.duration,
      plant: run.plant,
      phase: run.phase,
      bonusStart: run.bonusStart,
      lastSeen: run.lastSeen,
      leftAt: run.leftAt,
      usedPause: run.usedPause
    });
  }

  function showAlert(html) {
    runAlert.innerHTML = ICON('alert') + '<span>' + html + '</span>';
    runAlert.hidden = false;
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
      phase: 'grow',      // grow: 자라는 중 / paused: 급한 일 선택 대기 / bonus: 꽃 핀 뒤
      bonusStart: null,
      lastSeen: now,
      lastSaved: 0,
      leftAt: null,
      usedPause: false,
      stage: 0,
      remainMin: null
    };
    saveSession();

    runPlant.innerHTML = P.svg(plant.id, 0);
    runCaption.textContent = RUN_CAPTIONS[0];
    runTimeTitle.textContent = '남은 시간';
    gaugeBonus.setAttribute('stroke-dashoffset', CIRCUMFERENCE.toFixed(2));
    runAlert.hidden = true;
    doneBtn.hidden = true;
    bonusDesc.hidden = true;
    quitBtn.hidden = false;
    lockText.textContent = '';
    screens.run.classList.remove('run--bonus');

    show('run');
    requestWakeLock();
    runLive.textContent = plant.name + ' 씨앗을 심었어요. 남은 시간 ' + fmtMin(min) + '.';
    tick();
    ticker = setInterval(tick, 500);
  }

  function setStage(stage) {
    if (stage === run.stage) return;
    run.stage = stage;
    runPlant.querySelector('.plant').setAttribute('data-stage', String(stage));
    runCaption.textContent = RUN_CAPTIONS[stage];
    runLive.textContent = RUN_CAPTIONS[stage] + '.';
  }

  // 꽃이 핌 → 보너스 시간 시작
  function enterBonus(at) {
    run.phase = 'bonus';
    run.bonusStart = at;
    setStage(3);
    gaugeBar.setAttribute('stroke-dashoffset', '0');
    screens.run.classList.add('run--bonus');
    runTimeTitle.textContent = '보너스 시간';
    runCaption.textContent = '꽃이 피었어요';
    runAlert.hidden = true;
    quitBtn.hidden = true;
    doneBtn.hidden = false;
    bonusDesc.hidden = false;
    lockText.textContent = '';
    runLive.textContent = '꽃이 피었어요. 지금부터는 보너스 시간이에요. 확인했으면 정원에 심기 버튼을 눌러 주세요.';
    saveSession();

    playChime();
    if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
  }

  function tick() {
    if (!run || document.hidden || run.phase === 'paused') return;
    var now = Date.now();

    if (run.phase === 'grow') {
      var elapsed = now - run.start; // 시작 시각과의 차이로 계산 → 백그라운드 지연에도 정확
      if (elapsed >= run.duration) {
        enterBonus(run.start + run.duration);
      } else {
        var remain = run.duration - elapsed;
        var ratio = elapsed / run.duration;
        var clock = fmtClock(remain);

        runTime.textContent = clock;
        runTime.setAttribute('datetime', 'PT' + Math.ceil(remain / 1000) + 'S');
        document.title = clock + ' 남음 - 자라는 시간';
        gaugeBar.setAttribute('stroke-dashoffset', (CIRCUMFERENCE * (1 - ratio)).toFixed(2));
        setStage(P.stageOf(ratio));

        // 스크린리더: 남은 시간은 1분 단위로만 안내
        var remainMin = Math.ceil(remain / MINUTE);
        if (run.remainMin !== null && remainMin !== run.remainMin) {
          runLive.textContent = '남은 시간 ' + fmtMin(remainMin) + '.';
        }
        run.remainMin = remainMin;
      }
    }

    if (run.phase === 'bonus') {
      var bonus = now - run.bonusStart;
      if (bonus >= BONUS_MAX) {
        finish({ ok: true, held: run.duration, bonus: BONUS_MAX, reason: 'done' });
        return;
      }
      var up = fmtClock(bonus, true);
      runTime.textContent = '+' + up;
      runTime.setAttribute('datetime', 'PT' + Math.floor(bonus / 1000) + 'S');
      document.title = '꽃이 피었어요 +' + up + ' - 자라는 시간';
      gaugeBonus.setAttribute('stroke-dashoffset', (CIRCUMFERENCE * (1 - bonus / BONUS_MAX)).toFixed(2));
    }

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
      // 꽃이 핀 뒤 나가면 거기까지를 보너스로 인정하고 마무리
      if (run.phase === 'bonus') {
        finish({ ok: true, held: run.duration, bonus: now - run.bonusStart, reason: 'done' });
        return;
      }
      if (run.phase === 'grow') {
        run.leftAt = now;
        run.lastSeen = now;
        saveSession();
      }
      return;
    }

    if (run.phase !== 'grow' || run.leftAt === null) return;
    var leftAt = run.leftAt;
    var away = now - leftAt;
    var held = leftAt - run.start;
    run.leftAt = null;

    if (held >= run.duration) {
      // 나가기 전에 이미 꽃이 핌 → 나간 시각까지 보너스 인정
      finish({ ok: true, held: run.duration, bonus: held - run.duration, reason: 'done' });
    } else if (away <= GRACE) {
      showAlert('다른 화면에 ' + fmtAway(away) + ' 다녀왔어요. 10초 넘게 나가 있으면 식물이 시들어요.');
      requestWakeLock(); // 화면을 벗어나면 해제되므로 다시 요청
      saveSession();
      tick();
    } else if (!run.usedPause && away <= PAUSE_MAX) {
      askPause(leftAt, away);
    } else {
      finish({ ok: false, held: held, reason: run.usedPause ? 'left-again' : 'left-long' });
    }
  });

  // 급한 일(전화 등) 이어하기: 한 번만, 비운 시간은 빼고 계산
  function askPause(leftAt, away) {
    run.phase = 'paused';
    run.leftAt = leftAt;
    saveSession();
    openConfirm({
      title: '자리를 비웠어요',
      desc: fmtAway(away) + ' 동안 다른 화면에 있었어요. 전화처럼 급한 일이었다면 한 번만 이어서 할 수 있어요. 비운 시간은 빼고 계산해요.',
      ok: '급한 일이었어요, 이어서 하기',
      cancel: '그만두기 (식물이 시들어요)',
      okPrimary: true,
      cancelDanger: true,
      required: true,
      onOk: function () {
        if (!run) return;
        run.start += Date.now() - run.leftAt; // 비운 시간만큼 시작 시각을 미룸
        run.leftAt = null;
        run.usedPause = true;
        run.phase = 'grow';
        showAlert('이어서 자라는 중이에요. 이어하기는 이번 한 번만 쓸 수 있어요.');
        requestWakeLock();
        saveSession();
        tick();
      },
      onCancel: function () {
        if (!run) return;
        finish({ ok: false, held: run.leftAt - run.start, reason: 'left' });
      }
    });
  }

  quitBtn.addEventListener('click', function () {
    if (!run || run.phase !== 'grow') return;
    var held = Math.floor((Date.now() - run.start) / MINUTE);
    openConfirm({
      title: '정말 그만둘까요?',
      desc: '지금 그만두면 식물이 시들어요. ' + (held >= 1
        ? '지금까지 버틴 ' + fmtMin(held) + '은 시든 모습 그대로 정원에 남아요.'
        : '1분이 안 돼서 정원에는 기록되지 않아요.'),
      ok: '그만두기',
      cancel: '계속하기',
      onOk: function () {
        if (run && run.phase === 'grow') finish({ ok: false, held: Date.now() - run.start, reason: 'quit' });
      }
    });
  });

  doneBtn.addEventListener('click', function () {
    if (!run || run.phase !== 'bonus') return;
    finish({ ok: true, held: run.duration, bonus: Date.now() - run.bonusStart, reason: 'done' });
  });

  /* ===== 4. 결과 화면 ===== */
  var lastPlantedId = null;
  var REASONS = {
    left: '',
    quit: '',
    'left-long': '다른 화면에 5분 넘게 나가 있었어요. ',
    'left-again': '이어하기는 한 번만 쓸 수 있어서, 이번에는 시들었어요. ',
    reload: '타이머가 도는 중에 창이 닫혔거나 새로고침됐어요. ',
    done: ''
  };

  /**
   * r: { ok, held(자란 시간 ms), bonus(보너스 ms), reason }, session: 새로고침 복구용
   */
  function finish(r, session) {
    var info = run || session;
    clearInterval(ticker);
    ticker = null;
    run = null;
    releaseWakeLock();
    remove(SESSION_KEY);
    document.title = baseTitle;
    if (confirmBox.open) { confirmOpt = null; confirmBox.close(); }

    var ok = r.ok;
    var held = Math.max(0, Math.min(r.held, info.duration));
    var bonus = ok ? Math.max(0, Math.min(r.bonus || 0, BONUS_MAX)) : 0;
    var minutes = Math.floor((held + bonus) / MINUTE);
    var bonusMin = Math.floor(bonus / MINUTE);
    var stage = ok ? 3 : P.stageOf(held / info.duration);
    var sp = P.find(info.plant);

    // 기록 (1분 이상 버틴 경우만. 실패해도 버틴 단계로 남기되, 시든 모습으로)
    var before = totalMinutes();
    var record = null;
    if (minutes >= 1) {
      record = { id: Date.now(), plant: sp.id, stage: stage, minutes: minutes, bonus: bonusMin, ok: ok, at: new Date().toISOString() };
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
    plantBox.innerHTML = P.svg(sp.id, ok ? 2 : stage, { label: true });
    var svgEl = plantBox.querySelector('.plant');
    svgEl.setAttribute('aria-label', sp.name + ', ' + P.STAGES[stage] + ' 단계' + (ok ? '' : '(시듦)'));

    $('result-title').textContent = ok ? '꽃이 피었어요' : '시들었어요';

    var desc = $('result-desc');
    var heldMin = Math.floor(held / MINUTE);
    if (ok) {
      desc.innerHTML = '<strong>' + fmtMin(heldMin) + '</strong> 동안 폰을 내려놓았어요.' +
        (bonusMin ? ' 꽃이 핀 뒤에도 <strong>보너스 ' + fmtMin(bonusMin) + '</strong>을 더 모았어요.' : '') +
        ' ' + sp.name + ' 꽃을 정원에 심어 보세요.';
    } else if (record) {
      desc.innerHTML = REASONS[r.reason] + '<strong>' + fmtMin(minutes) + '</strong> 버텼어요. ' +
        '‘' + P.STAGES[stage] + '’ 단계에서 시든 모습 그대로 정원에 남겼어요. 모은 시간에는 들어가요.';
    } else {
      desc.innerHTML = REASONS[r.reason] + '1분이 안 돼서 정원에는 기록하지 않았어요.';
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

    $('result-garden').lastChild.textContent = ok ? '정원에 심기' : '정원 보러 가기';
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
  }

  /* ===== 5. 내 정원 ===== */
  function weekKeyOf(r) { return weekStart(new Date(r.at)).getTime(); }

  function weekTitle(startMs) {
    var thisWeek = weekStart(new Date()).getTime();
    var lastWeek = weekStart(new Date(thisWeek - 86400000)).getTime();
    if (startMs === thisWeek) return '이번 주 화단';
    if (startMs === lastWeek) return '지난주 화단';
    var start = new Date(startMs);
    var end = new Date(startMs);
    end.setDate(end.getDate() + 6);
    return md(start) + ' ~ ' + md(end) + ' 화단';
  }

  function plotItem(r) {
    var sp = P.find(r.plant);
    var date = new Date(r.at);
    var badge = r.ok
      ? '<span class="bed__badge">' + ICON('check') + '꽃 피움</span>'
      : '<span class="bed__badge bed__badge--wilted">' + ICON('alert') + P.STAGES[r.stage] + '에서 시듦</span>';
    return '<li class="bed__item' + (r.id === lastPlantedId ? ' bed__item--new' : '') + '">' +
      '<span class="bed__plant">' + P.svg(sp.id, r.stage, { ground: true, wilted: !r.ok }) + '</span>' +
      '<span class="bed__name">' + sp.name + '</span>' + badge +
      '<span class="bed__meta">' + fmtMin(r.minutes) + (r.bonus ? ' (보너스 ' + r.bonus + '분)' : '') + ' · ' + md(date) + '</span>' +
    '</li>';
  }

  function renderGarden() {
    var total = totalMinutes();
    var records = data.records.slice().reverse(); // 최근 것부터

    $('stat-total').textContent = fmtMin(total);
    $('stat-week').textContent = weekSuccessDays() + '일';
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

    // 주간 화단 (최근 주부터)
    var weeks = [];
    var byWeek = {};
    records.forEach(function (r) {
      var key = weekKeyOf(r);
      if (!byWeek[key]) { byWeek[key] = []; weeks.push(key); }
      byWeek[key].push(r);
    });
    var thisWeek = weekStart(new Date()).getTime();
    if (records.length && !byWeek[thisWeek]) { byWeek[thisWeek] = []; weeks.unshift(thisWeek); }

    $('beds').innerHTML = weeks.map(function (key, i) {
      var list = byWeek[key];
      var id = 'bed-' + i;
      return '<section class="bed" aria-labelledby="' + id + '">' +
        '<h4 class="bed__title" id="' + id + '">' + weekTitle(key) + ' <span class="bed__count">' + list.length + '그루</span></h4>' +
        (list.length
          ? '<ul class="bed__list">' + list.map(plotItem).join('') + '</ul>'
          : '<p class="bed__empty">이번 주 화단은 아직 비어 있어요. 첫 식물을 심어 보세요.</p>') +
      '</section>';
    }).join('');
    lastPlantedId = null;

    var empty = records.length === 0;
    $('garden-empty').hidden = !empty;
    $('garden-clear').hidden = empty;
    $('share-box').hidden = empty;
    $('share-status').textContent = '';
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

  /* ===== 화단 사진 저장 · 공유 (Canvas) ===== */
  var shareBtn = $('share-btn');
  var shareStatus = $('share-status');

  function loadSvg(markup) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawGarden() {
    var thisWeek = weekStart(new Date()).getTime();
    var list = data.records.filter(function (r) { return weekKeyOf(r) === thisWeek; });
    var title = '이번 주 화단';
    if (!list.length) { list = data.records; title = '최근 화단'; }
    list = list.slice(-12); // 최대 12그루 (4 × 3줄)

    var W = 1080, H = 1350;
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');
    var font = '"Pretendard", "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

    // 배경
    ctx.fillStyle = '#f6f3ea';
    ctx.fillRect(0, 0, W, H);

    // 제목
    ctx.fillStyle = '#2b5a1b';
    ctx.font = '800 64px ' + font;
    ctx.fillText('자라는 시간', 80, 140);
    ctx.fillStyle = '#1e2619';
    ctx.font = '700 44px ' + font;
    ctx.fillText(title, 80, 210);

    // 통계
    var stats = [
      ['모은 시간', fmtMin(totalMinutes())],
      ['이번 주 성공', weekSuccessDays() + '일'],
      ['심은 식물', data.records.length + '그루']
    ];
    stats.forEach(function (s, i) {
      var x = 80 + i * 313;
      ctx.fillStyle = '#fffdf7';
      roundRect(ctx, x, 260, 293, 150, 24);
      ctx.fill();
      ctx.fillStyle = '#45503f';
      ctx.font = '700 30px ' + font;
      ctx.fillText(s[0], x + 28, 312);
      ctx.fillStyle = '#2b5a1b';
      ctx.font = '800 46px ' + font;
      ctx.fillText(s[1], x + 28, 375);
    });

    // 화단 (심은 만큼만 줄을 그리고, 가운데로 모음)
    var cols = 4, cellW = 230, cellH = 250, left = 80;
    var rows = Math.max(1, Math.ceil(list.length / cols));
    var top = 440 + ((3 - rows) * cellH) / 2;
    for (var row = 0; row < rows; row++) {
      ctx.fillStyle = '#6b4a2e';
      roundRect(ctx, left - 20, top + row * cellH + 196, cellW * cols + 40, 40, 20);
      ctx.fill();
    }

    return Promise.all(list.map(function (r) {
      return loadSvg(P.svg(r.plant, r.stage, { ground: true, flat: true, wilted: !r.ok }));
    })).then(function (imgs) {
      imgs.forEach(function (img, i) {
        var col = i % cols;
        var row = Math.floor(i / cols);
        var w = 200, h = w * 114 / 120;
        ctx.drawImage(img, left + col * cellW + (cellW - w) / 2, top + row * cellH + 214 - h, w, h);
      });
      ctx.fillStyle = '#45503f';
      ctx.font = '700 30px ' + font;
      ctx.fillText(md(new Date()) + ' · 폰을 내려놓은 만큼 자라는 정원', 80, H - 60);
      return new Promise(function (resolve) { canvas.toBlob(resolve, 'image/png'); });
    });
  }

  shareBtn.addEventListener('click', function () {
    shareBtn.disabled = true;
    shareStatus.textContent = '사진을 만드는 중이에요…';
    drawGarden().then(function (blob) {
      if (!blob) throw new Error('blob');
      var d = new Date();
      var name = 'growtime-garden-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.png';
      var file = new File([blob], name, { type: 'image/png' });

      // 휴대폰: 공유 창 (카톡·인스타 등) / 그 밖: 파일로 저장
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: '자라는 시간 · 내 정원' }).then(function () {
          shareStatus.textContent = '공유 창을 열었어요.';
        });
      }
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      shareStatus.textContent = '사진을 저장했어요. 다운로드 폴더를 확인해 주세요.';
    }).catch(function (err) {
      shareStatus.textContent = err && err.name === 'AbortError'
        ? '공유를 취소했어요.'
        : '사진을 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.';
    }).finally(function () {
      shareBtn.disabled = false;
    });
  });

  /* ===== 시작 ===== */
  if (!canStore) $('storage-notice').hidden = false;
  applyFont();

  // 진행 중에 창이 닫혔던 경우 → 마지막으로 확인된 시각까지로 처리
  var leftover = load(SESSION_KEY, null);
  if (leftover && leftover.start && leftover.duration) {
    var lastAt = leftover.leftAt || leftover.lastSeen || leftover.start;
    if (leftover.phase === 'bonus' && leftover.bonusStart) {
      finish({ ok: true, held: leftover.duration, bonus: lastAt - leftover.bonusStart, reason: 'done' }, leftover);
    } else {
      var held = lastAt - leftover.start;
      if (held >= leftover.duration) finish({ ok: true, held: leftover.duration, bonus: held - leftover.duration, reason: 'done' }, leftover);
      else finish({ ok: false, held: held, reason: 'reload' }, leftover);
    }
  } else {
    route(false);
  }
})();
