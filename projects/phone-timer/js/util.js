/* 글자 만들기 · 날짜 계산 도우미 */
(function (GT) {
  'use strict';

  function $(id) { return document.getElementById(id); }

  // 아이콘 모음(SVG symbol) 사용
  function icon(name) {
    return '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>';
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // 25 → 25분, 80 → 1시간 20분
  function fmtMin(min) {
    if (min < 60) return min + '분';
    var h = Math.floor(min / 60);
    var m = min % 60;
    return h + '시간' + (m ? ' ' + m + '분' : '');
  }

  // 밀리초 → 08:10 / 1:05:00 (up: 올라가는 시계는 내림)
  function fmtClock(ms, up) {
    var s = Math.max(0, up ? Math.floor(ms / 1000) : Math.ceil(ms / 1000));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(s % 60);
  }

  // 밀리초 → 11초 / 2분 34초
  function fmtAway(ms) {
    var s = Math.round(ms / 1000);
    return s < 60 ? s + '초' : Math.floor(s / 60) + '분' + (s % 60 ? ' ' + (s % 60) + '초' : '');
  }

  // 받침 유무에 따라 조사 고르기 (튤립‘이’ / 데이지‘가’)
  function josa(word, withBatchim, without) {
    var code = word.charCodeAt(word.length - 1) - 0xac00;
    return code >= 0 && code <= 11171 && code % 28 ? withBatchim : without;
  }

  function md(date) { return (date.getMonth() + 1) + '월 ' + date.getDate() + '일'; }

  function dayKey(date) {
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
  }

  // 그 주의 월요일 0시
  function weekStart(date) {
    var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }

  GT.util = {
    $: $,
    icon: icon,
    pad: pad,
    fmtMin: fmtMin,
    fmtClock: fmtClock,
    fmtAway: fmtAway,
    josa: josa,
    md: md,
    dayKey: dayKey,
    weekStart: weekStart
  };
})(window.GT = window.GT || {});
