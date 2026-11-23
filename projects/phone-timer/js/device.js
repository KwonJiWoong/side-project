/* 기기 기능: 화면 켜짐 유지(Wake Lock) · 효과음 · 진동 */
(function (GT) {
  'use strict';

  var settings = GT.store.settings;

  /* ===== 효과음 ===== */
  var audioCtx = null;

  // 소리는 버튼을 누른 순간에 준비해야 휴대폰에서 남
  function unlockAudio() {
    if (!settings.sound || audioCtx) return;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { audioCtx = null; }
  }

  // 도·미·솔·도 차임
  function chime() {
    if (!settings.sound || !audioCtx) return;
    // 아이폰 무음 모드에서도 울리도록 (iOS 17 이상). 다른 앱 음악을 오래 끊지 않게 잠깐만 바꿈
    var session = navigator.audioSession;
    if (session) { try { session.type = 'playback'; } catch (e) { /* 미지원 */ } }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    var t0 = audioCtx.currentTime + 0.05;
    [523.25, 659.25, 783.99, 1046.5].forEach(function (freq, i) {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      var t = t0 + i * 0.18;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 1);
    });

    if (session) {
      setTimeout(function () { try { session.type = 'auto'; } catch (e) { /* 무시 */ } }, 2000);
    }
  }

  /* ===== 진동 (안드로이드) ===== */
  function vibrate() {
    if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
  }

  /* ===== 화면 켜짐 유지 ===== */
  var wakeLock = null;
  var canKeepAwake = 'wakeLock' in navigator;

  // 결과: 'on' 켜짐 / 'fail' 켜지 못함 / 'unsupported' 지원 안 함
  function keepAwake() {
    if (!canKeepAwake) return Promise.resolve('unsupported');
    return navigator.wakeLock.request('screen').then(function (lock) {
      wakeLock = lock;
      lock.addEventListener('release', function () { wakeLock = null; });
      return 'on';
    }).catch(function () { return 'fail'; });
  }

  function releaseAwake() {
    if (wakeLock) wakeLock.release().catch(function () { /* 이미 해제됨 */ });
    wakeLock = null;
  }

  GT.device = {
    unlockAudio: unlockAudio,
    chime: chime,
    vibrate: vibrate,
    canKeepAwake: canKeepAwake,
    keepAwake: keepAwake,
    releaseAwake: releaseAwake
  };
})(window.GT = window.GT || {});
