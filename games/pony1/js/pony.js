/* =========================================================
   pony.js — pony & unicorn character data + SVG artwork
   ========================================================= */
(function () {
  'use strict';

  let UID = 0;
  const uid = () => 'py' + (++UID);

  /* ---------- colour helpers ---------- */
  function clamp255(n) { return Math.max(0, Math.min(255, Math.round(n))); }

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => clamp255(v).toString(16).padStart(2, '0')).join('');
  }
  /** amt > 0 lightens toward white, amt < 0 darkens toward black */
  function shade(hex, amt) {
    const [r, g, b] = hexToRgb(hex);
    if (amt >= 0) {
      return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
    }
    const k = 1 + amt;
    return rgbToHex(r * k, g * k, b * k);
  }
  function rgba(hex, a) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }

  /* ---------- character roster ---------- */
  const PONY_TYPES = [
    {
      id: 'rosie', name: 'Rosie', kind: 'unicorn', emoji: '💕',
      tagline: 'Loves hugs',
      body: '#FFC6E2', mane: '#FF6FB8', hoof: '#D98FBB',
      eye: '#7A4183', blush: '#FF8FBF', horn: true
    },
    {
      id: 'luna', name: 'Luna', kind: 'unicorn', emoji: '🌙',
      tagline: 'Dreams of stars',
      body: '#D6C0FF', mane: '#9A6BFF', hoof: '#A98BD6',
      eye: '#4B3184', blush: '#C79BFF', horn: true
    },
    {
      id: 'snowy', name: 'Snowy', kind: 'unicorn', emoji: '❄️',
      tagline: 'Gentle & sweet',
      body: '#FFF4FC', mane: '#A8E4FF', hoof: '#DCC9E6',
      eye: '#5D7FA8', blush: '#FFB6D9', horn: true
    },
    {
      id: 'cocoa', name: 'Cocoa', kind: 'pony', emoji: '🍎',
      tagline: 'Loves apples',
      body: '#CE9163', mane: '#8B5A33', hoof: '#7A5236',
      eye: '#4A2E1C', blush: '#E08A6E', horn: false
    },
    {
      id: 'mallow', name: 'Mallow', kind: 'pony', emoji: '☁️',
      tagline: 'Sleepy head',
      body: '#FFFBF2', mane: '#FFD79A', hoof: '#E4D3BB',
      eye: '#8A6A45', blush: '#FFC7B0', horn: false
    },
    {
      id: 'rainbow', name: 'Rainbow', kind: 'unicorn', emoji: '🌈',
      tagline: 'Full of sparkles',
      body: '#FFF0FA', mane: '#FF8ECB', hoof: '#D9B6E8',
      eye: '#6A4A9B', blush: '#FFA8D4', horn: true,
      rainbow: true
    }
  ];

  const RAINBOW_STOPS = [
    ['#ff8ecb', 0], ['#ffb37a', 17], ['#ffe98a', 34],
    ['#9df0b6', 51], ['#8fd8ff', 68], ['#b18cff', 85], ['#ff8ecb', 100]
  ];

  /* ---------- tiny icon helpers used in accessories ---------- */
  function starPath(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rad = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.44;
      pts.push((cx + Math.cos(rad) * rr).toFixed(2) + ',' + (cy + Math.sin(rad) * rr).toFixed(2));
    }
    return 'M' + pts.join('L') + 'Z';
  }

  function flowerSVG(cx, cy, r, petal, center) {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
      s += `<ellipse cx="${(cx + Math.cos(a) * r * 0.62).toFixed(2)}" cy="${(cy + Math.sin(a) * r * 0.62).toFixed(2)}" rx="${(r * 0.52).toFixed(2)}" ry="${(r * 0.52).toFixed(2)}" fill="${petal}"/>`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="${(r * 0.36).toFixed(2)}" fill="${center}"/>`;
    return s;
  }

  function bowSVG(cx, cy, size, colA, colB, rot) {
    const s = size;
    return `<g transform="translate(${cx} ${cy}) rotate(${rot || 0})">
      <path d="M0 0 C ${-s * 1.05} ${-s * 0.85}, ${-s * 1.15} ${s * 0.75}, 0 ${s * 0.16} Z" fill="${colA}"/>
      <path d="M0 0 C ${s * 1.05} ${-s * 0.85}, ${s * 1.15} ${s * 0.75}, 0 ${s * 0.16} Z" fill="${colA}"/>
      <path d="M ${-s * 0.5} ${s * 0.02} C ${-s * 0.42} ${s * 0.72}, ${-s * 0.14} ${s * 0.92}, 0 ${s * 0.9} C ${s * 0.14} ${s * 0.92}, ${s * 0.42} ${s * 0.72}, ${s * 0.5} ${s * 0.02} Z" fill="${colB}"/>
      <circle cx="0" cy="0" r="${s * 0.24}" fill="${colB}"/>
      <circle cx="${-s * 0.07}" cy="${-s * 0.07}" r="${s * 0.08}" fill="#fff" opacity=".8"/>
    </g>`;
  }

  function crownSVG(cx, cy, w, h) {
    return `<g transform="translate(${cx} ${cy})">
      <path d="M ${-w / 2} 0 L ${-w / 2} ${-h * 0.55} L ${-w * 0.26} ${-h * 0.14} L 0 ${-h * 0.72} L ${w * 0.26} ${-h * 0.14} L ${w / 2} ${-h * 0.55} L ${w / 2} 0 Z"
            fill="url(#crownGrad)" stroke="#E8A21C" stroke-width="${h * 0.07}" stroke-linejoin="round"/>
      <circle cx="${-w * 0.26}" cy="${-h * 0.2}" r="${h * 0.09}" fill="#ff8ecb"/>
      <circle cx="0" cy="${-h * 0.78}" r="${h * 0.1}" fill="#8fd8ff"/>
      <circle cx="${w * 0.26}" cy="${-h * 0.2}" r="${h * 0.09}" fill="#9df0b6"/>
    </g>`;
  }

  /* ---------- accessory layer ---------- */
  function accessorySVG(kind, color, uidStr) {
    if (!kind) return '';
    switch (kind) {
      case 'bow':
        return bowSVG(258, 96, 22, color, shade(color, -0.25), -14);
      case 'flower':
        return flowerSVG(266, 108, 15, color, '#FFE27A') +
               flowerSVG(292, 84, 10, shade(color, 0.28), '#FFE27A');
      case 'crown':
        return crownSVG(298, 74, 60, 42);
      case 'starclip':
        return `<path d="${starPath(332, 104, 17)}" fill="${color}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
                <circle cx="327" cy="99" r="3.4" fill="#fff" opacity=".9"/>`;
      case 'necklace':
        return `<path d="M 246 208 Q 276 246 314 214" stroke="${color}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".95"/>
                <circle cx="280" cy="234" r="8" fill="#FFE27A" stroke="#fff" stroke-width="2.5"/>
                <path d="${starPath(280, 234, 5)}" fill="#fff" opacity=".85"/>`;
      case 'ribbon':
        return `<g transform="translate(116 238) rotate(-12)">
          <path d="M 0 0 C -18 -13 -28 5 -6 11 Z" fill="${color}"/>
          <path d="M 0 0 C 16 -13 26 5 4 11 Z" fill="${color}"/>
          <path d="M -4 7 C -11 28 -5 42 2 46 C 9 42 13 28 6 7 Z" fill="${shade(color, -0.22)}"/>
          <path d="M 4 7 C 13 25 21 35 28 37 C 27 28 19 14 10 5 Z" fill="${shade(color, -0.1)}"/>
          <circle cx="0" cy="2" r="5.5" fill="${shade(color, 0.3)}"/>
        </g>`;
      case 'hornstar':
        return `<path d="${starPath(300, 38, 15)}" fill="${color}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`;
      default:
        return '';
    }
  }

  /* =========================================================
     MAIN PONY BUILDER
     ========================================================= */
  function ponySVG(type, opts) {
    opts = opts || {};
    const u = uid();

    const bodyCol  = opts.body  || type.body;
    const maneCol  = opts.mane  || type.mane;
    const tailCol  = opts.tail  || maneCol;
    const hoofCol  = type.hoof;
    const eyeCol   = type.eye;
    const blushCol = type.blush;
    const hasHorn  = opts.horn !== undefined ? opts.horn : type.horn;
    const isRainbowMane = !!(type.rainbow && !opts.mane);
    const isRainbowTail = !!(type.rainbow && !opts.tail);

    const bodyLight = shade(bodyCol, 0.42);
    const bodyDeep  = shade(bodyCol, -0.14);
    const muzzleCol = shade(bodyCol, 0.34);
    const maneLight = isRainbowMane ? '#ffffff' : shade(maneCol, 0.34);
    const maneDeep  = isRainbowMane ? '#ffffff' : shade(maneCol, -0.2);
    const tailLight = isRainbowTail ? '#ffffff' : shade(tailCol, 0.34);

    const maneFill = isRainbowMane ? `url(#maneRB-${u})` : `url(#maneG-${u})`;
    const tailFill = isRainbowTail ? `url(#maneRB-${u})` : `url(#tailG-${u})`;
    const hornFill = `url(#hornG-${u})`;

    const rainbowStops = RAINBOW_STOPS
      .map(([c, o]) => `<stop offset="${o}%" stop-color="${c}"/>`).join('');

    const cls = opts.className ? ' ' + opts.className : '';
    const vb = opts.viewBox || '0 0 400 400';

    return `
<svg class="pony-svg${cls}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${type.name} the ${type.kind}">
  <defs>
    <radialGradient id="bodyG-${u}" cx="38%" cy="26%" r="82%">
      <stop offset="0%" stop-color="${bodyLight}"/>
      <stop offset="62%" stop-color="${bodyCol}"/>
      <stop offset="100%" stop-color="${bodyDeep}"/>
    </radialGradient>
    <linearGradient id="maneG-${u}" x1="0.15" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="${maneLight}"/>
      <stop offset="55%" stop-color="${maneCol}"/>
      <stop offset="100%" stop-color="${maneDeep}"/>
    </linearGradient>
    <linearGradient id="tailG-${u}" x1="0.1" y1="0" x2="0.85" y2="1">
      <stop offset="0%" stop-color="${tailLight}"/>
      <stop offset="60%" stop-color="${tailCol}"/>
      <stop offset="100%" stop-color="${shade(tailCol, -0.24)}"/>
    </linearGradient>
    <linearGradient id="maneRB-${u}" x1="0" y1="0" x2="0.9" y2="1">
      ${rainbowStops}
    </linearGradient>
    <linearGradient id="hornG-${u}" x1="0" y1="1" x2="0.4" y2="0">
      <stop offset="0%" stop-color="#FFC93C"/>
      <stop offset="45%" stop-color="#FFE98A"/>
      <stop offset="100%" stop-color="#FFF6C9"/>
    </linearGradient>
    <linearGradient id="crownGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFE98A"/>
      <stop offset="100%" stop-color="#FFC12E"/>
    </linearGradient>
    <radialGradient id="irisG-${u}" cx="42%" cy="34%" r="72%">
      <stop offset="0%" stop-color="${shade(eyeCol, 0.34)}"/>
      <stop offset="70%" stop-color="${eyeCol}"/>
      <stop offset="100%" stop-color="${shade(eyeCol, -0.35)}"/>
    </radialGradient>
    <linearGradient id="shineG-${u}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity=".85"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="soft-${u}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
  </defs>

  <!-- ground shadow -->
  <ellipse cx="198" cy="374" rx="120" ry="15" fill="rgba(120,70,150,.16)"/>

  <g class="pony-root">

    <!-- ============ TAIL ============ -->
    <g class="pony-tail">
      <path d="M 118 222 C 84 202 54 228 56 266 C 58 304 84 336 116 336 C 94 312 86 280 96 252 C 102 234 112 226 118 222 Z"
            fill="${tailFill}"/>
      <path d="M 108 240 C 80 236 62 262 68 292 C 73 316 92 330 110 326 C 95 308 92 280 102 258 Z"
            fill="${tailFill}" opacity=".78"/>
      <path d="M 96 250 C 84 262 80 284 86 302" stroke="${rgba('#ffffff', .45)}" stroke-width="5" fill="none" stroke-linecap="round"/>
    </g>

    <!-- ============ BACK LEGS ============ -->
    <g class="pony-legs pony-legs--back">
      <rect x="150" y="286" width="30" height="82" rx="15" fill="${bodyDeep}"/>
      <rect x="150" y="344" width="30" height="26" rx="13" fill="${shade(hoofCol, -0.18)}"/>
      <rect x="112" y="292" width="34" height="80" rx="17" fill="${bodyCol}"/>
      <rect x="112" y="348" width="34" height="26" rx="13" fill="${hoofCol}"/>
      <rect x="118" y="354" width="22" height="7" rx="3.5" fill="${rgba('#ffffff', .28)}"/>
    </g>

    <!-- ============ BODY ============ -->
    <ellipse class="pony-body" cx="188" cy="268" rx="100" ry="70" fill="url(#bodyG-${u})"/>
    <ellipse cx="188" cy="300" rx="76" ry="30" fill="${rgba('#ffffff', .22)}"/>

    <!-- ============ FRONT LEGS ============ -->
    <g class="pony-legs pony-legs--front">
      <rect x="196" y="286" width="30" height="82" rx="15" fill="${bodyDeep}"/>
      <rect x="196" y="344" width="30" height="26" rx="13" fill="${shade(hoofCol, -0.18)}"/>
      <rect x="228" y="292" width="34" height="80" rx="17" fill="${bodyCol}"/>
      <rect x="228" y="348" width="34" height="26" rx="13" fill="${hoofCol}"/>
      <rect x="234" y="354" width="22" height="7" rx="3.5" fill="${rgba('#ffffff', .28)}"/>
    </g>

    <!-- ============ NECK ============ -->
    <path class="pony-neck" d="M 222 234 C 216 192 236 156 268 138 L 324 176 C 302 200 288 226 284 256 Z"
          fill="url(#bodyG-${u})"/>

    <!-- ============ MANE (behind head) ============ -->
    <g class="pony-mane">
      <path d="M 274 130 C 244 146 222 188 214 230 C 210 252 226 266 242 259 C 256 253 253 236 253 220 C 253 190 266 158 286 144 Z"
            fill="${maneFill}"/>
      <path d="M 268 152 C 250 172 240 200 236 224" stroke="${rgba('#ffffff', .38)}" stroke-width="6" fill="none" stroke-linecap="round"/>
    </g>

    <!-- ============ HEAD ============ -->
    <g class="pony-head">
      <!-- back ear -->
      <g class="pony-ear pony-ear--back">
        <path d="M 316 102 C 312 76 324 60 340 66 C 352 72 348 92 334 106 Z" fill="${bodyDeep}"/>
        <path d="M 322 98 C 320 82 328 72 337 76 C 344 80 341 92 332 100 Z" fill="${rgba('#ff9ec4', .65)}"/>
      </g>

      <!-- head shape -->
      <ellipse cx="296" cy="140" rx="54" ry="50" fill="url(#bodyG-${u})"/>

      <!-- front ear -->
      <g class="pony-ear pony-ear--front">
        <path d="M 266 106 C 256 82 262 60 277 60 C 290 60 294 80 288 102 Z" fill="${bodyCol}"/>
        <path d="M 271 100 C 265 84 269 70 277 70 C 284 70 286 84 282 98 Z" fill="${rgba('#ff9ec4', .6)}"/>
      </g>

      <!-- muzzle -->
      <ellipse class="pony-muzzle" cx="340" cy="172" rx="28" ry="22" fill="${muzzleCol}"/>
      <ellipse cx="350" cy="166" rx="4.6" ry="3.6" fill="${rgba('#5b3a63', .35)}"/>

      <!-- mouth -->
      <g class="pony-mouth" style="transform-box: fill-box; transform-origin: center;">
        <path d="M 330 182 Q 340 191 351 182" stroke="${rgba('#5b3a63', .72)}" stroke-width="3.6" fill="none" stroke-linecap="round"/>
      </g>

      <!-- blush -->
      <ellipse cx="286" cy="176" rx="13" ry="8" fill="${rgba(blushCol, .55)}"/>

      <!-- eye -->
      <g class="pony-eye">
        <ellipse cx="316" cy="150" rx="20" ry="22.5" fill="#fff"/>
        <ellipse cx="318" cy="152" rx="15.5" ry="18" fill="url(#irisG-${u})"/>
        <ellipse cx="318" cy="154" rx="9" ry="11" fill="#2b1c33"/>
        <circle cx="310.5" cy="141" r="6.6" fill="#fff"/>
        <circle cx="324.5" cy="161" r="3.2" fill="#fff" opacity=".85"/>
        <path d="M 297 134 Q 316 122 336 133" stroke="${shade(eyeCol, -0.4)}" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M 333 130 l 7 -6" stroke="${shade(eyeCol, -0.4)}" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M 338 140 l 8 -3" stroke="${shade(eyeCol, -0.4)}" stroke-width="3.2" stroke-linecap="round"/>
      </g>

      <!-- horn -->
      ${hasHorn ? `
      <g class="pony-horn">
        <path d="M 285 100 C 289 64 293 42 299 22 C 305 42 310 64 314 100 Z" fill="${hornFill}" stroke="#F0B429" stroke-width="2" stroke-linejoin="round"/>
        <path d="M 288 84 Q 300 78 311 84" stroke="#fff" stroke-width="3" fill="none" opacity=".75" stroke-linecap="round"/>
        <path d="M 291 64 Q 300 59 308 64" stroke="#fff" stroke-width="2.8" fill="none" opacity=".7" stroke-linecap="round"/>
        <path d="M 294 46 Q 300 42 305 46" stroke="#fff" stroke-width="2.4" fill="none" opacity=".65" stroke-linecap="round"/>
        <circle cx="299" cy="22" r="5" fill="#FFF6C9"/>
      </g>` : ''}

      <!-- forelock / top mane -->
      <g class="pony-forelock">
        <path d="M 296 92 C 310 80 332 88 333 106 C 334 122 318 130 306 121 C 314 110 308 98 296 92 Z" fill="${maneFill}"/>
        <path d="M 268 108 C 258 88 264 66 279 62 C 292 58 300 72 296 90 C 288 84 276 92 268 108 Z" fill="${maneFill}"/>
      </g>

      <!-- accessories -->
      <g class="pony-acc">${accessorySVG(opts.accessory, opts.accColor || '#FF6FB8', u)}</g>
    </g>

    <!-- ============ DIRT (bath activity) ============ -->
    <g class="pony-dirt"></g>

    <!-- ============ SHINE OVERLAY ============ -->
    <g class="pony-shine" opacity="0">
      <ellipse cx="188" cy="268" rx="100" ry="70" fill="url(#shineG-${u})" opacity=".5"/>
      <ellipse cx="296" cy="140" rx="54" ry="50" fill="url(#shineG-${u})" opacity=".45"/>
    </g>
  </g>
</svg>`;
  }

  /* ---------- head-and-shoulders portrait ---------- */
  const PORTRAIT_VB = '188 6 214 202';

  function ponyPortrait(type, opts) {
    opts = Object.assign({}, opts || {}, { viewBox: PORTRAIT_VB });
    return ponySVG(type, opts);
  }

  /* ---------- public API ---------- */
  window.PonyArt = {
    types: PONY_TYPES,
    byId: id => PONY_TYPES.find(t => t.id === id) || PONY_TYPES[0],
    svg: ponySVG,
    portrait: ponyPortrait,
    shade: shade,
    rgba: rgba,
    starPath: starPath,
    flowerSVG: flowerSVG,
    bowSVG: bowSVG
  };
})();