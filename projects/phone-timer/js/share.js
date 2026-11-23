/* 화단 사진 만들기 · 공유 (Canvas 1080×1350) */
((GT) => {
  'use strict';

  const util = GT.util;
  const $ = util.$;
  const store = GT.store;
  const plants = GT.plants;

  const FONT = '"Pretendard", "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  const W = 1080;
  const H = 1350;

  const el = {
    shareBtn: $('shareBtn'),
    shareStatus: $('shareStatus')
  };

  /* ===== 그리기 도우미 ===== */
  function loadSvg(markup) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { resolve(img); };
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
    const records = store.data.records;
    const thisWeek = util.weekStart(new Date()).getTime();
    let list = records.filter((r) => { return store.weekKeyOf(r) === thisWeek; });
    let title = '이번 주 화단';
    if (!list.length) { list = records; title = '최근 화단'; }
    list = list.slice(-12); // 최대 12그루 (4 × 3줄)

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

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
    const stats = [
      ['모은 시간', util.fmtMin(store.totalMinutes())],
      ['이번 주 성공', store.weekSuccessDays() + '일'],
      ['심은 식물', records.length + '그루']
    ];
    stats.forEach((s, i) => {
      const x = 80 + i * 313;
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
    const cols = 4, cellW = 230, cellH = 250, left = 80;
    const rows = Math.max(1, Math.ceil(list.length / cols));
    const top = 440 + ((3 - rows) * cellH) / 2;
    for (let row = 0; row < rows; row++) {
      ctx.fillStyle = '#6b4a2e';
      roundRect(ctx, left - 20, top + row * cellH + 196, cellW * cols + 40, 40, 20);
      ctx.fill();
    }

    return Promise.all(list.map((r) => {
      return loadSvg(plants.svg(r.plant, r.stage, { ground: true, flat: true, wilted: !r.ok }));
    })).then((imgs) => {
      imgs.forEach((img, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const w = 200, h = w * 114 / 120;
        ctx.drawImage(img, left + col * cellW + (cellW - w) / 2, top + row * cellH + 214 - h, w, h);
      });
      ctx.fillStyle = '#45503f';
      ctx.font = '700 30px ' + FONT;
      ctx.fillText(util.md(new Date()) + ' · 폰을 내려놓은 만큼 자라는 정원', 80, H - 60);
      return new Promise((resolve) => { canvas.toBlob(resolve, 'image/png'); });
    });
  }

  /* ===== 저장 · 공유 ===== */
  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => { URL.revokeObjectURL(url); }, 1000);
  }

  // 사진 만들기 → 휴대폰은 공유 창(카톡·인스타 등), 그 밖은 파일로 저장
  function deliver(make, prefix, title, btn, status) {
    btn.disabled = true;
    status.textContent = '사진을 만드는 중이에요…';
    make().then((blob) => {
      if (!blob) throw new Error('blob');
      const d = new Date();
      const name = prefix + '-' + d.getFullYear() + util.pad(d.getMonth() + 1) + util.pad(d.getDate()) + '.png';
      const file = new File([blob], name, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: title }).then(() => {
          status.textContent = '공유 창을 열었어요.';
        });
      }
      download(blob, name);
      status.textContent = '사진을 저장했어요. 다운로드 폴더를 확인해 주세요.';
    }).catch((err) => {
      status.textContent = err && err.name === 'AbortError'
        ? '공유를 취소했어요.'
        : '사진을 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.';
    }).finally(() => {
      btn.disabled = false;
    });
  }

  el.shareBtn.addEventListener('click', () => {
    deliver(draw, 'growtime-garden', '자라는 시간 · 내 정원', el.shareBtn, el.shareStatus);
  });

  /* ===== 자랑하기 카드 (결과 화면, 1080×1920 세로) ===== */
  function drawToday(last) {
    const W2 = 1080;
    const H2 = 1920;
    const sp = plants.find(last.plant);
    const canvas = document.createElement('canvas');
    canvas.width = W2;
    canvas.height = H2;
    const ctx = canvas.getContext('2d');
    const center = (text, y, font, color) => {
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(text, W2 / 2, y);
    };

    // 배경 · 서비스 이름 · 날짜
    ctx.fillStyle = '#f6f3ea';
    ctx.fillRect(0, 0, W2, H2);
    center('자라는 시간', 150, '800 54px ' + FONT, '#2b5a1b');
    center(util.md(new Date(last.at)), 220, '700 38px ' + FONT, '#45503f');

    // 화분 뒤 둥근 바탕
    ctx.fillStyle = '#e7ecdd';
    ctx.beginPath();
    ctx.arc(W2 / 2, 650, 350, 0, Math.PI * 2);
    ctx.fill();

    // 문구
    center(util.fmtMin(last.heldMin) + ' 동안 폰을 내려놓고', 1120, '700 58px ' + FONT, '#1e2619');
    center(sp.name + util.josa(sp.name, '을', '를') + ' 피웠어요', 1225, '800 88px ' + FONT, '#2b5a1b');
    if (last.bonusMin) center('꽃이 핀 뒤 보너스 ' + util.fmtMin(last.bonusMin) + ' 더', 1300, '700 42px ' + FONT, '#8a3410');

    // 통계
    const earned = GT.badges.earned(store.data.records);
    const ids = GT.badges.BADGES.filter((b) => earned[b.id]).map((b) => b.id);
    const stats = [
      ['모은 시간', util.fmtMin(store.totalMinutes())],
      ['이번 주 성공', store.weekSuccessDays() + '일'],
      ['받은 배지', ids.length + '개']
    ];
    stats.forEach((st, i) => {
      const x = 80 + i * 313;
      ctx.fillStyle = '#fffdf7';
      roundRect(ctx, x, 1370, 293, 150, 24);
      ctx.fill();
      ctx.textAlign = 'left';
      ctx.fillStyle = '#45503f';
      ctx.font = '700 30px ' + FONT;
      ctx.fillText(st[0], x + 28, 1422);
      ctx.fillStyle = '#2b5a1b';
      ctx.font = '800 44px ' + FONT;
      ctx.fillText(st[1], x + 28, 1485);
    });

    // 배지: 이번에 받은 것 먼저, 최대 4개
    const shown = last.badges.concat(ids.filter((id) => last.badges.indexOf(id) < 0)).slice(0, 4);

    const images = [loadSvg(plants.svg(sp.id, 3, { flat: true }))]
      .concat(shown.map((id) => loadSvg(GT.badges.svg(id, true))));

    return Promise.all(images).then((imgs) => {
      // 화분 (120×160 비율)
      ctx.drawImage(imgs[0], W2 / 2 - 210, 650 - 330, 420, 560);

      const step = 230;
      const startX = W2 / 2 - ((shown.length - 1) * step) / 2;
      shown.forEach((id, i) => {
        const b = GT.badges.BADGES.find((x) => x.id === id);
        const cx = startX + i * step;
        ctx.drawImage(imgs[i + 1], cx - 65, 1580, 130, 130);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1e2619';
        ctx.font = '700 30px ' + FONT;
        ctx.fillText(b.name, cx, 1760);
      });

      center('폰을 내려놓은 만큼 자라는 정원', 1860, '700 32px ' + FONT, '#45503f');
      return new Promise((resolve) => { canvas.toBlob(resolve, 'image/png'); });
    });
  }

  function shareToday(last, btn, status) {
    deliver(() => drawToday(last), 'growtime-today', '자라는 시간 · 오늘 핀 꽃', btn, status);
  }

  GT.share = { draw: draw, drawToday: drawToday, shareToday: shareToday };
})(window.GT = window.GT || {});
