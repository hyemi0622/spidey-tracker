/* ============================================================
   game.js — 직접 플레이하는 거미줄 스윙
   누르고 있으면 거미줄 발사·매달림 / 떼면 놓기
   목표 거리에 도달하면 MJ 구출 시퀀스로 이어짐
   ============================================================ */
var GAME = (function () {
  'use strict';

  var G_ACC = 800;
  var METER = 10;                /* 월드 px = 1m */
  var GOAL_M = 900;

  var st = 'idle';               /* ready | play | over | rescue */
  var p = {}, webs = [], mj = null, foes = [], foeCur = 0, deadBy = '';
  var camX = 0, camY = 0, t = 0, overT = 0;
  var holding = false, startX = 0, best = 0;
  var fx = { shake: 0, flash: 0, sense: 0 };
  var rescue = { ph: '', t: 0, landX: 0, landY: 0, p0: null };
  var cbClear = null, cbOver = null;
  var bound = false;

  function W() { return STAGE.W; }
  function H() { return STAGE.H; }
  function dist() { return Math.max(0, Math.round((p.x - startX) / METER)); }

  /* ---------- 시작 ---------- */
  function reset() {
    CITY.reset(Date.now() & 0xffff);
    CITY.ensureAll(0, W());
    var top = CITY.topAt(120);
    p = {
      x: 120, y: (top === null ? CITY.GROUND - 220 : top - 40),
      vx: 150, vy: 0, mode: 'free',
      ax: 0, ay: 0, L: 0, th: 0, om: 0, shootT: 0
    };
    startX = p.x;
    webs = []; mj = null; foes = []; foeCur = p.x + 1500; deadBy = '';
    camX = p.x - W() * 0.34;
    camY = p.y - H() * 0.45;
    t = 0; overT = 0; holding = false;
    fx.shake = 0; fx.flash = 0; fx.sense = 0;
    rescue = { ph: '', t: 0, landX: 0, landY: 0, p0: null };
    try { best = parseInt(localStorage.getItem('spidey_best') || '0', 10) || 0; } catch (e) { best = 0; }
  }

  /* ---------- 거미줄 ---------- */
  function shoot() {
    if (p.mode === 'swing' || p.mode === 'shoot') return;
    var a = CITY.anchorAhead(p.x, p.y, 45, 165);
    if (!a) a = { x: p.x + 85, y: Math.max(60, p.y - 95) };
    if (a.y > p.y - 32) a.y = p.y - 70;
    p.ax = a.x; p.ay = a.y;
    p.shootT = 0; p.mode = 'shoot';
    SFX.thwip();
  }
  function attach() {
    var L = Math.max(40, Math.hypot(p.x - p.ax, p.y - p.ay));
    p.L = L;
    p.th = Math.atan2(p.x - p.ax, p.y - p.ay);
    p.om = (p.vx * Math.cos(p.th) - p.vy * Math.sin(p.th)) / L;
    if (p.om < 0.25) p.om = 0.25;
    p.mode = 'swing';
  }
  function release() {
    if (p.mode !== 'swing') { if (p.mode === 'shoot') p.mode = 'free'; return; }
    p.vx = p.L * p.om * Math.cos(p.th);
    p.vy = -p.L * p.om * Math.sin(p.th);
    p.mode = 'free';
    webs.push({ x0: p.x, y0: p.y, x1: p.ax, y1: p.ay, life: 0.7 });
    SFX.swoosh();
  }

  function stepPlayer(dt) {
    var i;
    for (i = webs.length - 1; i >= 0; i--) {
      webs[i].life -= dt * 1.6;
      webs[i].y0 += 90 * dt; webs[i].y1 += 40 * dt;
      if (webs[i].life <= 0) webs.splice(i, 1);
    }

    if (p.mode === 'swing') {
      p.om += (-G_ACC / p.L) * Math.sin(p.th) * dt;
      if (p.om > 0 && p.th < 0.2) p.om += 0.9 * dt;      /* 전진 추진 */
      p.om *= (1 - 0.09 * dt);
      if (p.om > 2.8) p.om = 2.8;
      p.th += p.om * dt;
      p.x = p.ax + p.L * Math.sin(p.th);
      p.y = p.ay + p.L * Math.cos(p.th);
      p.vx = p.L * p.om * Math.cos(p.th);
      p.vy = -p.L * p.om * Math.sin(p.th);
      if (p.th > 1.25) release();                        /* 너무 넘어가면 자동 해제 */
    } else if (p.mode === 'shoot') {
      p.shootT += dt;
      p.vy += G_ACC * 0.55 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.shootT > 0.10) attach();
    } else {
      p.vy += G_ACC * dt;
      p.vx *= (1 - 0.25 * dt);
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    if (p.vx < 40) p.vx = 40;                            /* 완전히 멈추지 않게 */
  }

  /* ---------- 빌런 ---------- */
  function ensureFoes() {
    while (foeCur < p.x + 900) {
      var k = Math.floor(Math.random() * 3);
      var top = CITY.topAt(foeCur);
      var y;
      if (k === 0) y = (top === null ? p.y : top) - 40 - Math.random() * 60;     /* 진: 상공 */
      else if (k === 1) y = (top === null ? p.y + 40 : top - 10);                /* 핸드: 옥상 */
      else y = (top === null ? p.y + 70 : top + 40 + Math.random() * 60);        /* 스콜피온: 벽면 */
      foes.push({ k: k, x: foeCur, y: y, y0: y, t: Math.random() * 6 });
      foeCur += 430 + Math.random() * 380;
    }
    while (foes.length && foes[0].x < p.x - 200) foes.shift();
  }
  function stepFoes(dt) {
    for (var i = 0; i < foes.length; i++) {
      var f = foes[i];
      f.t += dt;
      if (f.k === 0) { f.y = f.y0 + Math.sin(f.t * 2.0) * 22; f.x -= 18 * dt; }
      else if (f.k === 1) { f.y = f.y0 - Math.abs(Math.sin(f.t * 2.6)) * 30; }
      else { f.y = f.y0 + Math.sin(f.t * 1.4) * 26; f.x += Math.sin(f.t * 0.8) * 12 * dt; }
      var d = SPR.FOE[f.k];
      if (Math.abs(p.x - f.x - d.w / 2) < d.w / 2 + 1 && Math.abs(p.y + 10 - f.y - d.h / 2) < d.h / 2 + 2) {
        deadBy = d.name;
        return true;
      }
    }
    return false;
  }
  function drawFoes(g, cx, cy) {
    for (var i = 0; i < foes.length; i++) {
      var f = foes[i], d = SPR.FOE[f.k];
      var sx = f.x - cx, sy = f.y - cy;
      if (sx < -40 || sx > W() + 40) continue;
      if (f.k === 0) {
        g.globalAlpha = 0.25 + 0.15 * Math.sin(f.t * 6);
        E.circle(g, sx + 8, sy + 10, 14, '#ff7a1a'); g.globalAlpha = 1;
      }
      E.spr(g, d.spr, sx, sy);
    }
    /* 접근 경고 */
    for (i = 0; i < foes.length; i++) {
      var f2 = foes[i], dx = f2.x - p.x;
      if (dx > W() * 0.6 && dx < W() * 1.5) {
        var wy = E.clamp(f2.y - cy, 16, H() - 60);
        g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 8);
        E.rect(g, W() - 7, wy, 4, 4, '#e0362f');
        g.globalAlpha = 1;
      }
    }
  }

  /* ---------- 그리기 ---------- */
  function drawWebLine(g, hx, hy, ax, ay, prog) {
    var tx = hx + (ax - hx) * prog, ty = hy + (ay - hy) * prog;
    E.web(g, hx, hy, tx, ty, prog >= 1 ? 2.5 : 0, '#dfe6ff');
    E.line(g, hx, hy, hx + (tx - hx) * 0.18, hy + (ty - hy) * 0.18, '#ffffff', 2);
    if (prog >= 1) {
      g.fillStyle = '#eef3ff';
      g.fillRect(Math.round(ax) - 2, Math.round(ay), 5, 1);
      g.fillRect(Math.round(ax), Math.round(ay) - 2, 1, 5);
      g.fillRect(Math.round(ax) - 1, Math.round(ay) - 1, 3, 3);
    } else {
      g.fillStyle = '#ffffff';
      g.fillRect(Math.round(tx) - 1, Math.round(ty) - 1, 3, 3);
    }
  }

  function drawPlayer(g) {
    var sx = p.x - camX, sy = p.y - camY, i;
    for (i = 0; i < webs.length; i++) {
      var w = webs[i];
      g.globalAlpha = Math.max(0, w.life) * 0.8;
      E.web(g, w.x0 - camX, w.y0 - camY, w.x1 - camX, w.y1 - camY, 9, '#b9c4ee');
      g.globalAlpha = 1;
    }
    if (p.mode === 'swing' || p.mode === 'shoot') {
      var prog = p.mode === 'shoot' ? Math.min(1, p.shootT / 0.10) : 1;
      drawWebLine(g, sx, sy, p.ax - camX, p.ay - camY, prog);
      var ang = p.mode === 'swing' ? -p.th : Math.atan2(p.vy, p.vx) * 0.25;
      SPR.sprPivot(g, SPR.swing, sx, sy, ang, SPR.swingPivot.x, SPR.swingPivot.y, false);
    } else {
      var a2 = E.clamp(Math.atan2(p.vy, p.vx) * 0.8, -1.0, 1.1);
      E.sprRot(g, SPR.dive, sx + 2, sy + 5, a2, false);
    }
    if (p.carry && mj) E.spr(g, SPR.mjCarry, sx - 11, sy + 11);
  }

  /* 트래커 톤 HUD */
  function plate(g, x, y, w, h, col) {
    E.rect(g, x, y, w, h, 'rgba(6,19,31,0.82)');
    E.frame(g, x, y, w, h, col || '#2aa8d8');
  }

  function drawHUD(g) {
    var w = W();
    
    var top = 34;
    plate(g, 6, top, 78, 18);
    PF.draw(g, dist() + ' m', 10, top + 2, 11, '#eaf6ff', 'left', false);
    plate(g, w - 84, top, 78, 18, '#f2a825');
    PF.draw(g, '목표 ' + GOAL_M + 'm', w - 10, top + 2, 11, '#ffd98a', 'right', false);

    /* 진행 바 */
    var bw = w - 12;
    E.rect(g, 6, top + 21, bw, 4, 'rgba(6,19,31,0.8)');
    E.rect(g, 6, top + 18, Math.round(bw * Math.min(1, dist() / GOAL_M)), 4, '#3fae6a');
    E.frame(g, 6, top + 21, bw, 4, '#1d5d84');
    
  }

  /* ---------- 구출 시퀀스 ---------- */
  function startRescue() {
    st = 'rescue';
    rescue.ph = 'alert'; rescue.t = 0;
    fx.sense = 1.2; SFX.alarm();
    STAGE.startCapture();
    CITY.ensureAll(camX + 600, W());
    var spot = CITY.nextTop(p.x + 160);
    var mx = spot ? spot.x : p.x + 210;
    var top = spot ? spot.y : (p.y - 120);
    mj = { x: mx, y: top - 8, vy: 0, caught: false };
  }

  function stepRescue(dt) {
    rescue.t += dt;
    if (rescue.ph === 'alert') {
      stepPlayer(dt * 0.4);
      mj.vy += G_ACC * 0.3 * dt; mj.y += mj.vy * dt;
      if (rescue.t > 0.95) { rescue.ph = 'dive'; rescue.t = 0; p.mode = 'free'; SFX.swoosh(); }
    } else if (rescue.ph === 'dive') {
      mj.vy += G_ACC * 0.5 * dt; mj.y += mj.vy * dt;
      p.x = E.lerp(p.x, mj.x - 5, Math.min(1, dt * 4.0));
      p.y = E.lerp(p.y, mj.y - 3, Math.min(1, dt * 3.6));
      p.vx = 220; p.vy = 120;
      if (rescue.t > 1.3 || Math.hypot(p.x - mj.x, p.y - mj.y) < 9) {
        rescue.ph = 'catch'; rescue.t = 0; mj.caught = true; p.carry = true;
        fx.shake = 0.35; SFX.land();
        CITY.ensureAll(camX + 600, W());
        var roof = CITY.nextTop(mj.x + 90);
        if (!roof) roof = { x: mj.x + 130, y: (CITY.topAt(mj.x) || mj.y) - 10 };
        rescue.landX = roof.x; rescue.landY = roof.y;
      }
    } else if (rescue.ph === 'catch') {
      p.vy += G_ACC * 0.5 * dt;
      p.x += 140 * dt; p.y += p.vy * dt;
      if (rescue.t > 0.32) { rescue.ph = 'up'; rescue.t = 0; rescue.p0 = { x: p.x, y: p.y }; SFX.thwip(); }
    } else if (rescue.ph === 'up') {
      var u = E.clamp(rescue.t / 1.45, 0, 1), eu = E.ease(u);
      p.ax = (rescue.landX + rescue.p0.x) / 2;
      p.ay = Math.min(rescue.landY, rescue.p0.y) - 62;
      p.x = E.lerp(rescue.p0.x, rescue.landX - 4, eu);
      p.y = E.lerp(rescue.p0.y, rescue.landY - 17, eu) - Math.sin(u * Math.PI) * 42;
      if (u >= 1) { rescue.ph = 'land'; rescue.t = 0; fx.shake = 0.45; SFX.land(); }
    } else if (rescue.ph === 'land') {
      p.x = rescue.landX - 4; p.y = rescue.landY - 17;
      if (rescue.t > 0.8 && !rescue.flashed) { rescue.flashed = true; fx.flash = 1; SFX.shutter(); }
      if (rescue.t > 1.7) { st = 'done'; cbClear && cbClear(); return; }
    }
  }

  /* ---------- 메인 루프 ---------- */
  function step(dt) {
    var g = STAGE.ctx, w = W(), h = H(), i;
    t += dt;

    if (st === 'play') {
      stepPlayer(dt);
      ensureFoes();
      if (stepFoes(dt)) {
        st = 'over'; overT = 0; fx.shake = .6; SFX.alarm(); SFX.land();
        var dd = dist();
        if (dd > best) { best = dd; try { localStorage.setItem('spidey_best', String(dd)); } catch (e) { } }
        cbOver && cbOver(dd);
      } else if (p.y > CITY.GROUND - 14) {    /* 길바닥 충돌 */
        st = 'over'; overT = 0; deadBy = '';
        var d = dist();
        if (d > best) { best = d; try { localStorage.setItem('spidey_best', String(d)); } catch (e) { } }
        SFX.land(); fx.shake = 0.5;
        cbOver && cbOver(d);
      } else if (dist() >= GOAL_M) startRescue();
    } else if (st === 'rescue') {
      stepRescue(dt);
    } else if (st === 'ready') {
      p.x += 30 * dt;
    } else if (st === 'over') {
      overT += dt;
      p.vy += G_ACC * dt * 0.3;
    }

    /* 카메라 */
    var tx = p.x - w * 0.34;
    var ty = E.clamp(p.y - h * 0.45, -60, CITY.GROUND - h + 40);
    var kf = (st === 'rescue') ? 9 : 4;
    camX = E.lerp(camX, tx, Math.min(1, dt * kf));
    camY = E.lerp(camY, ty, Math.min(1, dt * (kf - 1)));

    var shX = 0, shY = 0;
    if (fx.shake > 0) {
      fx.shake -= dt;
      shX = (Math.random() - .5) * 5 * fx.shake;
      shY = (Math.random() - .5) * 5 * fx.shake;
    }
    var cx = camX + shX, cy = camY + shY;

    CITY.ensureAll(cx, w);
    CITY.drawSky(g, w, h, cx, cy);
    CITY.drawBack(g, w, h, cx, cy);
    CITY.drawStreet(g, w, h, cx, cy);
    /* 구출 장면에선 전경 기둥을 캐릭터 뒤로 보내 가리지 않게 */
    if (st === 'rescue') CITY.drawFore(g, w, h, cx, cy);
    if (st === 'play' || st === 'over' || st === 'ready') drawFoes(g, cx, cy);

    if (mj && !mj.caught) {
      var msx = mj.x - cx, msy = mj.y - cy;
      E.spr(g, SPR.mjFall, msx - 7, msy - 9);
      PF.draw(g, '꺄악!', msx + 9, msy - 20, 10, '#ffe9a8', 'left', true);
    }

    if (st === 'rescue' && rescue.ph === 'land') {
      var lsx = p.x - cx, lsy = p.y - cy;
      E.spr(g, SPR.land, lsx - 10, lsy);
      E.spr(g, SPR.mjCarry, lsx - 16, lsy + 4);
      if (rescue.t > 0.3) {
        PF.block(g, '괜찮아요, 이제 안전해요.', w / 2, 30, w - 24, 11, '#ffffff', 'center', false, '#000');
      }
    } else if (st === 'rescue' && rescue.ph === 'up') {
      var usx = p.x - cx, usy = p.y - cy;
      drawWebLine(g, usx, usy, p.ax - cx, p.ay - cy, 1);
      SPR.sprPivot(g, SPR.swing, usx, usy, -0.22, SPR.swingPivot.x, SPR.swingPivot.y, false);
      E.spr(g, SPR.mjCarry, usx - 11, usy + 13);
    } else {
      drawPlayer(g);
    }

    if (st !== 'rescue') CITY.drawFore(g, w, h, cx, cy);

    if (fx.sense > 0) {
      fx.sense -= dt;
      var hx = p.x - cx, hy = p.y - cy;
      g.globalAlpha = E.clamp(fx.sense, 0, 1) * 0.9;
      for (i = 0; i < 3; i++) E.ring(g, hx, hy + 5, 11 + i * 7 + (1.2 - fx.sense) * 14, '#f2a825');
      g.globalAlpha = 1;
      PF.fit(g, 'SPIDER-SENSE!', w / 2, 44, w - 20, 14, '#f2a825', 'center', true, '#2b1600');
    }

    if (st === 'play' || st === 'ready' || st === 'over') drawHUD(g);

    if (st === 'ready') {
      var by = Math.round(h * 0.52);
      plate(g, 14, by, w - 28, 66);
      PF.fit(g, '화면을 누르고 있으면', w / 2, by + 8, w - 40, 11, '#eaf6ff', 'center', true);
      PF.fit(g, '거미줄이 나갑니다', w / 2, by + 22, w - 40, 11, '#eaf6ff', 'center', true);
      PF.fit(g, '진 그레이 · 더 핸드 · 스콜피온을 피하세요', w / 2, by + 38, w - 36, 9, '#ffb0a8', 'center', false);
      PF.fit(g, '눌러서 시작', w / 2, by + 48, w - 40, 9, '#9dc3da', 'center', false);
    }

    if (st === 'over') {
      g.globalAlpha = Math.min(0.72, overT * 2);
      g.fillStyle = '#06131f'; g.fillRect(0, 0, w, h);
      g.globalAlpha = 1;
      var oy = Math.round(h * 0.36);
      plate(g, 18, oy, w - 36, 84, '#e0362f');
      
      PF.fit(g, deadBy ? (deadBy + '에게 당했다') : '거미줄이 끊겼다', w / 2, oy + 8, w - 40, 11, '#ffd6d4', 'center', false);
      PF.draw(g, dist() + ' m', w / 2, oy + 28, 22, '#ffffff', 'center', false);
      PF.draw(g, '최고 ' + best + ' m', w / 2, oy + 60, 11, '#9dc3da', 'center', false);
      
    }

    if (fx.flash > 0) {
      fx.flash -= dt * 2.2;
      g.globalAlpha = E.clamp(fx.flash, 0, 1);
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      g.globalAlpha = 1;
    }
  }

  /* ---------- 입력 ---------- */
  function down(e) {
    if (e.target && e.target.closest && e.target.closest('.ui-layer')) return;
    if (st === 'ready') { st = 'play'; holding = true; shoot(); return; }
    if (st !== 'play') return;
    holding = true; shoot();
  }
  function up() {
    if (!holding) return;
    holding = false;
    if (st === 'play') release();
  }

  function bind() {
    if (bound) return;
    bound = true;
    var c = STAGE.canvas;
    c.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('keydown', function (e) {
      if (e.code === 'Space') { e.preventDefault(); if (!holding) down({ target: null }); }
    });
    window.addEventListener('keyup', function (e) { if (e.code === 'Space') up(); });
  }

  return {
    start: function (onClear, onOver) {
      cbClear = onClear; cbOver = onOver;
      reset(); bind();
      st = 'ready';
      STAGE.setMode(step);
      STAGE.start();
    },
    retry: function () { reset(); st = 'ready'; },
    skipToRescue: function () { if (st === 'play' || st === 'ready' || st === 'over') { p.mode = 'free'; startRescue(); } },
    dist: dist,
    best: function () { return best; },
    goal: GOAL_M,
    state: function () { return st; }
  };
})();
