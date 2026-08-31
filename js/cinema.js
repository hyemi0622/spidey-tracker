/* ============================================================
   cinema.js — 수트업 / 데일리 뷰글(세로 1면) / 옥상 피자 데이트
   모든 글자는 PF.fit / PF.block 으로 폭이 강제된다 (삐져나옴 없음)
   ============================================================ */
var CINEMA = (function () {
  'use strict';

  var D = {
    meFace: null, mjFace: null, meSmall: null, mjSmall: null,
    meName: '피터', mjName: 'M.J.', bust: null, mask: null
  };

  var scene = 'idle', T = 0, onDone = null, inset = 0;
  var suit = {}, roofHeads = null, done = {};

  function W() { return STAGE.W; }
  function H() { return STAGE.H; }
  function AV() { return Math.max(160, STAGE.H - inset); }   /* 버튼바를 뺀 실제 사용 높이 */

  /* ══════════════════════════════════════════════════════════
     SUIT UP
     ══════════════════════════════════════════════════════════ */
  function bustScale() { return W() >= 200 ? 3 : 2; }

  function enterSuit() {
    suit = { walkX: -24, maskB: SPR.CHIN + 4, webShot: 0 };
    D.bust = SPR.bustBase(D.meFace);
    D.mask = SPR.bustMask();
    SFX.bgmStart();
  }

  function drawAlley(g, w, h) {
    var floor = Math.round(h * 0.78);
    E.vgrad(g, 0, 0, w, h, ['#0a0a16', '#0e0e1e', '#121228', '#161632']);
    g.fillStyle = '#1a1526';
    for (var y = 18; y < h; y += 6) {
      for (var x = ((y / 6) % 2 ? -6 : 0); x < w; x += 14) g.fillRect(x, y, 13, 5);
    }
    var lx = Math.round(w * 0.80);
    g.globalAlpha = 0.10; g.fillStyle = '#ffd97a';
    for (var i = 0; i < h; i++) g.fillRect(lx - 7 - i * 0.8, 26 + i, 14 + i * 1.6, 1);
    g.globalAlpha = 1;
    E.rect(g, lx - 1, 4, 3, 22, '#0b0d18');
    E.rect(g, lx - 5, 20, 11, 6, '#ffd97a');
    E.rect(g, 0, floor, w, h - floor, '#0b0b18');
    E.rect(g, 0, floor, w, 1, '#26203c');
    g.globalAlpha = 0.14; E.rect(g, Math.round(w * 0.6), floor + 6, 70, 5, '#ffd97a'); g.globalAlpha = 1;
    return floor;
  }

  function stepSuit(dt) {
    var g = STAGE.ctx, w = W(), h = H();
    T += dt;
    var floor = drawAlley(g, w, h);
    var av = AV();

    if (T < 0.75) {
      PF.fit(g, 'IDENTITY  CONFIRMED', w / 2, av * 0.40, w - 24, 13, '#3fae6a', 'center', true, '#031a10');
      PF.fit(g, D.meName + '  ·  ' + D.mjName, w / 2, av * 0.40 + 20, w - 30, 11, '#eaf6ff', 'center', false, '#000');
      return;
    }

    /* 1) 걸어들어오기 */
    if (T < 2.5) {
      var pr = (T - 0.75) / 1.75;
      suit.walkX = E.lerp(-24, w * 0.42, E.ease(pr));
      var fr = SPR.walk[Math.floor(T * 9) % 4];
      g.globalAlpha = 0.35; E.rect(g, suit.walkX - 1, floor + 1, 17, 2, '#000'); g.globalAlpha = 1;
      E.spr(g, fr, suit.walkX, floor - 23);
      PF.fit(g, 'SUIT  UP', w / 2, 18, w - 30, 16, '#e0362f', 'center', true, '#2b0605');
      return;
    }

    /* 2) 흉상 클로즈업 */
    var S = bustScale();
    var bw = SPR.BUST_W + 2, bh = SPR.BUST_H + 2;
    var bx = Math.round(w / 2 - bw * S / 2);
    var by = Math.round(Math.max(28, (av - bh * S) / 2 + 10));
    var zt = E.clamp((T - 2.5) / 0.4, 0, 1);
    g.globalAlpha = 0.24; E.circle(g, w / 2, by + bh * S * 0.45, w * 0.42 * zt, '#2a2450'); g.globalAlpha = 1;

    var mt = T - 3.05;
    if (mt <= 0) suit.maskB = SPR.CHIN + 4;
    else if (mt < 1.15) {
      if (suit.maskB > SPR.CHIN + 3) SFX.unmask();
      suit.maskB = E.lerp(SPR.CHIN + 4, -6, E.ease(mt / 1.15));
    } else if (mt < 2.95) suit.maskB = -6;
    else if (mt < 3.85) suit.maskB = E.lerp(-6, SPR.CHIN + 4, E.ease((mt - 2.95) / 0.90));
    else suit.maskB = SPR.CHIN + 4;

    var s = E.surf(bw, bh);
    s.x.imageSmoothingEnabled = false;
    s.x.drawImage(D.bust, 0, 0);
    if (suit.maskB > -5) {
      s.x.save();
      s.x.beginPath(); s.x.rect(0, 0, bw, suit.maskB + 1); s.x.clip();
      s.x.drawImage(D.mask, 0, -(SPR.CHIN - suit.maskB) * 0.16);
      s.x.restore();
      if (suit.maskB > 2 && suit.maskB < SPR.CHIN + 3) {
        s.x.fillStyle = '#96201c'; s.x.fillRect(11, suit.maskB - 1, 27, 2);
        s.x.fillStyle = '#ff6a5e'; s.x.fillRect(11, suit.maskB - 2, 27, 1);
      }
      /* 윙크는 "마스크"가 한다 — 사진 위에 눈코입을 덧그리지 않는다 */
      if (mt > -0.55 && mt < -0.12) {
        s.x.fillStyle = '#e0362f'; s.x.fillRect(25, 12, 14, 9);
        s.x.fillStyle = '#0a121b'; s.x.fillRect(26, 17, 12, 2);
      }
    }
    g.imageSmoothingEnabled = false;
    g.drawImage(s.c, bx, by, bw * S, bh * S);

    if (mt > 0.2 && mt < 2.7) {
      PF.block(g, D.meName + ', 넌 이미 스파이더맨이야.', w / 2, 14, w - 24, 11, '#ffe9a8', 'center', false, '#241000', 2);
    }

    if (mt > 3.85) {
      var et = mt - 3.85;
      if (!suit.webShot) { suit.webShot = 1; SFX.thwip(); }
      var hx = w / 2 + 22, hy = by + 14;
      var tip = E.clamp(et / 0.24, 0, 1);
      E.line(g, hx, hy, hx + w * tip, hy - h * 0.5 * tip, '#eef3ff', 2);
      g.fillStyle = '#fff';
      g.fillRect(hx + w * tip - 1, hy - h * 0.5 * tip - 1, 3, 3);
      if (et > 0.28) {
        var k = E.clamp((et - 0.28) / 0.48, 0, 1);
        g.globalAlpha = 1 - k;
        g.drawImage(s.c, Math.round(bx + k * w), Math.round(by - k * h * 0.55), bw * S, bh * S);
        g.globalAlpha = 1;
      }
      if (et > 0.85) { scene = 'idle'; onDone && onDone('suit'); }
    }
  }

  /* ══════════════════════════════════════════════════════════
     DAILY BUGLE — 세로 1면
     ══════════════════════════════════════════════════════════ */
  var PAPER = '#e9e1c8', INK = '#171410', INK2 = '#4a4336';

  function photoPanel(g, px, py, pw, ph) {
    E.rect(g, px, py, pw, ph, '#1a1638');
    var r = E.rng(99), i;
    for (i = 0; i < 9; i++) {
      var bw = 14 + Math.floor(r() * 22), bh = 18 + Math.floor(r() * (ph - 14));
      var bx = px + Math.floor(r() * (pw - bw));
      E.rect(g, bx, py + ph - bh, bw, bh, i % 2 ? '#241c50' : '#2b2159');
      for (var wy = py + ph - bh + 4; wy < py + ph - 3; wy += 6)
        for (var wx = bx + 3; wx < bx + bw - 3; wx += 5)
          if (r() < 0.4) E.rect(g, wx, wy, 2, 2, '#ffd97a');
    }
    E.circle(g, px + pw - 20, py + 15, 8, '#f6f1c9');

    var hx = px + Math.round(pw * 0.36), hy = py + ph - 24;
    E.web(g, hx + 12, hy + 2, px + pw - 5, py + 3, 5, '#eef3ff');
    E.web(g, hx + 4, hy + 2, px + 6, py + 11, 5, '#eef3ff');
    E.spr(g, SPR.land, hx, hy);
    E.spr(g, SPR.mjCarry, hx - 8, hy + 5);

    g.globalAlpha = 0.17; g.fillStyle = PAPER; g.fillRect(px, py, pw, ph); g.globalAlpha = 1;
    g.globalAlpha = 0.15; g.fillStyle = '#000';
    for (var y = py; y < py + ph; y += 2) g.fillRect(px, y, pw, 1);
    g.globalAlpha = 1;
    E.frame(g, px - 1, py - 1, pw + 2, ph + 2, INK);
  }

  /* 두 번째 보도사진 : 옥상 실루엣 */
  function photoPanel2(g, px2, py2, pw2, ph2) {
    E.rect(g, px2, py2, pw2, ph2, '#141130');
    var r = E.rng(31), i;
    for (i = 0; i < 6; i++) {
      var bw = 8 + Math.floor(r() * 14), bh = 10 + Math.floor(r() * (ph2 - 8));
      var bx = px2 + Math.floor(r() * Math.max(1, pw2 - bw));
      E.rect(g, bx, py2 + ph2 - bh, bw, bh, i % 2 ? '#221a48' : '#2a2056');
      for (var wy = py2 + ph2 - bh + 3; wy < py2 + ph2 - 2; wy += 5)
        for (var wx = bx + 2; wx < bx + bw - 2; wx += 4)
          if (r() < 0.35) E.rect(g, wx, wy, 1, 2, '#ffd97a');
    }
    E.circle(g, px2 + 10, py2 + 9, 5, '#f6f1c9');
    var sx2 = px2 + Math.round(pw2 * 0.55), sy2 = py2 + ph2 - 20;
    E.spr(g, SPR.stand, sx2, sy2);
    E.web(g, sx2 + 8, sy2, px2 + pw2 - 3, py2 + 2, 3, '#eef3ff');
    g.globalAlpha = 0.17; g.fillStyle = PAPER2; g.fillRect(px2, py2, pw2, ph2); g.globalAlpha = 1;
    g.globalAlpha = 0.15; g.fillStyle = '#000';
    for (var y2 = py2; y2 < py2 + ph2; y2 += 2) g.fillRect(px2, y2, pw2, 1);
    g.globalAlpha = 1;
    E.frame(g, px2 - 1, py2 - 1, pw2 + 2, ph2 + 2, INK);
  }

  function bustInset(g, ix, iy, iw, ih) {
    E.rect(g, ix, iy, iw, ih, '#2a2450');
    g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
    g.imageSmoothingEnabled = false;
    if (D.bust) {
      var s = E.surf(SPR.BUST_W + 2, SPR.BUST_H + 2);
      s.x.imageSmoothingEnabled = false;
      s.x.drawImage(D.bust, 0, 0);
      s.x.save(); s.x.beginPath(); s.x.rect(0, 0, s.w, 26); s.x.clip();
      s.x.drawImage(D.mask, 0, -3); s.x.restore();
      s.x.fillStyle = '#96201c'; s.x.fillRect(11, 25, 27, 2);
      s.x.fillStyle = '#ff6a5e'; s.x.fillRect(11, 24, 27, 1);
      g.drawImage(s.c, ix - 2, iy - 3, s.w, s.h);
    }
    g.restore();
    g.globalAlpha = 0.17; g.fillStyle = PAPER; g.fillRect(ix, iy, iw, ih); g.globalAlpha = 1;
    g.globalAlpha = 0.16; g.fillStyle = '#000';
    for (var yy = iy; yy < iy + ih; yy += 2) g.fillRect(ix, yy, iw, 1);
    g.globalAlpha = 1;
    E.frame(g, ix, iy, iw, ih, INK);
  }

  function fakeLines(g, x, y, w, n, gap) {
    g.fillStyle = INK2;
    for (var i = 0; i < n; i++) {
      var ww = w - (i % 4 === 3 ? 8 + (i * 7) % 14 : 0);
      g.fillRect(x, y + i * gap, Math.max(6, ww), 1);
    }
  }

  /* 받침 유무로 을/를 선택 */
  function josa(name) {
    var ch = (name || '').charCodeAt((name || '').length - 1);
    if (isNaN(ch) || ch < 0xAC00 || ch > 0xD7A3) return '을';
    return ((ch - 0xAC00) % 28) !== 0 ? '을' : '를';
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate();
  }

  var PAPER2 = '#f4f1e8', RED = '#e0261e';
  var paperRect = null;

  /* 미리 나눈 줄을 상자에 맞춰 최대 크기로 (단어 중간 안 잘림) */
  function headlineLines(g, lines, x, y, boxW, boxH, maxSize, color) {
    var CAND = [22, 18, 11, 9];
    for (var ci = 0; ci < CAND.length; ci++) {
      var size = CAND[ci];
      if (size > maxSize) continue;
      var lh = Math.round(size * 1.06), ok = lines.length * lh <= boxH, i;
      for (i = 0; ok && i < lines.length; i++) if (PF.width(lines[i], size, true) > boxW) ok = false;
      if (!ok) continue;
      for (i = 0; i < lines.length; i++) PF.draw(g, lines[i], x, y + i * lh, size, color, 'left', true);
      return lines.length * lh;
    }
    return 0;
  }

  var G9 = '"Galmuri9","Galmuri11",monospace';
  function small(g, s, x, y, mw, col, al) {
    PF.setStack(G9); PF.fit(g, s, x, y, mw, 9, col, al || 'left', false); PF.setStack();
  }

  function drawBugle(g, w, h, intro) {
    E.rect(g, 0, 0, w, h, '#15120e');
    var av = AV();
    var ph = Math.round(av * 0.60), py = Math.round((av - ph) / 2);
    var px = 5, pw = w - 10, m = 4;
    var cx = px + m, inner = pw - m * 2;

    paperRect = { x: px - 1, y: py - 1, w: pw + 2, h: ph + 2 };
    g.save();
    g.translate(0, Math.round((1 - intro) * -h));
    E.rect(g, px + 2, py + 2, pw, ph, 'rgba(0,0,0,0.5)');
    E.rect(g, px, py, pw, ph, PAPER2);
    E.frame(g, px, py, pw, ph, INK);

    var y = py + 3;

    small(g, "NEW YORK'S FAVORITE NEWSPAPER", cx, y, inner, INK2, 'left');
    y += 8;

    /* 마스트헤드 : 빨간 띠 + DAILY [엠블럼] BUGLE */
    var mh = 32;
    E.rect(g, cx, y, inner, mh, RED);
    E.rect(g, cx, y + 3, inner, mh - 6, PAPER2);
    PF.fit(g, 'DAILY BUGLE', px + pw / 2, y + 2, inner - 12, 22, INK, 'center', false);
    y += mh + 2;

    /* 날짜 줄 */
    E.rect(g, cx, y, inner, 1, INK);
    small(g, 'MONDAY LATE EDITION', cx, y + 2, inner - 30, INK2, 'left');
    small(g, '50c', cx + inner, y + 2, 26, INK2, 'right');
    y += 12;
    E.rect(g, cx, y, inner, 2, INK);
    y += 5;

    /* 본문 : 왼쪽 대형 헤드라인 / 오른쪽 사진 */
    var bodyH = (py + ph - 18) - y;
    var colW = Math.floor(inner * 0.50);
    var picW = inner - colW - 4;
    var picH = Math.round(bodyH * 0.60);

    photoPanel(g, cx + colW + 4, y, picW, picH);
    PF.fit(g, '사진: ' + D.meName.toUpperCase(), cx + colW + 4, y + picH + 2, picW, 7, INK2, 'left', false);

    var used = headlineLines(g, ['스파이더맨이', D.mjName + josa(D.mjName), '구했다!'],
      cx, y, colW, picH + 22, 26, INK);
    /* 검은 박스 부제 */
    var bbY = y + used + 5;
    E.rect(g, cx, bbY, colW, 34, INK);
    PF.fit(g, '3번가 상공', cx + 4, bbY + 4, colW - 8, 11, '#ffffff', 'left', false);
    PF.fit(g, '극적인 구조', cx + 4, bbY + 19, colW - 8, 11, '#ffffff', 'left', false);

    /* 아래 본문 라인 */
    var restY = Math.max(y + picH + 14, bbY + 38), restH = (py + ph - 22) - restY;
    if (restH > 24) {
      var cw2 = Math.floor((inner - 6) / 2);
      /* 왼쪽 : 소제목 + 본문 */
      PF.fit(g, '목격자 진술', cx, restY, cw2, 11, INK, 'left', false);
      fakeLines(g, cx, restY + 15, cw2, Math.min(7, Math.floor((restH - 18) / 6)), 6);
      /* 오른쪽 : 두 번째 사진 + 캡션 */
      var p2h = Math.min(46, Math.max(30, restH - 26));
      photoPanel2(g, cx + cw2 + 6, restY, cw2, p2h);
      small(g, '옥상에서 포착된 실루엣', cx + cw2 + 6, restY + p2h + 3, cw2, INK2, 'left');
      var left = (py + ph - 22) - (restY + p2h + 14);
      if (left > 8) fakeLines(g, cx + cw2 + 6, restY + p2h + 14, cw2, Math.floor(left / 6), 6);
    }

    /* 하단 빨간 띠 */
    E.rect(g, cx, py + ph - 18, inner, 15, RED);
    PF.fit(g, '시장실, 포상금 검토', cx + inner / 2, py + ph - 15, inner - 10, 11, '#ffffff', 'center', false);

    g.globalAlpha = 0.05; g.fillStyle = '#8a7f60';
    for (var n = 0; n < 70; n++) g.fillRect((n * 37) % pw + px, (n * 61) % ph + py, 1, 1);
    g.globalAlpha = 1;
    g.restore();
    PF.setStack();
  }

  function stepBugle(dt) {
    var g = STAGE.ctx, w = W(), h = H();
    T += dt;
    if (T < 0.18) { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); return; }
    drawBugle(g, w, h, E.clamp((T - 0.18) / 0.42, 0, 1));
    if (!done.bugle && T > 0.9) {
      done.bugle = true; SFX.fanfare();
      STAGE.stopCapture();
      onDone && onDone('bugle');
    }
  }

  /* ══════════════════════════════════════════════════════════
     옥상 피자 데이트
     ══════════════════════════════════════════════════════════ */
  function enterRoof() {
    roofHeads = { me: SPR.headRolled(D.meSmall, 9), mj: SPR.mjHead(D.mjSmall) };
    SFX.bgmStart();
  }

  function stepRoof(dt) {
    var g = STAGE.ctx, w = W(), h = H(), i;
    T += dt;
    var av = AV();
    var ROOF = Math.round(av * 0.80);

    /* 밤하늘 */
    E.vgrad(g, 0, 0, w, h, ['#080618', '#0c0a22', '#12102e', '#191539', '#241a45', '#33204d', '#4a2650', '#6b3050']);
    var r0 = E.rng(7);
    for (i = 0; i < 60; i++) {
      var sx0 = r0() * w, sy0 = r0() * ROOF * 0.8;
      g.globalAlpha = 0.35 + 0.4 * Math.sin(T * 2 + i);
      g.fillStyle = '#ffffff'; g.fillRect(sx0 | 0, sy0 | 0, 1, 1);
    }
    g.globalAlpha = 1;
    var mx = Math.round(w * 0.76), my = Math.round(av * 0.16);
    E.circle(g, mx, my, 15, '#f6f1c9');
    E.circle(g, mx + 5, my - 4, 3, '#ded6a8');
    E.circle(g, mx - 4, my + 5, 4, '#ded6a8');
    g.globalAlpha = 0.10; E.circle(g, mx, my, 24, '#f6f1c9'); g.globalAlpha = 1;

    /* 멀리 스카이라인 */
    var r = E.rng(4242);
    for (i = 0; i < 26; i++) {
      var bw = 9 + Math.floor(r() * 18), bh = 16 + Math.floor(r() * (ROOF * 0.45));
      var bx = Math.floor(r() * (w + 20)) - 10;
      E.rect(g, bx, ROOF - bh, bw, bh + 12, i % 2 ? '#241a3e' : '#1b1430');
      for (var wy = ROOF - bh + 4; wy < ROOF; wy += 6)
        for (var wx = bx + 2; wx < bx + bw - 3; wx += 5)
          if (r() < 0.35) E.rect(g, wx, wy, 2, 2, '#ffd97a');
    }

    /* 옥상 슬래브 */
    E.rect(g, 0, ROOF, w, h - ROOF, '#161129');
    E.rect(g, 0, ROOF, w, 3, '#3b3268');
    E.rect(g, 0, ROOF + 3, w, 1, '#0d0a1c');
    for (var vx = 5; vx < w; vx += 14) E.rect(g, vx, ROOF + 6, 8, 1, '#241c50');
    /* 건물 벽면 창문 */
    for (var fy = ROOF + 14; fy < h; fy += 11)
      for (var fx = 6; fx < w - 6; fx += 13)
        E.rect(g, fx, fy, 4, 5, ((fx + fy) % 3) ? '#241c50' : '#ffd97a');
    /* 물탱크 + 안테나 */
    E.spr(g, SPR.waterTower, Math.round(w * 0.08), ROOF - 27);
    var ax = Math.round(w * 0.90);
    E.rect(g, ax - 1, ROOF - 52, 3, 52, '#241d42');
    E.rect(g, ax - 4, ROOF - 36, 9, 3, '#241d42');
    var bl = Math.floor(T * 1.6) % 2;
    E.rect(g, ax - 1, ROOF - 56, 3, 3, bl ? '#e0362f' : '#5a1a1a');

    /* 두 사람 : 건물 위에 나란히 */
    var HX = Math.round(w * 0.42);
    var BODY = ROOF - 15, HEADY = BODY - 16;
    var mex = HX - 8, mjx = HX + 12;
    E.spr(g, SPR.standBody, mex, BODY);
    E.spr(g, roofHeads.me, mex + 1, HEADY);
    E.spr(g, SPR.mjStandBody, mjx, BODY);
    E.spr(g, roofHeads.mj, mjx + 1, HEADY + 1);

    /* 하트 */
    for (i = 0; i < 3; i++) {
      var ht = (T * 0.45 + i * 0.33) % 1;
      var hx = HX + 6 + Math.sin(ht * 6 + i) * 5, hy = HEADY - 4 - ht * 30;
      g.globalAlpha = (1 - ht) * 0.9; g.fillStyle = '#e0362f';
      g.fillRect(hx, hy + 1, 2, 2); g.fillRect(hx + 3, hy + 1, 2, 2);
      g.fillRect(hx, hy + 2, 5, 2); g.fillRect(hx + 1, hy + 4, 3, 1); g.fillRect(hx + 2, hy + 5, 1, 1);
      g.globalAlpha = 1;
    }
    E.spr(g, SPR.pigeon, ((T * 16) % (w + 50)) - 25, Math.round(av * 0.30) + Math.sin(T * 2) * 5);

    /* 자막 */
    var fade = E.clamp((T - 0.4) / 0.8, 0, 1);
    g.globalAlpha = fade;
    PF.block(g, '그날 밤, 뉴욕에서 가장 높은 곳', w / 2, 12, w - 20, 12, '#ffffff', 'center', true, '#2b1000', 2);
    PF.fit(g, D.meName + '  &  ' + D.mjName, w / 2, 34, w - 30, 10, '#ffe9a8', 'center', false, '#2b1000');
    g.globalAlpha = 1;
    if (T > 1.6) {
      g.globalAlpha = 0.6 + (Math.sin(T * 3) * 0.5 + 0.5) * 0.4;
      PF.fit(g, '- THE END -', w / 2, av - 22, w - 30, 11, '#ffffff', 'center', true, '#000');
      g.globalAlpha = 1;
    }
    g.globalAlpha = 0.16; g.fillStyle = '#000';
    g.fillRect(0, 0, w, 4); g.fillRect(0, av - 4, w, 4);
    g.globalAlpha = 1;

    if (!done.roof && T > 1.0) { done.roof = true; onDone && onDone('roof'); }
  }

  /* ══════════════════════════════════════════════════════════ */
  function go(name, cb) {
    scene = name; T = 0;
    if (cb) onDone = cb;
    if (name === 'suit') { enterSuit(); STAGE.setMode(stepSuit); }
    else if (name === 'bugle') { done.bugle = false; STAGE.setMode(stepBugle); }
    else if (name === 'roof') { done.roof = false; enterRoof(); STAGE.setMode(stepRoof); }
    STAGE.start();
  }

  function setCast(me, mj2, meName, mjName) {
    var mSrc = (me && me.img) ? me : { fallback: 'me' };
    var jSrc = (mj2 && mj2.img) ? mj2 : { fallback: 'mj' };
    D.meFace = FACE.character(mSrc, SPR.FACE_W, SPR.FACE_H);
    D.mjFace = FACE.character(jSrc, SPR.FACE_W, SPR.FACE_H);
    D.meSmall = FACE.character(mSrc, SPR.SMALL_W, SPR.SMALL_H);
    D.mjSmall = FACE.character(jSrc, SPR.SMALL_W, SPR.SMALL_H);
    D.meName = (meName || '').trim() || '피터';
    D.mjName = (mjName || '').trim() || 'M.J.';
    D.bust = SPR.bustBase(D.meFace);
    D.mask = SPR.bustMask();
  }

  return {
    paperRect: function () { return scene === 'bugle' ? paperRect : null; },
    setInset: function (v) { inset = v | 0; },
    setCast: setCast, go: go,
    names: function () { return { me: D.meName, mj: D.mjName }; },
    scene: function () { return scene; }
  };
})();
