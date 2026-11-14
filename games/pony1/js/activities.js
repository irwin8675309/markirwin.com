/* =========================================================
   activities.js — brush, feed, bath, decorate, makeover
   ========================================================= */
(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  /* ---------- helpers ---------- */
  function svgPoint(svg, clientX, clientY) {
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const inv = ctm.inverse();
    if (typeof DOMPoint === 'function') {
      const p = new DOMPoint(clientX, clientY).matrixTransform(inv);
      return { x: p.x, y: p.y };
    }
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const r = pt.matrixTransform(inv);
    return { x: r.x, y: r.y };
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function makeGhost(iconHTML, size) {
    const g = el('div', 'drag-ghost');
    g.style.width = size + 'px';
    g.style.height = size + 'px';
    g.innerHTML = iconHTML;
    document.body.appendChild(g);
    return g;
  }

  function moveGhost(g, x, y) {
    g.style.left = x + 'px';
    g.style.top = y + 'px';
  }

  function killGhost(g) {
    if (!g) return;
    g.style.transition = 'opacity .18s, transform .18s';
    g.style.opacity = '0';
    g.style.transform = 'translate(-50%,-50%) scale(.4)';
    setTimeout(() => g.remove(), 220);
  }

  function centerOf(node) {
    const r = node.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r };
  }

  function pipsHTML(total, done) {
    let s = '';
    for (let i = 0; i < total; i++) s += `<span class="pip${i < done ? ' is-on' : ''}"></span>`;
    return s;
  }

  /* =========================================================
     BRUSH
     ========================================================= */
  const MANE_BOX = { x1: 200, y1: 44, x2: 350, y2: 280 };
  const BRUSH_TARGET = 120;

  const BrushActivity = {
    id: 'brush',
    title: 'Brush the Mane',

    mount(env) {
      const { stage, tray } = env;
      let progress = 0;
      let last = null;
      let down = false;
      let tickAt = 0;

      const pipsWrap = el('div', 'pips act-pips', pipsHTML(4, 0));
      stage.appendChild(pipsWrap);

      const cursor = el('div', 'brush-cursor', PonyArt.types ? window.Art.icons.brush : '');
      document.body.appendChild(cursor);
      cursor.style.display = 'none';

      const shine = () => {
        const svg = stage.querySelector('.pony-svg');
        if (!svg) return;
        const sh = svg.querySelector('.pony-shine');
        if (sh) sh.setAttribute('opacity', String(Math.min(1, progress / BRUSH_TARGET) * 0.85));
      };

      const addProgress = (amount, clientX, clientY) => {
        const before = progress;
        progress = Math.min(BRUSH_TARGET, progress + amount);
        const doneNow = Math.floor(progress / (BRUSH_TARGET / 4));
        const doneBefore = Math.floor(before / (BRUSH_TARGET / 4));
        if (doneNow > doneBefore) {
          pipsWrap.innerHTML = pipsHTML(4, doneNow);
          Sound.play('sparkle');
        }
        if (clientX != null) {
          Art.sparkleBurst(clientX, clientY, 5, { spread: 55, colors: ['#FFFFFF', '#FFE27A', '#FFB6DC'] });
        }
        shine();
        if (progress >= BRUSH_TARGET) finish();
      };

      let finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        Sound.stopBrush();
        const svg = stage.querySelector('.pony-svg');
        if (svg) {
          svg.classList.add('is-happy', 'is-shiny');
          const r = centerOf(svg);
          Art.sparkleBurst(r.x, r.y - r.rect.height * 0.25, 22, { spread: 190 });
          for (let i = 0; i < 6; i++) {
            setTimeout(() => Art.floatEmoji(r.x + (Math.random() - .5) * 160, r.y - 40, '✨', { size: 30 }), i * 90);
          }
        }
        Sound.play('success');
        env.complete({ stars: 3, cheer: 'So shiny!' });
      }

      const onDown = e => {
        if (finished) return;
        down = true;
        last = { x: e.clientX, y: e.clientY };
        cursor.style.display = 'block';
        moveCursor(e.clientX, e.clientY);
        Sound.startBrush();
        e.preventDefault();
      };

      const moveCursor = (x, y) => {
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
      };

      const onMove = e => {
        if (!down || finished) return;
        moveCursor(e.clientX, e.clientY);
        const pt = svgPoint(stage.querySelector('.pony-svg'), e.clientX, e.clientY);
        const inMane = pt.x > MANE_BOX.x1 && pt.x < MANE_BOX.x2 && pt.y > MANE_BOX.y1 && pt.y < MANE_BOX.y2;
        if (inMane && last) {
          const dx = e.clientX - last.x, dy = e.clientY - last.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1.2) addProgress(dist * 0.85, e.clientX, e.clientY);
        }
        last = { x: e.clientX, y: e.clientY };
        if (e.cancelable) e.preventDefault();
      };

      const onUp = () => {
        down = false;
        last = null;
        cursor.style.display = 'none';
        Sound.stopBrush();
      };

      stage.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);

      // tap-only fallback for very young players
      const onTap = e => {
        if (finished) return;
        const pt = svgPoint(stage.querySelector('.pony-svg'), e.clientX, e.clientY);
        if (pt.x > MANE_BOX.x1 && pt.x < MANE_BOX.x2 && pt.y > MANE_BOX.y1 && pt.y < MANE_BOX.y2) {
          addProgress(14, e.clientX, e.clientY);
        }
      };
      stage.addEventListener('click', onTap);

      return () => {
        stage.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        stage.removeEventListener('click', onTap);
        cursor.remove();
        pipsWrap.remove();
        Sound.stopBrush();
      };
    }
  };

  /* =========================================================
     FEED
     ========================================================= */
  const MOUTH = { x: 340, y: 172, r: 78 };

  const FEED_ITEMS = [
    { id: 'apple', icon: 'apple', label: 'Apple' },
    { id: 'carrot', icon: 'carrot', label: 'Carrot' },
    { id: 'sugar', icon: 'sugar', label: 'Sugar' }
  ];

  const FeedActivity = {
    id: 'feed',
    title: 'Yummy Time',
    NEED: 3,

    mount(env) {
      const { stage, tray } = env;
      let eaten = 0;
      let finished = false;

      const pipsWrap = el('div', 'pips act-pips', pipsHTML(3, 0));
      stage.appendChild(pipsWrap);

      const hint = el('div', 'drop-hint');
      const svgEl = stage.querySelector('.pony-svg');
      const wrap = svgEl.parentNode;
      wrap.style.position = 'relative';
      const r = svgEl.getBoundingClientRect();
      const scale = r.width / 400;
      hint.style.width = (MOUTH.r * 2 * scale) + 'px';
      hint.style.height = (MOUTH.r * 2 * scale) + 'px';
      hint.style.left = (MOUTH.x * scale - MOUTH.r * scale) + 'px';
      hint.style.top = (MOUTH.y * scale - MOUTH.r * scale) + 'px';
      wrap.appendChild(hint);

      FEED_ITEMS.forEach(item => {
        const b = el('button', 'tray-item', `<span class="tray-item__art">${window.Art.icons[item.icon]}</span>`);
        b.setAttribute('aria-label', item.label);
        b.dataset.item = item.id;
        tray.appendChild(b);
      });

      const say = t => env.say(t);

      function eatAt(clientX, clientY) {
        if (finished) return;
        const pt = svgPoint(svgEl, clientX, clientY);
        const d = Math.hypot(pt.x - MOUTH.x, pt.y - MOUTH.y);
        if (d > MOUTH.r) return false;

        eaten++;
        pipsWrap.innerHTML = pipsHTML(3, eaten);
        Sound.play('eat');
        setTimeout(() => Sound.play('yum'), 220);
        svgEl.classList.remove('is-chewing');
        void svgEl.offsetWidth;
        svgEl.classList.add('is-chewing');

        const r2 = centerOf(svgEl);
        Art.sparkleBurst(clientX, clientY, 8, { spread: 70, colors: ['#FFE27A', '#FFFFFF', '#9DF0B6'] });
        Art.floatEmoji(clientX, clientY - 20, ['😋', '💛', '✨'][eaten % 3], { size: 32 });
        env.star(1);
        say(['Yum!', 'Mmm!', 'More please!'][eaten % 3]);

        if (eaten >= 3) {
          finished = true;
          svgEl.classList.add('is-happy');
          Sound.play('success');
          setTimeout(() => env.complete({ stars: 3, cheer: 'Yummy!' }), 520);
        }
        return true;
      }

      function attachDrag(btn) {
        let ghost = null;
        let dragging = false;

        const down = e => {
          if (finished) return;
          dragging = true;
          const r = btn.getBoundingClientRect();
          const icon = btn.querySelector('svg');
          ghost = makeGhost(icon ? icon.outerHTML : btn.innerHTML, r.width * 0.95);
          moveGhost(ghost, e.clientX, e.clientY);
          hint.classList.add('is-on');
          Sound.play('tap');
          e.preventDefault();
        };
        const move = e => {
          if (!dragging || !ghost) return;
          moveGhost(ghost, e.clientX, e.clientY);
        };
        const up = e => {
          if (!dragging) return;
          dragging = false;
          hint.classList.remove('is-on');
          const ok = eatAt(e.clientX, e.clientY);
          killGhost(ghost);
          ghost = null;
          if (!ok) Sound.play('pop');
        };

        btn.addEventListener('pointerdown', down);
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        btn._cleanup = () => {
          btn.removeEventListener('pointerdown', down);
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
        };
      }

      Array.from(tray.children).forEach(attachDrag);

      // tap fallback: tap food then tap the pony's mouth
      let armed = null;
      tray.addEventListener('click', e => {
        const btn = e.target.closest('.tray-item');
        if (!btn || finished) return;
        armed = btn;
        tray.querySelectorAll('.tray-item').forEach(b => b.classList.toggle('is-picked', b === btn));
      });
      const stageTap = e => {
        if (!armed) return;
        if (eatAt(e.clientX, e.clientY)) {
          armed.classList.remove('is-picked');
          armed = null;
        }
      };
      stage.addEventListener('click', stageTap);

      return () => {
        Array.from(tray.children).forEach(b => b._cleanup && b._cleanup());
        stage.removeEventListener('click', stageTap);
        hint.remove();
        pipsWrap.remove();
        if (ghost) ghost.remove();
      };
    }
  };

  /* =========================================================
     BATH
     ========================================================= */
  const DIRT_SPOTS = [
    [150, 250, 22, 16, -12], [212, 292, 19, 14, 8], [118, 300, 16, 12, 20],
    [252, 232, 17, 13, -6], [178, 214, 14, 11, 0], [96, 268, 13, 10, 14],
    [258, 186, 13, 10, -18], [300, 118, 12, 9, 10], [206, 330, 14, 10, 4]
  ];

  const BathActivity = {
    id: 'bath',
    title: 'Bubble Bath',

    mount(env) {
      const { stage, tray } = env;
      let remaining = DIRT_SPOTS.length;
      let down = false;
      let finished = false;
      let lastBubble = 0;

      const svgEl = stage.querySelector('.pony-svg');
      const dirtGroup = svgEl.querySelector('.pony-dirt');

      DIRT_SPOTS.forEach(([x, y, rx, ry, rot], i) => {
        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('class', 'dirt-spot');
        g.dataset.i = String(i);
        g.innerHTML = `
          <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#A87B52" transform="rotate(${rot} ${x} ${y})"/>
          <ellipse cx="${x - rx * 0.25}" cy="${y - ry * 0.3}" rx="${rx * 0.5}" ry="${ry * 0.45}" fill="#C09368" opacity=".85" transform="rotate(${rot} ${x} ${y})"/>
        `;
        dirtGroup.appendChild(g);
      });

      const pipsWrap = el('div', 'pips act-pips', pipsHTML(5, 0));
      stage.appendChild(pipsWrap);

      const cursor = el('div', 'sponge-cursor', window.Art.icons.sponge);
      document.body.appendChild(cursor);
      cursor.style.display = 'none';

      const bubbleTimer = setInterval(() => {
        if (finished) return;
        const r = svgEl.getBoundingClientRect();
        const bx = r.left + Math.random() * r.width;
        const by = r.top + r.height * (0.45 + Math.random() * 0.45);
        Art.bubble(bx, by, 12 + Math.random() * 24);
      }, 260);

      function rub(clientX, clientY) {
        const pt = svgPoint(svgEl, clientX, clientY);
        let hit = false;
        dirtGroup.querySelectorAll('.dirt-spot:not(.is-gone)').forEach(spot => {
          const i = +spot.dataset.i;
          const [x, y, rx, ry] = DIRT_SPOTS[i];
          const d = Math.hypot((pt.x - x) / (rx + 26), (pt.y - y) / (ry + 26));
          if (d < 1) {
            spot.classList.add('is-gone');
            hit = true;
            remaining--;
            const done = DIRT_SPOTS.length - remaining;
            pipsWrap.innerHTML = pipsHTML(5, Math.min(5, Math.floor(done / 2) + (done >= 9 ? 1 : 0)));
            Art.bubble(clientX, clientY, 26);
            Art.sparkleBurst(clientX, clientY, 6, { spread: 60, colors: ['#FFFFFF', '#C6EEFF', '#EAF9FF'] });
            Sound.play('pop');
            if (remaining <= 0) finish();
          }
        });
        return hit;
      }

      function finish() {
        if (finished) return;
        finished = true;
        clearInterval(bubbleTimer);
        cursor.style.display = 'none';
        Sound.play('splash');
        svgEl.classList.add('is-happy', 'is-clean', 'is-shiny');
        const r = centerOf(svgEl);
        Art.sparkleBurst(r.x, r.y - r.rect.height * 0.2, 24, { spread: 210 });
        for (let i = 0; i < 8; i++) {
          setTimeout(() => Art.bubble(r.x + (Math.random() - .5) * r.rect.width * .8, r.y + r.rect.height * .2, 18 + Math.random() * 20), i * 110);
        }
        Sound.play('success');
        env.complete({ stars: 4, cheer: 'Squeaky clean!' });
      }

      const onDown = e => {
        if (finished) return;
        down = true;
        cursor.style.display = 'block';
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        Sound.startBrush();
        e.preventDefault();
      };
      const onMove = e => {
        if (!down || finished) return;
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        rub(e.clientX, e.clientY);
        if (e.cancelable) e.preventDefault();
      };
      const onUp = () => { down = false; cursor.style.display = 'none'; Sound.stopBrush(); };

      stage.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);

      const tapFallback = e => {
        if (finished) return;
        const pt = svgPoint(svgEl, e.clientX, e.clientY);
        rub(e.clientX, e.clientY);
      };
      stage.addEventListener('click', tapFallback);

      return () => {
        clearInterval(bubbleTimer);
        stage.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        stage.removeEventListener('click', tapFallback);
        cursor.remove();
        pipsWrap.remove();
        Sound.stopBrush();
      };
    }
  };

  /* =========================================================
     DECORATE
     ========================================================= */
  const ACCESSORIES = [
    { id: null, icon: 'none', label: 'None' },
    { id: 'bow', icon: 'bow', label: 'Bow', color: '#FF6FB8' },
    { id: 'ribbon', icon: 'ribbon', label: 'Ribbon', color: '#8FD8FF' },
    { id: 'flower', icon: 'flower', label: 'Flower', color: '#FFB6DC' },
    { id: 'crown', icon: 'crown', label: 'Crown', color: '#FFD34D' },
    { id: 'starclip', icon: 'star', label: 'Star', color: '#FFE27A' },
    { id: 'necklace', icon: 'necklace', label: 'Necklace', color: '#B18CFF' },
    { id: 'hornstar', icon: 'hornstar', label: 'Horn Star', color: '#FFE27A', unicornOnly: true }
  ];

  const MANE_COLORS = [
    '#FF6FB8', '#FF9A3C', '#FFE27A', '#7EDB96', '#5FD0E8', '#7FA8FF', '#B18CFF', '#FFFFFF', '#5B3A63'
  ];

  const DecorateActivity = {
    id: 'decorate',
    title: 'Dress Up',

    mount(env) {
      const { stage, tray } = env;
      const state = {
        accessory: env.opts.accessory || null,
        accColor: env.opts.accColor || '#FF6FB8',
        mane: env.opts.mane || env.type.mane,
        tail: env.opts.tail || env.type.mane
      };

      const svgHost = stage.querySelector('.pony-host');
      const pipsWrap = el('div', 'pips act-pips', '');
      stage.appendChild(pipsWrap);

      function render() {
        svgHost.innerHTML = PonyArt.svg(env.type, {
          accessory: state.accessory,
          accColor: state.accColor,
          mane: state.mane,
          tail: state.tail
        });
      }
      render();

      // accessory row
      const accRow = el('div', 'tray-row');
      const accList = ACCESSORIES.filter(a => !a.unicornOnly || env.type.horn);
      accList.forEach(a => {
        const b = el('button', 'tray-item tray-item--sm');
        b.setAttribute('aria-label', a.label);
        if (a.id === 'none') {
          b.innerHTML = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="none" stroke="#D9B6D8" stroke-width="7" stroke-dasharray="10 9"/><path d="M32 32 L68 68" stroke="#E86A9A" stroke-width="8" stroke-linecap="round"/></svg>`;
        } else if (a.id === 'crown') {
          b.innerHTML = `<svg viewBox="0 0 100 100"><path d="M18 74 L18 40 L34 56 L50 28 L66 56 L82 40 L82 74 Z" fill="#FFC12E" stroke="#E8A21C" stroke-width="5" stroke-linejoin="round"/><circle cx="50" cy="46" r="6" fill="#FF8ECB"/><circle cx="30" cy="58" r="4.4" fill="#8FD8FF"/><circle cx="70" cy="58" r="4.4" fill="#9DF0B6"/></svg>`;
        } else if (a.id === 'necklace') {
          b.innerHTML = `<svg viewBox="0 0 100 100"><path d="M20 34 Q 50 84 80 34" stroke="#B18CFF" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="50" cy="66" r="11" fill="#FFD34D" stroke="#fff" stroke-width="4"/></svg>`;
        } else if (a.id === 'flower') {
          b.innerHTML = `<svg viewBox="0 0 100 100">${PonyArt.flowerSVG(50, 48, 26, '#FFB6DC', '#FFD34D')}</svg>`;
        } else if (a.id === 'starclip') {
          b.innerHTML = `<svg viewBox="0 0 100 100"><path d="${PonyArt.starPath(50, 48, 32)}" fill="#FFE27A" stroke="#fff" stroke-width="5" stroke-linejoin="round"/></svg>`;
        } else if (a.id === 'ribbon') {
          b.innerHTML = `<svg viewBox="0 0 100 100"><g transform="translate(50 42) rotate(-8)">
            <path d="M0 0 C -22 -16 -34 6 -8 14 Z" fill="#8FD8FF"/>
            <path d="M0 0 C 20 -16 32 6 6 14 Z" fill="#8FD8FF"/>
            <path d="M-6 10 C -14 34 -6 50 2 54 C 10 50 15 34 7 10 Z" fill="#5FBCE8"/>
            <path d="M6 10 C 16 30 25 41 33 43 C 32 33 22 16 12 6 Z" fill="#7FCBF0"/>
            <circle cx="0" cy="2" r="6.5" fill="#C6EEFF"/>
          </g></svg>`;
        } else if (a.id === 'hornstar') {
          b.innerHTML = `<svg viewBox="0 0 100 100">
            <path d="M50 84 L44 62 L56 62 Z" fill="#FFD86B"/>
            <path d="${PonyArt.starPath(50, 40, 30)}" fill="#FFE27A" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>
            <circle cx="50" cy="40" r="6" fill="#FFF6C9"/></svg>`;
        } else {
          b.innerHTML = `<svg viewBox="0 0 100 100">${PonyArt.bowSVG(50, 52, 30, '#FF6FB8', '#E85FAE', 0)}</svg>`;
        }
        b.addEventListener('click', () => {
          state.accessory = a.id;
          state.accColor = a.color || '#FF6FB8';
          accRow.querySelectorAll('.tray-item').forEach(x => x.classList.remove('is-picked'));
          b.classList.add('is-picked');
          render();
          Sound.play('pop');
          const r = centerOf(svgHost);
          Art.sparkleBurst(r.x, r.y, 8, { spread: 80 });
          env.star(1);
        });
        accRow.appendChild(b);
      });

      // colour row
      const colRow = el('div', 'tray-row');
      MANE_COLORS.forEach(c => {
        const b = el('button', 'tray-swatch');
        b.style.background = c;
        b.setAttribute('aria-label', 'Colour ' + c);
        b.addEventListener('click', () => {
          state.mane = c;
          state.tail = c;
          colRow.querySelectorAll('.tray-swatch').forEach(x => x.classList.remove('is-picked'));
          b.classList.add('is-picked');
          render();
          Sound.play('chime');
          const r = centerOf(svgHost);
          Art.sparkleBurst(r.x, r.y - r.rect.height * 0.3, 14, { spread: 130, colors: [c, '#FFFFFF', '#FFE27A'] });
          env.star(1);
        });
        colRow.appendChild(b);
      });

      const done = el('button', 'tray-done', `<svg viewBox="0 0 100 100"><path d="M22 52 L42 72 L80 28" stroke="#fff" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
      done.setAttribute('aria-label', 'All done');
      done.addEventListener('click', () => {
        env.opts.accessory = state.accessory;
        env.opts.accColor = state.accColor;
        env.opts.mane = state.mane;
        env.opts.tail = state.tail;
        Sound.play('success');
        const r = centerOf(svgHost);
        Art.sparkleBurst(r.x, r.y, 20, { spread: 180 });
        env.complete({ stars: 2, cheer: 'Beautiful!' });
      });

      tray.appendChild(accRow);
      tray.appendChild(colRow);
      tray.appendChild(done);

      return () => {
        accRow.remove(); colRow.remove(); done.remove(); pipsWrap.remove();
      };
    }
  };

  /* =========================================================
     MAKEOVER
     ========================================================= */
  const MAGIC_COLORS = [
    { name: 'Rose',    body: '#FFC6E2', mane: '#FF4FA3' },
    { name: 'Lilac',   body: '#DCC8FF', mane: '#8B5CF6' },
    { name: 'Ocean',   body: '#BEE9FF', mane: '#2FA8E0' },
    { name: 'Mint',    body: '#C4F7DC', mane: '#2FC98A' },
    { name: 'Sunbeam', body: '#FFF0BE', mane: '#FFB020' },
    { name: 'Peach',   body: '#FFD9C2', mane: '#FF7A45' }
  ];

  const MakeoverActivity = {
    id: 'makeover',
    title: 'Magical Makeover',
    NEED: 5,

    mount(env) {
      const { stage, tray } = env;
      let taps = 0;
      let finished = false;
      const svgHost = stage.querySelector('.pony-host');
      let current = { body: env.opts.body || env.type.body, mane: env.opts.mane || env.type.mane, tail: env.type.mane };

      const pipsWrap = el('div', 'pips act-pips', pipsHTML(5, 0));
      stage.appendChild(pipsWrap);

      function render() {
        svgHost.innerHTML = PonyArt.svg(env.type, {
          body: current.body,
          mane: current.mane,
          tail: current.tail,
          accessory: env.opts.accessory,
          accColor: env.opts.accColor
        });
      }
      render();

      const row = el('div', 'tray-row');
      MAGIC_COLORS.forEach((c, i) => {
        const b = el('button', 'tray-orb');
        b.style.setProperty('--c1', c.body);
        b.style.setProperty('--c2', c.mane);
        b.setAttribute('aria-label', c.name);
        b.addEventListener('click', () => {
          if (finished) return;
          taps++;
          current.body = c.body;
          current.mane = c.mane;
          current.tail = c.mane;
          render();

          const svg = svgHost.querySelector('.pony-svg');
          if (svg) {
            svg.classList.remove('is-happy');
            void svg.getBoundingClientRect();
            svg.classList.add('is-happy');
          }

          const r = centerOf(svgHost);
          const cx = r.x, cy = r.y - r.rect.height * 0.18;
          Art.sparkleBurst(cx, cy, 20, { spread: 210, colors: [c.mane, c.body, '#FFFFFF', '#FFE27A', '#8FD8FF'] });
          for (let k = 0; k < 4; k++) {
            setTimeout(() => Art.floatEmoji(cx + (Math.random() - .5) * 180, cy, ['✨', '⭐', '💫', '🌟'][k % 4], { size: 30 }), k * 80);
          }
          Art.firework(cx + (Math.random() - .5) * 220, cy - 40);
          Sound.play('sparkle');
          setTimeout(() => Sound.play('chime'), 140);
          Sound.play('neigh');
          pipsWrap.innerHTML = pipsHTML(5, Math.min(5, taps));
          env.star(1);
          env.say(['Magical!', 'Sparkle!', 'Wow!', 'Pretty!'][taps % 4]);

          if (taps >= 5) {
            finished = true;
            setTimeout(() => {
              env.opts.body = current.body;
              env.opts.mane = current.mane;
              env.opts.tail = current.tail;
              env.complete({ stars: 4, cheer: 'Pure Magic!' });
            }, 620);
          }
        });
        row.appendChild(b);
      });
      tray.appendChild(row);

      return () => { row.remove(); pipsWrap.remove(); };
    }
  };

  /* =========================================================
     REGISTRY
     ========================================================= */
  window.Activities = {
    brush: BrushActivity,
    feed: FeedActivity,
    bath: BathActivity,
    decorate: DecorateActivity,
    makeover: MakeoverActivity
  };
})();