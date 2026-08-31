/* ============================================================
   guestbook.js — 스파이디 트래커 메시지 센터를 방명록으로
   Supabase REST(PostgREST) + 폴링. 설정이 없으면 로컬 모드.
   ============================================================ */
var GUEST = (function () {
  'use strict';

  var CFG = window.SPIDEY_CONFIG || {};
  var ON = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
  var LKEY = 'spidey_guestbook_local';
  var els = null, timer = 0, lastTopId = null, busy = false;

  function head(extra) {
    var h = {
      apikey: CFG.SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + CFG.SUPABASE_ANON_KEY
    };
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }
  function url() {
    return CFG.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/' + (CFG.TABLE || 'guestbook');
  }

  function localRead() {
    try { return JSON.parse(localStorage.getItem(LKEY) || '[]'); } catch (e) { return []; }
  }
  function localWrite(list) {
    try { localStorage.setItem(LKEY, JSON.stringify(list.slice(0, 80))); } catch (e) { }
  }

  /* ---------- 읽기 ---------- */
  function fetchList() {
    if (!ON) return Promise.resolve(localRead());
    return fetch(url() + '?select=id,name,message,created_at&order=id.desc&limit=60', { headers: head() })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .catch(function () { return null; });
  }

  /* ---------- 쓰기 ---------- */
  function post(name, message) {
    var row = { name: name, message: message };
    if (!ON) {
      var list = localRead();
      list.unshift({ id: Date.now(), name: name, message: message, created_at: new Date().toISOString() });
      localWrite(list);
      return Promise.resolve(list);
    }
    return fetch(url(), {
      method: 'POST',
      headers: head({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify(row)
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  /* ---------- 렌더 ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function when(iso) {
    var d = new Date(iso), n = new Date();
    var diff = (n - d) / 1000;
    if (diff < 60) return '방금';
    if (diff < 3600) return Math.floor(diff / 60) + '분 전';
    if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
    return (d.getMonth() + 1) + '.' + d.getDate();
  }

  function render(list, animateNew) {
    if (!els) return;
    if (!list) { els.status.textContent = '연결 실패 — 잠시 후 다시'; return; }
    els.status.textContent = ON ? ('기록 ' + list.length + '건') : '로컬 모드 (내 브라우저에만 저장)';
    els.count.textContent = list.length;

    var html = '';
    for (var i = list.length - 1; i >= 0; i--) {
      var m = list[i];
      var isNew = animateNew && lastTopId !== null && m.id > lastTopId;
      html += '<div class="gb-row' + (isNew ? ' gb-new' : '') + '">' +
        '<div class="gb-meta"><span class="gb-name">' + esc(m.name) + '</span>' +
        '<span class="gb-time">' + when(m.created_at) + '</span></div>' +
        '<div class="gb-msg">' + esc(m.message) + '</div></div>';
    }
    els.list.innerHTML = html || '<div class="gb-empty">첫 목격담을 남겨주세요.</div>';
    if (list.length) lastTopId = list[0].id;
    els.list.scrollTop = els.list.scrollHeight;
  }

  function refresh(animate) {
    return fetchList().then(function (l) { render(l, animate); return l; });
  }

  /* ---------- 제출 ---------- */
  function submit() {
    if (busy) return;
    var name = (els.name.value || '').trim();
    var msg = (els.input.value || '').trim();
    if (!name) { els.status.textContent = '이름을 입력해주세요'; els.name.focus(); return; }
    if (!msg) { els.input.focus(); return; }
    if (name.length > 12) name = name.slice(0, 12);
    if (msg.length > 200) msg = msg.slice(0, 200);

    var last = 0;
    try { last = parseInt(localStorage.getItem('spidey_gb_last') || '0', 10); } catch (e) { }
    if (Date.now() - last < 8000) { els.status.textContent = '조금만 천천히…'; return; }

    busy = true;
    els.send.disabled = true;
    els.status.textContent = '전송 중…';
    post(name, msg).then(function () {
      try {
        localStorage.setItem('spidey_gb_last', String(Date.now()));
        localStorage.setItem('spidey_gb_name', name);
      } catch (e) { }
      els.input.value = '';
      SFX.blip();
      return refresh(true);
    }).catch(function () {
      els.status.textContent = '전송 실패 — 설정을 확인해주세요';
    }).then(function () {
      busy = false; els.send.disabled = false;
    });
  }

  /* ---------- 열기/닫기 ---------- */
  function open() {
    els.panel.hidden = false;
    refresh(false);
    clearInterval(timer);
    timer = setInterval(function () { refresh(true); }, CFG.POLL_MS || 6000);
    try {
      var n = localStorage.getItem('spidey_gb_name');
      if (n && !els.name.value) els.name.value = n;
    } catch (e) { }
  }
  function close() {
    els.panel.hidden = true;
    clearInterval(timer); timer = 0;
  }

  function init(refs) {
    els = refs;
    els.send.addEventListener('click', submit);
    els.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    });
    els.close.addEventListener('click', close);
    render(ON ? null : localRead(), false);
    if (!ON) els.status.textContent = '로컬 모드 (내 브라우저에만 저장)';
  }

  return { init: init, open: open, close: close, refresh: refresh, online: function () { return ON; } };
})();
