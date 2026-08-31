/* ============================================================
   pixelfont.js — 캔버스 안에서 한글/영문을 "픽셀 비트맵"으로 렌더
   + 폭 맞춤(fit) / 줄바꿈(wrap) : 글자가 절대 밖으로 삐져나오지 않게
   ============================================================ */
var PF = (function () {
  'use strict';

  var mc = document.createElement('canvas');
  var mx = mc.getContext('2d', { willReadFrequently: true });
  var cache = {}, cacheKeys = [], CACHE_MAX = 500;

  /* Galmuri = 오픈소스 한글 픽셀 폰트 (레퍼런스의 PF Videotext 계열 대체) */
  var DEFAULT_STACK = '"Galmuri11","PFV","DungGeunMo","Malgun Gothic",monospace';
  var STACK = DEFAULT_STACK;
  var THRESH = 105;
  var SMOOTH = false;

  function parseColor(c) {
    if (c[0] === '#') {
      var h = c.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    var m = c.match(/(\d+)\D+(\d+)\D+(\d+)/);
    return m ? [+m[1], +m[2], +m[3]] : [255, 255, 255];
  }

  function font(size, bold) { return (bold ? 'bold ' : '') + size + 'px ' + STACK; }

  function bitmap(str, size, color, bold) {
    var key = STACK.charCodeAt(1) + '|' + THRESH + '|' + (SMOOTH ? 's' : 'p') + '|' + size + '|' + (bold ? 1 : 0) + '|' + color + '|' + str;
    if (cache[key]) return cache[key];

    mx.font = font(size, bold);
    mx.textBaseline = 'alphabetic';
    var w = Math.max(1, Math.ceil(mx.measureText(str).width) + 2);
    var h = Math.ceil(size * 1.45) + 2;

    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.font = font(size, bold);
    x.textBaseline = 'alphabetic';
    x.fillStyle = '#fff';
    x.fillText(str, 1, Math.round(size * 1.08));

    var img = x.getImageData(0, 0, w, h), d = img.data, rgb = parseColor(color);
    for (var i = 0; i < d.length; i += 4) {
      if (SMOOTH) {
        if (d[i + 3] > 0) { d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; }
      } else if (d[i + 3] >= THRESH) {
        d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255;
      } else d[i + 3] = 0;
    }
    x.putImageData(img, 0, 0);

    cache[key] = c; cacheKeys.push(key);
    if (cacheKeys.length > CACHE_MAX) delete cache[cacheKeys.shift()];
    return c;
  }

  function width(str, size, bold) {
    mx.font = font(size, bold);
    return Math.ceil(mx.measureText(str).width);
  }
  function lineH(size) { return Math.round(size * 1.25); }

  /* y = 글자 윗변. align: left|center|right */
  function draw(ctx, str, x, y, size, color, align, bold) {
    if (str === '' || str == null) return 0;
    var bm = bitmap(String(str), size, color, bold);
    var dx = x;
    if (align === 'center') dx = x - ((bm.width - 2) >> 1);
    else if (align === 'right') dx = x - (bm.width - 2);
    ctx.drawImage(bm, Math.round(dx), Math.round(y));
    return bm.width - 2;
  }

  function drawS(ctx, str, x, y, size, color, shadow, align, bold) {
    draw(ctx, str, x + 1, y + 1, size, shadow, align, bold);
    return draw(ctx, str, x, y, size, color, align, bold);
  }

  /* ---- maxW 안에 들어갈 때까지 크기를 줄여서 그림 ---- */
  function fit(ctx, str, x, y, maxW, size, color, align, bold, shadow) {
    var s = size;
    while (s > 6 && width(str, s, bold) > maxW) s--;
    if (shadow) return drawS(ctx, str, x, y, s, color, shadow, align, bold);
    return draw(ctx, str, x, y, s, color, align, bold);
  }

  /* ---- maxW 기준 줄바꿈 (한글은 글자 단위, 영문은 단어 우선) ---- */
  function wrap(str, size, bold, maxW) {
    str = String(str);
    var out = [], line = '', i, ch, lastSpace = -1;
    for (i = 0; i < str.length; i++) {
      ch = str[i];
      if (ch === '\n') { out.push(line); line = ''; lastSpace = -1; continue; }
      var next = line + ch;
      if (width(next, size, bold) > maxW && line !== '') {
        /* 라틴 단어 중간이면 마지막 공백에서 자른다 */
        if (lastSpace > 0 && /[A-Za-z0-9]/.test(ch)) {
          out.push(line.slice(0, lastSpace));
          line = line.slice(lastSpace + 1) + ch;
        } else {
          out.push(line); line = ch;
        }
        lastSpace = -1;
      } else {
        line = next;
        if (ch === ' ') lastSpace = line.length - 1;
      }
    }
    if (line) out.push(line);
    return out;
  }

  /* ---- 박스 안에 여러 줄로 그림. 반환: 사용한 높이 ---- */
  function block(ctx, str, x, y, maxW, size, color, align, bold, shadow, maxLines) {
    var lines = wrap(str, size, bold, maxW);
    if (maxLines && lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      lines[maxLines - 1] = lines[maxLines - 1].replace(/.$/, '…');
    }
    var lh = lineH(size);
    for (var i = 0; i < lines.length; i++) {
      if (shadow) drawS(ctx, lines[i], x, y + i * lh, size, color, shadow, align, bold);
      else draw(ctx, lines[i], x, y + i * lh, size, color, align, bold);
    }
    return lines.length * lh;
  }

  function clear() { cache = {}; cacheKeys = []; }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(clear);

  function setStack(s) { STACK = s || DEFAULT_STACK; }
  function setThin(n) { THRESH = n || 105; }
  function setSmooth(b) { SMOOTH = !!b; }

  return {
    setStack: setStack, setThin: setThin, setSmooth: setSmooth,
    draw: draw, drawS: drawS, fit: fit, wrap: wrap, block: block,
    width: width, lineH: lineH, bitmap: bitmap, clear: clear
  };
})();
