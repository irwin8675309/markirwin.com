/* =========================================================
   game.js — screens, state, navigation, celebrations
   ========================================================= */
(function () {
  'use strict';

  const SAVE_KEY = 'enchanted-pony-palace-v1';
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  const CHEERS = [
    'Great job!', "You're magical!", 'Your pony loves you!',
    'Beautiful!', 'Yay!', 'Wonderful!', 'So sparkly!', 'Amazing!'
  ];

  /* ---------------------------------------------------------
     state
     --------------------------------------------------------- */
  const defaults = () => ({
    stars: 0,
    ponies: [],
    active: 0,
    music: true,
    sfx: true
  });

  let state = defaults();

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      state.stars = Number(parsed.stars) || 0;
      state.music = parsed.music !== false;
      state.sfx = parsed.sfx !== false;
      state.ponies = Array.isArray(parsed.ponies)
        ? parsed.ponies.filter(p => p && PonyArt.byId(p.typeId)).map(p => ({
            typeId: p.typeId,
            mane: p.mane || null,
            tail: p.tail || null,
            body: p.body || null,
            accessory: p.accessory || null,
            accColor: p.accColor || '#FF6FB8'
          }))
        : [];
      state.active = Math.min(Number(parsed.active) || 0, Math.max(0, state.ponies.length - 1));
    } catch (e) { /* private mode etc. */ }
  }

  let saveTimer = null;
  function save() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
    }, 220);
  }

  /* ---------------------------------------------------------
     pony helpers
     --------------------------------------------------------- */
  function optsFor(p) {
    const t = PonyArt.byId(p.typeId);
    return {
      body: p.body || t.body,
      mane: p.mane || t.mane,
      tail: p.tail || p.mane || t.mane,
      accessory: p.accessory || null,
      accColor: p.accColor || '#FF6FB8'
    };
  }

  function activePony() {
    if (!state.ponies.length) {
      state.ponies.push({ typeId: 'rosie', mane: null, tail: null, body: null, accessory: null, accColor: '#FF6FB8' });
      state.active = 0;
    }
    if (state.active >= state.ponies.length) state.active = 0;
    return state.ponies[state.active];
  }

  /* ---------------------------------------------------------
     screens
     --------------------------------------------------------- */
  let current = 'welcome';
  const BG_FOR = {
    welcome: 'welcome', select: 'select', meadow: 'meadow',
    activity: 'activity', party: 'party'
  };

  function show(name) {
    if (name === current && document.querySelector(`.screen[data-screen="${name}"]`).classList.contains('is-active')) return;
    const prev = document.querySelector('.screen.is-active');
    const next = document.querySelector(`.screen[data-screen="${name}"]`);
    if (!next) return;

    if (prev && prev !== next) {
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      setTimeout(() => prev.classList.remove('is-leaving'), 320);
    }
    // restart entry animation
    next.classList.remove('is-active');
    void next.offsetWidth;
    next.classList.add('is-active');

    current = name;
    $('#app').dataset.bg = BG_FOR[name] || 'meadow';
    $('#app').classList.toggle('show-rainbow', name === 'party');
  }

  /* ---------------------------------------------------------
     stars
     --------------------------------------------------------- */
  function setStars(n) {
    state.stars = Math.max(0, n);
    $$('[data-stars]').forEach(el => {
      el.textContent = String(state.stars);
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    });
    save();
  }

  function addStars(n) { setStars(state.stars + n); }

  /* ---------------------------------------------------------
     speech bubble (meadow)
     --------------------------------------------------------- */
  let bubbleTimer = null;
  function say(text) {
    const b = $('#speechBubble');
    if (!b) return;
    b.textContent = text;
    b.classList.add('is-on');
    if (bubbleTimer) clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => b.classList.remove('is-on'), 2400);
  }

  let toastTimer = null;
  function toast(text) {
    const t = $('#toast');
    t.textContent = text;
    t.classList.add('is-on');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 1600);
  }

  /* ---------------------------------------------------------
     WELCOME
     --------------------------------------------------------- */
  function buildLogo() {
    const host = $('#logoPonies');
    if (!host) return;
    const picks = ['rosie', 'luna', 'rainbow'];
    host.innerHTML = picks.map(id => PonyArt.portrait(PonyArt.byId(id))).join('');
  }

  /* ---------------------------------------------------------
     CHARACTER SELECT
     --------------------------------------------------------- */
  let picked = [];

  function buildSelectGrid() {
    const grid = $('#selectGrid');
    if (!grid) return;
    grid.innerHTML = '';

    PonyArt.types.forEach(t => {
      const card = document.createElement('button');
      card.className = 'pet-card';
      card.dataset.typeId = t.id;
      card.setAttribute('aria-label', `${t.name}, ${t.tagline}`);
      card.innerHTML = `
        <span class="pet-card__art">${PonyArt.portrait(t)}</span>
        <span class="pet-card__name">${t.name} ${t.emoji}</span>
        <span class="pet-card__tag">${t.tagline}</span>
        <span class="pet-card__check">
          <svg viewBox="0 0 100 100"><path d="M22 52 L42 72 L80 28" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>`;

      card.addEventListener('click', () => {
        const idx = picked.indexOf(t.id);
        if (idx >= 0) {
          picked.splice(idx, 1);
          card.classList.remove('is-picked');
          Sound.play('pop');
        } else {
          if (picked.length >= 4) {
            toast('Pick up to 4 ponies');
            Sound.play('pop');
            return;
          }
          picked.push(t.id);
          card.classList.add('is-picked');
          Sound.play('sparkle');
          const r = card.getBoundingClientRect();
          Art.sparkleBurst(r.left + r.width / 2, r.top + r.height * 0.4, 10, { spread: 90 });
          Sound.say(t.name + '!');
        }
        refreshSelectDock();
      });

      grid.appendChild(card);
    });
    refreshSelectDock();
  }

  function refreshSelectDock() {
    const dock = $('#myPonies');
    const go = $('#btnGo');
    const grid = $('#selectGrid');
    if (grid) grid.classList.toggle('is-empty', picked.length === 0);
    if (!dock) return;
    dock.innerHTML = picked.map(id => {
      const t = PonyArt.byId(id);
      return `<span class="my-chip">${PonyArt.portrait(t)}</span>`;
    }).join('');
    if (go) go.disabled = picked.length === 0;
  }

  function enterSelect() {
    picked = state.ponies.map(p => p.typeId);
    $$('#selectGrid .pet-card').forEach(c => {
      c.classList.toggle('is-picked', picked.indexOf(c.dataset.typeId) >= 0);
    });
    refreshSelectDock();
    show('select');
    Sound.play('whoosh');
  }

  function confirmSelect() {
    if (!picked.length) return;
    const existing = {};
    state.ponies.forEach(p => { existing[p.typeId] = p; });

    const prevActiveId = state.ponies[state.active] ? state.ponies[state.active].typeId : null;

    const next = picked.map(id => {
      if (existing[id]) return existing[id];
      const t = PonyArt.byId(id);
      return { typeId: id, mane: null, tail: null, body: null, accessory: null, accColor: '#FF6FB8' };
    });

    state.ponies = next;
    const keep = next.findIndex(p => p.typeId === prevActiveId);
    state.active = keep >= 0 ? keep : 0;
    save();
    Sound.play('fanfare');
    enterMeadow(true);
  }

  /* ---------------------------------------------------------
     MEADOW
     --------------------------------------------------------- */
  let meadowCleanup = null;

  function renderMeadowPony() {
    const host = $('#meadowPony');
    if (!host) return;
    const p = activePony();
    const t = PonyArt.byId(p.typeId);
    host.innerHTML = PonyArt.svg(t, optsFor(p));
    const tag = $('#nameTag');
    if (tag) tag.textContent = t.name;
    renderSwitcher();
  }

  function renderSwitcher() {
    const sw = $('#ponySwitcher');
    if (!sw) return;
    if (state.ponies.length <= 1) { sw.innerHTML = ''; return; }
    sw.innerHTML = state.ponies.map((p, i) => {
      const t = PonyArt.byId(p.typeId);
      return `<button class="switch-chip${i === state.active ? ' is-active' : ''}" data-i="${i}" aria-label="${t.name}">
        ${PonyArt.portrait(t, optsFor(p))}
      </button>`;
    }).join('');

    sw.querySelectorAll('.switch-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const i = +chip.dataset.i;
        if (i === state.active) return;
        const host = $('#meadowPony');
        const r = centerOfEl(host);
        Art.sparkleBurst(r.x, r.y, 14, { spread: 130 });
        Sound.play('whoosh');
        state.active = i;
        save();
        renderMeadowPony();
        const t = PonyArt.byId(state.ponies[i].typeId);
        say('Hi ' + t.name + '!');
        Sound.say('Hello ' + t.name);
        const svg = $('#meadowPony .pony-svg');
        if (svg) {
          const rr = centerOfEl(host);
          Art.floatEmoji(rr.x, rr.y - 60, '💖', { size: 36 });
        }
      });
    });
  }

  function centerOfEl(node) {
    const r = node.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r };
  }

  function enterMeadow(fromSelect) {
    show('meadow');
    renderMeadowPony();
    setStars(state.stars);

    if (fromSelect) {
      const t = PonyArt.byId(activePony().typeId);
      say('Hello! I am ' + t.name);
      Sound.say('Hello, I am ' + t.name);
      const svg = $('#meadowPony .pony-svg');
      if (svg) {
        svg.classList.add('is-happy');
        setTimeout(() => svg.classList.remove('is-happy'), 1400);
      }
    }

    // petting
    const host = $('#meadowPony');
    if (!host) return;
    const onPet = e => {
      const svg = host.querySelector('.pony-svg');
      if (svg) {
        svg.classList.remove('is-happy');
        void svg.getBoundingClientRect();
        svg.classList.add('is-happy');
      }
      const r = centerOfEl(host);
      Art.floatEmoji(r.x + (Math.random() - .5) * 90, r.y - r.rect.height * 0.18, ['💖', '💕', '✨', '💫'][Math.floor(Math.random() * 4)], { size: 34 });
      Art.sparkleBurst(e.clientX || r.x, e.clientY || r.y, 6, { spread: 70, colors: ['#FFB6DC', '#FFFFFF', '#FFE27A'] });
      Sound.play('neigh');
    };
    host.addEventListener('pointerdown', onPet);
    meadowCleanup = () => host.removeEventListener('pointerdown', onPet);
  }

  /* ---------------------------------------------------------
     ACTIVITIES
     --------------------------------------------------------- */
  let activityCleanup = null;
  let activityEnv = null;

  function openActivity(id) {
    const def = Activities[id];
    if (!def) return;

    if (activityCleanup) { activityCleanup(); activityCleanup = null; }

    const p = activePony();
    const t = PonyArt.byId(p.typeId);
    const opts = optsFor(p);

    const stage = $('#actStage');
    const tray = $('#actTray');
    stage.innerHTML = '';
    tray.innerHTML = '';

    const host = document.createElement('div');
    host.className = 'pony-host';
    host.innerHTML = PonyArt.svg(t, opts);
    stage.appendChild(host);

    const title = $('#activityTitle');
    if (title) title.textContent = def.title;

    show('activity');
    Sound.play('whoosh');
    Sound.say(def.title);

    const env = {
      stage, tray, type: t, opts,
      pony: p,
      complete: ({ stars, cheer }) => finishActivity({ stars, cheer, def }),
      star: n => addStars(n),
      say: text => { say(text); toast(text); }
    };
    activityEnv = env;

    activityCleanup = def.mount(env) || null;
  }

  function closeActivity() {
    if (activityCleanup) { try { activityCleanup(); } catch (e) {} activityCleanup = null; }
    activityEnv = null;
    Sound.stopBrush();
    const stage = $('#actStage'); if (stage) stage.innerHTML = '';
    const tray = $('#actTray'); if (tray) tray.innerHTML = '';
    enterMeadow(false);
  }

  function finishActivity({ stars, cheer, def }) {
    if (activityCleanup) { try { activityCleanup(); } catch (e) {} activityCleanup = null; }

    // persist customisation made during the activity
    if (activityEnv) {
      const p = activityEnv.pony;
      const o = activityEnv.opts;
      p.body = o.body || null;
      p.mane = o.mane || null;
      p.tail = o.tail || null;
      p.accessory = o.accessory || null;
      p.accColor = o.accColor || p.accColor;
      save();
    }

    addStars(stars || 3);
    setTimeout(() => celebrate(cheer || CHEERS[Math.floor(Math.random() * CHEERS.length)]), 380);
  }

  /* ---------------------------------------------------------
     CELEBRATION
     --------------------------------------------------------- */
  let partyTimer = null;
  let partyFireTimer = null;

  function celebrate(cheer) {
    const p = activePony();
    const t = PonyArt.byId(p.typeId);

    $('#partyPony').innerHTML = PonyArt.svg(t, optsFor(p));
    const cheerEl = $('#partyCheer');
    cheerEl.textContent = cheer || 'Yay!';
    cheerEl.style.animation = 'none';
    void cheerEl.offsetWidth;
    cheerEl.style.animation = '';

    const sub = $('#partySub');
    if (sub) sub.textContent = t.name + ' is so happy!';

    show('party');
    Sound.play('fanfare');
    Sound.say(cheer || 'Yay!');

    const W = window.innerWidth, H = window.innerHeight;
    Art.confetti(46);

    // fireworks
    let shots = 0;
    if (partyFireTimer) clearInterval(partyFireTimer);
    partyFireTimer = setInterval(() => {
      if (current !== 'party') { clearInterval(partyFireTimer); partyFireTimer = null; return; }
      Art.firework(W * (0.15 + Math.random() * 0.7), H * (0.12 + Math.random() * 0.35));
      shots++;
      if (shots > 7) { clearInterval(partyFireTimer); partyFireTimer = null; }
    }, 420);

    // sparkle burst around pony
    const r = centerOfEl($('#partyPony'));
    Art.sparkleBurst(r.x, r.y, 26, { spread: 240 });
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        if (current !== 'party') return;
        const rr = centerOfEl($('#partyPony'));
        Art.floatEmoji(rr.x + (Math.random() - .5) * 260, rr.y + (Math.random() - .5) * 120,
          ['⭐', '✨', '💖', '🌈', '🌟'][i % 5], { size: 32 });
      }, i * 180);
    }

    // auto return so nobody gets stuck
    if (partyTimer) clearTimeout(partyTimer);
    partyTimer = setTimeout(() => leaveParty(), 7000);
  }

  function leaveParty() {
    if (partyTimer) { clearTimeout(partyTimer); partyTimer = null; }
    if (partyFireTimer) { clearInterval(partyFireTimer); partyFireTimer = null; }
    const st = $('#actStage'); if (st) st.innerHTML = '';
    const tr = $('#actTray'); if (tr) tr.innerHTML = '';
    show('meadow');
    renderMeadowPony();
    setStars(state.stars);
  }

  /* ---------------------------------------------------------
     SOUND TOGGLES
     --------------------------------------------------------- */
  function syncSoundButtons() {
    const m = $('#btnMusic'), s = $('#btnSfx');
    if (m) m.setAttribute('aria-pressed', String(state.music));
    if (s) s.setAttribute('aria-pressed', String(state.sfx));
  }

  function initSound() {
    Sound.setMusic(state.music);
    Sound.setSfx(state.sfx);
    syncSoundButtons();

    $('#btnMusic').addEventListener('click', () => {
      state.music = !state.music;
      Sound.unlock();
      Sound.setMusic(state.music);
      syncSoundButtons();
      save();
      if (state.music) Sound.play('chime');
    });

    $('#btnSfx').addEventListener('click', () => {
      state.sfx = !state.sfx;
      Sound.unlock();
      Sound.setSfx(state.sfx);
      syncSoundButtons();
      save();
      if (state.sfx) Sound.play('sparkle');
    });
  }

  /* ---------------------------------------------------------
     BOOT
     --------------------------------------------------------- */
  function bind() {
    $('#btnPlay').addEventListener('click', () => {
      Sound.unlock();
      Sound.play('fanfare');
      enterSelect();
    });

    $('#btnGo').addEventListener('click', () => {
      if (!picked.length) return;
      Sound.unlock();
      confirmSelect();
    });

    $$('#activityDock .act-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.unlock();
        openActivity(btn.dataset.act);
      });
    });

    $('#btnCloseActivity').addEventListener('click', () => {
      Sound.play('pop');
      closeActivity();
    });

    $$('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const dest = btn.dataset.nav;
        Sound.play('pop');
        if (dest === 'welcome') { show('welcome'); return; }
        if (dest === 'select') { enterSelect(); return; }
        if (dest === 'meadow') { enterMeadow(false); return; }
      });
    });

    $('#btnContinue').addEventListener('click', () => {
      Sound.play('tap');
      leaveParty();
    });

    // tap anywhere on the party screen to continue
    $('.screen--party').addEventListener('pointerdown', e => {
      if (e.target.closest('#btnContinue')) return;
      leaveParty();
    });

    // first gesture unlocks audio
    const unlockOnce = () => {
      Sound.unlock();
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
    };
    window.addEventListener('pointerdown', unlockOnce);
    window.addEventListener('keydown', unlockOnce);

    // block iOS pinch-zoom / double-tap zoom / long-press menus
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => {
      document.addEventListener(ev, e => e.preventDefault(), { passive: false });
    });
    document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
    document.addEventListener('contextmenu', e => e.preventDefault());

    // keep the viewport steady when the URL bar collapses
    let lastH = window.innerHeight;
    window.addEventListener('resize', () => {
      const h = window.innerHeight;
      if (Math.abs(h - lastH) > 140) { lastH = h; }
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(() => { lastH = window.innerHeight; }, 300);
    });

    // pause audio when the tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        Sound.stopBrush();
      } else if (state.music) {
        Sound.unlock();
      }
    });
  }

  function init() {
    load();
    Art.buildScenery();
    buildLogo();
    buildSelectGrid();
    initSound();
    bind();
    setStars(state.stars);
    syncSoundButtons();
    show('welcome');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();