/* =========================================================
   art.js — scenery, icons and particle effects
   ========================================================= */
(function () {
  'use strict';

  const fxLayer = () => document.getElementById('fx');
  let liveParticles = 0;
  const MAX_PARTICLES = 90;

  /* =========================================================
     SCENERY
     ========================================================= */

  function castleSVG(opts) {
    opts = opts || {};
    const wall = opts.wall || '#F8EBFF';
    const wallDark = opts.wallDark || '#E4CBF7';
    const roofA = opts.roofA || '#FFA8D8';
    const roofB = opts.roofB || '#C4A0F2';
    const gold = '#FFD86B';

    const cone = (cx, baseY, w, h, fill, dark) =>
      `<path d="M ${cx - w / 2} ${baseY} L ${cx} ${baseY - h} L ${cx + w / 2} ${baseY} Z" fill="${fill}"/>
       <path d="M ${cx} ${baseY - h} L ${cx + w / 2} ${baseY} L ${cx} ${baseY} Z" fill="${dark}" opacity=".55"/>`;

    const flag = (cx, y, c) =>
      `<rect x="${cx - 1.6}" y="${y - 34}" width="3.2" height="36" rx="1.6" fill="${gold}"/>
       <path d="M ${cx + 1.6} ${y - 34} L ${cx + 26} ${y - 27} L ${cx + 1.6} ${y - 18} Z" fill="${c}"/>`;

    const windowArch = (cx, cy, w, h) =>
      `<path d="M ${cx - w / 2} ${cy + h / 2} L ${cx - w / 2} ${cy - h / 6} Q ${cx} ${cy - h * 0.85} ${cx + w / 2} ${cy - h / 6} L ${cx + w / 2} ${cy + h / 2} Z" fill="${gold}" opacity=".92"/>`;

    return `<svg viewBox="0 0 320 350" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="castleWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${wall}"/>
          <stop offset="100%" stop-color="${wallDark}"/>
        </linearGradient>
      </defs>

      <!-- side towers -->
      <rect x="28" y="196" width="62" height="154" rx="10" fill="url(#castleWall)"/>
      <rect x="230" y="196" width="62" height="154" rx="10" fill="url(#castleWall)"/>
      ${cone(59, 198, 78, 74, roofB, '#9C77D8')}
      ${cone(261, 198, 78, 74, roofB, '#9C77D8')}
      ${flag(59, 126, '#FF8ECB')}
      ${flag(261, 126, '#FF8ECB')}

      <!-- main keep -->
      <rect x="104" y="132" width="112" height="218" rx="12" fill="url(#castleWall)"/>
      ${cone(160, 134, 138, 108, roofA, '#E070AE')}
      ${flag(160, 26, '#FFE27A')}

      <!-- battlements -->
      <g fill="${wall}">
        <rect x="104" y="120" width="20" height="20" rx="4"/>
        <rect x="140" y="120" width="20" height="20" rx="4"/>
        <rect x="176" y="120" width="20" height="20" rx="4"/>
      </g>

      <!-- windows -->
      ${windowArch(160, 200, 30, 44)}
      ${windowArch(59, 262, 24, 34)}
      ${windowArch(261, 262, 24, 34)}

      <!-- door -->
      <path d="M 136 350 L 136 300 Q 160 268 184 300 L 184 350 Z" fill="${roofB}"/>
      <path d="M 160 282 L 160 350" stroke="${gold}" stroke-width="2.6" opacity=".8"/>
      <circle cx="176" cy="322" r="3.4" fill="${gold}"/>

      <!-- little banner -->
      <path d="M 96 160 q 12 -14 24 0 q 12 -14 24 0" stroke="${roofA}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>
    </svg>`;
  }

  function treeSVG(x, y, s, c1, c2) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <rect x="-10" y="-10" width="20" height="66" rx="9" fill="#C08F63"/>
      <rect x="-10" y="-10" width="8" height="66" rx="4" fill="#A97A50" opacity=".55"/>
      <circle cx="-30" cy="-12" r="31" fill="${c1}"/>
      <circle cx="30" cy="-12" r="31" fill="${c1}"/>
      <circle cx="0" cy="-34" r="42" fill="${c1}"/>
      <circle cx="-12" cy="-48" r="24" fill="${c2}" opacity=".5"/>
      <circle cx="18" cy="-24" r="16" fill="${c2}" opacity=".35"/>
    </g>`;
  }

  function bushSVG(x, y, s, c) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <ellipse cx="-22" cy="0" rx="26" ry="20" fill="${c}"/>
      <ellipse cx="22" cy="0" rx="26" ry="20" fill="${c}"/>
      <ellipse cx="0" cy="-10" rx="30" ry="24" fill="${c}"/>
    </g>`;
  }

  function flowerSVG(x, y, s, petal, center) {
    let p = '';
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
      p += `<circle cx="${(Math.cos(a) * 5).toFixed(2)}" cy="${(Math.sin(a) * 5).toFixed(2)}" r="4.2" fill="${petal}"/>`;
    }
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <rect x="-1.4" y="0" width="2.8" height="16" rx="1.4" fill="#63B97F"/>
      ${p}
      <circle cx="0" cy="0" r="3.2" fill="${center}"/>
    </g>`;
  }

  function buildScenery() {
    const layer = document.getElementById('bgLayer');
    if (!layer) return;

    const petals = ['#FFB6DC', '#FFE27A', '#C4B5FF', '#FFFFFF', '#FF9EC4'];
    let flowers = '';
    const spots = [
      [70, 726], [130, 748], [196, 722], [268, 752], [330, 728], [402, 754],
      [470, 724], [540, 750], [612, 726], [686, 752], [752, 724], [826, 750],
      [900, 726], [968, 752], [1040, 724], [1108, 748], [1160, 722]
    ];
    spots.forEach(([x, y], i) => {
      flowers += flowerSVG(x, y, 1.5 + (i % 3) * 0.35, petals[i % petals.length], '#FFD34D');
    });

    layer.innerHTML = `
<svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#CDF3DA"/><stop offset="100%" stop-color="#A8E6BE"/>
    </linearGradient>
    <linearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#A8EBBB"/><stop offset="100%" stop-color="#7FD79E"/>
    </linearGradient>
    <linearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8FE3AC"/><stop offset="100%" stop-color="#63C98C"/>
    </linearGradient>
    <linearGradient id="pathG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFE9C9"/><stop offset="100%" stop-color="#F6D3A4"/>
    </linearGradient>
    <radialGradient id="cloudG" cx="42%" cy="34%" r="70%">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#E8F6FF"/>
    </radialGradient>
  </defs>

  <!-- far hills -->
  <path d="M -40 660 Q 180 566 400 626 Q 600 682 800 610 Q 1000 540 1240 632 L 1240 820 L -40 820 Z" fill="url(#hillFar)"/>

  <!-- distant castle -->
  <g transform="translate(760 452) scale(.82)" opacity=".9">
    ${castleSVG({ wall: '#FBF0FF', wallDark: '#E9D6FA', roofA: '#FFB6DC', roofB: '#C9A8F5' })}
  </g>

  <!-- trees on far hill -->
  ${treeSVG(150, 636, 1.05, '#9FE6B8', '#C8F5D8')}
  ${treeSVG(232, 654, .8, '#8FDDA9', '#B9EFCB')}
  ${treeSVG(1060, 640, .95, '#9FE6B8', '#C8F5D8')}
  ${treeSVG(1140, 660, .72, '#8FDDA9', '#B9EFCB')}

  <!-- mid hills -->
  <path d="M -40 706 Q 200 640 440 692 Q 700 748 940 682 Q 1100 640 1240 692 L 1240 820 L -40 820 Z" fill="url(#hillMid)"/>

  <!-- path to castle -->
  <path d="M 560 820 Q 620 760 700 726 Q 760 700 812 690 L 860 700 Q 790 716 736 748 Q 668 788 640 820 Z"
        fill="url(#pathG)" opacity=".85"/>

  <!-- bushes -->
  ${bushSVG(340, 706, 1, '#7ED79E')}
  ${bushSVG(880, 700, .85, '#7ED79E')}

  <!-- near hill -->
  <path d="M -40 764 Q 220 706 480 752 Q 740 798 1000 744 Q 1130 718 1240 748 L 1240 820 L -40 820 Z" fill="url(#hillNear)"/>

  <!-- flowers -->
  ${flowers}
</svg>`;

    /* rainbow */
    const rb = document.getElementById('bgRainbow');
    if (rb) {
      const cols = ['#FF8ECB', '#FFB37A', '#FFE98A', '#9DF0B6', '#8FD8FF', '#B18CFF'];
      let arcs = '';
      cols.forEach((c, i) => {
        arcs += `<circle cx="600" cy="760" r="${520 - i * 34}" fill="none" stroke="${c}" stroke-width="32" opacity=".9"/>`;
      });
      rb.innerHTML = `<svg viewBox="0 0 1200 780" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">${arcs}</svg>`;
    }

    /* welcome castle */
    const wc = document.getElementById('welcomeCastle');
    if (wc) wc.innerHTML = castleSVG({});

    /* twinkling stars */
    const stars = document.getElementById('bgStars');
    if (stars) {
      let s = '';
      for (let i = 0; i < 26; i++) {
        const x = Math.random() * 100, y = Math.random() * 62;
        const d = (3 + Math.random() * 4).toFixed(1);
        s += `<i style="left:${x}%;top:${y}%;animation-delay:${(Math.random() * 4).toFixed(1)}s;animation-duration:${d}s"></i>`;
      }
      stars.innerHTML = s;
    }

    /* drifting clouds */
    const clouds = document.createElement('div');
    clouds.className = 'clouds';
    const cloudShape = `<svg viewBox="0 0 200 96" xmlns="http://www.w3.org/2000/svg">
      <g fill="#ffffff">
        <ellipse cx="52" cy="66" rx="46" ry="27"/>
        <ellipse cx="98" cy="48" rx="44" ry="35"/>
        <ellipse cx="146" cy="64" rx="42" ry="28"/>
        <ellipse cx="100" cy="72" rx="72" ry="22"/>
      </g>
      <g fill="#dff1ff" opacity=".75">
        <ellipse cx="70" cy="80" rx="52" ry="13"/>
        <ellipse cx="140" cy="80" rx="40" ry="11"/>
      </g>
    </svg>`;
    const cloudSpots = [
      [4, 30, 1.15, 78, 0], [26, 22, 0.85, 104, -22],
      [52, 26, 1.0, 92, -48], [74, 32, 1.25, 118, -66],
      [12, 44, 0.7, 132, -96], [62, 38, 0.9, 86, -34]
    ];
    cloudSpots.forEach(([x, y, sc, dur, delay]) => {
      const c = document.createElement('div');
      c.className = 'cloud';
      c.innerHTML = cloudShape;
      c.style.top = y + '%';
      c.style.setProperty('--sc', sc);
      c.style.setProperty('--dur', dur + 's');
      c.style.setProperty('--delay', delay + 's');
      c.style.left = x + '%';
      clouds.appendChild(c);
    });
    layer.appendChild(clouds);

    /* butterflies */
    spawnButterflies();
  }

  function spawnButterflies() {
    const layer = document.getElementById('bgLayer');
    if (!layer) return;
    const host = document.createElement('div');
    host.className = 'butterflies';
    host.setAttribute('aria-hidden', 'true');
    layer.appendChild(host);

    const cols = [['#FFB6DC', '#FF8ECB'], ['#C4B5FF', '#9A6BFF'], ['#FFE98A', '#FFC12E'], ['#9DF0B6', '#4FD6A2']];
    for (let i = 0; i < 5; i++) {
      const b = document.createElement('div');
      const c = cols[i % cols.length];
      b.className = 'butterfly';
      b.innerHTML = `<svg viewBox="0 0 40 32">
        <ellipse cx="12" cy="12" rx="11" ry="9" fill="${c[0]}" transform="rotate(-18 12 12)"/>
        <ellipse cx="28" cy="12" rx="11" ry="9" fill="${c[0]}" transform="rotate(18 28 12)"/>
        <ellipse cx="13" cy="22" rx="8" ry="6.5" fill="${c[1]}" opacity=".9" transform="rotate(14 13 22)"/>
        <ellipse cx="27" cy="22" rx="8" ry="6.5" fill="${c[1]}" opacity=".9" transform="rotate(-14 27 22)"/>
        <rect x="18.6" y="8" width="2.8" height="18" rx="1.4" fill="#6B4A72"/>
      </svg>`;
      b.style.setProperty('--x', (8 + Math.random() * 84).toFixed(1) + '%');
      b.style.setProperty('--y', (30 + Math.random() * 45).toFixed(1) + '%');
      b.style.setProperty('--dur', (14 + Math.random() * 12).toFixed(1) + 's');
      b.style.setProperty('--delay', (-Math.random() * 20).toFixed(1) + 's');
      b.style.setProperty('--sc', (0.6 + Math.random() * 0.7).toFixed(2));
      host.appendChild(b);
    }
  }

  /* =========================================================
     ACTIVITY ICONS
     ========================================================= */

  const ICONS = {
    brush: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(-24 50 50)">
        <rect x="43" y="6" width="14" height="40" rx="7" fill="#C98A5B"/>
        <rect x="43" y="6" width="6" height="40" rx="3" fill="#E0A876" opacity=".8"/>
        <rect x="24" y="42" width="52" height="24" rx="12" fill="#FF8ECB"/>
        <rect x="24" y="42" width="52" height="10" rx="5" fill="#FFB6DC"/>
        <g stroke="#FFF6FB" stroke-width="4.6" stroke-linecap="round">
          <path d="M31 66 V80"/><path d="M41 66 V84"/><path d="M51 66 V80"/><path d="M61 66 V84"/><path d="M70 66 V78"/>
        </g>
        <circle cx="66" cy="50" r="3.4" fill="#fff" opacity=".85"/>
      </g>
    </svg>`,

    feed: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 30 C 34 18 16 30 18 50 C 20 74 38 90 50 90 C 62 90 80 74 82 50 C 84 30 66 18 50 30 Z" fill="#FF6B6B"/>
      <path d="M50 30 C 42 22 30 22 24 32 C 34 32 44 36 50 44 Z" fill="#FF9A9A" opacity=".75"/>
      <path d="M50 30 C 50 20 54 12 62 8" stroke="#8B5A33" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M56 18 C 66 8 82 10 84 22 C 74 30 60 28 56 18 Z" fill="#63C97F"/>
      <circle cx="38" cy="52" r="5" fill="#fff" opacity=".55"/>
    </svg>`,

    bath: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="42" width="64" height="40" rx="14" fill="#8FD8FF"/>
      <rect x="18" y="42" width="64" height="14" rx="7" fill="#C6EEFF"/>
      <g fill="#FFFFFF" opacity=".9">
        <circle cx="34" cy="58" r="4"/><circle cx="50" cy="64" r="5"/><circle cx="66" cy="56" r="3.6"/>
        <circle cx="42" cy="72" r="3.2"/><circle cx="60" cy="74" r="4"/>
      </g>
      <g fill="#EAF9FF" stroke="#B9E6FF" stroke-width="2">
        <circle cx="30" cy="26" r="11"/><circle cx="50" cy="16" r="8"/><circle cx="68" cy="28" r="9.5"/>
      </g>
      <circle cx="27" cy="22" r="3" fill="#fff"/>
    </svg>`,

    decorate: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 50 C 26 34 10 48 14 64 C 18 80 38 84 50 72 Z" fill="#FF8ECB"/>
      <path d="M50 50 C 74 34 90 48 86 64 C 82 80 62 84 50 72 Z" fill="#FF8ECB"/>
      <path d="M42 66 C 40 82 46 92 50 92 C 54 92 60 82 58 66 Z" fill="#E85FAE"/>
      <circle cx="50" cy="52" r="10" fill="#E85FAE"/>
      <circle cx="47" cy="49" r="3.4" fill="#fff" opacity=".85"/>
      <path d="M78 18 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" fill="#FFE27A"/>
    </svg>`,

    makeover: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="44" y="42" width="12" height="50" rx="6" fill="#C4A0F2" transform="rotate(14 50 66)"/>
      <path d="M50 6 l7.4 16.6 18 2.2 -13.4 12.4 3.6 17.8 -15.6 -8.8 -15.6 8.8 3.6 -17.8 -13.4 -12.4 18 -2.2 z" fill="#FFD34D"/>
      <path d="M50 16 l4.6 10.4 11.2 1.4 -8.4 7.8 2.2 11.1 -9.6 -5.5 -9.6 5.5 2.2 -11.1 -8.4 -7.8 11.2 -1.4 z" fill="#FFF3BF"/>
      <circle cx="26" cy="30" r="4" fill="#FF8ECB"/>
      <circle cx="76" cy="26" r="3.2" fill="#8FD8FF"/>
    </svg>`,

    star: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" fill="#FFD34D"/></svg>`,

    heart: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z" fill="#FF7EB6"/></svg>`,

    apple: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 30 C 34 18 16 30 18 50 C 20 74 38 90 50 90 C 62 90 80 74 82 50 C 84 30 66 18 50 30 Z" fill="#FF5E6C"/>
      <path d="M50 30 C 42 22 30 22 24 32 C 34 32 44 36 50 44 Z" fill="#FF9AA4" opacity=".7"/>
      <path d="M50 30 C 50 20 54 12 62 8" stroke="#8B5A33" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M56 18 C 66 8 82 10 84 22 C 74 30 60 28 56 18 Z" fill="#63C97F"/>
    </svg>`,

    carrot: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 92 C 40 74 34 52 38 34 L 62 34 C 66 52 60 74 50 92 Z" fill="#FF9A3C"/>
      <path d="M46 44 L 54 48 M 44 58 L 54 62 M 46 72 L 52 75" stroke="#E07A1E" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M50 34 C 44 20 34 12 24 12 C 28 24 36 32 50 34 Z" fill="#63C97F"/>
      <path d="M50 34 C 56 18 66 10 78 12 C 72 24 62 32 50 34 Z" fill="#7EDB96"/>
      <path d="M50 34 C 50 20 50 12 50 6" stroke="#63C97F" stroke-width="6" stroke-linecap="round"/>
    </svg>`,

    sugar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="22" y="34" width="56" height="42" rx="8" fill="#FFFFFF" stroke="#E6D9F2" stroke-width="4"/>
      <rect x="22" y="34" width="56" height="14" rx="7" fill="#FBF6FF"/>
      <rect x="32" y="54" width="10" height="10" rx="2" fill="#EFE4FA"/>
      <rect x="50" y="58" width="12" height="9" rx="2" fill="#EFE4FA"/>
      <circle cx="38" cy="26" r="3.4" fill="#FFE27A"/>
      <circle cx="58" cy="22" r="2.6" fill="#FFB6DC"/>
    </svg>`,

    sponge: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="36" width="72" height="46" rx="14" fill="#FFE27A"/>
      <rect x="14" y="36" width="72" height="16" rx="8" fill="#9DF0B6"/>
      <g fill="#E8C64A" opacity=".8">
        <circle cx="34" cy="62" r="4.4"/><circle cx="54" cy="70" r="5"/><circle cx="70" cy="60" r="3.8"/>
      </g>
      <circle cx="26" cy="24" r="9" fill="#EAF9FF" stroke="#B9E6FF" stroke-width="2"/>
      <circle cx="46" cy="16" r="6" fill="#EAF9FF" stroke="#B9E6FF" stroke-width="2"/>
    </svg>`
  };

  /* =========================================================
     PARTICLES
     ========================================================= */

  function push(el, life) {
    if (liveParticles > MAX_PARTICLES) { el.remove(); return; }
    liveParticles++;
    fxLayer().appendChild(el);
    setTimeout(() => { el.remove(); liveParticles--; }, life);
  }

  function sparkleBurst(x, y, count, opts) {
    opts = opts || {};
    const n = Math.min(count || 10, 24);
    const spread = opts.spread || 100;
    const colors = opts.colors || ['#FFE27A', '#FFFFFF', '#FFB6DC', '#B18CFF', '#8FD8FF'];
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'spark';
      const a = Math.random() * Math.PI * 2;
      const d = spread * (0.35 + Math.random() * 0.9);
      const size = 10 + Math.random() * 16;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.setProperty('--dx', (Math.cos(a) * d).toFixed(1) + 'px');
      el.style.setProperty('--dy', (Math.sin(a) * d - spread * 0.25).toFixed(1) + 'px');
      el.style.setProperty('--dur', (0.65 + Math.random() * 0.7).toFixed(2) + 's');
      el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="${starPathLocal(12, 12, 10)}" fill="${colors[i % colors.length]}"/></svg>`;
      push(el, 1500);
    }
  }

  function starPathLocal(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rad = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.44;
      pts.push((cx + Math.cos(rad) * rr).toFixed(2) + ',' + (cy + Math.sin(rad) * rr).toFixed(2));
    }
    return 'M' + pts.join('L') + 'Z';
  }

  function floatEmoji(x, y, emoji, opts) {
    opts = opts || {};
    const el = document.createElement('div');
    el.className = 'floaty';
    const size = opts.size || 34;
    const dx = (Math.random() - 0.5) * (opts.spread || 90);
    const dy = -(90 + Math.random() * 90);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.fontSize = size + 'px';
    el.style.setProperty('--dx', dx.toFixed(1) + 'px');
    el.style.setProperty('--dy', dy.toFixed(1) + 'px');
    el.style.setProperty('--dur', (1.3 + Math.random() * 0.7).toFixed(2) + 's');
    el.textContent = emoji;
    push(el, 2200);
  }

  function bubble(x, y, size) {
    const el = document.createElement('div');
    el.className = 'floaty bubble';
    const s = size || (10 + Math.random() * 22);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.width = s + 'px';
    el.style.height = s + 'px';
    el.style.setProperty('--dx', ((Math.random() - 0.5) * 70).toFixed(1) + 'px');
    el.style.setProperty('--dy', (-(90 + Math.random() * 130)).toFixed(1) + 'px');
    el.style.setProperty('--dur', (1.1 + Math.random() * 0.9).toFixed(2) + 's');
    push(el, 2200);
  }

  function confetti(n) {
    const colors = ['#FF8ECB', '#FFE27A', '#9DF0B6', '#8FD8FF', '#B18CFF', '#FFFFFF'];
    const W = window.innerWidth, H = window.innerHeight;
    for (let i = 0; i < (n || 40); i++) {
      const el = document.createElement('div');
      el.className = 'confetti';
      const s = 8 + Math.random() * 12;
      el.style.left = (Math.random() * W) + 'px';
      el.style.top = (-30 - Math.random() * H * 0.4) + 'px';
      el.style.width = s + 'px';
      el.style.height = (s * (0.5 + Math.random())) + 'px';
      el.style.background = colors[i % colors.length];
      el.style.setProperty('--fall', (H + 120) + 'px');
      el.style.setProperty('--drift', ((Math.random() - 0.5) * 220).toFixed(0) + 'px');
      el.style.setProperty('--dur', (2.4 + Math.random() * 2.2).toFixed(2) + 's');
      el.style.setProperty('--rot', (Math.random() * 900 - 450).toFixed(0) + 'deg');
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
      push(el, 5200);
    }
  }

  function firework(x, y) {
    const colors = ['#FF8ECB', '#FFE27A', '#9DF0B6', '#8FD8FF', '#B18CFF', '#FFFFFF'];
    const col = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < 18; i++) {
      const el = document.createElement('div');
      el.className = 'fw';
      const a = (Math.PI * 2 / 18) * i + Math.random() * 0.2;
      const d = 70 + Math.random() * 80;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.background = col;
      el.style.setProperty('--dx', (Math.cos(a) * d).toFixed(1) + 'px');
      el.style.setProperty('--dy', (Math.sin(a) * d).toFixed(1) + 'px');
      el.style.setProperty('--dur', (0.8 + Math.random() * 0.5).toFixed(2) + 's');
      push(el, 1500);
    }
  }

  /* =========================================================
     PUBLIC
     ========================================================= */
  window.Art = {
    buildScenery,
    castleSVG,
    icons: ICONS,
    sparkleBurst,
    floatEmoji,
    bubble,
    confetti,
    firework,
    starPathLocal
  };
})();