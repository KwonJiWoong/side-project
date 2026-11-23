/* 식물 데이터 · 단계별 SVG (씨앗 → 새싹 → 잎 → 꽃) */
(function () {
  'use strict';

  // 해금 기준: 모은 시간(분)
  var SPECIES = [
    { id: 'daisy', name: '데이지', unlock: 0 },
    { id: 'tulip', name: '튤립', unlock: 60 },
    { id: 'sunflower', name: '해바라기', unlock: 300 },
    { id: 'cactus', name: '선인장', unlock: 600 }
  ];

  var STAGES = ['씨앗', '새싹', '잎', '꽃'];

  // 꽃잎을 중심(60,40) 둘레로 돌려 배치
  function petals(count, rx, ry, cy, fill, stroke) {
    var out = '';
    for (var i = 0; i < count; i++) {
      out += '<ellipse cx="60" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + (360 / count) * i + ' 60 40)" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1"' : '') + '/>';
    }
    return out;
  }

  // 종류별 꽃 · 잎 모양
  var PARTS = {
    daisy: {
      flower: petals(8, 5, 11, 28, '#ffffff', '#cfc6b0') + '<circle cx="60" cy="40" r="6.5" fill="#f2b705"/>'
    },
    tulip: {
      flower: '<path d="M47 28c0 17 26 17 26 0l-6.5 6L60 23l-6.5 11z" fill="#d6336c"/><path d="M53.5 34 60 23l6.5 11c-2 6-11 6-13 0z" fill="#b02456"/>'
    },
    sunflower: {
      flower: petals(14, 4.5, 12, 25, '#f5b301') + '<circle cx="60" cy="40" r="9.5" fill="#6b3e1f"/><circle cx="57" cy="37.5" r="1.3" fill="#a3652f"/><circle cx="62.5" cy="39" r="1.3" fill="#a3652f"/><circle cx="59" cy="43" r="1.3" fill="#a3652f"/>'
    },
    cactus: {
      flower: petals(5, 4.5, 8, 33, '#ff7aa8') + '<circle cx="60" cy="40" r="3.5" fill="#ffd84d"/>',
      sprout: '<path d="M54 106h-3v-4M66 104h3v-4" fill="none" stroke="#4f8f3a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
      leaves: '<path d="M53 86H42V72M67 74h11V60" fill="none" stroke="#4f8f3a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'
    }
  };

  var DEFAULT_SPROUT =
    '<path d="M60 100c-10-8-18-4-20 0 6 6 14 6 20 0z" fill="var(--leaf)"/>' +
    '<path d="M60 100c10-8 18-4 20 0-6 6-14 6-20 0z" fill="var(--leaf)"/>';

  var DEFAULT_LEAVES =
    '<path d="M59 84c-15-12-27-8-31-2 10 10 22 10 31 2z" fill="var(--leaf-dark)"/>' +
    '<path d="M61 70c15-12 27-8 31-2-10 10-22 10-31 2z" fill="var(--leaf)"/>';

  function find(id) {
    for (var i = 0; i < SPECIES.length; i++) if (SPECIES[i].id === id) return SPECIES[i];
    return SPECIES[0];
  }

  /**
   * 식물 SVG 문자열
   * @param {string} id 종류
   * @param {number} stage 0~3
   * @param {{label?: boolean, wilted?: boolean}} opts label: 스크린리더용 이름 붙이기
   */
  function svg(id, stage, opts) {
    opts = opts || {};
    var sp = find(id);
    var part = PARTS[sp.id] || {};
    var a11y = opts.label
      ? 'role="img" aria-label="' + sp.name + ', ' + STAGES[stage] + ' 단계' + (opts.wilted ? '(시듦)' : '') + '"'
      : 'aria-hidden="true" focusable="false"';

    return '<svg class="plant plant--' + sp.id + (opts.wilted ? ' plant--wilted' : '') + '" data-stage="' + stage + '" viewBox="0 0 120 160" ' + a11y + '>' +
      '<g class="plant__body">' +
        '<path class="plant__stem" d="M60 114c-3-18 3-38 0-70" pathLength="1"/>' +
        '<g class="plant__sprout">' + (part.sprout || DEFAULT_SPROUT) + '</g>' +
        '<g class="plant__leaves">' + (part.leaves || DEFAULT_LEAVES) + '</g>' +
        '<g class="plant__flower">' + part.flower + '</g>' +
      '</g>' +
      '<ellipse class="plant__seed" cx="60" cy="111" rx="5.5" ry="3.5" fill="#8b5a2b"/>' +
      '<path d="M34 122h52l-6 32H40z" fill="var(--pot)"/>' +
      '<rect x="29" y="113" width="62" height="11" rx="3" fill="var(--pot-rim)"/>' +
      '<ellipse cx="60" cy="115" rx="27" ry="3.5" fill="var(--soil)"/>' +
    '</svg>';
  }

  // 진행률(0~1) → 단계
  function stageOf(ratio) {
    if (ratio >= 1) return 3;
    if (ratio >= 0.6) return 2;
    if (ratio >= 0.25) return 1;
    return 0;
  }

  window.Plants = { SPECIES: SPECIES, STAGES: STAGES, find: find, svg: svg, stageOf: stageOf };
})();
