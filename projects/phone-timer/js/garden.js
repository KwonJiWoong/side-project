/* 4. 내 정원: 통계 · 다음 식물 · 주간 화단 */
(function (GT) {
  'use strict';

  var util = GT.util;
  var $ = util.$;
  var store = GT.store;
  var plants = GT.plants;

  var newId = null; // 방금 심은 식물 (한 번만 강조)

  function markNew(id) { newId = id; }

  function weekTitle(startMs) {
    var thisWeek = util.weekStart(new Date()).getTime();
    var lastWeek = util.weekStart(new Date(thisWeek - 86400000)).getTime();
    if (startMs === thisWeek) return '이번 주 화단';
    if (startMs === lastWeek) return '지난주 화단';
    var start = new Date(startMs);
    var end = new Date(startMs);
    end.setDate(end.getDate() + 6);
    return util.md(start) + ' ~ ' + util.md(end) + ' 화단';
  }

  function bedItem(r) {
    var sp = plants.find(r.plant);
    var badge = r.ok
      ? '<span class="bed__badge">' + util.icon('check') + '꽃 피움</span>'
      : '<span class="bed__badge bed__badge--wilted">' + util.icon('alert') + plants.STAGES[r.stage] + '에서 시듦</span>';
    return '<li class="bed__item' + (r.id === newId ? ' bed__item--new' : '') + '">' +
      '<span class="bed__plant">' + plants.svg(sp.id, r.stage, { ground: true, wilted: !r.ok }) + '</span>' +
      '<span class="bed__name">' + sp.name + '</span>' + badge +
      '<span class="bed__meta">' + util.fmtMin(r.minutes) + (r.bonus ? ' (보너스 ' + r.bonus + '분)' : '') + ' · ' + util.md(new Date(r.at)) + '</span>' +
    '</li>';
  }

  /* ===== 화면 그리기 ===== */
  function render() {
    var total = store.totalMinutes();
    var records = store.data.records.slice().reverse(); // 최근 것부터

    $('stat-total').textContent = util.fmtMin(total);
    $('stat-week').textContent = store.weekSuccessDays() + '일';
    $('stat-count').textContent = records.length + '그루';

    // 다음 해금까지
    var next = null;
    var prev = 0;
    plants.SPECIES.forEach(function (sp) {
      if (!next && sp.unlock > total) next = sp;
      if (sp.unlock <= total) prev = sp.unlock;
    });
    var pct = next ? Math.round(((total - prev) / (next.unlock - prev)) * 100) : 100;
    $('next-text').textContent = next
      ? '‘' + next.name + '’까지 ' + util.fmtMin(next.unlock - total) + ' 남았어요. (모은 시간 ' + util.fmtMin(total) + ' / ' + util.fmtMin(next.unlock) + ')'
      : '모든 식물을 모았어요. 앞으로도 꾸준히 키워 보세요!';
    $('next-bar').setAttribute('aria-valuenow', String(pct));
    $('next-bar').setAttribute('aria-valuetext', pct + '%');
    $('next-fill').style.width = pct + '%'; // 값이 바뀌는 너비라 CSSOM으로

    // 주간 화단 (최근 주부터)
    var weeks = [];
    var byWeek = {};
    records.forEach(function (r) {
      var key = store.weekKeyOf(r);
      if (!byWeek[key]) { byWeek[key] = []; weeks.push(key); }
      byWeek[key].push(r);
    });
    var thisWeek = util.weekStart(new Date()).getTime();
    if (records.length && !byWeek[thisWeek]) { byWeek[thisWeek] = []; weeks.unshift(thisWeek); }

    $('beds').innerHTML = weeks.map(function (key, i) {
      var list = byWeek[key];
      var id = 'bed-' + i;
      return '<section class="bed" aria-labelledby="' + id + '">' +
        '<h4 class="bed__title" id="' + id + '">' + weekTitle(key) + ' <span class="bed__count">' + list.length + '그루</span></h4>' +
        (list.length
          ? '<ul class="bed__list">' + list.map(bedItem).join('') + '</ul>'
          : '<p class="bed__empty">이번 주 화단은 아직 비어 있어요. 첫 식물을 심어 보세요.</p>') +
      '</section>';
    }).join('');
    newId = null;

    var empty = records.length === 0;
    $('garden-empty').hidden = !empty;
    $('garden-clear').hidden = empty;
    $('share-box').hidden = empty;
    $('share-status').textContent = '';
  }

  /* ===== 정원 비우기 ===== */
  $('garden-clear').addEventListener('click', function () {
    GT.ui.confirm({
      title: '정원을 비울까요?',
      desc: '심은 식물과 모은 시간이 모두 지워지고, 열린 식물도 다시 잠겨요. 지운 뒤에는 되돌릴 수 없어요.',
      ok: '모두 지우기',
      cancel: '취소',
      onOk: function () {
        store.clearRecords();
        render();
        GT.ui.headings.garden.focus();
      }
    });
  });

  GT.garden = { render: render, markNew: markNew };
})(window.GT = window.GT || {});
