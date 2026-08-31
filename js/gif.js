/* ============================================================
   gif.js — 의존성 없는 GIF89a 인코더 (LZW)
   제한 팔레트 픽셀 아트라서 색 손실이 거의 없음
   ============================================================ */
var GIFENC = (function () {
  'use strict';

  function Out() { this.b = []; }
  Out.prototype.w = function (v) { this.b.push(v & 255); };
  Out.prototype.w2 = function (v) { this.b.push(v & 255, (v >> 8) & 255); };
  Out.prototype.str = function (s) { for (var i = 0; i < s.length; i++) this.b.push(s.charCodeAt(i) & 255); };

  /* ---------- LZW ---------- */
  function lzw(index, minCode, out) {
    var clear = 1 << minCode, eoi = clear + 1;
    var next = eoi + 1, size = minCode + 1;
    var cur = 0, bits = 0, block = [];

    function flushBlock() {
      if (!block.length) return;
      out.w(block.length);
      for (var i = 0; i < block.length; i++) out.w(block[i]);
      block.length = 0;
    }
    function emit(code) {
      cur |= code << bits; bits += size;
      while (bits >= 8) {
        block.push(cur & 255); cur >>= 8; bits -= 8;
        if (block.length === 255) flushBlock();
      }
    }

    var table = new Map();
    emit(clear);
    var ib = index[0];
    for (var i = 1; i < index.length; i++) {
      var k = index[i];
      var key = (ib << 8) | k;
      var got = table.get(key);
      if (got !== undefined) { ib = got; continue; }
      emit(ib);
      if (next === 4096) {
        emit(clear);
        table.clear(); next = eoi + 1; size = minCode + 1;
      } else {
        if (next >= (1 << size)) size++;
        table.set(key, next++);
      }
      ib = k;
    }
    emit(ib);
    emit(eoi);
    if (bits > 0) block.push(cur & 255);
    flushBlock();
    out.w(0);
  }

  /* ---------- 팔레트 산출 (빈도 상위 256색) ---------- */
  function buildPalette(frames) {
    var count = new Map();
    for (var f = 0; f < frames.length; f++) {
      var d = frames[f];
      for (var i = 0; i < d.length; i += 4) {
        var key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
        count.set(key, (count.get(key) || 0) + 1);
      }
    }
    var all = Array.from(count.entries()).sort(function (a, b) { return b[1] - a[1]; });
    var pal = [];
    for (var n = 0; n < all.length && pal.length < 256; n++) pal.push(all[n][0]);
    while (pal.length < 2) pal.push(0);
    return pal;
  }

  function nearestIdx(pal, r, g, b) {
    var best = 0, bd = Infinity;
    for (var i = 0; i < pal.length; i++) {
      var c = pal[i];
      var dr = r - ((c >> 16) & 255), dg = g - ((c >> 8) & 255), db = b - (c & 255);
      var d = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  /**
   * frames : [Uint8ClampedArray(RGBA)]
   * opts   : { width, height, delay(ms), loop, onProgress(0..1) }
   * → Promise<Blob>
   */
  function encode(frames, opts) {
    return new Promise(function (resolve) {
      var W = opts.width, H = opts.height;
      var delay = Math.max(2, Math.round((opts.delay || 100) / 10)); /* 1/100초 */
      var pal = buildPalette(frames);
      var lut = new Map();
      for (var i = 0; i < pal.length; i++) lut.set(pal[i], i);

      var out = new Out();
      out.str('GIF89a');
      out.w2(W); out.w2(H);
      out.w(0xF7); out.w(0); out.w(0);            /* GCT 256색 */
      for (i = 0; i < 256; i++) {
        var c = i < pal.length ? pal[i] : 0;
        out.w((c >> 16) & 255); out.w((c >> 8) & 255); out.w(c & 255);
      }
      /* 무한 반복 */
      out.w(0x21); out.w(0xFF); out.w(0x0B); out.str('NETSCAPE2.0');
      out.w(0x03); out.w(0x01); out.w2(opts.loop === undefined ? 0 : opts.loop); out.w(0);

      var fi = 0;
      var idxBuf = new Uint8Array(W * H);

      function step() {
        var t0 = performance.now();
        while (fi < frames.length && performance.now() - t0 < 24) {
          var d = frames[fi];
          for (var p = 0, q = 0; p < idxBuf.length; p++, q += 4) {
            var key = (d[q] << 16) | (d[q + 1] << 8) | d[q + 2];
            var v = lut.get(key);
            if (v === undefined) { v = nearestIdx(pal, d[q], d[q + 1], d[q + 2]); lut.set(key, v); }
            idxBuf[p] = v;
          }
          /* GCE */
          out.w(0x21); out.w(0xF9); out.w(0x04);
          out.w(0x04);                    /* disposal = 1 */
          out.w2(delay); out.w(0); out.w(0);
          /* Image Descriptor */
          out.w(0x2C); out.w2(0); out.w2(0); out.w2(W); out.w2(H); out.w(0);
          out.w(8);
          lzw(idxBuf, 8, out);
          fi++;
        }
        if (opts.onProgress) opts.onProgress(fi / frames.length);
        if (fi < frames.length) { setTimeout(step, 0); return; }
        out.w(0x3B);
        resolve(new Blob([new Uint8Array(out.b)], { type: 'image/gif' }));
      }
      setTimeout(step, 0);
    });
  }

  return { encode: encode };
})();
