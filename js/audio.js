/* ============================================================
   audio.js — WebAudio 8비트 효과음 / BGM (외부 파일 없음)
   ============================================================ */
var SFX = (function () {
  'use strict';
  var ac = null, master = null, on = true, bgmTimer = null, bgmGain = null;

  function ctx() {
    if (!ac) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0.5;
      master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  function tone(freq, dur, type, vol, slideTo, delay) {
    if (!on) return;
    var a = ctx(); if (!a) return;
    var t = a.currentTime + (delay || 0);
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol === undefined ? 0.22 : vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, vol, hp, delay) {
    if (!on) return;
    var a = ctx(); if (!a) return;
    var t = a.currentTime + (delay || 0);
    var n = Math.floor(a.sampleRate * dur);
    var buf = a.createBuffer(1, n, a.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = a.createBufferSource(); src.buffer = buf;
    var f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 800;
    var g = a.createGain(); g.gain.value = vol === undefined ? 0.18 : vol;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t);
  }

  var API = {
    get enabled() { return on; },
    toggle: function () { on = !on; if (!on) API.bgmStop(); return on; },
    unlock: function () { ctx(); },

    blip: function () { tone(880, 0.06, 'square', 0.12); },
    click: function () { tone(1400, 0.03, 'square', 0.1); },
    radar: function () { tone(1200, 0.10, 'sine', 0.07, 700); },
    alarm: function () { tone(660, 0.12, 'square', 0.16); tone(880, 0.12, 'square', 0.14, null, 0.14); },

    thwip: function () {
      noise(0.13, 0.16, 1800);
      tone(1800, 0.14, 'sawtooth', 0.09, 420);
    },
    swoosh: function () { noise(0.30, 0.10, 500); },
    unmask: function () { tone(300, 0.25, 'triangle', 0.16, 900); },
    land: function () { tone(140, 0.20, 'square', 0.24, 60); noise(0.16, 0.2, 200); },
    shutter: function () { noise(0.05, 0.30, 2500); tone(2200, 0.04, 'square', 0.12, 800, 0.05); },
    fanfare: function () {
      var s = [523, 659, 784, 1047];
      for (var i = 0; i < s.length; i++) tone(s[i], 0.16, 'square', 0.16, null, i * 0.10);
    },
    cackle: function () {
      for (var i = 0; i < 6; i++) tone(420 + (i % 2) * 180, 0.07, 'sawtooth', 0.10, null, i * 0.075);
    },
    siren: function () {
      for (var i = 0; i < 4; i++) {
        tone(720, 0.22, 'sine', 0.10, 980, i * 0.44);
        tone(980, 0.22, 'sine', 0.10, 720, i * 0.44 + 0.22);
      }
    },

    /* 8비트 BGM 루프 */
    bgmStart: function () {
      if (!on) return;
      var a = ctx(); if (!a || bgmTimer) return;
      var bass = [110, 110, 146.8, 164.8];
      var lead = [440, 523, 659, 523, 587, 494, 440, 392];
      var step = 0;
      bgmTimer = setInterval(function () {
        if (!on) return;
        var i = step % 8;
        tone(lead[i], 0.16, 'square', 0.045);
        if (i % 2 === 0) tone(bass[(step >> 1) % 4] / 2, 0.22, 'triangle', 0.07);
        if (i === 0 || i === 4) noise(0.05, 0.03, 3000);
        step++;
      }, 165);
    },
    bgmStop: function () { if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; } }
  };
  return API;
})();
