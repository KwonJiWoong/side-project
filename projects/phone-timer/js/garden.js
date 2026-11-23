/* 4. 내 정원: 통계 · 다음 식물 · 배지 · 주간 화단 */
((GT) => {
  'use strict';

  const util = GT.util;
  const $ = util.$;
  const el = {
    badgeCount: $('badgeCount'),
    badgeList: $('badgeList'),
    beds: $('beds'),
    gardenClear: $('gardenClear'),
    gardenEmpty: $('gardenEmpty'),
    nextBar: $('nextBar'),
    nextFill: $('nextFill'),
    nextText: $('nextText'),
    shareBox: $('shareBox'),
    shareStatus: $('shareStatus'),
    statCount: $('statCount'),
    statTotal: $('statTotal'),
    statWeek: $('statWeek')
  };
  const store = GT.store;
  const plants = GT.plants;

  let newId = null; // 방금 심은 식물 (한 번만 강조)

  const markNew = (id) => { newId = id; };

  function weekTitle(startMs) {
    const thisWeek = util.weekStart(new Date()).getTime();
    const lastWeek = util.weekStart(new Date(thisWeek - 86400000)).getTime();
    if (startMs === thisWeek) return '이번 주 화단';
    if (startMs === lastWeek) return '지난주 화단';
    const start = new Date(startMs);
    const end = new Date(startMs);
    end.setDate(end.getDate() + 6);
    return util.md(start) + ' ~ ' + util.md(end) + ' 화단';
  }

  function bedItem(r) {
    const sp = plants.find(r.plant);
    const badge = r.ok
      ? '<span class="bed__badge">' + util.ico('check') + '꽃 피움</span>'
      : '<span class="bed__badge bed__badge--wilted">' + util.ico('alert') + plants.STAGES[r.stage] + '에서 시듦</span>';
    return '<li class="bed__item' + (r.id === newId ? ' bed__item--new' : '') + '">' +
      '<span class="bed__plant">' + plants.svg(sp.id, r.stage, { ground: true, wilted: !r.ok }) + '</span>' +
      '<span class="bed__name">' + sp.name + '</span>' + badge +
      '<span class="bed__meta">' + util.fmtMin(r.minutes) + (r.bonus ? ' (보너스 ' + r.bonus + '분)' : '') + ' · ' + util.md(new Date(r.at)) + '</span>' +
    '</li>';
  }

  /* ===== 화면 그리기 ===== */
  function render() {
    const total = store.totalMinutes();
    const records = store.data.records.slice().reverse(); // 최근 것부터

    el.statTotal.textContent = util.fmtMin(total);
    el.statWeek.textContent = store.weekSuccessDays() + '일';
    el.statCount.textContent = records.length + '그루';

    // 다음 해금까지
    let next = null;
    let prev = 0;
    plants.SPECIES.forEach((sp) => {
      if (!next && sp.unlock > total) next = sp;
      if (sp.unlock <= total) prev = sp.unlock;
    });
    const pct = next ? Math.round(((total - prev) / (next.unlock - prev)) * 100) : 100;
    el.nextText.textContent = next
      ? '‘' + next.name + '’까지 ' + util.fmtMin(next.unlock - total) + ' 남았어요. (모은 시간 ' + util.fmtMin(total) + ' / ' + util.fmtMin(next.unlock) + ')'
      : '모든 식물을 모았어요. 앞으로도 꾸준히 키워 보세요!';
    el.nextBar.setAttribute('aria-valuenow', String(pct));
    el.nextBar.setAttribute('aria-valuetext', pct + '%');
    el.nextFill.style.width = pct + '%'; // 값이 바뀌는 너비라 CSSOM으로

    // 배지 (기록에서 매번 다시 셈)
    const got = GT.badges.earned(store.data.records);
    const list = GT.badges.BADGES;
    el.badgeCount.textContent = list.filter((b) => got[b.id]).length + '/' + list.length;
    el.badgeList.innerHTML = list.map((b) => {
      const at = got[b.id];
      const state = at
        ? util.ico('check') + util.md(new Date(at)) + ' 받음'
        : util.ico('lock') + '아직이에요';
      return '<li class="badge' + (at ? ' badge--on' : '') + '">' + GT.badges.svg(b.id, !!at) +
        '<span class="badge__name">' + b.name + '</span>' +
        '<span class="badge__desc">' + b.desc + '</span>' +
        '<span class="badge__state">' + state + '</span>' +
      '</li>';
    }).join('');

    // 주간 화단 (최근 주부터)
    const weeks = [];
    const byWeek = {};
    records.forEach((r) => {
      const key = store.weekKeyOf(r);
      if (!byWeek[key]) { byWeek[key] = []; weeks.push(key); }
      byWeek[key].push(r);
    });
    const thisWeek = util.weekStart(new Date()).getTime();
    if (records.length && !byWeek[thisWeek]) { byWeek[thisWeek] = []; weeks.unshift(thisWeek); }

    el.beds.innerHTML = weeks.map((key, i) => {
      const list = byWeek[key];
      const id = 'bed' + i;
      return '<section class="bed" aria-labelledby="' + id + '">' +
        '<h4 class="bed__title" id="' + id + '">' + weekTitle(key) + ' <span class="bed__count">' + list.length + '그루</span></h4>' +
        (list.length
          ? '<ul class="bed__list">' + list.map(bedItem).join('') + '</ul>'
          : '<p class="bed__empty">이번 주 화단은 아직 비어 있어요. 첫 식물을 심어 보세요.</p>') +
      '</section>';
    }).join('');
    newId = null;

    const empty = records.length === 0;
    el.gardenEmpty.hidden = !empty;
    el.gardenClear.hidden = empty;
    el.shareBox.hidden = empty;
    el.shareStatus.textContent = '';
  }

  /* ===== 정원 비우기 ===== */
  el.gardenClear.addEventListener('click', () => {
    GT.ui.confirm({
      title: '정원을 비울까요?',
      desc: '심은 식물과 모은 시간이 모두 지워지고, 열린 식물도 다시 잠겨요. 지운 뒤에는 되돌릴 수 없어요.',
      ok: '모두 지우기',
      cancel: '취소',
      onOk() {
        store.clearRecords();
        render();
        GT.ui.headings.garden.focus();
      }
    });
  });

  GT.garden = { render: render, markNew: markNew };
})(window.GT = window.GT || {});
