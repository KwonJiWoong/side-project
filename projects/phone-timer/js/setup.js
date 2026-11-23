/* 1. 시작 화면 + 사용 안내 + 홈 화면에 추가 */
((GT) => {
  'use strict';

  const util = GT.util;
  const $ = util.$;
  const store = GT.store;
  const plants = GT.plants;
  const settings = store.settings;

  const el = {
    form: $('setupForm'),
    customWrap: $('customTime'),
    customInput: $('customMinutes'),
    customError: $('customError'),
    startLabel: $('startLabel'),
    seedList: $('seedList'),
    guide: $('guideDialog'),
    guideOk: $('guideOk'),
    guideCancel: $('guideCancel'),
    installDialog: $('installDialog'),
    installOpen: $('installOpen'),
    installNow: $('installNow'),
    batteryNote: $('batteryNote'),
    guideLockNote: $('guideLockNote'),
    guideOpen: $('guideOpen'),
    installClose: $('installClose'),
    soundToggle: $('soundToggle'),
    unlockDesc: $('unlockDesc')
  };

  /* ===== 시간 고르기 ===== */
  function selectedMinutes() {
    const picked = el.form.querySelector('input[name="minutes"]:checked');
    if (!picked) return 25;
    if (picked.value !== 'custom') return Number(picked.value);
    const n = Number(el.customInput.value);
    return Number.isInteger(n) && n >= 1 && n <= 180 ? n : null;
  }

  function updateStartLabel() {
    const picked = el.form.querySelector('input[name="minutes"]:checked');
    el.customWrap.hidden = !(picked && picked.value === 'custom');
    const min = selectedMinutes();
    el.startLabel.textContent = min ? util.fmtMin(min) + ' 시작하기' : '시작하기';
    el.batteryNote.hidden = !(min && min >= 50); // 오래 할 땐 충전 안내
  }

  /* ===== 화면 그리기 ===== */
  function render() {
    const total = store.totalMinutes();

    // 지난번 고른 시간 기억
    if (settings.minutes) {
      const preset = el.form.querySelector('input[name="minutes"][value="' + settings.minutes + '"]');
      if (preset) preset.checked = true;
      else {
        el.form.querySelector('input[name="minutes"][value="custom"]').checked = true;
        el.customInput.value = settings.minutes;
      }
    }
    updateStartLabel();

    // 식물 목록
    let chosen = plants.find(settings.plant);
    if (!store.isUnlocked(chosen, total)) chosen = plants.SPECIES[0];

    el.seedList.innerHTML = plants.SPECIES.map((sp) => {
      const open = store.isUnlocked(sp, total);
      const id = 'seed' + sp.id.charAt(0).toUpperCase() + sp.id.slice(1);
      const state = open ? '키울 수 있어요' : util.ico('lock') + util.fmtMin(sp.unlock) + ' 모으면 열려요';
      return '<li class="seed">' +
        '<input class="seed__input" type="radio" name="plant" id="' + id + '" value="' + sp.id + '"' +
          (open ? '' : ' disabled') + (sp.id === chosen.id ? ' checked' : '') + ' aria-describedby="' + id + 'State">' +
        '<label class="seed__card" for="' + id + '">' + plants.svg(sp.id, 3) +
          '<span class="seed__name">' + sp.name + '</span>' +
          '<span class="seed__state" id="' + id + 'State">' + state + '</span>' +
        '</label></li>';
    }).join('');

    const openCount = plants.SPECIES.filter((sp) => { return store.isUnlocked(sp, total); }).length;
    el.unlockDesc.textContent = '모은 시간 ' + util.fmtMin(total) + ' · 식물 ' + openCount + '/' + plants.SPECIES.length + '종. 시간을 모을수록 새 식물이 열려요.';
    el.soundToggle.checked = settings.sound;
  }

  /* ===== 입력 · 시작 ===== */
  el.form.addEventListener('change', (e) => {
    if (e.target.name === 'minutes') {
      updateStartLabel();
      if (e.target.value === 'custom') el.customInput.focus();
    }
    if (e.target.name === 'plant') {
      settings.plant = e.target.value;
      store.saveData();
    }
    if (e.target.id === 'soundToggle') {
      settings.sound = e.target.checked;
      store.saveData();
    }
  });

  el.customInput.addEventListener('input', () => {
    el.customInput.removeAttribute('aria-invalid');
    el.customError.textContent = '';
    updateStartLabel();
  });

  el.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const min = selectedMinutes();
    if (!min) {
      el.customInput.setAttribute('aria-invalid', 'true');
      el.customError.textContent = '1부터 180 사이의 숫자(분)를 넣어 주세요. 예: 30';
      el.customInput.focus();
      return;
    }
    settings.minutes = min;
    store.saveData();

    GT.device.unlockAudio();
    if (!settings.guideSeen) openGuide(true);
    else GT.timer.start();
  });

  /* ===== 사용 안내 ===== */
  let guideStartMode = false;

  if (!GT.device.canKeepAwake) {
    el.guideLockNote.textContent = '이 브라우저는 화면 켜짐 유지를 지원하지 않아요. 휴대폰 설정에서 ‘화면 자동 꺼짐’ 시간을 타이머보다 길게 바꿔 주세요.';
    el.guideLockNote.hidden = false;
  }

  // startMode: [시작하기]를 눌러 처음 연 경우 → 확인하면 바로 시작
  function openGuide(startMode) {
    guideStartMode = startMode;
    el.guideOk.textContent = startMode ? '알겠어요, 시작할게요' : '알겠어요';
    el.guideCancel.textContent = '다음에 할게요';
    el.guideCancel.hidden = !startMode;
    el.guide.showModal();
  }

  el.guideOk.addEventListener('click', () => {
    settings.guideSeen = true;
    store.saveData();
    el.guide.close();
    if (guideStartMode) GT.timer.start();
  });

  el.guideCancel.addEventListener('click', () => { el.guide.close(); });

  el.guideOpen.addEventListener('click', () => { openGuide(false); });

  /* ===== 홈 화면에 추가 ===== */
  let installPrompt = null;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  if (standalone) el.installOpen.hidden = true; // 이미 홈 화면 앱으로 연 경우

  // 안드로이드 Chrome 등: 바로 추가 버튼 제공
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
    el.installNow.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    el.installNow.hidden = true;
    el.installOpen.hidden = true;
  });

  el.installOpen.addEventListener('click', () => { el.installDialog.showModal(); });
  el.installClose.addEventListener('click', () => { el.installDialog.close(); });

  el.installNow.addEventListener('click', () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.finally(() => {
      installPrompt = null;
      el.installNow.hidden = true;
      el.installDialog.close();
    });
  });

  GT.setup = { render: render };
})(window.GT = window.GT || {});
