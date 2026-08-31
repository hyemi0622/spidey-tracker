/* ============================================================
   engine.js — 저해상도 픽셀 버퍼 + 정수배 스케일 + 스프라이트 유틸
   ============================================================ */
var E = (function () {
  'use strict';

  /* ---------- surface ---------- */
  function surf(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0);
    var x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingEnabled = false;
    return { c: c, x: x, w: c.width, h: c.height };
  }

  /* ---------- Screen : 저해상도 버퍼를 정수배로 화면에 blit ---------- */
  /* lh 대신 { fill: 목표가로픽셀, onSize: fn } 을 주면 컨테이너를 꽉 채운다 */
  function Screen(canvas, lw, lh) {
    this.view = canvas;
    this.fill = 0; this.onSize = null;
    if (lh && typeof lh === 'object') { this.fill = lh.fill || lw; this.onSize = lh.onSize || null; lh = 300; }
    this.w = lw; this.h = lh;
    this.s = surf(lw, lh);
    this.ctx = this.s.x;
    this.px = 1; this.dpr = 0;
    var self = this;
    this._r = function () { self.resize(); };
    window.addEventListener('resize', this._r);
    window.addEventListener('orientationchange', this._r);
    this.resize();
  }
  Screen.prototype.resize = function () {
    var host = this.view.parentElement;
    if (!host) return;
    var vw = host.clientWidth, vh = host.clientHeight;
    if (vw < 4 || vh < 4) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var px, changed = false;

    if (this.fill) {
      /* 컨테이너를 정확히 채우되 픽셀은 정수배 유지 → 레터박스 없음 */
      px = Math.max(1, Math.round(vw * dpr / this.fill));
      var nw = Math.ceil(vw * dpr / px), nh = Math.ceil(vh * dpr / px);
      if (nw !== this.w || nh !== this.h) {
        this.w = nw; this.h = nh;
        this.s = surf(nw, nh); this.ctx = this.s.x;
        changed = true;
      }
      if (!changed && px === this.px && this.dpr === dpr && this.view.width === this.w * px) return;
      this.px = px; this.dpr = dpr;
      this.view.width = this.w * px;
      this.view.height = this.h * px;
      this.view.style.width = vw + 'px';
      this.view.style.height = vh + 'px';
      this.vx = this.view.getContext('2d');
      this.vx.imageSmoothingEnabled = false;
      if (changed && this.onSize) this.onSize(this.w, this.h);
      return;
    }

    var fit = Math.min(vw / this.w, vh / this.h);
    px = Math.max(1, Math.floor(fit * dpr));
    while (px > 1 && (this.w * px / dpr > vw + 0.5 || this.h * px / dpr > vh + 0.5)) px--;
    if (px === this.px && this.dpr === dpr && this.view.width === this.w * px) return;
    this.px = px; this.dpr = dpr;
    this.view.width = this.w * px;
    this.view.height = this.h * px;
    this.view.style.width = (this.w * px / dpr) + 'px';
    this.view.style.height = (this.h * px / dpr) + 'px';
    this.vx = this.view.getContext('2d');
    this.vx.imageSmoothingEnabled = false;
  };
  Screen.prototype.setSize = function (w, h) {
    if (w === this.w && h === this.h) return false;
    this.w = w; this.h = h;
    this.s = surf(w, h);
    this.ctx = this.s.x;
    this.px = -1; this.dpr = 0;
    this.resize();
    return true;
  };
  Screen.prototype.present = function () {
    if (!this.vx) this.vx = this.view.getContext('2d');
    this.vx.imageSmoothingEnabled = false;
    this.vx.drawImage(this.s.c, 0, 0, this.view.width, this.view.height);
  };
  Screen.prototype.toLow = function (cx, cy) {
    var r = this.view.getBoundingClientRect();
    return { x: (cx - r.left) / r.width * this.w, y: (cy - r.top) / r.height * this.h };
  };
  Screen.prototype.destroy = function () {
    window.removeEventListener('resize', this._r);
    window.removeEventListener('orientationchange', this._r);
  };

  /* ---------- 스프라이트: 문자열 아트 → 캔버스 (+ 자동 1px 외곽선) ---------- */
  function build(w, h, rows, key, outline) {
    var s = surf(w, h);
    for (var y = 0; y < rows.length && y < h; y++) {
      var row = rows[y];
      for (var x = 0; x < w; x++) {
        var ch = x < row.length ? row[x] : '.';
        var col = key[ch];
        if (!col) continue;
        s.x.fillStyle = col;
        s.x.fillRect(x, y, 1, 1);
      }
    }
    return outline === false ? s.c : addOutline(s.c, outline || '#0b1620');
  }

  function addOutline(src, color) {
    var w = src.width, h = src.height;
    var o = surf(w + 2, h + 2);
    o.x.drawImage(src, 1, 1);
    var img = o.x.getImageData(0, 0, o.w, o.h);
    var d = img.data, W = o.w, H = o.h;
    var out = new Uint8ClampedArray(d);
    var rgb = [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)];
    function A(x, y) { return (x < 0 || y < 0 || x >= W || y >= H) ? 0 : d[(y * W + x) * 4 + 3]; }
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var i = (y * W + x) * 4;
      if (d[i + 3] > 0) continue;
      if (A(x - 1, y) > 0 || A(x + 1, y) > 0 || A(x, y - 1) > 0 || A(x, y + 1) > 0) {
        out[i] = rgb[0]; out[i + 1] = rgb[1]; out[i + 2] = rgb[2]; out[i + 3] = 255;
      }
    }
    o.x.putImageData(new ImageData(out, W, H), 0, 0);
    return o.c;
  }

  /* 좌우 반전 사본 */
  function flipH(src) {
    var o = surf(src.width, src.height);
    o.x.save(); o.x.translate(src.width, 0); o.x.scale(-1, 1);
    o.x.drawImage(src, 0, 0); o.x.restore();
    return o.c;
  }

  /* 색 전체 교체(틴트) — 실루엣용 */
  function silhouette(src, color) {
    var o = surf(src.width, src.height);
    o.x.drawImage(src, 0, 0);
    o.x.globalCompositeOperation = 'source-in';
    o.x.fillStyle = color; o.x.fillRect(0, 0, o.w, o.h);
    return o.c;
  }

  /* ---------- 그리기 헬퍼 ---------- */
  function spr(ctx, img, x, y, flip) {
    ctx.imageSmoothingEnabled = false;
    if (flip) {
      ctx.save();
      ctx.translate(Math.round(x) + img.width, Math.round(y));
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(img, Math.round(x), Math.round(y));
    }
  }
  /* 중심 기준 회전 */
  function sprRot(ctx, img, cx, cy, ang, flip) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(cx), Math.round(cy));
    ctx.rotate(ang);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, -(img.width >> 1), -(img.height >> 1));
    ctx.restore();
  }

  function rect(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function frame(ctx, x, y, w, h, c) {
    rect(ctx, x, y, w, 1, c); rect(ctx, x, y + h - 1, w, 1, c);
    rect(ctx, x, y, 1, h, c); rect(ctx, x + w - 1, y, 1, h, c);
  }
  /* 브레젠험 픽셀 라인 */
  function line(ctx, x0, y0, x1, y1, c, thick) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    var dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    var err = dx + dy, e2, t = thick || 1;
    ctx.fillStyle = c;
    var guard = 0;
    while (guard++ < 4000) {
      ctx.fillRect(x0, y0, t, t);
      if (x0 === x1 && y0 === y1) break;
      e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  /* 살짝 처지는 거미줄 (2차 베지어를 픽셀로) */
  function web(ctx, x0, y0, x1, y1, sag, c) {
    var mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + (sag || 0);
    var px = x0, py = y0, steps = 14;
    for (var i = 1; i <= steps; i++) {
      var t = i / steps, u = 1 - t;
      var nx = u * u * x0 + 2 * u * t * mx + t * t * x1;
      var ny = u * u * y0 + 2 * u * t * my + t * t * y1;
      line(ctx, px, py, nx, ny, c || '#eef3ff', 1);
      px = nx; py = ny;
    }
  }
  function circle(ctx, cx, cy, r, c) {
    ctx.fillStyle = c;
    for (var y = -r; y <= r; y++) {
      var w = Math.floor(Math.sqrt(r * r - y * y));
      ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
    }
  }
  function ring(ctx, cx, cy, r, c) {
    ctx.fillStyle = c;
    var n = Math.max(12, Math.round(r * 6));
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2;
      ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
    }
  }
  /* 세로 그라디언트를 픽셀 밴드로 (디더 옵션) */
  function vgrad(ctx, x, y, w, h, cols) {
    for (var i = 0; i < h; i++) {
      var t = i / Math.max(1, h - 1);
      var idx = Math.min(cols.length - 1, Math.floor(t * cols.length));
      rect(ctx, x, y + i, w, 1, cols[idx]);
    }
  }

  /* ---------- 유틸 ---------- */
  function rng(seed) {
    var s = seed | 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ---------- 루프 ---------- */
  function Loop(step) {
    var last = 0, raf = 0, running = false;
    function tick(ts) {
      if (!running) return;
      if (!last) last = ts;
      var dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      step(dt, ts);
      raf = requestAnimationFrame(tick);
    }
    return {
      start: function () { if (running) return; running = true; last = 0; raf = requestAnimationFrame(tick); },
      stop: function () { running = false; cancelAnimationFrame(raf); },
      get running() { return running; }
    };
  }

  return {
    surf: surf, Screen: Screen, Loop: Loop,
    build: build, addOutline: addOutline, flipH: flipH, silhouette: silhouette,
    spr: spr, sprRot: sprRot, rect: rect, frame: frame, line: line, web: web,
    circle: circle, ring: ring, vgrad: vgrad,
    rng: rng, clamp: clamp, lerp: lerp, ease: ease
  };
})();
