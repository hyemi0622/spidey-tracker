/* ============================================================
   map.js — 스파이디 트래커 월드맵 (원본 사이트 기본 화면)
   대륙 폴리곤 + 원본 핀 에셋 + 레이더
   ============================================================ */
var MAP = (function () {
  'use strict';

  var W = 240, H = 420;
  var C = {
    sea: '#0a2740', seaLine: '#123b5c',
    land: '#16496f', landEdge: '#3f8fc4',
    ink: '#cfe6f7', dim: '#8fb9d3',
    red: '#e0362f', green: '#3fae6a', cyan: '#2aa8d8'
  };

  /* 대륙 (경도, 위도) */
  var LANDS = [
    [[-168,66],[-158,71],[-140,70],[-125,70],[-110,68],[-95,70],[-80,73],[-62,60],[-55,50],
     [-66,45],[-70,41],[-76,35],[-81,25],[-92,29],[-97,26],[-105,20],[-112,29],[-124,40],
     [-130,54],[-140,60],[-152,59],[-165,63]],
    [[-80,9],[-62,11],[-50,0],[-35,-6],[-38,-22],[-48,-25],[-58,-34],[-62,-41],[-66,-55],
     [-75,-50],[-73,-35],[-71,-18],[-81,-5],[-79,2]],
    [[-17,14],[-6,5],[9,4],[13,-5],[12,-18],[15,-27],[20,-35],[32,-26],[40,-16],[41,-2],
     [51,12],[43,12],[32,31],[10,37],[-6,36],[-17,21]],
    [[-10,36],[-2,43],[3,43],[8,44],[13,45],[19,40],[24,41],[29,41],[41,43],[48,46],
     [53,55],[45,66],[33,70],[25,71],[12,65],[5,60],[8,54],[2,51],[-5,48],[-9,43]],
    [[35,35],[45,40],[55,42],[70,40],[80,30],[89,22],[97,17],[103,1],[110,20],[122,30],
     [130,43],[140,52],[155,60],[170,66],[180,68],[180,72],[130,74],[100,76],[70,72],
     [55,70],[45,60],[40,47]],
    [[113,-22],[130,-12],[142,-11],[147,-20],[153,-28],[150,-38],[141,-39],[130,-32],
     [122,-34],[115,-34],[113,-26]],
    [[-55,83],[-20,82],[-18,70],[-30,60],[-45,60],[-55,66],[-58,76]],
    [[129,31],[132,34],[136,37],[141,41],[145,44],[141,45],[136,36],[131,33]]
  ];

  /* 목격 핀 (경도, 위도, 종류) */
  var PINS = [
    [-74, 40.7, 'red'], [-118, 34, 'green'], [-99, 19.4, 'green'], [-43, -22.9, 'white'],
    [-58, -34.6, 'red'], [-0.1, 51.5, 'green'], [2.3, 48.8, 'red'], [12.5, 41.9, 'green'],
    [37.6, 55.7, 'white'], [31.2, 30, 'green'], [55.3, 25.2, 'red'], [72.9, 19, 'green'],
    [116.4, 39.9, 'white'], [126.9, 37.5, 'red'], [139.7, 35.7, 'green'], [151.2, -33.9, 'red'],
    [103.8, 1.35, 'green'], [28, -26.2, 'white'], [-79.4, 43.7, 'green'], [13.4, 52.5, 'red']
  ];

  var LABELS = [
    { x: -100, y: 45, t: '북아메리카' }, { x: -58, y: -12, t: '남아메리카' },
    { x: 18, y: 12, t: '아프리카' }, { x: 95, y: 47, t: '아시아' },
    { x: 134, y: -25, t: '오세아니아' }, { x: -35, y: 22, t: '대서양' },
    { x: 78, y: -22, t: '인도양' }, { x: -150, y: 5, t: '태평양' }
  ];

  var mapSurf = null, screen = null, loop = null, host = null, rzT = 0;
  var t = 0, sweep = 0, pulse = 0, onOpen = null, blips = [];
  var MARK = { x: 0, y: 0 };
  var VIEW = { s: 1, ox: 0, oy: 0 };
  var IMG = {};
  ['red_pin', 'green_pin', 'white_pin', 'event_pin'].forEach(function (n) {
    var im = new Image(); im.src = 'assets/ui/map/' + n + '.png'; IMG[n] = im;
  });
  function ok(im) { return im && im.complete && im.naturalWidth; }

  /* 세로 화면에서도 왜곡 없게 : 경도·위도 같은 배율 */
  function SC() { return W / 360; }
  function px(lon) { return (lon + 180) * SC(); }
  function py(lat) { return H / 2 - lat * SC() * 1.15; }

  function buildMap() {
    mapSurf = E.surf(W, H);
    var g = mapSurf.x, i, k;
    g.fillStyle = C.sea; g.fillRect(0, 0, W, H);
    g.fillStyle = C.seaLine;
    for (i = 0; i < H; i += 14) g.fillRect(0, i, W, 1);
    for (i = 0; i < W; i += 14) g.fillRect(i, 0, 1, H);

    for (k = 0; k < LANDS.length; k++) {
      var pts = LANDS[k];
      g.fillStyle = C.land;
      g.beginPath();
      for (i = 0; i < pts.length; i++) {
        var X = px(pts[i][0]), Y = py(pts[i][1]);
        if (i === 0) g.moveTo(X, Y); else g.lineTo(X, Y);
      }
      g.closePath(); g.fill();
      g.strokeStyle = C.landEdge; g.lineWidth = 1; g.stroke();
    }

    PF.setStack('"Galmuri9","Galmuri11",monospace');
    for (i = 0; i < LABELS.length; i++) {
      PF.fit(g, LABELS[i].t, px(LABELS[i].x), py(LABELS[i].y), 70, 9, '#a9cde3', 'center', false);
    }
    PF.setStack();
    MARK.x = Math.round(px(-74)); MARK.y = Math.round(py(40.7));
  }

  function draw(dt) {
    var g = screen.ctx, i;
    t += dt; sweep += dt * 1.1; pulse += dt;
    g.fillStyle = C.sea; g.fillRect(0, 0, W, H);
    g.save();
    g.translate(VIEW.ox, VIEW.oy);
    g.scale(VIEW.s, VIEW.s);
    g.imageSmoothingEnabled = false;
    g.drawImage(mapSurf.c, 0, 0);

    /* 핀 */
    for (i = 0; i < PINS.length; i++) {
      var p = PINS[i], im = IMG[p[2] + '_pin'];
      var X = px(p[0]), Y = py(p[1]);
      if (!ok(im)) continue;
      var s = 16 + (i % 3);
      g.imageSmoothingEnabled = false;
      g.drawImage(im, Math.round(X - s / 2), Math.round(Y - s / 2), s, s);
    }

    /* 뉴욕 = 현재 추적 대상 */
    var pp = (pulse % 1.7) / 1.7;
    g.globalAlpha = 1 - pp;
    E.ring(g, MARK.x, MARK.y, 8 + pp * 18, C.red);
    g.globalAlpha = 1;
    if (ok(IMG.red_pin)) g.drawImage(IMG.red_pin, MARK.x - 13, MARK.y - 13, 26, 26);

    var lw = PF.width('NEW YORK', 11, false) + 11;
    var lx = MARK.x + 15;
    if (lx + lw > W - 4) lx = MARK.x - 15 - lw;
    E.rect(g, lx, MARK.y - 24, lw, 17, '#0b0f16');
    E.frame(g, lx, MARK.y - 24, lw, 17, C.red);
    E.frame(g, lx - 1, MARK.y - 25, lw + 2, 19, '#06131f');
    PF.setStack('"Galmuri9","Galmuri11",monospace');
    PF.draw(g, 'NEW YORK', lx + 5, MARK.y - 22, 11, '#ffffff', 'left', false);
    PF.setStack();

    /* 레이더 스윕 */
    for (i = 22; i >= 0; i--) {
      g.globalAlpha = (1 - i / 22) * 0.08;
      E.line(g, MARK.x, MARK.y, MARK.x + Math.cos(sweep - i * .035) * 300,
        MARK.y + Math.sin(sweep - i * .035) * 300, C.cyan, 1);
    }
    g.globalAlpha = 1;

    /* 블립 */
    if (Math.random() < dt * 1.6 && blips.length < 10) {
      blips.push({ x: 12 + Math.random() * (W - 24), y: 12 + Math.random() * (H - 24), life: 1 });
    }
    for (i = blips.length - 1; i >= 0; i--) {
      var b = blips[i];
      b.life -= dt * 0.4;
      if (b.life <= 0) { blips.splice(i, 1); continue; }
      g.globalAlpha = b.life;
      E.rect(g, b.x - 1, b.y, 3, 1, C.green);
      E.rect(g, b.x, b.y - 1, 1, 3, C.green);
      g.globalAlpha = 1;
    }

    g.restore();

    g.globalAlpha = .08; g.fillStyle = '#000';
    for (var sy = 0; sy < H; sy += 2) g.fillRect(0, sy, W, 1);
    g.globalAlpha = 1;

    screen.present();
  }

  function init(canvas, openCb) {
    host = canvas.parentElement;
    onOpen = openCb;
    screen = new E.Screen(canvas, W, { fill: 240, onSize: function (w, h) { W = w; H = h; buildMap(); } });
    W = screen.w; H = screen.h;
    if (!mapSurf) buildMap();
    loop = E.Loop(draw);
    /* ── 핀치 확대 / 드래그 ── */
    var pts = {}, last = null, moved = 0;
    function clampView() {
      VIEW.s = Math.max(1, Math.min(5, VIEW.s));
      var maxX = W * (VIEW.s - 1), maxY = H * (VIEW.s - 1);
      VIEW.ox = Math.min(0, Math.max(-maxX, VIEW.ox));
      VIEW.oy = Math.min(0, Math.max(-maxY, VIEW.oy));
    }
    function toLow(e) { return screen.toLow(e.clientX, e.clientY); }
    canvas.addEventListener('pointerdown', function (e) {
      canvas.setPointerCapture(e.pointerId);
      pts[e.pointerId] = toLow(e);
      moved = 0;
      var k = Object.keys(pts);
      last = k.length === 2 ? dist2() : null;
    });
    function dist2() {
      var k = Object.keys(pts);
      if (k.length < 2) return null;
      var a = pts[k[0]], b = pts[k[1]];
      return { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    }
    canvas.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return;
      var prev = pts[e.pointerId], cur = toLow(e);
      pts[e.pointerId] = cur;
      var k = Object.keys(pts);
      if (k.length >= 2) {
        var now = dist2();
        if (last && now && last.d > 4) {
          var f = now.d / last.d;
          var wx = (now.cx - VIEW.ox) / VIEW.s, wy = (now.cy - VIEW.oy) / VIEW.s;
          VIEW.s *= f;
          clampView();
          VIEW.ox = now.cx - wx * VIEW.s;
          VIEW.oy = now.cy - wy * VIEW.s;
          clampView();
        }
        last = now;
        moved = 99;
      } else {
        VIEW.ox += cur.x - prev.x;
        VIEW.oy += cur.y - prev.y;
        moved += Math.abs(cur.x - prev.x) + Math.abs(cur.y - prev.y);
        clampView();
      }
    });
    function up(e) {
      var was = pts[e.pointerId];
      delete pts[e.pointerId];
      last = null;
      if (!was || moved > 4) return;
      var p = { x: (was.x - VIEW.ox) / VIEW.s, y: (was.y - VIEW.oy) / VIEW.s };
      if (Math.hypot(p.x - MARK.x, p.y - MARK.y) < 24 / VIEW.s) { SFX.alarm(); onOpen && onOpen(); }
      else { blips.push({ x: p.x, y: p.y, life: 1 }); SFX.click(); }
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var p = toLow(e);
      var wx = (p.x - VIEW.ox) / VIEW.s, wy = (p.y - VIEW.oy) / VIEW.s;
      VIEW.s *= (e.deltaY < 0 ? 1.15 : 1 / 1.15);
      clampView();
      VIEW.ox = p.x - wx * VIEW.s; VIEW.oy = p.y - wy * VIEW.s;
      clampView();
    }, { passive: false });
    loop.start();
  }

  return {
    init: init,
    start: function () { loop && loop.start(); },
    stop: function () { loop && loop.stop(); },
    ping: function () {
      SFX.radar();
      for (var i = 0; i < 6; i++) blips.push({ x: 20 + Math.random() * (W - 40), y: 20 + Math.random() * (H - 40), life: 1 });
    },
    resize: function () {
      if (!screen) return;
      clearTimeout(rzT);
      rzT = setTimeout(function () { screen.resize(); }, 100);
    }
  };
})();
