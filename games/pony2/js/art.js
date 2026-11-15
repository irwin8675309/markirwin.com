/* Enchanted Pony Palace - art: all illustrations are original inline SVG */
(function () {
  'use strict';
  var NS = (window.PPA = window.PPA || {});

  /* ---------- colour helpers ---------- */
  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgb2hex(r, g, b) {
    return '#' + [r, g, b].map(function (v) {
      return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    }).join('');
  }
  function mix(a, b, t) {
    var A = hex2rgb(a), B = hex2rgb(b);
    return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  }
  var lighten = function (c, t) { return mix(c, '#ffffff', t); };
  var darken = function (c, t) { return mix(c, '#4a2a63', t); };
  NS.mix = mix; NS.lighten = lighten; NS.darken = darken;
  NS.baseColor = function (c) { if (c === 'rainbow') return '#b28cff'; return c.indexOf('|') > -1 ? c.split('|')[0] : c; };

  var RAINBOW = ['#ff6b8b', '#ffb347', '#ffe66d', '#7be495', '#5ec8ff', '#b28cff'];
  NS.RAINBOW = RAINBOW;

  /* ---------- characters ---------- */
  NS.CHARS = [
    { id: 'rosie', name: 'Rosie', kind: 'unicorn', body: '#ffb8d6', mane: '#ff5fa2', tail: '#ff5fa2',
      mark: 'heart', trait: 'Loves cuddles', pitch: 1.35, react: 'heart', move: 'jump' },
    { id: 'luna', name: 'Luna', kind: 'unicorn', body: '#c9a8ff', mane: '#7a4fd6', tail: '#7a4fd6',
      mark: 'moon', trait: 'Dreamy and sleepy', pitch: 0.95, react: 'star', move: 'dance' },
    { id: 'snow', name: 'Snowflake', kind: 'unicorn', body: '#ffffff', mane: '#8fd3ff|#d9f1ff', tail: '#8fd3ff|#d9f1ff',
      mark: 'snow', trait: 'Playful and bouncy', pitch: 1.2, react: 'snow', move: 'jump' },
    { id: 'cocoa', name: 'Cocoa', kind: 'pony', body: '#b9805a', mane: '#4a2c1a', tail: '#4a2c1a',
      mark: 'shoe', trait: 'Gentle and kind', pitch: 0.75, react: 'heart', move: 'nod' },
    { id: 'daisy', name: 'Daisy', kind: 'pony', body: '#fff4e6', mane: '#ffc83d', tail: '#ffc83d',
      mark: 'flower', trait: 'Loves flowers', pitch: 1.1, react: 'flower', move: 'spin' },
    { id: 'starlight', name: 'Starlight', kind: 'unicorn', body: '#fff0fb', mane: 'rainbow', tail: 'rainbow',
      mark: 'star', trait: 'Sparkly and silly', pitch: 1.5, react: 'rainbow', move: 'dance' }
  ];
  NS.charById = function (id) {
    for (var i = 0; i < NS.CHARS.length; i++) if (NS.CHARS[i].id === id) return NS.CHARS[i];
    return NS.CHARS[0];
  };

  NS.COLORS = ['#ff5fa2', '#ff7a59', '#ffd23f', '#5fd068', '#2ec9c0', '#4f8cff', '#a05bff', '#ffffff', 'rainbow'];
  NS.ACCS = ['bow', 'flower', 'ribbon', 'crown', 'horn', 'wings'];

  /* ---------- paint helpers ---------- */
  function paintDef(id, color) {
    if (color === 'rainbow') {
      var st = RAINBOW.map(function (c, i) {
        return '<stop offset="' + (i / (RAINBOW.length - 1)) + '" stop-color="' + c + '"/>';
      }).join('');
      return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' + st + '</linearGradient>';
    }
    if (color.indexOf('|') > -1) {
      var p = color.split('|');
      return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p[0] +
        '"/><stop offset="1" stop-color="' + p[1] + '"/></linearGradient>';
    }
    return '';
  }
  function paintRef(id, color) {
    return (color === 'rainbow' || color.indexOf('|') > -1) ? 'url(#' + id + ')' : color;
  }
  function baseColor(c) {
    if (c === 'rainbow') return '#b28cff';
    return c.indexOf('|') > -1 ? c.split('|')[0] : c;
  }

  function markSVG(kind, color) {
    switch (kind) {
      case 'heart': return '<path d="M0,12 C-22,-4 -10,-20 0,-8 C10,-20 22,-4 0,12Z" fill="' + color + '"/>';
      case 'moon': return '<path d="M8,-14 A15,15 0 1 0 8,14 A11,11 0 1 1 8,-14Z" fill="' + color + '"/>';
      case 'snow': return '<g stroke="' + color + '" stroke-width="4" stroke-linecap="round"><path d="M0,-15V15M-13,-7.5L13,7.5M-13,7.5L13,-7.5"/></g>';
      case 'shoe': return '<path d="M-14,10 C-20,-6 -10,-16 0,-16 C10,-16 20,-6 14,10 L8,10 C12,-2 6,-9 0,-9 C-6,-9 -12,-2 -8,10Z" fill="' + color + '"/>';
      case 'flower': return '<g fill="' + color + '"><circle cx="0" cy="-9" r="7"/><circle cx="9" cy="-3" r="7"/><circle cx="6" cy="8" r="7"/><circle cx="-6" cy="8" r="7"/><circle cx="-9" cy="-3" r="7"/></g><circle r="5" fill="#ffd23f"/>';
      default: return '<path d="M0,-16 L4.5,-5 L16,-4 L7,4 L10,15 L0,9 L-10,15 L-7,4 L-16,-4 L-4.5,-5Z" fill="' + color + '"/>';
    }
  }

  /* ---------- the pony ---------- */
  var UID = 0;
  /*
   o: {body, mane, tail, kind, mark, acc:{bow,flower,ribbon,crown,horn,wings}, dirt, glow, wings, view:'head'}
  */
  NS.ponySVG = function (o) {
    var u = ++UID;
    var body = o.body, shade = darken(body, 0.2), light = lighten(body, 0.6), hoof = darken(body, 0.5);
    var mane = o.mane, tail = o.tail, acc = o.acc || {};
    var mf = paintRef('mf' + u, mane), tf = paintRef('tf' + u, tail);
    var inner = darken(baseColor(mane), 0.25);
    var hasHorn = o.kind === 'unicorn' || acc.horn;
    var hasWings = acc.wings || o.wings;
    var markCol = (baseColor(mane) === '#ffffff') ? '#ffc83d' : baseColor(mane);
    if (mane === 'rainbow') markCol = '#ff6b8b';

    var s = '';
    var vb = o.view === 'head' ? '325 5 175 215' : '0 0 500 410';
    s += '<svg class="pony-svg" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
    s += '<defs>' + paintDef('mf' + u, mane) + paintDef('tf' + u, tail);
    s += '<linearGradient id="gold' + u + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset=".5" stop-color="#ffd23f"/><stop offset="1" stop-color="#f0a81c"/></linearGradient>';
    s += '<linearGradient id="wing' + u + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e3d4ff"/></linearGradient>';
    s += '<linearGradient id="sh' + u + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>';
    s += '<radialGradient id="glow' + u + '"><stop offset="0" stop-color="#fff7b0" stop-opacity=".95"/><stop offset="1" stop-color="#fff7b0" stop-opacity="0"/></radialGradient>';
    s += '</defs>';
    s += '<g transform="translate(0,50)">';

    if (o.view !== 'head') s += '<ellipse class="shadow" cx="240" cy="350" rx="180" ry="15" fill="rgba(70,30,110,.2)"/>';

    // tail
    s += '<g class="tail">';
    s += '<path d="M128,198 C90,168 38,192 46,255 C50,290 28,316 46,344 C70,336 92,320 98,296 C104,326 130,334 146,306 C134,288 150,262 150,236 C150,220 140,208 128,198Z" fill="' + tf + '"/>';
    s += '<path d="M72,236 C76,268 70,292 62,316" stroke="#fff" stroke-opacity=".5" stroke-width="6" fill="none" stroke-linecap="round"/>';
    s += '<path d="M112,250 C116,276 112,296 108,308" stroke="#fff" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/>';
    s += '</g>';

    // wings (behind body)
    if (hasWings) {
      s += '<g class="wing wing-far"><path d="M268,172 C292,108 350,76 412,84 C392,102 394,118 376,128 C390,142 372,158 352,166 C352,178 326,184 300,186Z" fill="url(#wing' + u + ')" opacity=".85"/></g>';
      s += '<g class="wing"><path d="M232,172 C212,98 148,52 84,62 C104,82 104,102 124,112 C110,128 128,144 148,152 C146,166 174,176 206,182Z" fill="url(#wing' + u + ')" stroke="#e0d0ff" stroke-width="3"/>' +
        '<path d="M205,165 C170,120 140,95 112,84 M200,172 C168,140 150,126 130,118" stroke="#d6c4ff" stroke-width="3" fill="none" stroke-linecap="round"/></g>';
    }

    // far legs
    s += '<rect x="170" y="250" width="36" height="96" rx="17" fill="' + shade + '"/><rect x="170" y="326" width="36" height="22" rx="10" fill="' + hoof + '"/>';
    s += '<rect x="298" y="250" width="36" height="96" rx="17" fill="' + shade + '"/><rect x="298" y="326" width="36" height="22" rx="10" fill="' + hoof + '"/>';

    // body
    s += '<ellipse cx="240" cy="235" rx="135" ry="80" fill="' + body + '"/>';
    s += '<path d="M118,262 Q240,336 372,252 Q342,312 240,318 Q150,314 118,262Z" fill="' + shade + '" opacity=".4"/>';
    s += '<ellipse cx="226" cy="194" rx="92" ry="30" fill="#fff" opacity=".3"/>';
    s += '<g transform="translate(182,240) scale(1.05)">' + markSVG(o.mark || 'star', markCol) + '</g>';

    // near legs
    s += '<rect x="124" y="252" width="38" height="96" rx="18" fill="' + body + '"/><rect x="124" y="326" width="38" height="22" rx="10" fill="' + hoof + '"/>';
    s += '<rect x="336" y="252" width="38" height="96" rx="18" fill="' + body + '"/><rect x="336" y="326" width="38" height="22" rx="10" fill="' + hoof + '"/>';
    s += '<path d="M130,262 q8,-6 24,0 M342,262 q8,-6 24,0" stroke="#fff" stroke-opacity=".4" stroke-width="5" fill="none" stroke-linecap="round"/>';

    // ribbon on tail
    if (acc.ribbon) {
      s += '<g transform="translate(134,206)"><path d="M0,0 C-26,20 -34,46 -24,70 L-10,58 L-4,72 L8,22Z" fill="#4fc3f7"/><path d="M0,0 C10,22 22,40 30,56 L16,56 L8,70 L-2,16Z" fill="#7fdcff"/>' +
        '<rect x="-14" y="-18" width="28" height="34" rx="9" fill="#2aa7e8"/><circle cx="0" cy="-1" r="6" fill="#fff" opacity=".8"/></g>';
    }

    // neck
    s += '<path d="M296,196 C318,150 334,108 342,68 L424,96 C428,152 418,212 388,262 Q338,252 296,196Z" fill="' + body + '"/>';
    s += '<path d="M392,150 C398,190 392,226 378,252" stroke="' + shade + '" stroke-opacity=".35" stroke-width="10" fill="none" stroke-linecap="round"/>';

    // mane (this is the brush target)
    s += '<g class="mane">';
    var manePath = 'M372,38 C335,22 298,48 292,88 C272,98 268,126 284,142 C266,160 272,188 292,200 C310,192 322,176 330,160 C345,140 352,100 372,38Z';
    s += '<path d="' + manePath + '" fill="' + mf + '"/>';
    s += '<path d="M340,44 C312,62 304,100 308,132 M300,120 C292,140 292,160 300,178" stroke="#fff" stroke-opacity=".38" stroke-width="7" fill="none" stroke-linecap="round"/>';
    s += '<path class="shine" d="' + manePath + '" fill="url(#sh' + u + ')" style="opacity:var(--shine,0)"/>';
    s += '</g>';
    if (acc.bow) s += bowSVG(304, 112, 0.9);
    if (acc.flower) s += flowerSVG(318, 72, 0.9) + flowerSVG(298, 146, 0.65);

    // head group
    s += '<g class="head">';
    // far ear
    s += '<path d="M418,52 Q430,10 458,10 Q462,40 450,68Z" fill="' + shade + '"/>';
    s += '<circle cx="395" cy="100" r="58" fill="' + body + '"/>';
    s += '<ellipse cx="447" cy="132" rx="42" ry="33" fill="' + body + '"/>';
    s += '<ellipse cx="454" cy="136" rx="28" ry="20" fill="#fff" opacity=".22"/>';
    s += '<ellipse cx="426" cy="134" rx="15" ry="10" fill="#ff7aa5" opacity=".45"/>';
    // near ear
    s += '<path d="M352,62 Q350,18 378,8 Q392,35 388,60Z" fill="' + body + '"/><path d="M362,55 Q362,28 377,20 Q383,38 380,55Z" fill="#ffb8d0"/>';
    // eye
    s += '<g class="eye"><ellipse cx="413" cy="98" rx="17" ry="21" fill="#fff"/><ellipse cx="417" cy="101" rx="12.5" ry="16" fill="#3b2563"/>' +
      '<ellipse cx="417" cy="104" rx="7" ry="9" fill="#5b3d94" opacity=".7"/><circle cx="422" cy="93" r="5.5" fill="#fff"/><circle cx="411" cy="108" r="2.8" fill="#fff"/>' +
      '<path d="M398,84 l-9,-7 M396,96 l-12,-2 M400,72 l-5,-9" stroke="#3b2563" stroke-width="3.2" stroke-linecap="round" fill="none"/></g>';
    s += '<path class="eye-happy" d="M397,102 Q414,78 432,102" stroke="#3b2563" stroke-width="6" fill="none" stroke-linecap="round" opacity="0"/>';
    // nostril + mouth
    s += '<ellipse cx="474" cy="126" rx="4" ry="6" fill="' + darken(body, 0.45) + '" transform="rotate(-15 474 126)"/>';
    s += '<path class="mouth" d="M434,152 Q454,168 480,150" stroke="#8a3d5c" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
    s += '<g class="mouth-open" opacity="0"><path d="M434,148 Q456,190 482,148Z" fill="#7a2b4c"/><ellipse cx="458" cy="168" rx="12" ry="7" fill="#ff8fa8"/></g>';
    // forelock
    s += '<path d="M392,42 C370,38 350,54 350,80 C350,98 360,110 372,112 C372,92 380,74 400,66 C412,58 410,46 392,42Z" fill="' + mf + '"/>';
    // horn
    if (hasHorn) {
      if (o.glow) s += '<circle class="hornglow" cx="408" cy="0" r="55" fill="url(#glow' + u + ')"/>';
      s += '<g class="horn"><path d="M392,52 L414,-38 L422,54Z" fill="url(#gold' + u + ')"/>' +
        '<path d="M395.5,44 L419.5,34 M401,24 L418.5,14 M406.5,4 L417.6,-4 M411.5,-16 L416.8,-22" stroke="#fff" stroke-opacity=".7" stroke-width="4" stroke-linecap="round"/></g>';
    }
    if (acc.crown) {
      s += '<g class="crown"><path d="M356,50 L352,10 L374,30 L392,2 L410,30 L432,10 L428,50Z" fill="url(#gold' + u + ')" stroke="#e39a0f" stroke-width="3" stroke-linejoin="round"/>' +
        '<circle cx="392" cy="30" r="6" fill="#ff4f8b"/><circle cx="368" cy="40" r="4" fill="#5ec8ff"/><circle cx="416" cy="40" r="4" fill="#7be495"/></g>';
    }
    if (acc.flower) s += flowerSVG(372, 64, 1);
    s += '<circle class="mouth-target" cx="462" cy="145" r="52" fill="none"/>';
    s += '</g>'; // head

    // dirt (bath)
    if (o.dirt) {
      var spots = [[210, 214, 26], [286, 252, 22], [160, 268, 20], [338, 206, 20], [250, 178, 18], [390, 112, 18], [232, 282, 18]];
      s += '<g class="dirt">';
      spots.forEach(function (p, i) {
        s += '<g class="spot" data-i="' + i + '"><ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="' + p[2] + '" ry="' + (p[2] * 0.78) + '" fill="#8a5a3c" opacity=".88"/>' +
          '<circle cx="' + (p[0] + p[2] * 0.7) + '" cy="' + (p[1] - p[2] * 0.4) + '" r="' + (p[2] * 0.3) + '" fill="#8a5a3c" opacity=".88"/>' +
          '<circle cx="' + (p[0] - p[2] * 0.6) + '" cy="' + (p[1] + p[2] * 0.5) + '" r="' + (p[2] * 0.25) + '" fill="#6e4429" opacity=".8"/></g>';
      });
      s += '</g>';
    }

    s += '</g></svg>';
    return s;
  };

  function bowSVG(x, y, k) {
    return '<g class="acc-bow" transform="translate(' + x + ',' + y + ') scale(' + k + ')"><path d="M0,0 L-36,-24 Q-42,0 -36,24Z" fill="#ff4d9a"/><path d="M0,0 L36,-24 Q42,0 36,24Z" fill="#ff4d9a"/>' +
      '<circle r="10" fill="#ff86bd"/><circle cx="-22" cy="-2" r="3" fill="#fff"/><circle cx="22" cy="-2" r="3" fill="#fff"/></g>';
  }
  function flowerSVG(x, y, k) {
    var p = '';
    for (var i = 0; i < 5; i++) {
      var a = i * 72 * Math.PI / 180;
      p += '<circle cx="' + (Math.sin(a) * 12).toFixed(1) + '" cy="' + (-Math.cos(a) * 12).toFixed(1) + '" r="9" fill="#fff" stroke="#ffb3d1" stroke-width="2"/>';
    }
    return '<g class="acc-flower" transform="translate(' + x + ',' + y + ') scale(' + k + ')">' + p + '<circle r="7" fill="#ffd23f"/></g>';
  }

  /* ---------- little icons for buttons ---------- */
  var ICONS = {
    home: '<svg viewBox="0 0 100 100"><path d="M50 14 L90 50 H78 V86 H58 V60 H42 V86 H22 V50 H10Z" fill="#fff" stroke="#e66fa6" stroke-width="5" stroke-linejoin="round"/><path d="M50 14 L90 50 H10Z" fill="#ff7eb6" stroke="#e66fa6" stroke-width="5" stroke-linejoin="round"/></svg>',
    play: '<svg viewBox="0 0 100 100"><path d="M34 20 L82 50 L34 80Z" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 100 100"><path d="M22 54 L42 74 L80 28" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    again: '<svg viewBox="0 0 100 100"><path d="M78 40 A30 30 0 1 0 80 62" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/><path d="M82 16 L80 44 L54 38Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/></svg>',
    music: '<svg viewBox="0 0 100 100"><path d="M40 70 V26 L76 18 V62" fill="none" stroke="#fff" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="30" cy="72" rx="13" ry="10" fill="#fff"/><ellipse cx="66" cy="64" rx="13" ry="10" fill="#fff"/></svg>',
    sound: '<svg viewBox="0 0 100 100"><path d="M18 38 H34 L56 20 V80 L34 62 H18Z" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><path d="M66 36 Q78 50 66 64 M74 24 Q96 50 74 76" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>',
    off: '<svg viewBox="0 0 100 100"><path d="M14 14 L86 86" stroke="#ff3d7f" stroke-width="11" stroke-linecap="round"/><path d="M14 14 L86 86" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>',
    star: '<svg viewBox="0 0 100 100"><path d="M50 8 L62 36 L92 39 L69 58 L77 88 L50 72 L23 88 L31 58 L8 39 L38 36Z" fill="#ffd23f" stroke="#f5a623" stroke-width="5" stroke-linejoin="round"/><path d="M50 22 L57 40" stroke="#fff" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/></svg>',
    starEmpty: '<svg viewBox="0 0 100 100"><path d="M50 8 L62 36 L92 39 L69 58 L77 88 L50 72 L23 88 L31 58 L8 39 L38 36Z" fill="rgba(255,255,255,.55)" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-dasharray="2 9" stroke-linecap="round"/></svg>',
    brush: '<svg viewBox="0 0 120 120"><g transform="rotate(-38 60 60)"><rect x="48" y="2" width="24" height="62" rx="12" fill="#ff7eb6" stroke="#e45a97" stroke-width="4"/><rect x="44" y="54" width="32" height="14" rx="4" fill="#ffd23f" stroke="#e6a800" stroke-width="3"/><path d="M40 68 H80 L84 108 H36Z" fill="#fff" stroke="#c9a6ff" stroke-width="4" stroke-linejoin="round"/><path d="M48 72 V104 M56 72 V106 M64 72 V106 M72 72 V104" stroke="#e1ccff" stroke-width="4" stroke-linecap="round"/></g></svg>',
    apple: '<svg viewBox="0 0 100 100"><path d="M50 30 C34 18 12 28 14 54 C16 78 34 92 50 86 C66 92 84 78 86 54 C88 28 66 18 50 30Z" fill="#ff4f5e" stroke="#d92c3e" stroke-width="4"/><path d="M50 30 C50 20 54 12 62 8" fill="none" stroke="#7a4a2a" stroke-width="6" stroke-linecap="round"/><path d="M56 20 C66 10 80 14 82 22 C72 28 62 26 56 20Z" fill="#7ddc6b" stroke="#4aa83a" stroke-width="3"/><path d="M28 44 C26 54 30 64 36 70" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="6" stroke-linecap="round"/></svg>',
    carrot: '<svg viewBox="0 0 100 100"><g transform="rotate(35 50 50)"><path d="M32 30 C34 18 66 18 68 30 L56 92 Q50 98 44 92Z" fill="#ff9a3d" stroke="#e27410" stroke-width="4" stroke-linejoin="round"/><path d="M38 44 H50 M52 60 H62 M44 74 H52" stroke="#e27410" stroke-width="4" stroke-linecap="round"/><path d="M50 22 C40 10 36 4 34 0 M50 22 C50 10 50 4 50 -2 M50 22 C60 10 64 4 66 0" fill="none" stroke="#5fd068" stroke-width="7" stroke-linecap="round"/></g></svg>',
    sugar: '<svg viewBox="0 0 100 100"><path d="M18 36 L50 22 L84 36 L84 70 L50 86 L18 70Z" fill="#fff" stroke="#b9a6e8" stroke-width="4" stroke-linejoin="round"/><path d="M18 36 L50 50 L84 36 M50 50 V86" fill="none" stroke="#b9a6e8" stroke-width="4" stroke-linejoin="round"/><path d="M50 22 L84 36 L50 50 L18 36Z" fill="#f4eaff"/><circle cx="36" cy="38" r="3" fill="#ffd1ea"/><circle cx="62" cy="40" r="3" fill="#cfe9ff"/><path d="M84 14 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3Z" fill="#ffd23f"/></svg>',
    sponge: '<svg viewBox="0 0 120 120"><rect x="14" y="30" width="92" height="66" rx="22" fill="#ffe36b" stroke="#f0b400" stroke-width="5"/><rect x="14" y="30" width="92" height="22" rx="11" fill="#ffd23f" opacity=".7"/><circle cx="38" cy="66" r="8" fill="#f0b400" opacity=".45"/><circle cx="66" cy="80" r="6" fill="#f0b400" opacity=".45"/><circle cx="82" cy="60" r="9" fill="#f0b400" opacity=".45"/><circle cx="50" cy="88" r="4" fill="#f0b400" opacity=".45"/></svg>',
    wand: '<svg viewBox="0 0 120 120"><path d="M30 100 L82 48" stroke="#b58cff" stroke-width="12" stroke-linecap="round"/><path d="M30 100 L52 78" stroke="#ff7eb6" stroke-width="12" stroke-linecap="round"/><path d="M88 14 L96 34 L118 36 L100 50 L106 72 L88 60 L70 72 L76 50 L58 36 L80 34Z" fill="#ffd23f" stroke="#f5a623" stroke-width="4" stroke-linejoin="round"/></svg>',
    bubbles: '<svg viewBox="0 0 120 120"><circle cx="46" cy="70" r="30" fill="#bdeaff" stroke="#fff" stroke-width="5"/><circle cx="84" cy="40" r="20" fill="#d6f2ff" stroke="#fff" stroke-width="5"/><circle cx="88" cy="88" r="13" fill="#cdeeff" stroke="#fff" stroke-width="4"/><path d="M32 58 q4 -10 14 -12" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M76 32 q3 -6 9 -7" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/></svg>',
    crown: '<svg viewBox="0 0 100 100"><path d="M14 74 L8 28 L34 50 L50 18 L66 50 L92 28 L86 74Z" fill="#ffd23f" stroke="#e39a0f" stroke-width="5" stroke-linejoin="round"/><circle cx="50" cy="52" r="7" fill="#ff4f8b"/><circle cx="26" cy="62" r="5" fill="#5ec8ff"/><circle cx="74" cy="62" r="5" fill="#7be495"/></svg>',
    bow: '<svg viewBox="0 0 100 100"><path d="M50 50 L12 26 Q4 50 12 74Z" fill="#ff4d9a" stroke="#d92c78" stroke-width="4" stroke-linejoin="round"/><path d="M50 50 L88 26 Q96 50 88 74Z" fill="#ff4d9a" stroke="#d92c78" stroke-width="4" stroke-linejoin="round"/><circle cx="50" cy="50" r="12" fill="#ff86bd" stroke="#d92c78" stroke-width="4"/></svg>',
    flower: '<svg viewBox="0 0 100 100"><g fill="#fff" stroke="#ff9ec7" stroke-width="4"><circle cx="50" cy="26" r="17"/><circle cx="74" cy="44" r="17"/><circle cx="65" cy="72" r="17"/><circle cx="35" cy="72" r="17"/><circle cx="26" cy="44" r="17"/></g><circle cx="50" cy="52" r="13" fill="#ffd23f" stroke="#f5a623" stroke-width="4"/></svg>',
    ribbon: '<svg viewBox="0 0 100 100"><path d="M50 40 C30 50 22 70 24 92 L38 80 L46 94 L56 52Z" fill="#4fc3f7" stroke="#1f93d0" stroke-width="4" stroke-linejoin="round"/><path d="M50 40 C64 52 74 70 78 90 L64 82 L56 94 L46 52Z" fill="#7fdcff" stroke="#1f93d0" stroke-width="4" stroke-linejoin="round"/><rect x="36" y="14" width="28" height="32" rx="9" fill="#2aa7e8" stroke="#1f93d0" stroke-width="4"/></svg>',
    horn: '<svg viewBox="0 0 100 100"><path d="M30 90 L50 8 L70 90Z" fill="#ffd23f" stroke="#e39a0f" stroke-width="5" stroke-linejoin="round"/><path d="M34 72 L66 62 M39 50 L62 42 M44 28 L58 24" stroke="#fff" stroke-opacity=".8" stroke-width="5" stroke-linecap="round"/><path d="M82 14 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3Z" fill="#ff86bd"/></svg>',
    wings: '<svg viewBox="0 0 100 100"><path d="M50 78 C46 40 26 18 6 22 C14 34 12 44 22 50 C14 58 22 68 32 72 C34 80 44 82 50 78Z" fill="#fff" stroke="#c9a6ff" stroke-width="4" stroke-linejoin="round"/><path d="M50 78 C54 40 74 18 94 22 C86 34 88 44 78 50 C86 58 78 68 68 72 C66 80 56 82 50 78Z" fill="#f4eaff" stroke="#c9a6ff" stroke-width="4" stroke-linejoin="round"/></svg>',
    mane: '<svg viewBox="0 0 100 100"><path d="M64 8 C30 8 14 36 22 58 C12 66 14 84 28 90 C38 84 46 76 48 66 C62 56 76 36 64 8Z" fill="currentColor" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><path d="M50 18 C32 26 28 46 32 62" stroke="#fff" stroke-opacity=".6" stroke-width="6" fill="none" stroke-linecap="round"/></svg>',
    tail: '<svg viewBox="0 0 100 100"><path d="M28 14 C70 8 92 40 78 66 C74 84 56 94 40 92 C54 82 56 70 50 62 C36 62 20 44 28 14Z" fill="currentColor" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><path d="M44 26 C62 30 70 46 64 62" stroke="#fff" stroke-opacity=".6" stroke-width="6" fill="none" stroke-linecap="round"/></svg>',
    swap: '<svg viewBox="0 0 100 100"><path d="M16 36 H72 M58 20 L76 36 L58 52" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M84 66 H28 M42 50 L24 66 L42 82" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    hand: '<svg viewBox="0 0 80 110"><path d="M30 8 Q40 0 48 8 L50 52 L64 50 Q76 52 74 64 L72 88 Q70 104 54 106 L34 106 Q20 104 16 90 L10 66 Q8 56 18 58 L30 66Z" fill="#fff" stroke="#ff7eb6" stroke-width="5" stroke-linejoin="round"/><path d="M32 40 V62" stroke="#ffc1dc" stroke-width="4" stroke-linecap="round"/></svg>',
    heart: '<svg viewBox="0 0 100 100"><path d="M50 88 C10 60 12 24 34 20 C44 18 50 26 50 32 C50 26 56 18 66 20 C88 24 90 60 50 88Z" fill="#ff6fa8" stroke="#e0407d" stroke-width="5" stroke-linejoin="round"/></svg>',
    meadow: '<svg viewBox="0 0 100 100"><circle cx="72" cy="30" r="14" fill="#ffd23f" stroke="#f5a623" stroke-width="4"/><path d="M4 86 Q30 40 56 70 Q74 54 96 86Z" fill="#7be495" stroke="#3cbf6a" stroke-width="5" stroke-linejoin="round"/><circle cx="28" cy="70" r="5" fill="#ff6fa8"/><circle cx="62" cy="80" r="5" fill="#fff"/></svg>'
  };
  NS.icon = function (n) { return ICONS[n] || ''; };

  /* particle shapes */
  NS.shape = function (type, color, size) {
    var c = color || '#ffd23f';
    var inner;
    switch (type) {
      case 'heart': inner = '<path d="M12 21 C-4 9 2 1 7 1 C10 1 12 4 12 6 C12 4 14 1 17 1 C22 1 28 9 12 21Z" fill="' + c + '"/>'; break;
      case 'flower': inner = '<g fill="' + c + '"><circle cx="12" cy="6" r="5"/><circle cx="18" cy="11" r="5"/><circle cx="16" cy="18" r="5"/><circle cx="8" cy="18" r="5"/><circle cx="6" cy="11" r="5"/></g><circle cx="12" cy="12" r="4" fill="#ffd23f"/>'; break;
      case 'bubble': inner = '<circle cx="12" cy="12" r="10.5" fill="rgba(200,238,255,.45)" stroke="#fff" stroke-width="1.6"/><path d="M6 10 q1-4 5-5" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>'; break;
      case 'drop': inner = '<path d="M12 2 C18 10 20 14 20 16 A8 8 0 0 1 4 16 C4 14 6 10 12 2Z" fill="#7fd4ff"/>'; break;
      case 'snow': inner = '<g stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"><path d="M12 2V22M3.3 7L20.7 17M3.3 17L20.7 7"/></g>'; break;
      default: inner = '<path d="M12 0 L15 9 L24 12 L15 15 L12 24 L9 15 L0 12 L9 9Z" fill="' + c + '"/>';
    }
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '">' + inner + '</svg>';
  };

  /* ---------- scenery ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function castle(x, y, k) {
    var s = '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')">';
    function tower(cx, w, h, roof, col) {
      var t = '<rect x="' + (cx - w / 2) + '" y="' + (-h) + '" width="' + w + '" height="' + h + '" fill="' + col + '" stroke="#e4b6e8" stroke-width="3"/>';
      t += '<path d="M' + (cx - w / 2 - 12) + ',' + (-h) + ' L' + cx + ',' + (-h - w * 1.1) + ' L' + (cx + w / 2 + 12) + ',' + (-h) + 'Z" fill="' + roof + '" stroke="#c46bb8" stroke-width="3" stroke-linejoin="round"/>';
      t += '<path d="M' + cx + ',' + (-h - w * 1.1) + ' V' + (-h - w * 1.1 - 34) + '" stroke="#b07ad0" stroke-width="3"/><path d="M' + cx + ',' + (-h - w * 1.1 - 34) + ' l28,8 l-28,10Z" fill="#ff7eb6"/>';
      t += '<path d="M' + (cx - 9) + ',' + (-h * 0.62) + ' v-22 a9,9 0 0 1 18,0 v22Z" fill="#8fd3ff" stroke="#fff" stroke-width="3"/>';
      return t;
    }
    s += tower(-150, 74, 210, '#ff9ccd', '#fff1fa');
    s += tower(150, 74, 210, '#ff9ccd', '#fff1fa');
    s += tower(-80, 66, 280, '#b99cff', '#f6efff');
    s += tower(80, 66, 280, '#b99cff', '#f6efff');
    s += '<rect x="-120" y="-190" width="240" height="190" fill="#fff6fb" stroke="#e4b6e8" stroke-width="3"/>';
    s += tower(0, 96, 250, '#ffb3d9', '#fff9fd');
    for (var i = -5; i <= 5; i++) s += '<rect x="' + (i * 22 - 8) + '" y="-204" width="16" height="16" fill="#fff6fb" stroke="#e4b6e8" stroke-width="2"/>';
    s += '<path d="M-34,0 V-70 a34,34 0 0 1 68,0 V0Z" fill="#a572d8" stroke="#7d4fb3" stroke-width="3"/><path d="M0,-104 V0" stroke="#7d4fb3" stroke-width="3"/><circle cx="12" cy="-48" r="4" fill="#ffd23f"/>';
    s += '<path d="M-104,-140 v-24 a10,10 0 0 1 20,0 v24Z M84,-140 v-24 a10,10 0 0 1 20,0 v24Z" fill="#8fd3ff" stroke="#fff" stroke-width="3"/>';
    return s + '</g>';
  }

  NS.sceneSVG = function (kind) {
    var r = rng(kind === 'castle' ? 7 : 11);
    var s = '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
    s += '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9dcff"/><stop offset=".55" stop-color="#d7ecff"/><stop offset="1" stop-color="#ffe8f5"/></linearGradient>' +
      '<radialGradient id="sun"><stop offset="0" stop-color="#fffbd0"/><stop offset=".45" stop-color="#fff3a8" stop-opacity=".85"/><stop offset="1" stop-color="#fff3a8" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6efa0"/><stop offset="1" stop-color="#7fdc8c"/></linearGradient></defs>';
    s += '<rect width="1600" height="900" fill="url(#sky)"/>';
    s += '<circle cx="1380" cy="140" r="170" fill="url(#sun)"/><circle cx="1380" cy="140" r="64" fill="#fff6b8"/>';
    // twinkles
    for (var i = 0; i < 16; i++) {
      var tx = r() * 1600, ty = r() * 330, ts = 8 + r() * 12;
      s += '<path class="twinkle" style="animation-delay:' + (r() * 3).toFixed(2) + 's" transform="translate(' + tx.toFixed(0) + ',' + ty.toFixed(0) + ') scale(' + (ts / 24).toFixed(2) + ')" d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3Z" fill="#fff"/>';
    }
    // rainbow
    var rc = ['#ff8aa8', '#ffb86b', '#ffe97a', '#8fe39b', '#7cd0ff', '#b99cff'];
    var rx = kind === 'castle' ? 800 : 560;
    for (var j = 0; j < rc.length; j++) {
      s += '<circle cx="' + rx + '" cy="860" r="' + (690 - j * 30) + '" fill="none" stroke="' + rc[j] + '" stroke-width="31" opacity=".6"/>';
    }
    // clouds
    function cloud(x, y, k, cls) {
      return '<g class="' + cls + '" transform="translate(' + x + ',' + y + ') scale(' + k + ')"><g fill="#fff" opacity=".95"><circle cx="0" cy="0" r="38"/><circle cx="46" cy="-16" r="48"/><circle cx="104" cy="0" r="40"/><rect x="0" y="0" width="104" height="38" rx="19"/></g></g>';
    }
    s += cloud(120, 120, 1.2, 'cloud c1') + cloud(820, 70, 0.9, 'cloud c2') + cloud(1150, 250, 1, 'cloud c3');
    // far hills
    s += '<path d="M0 640 C200 560 380 560 560 620 C760 540 980 540 1180 610 C1340 560 1480 560 1600 600 V900 H0Z" fill="#c9f2c4"/>';
    if (kind === 'castle') {
      s += castle(800, 640, 1.55);
    } else {
      s += castle(1290, 610, 0.62);
    }
    s += '<path d="M0 700 C260 630 520 640 760 690 C1000 640 1300 620 1600 690 V900 H0Z" fill="#b2eeaa"/>';
    // trees
    function tree(x, y, k, col) {
      return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')"><rect x="-9" y="-70" width="18" height="76" rx="8" fill="#b98255"/><circle cx="0" cy="-110" r="52" fill="' + col + '"/><circle cx="-34" cy="-86" r="34" fill="' + col + '"/><circle cx="34" cy="-86" r="34" fill="' + col + '"/><circle cx="-12" cy="-126" r="14" fill="#fff" opacity=".25"/></g>';
    }
    if (kind === 'castle') {
      s += tree(130, 720, 1.2, '#8fdc8a') + tree(300, 740, 0.9, '#a5e59e') + tree(1330, 730, 1.1, '#8fdc8a') + tree(1480, 750, 1.3, '#a5e59e');
    } else {
      s += tree(110, 730, 1.15, '#8fdc8a') + tree(280, 750, 0.85, '#a5e59e') + tree(1490, 750, 1.2, '#8fdc8a');
    }
    // near meadow
    s += '<path d="M0 780 C300 730 620 740 900 770 C1180 740 1420 730 1600 770 V900 H0Z" fill="url(#grass)"/>';
    s += '<path d="M0 850 C400 820 1000 830 1600 850 V900 H0Z" fill="#6fd186" opacity=".55"/>';
    // flowers
    var fc = ['#ff7eb6', '#ffd23f', '#fff', '#c39bff', '#7cd0ff', '#ff9a8a'];
    for (var f = 0; f < 46; f++) {
      var fx = r() * 1600, fy = 770 + r() * 120, fk = 0.55 + r() * 0.7, col = fc[Math.floor(r() * fc.length)];
      var sway = f % 3 === 0 ? ' class="sway" style="animation-delay:' + (r() * 2).toFixed(2) + 's"' : '';
      s += '<g' + sway + ' transform="translate(' + fx.toFixed(0) + ',' + fy.toFixed(0) + ') scale(' + fk.toFixed(2) + ')"><path d="M0 0 V34" stroke="#4fbf6a" stroke-width="5" stroke-linecap="round"/><path d="M0 22 q14 -10 22 -2 q-10 10 -22 2Z" fill="#5fcf76"/>' +
        '<g fill="' + col + '"><circle cx="0" cy="-12" r="9"/><circle cx="11" cy="-4" r="9"/><circle cx="7" cy="9" r="9"/><circle cx="-7" cy="9" r="9"/><circle cx="-11" cy="-4" r="9"/></g><circle r="6" fill="' + (col === '#ffd23f' ? '#ff9a3d' : '#ffd23f') + '"/></g>';
    }
    s += '</svg>';
    return s;
  };

  NS.butterflySVG = function (c1, c2) {
    return '<svg viewBox="0 0 60 50" width="100%" height="100%"><g class="bwing"><path d="M30 25 C14 0 0 6 4 24 C6 36 22 36 30 28Z" fill="' + c1 + '"/><path d="M30 25 C46 0 60 6 56 24 C54 36 38 36 30 28Z" fill="' + c1 + '"/></g>' +
      '<path d="M30 28 C20 48 6 44 10 36 C14 30 24 30 30 28Z" fill="' + c2 + '"/><path d="M30 28 C40 48 54 44 50 36 C46 30 36 30 30 28Z" fill="' + c2 + '"/><rect x="28" y="14" width="4" height="26" rx="2" fill="#7a4fa0"/><circle cx="20" cy="16" r="4" fill="#fff" opacity=".7"/><circle cx="40" cy="16" r="4" fill="#fff" opacity=".7"/></svg>';
  };
})();
