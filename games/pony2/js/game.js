/* Enchanted Pony Palace - game logic */
(function () {
  'use strict';
  var P = window.PPA, A = P.audio;
  var body = document.body;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function mk(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pickOne(a) { return a[Math.floor(Math.random() * a.length)]; }

  var fx = $('#fx'), playEl = $('#play'), ponyEl = $('#pony'), tray = $('#tray');
  var PRAISE = ['Great job!', "You're magical!", 'Your pony loves you!', 'Beautiful!', 'Yay!'];

  /* =========================================================
     Saved progress (stays in this browser only)
     ========================================================= */
  var KEY = 'enchantedPonyPalace.v1';
  function defaults() { return { players: [null, null], active: 0, stars: 0, music: true, sfx: true, looks: {}, celebrations: 0 }; }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s === 'object') {
        var d = defaults();
        for (var k in d) if (!(k in s)) s[k] = d[k];
        if (!Array.isArray(s.players) || s.players.length !== 2) s.players = [null, null];
        s.players = s.players.map(function (id) { return P.CHARS.some(function (c) { return c.id === id; }) ? id : null; });
        if (typeof s.looks !== 'object' || !s.looks) s.looks = {};
        return s;
      }
    } catch (e) {}
    return defaults();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  var state = load();
  A.musicOn = !!state.music; A.sfxOn = !!state.sfx;

  function activeId() { var p = state.players; return p[state.active] || p[0] || p[1] || 'rosie'; }
  function playersList() { var r = []; state.players.forEach(function (id, i) { if (id) r.push({ slot: i, id: id }); }); return r; }
  function ensurePlayers() {
    if (!state.players[0] && !state.players[1]) state.players[0] = 'rosie';
    if (!state.players[state.active]) state.active = state.players[0] ? 0 : 1;
  }

  /* =========================================================
     Tiny helpers: timers, tap buttons, particles, hints
     ========================================================= */
  var timers = [];
  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function tap(elm, fn) {
    var down = null;
    elm.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      down = { id: e.pointerId, x: e.clientX, y: e.clientY };
      elm.classList.add('pressed');
    });
    elm.addEventListener('pointerup', function (e) {
      elm.classList.remove('pressed');
      if (!down || e.pointerId !== down.id) return;
      var far = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 60;
      down = null;
      if (!far) fn(e);
    });
    elm.addEventListener('pointercancel', function () { down = null; elm.classList.remove('pressed'); });
    elm.addEventListener('pointerleave', function () { elm.classList.remove('pressed'); });
  }

  function centerOf(e) { var r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, r: r }; }

  var SHAPES = { star: 'star', heart: 'heart', flower: 'flower', snow: 'snow', rainbow: 'star', bubble: 'bubble', drop: 'drop' };
  var COLS = {
    star: ['#ffd23f', '#ffffff', '#ffb3e6', '#b9f0ff'], heart: ['#ff6fa8', '#ff9ec7', '#ff4f8b'],
    flower: ['#ffb3d1', '#ffffff', '#ffe36b', '#c9a6ff'], snow: ['#ffffff', '#cfeaff', '#e8f6ff'], bubble: ['#fff'], drop: ['#fff']
  };
  function burst(x, y, type, n, o) {
    o = o || {};
    var shape = SHAPES[type] || 'star';
    for (var i = 0; i < n; i++) {
      if (fx.childElementCount > 170) return;
      var col = type === 'rainbow' ? 'hsl(' + Math.floor(rnd(0, 360)) + ',95%,65%)' : pickOne(COLS[type] || COLS.star);
      var size = (o.size || 26) * rnd(0.7, 1.5);
      var d = mk('div', 'p', P.shape(shape, col, size));
      fx.appendChild(d);
      var a = o.ring ? (i / n) * Math.PI * 2 : rnd(0, Math.PI * 2);
      var dist = (o.spread || 90) * (o.ring ? 1 : rnd(0.4, 1.2));
      var dx = Math.cos(a) * dist, dy = Math.sin(a) * dist - (o.up || 24);
      var h = size / 2, r0 = rnd(-90, 90), r1 = rnd(-200, 200);
      var an = d.animate([
        { transform: 'translate(' + (x - h) + 'px,' + (y - h) + 'px) scale(.2) rotate(' + r0 + 'deg)', opacity: 1 },
        { transform: 'translate(' + (x + dx - h) + 'px,' + (y + dy - h) + 'px) scale(1.1) rotate(' + (r0 + r1 / 2) + 'deg)', opacity: 1, offset: 0.55 },
        { transform: 'translate(' + (x + dx * 1.15 - h) + 'px,' + (y + dy * 1.15 + (o.fall || 36) - h) + 'px) scale(.3) rotate(' + (r0 + r1) + 'deg)', opacity: 0 }
      ], { duration: rnd(750, 1300), easing: 'cubic-bezier(.2,.7,.3,1)', delay: o.stagger ? i * o.stagger : 0, fill: 'backwards' });
      an.onfinish = (function (el) { return function () { el.remove(); }; })(d);
    }
  }
  function sparkleOnPony(host, n, type) {
    var c = centerOf(host);
    for (var i = 0; i < n; i++) burst(c.x + rnd(-c.w * .38, c.w * .38), c.y + rnd(-c.h * .4, c.h * .3), type || 'star', 1, { spread: 50, size: 24 });
  }

  var hintEl = null, hintAnim = null, hintTimer = null;
  function hideHint() {
    clearTimeout(hintTimer);
    if (hintAnim) { hintAnim.cancel(); hintAnim = null; }
    if (hintEl) { hintEl.remove(); hintEl = null; }
  }
  function showHint(pts, ms, tapOnly) {
    hideHint();
    if (!pts || !pts.length) return;
    hintEl = mk('div', 'hand', P.icon('hand'));
    fx.appendChild(hintEl);
    var t = function (p, dy) { return 'translate(' + p[0] + 'px,' + (p[1] + (dy || 0)) + 'px)'; };
    var kf;
    if (tapOnly) {
      var p = pts[0];
      kf = [{ transform: t(p, 0), opacity: 0 }, { transform: t(p, 0), opacity: 1, offset: 0.2 }, { transform: t(p, 16) + ' scale(.88)', opacity: 1, offset: 0.45 },
        { transform: t(p, 0), opacity: 1, offset: 0.7 }, { transform: t(p, 0), opacity: 0 }];
    } else {
      kf = pts.map(function (p, i) { return { transform: t(p, 0), opacity: (i === 0 || i === pts.length - 1) ? 0 : 1, offset: i / (pts.length - 1) }; });
    }
    hintAnim = hintEl.animate(kf, { duration: ms || 2800, iterations: Infinity, easing: 'ease-in-out' });
  }
  function scheduleHint(fn, ms) { clearTimeout(hintTimer); hintTimer = setTimeout(function () { try { fn(); } catch (e) {} }, ms || 6000); }
  function ptOf(sel, fx_, fy_) {
    var e = typeof sel === 'string' ? $(sel) : sel;
    if (!e) return null;
    var r = e.getBoundingClientRect();
    return [r.left + r.width * (fx_ == null ? .5 : fx_), r.top + r.height * (fy_ == null ? .5 : fy_)];
  }

  var lastSay = 0;
  function say(text, pitch, force) {
    var n = Date.now();
    if (!force && n - lastSay < 2600) return;
    lastSay = n;
    A.speak(text, pitch || P.charById(activeId()).pitch);
  }

  /* =========================================================
     Scenes, ponies, navigation
     ========================================================= */
  var sceneKind = null, cur = 'welcome', mode = 'hub', act = null, lastMode = 'brush', lastExtra = null;
  function setScene(k) { if (sceneKind === k) return; sceneKind = k; $('#scene').innerHTML = P.sceneSVG(k); }

  function lookFor(id, extra) {
    var c = P.charById(id), l = state.looks[id] || {};
    var o = { body: c.body, mane: l.mane || c.mane, tail: l.tail || c.tail, kind: c.kind, mark: c.mark, acc: Object.assign({}, l.acc) };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }
  function mountPony(host, id, extra) { host.innerHTML = P.ponySVG(lookFor(id, extra)); host.setAttribute('data-id', id); return host; }
  function ensureLook(id) { var l = state.looks[id]; if (!l) l = state.looks[id] = {}; if (!l.acc) l.acc = {}; return l; }

  function show(n) {
    if (cur === 'play') cleanupMode();
    clearTimers(); hideHint();
    ['welcome', 'select', 'play', 'celebrate'].forEach(function (s) { $('#' + s).classList.toggle('active', s === n); });
    cur = n; body.setAttribute('data-screen', n);
    if (n !== 'play') body.setAttribute('data-mode', '');
    setScene(n === 'welcome' ? 'castle' : 'meadow');
    updateStars();
  }

  function updateStars(bump) {
    $('#starCount').textContent = state.stars;
    if (bump) { var b = $('#starsBox'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  }

  function renderSwitcher() {
    var sw = $('#switcher'); sw.innerHTML = '';
    playersList().forEach(function (p) {
      var b = mk('button', 'avatar a' + p.slot + (p.slot === state.active ? ' on' : ''));
      b.setAttribute('aria-label', P.charById(p.id).name);
      var h = mk('div', 'pony'); mountPony(h, p.id, { view: 'head' }); b.appendChild(h);
      tap(b, function () { switchTo(p.slot); });
      sw.appendChild(b);
    });
    var s = mk('button', 'avatar swap', P.icon('swap')); s.setAttribute('aria-label', 'Choose ponies');
    tap(s, function () { A.boop(); openSelect(); });
    sw.appendChild(s);
  }

  function switchTo(slot) {
    if (slot === state.active) { reactCurrent(); return; }
    state.active = slot; save();
    var c = P.charById(activeId());
    A.neigh(c.pitch); say("Hi, I'm " + c.name + '!', c.pitch, true);
    if (cur === 'celebrate') enterPlay(lastMode); else enterPlay(mode);
  }
  function reactCurrent() { if (cur === 'play') react(); }

  function goHome() {
    A.boop();
    if (cur === 'play' && mode !== 'hub') enterPlay('hub');
    else if (cur === 'celebrate') enterPlay('hub');
    else showWelcome();
  }

  /* ---------- welcome ---------- */
  function showWelcome() {
    show('welcome');
    var ids = playersList().map(function (p) { return p.id; });
    var a = ids[0] || 'rosie', b = ids[1] || (a === 'starlight' ? 'luna' : 'starlight');
    mountPony($('#wp1'), a); mountPony($('#wp2'), b);
    scheduleHint(function () { showHint([ptOf('#playBtn', .5, .45)], 2200, true); }, 5000);
  }

  /* ---------- character selection ---------- */
  var sel = { players: [null, null], active: 0 };
  function openSelect() {
    sel.players = state.players.slice();
    sel.active = sel.players[0] && !sel.players[1] ? 1 : 0;
    buildSelect(); show('select'); updateSelect(); selectHint();
  }
  function buildSelect() {
    var g = $('#grid'); g.innerHTML = '';
    P.CHARS.forEach(function (c) {
      var card = mk('button', 'card'); card.setAttribute('data-id', c.id); card.setAttribute('aria-label', c.name);
      var h = mk('div', 'pony'); mountPony(h, c.id); card.appendChild(h);
      card.appendChild(mk('div', 'badges'));
      card.appendChild(mk('div', 'name', c.name));
      card.appendChild(mk('div', 'trait', c.trait));
      tap(card, function () { pickChar(c.id, card); });
      g.appendChild(card);
    });
    ['#slot0', '#slot1'].forEach(function (s, i) {
      var b = $(s); if (b._wired) return; b._wired = true;
      tap(b, function () { sel.active = i; var id = sel.players[i]; if (id) { A.neigh(P.charById(id).pitch); } else A.boop(); updateSelect(); });
    });
  }
  function badgeIcon(i, col) { return i === 0 ? P.shape('heart', col || '#fff', 24) : P.shape('star', col || '#fff', 24); }
  function updateSelect() {
    [0, 1].forEach(function (i) {
      var b = $('#slot' + i), id = sel.players[i];
      b.className = 'slot s' + i + (sel.active === i ? ' on' : '');
      b.innerHTML = '';
      if (id) {
        var h = mk('div', 'pony'); mountPony(h, id, { view: 'head' }); b.appendChild(h);
        b.appendChild(mk('div', 'badge', badgeIcon(i)));
      } else {
        b.appendChild(mk('div', 'empty', badgeIcon(i, i === 0 ? '#ff6fae' : '#4fb4ff')));
      }
    });
    var cards = document.querySelectorAll('#grid .card');
    for (var k = 0; k < cards.length; k++) {
      var cid = cards[k].getAttribute('data-id'), bd = $('.badges', cards[k]);
      var on0 = sel.players[0] === cid, on1 = sel.players[1] === cid;
      cards[k].classList.toggle('on0', on0); cards[k].classList.toggle('on1', on1);
      bd.innerHTML = (on0 ? '<div class="badge b0">' + badgeIcon(0) + '</div>' : '') + (on1 ? '<div class="badge b1">' + badgeIcon(1) + '</div>' : '');
    }
    $('#goBtn').classList.toggle('hidden', !(sel.players[0] || sel.players[1]));
    $('#goBtn').classList.toggle('pulse', !!(sel.players[0] || sel.players[1]));
  }
  function selectHint() {
    hideHint();
    if (sel.players[0] || sel.players[1]) {
      scheduleHint(function () { showHint([ptOf('#goBtn', .5, .45)], 2200, true); }, 6000);
    } else {
      scheduleHint(function () { var c = $('#grid .card'); if (c) showHint([ptOf(c, .5, .4)], 2200, true); }, 3500);
    }
  }
  function pickChar(id, card) {
    var c = P.charById(id), other = 1 - sel.active;
    if (sel.players[other] === id) sel.players[other] = null;
    sel.players[sel.active] = id;
    if (!sel.players[other]) sel.active = other;
    A.neigh(c.pitch); A.sparkle(); say("Hi, I'm " + c.name + '!', c.pitch, true);
    var h = $('.pony', card); h.classList.remove('jump'); void h.offsetWidth; h.classList.add('jump'); h.classList.add('happy');
    later(function () { h.classList.remove('happy'); }, 1000);
    var cc = centerOf(card); burst(cc.x, cc.y, c.react, 9, { spread: 80 });
    updateSelect(); selectHint();
  }
  function startFromSelect() {
    if (!sel.players[0] && !sel.players[1]) return;
    state.players = sel.players.slice();
    state.active = state.players[0] ? 0 : 1;
    save();
    A.fanfare(); enterPlay('hub');
  }

  /* =========================================================
     Play screen: meadow + care activities
     ========================================================= */
  var tool = null;
  var ACTS = [
    { m: 'brush', c: 'pink', i: 'brush' }, { m: 'feed', c: 'red', i: 'apple' }, { m: 'bath', c: 'blue', i: 'bubbles' },
    { m: 'decorate', c: 'purple', i: 'crown' }, { m: 'makeover', c: 'rainbow', i: 'wand' }
  ];

  function cleanupMode() {
    hideHint(); clearTimers();
    if (tool) { if (tool.el) tool.el.remove(); if (tool.src) tool.src.classList.remove('ghost'); tool = null; }
    var junk = fx.querySelectorAll('.tool,.bubble'); for (var i = 0; i < junk.length; i++) junk[i].remove();
    reacting = false; act = null;
    ponyEl.className = 'pony';
  }

  function enterPlay(m) {
    ensurePlayers();
    show('play'); mode = m; body.setAttribute('data-mode', m);
    var id = activeId(), c = P.charById(id);
    act = { mode: m, id: id, char: c, done: false, count: 0, extra: null };
    ponyEl.className = 'pony';
    mountPony(ponyEl, id);
    renderSwitcher();
    $('#progress').classList.toggle('show', m !== 'hub');
    buildProgress();
    tray.innerHTML = '';
    var b = { hub: buildHub, brush: buildBrush, feed: buildFeed, bath: buildBath, decorate: buildDecorate, makeover: buildMakeover }[m];
    b();
    if (m === 'hub') { ponyEl.classList.add('jump'); later(function () { ponyEl.classList.remove('jump'); }, 900); }
  }

  /* ---------- progress stars ---------- */
  function buildProgress() {
    var p = $('#progress'); p.innerHTML = '';
    for (var i = 0; i < 3; i++) p.appendChild(mk('div', 'pst', '<div>' + P.icon('starEmpty') + '</div><div class="full">' + P.icon('star') + '</div>'));
    act.shown = 0;
  }
  function setProgress(n) {
    n = Math.min(3, n);
    var els = document.querySelectorAll('#progress .pst');
    for (var i = 0; i < els.length; i++) {
      var on = i < n;
      if (on && !els[i].classList.contains('on')) {
        (function (el, idx) { later(function () { el.classList.add('on'); A.star(idx); var c = centerOf(el); burst(c.x, c.y, 'star', 6, { spread: 50, size: 20 }); }, (idx - act.shown) * 120 > 0 ? (idx - act.shown) * 120 : 0); })(els[i], i);
      }
    }
    act.shown = Math.max(act.shown, n);
  }

  /* ---------- pony reactions (tap the pony) ---------- */
  var reacting = false, tapCount = 0;
  function react() {
    if (reacting || !act) return;
    reacting = true; tapCount++;
    var c = act.char, cls = c.move;
    ponyEl.classList.remove(cls); void ponyEl.offsetWidth;
    ponyEl.classList.add(cls, 'happy');
    A.neigh(c.pitch);
    var pc = centerOf(ponyEl);
    burst(pc.x + pc.w * .1, pc.y - pc.h * .12, c.react, 10, { spread: pc.w * .22 });
    if (tapCount % 4 === 1) say("I'm " + c.name + '!', c.pitch); else if (Math.random() < 0.4) say(pickOne(PRAISE), c.pitch);
    later(function () { ponyEl.classList.remove(cls, 'happy'); reacting = false; }, 950);
  }

  /* ---------- hub ---------- */
  function buildHub() {
    ACTS.forEach(function (a, i) {
      var b = mk('button', 'btn act in ' + a.c, P.icon(a.i)); b.style.animationDelay = (i * 70) + 'ms'; b.setAttribute('aria-label', a.m);
      tap(b, function () { A.pop(); A.sparkle(); enterPlay(a.m); });
      tray.appendChild(b);
    });
    scheduleHint(function () { var t = ptOf('#pony', .72, .5); if (t) showHint([t], 2400, true); }, 7000);
  }

  /* ---------- generic tool dragging (brush / sponge / food) ---------- */
  playEl.addEventListener('pointerdown', function (e) {
    if (!act || tool || act.done) return;
    var t = e.target;
    if (t.closest && t.closest('.btn, .swatch, .orb, .avatar')) return;
    hideHint();
    if (mode === 'brush') beginTool(e, 'brush');
    else if (mode === 'bath') beginTool(e, 'sponge');
    else if (mode === 'feed') {
      var f = t.closest('.food');
      if (f) beginFood(e, f); else if (t.closest('#pony')) react();
    } else if (t.closest('#pony')) react();
  });
  window.addEventListener('pointermove', function (e) {
    if (!tool || e.pointerId !== tool.pid) return;
    var x = e.clientX, y = e.clientY, d = Math.hypot(x - tool.x, y - tool.y);
    tool.x = x; tool.y = y; tool.moved += d; place(tool);
    if (!act) return;
    if (tool.kind === 'brush') brushMove(x, y, d); else if (tool.kind === 'sponge') bathMove(x, y, d);
  });
  function onUp(e) {
    if (!tool || e.pointerId !== tool.pid) return;
    var t = tool;
    if (t.kind === 'food') dropFood(t, e.clientX, e.clientY);
    else { endTool(); if (act && !act.done) scheduleHint(act.hint, 6500); }
  }
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  function place(t) { t.el.style.transform = 'translate(' + t.x + 'px,' + t.y + 'px)'; }
  function makeTool(e, kind, icon) {
    var el = mk('div', 'tool ' + (kind === 'food' ? 'tfood' : kind), '<div class="in">' + P.icon(icon) + '</div>');
    fx.appendChild(el);
    tool = { pid: e.pointerId, kind: kind, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t0: performance.now(), moved: 0, el: el };
    place(tool);
    try { playEl.setPointerCapture(e.pointerId); } catch (er) {}
    return tool;
  }
  function beginTool(e, kind) {
    makeTool(e, kind, kind === 'brush' ? 'brush' : 'sponge');
    tool.el.classList.add('active');
    tool.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 });
    act.sinceSpark = 0; act.sinceSnd = 0;
  }
  function endTool() {
    if (!tool) return;
    var el = tool.el; tool = null;
    var a = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    a.onfinish = function () { el.remove(); };
    ponyEl.classList.remove('brushing');
  }

  /* ---------- Brush the mane ---------- */
  function buildBrush() {
    act.travel = 0; act.progress = 0; act.sinceSpark = 0; act.sinceSnd = 0;
    tray.appendChild(mk('div', 'toolslot', P.icon('brush')));
    act.hint = function () {
      var a = ptOf('.toolslot'), m = $('#pony .mane'); if (!a || !m) return;
      var r = m.getBoundingClientRect(), x = r.left + r.width * .5, y1 = r.top + r.height * .25, y2 = r.top + r.height * .75;
      showHint([a, [x, y1], [x - 20, y2], [x + 15, y1], [x - 20, y2], [x + 15, y1], a], 4200);
    };
    scheduleHint(act.hint, 1500);
  }
  var brushTimer = null;
  function brushMove(x, y, d) {
    if (act.done) return;
    var m = $('#pony .mane'); if (!m) return;
    var r = m.getBoundingClientRect(), pad = 34;
    if (x < r.left - pad || x > r.right + pad || y < r.top - pad || y > r.bottom + pad) { ponyEl.classList.remove('brushing'); return; }
    ponyEl.classList.add('brushing');
    clearTimeout(brushTimer); brushTimer = setTimeout(function () { ponyEl.classList.remove('brushing'); }, 260);
    act.travel += d; act.sinceSpark += d; act.sinceSnd += d;
    if (act.sinceSpark > 42) { act.sinceSpark = 0; burst(x, y, 'star', 2, { spread: 46, size: 22 }); }
    if (act.sinceSnd > 100) { act.sinceSnd = 0; A.brush(); }
    var p = Math.min(1, act.travel / (r.height * 8));
    if (p > act.progress) {
      act.progress = p;
      var svg = $('#pony svg'); if (svg) svg.style.setProperty('--shine', p.toFixed(3));
      setProgress(Math.floor(p * 3 + 0.0001));
    }
    if (p >= 1) {
      act.done = true; endTool(); hideHint();
      ponyEl.classList.add('happy'); A.sparkle(); A.neigh(act.char.pitch);
      var c = centerOf(m); burst(c.x, c.y, 'rainbow', 16, { spread: 110, size: 28 });
      later(function () { sparkleOnPony(ponyEl, 10, 'star'); A.sparkle(); }, 450);
      later(function () { celebrate('brush'); }, 1700);
    }
  }

  /* ---------- Feed the pony ---------- */
  var FOODS = ['apple', 'carrot', 'sugar'];
  function buildFeed() {
    act.eaten = 0;
    FOODS.forEach(function (k, i) {
      var f = mk('div', 'food bounce', P.icon(k)); f.setAttribute('data-kind', k); f.style.animationDelay = (i * 80) + 'ms';
      tray.appendChild(f);
    });
    act.hint = function () {
      var f = $('.food'), m = $('#pony .mouth-target'); if (!f || !m) return;
      var a = ptOf(f), b = ptOf(m, .5, .5); showHint([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 40], b, b, a], 3200);
    };
    scheduleHint(act.hint, 1500);
  }
  function mouthPoint() {
    var m = $('#pony .mouth-target'); if (!m) { var c = centerOf(ponyEl); return { x: c.x, y: c.y, r: 120 }; }
    var r = m.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: Math.max(r.width * 0.95, 70) };
  }
  function beginFood(e, srcEl) {
    var kind = srcEl.getAttribute('data-kind');
    makeTool(e, 'food', kind);
    tool.src = srcEl; tool.food = kind; srcEl.classList.add('ghost');
    A.boop();
  }
  function dropFood(t, x, y) {
    tool = null; if (t.src) t.src.classList.remove('ghost');
    var m = mouthPoint(), near = Math.hypot(x - m.x, y - m.y) < m.r;
    var wasTap = t.moved < 14 && performance.now() - t.t0 < 450;
    if (near || wasTap) {
      var a = t.el.animate([{ transform: 'translate(' + x + 'px,' + y + 'px) scale(1)', opacity: 1 }, { transform: 'translate(' + m.x + 'px,' + m.y + 'px) scale(.25)', opacity: .1 }],
        { duration: wasTap ? 480 : 260, easing: 'ease-in', fill: 'forwards' });
      a.onfinish = function () { t.el.remove(); eat(t.food); };
    } else {
      var s = t.src ? centerOf(t.src) : { x: x, y: y };
      var b = t.el.animate([{ transform: 'translate(' + x + 'px,' + y + 'px) scale(1)', opacity: 1 }, { transform: 'translate(' + s.x + 'px,' + s.y + 'px) scale(.9)', opacity: .2 }],
        { duration: 320, easing: 'ease-out', fill: 'forwards' });
      b.onfinish = function () { t.el.remove(); };
    }
    scheduleHint(act && act.hint, 6500);
  }
  function eat() {
    if (!act || act.mode !== 'feed') return;
    act.eaten++;
    ponyEl.classList.remove('eating', 'happy'); void ponyEl.offsetWidth; ponyEl.classList.add('eating');
    A.munch();
    var m = mouthPoint(); burst(m.x, m.y, 'heart', 4, { spread: 60, size: 24 });
    setProgress(act.eaten);
    later(function () {
      ponyEl.classList.remove('eating'); ponyEl.classList.add('happy');
      A.giggle(act.char.pitch); burst(m.x, m.y - 30, 'heart', 7, { spread: 90 });
      later(function () { ponyEl.classList.remove('happy'); }, 1100);
    }, 1450);
    if (act.eaten >= 3 && !act.done) {
      act.done = true;
      later(function () { A.neigh(act.char.pitch); sparkleOnPony(ponyEl, 10, 'heart'); }, 1700);
      later(function () { celebrate('feed'); }, 3000);
    }
  }

  /* ---------- Bath ---------- */
  function buildBath() {
    mountPony(ponyEl, act.id, { dirt: true });
    act.spots = [].slice.call(ponyEl.querySelectorAll('.spot')).map(function (el) { return { el: el, hp: 1 }; });
    act.removed = 0; act.acc = 0; act.snd = 0; act.bubbles = 0;
    tray.appendChild(mk('div', 'toolslot', P.icon('sponge')));
    act.hint = function () {
      var a = ptOf('.toolslot'), pr = ponyEl.getBoundingClientRect(); if (!a) return;
      var x = pr.left + pr.width * .5, y = pr.top + pr.height * .55;
      showHint([a, [x - 60, y], [x + 60, y - 10], [x - 60, y + 10], [x + 60, y], a], 4200);
    };
    scheduleHint(act.hint, 1500);
  }
  function spawnBubble(x, y) {
    if (act.bubbles > 34) return;
    act.bubbles++;
    var s = rnd(26, 70), b = mk('div', 'bubble'); b.style.width = b.style.height = s + 'px';
    fx.appendChild(b);
    var x0 = x + rnd(-44, 44) - s / 2, y0 = y + rnd(-44, 44) - s / 2;
    var an = b.animate([
      { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(.3)', opacity: 0 },
      { transform: 'translate(' + (x0 + rnd(-20, 20)) + 'px,' + (y0 - 20) + 'px) scale(1)', opacity: 1, offset: .15 },
      { transform: 'translate(' + (x0 + rnd(-50, 50)) + 'px,' + (y0 - rnd(70, 150)) + 'px) scale(1.12)', opacity: 0 }
    ], { duration: rnd(1500, 2600), easing: 'ease-out' });
    an.onfinish = function () { b.remove(); if (act) act.bubbles = Math.max(0, act.bubbles - 1); };
  }
  function bathMove(x, y, d) {
    if (act.done) return;
    var pr = ponyEl.getBoundingClientRect();
    if (x < pr.left || x > pr.right || y < pr.top || y > pr.bottom) return;
    act.acc += d; act.snd += d;
    if (act.acc > 26) { act.acc = 0; spawnBubble(x, y); }
    if (act.snd > 130) { act.snd = 0; A.scrub(); }
    var total = act.spots.length;
    act.spots.forEach(function (s) {
      if (s.hp <= 0) return;
      var r = s.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, rad = Math.max(r.width * .9, 64);
      if (Math.hypot(x - cx, y - cy) < rad) {
        s.hp -= d / 160;
        var h = Math.max(0, s.hp);
        s.el.style.opacity = h.toFixed(2); s.el.style.transform = 'scale(' + (0.45 + h * 0.55).toFixed(2) + ')';
        if (s.hp <= 0) {
          s.el.style.display = 'none'; act.removed++;
          burst(cx, cy, 'bubble', 6, { spread: 60, size: 30, fall: -10 }); A.pop();
          setProgress(Math.floor(act.removed / total * 3 + 0.0001));
          if (act.removed >= total) bathDone();
        }
      }
    });
  }
  function bathDone() {
    act.done = true; endTool(); hideHint();
    var pr = ponyEl.getBoundingClientRect();
    A.splash();
    for (var i = 0; i < 26; i++) {
      (function (i) {
        var s = rnd(18, 30), d = mk('div', 'p', P.shape('drop', '#7fd4ff', s)); fx.appendChild(d);
        var x = pr.left + rnd(0, pr.width), y0 = pr.top - 40;
        var an = d.animate([{ transform: 'translate(' + x + 'px,' + y0 + 'px)', opacity: 0 }, { transform: 'translate(' + x + 'px,' + (y0 + 40) + 'px)', opacity: 1, offset: .15 }, { transform: 'translate(' + (x + rnd(-10, 10)) + 'px,' + (pr.bottom) + 'px)', opacity: .9 }],
          { duration: rnd(700, 1100), delay: i * 28, easing: 'ease-in', fill: 'backwards' });
        an.onfinish = function () { d.remove(); };
      })(i);
    }
    later(function () {
      ponyEl.classList.add('clean', 'happy'); A.sparkle(); A.neigh(act.char.pitch);
      sparkleOnPony(ponyEl, 14, 'star'); sparkleOnPony(ponyEl, 6, 'rainbow');
    }, 900);
    later(function () { A.sparkle(); sparkleOnPony(ponyEl, 10, 'star'); }, 1500);
    later(function () { celebrate('bath'); }, 2800);
  }

  /* ---------- Decorate ---------- */
  var ACC_COL = { bow: 'pink', flower: 'green', ribbon: 'blue', crown: 'yellow', horn: 'purple', wings: 'orange' };
  function baseOf(c) { return P.baseColor ? P.baseColor(c) : c; }
  function buildDecorate() {
    act.tab = 'acc'; act.changes = 0;
    var row1 = mk('div', 'row'), row2 = mk('div', 'row'); tray.appendChild(row1); tray.appendChild(row2);
    var tabs = {};
    function mkTab(key, icon, cls) {
      var b = mk('button', 'btn tab ' + cls, P.icon(icon)); b.setAttribute('aria-label', key);
      tap(b, function () { act.tab = key; A.boop(); refreshTabs(); renderOpts(); });
      tabs[key] = b; row1.appendChild(b);
    }
    mkTab('acc', 'crown', 'yellow'); mkTab('mane', 'mane', 'pink'); mkTab('tail', 'tail', 'blue');
    var done = mk('button', 'btn green', P.icon('check')); done.setAttribute('aria-label', 'Done');
    done.style.marginLeft = 'clamp(10px,3vmin,36px)';
    tap(done, function () { if (act.done) return; act.done = true; hideHint(); A.fanfare(); celebrate('decorate'); });
    row1.appendChild(done);

    function refreshTabs() {
      var l = state.looks[act.id] || {}, c = act.char;
      tabs.mane.style.color = baseOf(l.mane || c.mane); tabs.tail.style.color = baseOf(l.tail || c.tail);
      for (var k in tabs) tabs[k].classList.toggle('on', k === act.tab);
    }
    function changed(msg) {
      act.changes++;
      var el = ponyEl; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
      mountPony(ponyEl, act.id);
      A.sparkle(); sparkleOnPony(ponyEl, 7, pickOne(['star', 'rainbow', 'star']));
      setProgress(act.changes);
      if (act.changes % 3 === 0) { say(pickOne(PRAISE), act.char.pitch); A.neigh(act.char.pitch); }
      refreshTabs(); renderOpts();
    }
    function renderOpts() {
      row2.innerHTML = '';
      var l = state.looks[act.id] || {};
      if (act.tab === 'acc') {
        P.ACCS.forEach(function (a) {
          if (a === 'horn' && act.char.kind === 'unicorn') return;
          var on = l.acc && l.acc[a];
          var b = mk('button', 'btn opt ' + ACC_COL[a] + (on ? ' on' : ''), P.icon(a)); b.setAttribute('aria-label', a);
          tap(b, function () { var lk = ensureLook(act.id); lk.acc[a] = !lk.acc[a]; save(); changed(); });
          row2.appendChild(b);
        });
      } else {
        var curv = l[act.tab] || act.char[act.tab];
        P.COLORS.forEach(function (c) {
          var s = mk('button', 'swatch' + (c === 'rainbow' ? ' rb' : '') + (c === curv ? ' on' : '')); s.setAttribute('aria-label', 'colour');
          if (c !== 'rainbow') s.style.background = c;
          tap(s, function () { var lk = ensureLook(act.id); lk.mane = lk.mane || act.char.mane; lk.tail = lk.tail || act.char.tail; lk[act.tab] = c; save(); changed(); });
          row2.appendChild(s);
        });
      }
    }
    refreshTabs(); renderOpts();
    act.hint = function () {
      if (act.changes > 0) return;
      var t = ptOf('#tray .opt'); if (t) showHint([t], 2400, true);
    };
    scheduleHint(act.hint, 3500);
  }

  /* ---------- Magical makeover ---------- */
  var THEMES = [
    { mane: '#ff5fa2|#ffa6d2', body: '#ffd6ea', o: ['#ffb3d9', '#ff5fa2', '#c93a84'] },
    { mane: '#8a4fe0|#c9a6ff', body: '#dccaff', o: ['#d5b8ff', '#9a62f0', '#6a3bb8'] },
    { mane: '#3fa9ff|#9fe0ff', body: '#d4efff', o: ['#a8e2ff', '#3fa9ff', '#2574c4'] },
    { mane: '#38c46b|#9be8a4', body: '#d8f7de', o: ['#b4f0bd', '#38c46b', '#1f8f48'] },
    { mane: '#ffb21c|#ffe27a', body: '#fff1c2', o: ['#fff0a0', '#ffb21c', '#c98300'] },
    { mane: 'rainbow', body: '#fff0fb', rb: true, o: ['#ffd0f0', '#b8a0ff', '#7a56c9'] }
  ];
  function buildMakeover() {
    act.count = 0; act.busy = false; lastExtra = null;
    var row = mk('div', 'row'); tray.appendChild(row);
    THEMES.forEach(function (th, i) {
      var b = mk('button', 'orb' + (th.rb ? ' rb' : '')); b.setAttribute('aria-label', 'magic colour');
      b.style.setProperty('--o1', th.o[0]); b.style.setProperty('--o2', th.o[1]); b.style.setProperty('--o3', th.o[2]); b.style.setProperty('--d', (i * 0.25) + 's');
      tap(b, function () { transformTo(th); });
      row.appendChild(b);
    });
    act.hint = function () { var t = ptOf('#tray .orb'); if (t && act.count === 0) showHint([t], 2400, true); };
    scheduleHint(act.hint, 2500);
  }
  function transformTo(th) {
    if (!act || act.busy || act.done) return;
    act.busy = true; hideHint();
    A.whoosh();
    var fl = $('#flash'); fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
    ponyEl.classList.add('transform');
    var c = centerOf(ponyEl);
    burst(c.x, c.y, 'rainbow', 22, { ring: true, spread: Math.min(c.w, c.h) * .55, size: 30, up: 0, fall: 0 });
    burst(c.x, c.y, 'star', 12, { spread: c.w * .3, size: 24, stagger: 30 });
    later(function () {
      var l = ensureLook(act.id); l.mane = th.mane; l.tail = th.mane; save();
      act.extra = { body: th.body, wings: true, glow: true }; lastExtra = act.extra;
      mountPony(ponyEl, act.id, act.extra);
    }, 520);
    later(function () {
      ponyEl.classList.remove('transform'); ponyEl.classList.add('happy');
      A.sparkle(); A.neigh(act.char.pitch);
      sparkleOnPony(ponyEl, 12, 'rainbow');
      act.count++; act.busy = false; setProgress(act.count);
      later(function () { ponyEl.classList.remove('happy'); }, 900);
      if (act.count >= 3) finale();
    }, 1300);
  }
  function finale() {
    act.done = true;
    var n = 0;
    (function boom() {
      if (!act || n > 6) return;
      n++;
      var x = rnd(innerWidth * .15, innerWidth * .85), y = rnd(innerHeight * .15, innerHeight * .5);
      burst(x, y, 'rainbow', 18, { ring: true, spread: rnd(90, 160), size: 28, up: 0, fall: 50 }); A.firework();
      later(boom, 330);
    })();
    ponyEl.classList.add('dance'); say("You're magical!", act.char.pitch, true);
    later(function () { celebrate('makeover'); }, 3200);
  }

  /* =========================================================
     Celebration screen
     ========================================================= */
  function celebrate(m) {
    show('celebrate'); lastMode = m;
    var id = activeId(), c = P.charById(id);
    state.celebrations = (state.celebrations || 0) + 1;
    var base = state.stars; state.stars += 3; save();
    var msg = pickOne(PRAISE), cm = $('#cmsg');
    cm.textContent = msg; cm.style.animation = 'none'; void cm.offsetWidth; cm.style.animation = '';
    var cp = $('#cpony'); cp.className = 'pony'; mountPony(cp, id, m === 'makeover' ? lastExtra : null);
    cp.classList.add('happy', 'jump');
    renderSwitcher();
    $('#starCount').textContent = base;

    var cs = $('#cstars'); cs.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      (function (i) {
        var st = mk('div', 'st', P.icon('star')); st.style.animationDelay = (0.45 + i * 0.35) + 's'; cs.appendChild(st);
        later(function () { A.star(i); $('#starCount').textContent = base + i + 1; updateStars(true); $('#starCount').textContent = base + i + 1; var cc = centerOf(st); burst(cc.x, cc.y, 'star', 8, { spread: 70 }); }, 450 + i * 350);
      })(i);
    }
    A.fanfare();
    later(function () { say(msg, c.pitch, true); }, 500);
    later(function () { A.neigh(c.pitch); cp.classList.remove('jump'); cp.classList.add('party'); }, 1000);

    // surprise celebrations: sparkles every time, a rainbow or fireworks now and then
    var n = state.celebrations, kind = n % 4 === 0 ? 'fireworks' : (n % 4 === 2 ? 'rainbow' : 'sparkle');
    var old = $('#celebrate .rainbow-arc'); if (old) old.remove();
    if (kind === 'rainbow') drawRainbow();
    var k = 0;
    (function loop() {
      if (cur !== 'celebrate' || k > 12) return;
      k++;
      var x = rnd(innerWidth * .1, innerWidth * .9), y = rnd(innerHeight * .12, innerHeight * .55);
      if (kind === 'fireworks') { burst(x, y, 'rainbow', 16, { ring: true, spread: rnd(80, 150), size: 28, up: 0, fall: 50 }); A.firework(); }
      else burst(x, y, k % 2 ? 'star' : 'rainbow', 8, { spread: 90 });
      later(loop, kind === 'fireworks' ? 420 : 520);
    })();

    var bt = $('#cbtns'); bt.innerHTML = '';
    var again = mk('button', 'btn green', P.icon('again')); again.setAttribute('aria-label', 'Again');
    tap(again, function () { A.pop(); enterPlay(m); });
    bt.appendChild(again);
    var others = playersList().filter(function (p) { return p.slot !== state.active; });
    if (others.length) {
      var f = mk('button', 'btn friend ' + (others[0].slot === 0 ? 'pink' : 'blue')); f.setAttribute('aria-label', 'Your turn');
      var h = mk('div', 'pony'); mountPony(h, others[0].id, { view: 'head' }); f.appendChild(h);
      tap(f, function () { state.active = others[0].slot; save(); var oc = P.charById(others[0].id); A.neigh(oc.pitch); say("Hi, I'm " + oc.name + '!', oc.pitch, true); enterPlay(m); });
      bt.appendChild(f);
    }
    var meadow = mk('button', 'btn yellow', P.icon('meadow')); meadow.setAttribute('aria-label', 'Meadow');
    tap(meadow, function () { A.pop(); enterPlay('hub'); });
    bt.appendChild(meadow);
    later(function () { enterPlay('hub'); }, 60000);   // never stuck here
  }
  function drawRainbow() {
    var cols = ['#ff6b8b', '#ffb347', '#ffe66d', '#7be495', '#5ec8ff', '#b28cff'], paths = '';
    cols.forEach(function (c, i) {
      var r = 470 - i * 34;
      paths += '<path pathLength="1" d="M' + (500 - r) + ',500 A' + r + ',' + r + ' 0 0 1 ' + (500 + r) + ',500" fill="none" stroke="' + c + '" stroke-width="36" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1" opacity=".85"/>';
    });
    var d = mk('div', 'rainbow-arc', '<svg viewBox="0 0 1000 510" preserveAspectRatio="xMidYMax meet">' + paths + '</svg>');
    $('#celebrate').insertBefore(d, $('#celebrate').firstChild);
    var ps = d.querySelectorAll('path');
    for (var i = 0; i < ps.length; i++) ps[i].animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1500, delay: 300 + i * 120, fill: 'forwards', easing: 'ease-out' });
  }

  /* =========================================================
     Top bar, butterflies and boot
     ========================================================= */
  function syncAudioBtns() { $('#musicBtn').classList.toggle('off', !state.music); $('#sfxBtn').classList.toggle('off', !state.sfx); }
  function initChrome() {
    $('#homeBtn').innerHTML = P.icon('home');
    $('#musicBtn').innerHTML = P.icon('music');
    $('#sfxBtn').innerHTML = P.icon('sound');
    $('#starsBox .ico').innerHTML = P.icon('star');
    $('#playBtn').innerHTML = P.icon('play');
    $('#goBtn').innerHTML = P.icon('check');
    syncAudioBtns(); updateStars();
    tap($('#homeBtn'), goHome);
    tap($('#musicBtn'), function () { A.init(); state.music = !state.music; A.setMusic(state.music); save(); syncAudioBtns(); if (state.music) A.boop(); });
    tap($('#sfxBtn'), function () { A.init(); state.sfx = !state.sfx; A.setSfx(state.sfx); save(); syncAudioBtns(); if (state.sfx) A.sparkle(); });
    tap($('#playBtn'), function () { A.sparkle(); say("Let's play!", 1.2, true); openSelect(); });
    tap($('#goBtn'), startFromSelect);
    tap($('#wp1'), function () { var id = $('#wp1').getAttribute('data-id'); A.neigh(P.charById(id).pitch); $('#wp1').classList.remove('jump'); void $('#wp1').offsetWidth; $('#wp1').classList.add('jump'); var c = centerOf($('#wp1')); burst(c.x, c.y, P.charById(id).react, 8); });
    tap($('#wp2'), function () { var id = $('#wp2').getAttribute('data-id'); A.neigh(P.charById(id).pitch); $('#wp2').classList.remove('jump'); void $('#wp2').offsetWidth; $('#wp2').classList.add('jump'); var c = centerOf($('#wp2')); burst(c.x, c.y, P.charById(id).react, 8); });
    $('#wp1').style.pointerEvents = 'auto'; $('#wp2').style.pointerEvents = 'auto';
  }
  function initButterflies() {
    var host = $('#critters'), cols = [['#ff8fc4', '#ffd0e8'], ['#8fd3ff', '#d4f0ff'], ['#ffd23f', '#fff0a8']];
    cols.forEach(function (c) {
      var b = mk('div', 'butterfly', '<div class="bi" style="width:100%;height:100%">' + P.butterflySVG(c[0], c[1]) + '</div>');
      b.addEventListener('pointerdown', function (e) {
        e.stopPropagation();
        var r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 'rainbow', 10, { spread: 80 }); A.sparkle();
        $('.bi', b).animate([{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.7) rotate(25deg)' }, { transform: 'scale(1) rotate(0)' }], { duration: 380 });
      });
      host.appendChild(b);
    });
  }
  function initGuards() {
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) { document.addEventListener(t, function (e) { e.preventDefault(); }); });
    document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    var last = 0;
    document.addEventListener('touchend', function (e) { var n = Date.now(); if (n - last < 350) e.preventDefault(); last = n; }, { passive: false });
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.addEventListener('dragstart', function (e) { e.preventDefault(); });
    document.addEventListener('wheel', function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
    // audio can only start after the player has touched the game
    ['pointerdown', 'pointerup', 'touchend', 'click'].forEach(function (t) { document.addEventListener(t, function () { A.init(); }, { passive: true }); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && window.speechSynthesis) { try { speechSynthesis.cancel(); } catch (e) {} } });
  }

  initGuards(); initChrome(); initButterflies();
  showWelcome();

  P.game = { state: state, enterPlay: enterPlay, openSelect: openSelect, celebrate: celebrate, get act() { return act; }, get cur() { return cur; } };
})();
