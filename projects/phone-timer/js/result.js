/* 3. 결과 화면 + 기록 남기기 */
((GT) => {
  'use strict';

  const config = GT.config;
  const util = GT.util;
  const $ = util.$;
  const store = GT.store;
  const plants = GT.plants;

  // 시들었을 때 앞에 붙는 이유
  const REASONS = {
    left: '',
    quit: '',
    'left-long': '다른 화면에 5분 넘게 나가 있었어요. ',
    'left-again': '이어하기는 한 번만 쓸 수 있어서, 이번에는 시들었어요. ',
    reload: '타이머가 도는 중에 창이 닫혔거나 새로고침됐어요. ',
    done: ''
  };

  const el = {
    screen: $('screenResult'),
    resultAgain: $('resultAgain'),
    resultDesc: $('resultDesc'),
    resultGarden: $('resultGarden'),
    resultPlant: $('resultPlant'),
    resultTitle: $('resultTitle'),
    resultUnlock: $('resultUnlock'),
    resultBadge: $('resultBadge'),
    resultShare: $('resultShare'),
    resultShareStatus: $('resultShareStatus')
  };

  let last = null; // 자랑하기 카드에 쓸 이번 결과

  /**
   * 모든 끝을 여기서 처리
   * r: { ok, held(자란 시간 ms), bonus(보너스 ms), reason }
   * info: 진행 정보 { duration, plant } (진행 화면 또는 복구한 세션)
   */
  function finish(r, info) {
    const ok = r.ok;
    const held = Math.max(0, Math.min(r.held, info.duration));
    const bonus = ok ? Math.max(0, Math.min(r.bonus || 0, config.BONUS_MAX)) : 0;
    const minutes = Math.floor((held + bonus) / config.MINUTE);
    const bonusMin = Math.floor(bonus / config.MINUTE);
    const stage = ok ? 3 : plants.stageOf(held / info.duration);
    const sp = plants.find(info.plant);

    // 기록 (1분 이상 버틴 경우만. 실패해도 버틴 단계로 남기되, 시든 모습으로)
    const before = store.totalMinutes();
    const badgesBefore = GT.badges.earned(store.data.records);
    let record = null;
    if (minutes >= 1) {
      record = { id: Date.now(), plant: sp.id, stage: stage, minutes: minutes, bonus: bonusMin, ok: ok, at: new Date().toISOString() };
      if (config.FAST) record.fast = true; // 확인용 빠른 모드 기록은 배지·자랑하기에서 뺌
      store.addRecord(record);
      GT.garden.markNew(record.id);
    }
    const after = store.totalMinutes();
    const unlocked = plants.SPECIES.filter((s) => { return !store.isUnlocked(s, before) && store.isUnlocked(s, after); });
    const newBadges = GT.badges.newOnes(badgesBefore, GT.badges.earned(store.data.records));

    // 화면 채우기
    el.screen.classList.toggle('result--success', ok);
    el.screen.classList.toggle('result--fail', !ok);

    const plantBox = el.resultPlant;
    plantBox.innerHTML = plants.svg(sp.id, ok ? 2 : stage, { label: true });
    const svgEl = plantBox.querySelector('.plant');
    svgEl.setAttribute('aria-label', sp.name + ', ' + plants.STAGES[stage] + ' 단계' + (ok ? '' : '(시듦)'));

    el.resultTitle.textContent = ok ? '꽃이 피었어요' : '시들었어요';

    const desc = el.resultDesc;
    const heldMin = Math.floor(held / config.MINUTE);
    if (ok) {
      desc.innerHTML = '<strong>' + util.fmtMin(heldMin) + '</strong> 동안 폰을 내려놓았어요.' +
        (bonusMin ? ' 꽃이 핀 뒤에도 <strong>보너스 ' + util.fmtMin(bonusMin) + '</strong>을 더 모았어요.' : '') +
        ' ' + sp.name + ' 꽃을 정원에 심어 보세요.';
    } else if (record) {
      desc.innerHTML = REASONS[r.reason] + '<strong>' + util.fmtMin(minutes) + '</strong> 버텼어요. ' +
        '‘' + plants.STAGES[stage] + '’ 단계에서 시든 모습 그대로 정원에 남겼어요. 모은 시간에는 들어가요.';
    } else {
      desc.innerHTML = REASONS[r.reason] + '1분이 안 돼서 정원에는 기록하지 않았어요.';
    }

    const unlockBox = el.resultUnlock;
    if (unlocked.length) {
      const names = unlocked.map((s) => { return '‘' + s.name + '’'; }).join(', ');
      const lastName = unlocked[unlocked.length - 1].name;
      unlockBox.textContent = '새 식물 ' + names + util.josa(lastName, '이', '가') + ' 열렸어요! 다음 타이머부터 고를 수 있어요.';
      unlockBox.hidden = false;
    } else {
      unlockBox.hidden = true;
    }

    if (newBadges.length) {
      const names = newBadges.map((b) => '‘' + b.name + '’').join(', ');
      const lastName = newBadges[newBadges.length - 1].name;
      el.resultBadge.textContent = '새 배지 ' + names + util.josa(lastName, '을', '를') + ' 받았어요! 내 정원에서 볼 수 있어요.';
      el.resultBadge.hidden = false;
    } else {
      el.resultBadge.hidden = true;
    }

    // 자랑하기: 꽃을 피웠을 때만 (시든 기록은 사용자가 고르지 않는 한 공유하지 않음)
    last = ok && record ? { plant: sp.id, heldMin: heldMin, bonusMin: bonusMin, at: record.at, badges: newBadges.map((b) => b.id) } : null;
    el.resultShare.hidden = !last || config.FAST;
    el.resultShareStatus.textContent = last && config.FAST ? '확인용 빠른 모드에서는 자랑하기 카드를 만들지 않아요.' : '';

    el.resultGarden.lastChild.textContent = ok ? '정원에 심기' : '정원 보러 가기';
    el.resultAgain.lastChild.textContent = ok ? '한 번 더 하기' : '다시 도전';

    GT.ui.show('result');
    history.replaceState(null, '', location.pathname + location.search); // 결과 화면은 주소 없이

    // 연출: 성공이면 꽃이 피고, 실패면 시듦
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (ok) svgEl.setAttribute('data-stage', '3');
        else svgEl.classList.add('plant--wilted');
      });
    });
  }

  /* ===== 자랑하기 ===== */
  el.resultShare.addEventListener('click', () => {
    if (!last) return;
    GT.share.shareToday(last, el.resultShare, el.resultShareStatus);
  });

  GT.result = { finish: finish };
})(window.GT = window.GT || {});
