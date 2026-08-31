/* ============================================================
   city.js — 시차 스크롤 뉴욕 야경 (게임 / 시네마 공용)
   ============================================================ */
var CITY = (function () {
  'use strict';

  var GROUND = 520;                 /* 월드 y = 길바닥 */
  var SKY = ['#080618', '#0c0a22', '#12102e', '#191539', '#211a45', '#2b1f4e', '#371f4f', '#45234c'];

  var LAYERS = [
    { f: 0.20, cur: 0, list: [], col: '#14102e', top: '#1a1538', win: '#241d47', wp: 0.10, hmin: 120, hmax: 200, wmin: 14, wmax: 30, gmin: 2, gmax: 8, detail: false },
    { f: 0.48, cur: 0, list: [], col: '#1c1640', top: '#241c50', win: '#5b4a92', wp: 0.20, hmin: 160, hmax: 260, wmin: 18, wmax: 38, gmin: 3, gmax: 12, detail: false },
    { f: 1.00, cur: 0, list: [], col: '#2b2159', top: '#372a6b', win: '#ffd97a', wp: 0.40, hmin: 200, hmax: 360, wmin: 26, wmax: 48, gmin: 30, gmax: 62, detail: true },
    { f: 1.75, cur: 0, list: [], col: '#090614', top: '#0d0a1c', win: '#151030', wp: 0.05, hmin: 300, hmax: 430, wmin: 30, wmax: 60, gmin: 200, gmax: 400, detail: false }
  ];

  var rnd = E.rng(20260831);
  var stars = null;

  function reset(seed) {
    for (var i = 0; i < LAYERS.length; i++) { LAYERS[i].list.length = 0; LAYERS[i].cur = -300; }
    rnd = E.rng(seed || 20260831);
    stars = null;
  }

  function ensure(L, until) {
    while (L.cur < until) {
      var w = Math.round(L.wmin + rnd() * (L.wmax - L.wmin));
      var h = Math.round(L.hmin + rnd() * (L.hmax - L.hmin));
      var b = { x: L.cur, w: w, h: h, top: GROUND - h, wins: [], det: 0 };
      if (L.wp > 0) {
        for (var wy = b.top + 7; wy < GROUND - 5; wy += 8) {
          for (var wx = b.x + 4; wx < b.x + w - 5; wx += 7) {
            if (rnd() < L.wp) b.wins.push([wx - b.x, wy - b.top, rnd() < 0.12 ? 1 : 0]);
          }
        }
      }
      if (L.detail) b.det = rnd() < 0.42 ? 1 : (rnd() < 0.35 ? 2 : 0);
      L.list.push(b);
      L.cur += w + Math.round(L.gmin + rnd() * (L.gmax - L.gmin));
    }
    while (L.list.length > 70) L.list.shift();
  }

  function ensureAll(camX, W) {
    for (var i = 0; i < LAYERS.length; i++) ensure(LAYERS[i], camX * LAYERS[i].f + W + 200);
  }

  /* 메인 레이어에서 x 위치의 옥상 높이 */
  function topAt(worldX) {
    var L = LAYERS[2];
    for (var i = 0; i < L.list.length; i++) {
      var b = L.list[i];
      if (worldX >= b.x && worldX <= b.x + b.w) return b.top;
    }
    return null;
  }
  /* x 이후 첫 건물의 옥상 (빈 공간이면 다음 건물로) */
  function nextTop(x) {
    var L = LAYERS[2], best = null;
    for (var i = 0; i < L.list.length; i++) {
      var b = L.list[i];
      if (b.x + b.w < x) continue;
      if (!best || b.x < best.x) best = b;
    }
    if (!best) return null;
    return { x: best.x + best.w / 2, y: best.top };
  }

  /* 앵커 후보: 앞쪽 위 옥상 */
  function anchorAhead(px, py, minAhead, maxAhead) {
    var L = LAYERS[2], best = null, bestScore = 1e9;
    for (var i = 0; i < L.list.length; i++) {
      var b = L.list[i];
      var ax = b.x + b.w * 0.5;
      var dx = ax - px;
      if (dx < minAhead || dx > maxAhead) continue;
      if (b.top > py - 30) continue;
      /* 45~60도 방향에 가까운 옥상을 선호 */
      var ang = Math.atan2(py - b.top, dx);
      var score = Math.abs(ang - 0.95) * 100 + Math.abs(dx - (minAhead + maxAhead) / 2) * 0.35;
      if (score < bestScore) { bestScore = score; best = { x: ax, y: b.top - 6 }; }
    }
    return best;
  }

  function makeStars(W, H) {
    stars = [];
    var r = E.rng(7);
    for (var i = 0; i < 70; i++) stars.push([r() * W, r() * H * 0.7, r() < 0.25 ? 1 : 0]);
  }

  function drawSky(g, W, H, camX, camY) {
    E.vgrad(g, 0, 0, W, H, SKY);
    if (!stars) makeStars(W, H);
    var ox = ((camX * 0.04) % W + W) % W;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var x = s[0] - ox; if (x < 0) x += W;
      g.fillStyle = s[2] ? '#ffffff' : '#b9c7ff';
      g.fillRect(x | 0, (s[1] - camY * 0.04) | 0, 1, 1);
    }
    var mx = W * 0.78 - ((camX * 0.05) % (W * 2.2)), my = 34 - camY * 0.05;
    E.circle(g, mx, my, 11, '#f6f1c9');
    E.circle(g, mx + 4, my - 3, 2, '#ded6a8');
    E.circle(g, mx - 3, my + 4, 3, '#ded6a8');
    g.globalAlpha = 0.10; E.circle(g, mx, my, 17, '#f6f1c9'); g.globalAlpha = 1;
  }

  function drawLayer(g, W, H, camX, camY, idx) {
    var L = LAYERS[idx];
    var ox = camX * L.f, oy = camY * L.f;
    for (var i = 0; i < L.list.length; i++) {
      var b = L.list[i];
      var sx = Math.round(b.x - ox), sy = Math.round(b.top - oy);
      if (sx > W || sx + b.w < 0) continue;
      E.rect(g, sx, sy, b.w, H - sy + 60, L.col);
      E.rect(g, sx, sy, b.w, 2, L.top);
      for (var k = 0; k < b.wins.length; k++) {
        var wv = b.wins[k];
        E.rect(g, sx + wv[0], sy + wv[1], 2, 3, wv[2] ? '#7fd2ff' : L.win);
      }
      if (b.det === 1) E.spr(g, SPR.waterTower, sx + (b.w >> 1) - 6, sy - 14);
      else if (b.det === 2) {
        E.rect(g, sx + 4, sy - 5, 6, 5, '#3b2f70');
        E.rect(g, sx + b.w - 11, sy - 10, 3, 10, '#241c50');
        E.rect(g, sx + b.w - 12, sy - 12, 5, 2, '#e0362f');
      }
    }
  }

  function drawBack(g, W, H, camX, camY) {
    drawLayer(g, W, H, camX, camY, 0);
    drawLayer(g, W, H, camX, camY, 1);
    drawLayer(g, W, H, camX, camY, 2);
  }
  function drawFore(g, W, H, camX, camY) { drawLayer(g, W, H, camX, camY, 3); }

  /* 길바닥 */
  function drawStreet(g, W, H, camX, camY) {
    var sy = GROUND - camY;
    if (sy > H + 4) return;
    E.rect(g, 0, sy, W, H - sy + 8, '#0a0814');
    E.rect(g, 0, sy, W, 1, '#3a2f70');
    var ox = camX % 24;
    for (var x = -ox; x < W; x += 24) E.rect(g, x, sy + 6, 10, 1, '#241c50');
  }

  return {
    GROUND: GROUND, SKY: SKY,
    reset: reset, ensureAll: ensureAll, topAt: topAt, nextTop: nextTop, anchorAhead: anchorAhead,
    drawSky: drawSky, drawBack: drawBack, drawFore: drawFore, drawStreet: drawStreet
  };
})();
