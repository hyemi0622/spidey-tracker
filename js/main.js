/* ============================================================
   main.js — UI 배선 / 아이콘 주입 / 흐름 제어 / 내보내기
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── 카톡/인앱 브라우저 글씨 확대 방어 ── */
  function lockTextSize() {
    var de = document.documentElement;
    de.style.webkitTextSizeAdjust = '100%';
    de.style.textSizeAdjust = '100%';
  }
  lockTextSize();
  document.addEventListener('visibilitychange', lockTextSize);
  window.addEventListener('pageshow', lockTextSize);
  var lastTouch = 0;
  document.addEventListener('touchend', function (e) {
    var now = Date.now();
    if (now - lastTouch < 320) e.preventDefault();
    lastTouch = now;
  }, { passive: false });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

  /* ── toast ── */
  var toastEl = $('#toast'), toastT = 0;
  function toast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 1900);
  }

  /* ══════════════ 아이콘 주입 (이모지 없음) ══════════════ */
  function iconEl(src, scale) {
    var c = document.createElement('canvas');
    c.width = src.width * scale * 2;
    c.height = src.height * scale * 2;
    var x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(src, 0, 0, c.width, c.height);
    c.style.width = (src.width * scale) + 'px';
    c.style.height = (src.height * scale) + 'px';
    c.style.display = 'block';
    return c;
  }
  function setIcon(el, src, scale) {
    var old = el.querySelector('canvas');
    if (old) old.remove();
    el.insertBefore(iconEl(src, scale), el.firstChild);
  }
  function spLogo() {
    var s = E.surf(19, 19);
    E.circle(s.x, 9, 9, 9, '#e0362f');
    E.ring(s.x, 9, 9, 9, '#7d1c18');
    s.x.drawImage(SPR.spiderGlyph('#0a121b'), 2, 3);
    return s.c;
  }

  /* 인트로용 붉은 거미 (흰 눈) */
  function introSpiderArt() {
    var s = E.surf(19, 19), g = s.x;
    /* 다리 */
    g.fillStyle = '#e0362f';
    [[2,3],[4,2],[14,2],[16,3]].forEach(function (p) { g.fillRect(p[0], p[1], 2, 4); });
    E.line(g, 3, 5, 6, 9, '#e0362f', 2); E.line(g, 15, 5, 12, 9, '#e0362f', 2);
    E.line(g, 2, 14, 6, 11, '#e0362f', 2); E.line(g, 16, 14, 12, 11, '#e0362f', 2);
    /* 몸통 */
    E.circle(g, 9, 7, 5, '#e0362f');
    E.circle(g, 9, 13, 5, '#e0362f');
    g.fillStyle = '#96201c'; g.fillRect(4, 9, 11, 1);
    /* 흰 눈 */
    g.fillStyle = '#ffffff';
    g.fillRect(5, 11, 4, 4); g.fillRect(10, 11, 4, 4);
    g.fillStyle = '#0a121b';
    g.fillRect(5, 10, 4, 1); g.fillRect(10, 10, 4, 1);
    return s.c;
  }

  /* 스프라이트 시트를 캔버스로 프레임 단위 재생 */
  function sheetAnim(el, src, N, fps, dispH) {
    if (!el) return;
    var im = new Image();
    im.onload = function () {
      var fw = im.naturalWidth / N, fh = im.naturalHeight;
      var s = dispH / fh, w = Math.round(fw * s), h = Math.round(dispH);
      var c = document.createElement('canvas');
      c.width = w * 2; c.height = h * 2;
      c.style.width = w + 'px'; c.style.height = h + 'px'; c.style.display = 'block';
      var x = c.getContext('2d'); x.imageSmoothingEnabled = false;
      el.innerHTML = ''; el.appendChild(c);
      el.style.width = w + 'px'; el.style.height = h + 'px';
      el.style.backgroundImage = 'none'; el.style.animation = 'none';
      var k = 0;
      setInterval(function () {
        x.clearRect(0, 0, c.width, c.height);
        x.drawImage(im, Math.round(k * fw), 0, Math.round(fw), fh, 0, 0, c.width, c.height);
        k = (k + 1) % N;
      }, 1000 / fps);
    };
    im.src = src;
  }

  /* 이미지를 니어리스트로 확대해 캔버스로 넣어 선명하게 */
  function crispBG(el, src, w, h) {
    if (!el) return;
    var im = new Image();
    im.onload = function () {
      var cv = document.createElement('canvas');
      cv.width = w * 3; cv.height = h * 3;
      var x = cv.getContext('2d');
      x.imageSmoothingEnabled = false;
      x.drawImage(im, 0, 0, cv.width, cv.height);
      cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.style.display = 'block';
      el.style.backgroundImage = 'none';
      el.innerHTML = '';
      el.appendChild(cv);
    };
    im.src = src;
  }

  function buildIcons() {
    setIcon($('#btnSpider'), SPR.btnSpiderArt(), 1.3);
    updateSound();
    crispBG($('#chipSight'), 'assets/ui/map/filters/filter_green.png', 44, 37);
    crispBG($('#chipPin'), 'assets/ui/map/filters/filter_red.png', 44, 37);
    sheetAnim($('#btnMenu'), 'assets/ui/menu/spidey_head_spritesheet.png', 46, 11, 44);
    sheetAnim($('#mascot'), 'assets/img/SpiderMan_HeadTurn.png', 76, 12, 80);
    var isp = $('#introSpider');
    if (isp) {
      var sc = document.createElement('canvas');
      sc.width = 154; sc.height = 248;
      sc.style.width = '70px'; sc.style.height = '70px';
      var sx2 = sc.getContext('2d'); sx2.imageSmoothingEnabled = false;
      var wi = new Image();
      wi.onload = function () {
        var fw = wi.naturalWidth / 82;
        sc.height = Math.round(248 * wi.naturalHeight / fw);
        sc.style.height = Math.round(70 * wi.naturalHeight / fw) + 'px';
        sx2.imageSmoothingEnabled = false;
        sx2.drawImage(wi, 0, 0, fw, wi.naturalHeight, 0, 0, sc.width, sc.height);
      };
      wi.src = 'assets/img/SpiderMan_web.png';
      isp.innerHTML = ''; isp.appendChild(sc);
    }
    var mk = $('#introMark');
    if (mk) {
      var mx2 = mk.getContext('2d');
      mx2.imageSmoothingEnabled = false;
      mx2.drawImage(SPR.spiderGlyph('#dff3ff'), 0, 0, 120, 104);
    }
  }
  function updateSound() {
    var el = $('#btnSound');
    if (!el) return;
    var old = el.querySelector('canvas');
    if (old) old.remove();
    el.classList.toggle('on', !!SFX.enabled);
    var src = SFX.enabled ? SPR.soundOn : SPR.soundOff;
    var cv = document.createElement('canvas');
    cv.width = src.width * 4; cv.height = src.height * 4;
    var x = cv.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(src, 0, 0, cv.width, cv.height);
    cv.style.width = '26px'; cv.style.height = '21px';
    cv.style.display = 'block'; cv.style.position = 'relative'; cv.style.zIndex = '2';
    el.appendChild(cv);
  }

  /* ══════════════ 사진 슬롯 ══════════════ */
  var slots = {};
  function initSlot(el) {
    var who = el.dataset.who;
    var st = { img: null, zoom: 1.5, ox: 0, oy: 0, rot: 0, fallback: who };
    slots[who] = st;

    var cropEl = $('[data-role=crop]', el);
    var cropC = $('[data-role=cropc]', el);
    var cropX = cropC.getContext('2d');
    var zoom = $('[data-role=zoom]', el);
    var file = $('[data-role=file]', el);
    var pv = $('[data-pv="' + who + '"]');
    var pvX = pv.getContext('2d');

    function render() {
      FACE.preview(st, cropX, cropC.width, cropC.height);
      var face = FACE.character(st, SPR.FACE_W, SPR.FACE_H);
      var bust = SPR.bustBase(face);
      pvX.imageSmoothingEnabled = false;
      pvX.clearRect(0, 0, pv.width, pv.height);
      pvX.drawImage(bust, 0, 1);
    }
    st.render = render;
    render();

    cropEl.addEventListener('click', function () {
      if (st.dragged) { st.dragged = false; return; }
      file.click();
    });
    file.addEventListener('change', function () {
      if (!file.files || !file.files[0]) return;
      FACE.load(file.files[0], function (im) {
        if (!im) { toast('사진을 읽을 수 없어요'); return; }
        st.img = im; st.ox = 0; st.oy = 0;
        cropEl.classList.add('has');
        render(); SFX.blip();
      });
    });

    var dragging = false, sx = 0, sy = 0, ox0 = 0, oy0 = 0;
    cropEl.addEventListener('pointerdown', function (e) {
      if (!st.img) return;
      dragging = true; st.dragged = false;
      sx = e.clientX; sy = e.clientY; ox0 = st.ox; oy0 = st.oy;
      cropEl.setPointerCapture(e.pointerId);
    });
    cropEl.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var r = cropEl.getBoundingClientRect();
      if (Math.abs(e.clientX - sx) > 3 || Math.abs(e.clientY - sy) > 3) st.dragged = true;
      st.ox = Math.max(-0.5, Math.min(0.5, ox0 - (e.clientX - sx) / r.width));
      st.oy = Math.max(-0.5, Math.min(0.5, oy0 - (e.clientY - sy) / r.height));
      render();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
      cropEl.addEventListener(t, function () { dragging = false; });
    });
    zoom.addEventListener('input', function () {
      st.zoom = parseInt(zoom.value, 10) / 100;
      render();
    });
    var rotEl = $('[data-role=rot]', el);
    if (rotEl) rotEl.addEventListener('input', function () {
      st.rot = parseInt(rotEl.value, 10);
      render();
    });
  }

  /* ══════════════ 뷰 전환 ══════════════ */
  var stageBottom = $('#stageBottom');
  function setView(v) {
    document.body.dataset.view = v;
    if (v === 'map') { MAP.start(); STAGE.stop(); }
    else { MAP.stop(); setTimeout(function () { STAGE.resize(); }, 20); }
  }
  function setBar(items) {
    stageBottom.innerHTML = '';
    items.forEach(function (it) {
      var b = document.createElement('button');
      b.className = 'abtn' + (it.cls ? ' ' + it.cls : '');
      b.textContent = it.label;
      b.addEventListener('click', function (e) { e.stopPropagation(); SFX.click(); it.act(); });
      stageBottom.appendChild(b);
    });
    /* 버튼바가 가리는 만큼 시네마 구도를 위로 올린다 */
    requestAnimationFrame(function () {
      var scr = $('#screen').getBoundingClientRect().height;
      var bh = items.length ? stageBottom.getBoundingClientRect().height : 0;
      CINEMA.setInset(scr ? Math.round(bh / scr * STAGE.H) : 0);
    });
  }
  function setTop(show) { document.body.dataset.top = show ? 'on' : 'off'; }

  /* ══════════════ 흐름 ══════════════ */
  function startExperience() {
    SFX.unlock();
    CINEMA.setCast(slots.me, slots.mj, $('.slot[data-who=me] [data-role=nm]').value,
      $('.slot[data-who=mj] [data-role=nm]').value);
    $('#idOverlay').hidden = true;
    setView('stage');
    setTimeout(function () {
      STAGE.resize();
      STAGE.startRec();
      setTop(true);
      CINEMA.go('suit', onCinemaDone);
      setBar([{ label: '건너뛰기', cls: 'ghost', act: startGame }]);
    }, 40);
  }

  function onCinemaDone(which) {
    if (which === 'suit') startGame();
    else if (which === 'bugle') { STAGE.stopRec(); setTop(false); setBar(endBar('roof')); }
    else if (which === 'roof') { setTop(false); setBar(endBar('bugle')); }
  }

  function startGame() {
    setTop(true);
    setBar([{ label: '건너뛰기', cls: 'ghost', act: function () { GAME.skipToRescue(); setBar([]); } }]);
    GAME.start(
      function () { CINEMA.go('bugle', onCinemaDone); },
      function (d) {
        setBar([
          { label: '다시하기', cls: 'pri', act: function () { GAME.retry(); setBar([{ label: '건너뛰기', cls: 'ghost', act: function () { GAME.skipToRescue(); setBar([]); } }]); } },
          { label: '결말 보기', act: function () { GAME.skipToRescue(); setBar([]); } },
          { label: '나가기', cls: 'ghost', act: goHome }
        ]);
      }
    );
  }

  function endBar(other) {
    return [
      { label: '사진 저장', cls: 'pri', act: savePNG },
      { label: 'GIF 저장', act: saveGIF },
      { label: other === 'roof' ? '옥상 데이트' : '뷰글 1면', act: function () { setTop(false); CINEMA.go(other, onCinemaDone); } },
      { label: '처음으로', cls: 'ghost', act: goHome }
    ];
  }

  function goHome() {
    STAGE.stopRec(); SFX.bgmStop();
    setBar([]); setView('map');
  }

  /* ══════════════ 저장 ══════════════ */
  function dl(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 400);
  }
  function stamp() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes());
  }
  function isInApp() { return /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line/i.test(navigator.userAgent || ''); }

  function savePNG() {
    STAGE.snapshotPNG(5, CINEMA.paperRect()).toBlob(function (b) {
      dl(b, 'spidey_' + stamp() + '.png');
      toast(isInApp() ? '저장이 안 되면 이미지를 길게 눌러 저장하세요' : '사진을 저장했어요', 2600);
    }, 'image/png');
  }
  function saveGIF() {
    var frames = STAGE.frames();
    if (!frames.length) { toast('저장할 장면이 없어요'); return; }
    var prog = $('#prog'), bar = $('#progBar');
    prog.hidden = false; bar.style.width = '0%';
    GIFENC.encode(frames, {
      width: STAGE.W, height: STAGE.H, delay: STAGE.frameDelay(),
      onProgress: function (p) { bar.style.width = Math.round(p * 100) + '%'; }
    }).then(function (blob) {
      prog.hidden = true;
      dl(blob, 'spidey_' + stamp() + '.gif');
      toast('GIF 저장 (' + Math.round(blob.size / 1024) + 'KB)', 2400);
    });
  }
  function saveWebM() {
    var b = STAGE.recBlob();
    if (!b) { toast('이 브라우저는 영상 저장을 지원하지 않아요. GIF를 이용하세요', 2800); return; }
    dl(b, 'spidey_' + stamp() + '.webm');
    toast('영상을 저장했어요', 1900);
  }

  /* ══════════════ 부팅 ══════════════ */
  window.addEventListener('load', function () {
    $$('.slot').forEach(initSlot);
    buildIcons();

    MAP.init($('#mapCanvas'), openId);
    STAGE.init($('#stageCanvas'));

    GUEST.init({
      panel: $('#gbPanel'), list: $('#gbList'), status: $('#gbStatus'),
      count: $('#gbCount'), name: $('#gbName'), input: $('#gbInput'),
      send: $('#gbSend'), close: $('#gbClose')
    });

    function openId() {
      SFX.unlock();
      $('#idOverlay').hidden = false;
    }

    $('#btnSpider').addEventListener('click', function () {
      this.classList.add('drop');
      var self = this;
      setTimeout(function () { self.classList.remove('drop'); }, 420);
      SFX.blip(); openId();
    });
    $('#mascot').addEventListener('click', openId);
    $('#idClose').addEventListener('click', function () { $('#idOverlay').hidden = true; });
    $('#goBtn').addEventListener('click', startExperience);

    $('#btnMenu').addEventListener('click', function () { SFX.click(); $('#aboutOverlay').hidden = false; });
    $('#aboutClose').addEventListener('click', function () { $('#aboutOverlay').hidden = true; });

    $('#btnSound').addEventListener('click', function () {
      SFX.unlock(); SFX.toggle(); updateSound();
      toast(SFX.enabled ? '소리 켬' : '소리 끔', 900);
    });

    $('#chipSight').addEventListener('click', function () { SFX.unlock(); MAP.ping(); toast('스캔 완료 — 신호 6건'); });
    $('#chipPin').addEventListener('click', function () {
      SFX.unlock();
      if (navigator.share) navigator.share({ title: '스파이디 트래커', url: location.href }).catch(function () { });
      else if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () { toast('링크를 복사했어요'); });
    });

    $('#btnGuest').addEventListener('click', function () { SFX.unlock(); SFX.click(); GUEST.open(); });

    /* ── 인트로 : 거미가 줄을 타고 내려온 뒤 사운드 선택 ── */
    var intro = $('#intro'), dots = $('#introDots'), di = 0;
    for (var k = 0; k < 9; k++) dots.appendChild(document.createElement('i'));
    var dotTimer = setInterval(function () {
      var el = dots.children;
      for (var j = 0; j < el.length; j++) el[j].className = (j === di % el.length) ? 'on' : '';
      di++;
    }, 160);
    setTimeout(function () { intro.classList.add('run'); }, 120);

    /* 좌하단 부트 로그 */
    var BOOT = ['INITIALIZING SPIDEY TRACKER v4.2.0...','BOOTING CORE SERVICES [OK]',
      'INITIALIZING MAP RENDER PIPELINE...','LOADING BASE ASSETS: FRAME UI [OK]',
      'LOADING BASE ASSETS: TICKER MODULE [OK]','STARTING EVENT BUS [OK]',
      'CALIBRATING SPRITESHEET RENDERER [OK]','WARMING IMAGE CACHE...',
      'CHECKING FONT REGISTRY [OK]','VALIDATING ROUTE HANDLERS [OK]',
      'BUILDING API CONNECTION POOL...','AUTHENTICATING SESSION TOKENS [OK]'];
    var bl = $('#bootLog'), bi = 0;
    var bootTimer = setInterval(function () {
      if (bi >= BOOT.length) { clearInterval(bootTimer); return; }
      bl.textContent = BOOT.slice(Math.max(0, bi - 5), bi + 1).join(String.fromCharCode(10));
      bi++;
    }, 260);

    var msgs = ['스파이디 목격담 남기기', '누가 스파이디를 봤나요?', '메시지 센터 열기'];
    var mi = 0, tickTimer = 0;
    function closeIntro(on) {
      SFX.unlock();
      if (SFX.enabled !== on) SFX.toggle();
      updateSound();
      clearInterval(dotTimer);
      intro.hidden = true;
      $('#tickerText').textContent = msgs[0];
      tickTimer = setInterval(function () { $('#tickerText').textContent = msgs[++mi % msgs.length]; }, 4200);
      MAP.ping();
    }
    $('#sndOn').addEventListener('click', function () { closeIntro(true); });
    $('#sndOff').addEventListener('click', function () { closeIntro(false); });

    /* ── 레이더 (원본 Radar.astro 스펙) ── */
    (function () {
      var cv = $('#radarCanvas');
      if (!cv) return;
      var g = cv.getContext('2d'), D = 100, h2 = D / 2, R = D / 2 - 1, f = 0;
      var dots = [];
      for (var i = 0; i < 7; i++) {
        dots.push({ a: Math.random() * Math.PI * 2, r: 8 + Math.random() * (R - 12),
          c: ['#00ff50', '#ff4040', '#ffffff', '#96e0f7'][i % 4] });
      }
      (function tick() {
        g.clearRect(0, 0, D, D);
        var grd = g.createRadialGradient(h2, h2, 0, h2, h2, R);
        grd.addColorStop(0, 'rgba(9,164,199,0)');
        grd.addColorStop(1, 'rgba(9,164,199,0.18)');
        function poly(rr) {
          g.beginPath();
          for (var k = 0; k < 10; k++) {
            var a = -Math.PI / 2 + k * Math.PI / 5;
            var X = h2 + Math.cos(a) * rr, Y = h2 + Math.sin(a) * rr;
            if (k === 0) g.moveTo(X, Y); else g.lineTo(X, Y);
          }
          g.closePath();
        }
        g.fillStyle = grd; poly(R); g.fill();
        g.strokeStyle = '#09a4c7'; g.lineWidth = 1.5;
        [R, R * 0.72, R * 0.46, R * 0.22].forEach(function (rr) { poly(rr); g.stroke(); });
        g.strokeStyle = 'rgba(9,164,199,0.75)';
        for (var k2 = 0; k2 < 10; k2++) {
          var a2 = -Math.PI / 2 + k2 * Math.PI / 5;
          g.beginPath(); g.moveTo(h2, h2);
          g.lineTo(h2 + Math.cos(a2) * R, h2 + Math.sin(a2) * R); g.stroke();
        }
        /* 스윕 웨지 */
        var span = Math.PI / 3;
        var wg = g.createRadialGradient(h2, h2, 0, h2, h2, R);
        wg.addColorStop(0, 'rgba(150,224,247,0.35)');
        wg.addColorStop(1, 'rgba(150,224,247,0)');
        g.fillStyle = wg;
        g.beginPath(); g.moveTo(h2, h2);
        g.arc(h2, h2, R, f - span, f); g.closePath(); g.fill();
        g.strokeStyle = '#96e0f7'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(h2, h2);
        g.lineTo(h2 + Math.cos(f) * R, h2 + Math.sin(f) * R); g.stroke();
        /* 블립 */
        dots.forEach(function (d) {
          var da = ((f - d.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          var al = Math.max(0, 1 - da / (Math.PI * 1.4));
          g.globalAlpha = al;
          g.fillStyle = d.c;
          g.beginPath();
          g.arc(h2 + Math.cos(d.a) * d.r, h2 + Math.sin(d.a) * d.r, 2, 0, Math.PI * 2);
          g.fill();
          g.globalAlpha = 1;
        });
        g.fillStyle = '#96e0f7';
        g.beginPath(); g.arc(h2, h2, 2, 0, Math.PI * 2); g.fill();
        f += 0.018;
        requestAnimationFrame(tick);
      })();
    })();

    window.addEventListener('resize', function () { MAP.resize(); STAGE.resize(); });
  });
})();
