/* ============================================================
   face.js — 업로드 사진 → 픽셀 얼굴
   크롭 → 축소 → 대비 스트레치 → 제한 팔레트 → 배경 자동 제거
   (전부 브라우저 안에서만. 업로드/전송 없음)
   ============================================================ */
var FACE = (function () {
  'use strict';

  /* 스프라이트와 같은 계열의 제한 팔레트 */
  var PALETTE = [
    [255, 231, 206], [247, 209, 175], [235, 182, 141], [214, 152, 112],
    [181, 118, 84], [140, 88, 62], [102, 62, 45],
    [58, 36, 24], [40, 26, 20], [24, 18, 22], [10, 18, 27], [30, 44, 62],
    [255, 255, 255], [235, 243, 255], [205, 218, 232], [160, 178, 196],
    [224, 54, 47], [150, 32, 28], [224, 85, 58], [143, 47, 28],
    [230, 196, 132], [201, 154, 84], [162, 112, 58],
    [38, 73, 184], [22, 48, 125], [63, 174, 106], [37, 107, 67],
    [242, 168, 37], [120, 84, 160], [70, 70, 82], [150, 150, 160]
  ];

  function nearest(r, g, b) {
    var best = 0, bd = 1e9;
    for (var i = 0; i < PALETTE.length; i++) {
      var p = PALETTE[i];
      var dr = r - p[0], dg = g - p[1], db = b - p[2];
      var d = dr * dr * 0.30 + dg * dg * 0.59 + db * db * 0.11;
      if (d < bd) { bd = d; best = i; }
    }
    return PALETTE[best];
  }

  function srcRect(st, aspect) {
    var iw = st.img.width, ih = st.img.height;
    var z = st.zoom || 1;
    var sh = Math.min(ih, iw / aspect) / z;
    var sw = sh * aspect;
    var maxX = iw - sw, maxY = ih - sh;
    var sx = maxX * (0.5 + (st.ox || 0));
    var sy = maxY * (0.5 + (st.oy || 0));
    return {
      sx: Math.max(0, Math.min(maxX, sx)),
      sy: Math.max(0, Math.min(maxY, sy)),
      sw: sw, sh: sh
    };
  }

  function avg(d, w, h, x0, y0, x1, y1) {
    var r = 0, g = 0, b = 0, n = 0;
    for (var y = Math.floor(y0 * h); y < Math.ceil(y1 * h); y++)
      for (var x = Math.floor(x0 * w); x < Math.ceil(x1 * w); x++) {
        var k = (y * w + x) * 4;
        if (d[k + 3] === 0) continue;
        r += d[k]; g += d[k + 1]; b += d[k + 2]; n++;
      }
    if (!n) return [200, 160, 130];
    return [r / n | 0, g / n | 0, b / n | 0];
  }
  function hex(c) {
    return '#' + c.map(function (v) {
      return ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2);
    }).join('');
  }
  function sh(c, a) { return [c[0] + a, c[1] + a, c[2] + a]; }

  function drawRot(ctx, img, r, W, H, rot) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate((rot || 0) * Math.PI / 180);
    ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, -W / 2, -H / 2, W, H);
    ctx.restore();
  }

  /* 사진에서 색만 뽑아 그린 픽셀 캐릭터 얼굴 */
  function character(st, w, h) {
    var skin = [240, 190, 150], hair = [60, 40, 28], lip = [190, 80, 80];
    if (st && st.img) {
      var t = E.surf(24, 28);
      t.x.imageSmoothingEnabled = true;
      var r = srcRect(st, 24 / 28);
      drawRot(t.x, st.img, r, 24, 28, st.rot || 0);
      var d = t.x.getImageData(0, 0, 24, 28).data;
      skin = avg(d, 24, 28, 0.32, 0.50, 0.68, 0.74);
      hair = avg(d, 24, 28, 0.30, 0.02, 0.70, 0.16);
      lip = avg(d, 24, 28, 0.40, 0.74, 0.60, 0.82);
    } else if (st && st.fallback === 'mj') {
      skin = [242, 193, 156]; hair = [224, 85, 58]; lip = [200, 70, 80];
    }
    var s = E.surf(w, h), g = s.x;
    var S = hex(skin), SD = hex(sh(skin, -34)), CH = hex(sh(skin, -18));
    var HR = hex(hair), HD = hex(sh(hair, -26)), EY = hex(sh(hair, -20)), LP = hex(lip);
    function R(x0, y0, x1, y1, col) {
      g.fillStyle = col;
      g.fillRect(Math.round(x0 * w), Math.round(y0 * h),
        Math.max(1, Math.round((x1 - x0) * w)), Math.max(1, Math.round((y1 - y0) * h)));
    }
    /* 둥근 얼굴 실루엣 (모서리 비움) */
    R(0.08, 0, 0.92, 1, S);
    R(0, 0.10, 1, 0.86, S);
    R(0.04, 0.05, 0.96, 0.94, S);
    R(0.16, 0.94, 0.84, 1, S);
    /* 머리 : 실루엣 가장자리까지 꽉 채워 살색이 비치지 않게 */
    R(0, 0, 1, 0.19, HR);
    R(0, 0.10, 0.17, 0.58, HR); R(0.83, 0.10, 1, 0.58, HR);
    R(0.12, 0.17, 0.44, 0.21, HD); R(0.56, 0.17, 0.88, 0.21, HD);
    /* 눈 */
    R(0.22, 0.40, 0.40, 0.49, '#ffffff'); R(0.60, 0.40, 0.78, 0.49, '#ffffff');
    R(0.27, 0.41, 0.35, 0.48, EY); R(0.65, 0.41, 0.73, 0.48, EY);
    R(0.29, 0.42, 0.32, 0.44, '#ffffff'); R(0.67, 0.42, 0.70, 0.44, '#ffffff');
    R(0.22, 0.34, 0.40, 0.37, HD); R(0.60, 0.34, 0.78, 0.37, HD);
    /* 코 · 입 · 볼 */
    R(0.47, 0.54, 0.53, 0.60, SD);
    R(0.38, 0.68, 0.62, 0.72, LP);
    R(0.42, 0.72, 0.58, 0.74, hex(sh(lip, -30)));
    R(0.12, 0.55, 0.22, 0.60, CH); R(0.78, 0.55, 0.88, 0.60, CH);
    s.c.__skin = S;
    return s.c;
  }

  function preview(st, ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    if (!st.img) return;
    var r = srcRect(st, W / H);
    ctx.imageSmoothingEnabled = true;
    drawRot(ctx, st.img, r, W, H, st.rot || 0);
  }

  /* ---------- 배경 제거 : 네 모서리에서 시작하는 플러드 필 ----------
     이웃 픽셀과의 색 차이가 작으면 계속 번져나간다(그라디언트 배경 대응).
     얼굴까지 먹어버리면(제거율 과다) 통째로 취소한다.                */
  function stripBackground(d, w, h) {
    var n = w * h;
    var removed = new Uint8Array(n);
    var seeds = [0, w - 1, (h - 1) * w, h * w - 1];
    var stack = [], i;

    function col(i2) { var k = i2 * 4; return [d[k], d[k + 1], d[k + 2]]; }
    function dist(a, b) {
      var dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
      return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    for (i = 0; i < seeds.length; i++) {
      var s = seeds[i];
      if (removed[s]) continue;
      removed[s] = 1; stack.push(s);
      var seedCol = col(s);
      while (stack.length) {
        var cur = stack.pop();
        var cc = col(cur), cx = cur % w, cy = (cur / w) | 0;
        var nb = [
          cx > 0 ? cur - 1 : -1,
          cx < w - 1 ? cur + 1 : -1,
          cy > 0 ? cur - w : -1,
          cy < h - 1 ? cur + w : -1
        ];
        for (var j = 0; j < 4; j++) {
          var m = nb[j];
          if (m < 0 || removed[m]) continue;
          var mc = col(m);
          /* 이웃과 비슷하고(지역), 시작색에서 너무 멀지 않으면(전역) 배경 */
          if (dist(cc, mc) < 46 && dist(seedCol, mc) < 165) {
            removed[m] = 1; stack.push(m);
          }
        }
      }
    }

    var cnt = 0;
    for (i = 0; i < n; i++) if (removed[i]) cnt++;
    if (cnt > n * 0.58 || cnt < n * 0.02) return false;   /* 과하거나 무의미하면 취소 */

    for (i = 0; i < n; i++) if (removed[i]) d[i * 4 + 3] = 0;
    return true;
  }

  /* 볼 부근 최빈색 = 피부톤 (머리 실루엣 색으로 사용) */
  function sampleSkin(d, w, h) {
    var x0 = Math.floor(w * 0.28), x1 = Math.ceil(w * 0.72);
    var y0 = Math.floor(h * 0.55), y1 = Math.ceil(h * 0.80);
    var tally = {}, best = null, bestN = -1;
    for (var y = y0; y < y1; y++) {
      for (var x = x0; x < x1; x++) {
        var k = (y * w + x) * 4;
        if (d[k + 3] === 0) continue;
        var key = d[k] + ',' + d[k + 1] + ',' + d[k + 2];
        tally[key] = (tally[key] || 0) + 1;
        if (tally[key] > bestN) { bestN = tally[key]; best = key; }
      }
    }
    if (!best) return '#d69870';
    var p = best.split(',');
    return '#' + [+p[0], +p[1], +p[2]].map(function (v) {
      return ('0' + v.toString(16)).slice(-2);
    }).join('');
  }

  /* ---------- 핵심 ---------- */
  function make(st, w, h) {
    if (!st || !st.img) return placeholder(w, h, st && st.fallback);

    var tmp = E.surf(w, h);
    tmp.x.imageSmoothingEnabled = true;
    var r = srcRect(st, w / h);
    tmp.x.drawImage(st.img, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h);

    var img = tmp.x.getImageData(0, 0, w, h);
    var d = img.data, i, n = w * h;

    /* 대비 스트레치 */
    var lo = 255, hi = 0;
    for (i = 0; i < n; i++) {
      var L = d[i * 4] * 0.30 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11;
      if (L < lo) lo = L;
      if (L > hi) hi = L;
    }
    var gain = 235 / Math.max(24, hi - lo);

    /* 채도 부스트 + 팔레트 양자화 */
    for (i = 0; i < n; i++) {
      var k = i * 4;
      var R = d[k], G = d[k + 1], Bc = d[k + 2];
      var L2 = R * 0.30 + G * 0.59 + Bc * 0.11;
      var nl = (L2 - lo) * gain + 10;
      R = nl + (R - L2) * 1.28;
      G = nl + (G - L2) * 1.28;
      Bc = nl + (Bc - L2) * 1.28;
      var p = nearest(
        R < 0 ? 0 : R > 255 ? 255 : R,
        G < 0 ? 0 : G > 255 ? 255 : G,
        Bc < 0 ? 0 : Bc > 255 ? 255 : Bc
      );
      d[k] = p[0]; d[k + 1] = p[1]; d[k + 2] = p[2]; d[k + 3] = 255;
    }

    var skin = sampleSkin(d, w, h);
    if (st.strip !== false) stripBackground(d, w, h);

    var out = E.surf(w, h);
    out.x.putImageData(img, 0, 0);
    out.c.__skin = skin;
    return out.c;
  }

  function placeholder(w, h, kind) {
    var s = E.surf(w, h), g = s.x;
    var skin = kind === 'mj' ? '#f2c19c' : '#f0b48a';
    var hair = kind === 'mj' ? '#e0553a' : '#3a2418';
    g.fillStyle = skin; g.fillRect(0, 0, w, h);
    g.fillStyle = hair;
    g.fillRect(0, 0, w, Math.max(2, Math.round(h * 0.20)));
    g.fillRect(0, 0, Math.max(1, Math.round(w * 0.14)), Math.round(h * 0.50));
    g.fillRect(w - Math.max(1, Math.round(w * 0.14)), 0, Math.max(1, Math.round(w * 0.14)), Math.round(h * 0.50));
    var ey = Math.round(h * 0.42), ew = Math.max(1, Math.round(w * 0.14));
    g.fillStyle = '#24181a';
    g.fillRect(Math.round(w * 0.22), ey, ew, Math.max(1, Math.round(h * 0.10)));
    g.fillRect(Math.round(w * 0.62), ey, ew, Math.max(1, Math.round(h * 0.10)));
    g.fillStyle = '#ba343c';
    g.fillRect(Math.round(w * 0.36), Math.round(h * 0.70), Math.round(w * 0.28), Math.max(1, Math.round(h * 0.07)));
    s.c.__skin = skin;
    return s.c;
  }

  function load(file, cb) {
    var url = URL.createObjectURL(file);
    var im = new Image();
    im.onload = function () { URL.revokeObjectURL(url); cb(im); };
    im.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    im.src = url;
  }

  return { make: make, character: character, preview: preview, load: load, placeholder: placeholder, PALETTE: PALETTE };
})();
