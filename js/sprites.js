/* ============================================================
   sprites.js — 픽셀 아트 (전부 코드 생성, 외부 이미지 0개)
   스파이디 트래커 레퍼런스 톤: 각진 큰 흰 눈 / 붉은 수트 / 파란 팔·다리
   ============================================================ */
var SPR = (function () {
  'use strict';

  var K = {
    r: '#e0362f', R: '#96201c', l: '#ff6a5e',      /* 수트 레드 */
    b: '#2649b8', B: '#16307d',                     /* 수트 블루 */
    w: '#ffffff', k: '#0a121b',                     /* 눈 / 검정 */
    g: '#e0553a', G: '#8f2f1c',                     /* MJ 머리 */
    t: '#3fae6a', T: '#256b43',                     /* MJ 상의 */
    S: '#f2c19c',                                   /* 피부 */
    j: '#2f4f86', J: '#1f3557',                     /* 청바지 */
    n: '#232833',                                   /* 신발 */
    y: '#ffc043', o: '#d9963f', p: '#c0392b',       /* 피자 */
    d: '#0a1c2a',                                   /* 실루엣 */
    c: '#2aa8d8'                                    /* UI 시안 */
  };
  var OUT = '#08121b';

  function B(w, h, rows, key, outline) {
    return E.build(w, h, rows, key || K, outline === undefined ? OUT : outline);
  }
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* ══════════════ 스파이디 : 정면 (15 x 22) ══════════════ */
  var HEAD = [
    '....rrrrrrr',
    '...rrrrrrrrr',
    '..rrrrrrrrrrr',
    '..rkkkrrrkkkr',
    '..rkwkrrrkwkr',
    '..rkwkrrrkwkr',
    '..rkkkrrrkkkr',
    '..rrrrrrrrrrr',
    '...rrrrrrrrr',
    '.....rrrrr'
  ];
  var TORSO = [
    '...rrrrrrrrr',
    '..brrrrrrrrrb',
    '..brrrrkrrrrb',
    '..brrrrrrrrrb',
    '..brrrrrrrrrb',
    '..bb.rrrrr.bb'
  ];
  var LEGS = [
    ['.....bbbbb', '.....bb.bb', '.....bb.bb', '....rrr.rrr', '....rrr.rrr', ''],
    ['.....bbbbb', '....bbb.bb', '...bb....bbb', '..rrr.....rrr', '..rrr......rr', ''],
    ['.....bbbbb', '.....bb.bb', '.....bb.bb', '....rrr.rrr', '....rrr.rrr', ''],
    ['.....bbbbb', '....bb.bbb', '...bbb....bb', '..rrr.....rrr', '...rr.....rrr', '']
  ];
  var walk = LEGS.map(function (lg) { return B(15, 22, HEAD.concat(TORSO, lg)); });
  var stand = walk[0];

  /* ══════════════ 스윙 (손이 맨 위 = 회전 피벗) 18 x 24 ══════════════ */
  var swing = B(20, 27, [
    '.....rr',
    '.....rr',
    '.....rrr',
    '......rrr',
    '......brr',
    '......brrr',
    '....rrrrrrrr',
    '...rrrrrrrrrr',
    '..rrrrrrrrrrrr',
    '..rkkkkrrkkkkr',
    '..rkwwkrrkwwkr',
    '..rkwwkrrkwwkr',
    '..rkkkkrrkkkkr',
    '..rrrrrrrrrrrr',
    '...rrrrrrrrrr',
    '.....rrrrrr',
    '..brrrrrrrrrrb',
    '..brrrrkkrrrrb',
    '..brrrrrrrrrrb',
    '..brrrrrrrrrrb',
    '...bbbbbbbbbb',
    '...bbbb..bbbb',
    '..bbb......bbb',
    '.bbb.........bb',
    'rrr...........bbb',
    '................rrr'
  ]);
  var SWING_PIVOT = { x: 7, y: 2 };

  /* ══════════════ 다이브 (오른쪽) 24 x 12 ══════════════ */
  var dive = B(28, 15, [
    '.....................rrrr',
    '..................rrrrrrrrr',
    '..bb...........rrrrrrrrrrrr',
    '...bbb........rrrkkkkrrkkkkr',
    '....bbbb.....rrrrkwwkrrkwwkr',
    '.....bbbbb...rrrrkwwkrrkwwkr',
    '......bbbbbbrrrrrkkkkrrkkkkr',
    '...bbbbbbbbrrrrrrrrrrrrrrrr',
    '..bbb....rrrrrkkrrrrrrrrrr',
    '.rrr......rrrrrrrrrrrrrr',
    'rrr........rrrrrrrrrr',
    '............rrrrrr',
    '.............rrr'
  ]);

  /* ══════════════ 착지 3점 포즈 20 x 19 ══════════════ */
  var land = B(24, 22, [
    '........rrrrrrrr',
    '.......rrrrrrrrrr',
    '......rrrrrrrrrrrr',
    '......rkkkkrrkkkkr',
    '......rkwwkrrkwwkr',
    '......rkwwkrrkwwkr',
    '......rkkkkrrkkkkr',
    '......rrrrrrrrrrrr',
    '.......rrrrrrrrrr',
    '...brrrrrrrrrrrrrb',
    '..brrrrrrkkrrrrrrrb',
    '..b.rrrrrrrrrrrrr.b',
    '..b..bbbbbbbbbb..b',
    '..b..bbbbbbbbbb..b',
    '.....bbb....bbbb',
    '....bbbb.....bbbb',
    '...rrrr........bbbb',
    '..rrrr..........rrrr',
    '.rrr.............rrrr',
    '..................rr'
  ]);

  /* ══════════════ 옥상에 앉은 몸통 (머리 별도) 24 x 18 ══════════════ */
  var sitBody = B(24, 18, [
    '.....rrrrrrrr',
    '....rrrrrrrrrr',
    '...brrrrrrrrrrb',
    '..brrrrkrrrrrrb',
    '..brrrrrrrrrrrb',
    '..brrrrrrrrrrb',
    '..bb..bbbbbbbb',
    '..bb..bbbbbbbbbb',
    '..b...bbbbbbbbbbb',
    '......bbbbbbbbbbbb',
    '.................bb',
    '..............bb.bb',
    '..............bb.bb',
    '..............bb.bb',
    '..............bb.bb',
    '.............rrr.rrr',
    '.............rrr.rrr'
  ]);

  /* ══════════════ MJ ══════════════ */
  var mjFall = B(14, 19, [
    '....gggg',
    '...gggggg',
    '..gggggggg',
    '..ggSSSSgg',
    '..ggSkSkgg',
    '..ggSSSSgg',
    '...gSSSSg',
    '....SSS',
    '...ttttt',
    'S.ttttttt.S',
    'St.ttttt.tS',
    '.tt.ttttt.tt',
    '....ttttt',
    '....jjjjj',
    '...jj...jj',
    '..jj.....jj',
    '.jj.......jj',
    'nnn.......nnn'
  ]);

  var mjCarry = B(25, 8, [
    '..gggg',
    '.gggggg......ttttt',
    'ggggSSSg...tttttttt',
    'gggSSSSg..ttttttttt.jjjjj',
    '.ggSSSSS.tttttttt.jjjjjjjj',
    '..gSSS..tttttt...jjjjj..jjj',
    '.........SS.........jj...nn',
    '..........S..............nn'
  ]);

  var mjSitBody = B(22, 18, [
    '.....ttttttt',
    '....ttttttttt',
    '...tttttttttt',
    '..tt.ttttttt.tt',
    '..tt.ttttttt.tt',
    '..tt.ttttttt..SS',
    '..SS..jjjjj...SS',
    '..S...jjjjj....S',
    '......jjjjjjjj',
    '......jjjjjjjjjj',
    '......jjjjjjjjjjj',
    '.............jj.jj',
    '.............jj.jj',
    '.............jj.jj',
    '.............jj.jj',
    '............nnn.nnn',
    '............nnn.nnn'
  ]);

  /* ══════════════ 소품 ══════════════ */
  var pizza = B(7, 6, ['ooooooo', 'oyyyyyo', '.yypyy.', '.yyyyy.', '..ypy..', '...y...']);
  var waterTower = B(11, 13, [
    '....ddd', '...ddddd', '..ddddddd', '..ddddddd', '..ddddddd', '..ddddddd',
    '..ddddddd', '...ddddd', '...d...d', '...d...d', '..d.....d', '..d.....d', '.d.......d'
  ], K, false);
  var glider = B(23, 8, [
    '........ddd', '.......ddddd', '......ddddddd',
    'dd...ddddddddd...dd', 'ddddddddddddddddddddd',
    '.ddddddddddddddddddd', '..dd...........dd'
  ], K, false);
  var pigeon = B(7, 5, ['..ddd', '.ddddd', 'ddddddd', '..ddd', '..d.d'], K, false);

  /* ══════════════ UI 아이콘 (DOM 버튼에 캔버스로 삽입 · 이모지 없음) ══════════════ */
  function icon(w, h, rows, col) {
    return E.build(w, h, rows, { k: col || '#0a121b', w: '#ffffff', r: '#e0362f', c: '#2aa8d8' }, false);
  }

  var SPIDER_ROWS = [
    '.k...........k.',
    '..k.........k..',
    '..kk.......kk..',
    '...kk..k..kk...',
    '....kkkkkkk....',
    '...kkkkkkkkk...',
    '..kkkkkkkkkkk..',
    '...kkkkkkkkk...',
    '....kkkkkkk....',
    '...kk..k..kk...',
    '..kk.......kk..',
    '..k.........k..',
    '.k...........k.'
  ];
  function spiderGlyph(col) { return icon(15, 13, SPIDER_ROWS, col); }

  /* 버튼용 굵은 검은 거미 (24x24) */
  var bigSpiderRows = [
    '..k..........k..',
    '..kk........kk..',
    '...kk......kk...',
    '.k..kk....kk..k.',
    '.kk..kk..kk..kk.',
    '..kk..kkkk..kk..',
    '...kk.kkkk.kk...',
    'k...kkkkkkkk...k',
    'kk..kkkkkkkk..kk',
    '.kk.kkkkkkkk.kk.',
    '..kkkkkkkkkkkk..',
    '...kkkkkkkkkk...',
    '..kkkkkkkkkkkk..',
    '.kk.kkkkkkkk.kk.',
    'kk..kkkkkkkk..kk',
    'k...kk.kk.kk...k',
    '...kk..kk..kk...',
    '..kk...kk...kk..',
    '..k....kk....k..'
  ];
  function bigSpider() { return icon(16, 19, bigSpiderRows, '#0a121b'); }

  var maskEyes = icon(20, 14, [
    '..kkkkkkkkkkkkkkkk..','.kkkkkkkkkkkkkkkkkk.','kkkkkkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkkkkkk',
    'kk.wwww......wwww.kk','kk.wwwww....wwwww.kk','kk..wwww....wwww..kk','kk...www....www...kk',
    'kk....ww....ww....kk','kk.....w....w.....kk','kkkkkkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkkkkkk',
    '.kkkkkkkkkkkkkkkkkk.','..kkkkkkkkkkkkkkkk..'
  ]);
  var soundOn = icon(15, 12, [
    '.....kk','....kkk','...kkkk..k..k','..kkkkk...k..k','kkkkkkk.k..k..','kkkkkkk.k..k..',
    'kkkkkkk.k..k..','kkkkkkk.k..k..','..kkkkk...k..k','...kkkk..k..k','....kkk','.....kk'
  ]);
  var soundOff = icon(15, 12, [
    '.....kk','....kkk','...kkkk','..kkkkk..k...k','kkkkkkk...k.k.','kkkkkkk....k..',
    'kkkkkkk....k..','kkkkkkk...k.k.','..kkkkk..k...k','...kkkk','....kkk','.....kk'
  ]);
  var chatIcon = icon(15, 13, [
    'kkkkkkkkkkkkkkk','k.............k','k.kkk.kkk.kkk.k','k.............k','k.kkkkkkkkkkk.k',
    'k.............k','k.kkkkkkk.....k','k.............k','kkkkkkkkkkkkkkk','..kkk','..kkk','.kkk','kk'
  ]);
  var starIcon = icon(11, 11, [
    '.....w','....www','....www','wwwwwwwwwww','.wwwwwwwww','..wwwwwww','...wwwww','..wwwwwww',
    '..ww...ww','.ww.....ww','w.........w'
  ]);
  var playIcon = icon(9, 11, ['kk','kkk','kkkk','kkkkk','kkkkkk','kkkkkkk','kkkkkk','kkkkk','kkkk','kkk','kk']);

  /* 버튼용 거미 (첨부 이미지 형태) */
  function btnSpiderArt() {
    var s2 = E.surf(20, 20), g = s2.x, K2 = '#0a121b';
    E.line(g, 2, 3, 6, 8, K2, 2); E.line(g, 18, 3, 14, 8, K2, 2);
    E.line(g, 0, 8, 6, 9, K2, 2); E.line(g, 20, 8, 14, 9, K2, 2);
    E.line(g, 0, 13, 6, 11, K2, 2); E.line(g, 20, 13, 14, 11, K2, 2);
    E.line(g, 2, 18, 7, 13, K2, 2); E.line(g, 18, 18, 13, 13, K2, 2);
    E.circle(g, 10, 7, 3, K2);
    E.circle(g, 10, 12, 5, K2);
    return s2.c;
  }

  /* 서 있는 몸통 (머리 별도 합성) */
  var standBody = B(16, 15, [
    '...rrrrrrrrr','..brrrrrrrrrb','..brrrrkrrrrb','..brrrrrrrrrb','..brrrrrrrrrb',
    '..bb.rrrrr.bb','.....bbbbb','.....bb.bb','.....bb.bb','.....bb.bb',
    '....rrr.rrr','....rrr.rrr'
  ]);
  var mjStandBody = B(15, 15, [
    '...ttttttt','..tttttttttt','.Stttttttttt S','.Sttttttttt.S','..tttttttt',
    '...jjjjjj','...jjjjjj','...jj..jj','...jj..jj','...jj..jj',
    '..nnn..nnn','..nnn..nnn'
  ]);

  /* ══════════════ 빌런 ══════════════ */
  var FK = {
    f: '#ff7a1a', F: '#ffd24a', h: '#e0553a', H: '#8f2f1c',
    r: '#c0261f', R: '#7d1512', k: '#0a121b', w: '#ffffff',
    g: '#3f9e4a', G: '#22662c', y: '#c8e04a', S: '#f2c19c'
  };
  var jean = E.build(16, 20, [
    '......FF','....FFffFF','..FfffhhfffF','.Ffhhhhhhhhf','FfhhhhhhhhhhF',
    '.fhhSSSShhf','..fhSkSkShf','..fhSSSSShf','...fhSSShf','....frrrf',
    '..Ffrrrrrf F','.FfrrrrrrrfF','Ff.rrrrrrr.fF','F...rrrrr...F','....rr.rr',
    '...ff...ff','..Ff.....fF','.FF.......FF','F...........F'
  ], FK, '#3a0d06');
  var hand = E.build(14, 19, [
    '...kkkkkk','..kkkkkkkk','..krrrrrrk','..kwwkkwwk','..krrrrrrk','...kkkkkk',
    '....rrrr','..kkrrrrkk','.krrrrrrrrk','.krrrrrrrrk','.k.rrrrrr.k','...rrrrrr',
    '...kk..kk','...kk..kk','...kk..kk','..kkk..kkk','..kkk..kkk'
  ], FK, '#0a121b');
  var scorp = E.build(24, 18, [
    '................gg','..............gggGg','.............gg...gg','............gg.....g',
    '...gggggg..gg','..ggggggggg','..gwwkkwwg.g','..gggggggg','.ggggggggg','gggggyggggg',
    'gggggggggg','gg.gggggg.gg','gg..gggg..gg','.g..gg.gg..g','....gg..gg','...ggg..ggg','...GGG..GGG'
  ], FK, '#0a121b');
  var FOE = [
    { spr: jean, name: '진 그레이', w: 16, h: 20 },
    { spr: hand, name: '더 핸드', w: 14, h: 19 },
    { spr: scorp, name: '스콜피온', w: 24, h: 18 }
  ];

  /* ============================================================
     흉상(BUST) — 수트업 씬
     ============================================================ */
  var BUST_W = 48, BUST_H = 58;
  var HEAD_X = 11, HEAD_Y = 3, HEAD_W = 26, HEAD_H = 34;
  var CHIN = HEAD_Y + HEAD_H;
  var FACE_W = HEAD_W, FACE_H = HEAD_H;
  var SMALL_W = 10, SMALL_H = 14;

  function roundHead(g, x, y, w, h, col) {
    g.fillStyle = col;
    g.fillRect(x + 4, y, w - 8, h);
    g.fillRect(x + 2, y + 2, w - 4, h - 5);
    g.fillRect(x, y + 5, w, h - 13);
    g.fillRect(x + 1, y + h - 9, w - 2, 4);
    g.fillRect(x + 3, y + h - 5, w - 6, 3);
    g.fillRect(x + 6, y + h - 2, w - 12, 2);
  }
  function headMask(w, h, x, y, hw, hh) {
    var m = E.surf(w, h);
    roundHead(m.x, x, y, hw, hh, '#ffffff');
    return m.c;
  }

  function bustBase(face) {
    var s = E.surf(BUST_W, BUST_H), g = s.x;
    var skin = (face && face.__skin) || '#d69870';

    g.fillStyle = K.r; g.fillRect(3, 41, 42, 17);
    g.fillStyle = K.r; g.fillRect(6, 39, 36, 4);
    g.fillStyle = K.b; g.fillRect(3, 49, 9, 9);
    g.fillStyle = K.b; g.fillRect(36, 49, 9, 9);
    g.fillStyle = K.k; g.fillRect(21, 46, 6, 5);
    g.fillRect(19, 48, 10, 1); g.fillRect(23, 44, 2, 9);

    g.fillStyle = skin; g.fillRect(20, 34, 8, 8);
    roundHead(g, HEAD_X, HEAD_Y, HEAD_W, HEAD_H, skin);

    var IX = HEAD_X, IY = HEAD_Y;
    var fl = E.surf(BUST_W, BUST_H);
    fl.x.imageSmoothingEnabled = false;
    fl.x.drawImage(face, IX, IY, FACE_W, FACE_H);
    fl.x.globalCompositeOperation = 'destination-in';
    fl.x.drawImage(headMask(BUST_W, BUST_H, IX, IY, FACE_W, FACE_H), 0, 0);
    g.drawImage(fl.c, 0, 0);

    return E.addOutline(s.c, OUT);
  }

  function bustMask() {
    var s = E.surf(BUST_W, BUST_H), g = s.x;
    roundHead(g, HEAD_X - 1, HEAD_Y - 1, HEAD_W + 2, HEAD_H + 4, K.r);

    var cx = 24, cy = HEAD_Y, i, t;
    for (i = 0; i < 7; i++) {
      var a = -Math.PI / 2 + (i - 3) * 0.40;
      E.line(g, cx, cy + 1, cx + Math.cos(a) * 40, cy + 1 - Math.sin(a) * 40 + 44, K.R, 1);
    }
    for (i = 1; i <= 4; i++) {
      var rr = i * 8;
      for (t = -1.15; t <= 1.15; t += 0.06) {
        var px = cx + Math.sin(t) * rr, py = cy + Math.cos(t) * rr * 1.05;
        if (px > HEAD_X - 1 && px < HEAD_X + HEAD_W + 1 && py < CHIN + 2) g.fillRect(px | 0, py | 0, 1, 1);
      }
    }
    var keep = E.surf(BUST_W, BUST_H);
    roundHead(keep.x, HEAD_X - 1, HEAD_Y - 1, HEAD_W + 2, HEAD_H + 4, '#fff');
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(keep.c, 0, 0);
    g.globalCompositeOperation = 'source-over';

    /* 각진 큰 눈 — 스프라이트 눈 모양과 통일 */
    function eye(x0, flip) {
      var rows = [[0, 0, 9], [0, 1, 10], [1, 2, 10], [1, 3, 9], [2, 4, 8], [3, 5, 6], [4, 6, 4], [5, 7, 2]];
      var i2, rr2, x;
      g.fillStyle = K.k;
      for (i2 = 0; i2 < rows.length; i2++) {
        rr2 = rows[i2]; x = flip ? (10 - rr2[0] - rr2[2]) : rr2[0];
        g.fillRect(x0 + x - 1, 13 + rr2[1] - 1, rr2[2] + 2, 3);
      }
      g.fillStyle = K.w;
      for (i2 = 0; i2 < rows.length; i2++) {
        rr2 = rows[i2]; x = flip ? (10 - rr2[0] - rr2[2]) : rr2[0];
        g.fillRect(x0 + x, 13 + rr2[1], rr2[2], 1);
      }
    }
    eye(12, false);
    eye(26, true);

    return E.addOutline(s.c, OUT);
  }

  function headRolled(faceSmall, rollY) {
    var W = 14, H = 17, s = E.surf(W, H), g = s.x;
    var skin = (faceSmall && faceSmall.__skin) || '#d69870';
    g.fillStyle = skin;
    g.fillRect(2, 0, 10, H - 1);
    g.fillRect(1, 2, 12, H - 4);
    g.save(); g.beginPath(); g.rect(1, 0, 12, H - 1); g.clip();
    g.imageSmoothingEnabled = false;
    g.drawImage(faceSmall, 1, 0, 12, 16);
    g.restore();

    var mb = rollY === undefined ? 10 : rollY;
    g.save(); g.beginPath(); g.rect(0, 0, W, mb); g.clip();
    g.fillStyle = K.r; g.fillRect(2, 0, 10, H); g.fillRect(1, 1, 12, H);
    E.line(g, 7, 0, 1, 12, K.R, 1); E.line(g, 7, 0, 13, 12, K.R, 1);
    E.line(g, 7, 0, 4, 13, K.R, 1); E.line(g, 7, 0, 10, 13, K.R, 1);
    g.fillStyle = K.k; g.fillRect(1, 4, 5, 4); g.fillRect(8, 4, 5, 4);
    g.fillStyle = K.w; g.fillRect(2, 5, 3, 2); g.fillRect(9, 5, 3, 2);
    g.restore();
    if (mb > 0 && mb < H) { g.fillStyle = K.R; g.fillRect(1, mb - 1, 12, 1); }
    return E.addOutline(s.c, OUT);
  }

  function mjHead(faceSmall) {
    var W = 14, H = 17, s = E.surf(W, H), g = s.x;
    var skin = (faceSmall && faceSmall.__skin) || '#d69870';
    g.fillStyle = skin;
    g.fillRect(2, 0, 10, H - 1);
    g.fillRect(1, 2, 12, H - 4);
    g.save(); g.beginPath(); g.rect(1, 0, 12, H - 1); g.clip();
    g.imageSmoothingEnabled = false;
    g.drawImage(faceSmall, 1, 0, 12, 16);
    g.restore();
    return E.addOutline(s.c, OUT);
  }

  function sprPivot(ctx, img, x, y, ang, px, py, flip) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(ang);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, -px, -py);
    ctx.restore();
  }

  return {
    K: K, OUT: OUT, shade: shade,
    walk: walk, stand: stand, swing: swing, dive: dive, land: land, sitBody: sitBody,
    swingPivot: SWING_PIVOT,
    mjFall: mjFall, mjCarry: mjCarry, mjSitBody: mjSitBody,
    standBody: standBody, mjStandBody: mjStandBody,
    pizza: pizza, waterTower: waterTower, glider: glider, pigeon: pigeon,
    FOE: FOE, jean: jean, hand: hand, scorp: scorp,
    spiderGlyph: spiderGlyph, bigSpider: bigSpider, btnSpiderArt: btnSpiderArt, maskEyes: maskEyes, soundOn: soundOn, soundOff: soundOff,
    chatIcon: chatIcon, starIcon: starIcon, playIcon: playIcon,
    bustBase: bustBase, bustMask: bustMask, headRolled: headRolled, mjHead: mjHead,
    BUST_W: BUST_W, BUST_H: BUST_H, CHIN: CHIN,
    FACE_W: FACE_W, FACE_H: FACE_H, SMALL_W: SMALL_W, SMALL_H: SMALL_H,
    sprPivot: sprPivot
  };
})();
