/* 식물 데이터 · 단계별 SVG (씨앗 → 새싹 → 잎 → 꽃) */
(function () {
  'use strict';

  // 해금 기준: 모은 시간(분)
  var SPECIES = [
    { id: 'daisy', name: '데이지', unlock: 0 },
    { id: 'tulip', name: '튤립', unlock: 60 },
    { id: 'sunflower', name: '해바라기', unlock: 180 },
    { id: 'cactus', name: '선인장', unlock: 300 },
    { id: 'lavender', name: '라벤더', unlock: 480 },
    { id: 'rose', name: '장미', unlock: 720 },
    { id: 'hydrangea', name: '수국', unlock: 1080 },
    { id: 'mugunghwa', name: '무궁화', unlock: 1500 }
  ];

  var STAGES = ['씨앗', '새싹', '잎', '꽃'];

  // 공통 색 (이미지로 저장할 때도 그대로 보이도록 색값을 직접 씀)
  var C = {
    pot: '#b5643a',
    rim: '#9a4f2b',
    soil: '#5a3b22',
    seed: '#8b5a2b',
    stem: '#3f7d2a',
    leaf: '#5c9e3a',
    leafDark: '#3f7d2a',
    cactus: '#4f8f3a'
  };

  // 꽃잎을 중심(60,40) 둘레로 돌려 배치
  function petals(count, rx, ry, cy, fill, stroke) {
    var out = '';
    for (var i = 0; i < count; i++) {
      out += '<ellipse cx="60" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + (360 / count) * i + ' 60 40)" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1"' : '') + '/>';
    }
    return out;
  }

  // 수국 꽃송이 (작은 네잎 꽃 여러 개)
  function florets() {
    var spots = [[60, 25], [50, 30], [70, 30], [45, 40], [60, 37], [75, 40], [52, 47], [68, 47]];
    var out = '<circle cx="60" cy="37" r="17" fill="#c9d4f2"/>';
    spots.forEach(function (p, i) {
      var fill = i % 2 ? '#6c8fd8' : '#9a7fd6';
      out += '<g fill="' + fill + '">' +
        '<circle cx="' + (p[0] - 2.6) + '" cy="' + p[1] + '" r="2.8"/><circle cx="' + (p[0] + 2.6) + '" cy="' + p[1] + '" r="2.8"/>' +
        '<circle cx="' + p[0] + '" cy="' + (p[1] - 2.6) + '" r="2.8"/><circle cx="' + p[0] + '" cy="' + (p[1] + 2.6) + '" r="2.8"/></g>' +
        '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.2" fill="#f4f1ff"/>';
    });
    return out;
  }

  // 라벤더 꽃대
  function spike() {
    var out = '';
    for (var i = 0; i < 7; i++) {
      var y = 44 - i * 4;
      out += '<ellipse cx="' + (i % 2 ? 63.5 : 56.5) + '" cy="' + y + '" rx="3.6" ry="4.4" fill="' + (i % 2 ? '#7a5bbf' : '#9b7fd9') + '"/>';
    }
    return out + '<ellipse cx="60" cy="15" rx="3" ry="4" fill="#9b7fd9"/>';
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
      stem: C.cactus,
      flower: petals(5, 4.5, 8, 33, '#ff7aa8') + '<circle cx="60" cy="40" r="3.5" fill="#ffd84d"/>',
      sprout: '<path d="M54 106h-3v-4M66 104h3v-4" fill="none" stroke="' + C.cactus + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
      leaves: '<path d="M53 86H42V72M67 74h11V60" fill="none" stroke="' + C.cactus + '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'
    },
    lavender: {
      flower: spike(),
      leaves: '<path d="M59 88c-8-6-14-14-16-24M61 76c8-6 13-13 15-22" fill="none" stroke="' + C.leaf + '" stroke-width="3.5" stroke-linecap="round"/>'
    },
    rose: {
      flower: '<path d="M52 47c-2-4 2-6 8-5 6-1 10 1 8 5" fill="' + C.leafDark + '"/>' +
        '<circle cx="60" cy="37" r="12" fill="#d63a4a"/>' +
        '<path d="M50 34c3-6 7-8 11-8" fill="none" stroke="#f07a86" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M53 40c2 6 12 6 14 0" fill="none" stroke="#9e1f30" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M55 35c2-5 9-5 10 0-2 3-7 3-10 0z" fill="#9e1f30"/>'
    },
    hydrangea: {
      flower: florets()
    },
    mugunghwa: {
      flower: petals(5, 8.5, 12, 27, '#f4b3cb', '#d97aa0') +
        '<circle cx="60" cy="40" r="6" fill="#b0183d"/>' +
        '<path d="M60 40l5-11" stroke="#fff3b8" stroke-width="2" stroke-linecap="round"/><circle cx="65.5" cy="28" r="2.2" fill="#ffe27a"/>'
    }
  };

  var DEFAULT_SPROUT =
    '<path d="M60 100c-10-8-18-4-20 0 6 6 14 6 20 0z" fill="' + C.leaf + '"/>' +
    '<path d="M60 100c10-8 18-4 20 0-6 6-14 6-20 0z" fill="' + C.leaf + '"/>';

  var DEFAULT_LEAVES =
    '<path d="M59 84c-15-12-27-8-31-2 10 10 22 10 31 2z" fill="' + C.leafDark + '"/>' +
    '<path d="M61 70c15-12 27-8 31-2-10 10-22 10-31 2z" fill="' + C.leaf + '"/>';

  // 단계별 줄기 길이 (pathLength=1 기준 dashoffset)
  var STEM_OFFSET = [1, 0.72, 0.2, 0];

  function find(id) {
    for (var i = 0; i < SPECIES.length; i++) if (SPECIES[i].id === id) return SPECIES[i];
    return SPECIES[0];
  }

  /**
   * 식물 SVG 문자열
   * @param {string} id 종류
   * @param {number} stage 0~3
   * @param {object} opts
   *   label   스크린리더용 이름 붙이기
   *   wilted  시든 모습
   *   ground  화분 없이 땅에 심은 모습 (정원 화단용)
   *   flat    단계에 맞는 부분만 그림 (이미지 저장용, CSS 없이도 보이게)
   */
  function svg(id, stage, opts) {
    opts = opts || {};
    var sp = find(id);
    var part = PARTS[sp.id] || {};
    var flat = !!opts.flat;
    var a11y = opts.label
      ? 'role="img" aria-label="' + sp.name + ', ' + STAGES[stage] + ' 단계' + (opts.wilted ? '(시듦)' : '') + '"'
      : 'aria-hidden="true" focusable="false"';
    var viewBox = opts.ground ? '0 6 120 114' : '0 0 120 160';

    // 시든 모습 (이미지 저장용은 SVG 필터·속성으로 직접 표현)
    var wiltAttr = flat && opts.wilted ? ' transform="rotate(-16 60 114)" filter="url(#wilt)"' : '';
    var defs = flat && opts.wilted
      ? '<defs><filter id="wilt"><feColorMatrix type="matrix" values="0.5 0.45 0.15 0 0 0.42 0.42 0.12 0 0 0.3 0.32 0.1 0 0 0 0 0 1 0"/></filter></defs>'
      : '';

    var stem = '<path class="plant__stem" d="M60 114c-3-18 3-38 0-70" pathLength="1"' +
      ' fill="none" stroke="' + (part.stem || C.stem) + '" stroke-width="' + (part.stem ? 15 : 4) + '" stroke-linecap="round"' +
      (flat ? ' stroke-dasharray="1" stroke-dashoffset="' + STEM_OFFSET[stage] + '"' : '') + '/>';

    var body =
      (!flat || stage > 0 ? stem : '') +
      (!flat || stage >= 1 ? '<g class="plant__sprout">' + (part.sprout || DEFAULT_SPROUT) + '</g>' : '') +
      (!flat || stage >= 2 ? '<g class="plant__leaves">' + (part.leaves || DEFAULT_LEAVES) + '</g>' : '') +
      (!flat || stage >= 3 ? '<g class="plant__flower">' + part.flower + '</g>' : '');

    var seed = !flat || stage === 0
      ? '<ellipse class="plant__seed" cx="60" cy="111" rx="5.5" ry="3.5" fill="' + C.seed + '"/>'
      : '';

    var base = opts.ground
      ? '<ellipse cx="60" cy="116" rx="20" ry="4" fill="' + C.soil + '"/>'
      : '<g class="plant__pot"><path d="M34 122h52l-6 32H40z" fill="' + C.pot + '"/>' +
        '<rect x="29" y="113" width="62" height="11" rx="3" fill="' + C.rim + '"/>' +
        '<ellipse cx="60" cy="115" rx="27" ry="3.5" fill="' + C.soil + '"/></g>';

    return '<svg class="plant plant--' + sp.id + (opts.wilted ? ' plant--wilted' : '') + '" data-stage="' + stage + '"' +
      ' xmlns="http://www.w3.org/2000/svg" viewBox="' + viewBox + '" ' + a11y + '>' + defs +
      '<g class="plant__body"' + wiltAttr + '>' + body + '</g>' + seed + base +
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
