/* 2. 진행 화면: 자라기 → (급한 일) → 꽃 핀 뒤 보너스, 이탈 감지 */
((GT) => {
  'use strict';

  const config = GT.config;
  const util = GT.util;
  const $ = util.$;
  const store = GT.store;
  const plants = GT.plants;

  const CIRCUMFERENCE = 2 * Math.PI * 100; // 게이지 원 둘레 (r=100)
  const CAPTIONS = ['씨앗을 심었어요', '새싹이 났어요', '잎이 자랐어요', '꽃이 피었어요'];
  const LOCK_TEXT = {
    on: '화면이 꺼지지 않게 해 두었어요. 폰을 엎어두세요.',
    onBonus: '화면이 켜져 있어요. 확인했으면 위 버튼을 눌러 주세요.',
    fail: '화면 켜짐 유지를 켜지 못했어요. 화면이 꺼지면 식물이 시드니, ‘화면 자동 꺼짐’ 시간을 늘려 주세요.',
    unsupported: '이 브라우저는 화면 켜짐 유지를 지원하지 않아요. 화면이 꺼지면 식물이 시드니, 휴대폰 설정에서 ‘화면 자동 꺼짐’ 시간을 늘려 주세요.'
  };

  const el = {
    screen: $('screenRun'),
    plantBox: $('runPlant'),
    time: $('runTime'),
    timeTitle: $('runTimeTitle'),
    live: $('runLive'),
    caption: $('runStageLabel'),
    alertBox: $('runAlert'),
    lockText: $('runLock'),
    gaugeBar: $('gaugeBar'),
    gaugeBonus: $('gaugeBonus'),
    doneBtn: $('doneBtn'),
    quitBtn: $('quitBtn'),
    bonusDesc: $('bonusDesc')
  };
  const baseTitle = document.title;

  /**
   * run.phase — grow: 자라는 중 / paused: 급한 일 선택 대기 / bonus: 꽃 핀 뒤
   */
  let run = null;
  let ticker = null;

  [el.gaugeBar, el.gaugeBonus].forEach((c) => {
    c.setAttribute('stroke-dasharray', CIRCUMFERENCE.toFixed(2));
    c.setAttribute('stroke-dashoffset', CIRCUMFERENCE.toFixed(2));
  });

  const isRunning = () => !!run;

  function saveSession() {
    store.session.set({
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

  function showAlert(text) {
    el.alertBox.innerHTML = util.ico('alert') + '<span>' + text + '</span>';
    el.alertBox.hidden = false;
  }

  function keepAwake() {
    GT.device.keepAwake().then((status) => {
      if (status === 'on' && run && run.phase === 'bonus') status = 'onBonus';
      if (run) el.lockText.textContent = LOCK_TEXT[status];
    });
  }

  /* ===== 시작 ===== */
  function start() {
    const settings = store.settings;
    const min = settings.minutes || 25;
    let plant = plants.find(settings.plant);
    if (!store.isUnlocked(plant)) plant = plants.SPECIES[0];

    const now = Date.now();
    run = {
      start: now,
      duration: min * config.MINUTE,
      plant: plant.id,
      phase: 'grow',
      bonusStart: null,
      lastSeen: now,
      lastSaved: 0,
      leftAt: null,
      usedPause: false,
      stage: 0,
      remainMin: null
    };
    saveSession();

    el.plantBox.innerHTML = plants.svg(plant.id, 0);
    el.caption.textContent = CAPTIONS[0];
    el.timeTitle.textContent = '남은 시간';
    el.gaugeBonus.setAttribute('stroke-dashoffset', CIRCUMFERENCE.toFixed(2));
    el.alertBox.hidden = true;
    el.doneBtn.hidden = true;
    el.bonusDesc.hidden = true;
    el.quitBtn.hidden = false;
    el.lockText.textContent = '';
    el.screen.classList.remove('run--bonus');

    GT.ui.show('run');
    keepAwake();
    el.live.textContent = plant.name + ' 씨앗을 심었어요. 남은 시간 ' + util.fmtMin(min) + '.';
    tick();
    ticker = setInterval(tick, 500);
  }

  /* ===== 끝 → 결과 화면 ===== */
  // r: { ok, held(자란 ms), bonus(보너스 ms), reason }
  function end(r) {
    const info = run;
    clearInterval(ticker);
    ticker = null;
    run = null;
    GT.device.releaseAwake();
    store.session.clear();
    document.title = baseTitle;
    GT.ui.closeConfirm(); // 열려 있던 확인 창은 고르지 않은 채로 닫기
    GT.result.finish(r, info);
  }

  /* ===== 자라기 ===== */
  function setStage(stage) {
    if (stage === run.stage) return;
    run.stage = stage;
    el.plantBox.querySelector('.plant').setAttribute('data-stage', String(stage));
    el.caption.textContent = CAPTIONS[stage];
    el.live.textContent = CAPTIONS[stage] + '.';
  }

  // 꽃이 핌 → 보너스 시간 시작
  function enterBonus(at) {
    run.phase = 'bonus';
    run.bonusStart = at;
    setStage(3);
    el.gaugeBar.setAttribute('stroke-dashoffset', '0');
    el.screen.classList.add('run--bonus');
    el.timeTitle.textContent = '보너스 시간';
    el.caption.textContent = '꽃이 피었어요';
    el.alertBox.hidden = true;
    el.quitBtn.hidden = true;
    el.doneBtn.hidden = false;
    el.bonusDesc.hidden = false;
    el.lockText.textContent = '';
    el.live.textContent = '꽃이 피었어요. 지금부터는 보너스 시간이에요. 확인했으면 정원에 심기 버튼을 눌러 주세요.';
    saveSession();

    GT.device.chime();
    GT.device.vibrate();
  }

  function tick() {
    if (!run || document.hidden || run.phase === 'paused') return;
    const now = Date.now();

    if (run.phase === 'grow') {
      const elapsed = now - run.start; // 시작 시각과의 차이로 계산 → 백그라운드 지연에도 정확
      if (elapsed >= run.duration) {
        enterBonus(run.start + run.duration);
      } else {
        const remain = run.duration - elapsed;
        const ratio = elapsed / run.duration;
        const clock = util.fmtClock(remain);

        el.time.textContent = clock;
        el.time.setAttribute('datetime', 'PT' + Math.ceil(remain / 1000) + 'S');
        document.title = clock + ' 남음 - 자라는 시간';
        el.gaugeBar.setAttribute('stroke-dashoffset', (CIRCUMFERENCE * (1 - ratio)).toFixed(2));
        setStage(plants.stageOf(ratio));

        // 스크린리더: 남은 시간은 1분 단위로만 안내
        const remainMin = Math.ceil(remain / config.MINUTE);
        if (run.remainMin !== null && remainMin !== run.remainMin) {
          el.live.textContent = '남은 시간 ' + util.fmtMin(remainMin) + '.';
        }
        run.remainMin = remainMin;
      }
    }

    if (run.phase === 'bonus') {
      const bonus = now - run.bonusStart;
      if (bonus >= config.BONUS_MAX) {
        end({ ok: true, held: run.duration, bonus: config.BONUS_MAX, reason: 'done' });
        return;
      }
      const up = util.fmtClock(bonus, true);
      el.time.textContent = '+' + up;
      el.time.setAttribute('datetime', 'PT' + Math.floor(bonus / 1000) + 'S');
      document.title = '꽃이 피었어요 +' + up + ' - 자라는 시간';
      el.gaugeBonus.setAttribute('stroke-dashoffset', (CIRCUMFERENCE * (1 - bonus / config.BONUS_MAX)).toFixed(2));
    }

    run.lastSeen = now;
    if (now - run.lastSaved > 5000) {
      run.lastSaved = now;
      saveSession();
    }
  }

  /* ===== 이탈 감지: 다른 앱으로 넘어가거나 화면이 꺼지면 hidden ===== */
  document.addEventListener('visibilitychange', () => {
    if (!run) return;
    const now = Date.now();

    if (document.hidden) {
      // 꽃이 핀 뒤 나가면 거기까지를 보너스로 인정하고 마무리
      if (run.phase === 'bonus') {
        end({ ok: true, held: run.duration, bonus: now - run.bonusStart, reason: 'done' });
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
    const leftAt = run.leftAt;
    const away = now - leftAt;
    const held = leftAt - run.start;
    run.leftAt = null;

    if (held >= run.duration) {
      // 나가기 전에 이미 꽃이 핌 → 나간 시각까지 보너스 인정
      end({ ok: true, held: run.duration, bonus: held - run.duration, reason: 'done' });
    } else if (away <= config.GRACE) {
      showAlert('다른 화면에 ' + util.fmtAway(away) + ' 다녀왔어요. 10초 넘게 나가 있으면 식물이 시들어요.');
      keepAwake(); // 화면을 벗어나면 해제되므로 다시 요청
      saveSession();
      tick();
    } else if (!run.usedPause && away <= config.PAUSE_MAX) {
      askPause(leftAt, away);
    } else {
      end({ ok: false, held: held, reason: run.usedPause ? 'left-again' : 'left-long' });
    }
  });

  // 급한 일(전화 등) 이어하기: 한 번만, 비운 시간은 빼고 계산
  function askPause(leftAt, away) {
    run.phase = 'paused';
    run.leftAt = leftAt;
    saveSession();
    GT.ui.confirm({
      title: '자리를 비웠어요',
      desc: util.fmtAway(away) + ' 동안 다른 화면에 있었어요. 전화처럼 급한 일이었다면 한 번만 이어서 할 수 있어요. 비운 시간은 빼고 계산해요.',
      ok: '급한 일이었어요, 이어서 하기',
      cancel: '그만두기 (식물이 시들어요)',
      okPrimary: true,
      cancelDanger: true,
      required: true,
      onOk() {
        if (!run) return;
        run.start += Date.now() - run.leftAt; // 비운 시간만큼 시작 시각을 미룸
        run.leftAt = null;
        run.usedPause = true;
        run.phase = 'grow';
        showAlert('이어서 자라는 중이에요. 이어하기는 이번 한 번만 쓸 수 있어요.');
        keepAwake();
        saveSession();
        tick();
      },
      onCancel() {
        if (!run) return;
        end({ ok: false, held: run.leftAt - run.start, reason: 'left' });
      }
    });
  }

  /* ===== 버튼 ===== */
  el.quitBtn.addEventListener('click', () => {
    if (!run || run.phase !== 'grow') return;
    const held = Math.floor((Date.now() - run.start) / config.MINUTE);
    GT.ui.confirm({
      title: '정말 그만둘까요?',
      desc: '지금 그만두면 식물이 시들어요. ' + (held >= 1
        ? '지금까지 버틴 ' + util.fmtMin(held) + '은 시든 모습 그대로 정원에 남아요.'
        : '1분이 안 돼서 정원에는 기록되지 않아요.'),
      ok: '그만두기',
      cancel: '계속하기',
      onOk() {
        if (run && run.phase === 'grow') end({ ok: false, held: Date.now() - run.start, reason: 'quit' });
      }
    });
  });

  el.doneBtn.addEventListener('click', () => {
    if (!run || run.phase !== 'bonus') return;
    end({ ok: true, held: run.duration, bonus: Date.now() - run.bonusStart, reason: 'done' });
  });

  GT.timer = { start: start, isRunning: isRunning };
})(window.GT = window.GT || {});
