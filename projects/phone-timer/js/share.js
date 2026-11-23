/* 화단 사진 만들기 · 공유 (Canvas 1080×1350) */
(function (GT) {
  'use strict';

  var util = GT.util;
  var $ = util.$;
  var store = GT.store;
  var plants = GT.plants;

  var FONT = '"Pretendard", "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  var W = 1080;
  var H = 1350;

  var shareBtn = $('share-btn');
  var shareStatus = $('share-status');

  /* ===== 그리기 도우미 ===== */
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

  /* ===== 사진 그리기 → PNG Blob ===== */
  function draw() {
    var records = store.data.records;
    var thisWeek = util.weekStart(new Date()).getTime();
    var list = records.filter(function (r) { return store.weekKeyOf(r) === thisWeek; });
    var title = '이번 주 화단';
    if (!list.length) { list = records; title = '최근 화단'; }
    list = list.slice(-12); // 최대 12그루 (4 × 3줄)

    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    // 배경
    ctx.fillStyle = '#f6f3ea';
    ctx.fillRect(0, 0, W, H);

    // 제목
    ctx.fillStyle = '#2b5a1b';
    ctx.font = '800 64px ' + FONT;
    ctx.fillText('자라는 시간', 80, 140);
    ctx.fillStyle = '#1e2619';
    ctx.font = '700 44px ' + FONT;
    ctx.fillText(title, 80, 210);

    // 통계
    var stats = [
      ['모은 시간', util.fmtMin(store.totalMinutes())],
      ['이번 주 성공', store.weekSuccessDays() + '일'],
      ['심은 식물', records.length + '그루']
    ];
    stats.forEach(function (s, i) {
      var x = 80 + i * 313;
      ctx.fillStyle = '#fffdf7';
      roundRect(ctx, x, 260, 293, 150, 24);
      ctx.fill();
      ctx.fillStyle = '#45503f';
      ctx.font = '700 30px ' + FONT;
      ctx.fillText(s[0], x + 28, 312);
      ctx.fillStyle = '#2b5a1b';
      ctx.font = '800 46px ' + FONT;
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
      return loadSvg(plants.svg(r.plant, r.stage, { ground: true, flat: true, wilted: !r.ok }));
    })).then(function (imgs) {
      imgs.forEach(function (img, i) {
        var col = i % cols;
        var row = Math.floor(i / cols);
        var w = 200, h = w * 114 / 120;
        ctx.drawImage(img, left + col * cellW + (cellW - w) / 2, top + row * cellH + 214 - h, w, h);
      });
      ctx.fillStyle = '#45503f';
      ctx.font = '700 30px ' + FONT;
      ctx.fillText(util.md(new Date()) + ' · 폰을 내려놓은 만큼 자라는 정원', 80, H - 60);
      return new Promise(function (resolve) { canvas.toBlob(resolve, 'image/png'); });
    });
  }

  /* ===== 저장 · 공유 ===== */
  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  shareBtn.addEventListener('click', function () {
    shareBtn.disabled = true;
    shareStatus.textContent = '사진을 만드는 중이에요…';
    draw().then(function (blob) {
      if (!blob) throw new Error('blob');
      var d = new Date();
      var name = 'growtime-garden-' + d.getFullYear() + util.pad(d.getMonth() + 1) + util.pad(d.getDate()) + '.png';
      var file = new File([blob], name, { type: 'image/png' });

      // 휴대폰: 공유 창 (카톡·인스타 등) / 그 밖: 파일로 저장
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: '자라는 시간 · 내 정원' }).then(function () {
          shareStatus.textContent = '공유 창을 열었어요.';
        });
      }
      download(blob, name);
      shareStatus.textContent = '사진을 저장했어요. 다운로드 폴더를 확인해 주세요.';
    }).catch(function (err) {
      shareStatus.textContent = err && err.name === 'AbortError'
        ? '공유를 취소했어요.'
        : '사진을 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.';
    }).finally(function () {
      shareBtn.disabled = false;
    });
  });

  GT.share = { draw: draw };
})(window.GT = window.GT || {});
