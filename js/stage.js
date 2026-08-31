/* ============================================================
   stage.js — 게임/시네마가 공유하는 저해상도 픽셀 무대
   캔버스 1장 + 루프 1개 + 프레임 캡처(GIF) + 녹화(WebM) + PNG
   ============================================================ */
var STAGE = (function () {
  'use strict';

  var W = 240, H = 420;
  var screen = null, loop = null, host = null;
  var mode = null, rzT = 0, lastDt = 1 / 60;

  var cap = { frames: [], acc: 0, iv: 0.085, max: 96, active: false };
  var rec = { mr: null, chunks: [], blob: null };


  function tick(dt) {
    lastDt = dt;
    if (mode) mode(dt);
    capture();
    screen.present();
  }
  function ctx() { return screen.ctx; }

  function init(canvas) {
    host = canvas.parentElement;
    screen = new E.Screen(canvas, W, {
      fill: 240,
      onSize: function (w, h) { W = w; H = h; }
    });
    W = screen.w; H = screen.h;
    loop = E.Loop(tick);
  }

  function resize() {
    if (!screen) return;
    clearTimeout(rzT);
    rzT = setTimeout(function () {
      screen.resize();
    }, 100);
  }

  /* ---------- 캡처 (하이라이트 구간만) ---------- */
  function startCapture() { cap.frames.length = 0; cap.acc = 0; cap.iv = 0.085; cap.active = true; }
  function stopCapture() { cap.active = false; }
  function capture() {
    if (!cap.active) return;
    cap.acc += lastDt;
    if (cap.acc < cap.iv) return;
    cap.acc = 0;
    cap.frames.push(screen.ctx.getImageData(0, 0, W, H).data);
    if (cap.frames.length >= cap.max) {
      var nf = [];
      for (var i = 0; i < cap.frames.length; i += 2) nf.push(cap.frames[i]);
      cap.frames = nf; cap.iv *= 2;
    }
  }

  /* ---------- 녹화 ---------- */
  function startRec() {
    try {
      if (!screen.view.captureStream || !window.MediaRecorder) return;
      var st = screen.view.captureStream(30);
      var mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
        .filter(function (m) { return MediaRecorder.isTypeSupported(m); })[0];
      if (!mime) return;
      rec.chunks = []; rec.blob = null;
      rec.mr = new MediaRecorder(st, { mimeType: mime, videoBitsPerSecond: 2800000 });
      rec.mr.ondataavailable = function (e) { if (e.data.size) rec.chunks.push(e.data); };
      rec.mr.onstop = function () { rec.blob = new Blob(rec.chunks, { type: 'video/webm' }); };
      rec.mr.start();
    } catch (e) { rec.mr = null; }
  }
  function stopRec() { try { if (rec.mr && rec.mr.state !== 'inactive') rec.mr.stop(); } catch (e) { } }

  function snapshotPNG(scale, r) {
    scale = scale || 4;
    var sx = r ? Math.max(0, Math.round(r.x)) : 0;
    var sy = r ? Math.max(0, Math.round(r.y)) : 0;
    var sw = r ? Math.min(W - sx, Math.round(r.w)) : W;
    var sh = r ? Math.min(H - sy, Math.round(r.h)) : H;
    var o = E.surf(sw * scale, sh * scale);
    o.x.imageSmoothingEnabled = false;
    o.x.drawImage(screen.s.c, sx, sy, sw, sh, 0, 0, sw * scale, sh * scale);
    return o.c;
  }

  return {
    init: init, resize: resize,
    get ctx() { return screen.ctx; },
    get W() { return W; },
    get H() { return H; },
    get canvas() { return screen && screen.view; },
    toLow: function (x, y) { return screen.toLow(x, y); },
    setMode: function (fn) { mode = fn; },
    start: function () { loop && loop.start(); },
    stop: function () { loop && loop.stop(); },
    startCapture: startCapture, stopCapture: stopCapture,
    frames: function () { return cap.frames; },
    frameDelay: function () { return cap.iv * 1000; },
    startRec: startRec, stopRec: stopRec,
    recBlob: function () { return rec.blob; },
    snapshotPNG: snapshotPNG
  };
})();
