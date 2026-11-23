/* 1. 시작 화면 + 사용 안내 + 홈 화면에 추가 */
(function (GT) {
  'use strict';

  var util = GT.util;
  var $ = util.$;
  var store = GT.store;
  var plants = GT.plants;
  var settings = store.settings;

  var form = $('setup-form');
  var customWrap = $('custom-time');
  var customInput = $('custom-minutes');
  var customError = $('custom-error');
  var startLabel = $('start-label');
  var seedList = $('seed-list');

  /* ===== 시간 고르기 ===== */
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
    startLabel.textContent = min ? util.fmtMin(min) + ' 시작하기' : '시작하기';
    $('battery-note').hidden = !(min && min >= 50); // 오래 할 땐 충전 안내
  }

  /* ===== 화면 그리기 ===== */
  function render() {
    var total = store.totalMinutes();

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
    var chosen = plants.find(settings.plant);
    if (!store.isUnlocked(chosen, total)) chosen = plants.SPECIES[0];

    seedList.innerHTML = plants.SPECIES.map(function (sp) {
      var open = store.isUnlocked(sp, total);
      var id = 'seed-' + sp.id;
      var state = open ? '키울 수 있어요' : util.icon('lock') + util.fmtMin(sp.unlock) + ' 모으면 열려요';
      return '<li class="seed">' +
        '<input class="seed__input" type="radio" name="plant" id="' + id + '" value="' + sp.id + '"' +
          (open ? '' : ' disabled') + (sp.id === chosen.id ? ' checked' : '') + ' aria-describedby="' + id + '-state">' +
        '<label class="seed__card" for="' + id + '">' + plants.svg(sp.id, 3) +
          '<span class="seed__name">' + sp.name + '</span>' +
          '<span class="seed__state" id="' + id + '-state">' + state + '</span>' +
        '</label></li>';
    }).join('');

    var openCount = plants.SPECIES.filter(function (sp) { return store.isUnlocked(sp, total); }).length;
    $('unlock-desc').textContent = '모은 시간 ' + util.fmtMin(total) + ' · 식물 ' + openCount + '/' + plants.SPECIES.length + '종. 시간을 모을수록 새 식물이 열려요.';
    $('sound-toggle').checked = settings.sound;
  }

  /* ===== 입력 · 시작 ===== */
  form.addEventListener('change', function (e) {
    if (e.target.name === 'minutes') {
      updateStartLabel();
      if (e.target.value === 'custom') customInput.focus();
    }
    if (e.target.name === 'plant') {
      settings.plant = e.target.value;
      store.saveData();
    }
    if (e.target.id === 'sound-toggle') {
      settings.sound = e.target.checked;
      store.saveData();
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
    store.saveData();

    GT.device.unlockAudio();
    if (!settings.guideSeen) openGuide(true);
    else GT.timer.start();
  });

  /* ===== 사용 안내 ===== */
  var guide = $('guide-dialog');
  var guideOk = $('guide-ok');
  var guideCancel = $('guide-cancel');
  var guideStartMode = false;

  if (!GT.device.canKeepAwake) {
    var lockNote = $('guide-lock-note');
    lockNote.textContent = '이 브라우저는 화면 켜짐 유지를 지원하지 않아요. 휴대폰 설정에서 ‘화면 자동 꺼짐’ 시간을 타이머보다 길게 바꿔 주세요.';
    lockNote.hidden = false;
  }

  // startMode: [시작하기]를 눌러 처음 연 경우 → 확인하면 바로 시작
  function openGuide(startMode) {
    guideStartMode = startMode;
    guideOk.textContent = startMode ? '알겠어요, 시작할게요' : '알겠어요';
    guideCancel.textContent = '다음에 할게요';
    guideCancel.hidden = !startMode;
    guide.showModal();
  }

  guideOk.addEventListener('click', function () {
    settings.guideSeen = true;
    store.saveData();
    guide.close();
    if (guideStartMode) GT.timer.start();
  });

  guideCancel.addEventListener('click', function () { guide.close(); });

  $('guide-open').addEventListener('click', function () { openGuide(false); });

  /* ===== 홈 화면에 추가 ===== */
  var installDialog = $('install-dialog');
  var installOpen = $('install-open');
  var installNow = $('install-now');
  var installPrompt = null;
  var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  if (standalone) installOpen.hidden = true; // 이미 홈 화면 앱으로 연 경우

  // 안드로이드 Chrome 등: 바로 추가 버튼 제공
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    installPrompt = e;
    installNow.hidden = false;
  });

  window.addEventListener('appinstalled', function () {
    installPrompt = null;
    installNow.hidden = true;
    installOpen.hidden = true;
  });

  installOpen.addEventListener('click', function () { installDialog.showModal(); });
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

  GT.setup = { render: render };
})(window.GT = window.GT || {});
