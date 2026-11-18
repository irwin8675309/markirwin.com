/**
 * Original vector artwork for Ghosty, Spin and Oakley.
 *
 * Shared with the family's "Pets Game" project. Character colors follow the
 * Maze Adventures character specification: Ghosty is pure white, Spin is a
 * black-and-white tuxedo, and Oakley is a solid-black dog with a gray-white
 * muzzle. All artwork is original and drawn from scratch.
 */

const NS = 'http://www.w3.org/2000/svg';

function svgDoc(w, h, body, defs = '') {
  return `<svg xmlns="${NS}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">${defs}${body}</svg>`;
}

function shadowEllipse(cx, cy, rx, ry, opacity = 0.14) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#4b3c62" opacity="${opacity}"/>`;
}

/* ------------------------------------------------------------------ */
/* Pets                                                               */
/* ------------------------------------------------------------------ */

const PET_LOOKS = {
  ghosty: {
    outline: '#e6daee',
    body: ['#ffffff', '#f8f3fa'],
    head: ['#ffffff', '#fcf8fc'],
    ear: '#ffffff',
    earInner: '#fdf5f8',
    tail: ['#ffffff', '#f8f3fa'],
    eye: '#8db6d1',
    pupil: '#273244',
    nose: '#f4a7b5',
    blush: '#fff3f6',
    legFar: '#fcf9fc',
    legNear: '#ffffff',
    paw: '#fdfafb',
    chest: '#ffffff',
  },
  spin: {
    outline: '#15171f',
    body: ['#2b303d', '#12151c'],
    head: ['#ffffff', '#f7f1f5'],
    cap: ['#2e3442', '#0f1218'],
    ear: '#242935',
    earInner: '#f7b3bc',
    tail: ['#2e3442', '#12151c'],
    eye: '#c9d65c',
    pupil: '#27301b',
    nose: '#f1a4b1',
    blush: '#f8ecee',
    legFar: '#232732',
    legNear: '#faf6f8',
    paw: '#fffaf9',
    chest: '#fffdf9',
  },
  oakley: {
    outline: '#17191f',
    body: ['#26282f', '#101217'],
    head: ['#26282f', '#101217'],
    ear: '#1a1c21',
    earInner: '#3a373d',
    muzzle: ['#d3cecd', '#aaa3a5'],
    eye: '#cc8638',
    pupil: '#2b1a0e',
    nose: '#0f1014',
    tongue: '#ff8d9c',
    blush: '#7c6262',
    legFar: '#1e2026',
    legNear: '#14161b',
    paw: '#1e2026',
    chest: '#22242b',
    gray: '#d8d3d0',
  },
};

function eyeSVG(cx, cy, rx, ry, iris, pupil, sparkle = true) {
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fffdf8" stroke="#493d5a" stroke-width="4"/>
    <ellipse cx="${cx}" cy="${cy + 2}" rx="${rx * 0.72}" ry="${ry * 0.76}" fill="${iris}"/>
    <ellipse cx="${cx}" cy="${cy + 4}" rx="${rx * 0.42}" ry="${ry * 0.56}" fill="${pupil}"/>
    ${sparkle ? `<circle cx="${cx - rx * 0.28}" cy="${cy - ry * 0.32}" r="${rx * 0.24}" fill="#fff"/><circle cx="${cx + rx * 0.26}" cy="${cy + ry * 0.22}" r="${rx * 0.11}" fill="#fff" opacity=".75"/>` : ''}`;
}

function whiskersSVG(cx, cy, color = '#9d879d', opacity = 0.8) {
  return `
    <path d="M${cx - 52} ${cy - 2} Q${cx - 78} ${cy - 10} ${cx - 96} ${cy - 8}" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity="${opacity}"/>
    <path d="M${cx - 52} ${cy + 9} Q${cx - 80} ${cy + 8} ${cx - 98} ${cy + 15}" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity="${opacity}"/>
    <path d="M${cx - 50} ${cy + 19} Q${cx - 75} ${cy + 24} ${cx - 90} ${cy + 34}" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity="${opacity}"/>
    <path d="M${cx + 52} ${cy - 2} Q${cx + 78} ${cy - 10} ${cx + 96} ${cy - 8}" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity="${opacity}"/>
    <path d="M${cx + 52} ${cy + 9} Q${cx + 80} ${cy + 8} ${cx + 98} ${cy + 15}" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity="${opacity}"/>
    <path d="M${cx + 50} ${cy + 19} Q${cx + 75} ${cy + 24} ${cx + 90} ${cy + 34}" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity="${opacity}"/>`;
}

function catTailSVG(pet, pose) {
  const look = PET_LOOKS[pet];
  let angle = 0;
  if (pose === 'runA') angle = -18;
  else if (pose === 'runB') angle = -5;
  else if (pose === 'jump') angle = -32;
  else if (pose === 'land') angle = -12;
  else if (pose === 'celebrate') angle = 9;

  const tip = pet === 'spin'
    ? `<circle cx="112" cy="146" r="17" fill="#fffdf8" stroke="#15171f" stroke-width="4"/>`
    : '';

  return `<g transform="rotate(${angle} 152 235)">
    <path d="M156 237 C107 259 65 235 68 192 C70 160 92 137 113 147"
      stroke="${look.outline}" stroke-width="40" stroke-linecap="round"/>
    <path d="M156 237 C107 259 65 235 68 192 C70 160 92 137 113 147"
      stroke="${look.tail[1]}" stroke-width="31" stroke-linecap="round"/>
    <path d="M156 237 C120 248 87 231 85 199" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity=".35"/>
    ${tip}
  </g>`;
}

function dogTailSVG(pet, pose) {
  let angle = -6;
  if (pose === 'runA') angle = -22;
  else if (pose === 'runB') angle = -1;
  else if (pose === 'jump') angle = -35;
  else if (pose === 'land') angle = -10;
  else if (pose === 'celebrate') angle = 18;

  return `<g transform="rotate(${angle} 150 230)">
    <path d="M150 230 C95 250 60 215 70 175 C77 147 100 134 120 142"
      stroke="#17191f" stroke-width="38" stroke-linecap="round"/>
    <path d="M150 230 C95 250 60 215 70 175 C77 147 100 134 120 142"
      stroke="#2c2f37" stroke-width="29" stroke-linecap="round"/>
    <path d="M70 175 C77 147 100 134 120 142" stroke="#4a4d55" stroke-width="10" stroke-linecap="round" opacity=".5"/>
    <path d="M150 230 C112 242 80 228 76 201" stroke="#5f636c" stroke-width="7" stroke-linecap="round" opacity=".45"/>
  </g>`;
}

function catLegsSVG(pet, pose) {
  const look = PET_LOOKS[pet];
  const outline = look.outline;
  let legs = [];
  if (pose === 'runA') {
    legs = [
      [126, 44, -20, look.legFar, look.paw],
      [226, 44, 22, look.legFar, look.paw],
      [156, 49, 15, look.legNear, look.paw],
      [258, 49, -14, look.legNear, look.paw],
    ];
  } else if (pose === 'runB') {
    legs = [
      [128, 46, 18, look.legFar, look.paw],
      [230, 46, -18, look.legFar, look.paw],
      [160, 50, -15, look.legNear, look.paw],
      [252, 50, 15, look.legNear, look.paw],
    ];
  } else if (pose === 'jump') {
    legs = [
      [145, 30, -34, look.legFar, look.paw],
      [225, 30, 32, look.legFar, look.paw],
      [165, 32, -28, look.legNear, look.paw],
      [244, 32, 28, look.legNear, look.paw],
    ];
  } else if (pose === 'land') {
    legs = [
      [120, 48, -28, look.legFar, look.paw],
      [236, 48, 28, look.legFar, look.paw],
      [152, 50, -20, look.legNear, look.paw],
      [262, 50, 20, look.legNear, look.paw],
    ];
  } else if (pose === 'celebrate') {
    legs = [
      [138, 47, -6, look.legFar, look.paw],
      [225, 47, 6, look.legFar, look.paw],
      [160, 50, 2, look.legNear, look.paw],
    ];
  } else {
    legs = [
      [132, 46, -3, look.legFar, look.paw],
      [228, 46, 3, look.legFar, look.paw],
      [158, 50, 0, look.legNear, look.paw],
      [252, 50, 0, look.legNear, look.paw],
    ];
  }

  const legDraw = legs.map(([x, h, angle, fill, paw]) => `
    <g transform="rotate(${angle} ${x + 17} 282)">
      <rect x="${x}" y="274" width="34" height="${h + 4}" rx="17" fill="${fill}" stroke="${outline}" stroke-width="3"/>
      <ellipse cx="${x + 17}" cy="${274 + h}" rx="25" ry="11" fill="${paw}" stroke="${outline}" stroke-width="3"/>
    </g>`).join('');

  const raised = pose === 'celebrate'
    ? `<g transform="rotate(-52 274 246)">
        <rect x="258" y="203" width="33" height="58" rx="16" fill="${look.legNear}" stroke="${outline}" stroke-width="3"/>
        <ellipse cx="274" cy="203" rx="24" ry="11" fill="${look.paw}" stroke="${outline}" stroke-width="3"/>
      </g>`
    : '';

  return legDraw + raised;
}

function dogLegsSVG(pet, pose) {
  const look = PET_LOOKS[pet];
  const outline = look.outline;
  let legs = [];
  if (pose === 'runA') {
    legs = [
      [125, 45, -18, look.legFar, look.paw],
      [228, 45, 20, look.legFar, look.paw],
      [157, 50, 16, look.legNear, look.paw],
      [258, 50, -14, look.legNear, look.paw],
    ];
  } else if (pose === 'runB') {
    legs = [
      [128, 46, 16, look.legFar, look.paw],
      [230, 46, -18, look.legFar, look.paw],
      [160, 51, -14, look.legNear, look.paw],
      [254, 51, 14, look.legNear, look.paw],
    ];
  } else if (pose === 'jump') {
    legs = [
      [146, 32, -32, look.legFar, look.paw],
      [226, 32, 30, look.legFar, look.paw],
      [166, 34, -26, look.legNear, look.paw],
      [244, 34, 26, look.legNear, look.paw],
    ];
  } else if (pose === 'land') {
    legs = [
      [120, 49, -27, look.legFar, look.paw],
      [236, 49, 27, look.legFar, look.paw],
      [152, 51, -18, look.legNear, look.paw],
      [262, 51, 18, look.legNear, look.paw],
    ];
  } else if (pose === 'celebrate') {
    legs = [
      [136, 47, -5, look.legFar, look.paw],
      [226, 47, 5, look.legFar, look.paw],
      [160, 51, 2, look.legNear, look.paw],
    ];
  } else {
    legs = [
      [132, 47, -3, look.legFar, look.paw],
      [228, 47, 3, look.legFar, look.paw],
      [158, 51, 0, look.legNear, look.paw],
      [252, 51, 0, look.legNear, look.paw],
    ];
  }

  const legDraw = legs.map(([x, h, angle, fill, paw]) => `
    <g transform="rotate(${angle} ${x + 17} 282)">
      <rect x="${x}" y="274" width="34" height="${h + 4}" rx="17" fill="${fill}" stroke="${outline}" stroke-width="3"/>
      <ellipse cx="${x + 17}" cy="${274 + h}" rx="25" ry="11" fill="${paw}" stroke="${outline}" stroke-width="3"/>
    </g>`).join('');

  const raised = pose === 'celebrate'
    ? `<g transform="rotate(-56 274 246)">
        <rect x="258" y="203" width="33" height="58" rx="16" fill="${look.legNear}" stroke="${outline}" stroke-width="3"/>
        <ellipse cx="274" cy="203" rx="24" ry="11" fill="${look.paw}" stroke="${outline}" stroke-width="3"/>
      </g>`
    : '';

  return legDraw + raised;
}

function ghostyHeadSVG(pose) {
  const look = PET_LOOKS.ghosty;
  const headRot = pose === 'celebrate' ? -7 : pose === 'jump' ? -4 : 0;
  const eyeY = pose === 'celebrate' ? 151 : 157;
  return `<g transform="rotate(${headRot} 286 166)">
    <path d="M232 118 Q216 55 254 45 Q278 66 287 104 Z" fill="${look.ear}" stroke="${look.outline}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M242 104 Q235 68 253 59 Q265 75 270 101 Z" fill="${look.earInner}" opacity=".85"/>
    <path d="M315 102 Q336 45 366 58 Q374 84 357 118 Z" fill="${look.ear}" stroke="${look.outline}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M326 103 Q342 64 359 70 Q362 90 351 108 Z" fill="${look.earInner}" opacity=".85"/>

    <ellipse cx="286" cy="166" rx="86" ry="77" fill="url(#head)" stroke="${look.outline}" stroke-width="4"/>
    <path d="M227 118 Q283 76 341 111 Q326 142 292 145 Q255 142 227 118 Z" fill="#ffffff" opacity=".55"/>

    <ellipse cx="303" cy="205" rx="51" ry="33" fill="#ffffff" stroke="#f4ecf6" stroke-width="3"/>
    <ellipse cx="303" cy="222" rx="33" ry="17" fill="#fdf9fc" opacity=".8"/>

    ${eyeSVG(258, eyeY, 20, 27, look.eye, look.pupil)}
    ${eyeSVG(320, eyeY - 2, 20, 27, look.eye, look.pupil)}

    <ellipse cx="235" cy="198" rx="18" ry="9" fill="${look.blush}" opacity=".72"/>
    <ellipse cx="354" cy="195" rx="16" ry="8" fill="${look.blush}" opacity=".65"/>

    <path d="M309 186 Q321 180 332 186 Q335 194 324 199 Q318 202 316 198 Q305 193 309 186 Z" fill="${look.nose}" stroke="#e58d9e" stroke-width="2"/>
    <path d="M321 199 Q315 212 304 213" stroke="#8f798d" stroke-width="3" stroke-linecap="round"/>
    <path d="M321 199 Q326 211 337 210" stroke="#8f798d" stroke-width="3" stroke-linecap="round"/>
    ${whiskersSVG(316, 210, '#a58aa0', .7)}
  </g>`;
}

function spinHeadSVG(pose) {
  const look = PET_LOOKS.spin;
  const headRot = pose === 'celebrate' ? -8 : pose === 'jump' ? -4 : 0;
  const eyeY = pose === 'celebrate' ? 151 : 157;
  return `<g transform="rotate(${headRot} 286 166)">
    <path d="M230 116 Q216 51 255 44 Q278 66 287 103 Z" fill="${look.ear}" stroke="#11141c" stroke-width="4" stroke-linejoin="round"/>
    <path d="M241 103 Q234 66 254 58 Q266 76 270 100 Z" fill="${look.earInner}" opacity=".8"/>
    <path d="M315 101 Q336 43 368 57 Q376 83 358 117 Z" fill="${look.ear}" stroke="#11141c" stroke-width="4" stroke-linejoin="round"/>
    <path d="M327 101 Q343 62 361 69 Q364 88 352 106 Z" fill="${look.earInner}" opacity=".8"/>

    <ellipse cx="286" cy="166" rx="87" ry="78" fill="url(#head)" stroke="${look.outline}" stroke-width="4"/>
    <path d="M205 142 Q216 78 282 68 Q345 72 371 132 Q343 117 316 127 Q285 109 254 126 Q229 118 205 142 Z" fill="url(#cap)" stroke="#10131a" stroke-width="3"/>
    <path d="M291 93 Q305 118 307 146 Q307 171 300 180 Q289 153 287 121 Q285 105 291 93 Z" fill="#fffdf9"/>
    <path d="M283 113 Q291 139 289 160 Q281 141 276 122 Q275 112 283 113 Z" fill="#fffdf9" opacity=".55"/>

    <ellipse cx="258" cy="${eyeY + 1}" rx="34" ry="37" fill="#1a1d27"/>
    <ellipse cx="319" cy="${eyeY - 2}" rx="34" ry="37" fill="#1a1d27"/>
    ${eyeSVG(258, eyeY, 19, 26, look.eye, look.pupil)}
    ${eyeSVG(319, eyeY - 2, 19, 26, look.eye, look.pupil)}

    <ellipse cx="236" cy="198" rx="17" ry="8" fill="${look.blush}" opacity=".48"/>
    <ellipse cx="355" cy="196" rx="16" ry="8" fill="${look.blush}" opacity=".42"/>

    <ellipse cx="303" cy="205" rx="51" ry="33" fill="#fffdf9" stroke="#f1e7ec" stroke-width="3"/>
    <path d="M309 186 Q321 180 332 186 Q335 194 324 199 Q318 202 316 198 Q305 193 309 186 Z" fill="${look.nose}" stroke="#dd8b9d" stroke-width="2"/>
    <path d="M321 199 Q313 212 303 211" stroke="#756374" stroke-width="3" stroke-linecap="round"/>
    <path d="M321 199 Q326 209 338 207" stroke="#756374" stroke-width="3" stroke-linecap="round"/>
    <path d="M304 211 Q314 216 324 211" stroke="#756374" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>
    ${whiskersSVG(316, 210, '#91778f', .65)}
  </g>`;
}

function oakleyHeadSVG(pose) {
  const look = PET_LOOKS.oakley;
  const headRot = pose === 'celebrate' ? -6 : pose === 'jump' ? -3 : 0;
  const eyeY = pose === 'celebrate' ? 150 : 156;
  return `<g transform="rotate(${headRot} 286 166)">
    <path d="M225 106 Q186 121 192 204 Q196 247 222 251 Q239 222 232 174 Q229 137 242 113 Z" fill="${look.ear}" stroke="#111318" stroke-width="4" stroke-linejoin="round"/>
    <path d="M349 104 Q387 120 381 204 Q377 249 351 250 Q335 220 341 173 Q343 136 330 111 Z" fill="${look.ear}" stroke="#111318" stroke-width="4" stroke-linejoin="round"/>
    <path d="M204 170 Q204 214 217 233 Q226 207 224 172 Z" fill="#3b3b42" opacity=".55"/>
    <path d="M368 168 Q367 214 354 235 Q346 207 349 170 Z" fill="#3b3b42" opacity=".55"/>

    <ellipse cx="286" cy="168" rx="92" ry="82" fill="url(#head)" stroke="${look.outline}" stroke-width="4"/>
    <path d="M240 104 Q286 79 336 106 Q323 132 291 137 Q260 131 240 104 Z" fill="#2b2d34" opacity=".45"/>

    ${eyeSVG(258, eyeY, 20, 25, look.eye, look.pupil)}
    ${eyeSVG(320, eyeY - 2, 20, 25, look.eye, look.pupil)}
    <path d="M234 132 Q249 124 265 130" stroke="#73757e" stroke-width="5" stroke-linecap="round" opacity=".7"/>
    <path d="M303 128 Q318 122 332 128" stroke="#73757e" stroke-width="5" stroke-linecap="round" opacity=".7"/>

    <ellipse cx="303" cy="208" rx="58" ry="39" fill="url(#muzzle)" stroke="#9f989a" stroke-width="3"/>
    <ellipse cx="303" cy="227" rx="38" ry="20" fill="#e4dedc" opacity=".55"/>

    <path d="M309 186 Q321 180 332 186 Q335 194 324 199 Q318 202 316 198 Q305 193 309 186 Z" fill="${look.nose}" stroke="#060708" stroke-width="2"/>

    <path d="M283 206 Q303 199 323 207 Q331 228 315 238 Q298 246 285 233 Q275 220 283 206 Z" fill="#2b1d20"/>
    <path d="M294 224 Q309 215 321 225 Q318 239 305 240 Q294 238 294 224 Z" fill="${look.tongue}"/>
    <path d="M300 226 Q308 222 316 226" stroke="#d95d70" stroke-width="2" stroke-linecap="round" opacity=".65"/>

    <ellipse cx="238" cy="199" rx="18" ry="8" fill="#5f4d4d" opacity=".22"/>
    <ellipse cx="359" cy="198" rx="16" ry="8" fill="#5f4d4d" opacity=".2"/>
    <circle cx="270" cy="217" r="2.3" fill="${look.gray}" opacity=".7"/>
    <circle cx="261" cy="223" r="2" fill="${look.gray}" opacity=".65"/>
    <circle cx="279" cy="229" r="1.8" fill="${look.gray}" opacity=".65"/>
    <circle cx="341" cy="218" r="2.2" fill="${look.gray}" opacity=".65"/>
    <circle cx="350" cy="225" r="1.9" fill="${look.gray}" opacity=".6"/>
    ${whiskersSVG(316, 220, '#d7d2d0', .55)}
  </g>`;
}

function petSVG(pet, pose = 'idle') {
  const look = PET_LOOKS[pet];
  const isDog = pet === 'oakley';
  const bodyY = pose === 'jump' ? -10 : pose === 'land' ? 8 : pose === 'celebrate' ? -5 : pose === 'runA' ? -2 : pose === 'runB' ? 1 : 0;
  const squash = pose === 'land' ? 'translate(210 338) scale(1.055 .905) translate(-210 -338)' : '';
  const body = isDog
    ? `<ellipse cx="195" cy="242" rx="108" ry="75" fill="url(#body)" stroke="${look.outline}" stroke-width="4"/>
       <ellipse cx="202" cy="267" rx="63" ry="39" fill="${look.chest}" opacity=".72"/>
       <path d="M135 218 Q154 188 178 211 Q157 235 135 218 Z" fill="#2b2d34" opacity=".35"/>`
    : `<ellipse cx="195" cy="242" rx="108" ry="73" fill="url(#body)" stroke="${look.outline}" stroke-width="4"/>
       ${pet === 'spin'
         ? `<ellipse cx="205" cy="267" rx="66" ry="42" fill="${look.chest}"/>
            <path d="M142 250 Q166 226 186 247 Q170 274 144 268 Z" fill="#fffdf9" opacity=".9"/>`
         : `<ellipse cx="205" cy="267" rx="67" ry="39" fill="${look.chest}" opacity=".8"/>
            <path d="M143 228 Q155 216 167 228 Q179 216 191 228" stroke="#e9ddeb" stroke-width="3" stroke-linecap="round" opacity=".8"/>`}
       <ellipse cx="172" cy="218" rx="55" ry="28" fill="#ffffff" opacity=".22" transform="rotate(-8 172 218)"/>`;

  const head = isDog ? oakleyHeadSVG(pose) : pet === 'ghosty' ? ghostyHeadSVG(pose) : spinHeadSVG(pose);
  const tail = isDog ? dogTailSVG(pet, pose) : catTailSVG(pet, pose);
  const legs = isDog ? dogLegsSVG(pet, pose) : catLegsSVG(pet, pose);

  const defs = `
    <defs>
      <linearGradient id="body" x1="120" y1="180" x2="280" y2="320" gradientUnits="userSpaceOnUse">
        <stop stop-color="${look.body[0]}"/><stop offset="1" stop-color="${look.body[1]}"/>
      </linearGradient>
      <radialGradient id="head" cx="0" cy="0" r="1" gradientTransform="translate(270 135) rotate(60) scale(130)" gradientUnits="userSpaceOnUse">
        <stop stop-color="${look.head[0]}"/><stop offset="1" stop-color="${look.head[1]}"/>
      </radialGradient>
      ${pet === 'spin' ? `<linearGradient id="cap" x1="235" y1="72" x2="335" y2="160" gradientUnits="userSpaceOnUse">
        <stop stop-color="${look.cap[0]}"/><stop offset="1" stop-color="${look.cap[1]}"/>
      </linearGradient>` : ''}
      ${isDog ? `<linearGradient id="muzzle" x1="270" y1="190" x2="340" y2="245" gradientUnits="userSpaceOnUse">
        <stop stop-color="${look.muzzle[0]}"/><stop offset="1" stop-color="${look.muzzle[1]}"/>
      </linearGradient>` : ''}
    </defs>`;

  const transform = `translate(0 ${bodyY}) ${squash}`;

  return svgDoc(420, 360, `
    ${shadowEllipse(210, 342, 138, 15, 0.14)}
    <g transform="${transform}">
      ${tail}
      ${legs}
      ${body}
      ${head}
      ${pose === 'celebrate' ? `<path d="M78 103 l5 15 15 5 -15 5 -5 15 -5 -15 -15 -5 15 -5 z" fill="#ffe16b" opacity=".95"/>
      <path d="M365 64 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 z" fill="#fff0a1" opacity=".9"/>` : ''}
    </g>
  `, defs);
}

/* ------------------------------------------------------------------ */
/* Collectibles and rescue animals                                    */
/* ------------------------------------------------------------------ */

function itemDefs() {
  return `
    <defs>
      <radialGradient id="gold" cx="0" cy="0" r="1" gradientTransform="translate(45 38) rotate(55) scale(95)" gradientUnits="userSpaceOnUse">
        <stop stop-color="#fff8a8"/><stop offset=".55" stop-color="#ffd84d"/><stop offset="1" stop-color="#f0a42b"/>
      </radialGradient>
      <linearGradient id="pink" x1="35" y1="24" x2="92" y2="105" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffb6d1"/><stop offset="1" stop-color="#ff648f"/>
      </linearGradient>
      <linearGradient id="blue" x1="34" y1="28" x2="98" y2="104" gradientUnits="userSpaceOnUse">
        <stop stop-color="#8ce6ff"/><stop offset="1" stop-color="#4f9bff"/>
      </linearGradient>
      <linearGradient id="mint" x1="32" y1="20" x2="94" y2="106" gradientUnits="userSpaceOnUse">
        <stop stop-color="#baffd9"/><stop offset="1" stop-color="#35c7a1"/>
      </linearGradient>
      <linearGradient id="violet" x1="30" y1="20" x2="96" y2="110" gradientUnits="userSpaceOnUse">
        <stop stop-color="#cfb3ff"/><stop offset="1" stop-color="#8d67e8"/>
      </linearGradient>
      <radialGradient id="bubble" cx="0" cy="0" r="1" gradientTransform="translate(48 38) rotate(52) scale(88)" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" stop-opacity=".95"/><stop offset=".45" stop-color="#a8f3ff" stop-opacity=".55"/><stop offset="1" stop-color="#ffd5f0" stop-opacity=".4"/>
      </radialGradient>
    </defs>`;
}

const ITEMS = {
  star: {
    w: 128, h: 128,
    body: `${shadowEllipse(64, 112, 34, 8, .12)}
      <path d="M64 9 L78 45 L117 48 L87 72 L97 111 L64 89 L31 111 L41 72 L11 48 L50 45 Z" fill="url(#gold)" stroke="#d9921f" stroke-width="4" stroke-linejoin="round"/>
      <path d="M64 24 L72 49 L98 51 L78 67 L85 93 L64 79 L43 93 L50 67 L30 51 L56 49 Z" fill="#fff8aa" opacity=".45"/>
      <circle cx="48" cy="54" r="4" fill="#fff" opacity=".8"/>
      <path d="M98 24 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3 z" fill="#fff9bd"/>`,
  },
  gem: {
    w: 128, h: 128,
    body: `${shadowEllipse(64, 114, 32, 8, .12)}
      <path d="M64 11 L103 45 L84 111 L44 111 L25 45 Z" fill="url(#blue)" stroke="#3f78d8" stroke-width="4" stroke-linejoin="round"/>
      <path d="M64 11 L83 45 L64 111 L45 45 Z" fill="#c9f4ff" opacity=".55"/>
      <path d="M25 45 L103 45 L84 111 L44 111 Z" fill="none" stroke="#ffffff" stroke-width="2" opacity=".35"/>
      <path d="M38 31 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" fill="#fff" opacity=".8"/>`,
  },
  heart: {
    w: 128, h: 128,
    body: `${shadowEllipse(64, 112, 32, 8, .12)}
      <path d="M64 109 C24 82 13 48 34 31 C47 21 60 27 64 38 C68 27 81 21 94 31 C115 48 104 82 64 109 Z" fill="url(#pink)" stroke="#df5a80" stroke-width="4" stroke-linejoin="round"/>
      <path d="M37 44 Q32 65 47 82" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".45"/>`,
  },
  butterfly: {
    w: 128, h: 128,
    body: `${shadowEllipse(64, 112, 30, 7, .1)}
      <path d="M62 67 C42 28 12 32 16 57 C18 72 37 77 58 75 C37 79 22 94 31 105 C43 117 59 99 64 78 Z" fill="url(#violet)" stroke="#7e5bd7" stroke-width="3"/>
      <path d="M66 67 C86 28 116 32 112 57 C110 72 91 77 70 75 C91 79 106 94 97 105 C85 117 69 99 64 78 Z" fill="url(#pink)" stroke="#df5a80" stroke-width="3"/>
      <ellipse cx="64" cy="70" rx="5" ry="24" fill="#45345f"/>
      <circle cx="64" cy="44" r="6" fill="#45345f"/>
      <path d="M61 39 Q54 30 48 28 M67 39 Q74 30 80 28" stroke="#45345f" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="31" cy="56" r="5" fill="#fff" opacity=".45"/><circle cx="97" cy="56" r="5" fill="#fff" opacity=".4"/>`,
  },
  sparkle: {
    w: 128, h: 128,
    body: `${shadowEllipse(64, 112, 26, 7, .08)}
      <path d="M64 8 Q71 50 114 56 Q71 62 64 106 Q57 62 14 56 Q57 50 64 8 Z" fill="url(#gold)" stroke="#e6a62e" stroke-width="3"/>
      <path d="M64 25 Q69 50 96 56 Q69 62 64 88 Q59 62 32 56 Q59 50 64 25 Z" fill="#fffbe0" opacity=".8"/>
      <circle cx="100" cy="28" r="4" fill="#fff" opacity=".8"/>`,
  },
  ribbon: {
    w: 128, h: 128,
    body: `${shadowEllipse(64, 112, 30, 7, .1)}
      <path d="M29 57 C16 36 34 20 51 31 C59 36 62 45 62 54 C62 31 79 19 95 30 C111 41 105 61 91 68 C77 75 70 78 64 91 C58 78 48 71 29 57 Z" fill="url(#pink)" stroke="#d95779" stroke-width="3"/>
      <path d="M64 90 Q47 100 35 117 Q54 114 64 96 Q74 114 93 117 Q81 100 64 90 Z" fill="url(#pink)" stroke="#d95779" stroke-width="3"/>
      <path d="M38 41 Q50 38 55 52" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45"/>`,
  },
  treat: {
    w: 128, h: 128,
    body: `${shadowEllipse(64, 112, 34, 8, .1)}
      <g transform="rotate(-18 64 65)">
        <path d="M23 45 C17 32 30 23 41 29 C47 32 50 37 52 43 L76 43 C78 36 83 30 90 30 C101 30 111 40 106 52 C103 59 97 62 91 61 L85 78 C90 86 86 99 75 101 C64 103 56 95 57 86 L71 69 L45 69 L59 87 C59 96 51 104 40 101 C29 98 25 87 31 79 L37 62 C27 60 21 54 23 45 Z" fill="url(#gold)" stroke="#d7961d" stroke-width="3" stroke-linejoin="round"/>
        <path d="M40 36 Q52 31 61 42" stroke="#fff8b0" stroke-width="5" stroke-linecap="round" opacity=".7"/>
      </g>`,
  },
  bubble: {
    w: 128, h: 128,
    body: `${shadowEllipse(64, 113, 28, 7, .07)}
      <circle cx="64" cy="62" r="48" fill="url(#bubble)" stroke="#ffffff" stroke-width="3" opacity=".92"/>
      <path d="M37 41 Q49 27 66 26" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".8"/>
      <circle cx="80" cy="82" r="8" fill="#fff" opacity=".35"/>
      <circle cx="86" cy="47" r="4" fill="#fff" opacity=".7"/>`,
  },
};

/* ------------------------------------------------------------------ */
/* Rescue animals                                                     */
/* ------------------------------------------------------------------ */

const ANIMALS = {
  bunny: {
    name: 'Bunny',
    w: 200, h: 200,
    body: `${shadowEllipse(100, 185, 58, 9, .12)}
      <ellipse cx="100" cy="150" rx="52" ry="42" fill="#fff8f0" stroke="#d9c9c1" stroke-width="3"/>
      <ellipse cx="80" cy="58" rx="15" ry="49" fill="#fff8f0" stroke="#d9c9c1" stroke-width="3" transform="rotate(-10 80 58)"/>
      <ellipse cx="121" cy="55" rx="15" ry="51" fill="#fff8f0" stroke="#d9c9c1" stroke-width="3" transform="rotate(9 121 55)"/>
      <ellipse cx="80" cy="58" rx="7" ry="36" fill="#ffc8d6" transform="rotate(-10 80 58)"/>
      <ellipse cx="121" cy="55" rx="7" ry="38" fill="#ffc8d6" transform="rotate(9 121 55)"/>
      <ellipse cx="100" cy="112" rx="42" ry="37" fill="#fffaf5" stroke="#d9c9c1" stroke-width="3"/>
      ${eyeSVG(85, 109, 8, 10, '#9e6b48', '#39261d')}
      ${eyeSVG(116, 109, 8, 10, '#9e6b48', '#39261d')}
      <path d="M96 122 Q101 126 106 122 Q108 129 101 133 Q94 129 96 122 Z" fill="#ff9eb5"/>
      <path d="M101 133 Q96 139 91 139 M101 133 Q107 139 112 139" stroke="#9a7b72" stroke-width="2.4" stroke-linecap="round"/>
      <ellipse cx="71" cy="123" rx="8" ry="4" fill="#ffc4ce" opacity=".65"/><ellipse cx="132" cy="123" rx="8" ry="4" fill="#ffc4ce" opacity=".65"/>`,
  },
  bird: {
    name: 'Birdie',
    w: 200, h: 200,
    body: `${shadowEllipse(100, 185, 48, 8, .1)}
      <ellipse cx="100" cy="133" rx="51" ry="44" fill="#7dd4ff" stroke="#4f9edb" stroke-width="3"/>
      <circle cx="111" cy="90" r="38" fill="#8bddff" stroke="#4f9edb" stroke-width="3"/>
      <path d="M91 88 Q63 87 72 109 Q80 120 99 105 Z" fill="#66c8f5" stroke="#4f9edb" stroke-width="3"/>
      <path d="M136 93 L166 101 L136 109 Z" fill="#ffc94a" stroke="#e4a521" stroke-width="3"/>
      ${eyeSVG(119, 84, 10, 12, '#3b2e22', '#171310')}
      <path d="M70 131 Q83 120 94 129 Q86 142 70 131 Z" fill="#b7efff" opacity=".55"/>
      <path d="M104 176 l-8 13 M120 176 l8 13" stroke="#e5a629" stroke-width="5" stroke-linecap="round"/>`,
  },
  kitten: {
    name: 'Kitten',
    w: 200, h: 200,
    body: `${shadowEllipse(100, 185, 56, 9, .12)}
      <ellipse cx="100" cy="152" rx="49" ry="38" fill="#f7b56e" stroke="#c98643" stroke-width="3"/>
      <path d="M74 94 L66 55 Q84 63 91 84 Z" fill="#f7b56e" stroke="#c98643" stroke-width="3"/>
      <path d="M125 92 L141 57 Q151 78 142 102 Z" fill="#f7b56e" stroke="#c98643" stroke-width="3"/>
      <path d="M76 91 Q70 69 71 61 Q81 68 84 85 Z" fill="#ffc6c9"/>
      <path d="M129 93 Q142 72 145 64 Q144 84 139 98 Z" fill="#ffc6c9"/>
      <ellipse cx="101" cy="107" rx="44" ry="38" fill="#ffc98a" stroke="#c98643" stroke-width="3"/>
      <path d="M72 100 Q84 94 94 100 M108 100 Q119 93 131 100" stroke="#c98643" stroke-width="3" stroke-linecap="round"/>
      ${eyeSVG(85, 105, 9, 11, '#a6c94f', '#2c3319')}
      ${eyeSVG(117, 105, 9, 11, '#a6c94f', '#2c3319')}
      <ellipse cx="101" cy="121" rx="20" ry="15" fill="#fff4e4"/>
      <path d="M97 116 Q101 114 105 116 Q107 122 101 124 Q95 122 97 116 Z" fill="#ef9aad"/>
      <path d="M101 125 Q97 131 92 131 M101 125 Q106 131 111 131" stroke="#9b715e" stroke-width="2.3" stroke-linecap="round"/>`,
  },
  turtle: {
    name: 'Turtle',
    w: 200, h: 200,
    body: `${shadowEllipse(100, 183, 58, 9, .1)}
      <ellipse cx="103" cy="149" rx="56" ry="42" fill="#9bd77c" stroke="#5f9e50" stroke-width="3"/>
      <path d="M56 145 Q52 113 78 105 Q102 98 119 116 Q137 130 133 154 Q129 174 102 181 Q72 180 56 145 Z" fill="#7ec86b" stroke="#4f8b48" stroke-width="3"/>
      <path d="M79 110 Q90 132 78 166 M111 109 Q103 133 116 169 M60 137 Q90 143 129 136 M58 151 Q94 157 132 151" stroke="#4f8b48" stroke-width="3" opacity=".7"/>
      <circle cx="138" cy="132" r="28" fill="#a8df8b" stroke="#5f9e50" stroke-width="3"/>
      ${eyeSVG(129, 126, 7, 8, '#6b4a2d', '#241a10')}
      ${eyeSVG(150, 127, 7, 8, '#6b4a2d', '#241a10')}
      <path d="M137 140 Q144 146 151 139" stroke="#4e7344" stroke-width="2.6" stroke-linecap="round"/>
      <ellipse cx="72" cy="174" rx="18" ry="8" fill="#9bd77c" stroke="#5f9e50" stroke-width="2.5"/>
      <ellipse cx="128" cy="174" rx="18" ry="8" fill="#9bd77c" stroke="#5f9e50" stroke-width="2.5"/>`,
  },
  duckling: {
    name: 'Duckling',
    w: 200, h: 200,
    body: `${shadowEllipse(100, 183, 48, 8, .1)}
      <ellipse cx="100" cy="139" rx="50" ry="40" fill="#ffe06d" stroke="#e2b52d" stroke-width="3"/>
      <circle cx="112" cy="92" r="36" fill="#ffe77f" stroke="#e2b52d" stroke-width="3"/>
      <path d="M138 93 L169 102 L137 111 Z" fill="#ff9f3f" stroke="#d77e23" stroke-width="3"/>
      ${eyeSVG(121, 85, 9, 11, '#4d3b22', '#1c150e')}
      <path d="M67 138 Q83 124 99 135 Q88 150 67 138 Z" fill="#fff0a8" opacity=".65"/>
      <path d="M85 178 l-5 12 M111 178 l5 12" stroke="#e2a02a" stroke-width="5" stroke-linecap="round"/>
      <path d="M70 148 Q78 142 88 147" stroke="#fff6c9" stroke-width="4" stroke-linecap="round"/>`,
  },
  squirrel: {
    name: 'Squirrel',
    w: 200, h: 200,
    body: `${shadowEllipse(100, 184, 53, 8, .1)}
      <path d="M148 167 Q194 153 180 110 Q169 77 141 91 Q159 106 155 129 Q151 151 126 151 Z" fill="#e89453" stroke="#b76a34" stroke-width="3"/>
      <ellipse cx="97" cy="151" rx="43" ry="36" fill="#f1a967" stroke="#b76a34" stroke-width="3"/>
      <circle cx="109" cy="101" r="34" fill="#f5b977" stroke="#b76a34" stroke-width="3"/>
      <path d="M82 80 L77 53 Q92 61 96 80 Z" fill="#f5b977" stroke="#b76a34" stroke-width="3"/>
      <path d="M128 77 L140 54 Q148 75 142 93 Z" fill="#f5b977" stroke="#b76a34" stroke-width="3"/>
      <ellipse cx="96" cy="119" rx="23" ry="18" fill="#ffe1bc"/>
      ${eyeSVG(95, 98, 9, 11, '#6c4a2e', '#24180f')}
      ${eyeSVG(121, 98, 9, 11, '#6c4a2e', '#24180f')}
      <path d="M105 113 Q110 110 115 113 Q117 120 110 123 Q103 120 105 113 Z" fill="#6d4d33"/>
      <ellipse cx="111" cy="168" rx="22" ry="11" fill="#ffe1bc" opacity=".8"/>`,
  },
  puppy: {
    name: 'Puppy',
    w: 200, h: 200,
    body: `${shadowEllipse(100, 184, 52, 8, .1)}
      <ellipse cx="101" cy="151" rx="48" ry="37" fill="#c98a5e" stroke="#92603d" stroke-width="3"/>
      <circle cx="105" cy="101" r="38" fill="#d79b6d" stroke="#92603d" stroke-width="3"/>
      <path d="M77 78 Q52 82 55 127 Q57 146 73 140 Q82 118 88 93 Z" fill="#a96f4b" stroke="#7c4f32" stroke-width="3"/>
      <path d="M135 77 Q160 82 158 126 Q156 146 140 140 Q131 117 124 92 Z" fill="#a96f4b" stroke="#7c4f32" stroke-width="3"/>
      <ellipse cx="105" cy="119" rx="27" ry="21" fill="#f1d2b2"/>
      ${eyeSVG(91, 98, 9, 11, '#8d5c30', '#2a1a0e')}
      ${eyeSVG(119, 98, 9, 11, '#8d5c30', '#2a1a0e')}
      <path d="M99 113 Q105 110 111 113 Q114 120 105 124 Q97 120 99 113 Z" fill="#3d2a1e"/>
      <path d="M105 124 Q99 132 92 131 M105 124 Q111 132 118 131" stroke="#805c43" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M79 129 Q87 122 96 128" stroke="#f8c79f" stroke-width="4" stroke-linecap="round" opacity=".5"/>`,
  },
};

/* ------------------------------------------------------------------ */
/* Obstacles                                                          */
/* ------------------------------------------------------------------ */

const OBSTACLES = {
  puddle: {
    w: 260, h: 110,
    body: `<ellipse cx="130" cy="72" rx="116" ry="28" fill="#4f9fe0" opacity=".22"/>
      <ellipse cx="130" cy="68" rx="105" ry="30" fill="#68c9f4" stroke="#3d9bd0" stroke-width="3"/>
      <ellipse cx="130" cy="65" rx="88" ry="20" fill="#a8e6ff" opacity=".7"/>
      <path d="M64 67 Q94 52 124 63" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>
      <circle cx="174" cy="62" r="5" fill="#fff" opacity=".55"/>
      <path d="M44 43 q8 -16 16 0 q-8 12 -16 0" fill="#68c9f4" opacity=".75"/>
      <path d="M218 40 q7 -13 13 0 q-7 10 -13 0" fill="#68c9f4" opacity=".65"/>`,
  },
  log: {
    w: 230, h: 140,
    body: `<ellipse cx="115" cy="122" rx="96" ry="10" fill="#4a3b32" opacity=".12"/>
      <rect x="28" y="47" width="175" height="73" rx="34" fill="#9b6846" stroke="#6e482f" stroke-width="4"/>
      <ellipse cx="198" cy="83" rx="27" ry="35" fill="#c68c5e" stroke="#6e482f" stroke-width="4"/>
      <ellipse cx="198" cy="83" rx="15" ry="23" fill="#a96f48" stroke="#7f5638" stroke-width="2"/>
      <path d="M46 71 Q80 56 113 68 M50 94 Q91 82 135 95 M58 109 Q100 103 141 111" stroke="#7c5136" stroke-width="4" stroke-linecap="round" opacity=".55"/>
      <path d="M57 58 Q46 42 56 33 Q67 40 69 57 Z" fill="#7bcb7e" stroke="#4b9b5f" stroke-width="2.5"/>
      <path d="M69 60 Q72 42 88 42 Q89 57 79 65 Z" fill="#96dd86" stroke="#4b9b5f" stroke-width="2.5"/>
      <path d="M176 38 q7 -10 15 1 q-7 9 -15 -1" fill="#ffd66e" opacity=".9"/>`,
  },
  yarn: {
    w: 180, h: 170,
    body: `${shadowEllipse(90, 154, 60, 9, .12)}
      <circle cx="90" cy="89" r="61" fill="#d78bd9" stroke="#a859b4" stroke-width="4"/>
      <path d="M43 61 Q88 39 139 70 M35 89 Q89 61 150 99 M45 117 Q93 90 143 124 M62 137 Q95 110 131 142" stroke="#a859b4" stroke-width="5" stroke-linecap="round" opacity=".75"/>
      <path d="M40 78 Q96 109 137 66 M54 52 Q101 84 146 53" stroke="#f3c5ef" stroke-width="4" stroke-linecap="round" opacity=".7"/>
      <path d="M143 135 Q168 141 168 160 Q160 171 148 163" stroke="#d78bd9" stroke-width="7" stroke-linecap="round"/>
      <path d="M151 144 Q164 146 161 157" stroke="#f3c5ef" stroke-width="3" stroke-linecap="round"/>`,
  },
  mushroom: {
    w: 200, h: 190,
    body: `${shadowEllipse(100, 174, 62, 9, .12)}
      <path d="M82 95 Q74 142 85 164 Q100 172 116 163 Q127 139 118 96 Z" fill="#fff2da" stroke="#d7b98d" stroke-width="3"/>
      <path d="M22 92 Q27 28 100 22 Q173 29 178 92 Q145 116 100 116 Q54 115 22 92 Z" fill="#e8799a" stroke="#b94f75" stroke-width="4"/>
      <ellipse cx="100" cy="76" rx="80" ry="18" fill="#ffc0cf" opacity=".45"/>
      <circle cx="64" cy="57" r="13" fill="#ffe8ec" opacity=".9"/>
      <circle cx="118" cy="42" r="10" fill="#ffe8ec" opacity=".9"/>
      <circle cx="151" cy="72" r="8" fill="#ffe8ec" opacity=".85"/>
      <circle cx="89" cy="93" r="6" fill="#ffe8ec" opacity=".8"/>
      <path d="M63 144 Q71 139 79 144 M119 143 Q127 138 135 143" stroke="#d7b98d" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
  },
  gumdrop: {
    w: 180, h: 180,
    body: `${shadowEllipse(90, 164, 58, 8, .11)}
      <path d="M30 139 Q30 64 90 44 Q150 64 150 139 Q122 158 90 158 Q58 158 30 139 Z" fill="#7de0c1" stroke="#3aaf94" stroke-width="4"/>
      <path d="M47 101 Q72 54 107 61 Q91 101 94 146 Q67 144 47 101 Z" fill="#b7ffe7" opacity=".35"/>
      <circle cx="57" cy="91" r="4" fill="#fff" opacity=".8"/><circle cx="85" cy="66" r="3.5" fill="#fff" opacity=".7"/><circle cx="118" cy="87" r="4" fill="#fff" opacity=".75"/><circle cx="132" cy="116" r="3" fill="#fff" opacity=".6"/>
      <path d="M64 126 Q73 119 84 126" stroke="#2f9d86" stroke-width="3" stroke-linecap="round" opacity=".55"/>`,
  },
  chocolate: {
    w: 260, h: 110,
    body: `<ellipse cx="130" cy="72" rx="116" ry="28" fill="#5b3224" opacity=".2"/>
      <ellipse cx="130" cy="67" rx="106" ry="29" fill="#8e5639" stroke="#63351f" stroke-width="3"/>
      <ellipse cx="130" cy="63" rx="88" ry="19" fill="#b87952" opacity=".8"/>
      <path d="M67 63 Q92 49 123 61" stroke="#e0a57b" stroke-width="5" stroke-linecap="round" opacity=".55"/>
      <path d="M42 43 q8 -16 16 0 q-8 12 -16 0" fill="#8e5639" opacity=".75"/>
      <path d="M218 40 q7 -13 13 0 q-7 10 -13 0" fill="#8e5639" opacity=".65"/>
      <circle cx="171" cy="58" r="4" fill="#f3c6a0" opacity=".6"/>`,
  },
  cloud: {
    w: 230, h: 130,
    body: `<ellipse cx="115" cy="116" rx="94" ry="8" fill="#5e7eaa" opacity=".08"/>
      <path d="M42 92 Q18 93 20 70 Q22 48 47 49 Q52 22 82 25 Q108 3 136 27 Q163 23 172 49 Q204 48 208 71 Q212 93 187 96 Q164 109 138 103 Q110 117 84 105 Q59 109 42 92 Z" fill="#fffdfb" stroke="#d9e8f2" stroke-width="3"/>
      <path d="M61 53 Q76 36 96 41" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".8"/>
      <circle cx="80" cy="72" r="4" fill="#9cc5e8" opacity=".7"/>
      <circle cx="151" cy="70" r="4" fill="#9cc5e8" opacity=".7"/>
      <path d="M103 80 Q113 87 123 79" stroke="#9cc5e8" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
  },
  candy: {
    w: 160, h: 230,
    body: `${shadowEllipse(80, 217, 42, 7, .1)}
      <path d="M88 214 C46 203 43 169 66 143 C91 114 116 81 108 55" stroke="#fff" stroke-width="27" stroke-linecap="round"/>
      <path d="M88 214 C46 203 43 169 66 143 C91 114 116 81 108 55" stroke="#ff7897" stroke-width="20" stroke-linecap="round"/>
      <path d="M64 190 Q49 179 47 164 M53 150 Q57 132 72 119 M94 101 Q102 84 100 68" stroke="#fff4f6" stroke-width="7" stroke-linecap="round"/>
      <path d="M106 55 Q96 39 110 27 Q124 16 136 27 Q150 40 137 54 Q125 67 106 55 Z" fill="#ff9cb2" stroke="#e26a86" stroke-width="3"/>
      <circle cx="124" cy="36" r="5" fill="#fff" opacity=".7"/>`,
  },
  flowerbed: {
    w: 300, h: 130,
    body: `${shadowEllipse(150, 118, 118, 8, .1)}
      <path d="M32 112 Q150 72 268 112 Q246 130 150 129 Q54 130 32 112 Z" fill="#5fbe70" opacity=".5"/>
      <path d="M62 112 Q68 84 75 112 M92 114 Q99 76 106 114 M128 115 Q135 72 142 115 M165 115 Q172 78 179 115 M202 114 Q209 84 216 114 M235 112 Q242 92 249 112" stroke="#45a85a" stroke-width="4" stroke-linecap="round"/>
      <g fill="#ff8fb2"><circle cx="75" cy="80" r="13"/><circle cx="106" cy="72" r="14"/><circle cx="142" cy="68" r="15"/><circle cx="179" cy="74" r="13"/><circle cx="216" cy="80" r="12"/></g>
      <g fill="#fff2a8"><circle cx="75" cy="80" r="5"/><circle cx="106" cy="72" r="5.5"/><circle cx="142" cy="68" r="6"/><circle cx="179" cy="74" r="5"/><circle cx="216" cy="80" r="5"/></g>
      <g fill="#a9dcff"><circle cx="56" cy="91" r="9"/><circle cx="126" cy="87" r="10"/><circle cx="198" cy="89" r="9"/><circle cx="253" cy="93" r="8"/></g>
      <g fill="#ffd866"><circle cx="56" cy="91" r="4"/><circle cx="126" cy="87" r="4"/><circle cx="198" cy="89" r="4"/><circle cx="253" cy="93" r="3.5"/></g>`,
  },
  gate: {
    w: 300, h: 340,
    body: `<ellipse cx="150" cy="322" rx="94" ry="12" fill="#7a5b8d" opacity=".12"/>
      <path d="M62 312 L62 122 Q62 45 150 45 Q238 45 238 122 L238 312" stroke="#fff3c8" stroke-width="28" stroke-linecap="round"/>
      <path d="M62 312 L62 122 Q62 45 150 45 Q238 45 238 122 L238 312" stroke="#ffd978" stroke-width="18" stroke-linecap="round"/>
      <path d="M78 312 L78 128 Q78 68 150 68 Q222 68 222 128 L222 312" stroke="#9ff0d1" stroke-width="7" stroke-linecap="round" opacity=".7"/>
      <circle cx="150" cy="48" r="18" fill="#fff6ad" stroke="#ffc43f" stroke-width="4"/>
      <path d="M150 30 l5 11 11 2 -8 9 2 12 -10 -6 -10 6 2 -12 -8 -9 11 -2 z" fill="#fff"/>
      <path d="M99 92 Q120 73 144 84" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".7"/>
      <path d="M146 318 Q146 288 150 274 Q154 288 154 318 Z" fill="#ffdf70" opacity=".8"/>`,
  },
  finish: {
    w: 420, h: 430,
    body: `<ellipse cx="210" cy="414" rx="145" ry="12" fill="#65507d" opacity=".12"/>
      <path d="M78 396 L78 154 Q78 57 210 57 Q342 57 342 154 L342 396" stroke="#fff4d8" stroke-width="30" stroke-linecap="round"/>
      <path d="M78 396 L78 154 Q78 57 210 57 Q342 57 342 154 L342 396" stroke="#ff9f75" stroke-width="19" stroke-linecap="round"/>
      <path d="M95 396 L95 160 Q95 78 210 78 Q325 78 325 160 L325 396" stroke="#ffd96b" stroke-width="8" stroke-linecap="round" opacity=".8"/>
      <path d="M96 136 Q120 108 151 119 Q166 99 190 113 Q212 90 234 113 Q263 99 281 123 Q311 111 325 138" stroke="#74dfb1" stroke-width="11" stroke-linecap="round"/>
      <g fill="#fff">
        <path d="M85 149 l15 31 34 2 -26 22 7 33 -30 -18 -29 18 8 -33 -26 -22 34 -2 z"/>
        <path d="M335 149 l15 31 34 2 -26 22 7 33 -30 -18 -29 18 8 -33 -26 -22 34 -2 z"/>
      </g>
      <g fill="#ff7c9d">
        <path d="M085 149 l11 24 26 2 -20 17 6 26 -23 -14 -22 14 5 -26 -19 -17 25 -2 z" opacity=".9"/>
        <path d="M335 149 l11 24 26 2 -20 17 6 26 -23 -14 -22 14 5 -26 -19 -17 25 -2 z" opacity=".9"/>
      </g>
      <circle cx="210" cy="62" r="28" fill="#fff7a8" stroke="#ffc83d" stroke-width="5"/>
      <path d="M210 40 l7 15 16 3 -12 12 3 17 -14 -8 -14 8 3 -17 -12 -12 16 -3 z" fill="#ffd23f"/>
      <path d="M140 306 Q174 283 210 306 Q246 283 280 306 Q260 333 210 333 Q160 333 140 306 Z" fill="#ff8fb7" opacity=".6"/>`,
  },
  rainbow: {
    w: 600, h: 300,
    body: `<path d="M48 278 Q48 58 300 58 Q552 58 552 278" stroke="#ff7d9c" stroke-width="28" fill="none" stroke-linecap="round"/>
      <path d="M72 278 Q72 85 300 85 Q528 85 528 278" stroke="#ffb05c" stroke-width="24" fill="none" stroke-linecap="round"/>
      <path d="M95 278 Q95 111 300 111 Q505 111 505 278" stroke="#ffe66d" stroke-width="20" fill="none" stroke-linecap="round"/>
      <path d="M117 278 Q117 136 300 136 Q483 136 483 278" stroke="#7ee0a2" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="M138 278 Q138 160 300 160 Q462 160 462 278" stroke="#7dd6ff" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M158 278 Q158 183 300 183 Q442 183 442 278" stroke="#b59cff" stroke-width="9" fill="none" stroke-linecap="round"/>`,
  },
};

/* ------------------------------------------------------------------ */
/* Environment props                                                  */
/* ------------------------------------------------------------------ */

const PROPS = {
  treeMeadow: {
    w: 320, h: 430,
    body: `${shadowEllipse(160, 408, 92, 10, .1)}
      <path d="M144 402 Q150 305 144 237 Q138 175 160 143 Q182 175 176 237 Q170 305 176 402 Z" fill="#a56f4a" stroke="#7e5034" stroke-width="4"/>
      <path d="M162 330 Q130 300 104 287 M160 292 Q192 264 219 258" stroke="#8f5d3d" stroke-width="9" stroke-linecap="round"/>
      <g fill="#6fcf86" stroke="#43a964" stroke-width="4">
        <circle cx="118" cy="163" r="62"/><circle cx="205" cy="152" r="69"/><circle cx="162" cy="96" r="63"/><circle cx="89" cy="112" r="45"/><circle cx="232" cy="103" r="48"/>
      </g>
      <g fill="#9ae79b" opacity=".75"><circle cx="104" cy="145" r="32"/><circle cx="186" cy="124" r="38"/><circle cx="150" cy="76" r="28"/></g>
      <g fill="#ff8fb2"><circle cx="92" cy="175" r="8"/><circle cx="222" cy="173" r="7"/><circle cx="151" cy="154" r="6"/></g>`,
  },
  treeForest: {
    w: 330, h: 450,
    body: `${shadowEllipse(165, 426, 96, 10, .12)}
      <path d="M145 422 Q142 315 132 246 Q120 171 165 133 Q210 173 199 246 Q188 315 187 422 Z" fill="#775a76" stroke="#553f5a" stroke-width="4"/>
      <path d="M160 342 Q117 306 82 298 M166 301 Q211 266 247 262" stroke="#654c69" stroke-width="10" stroke-linecap="round"/>
      <g fill="#7bcfc4" stroke="#4fa8a3" stroke-width="4">
        <circle cx="113" cy="170" r="64"/><circle cx="211" cy="153" r="72"/><circle cx="164" cy="90" r="64"/><circle cx="83" cy="108" r="48"/><circle cx="241" cy="104" r="50"/>
      </g>
      <g fill="#a6eee0" opacity=".65"><circle cx="100" cy="147" r="34"/><circle cx="191" cy="125" r="41"/><circle cx="151" cy="70" r="29"/></g>
      <g fill="#ffe78a"><circle cx="92" cy="178" r="7"/><circle cx="232" cy="176" r="7"/><circle cx="164" cy="149" r="6"/></g>
      <path d="M132 258 Q160 235 191 258" stroke="#d8fff6" stroke-width="4" stroke-linecap="round" opacity=".5"/>`,
  },
  mushroomProp: {
    w: 180, h: 190,
    body: `<ellipse cx="90" cy="172" rx="56" ry="8" fill="#4b3c62" opacity=".12"/>
      <path d="M78 96 Q70 144 84 166 Q100 174 116 164 Q127 140 118 97 Z" fill="#fff3df" stroke="#d6bd9b" stroke-width="3"/>
      <path d="M20 93 Q26 28 100 22 Q174 29 180 93 Q145 117 100 117 Q54 116 20 93 Z" fill="#a782e8" stroke="#7354b8" stroke-width="4"/>
      <ellipse cx="100" cy="77" rx="81" ry="18" fill="#d9c6ff" opacity=".55"/>
      <circle cx="64" cy="57" r="12" fill="#fff0ff" opacity=".9"/><circle cx="119" cy="43" r="9" fill="#fff0ff" opacity=".9"/><circle cx="151" cy="72" r="8" fill="#fff0ff" opacity=".85"/>
      <circle cx="82" cy="146" r="4" fill="#ffe98c"/><circle cx="117" cy="154" r="3.5" fill="#ffe98c"/>`,
  },
  lollipop: {
    w: 260, h: 400,
    body: `${shadowEllipse(130, 382, 74, 9, .1)}
      <rect x="121" y="155" width="18" height="226" rx="9" fill="#fff8ef" stroke="#d9c5b5" stroke-width="3"/>
      <path d="M120 382 Q100 360 102 338 M138 382 Q157 360 156 338" stroke="#fff8ef" stroke-width="13" stroke-linecap="round" opacity=".8"/>
      <circle cx="130" cy="104" r="82" fill="#ff8fae" stroke="#d75e86" stroke-width="4"/>
      <path d="M130 22 A82 82 0 0 1 212 104 A41 82 0 0 0 130 22 Z" fill="#ffd0df" opacity=".55"/>
      <path d="M94 79 Q130 48 166 79 Q142 78 130 104 Q118 78 94 79 Z" fill="#fff2a0" opacity=".9"/>
      <path d="M106 133 Q130 110 154 133 Q130 155 106 133 Z" fill="#fff" opacity=".45"/>
      <circle cx="94" cy="92" r="5" fill="#fff" opacity=".8"/><circle cx="164" cy="114" r="4" fill="#fff" opacity=".7"/>`,
  },
  gumdropProp: {
    w: 220, h: 240,
    body: `${shadowEllipse(110, 224, 76, 8, .1)}
      <path d="M35 190 Q35 78 110 44 Q185 78 185 190 Q150 218 110 218 Q70 218 35 190 Z" fill="#78e0c4" stroke="#39ad91" stroke-width="4"/>
      <path d="M56 124 Q82 60 123 65 Q105 117 108 208 Q80 201 56 124 Z" fill="#c6ffef" opacity=".4"/>
      <circle cx="67" cy="128" r="4" fill="#fff" opacity=".8"/><circle cx="103" cy="77" r="3.5" fill="#fff" opacity=".7"/><circle cx="150" cy="122" r="4" fill="#fff" opacity=".75"/><circle cx="166" cy="164" r="3" fill="#fff" opacity=".6"/>`,
  },
  candyCane: {
    w: 190, h: 300,
    body: `${shadowEllipse(95, 286, 48, 7, .1)}
      <path d="M102 280 C44 264 39 219 71 183 C103 147 131 106 121 75" stroke="#fff" stroke-width="28" stroke-linecap="round"/>
      <path d="M102 280 C44 264 39 219 71 183 C103 147 131 106 121 75" stroke="#ff7697" stroke-width="20" stroke-linecap="round"/>
      <path d="M71 244 Q53 230 52 211 M60 194 Q66 173 84 158 M107 129 Q117 109 114 88" stroke="#fff3f5" stroke-width="7" stroke-linecap="round"/>
      <path d="M120 75 Q108 54 126 38 Q143 24 158 38 Q175 55 158 73 Q142 89 120 75 Z" fill="#ff9eb5" stroke="#e06584" stroke-width="3"/>
      <circle cx="140" cy="51" r="5" fill="#fff" opacity=".75"/>`,
  },
  flower: {
    w: 130, h: 190,
    body: `<path d="M64 182 Q60 137 64 99" stroke="#47a55c" stroke-width="7" stroke-linecap="round"/>
      <path d="M62 151 Q40 142 32 120 Q54 119 65 138 Z" fill="#73d182"/>
      <path d="M67 140 Q89 130 99 110 Q76 112 65 131 Z" fill="#8be292"/>
      <g fill="#ff8fb5" stroke="#d95c85" stroke-width="3"><circle cx="64" cy="56" r="24"/><circle cx="93" cy="73" r="21"/><circle cx="84" cy="101" r="21"/><circle cx="50" cy="102" r="21"/><circle cx="37" cy="75" r="21"/></g>
      <circle cx="64" cy="80" r="21" fill="#ffe27a" stroke="#e8b62b" stroke-width="3"/>
      <circle cx="56" cy="73" r="4" fill="#fff7c8" opacity=".8"/>`,
  },
  bush: {
    w: 300, h: 170,
    body: `${shadowEllipse(150, 154, 120, 8, .1)}
      <g fill="#69cf7f" stroke="#409f5d" stroke-width="3">
        <circle cx="70" cy="108" r="43"/><circle cx="120" cy="75" r="52"/><circle cx="179" cy="80" r="53"/><circle cx="232" cy="111" r="42"/>
      </g>
      <g fill="#9aeaa2" opacity=".7"><circle cx="55" cy="97" r="23"/><circle cx="108" cy="57" r="27"/><circle cx="173" cy="58" r="26"/><circle cx="228" cy="98" r="21"/></g>
      <g fill="#ffb1c9"><circle cx="99" cy="101" r="7"/><circle cx="159" cy="91" r="6"/><circle cx="207" cy="108" r="6"/></g>`,
  },
  cloudIsland: {
    w: 520, h: 360,
    body: `<ellipse cx="260" cy="302" rx="205" ry="26" fill="#6e93ba" opacity=".08"/>
      <path d="M71 214 Q43 214 46 185 Q49 158 80 161 Q87 128 122 134 Q146 105 181 128 Q218 101 252 132 Q286 115 307 145 Q342 142 351 174 Q383 177 381 205 Q378 230 348 230 Q309 248 269 237 Q226 252 190 238 Q147 249 111 233 Q87 232 71 214 Z" fill="#fffdfb" stroke="#d5e7f3" stroke-width="3"/>
      <path d="M75 231 Q79 269 105 279 Q105 314 137 321 Q146 347 181 342 Q199 364 236 350 Q268 367 297 344 Q331 350 342 320 Q371 308 369 276 Q391 263 389 236 Q357 245 327 235 Q291 251 255 239 Q220 252 184 238 Q145 251 109 237 Q89 235 75 231 Z" fill="#b8e5c0" stroke="#7ac38d" stroke-width="3"/>
      <path d="M103 282 Q130 266 157 283 Q134 298 103 282 Z" fill="#ffffff" opacity=".35"/>
      <circle cx="143" cy="293" r="6" fill="#ffbf72"/><circle cx="285" cy="290" r="6" fill="#ff9eb5"/>
      <path d="M177 323 Q200 309 222 325" stroke="#5eaa74" stroke-width="3" stroke-linecap="round" opacity=".5"/>`,
  },
  starFlower: {
    w: 130, h: 190,
    body: `<path d="M64 182 Q60 137 64 99" stroke="#47a55c" stroke-width="7" stroke-linecap="round"/>
      <path d="M62 151 Q40 142 32 120 Q54 119 65 138 Z" fill="#73d182"/>
      <path d="M67 140 Q89 130 99 110 Q76 112 65 131 Z" fill="#8be292"/>
      <path d="M64 25 l10 27 29 1 -22 20 8 29 -25 -15 -25 15 8 -29 -22 -20 29 -1 z" fill="#ffe66d" stroke="#e0b52a" stroke-width="3"/>
      <circle cx="64" cy="80" r="13" fill="#fff6a8"/>`,
  },
  sun: {
    w: 360, h: 360,
    body: `<circle cx="180" cy="180" r="160" fill="#fff7b0" opacity=".2"/>
      <circle cx="180" cy="180" r="118" fill="#fff2a1" opacity=".32"/>
      <circle cx="180" cy="180" r="82" fill="#fff8c2" stroke="#ffe36d" stroke-width="5"/>
      <circle cx="154" cy="170" r="9" fill="#b98d44" opacity=".65"/><circle cx="206" cy="170" r="9" fill="#b98d44" opacity=".65"/>
      <path d="M156 202 Q180 218 204 202" stroke="#b98d44" stroke-width="5" stroke-linecap="round" opacity=".65"/>
      <g stroke="#ffe36d" stroke-width="7" stroke-linecap="round" opacity=".7">
        <path d="M180 38v-20M180 322v20M38 180H18M322 180h20M78 78L64 64M282 282l14 14M282 78l14 -14M78 282l-14 14"/>
      </g>`,
  },
};

/* ------------------------------------------------------------------ */
/* Backgrounds and thumbnails                                         */
/* ------------------------------------------------------------------ */

const THEMES = {
  meadow: {
    sky: ['#8fdcff', '#d8f5ff', '#fff4cf'],
    far: ['#9bd58d', '#7cc677', '#6bb66f'],
    mid: ['#76cd73', '#5ab960', '#4ba65a'],
    ground: ['#68c96f', '#4fb35e'],
    accent: '#ffb65c',
    label: 'Rainbow Meadow',
  },
  forest: {
    sky: ['#9ec7ec', '#c6e5ee', '#f4f2c8'],
    far: ['#86b7a4', '#6aa693', '#548d86'],
    mid: ['#4f9e8d', '#3e877c', '#33736f'],
    ground: ['#4b9a70', '#36805c'],
    accent: '#d8b6ff',
    label: 'Enchanted Forest',
  },
  cloud: {
    sky: ['#8ecfff', '#cfeaff', '#ffe7f2'],
    far: ['#b7d8f5', '#9cc8ed', '#83b8e0'],
    mid: ['#a5d2f2', '#86bee6', '#6ba7d5'],
    ground: ['#a8d7ef', '#8bc2e2'],
    accent: '#ffd46d',
    label: 'Cloud Kingdom',
  },
  candy: {
    sky: ['#ffc8e4', '#ffe1f0', '#fff6d1'],
    far: ['#f5b1d0', '#ef98c1', '#e47eb0'],
    mid: ['#f19ac0', '#e47aa8', '#d56b98'],
    ground: ['#eaa3bc', '#d981a2'],
    accent: '#7ce3c2',
    label: 'Candyland Valley',
  },
};

function bgFarSVG(theme) {
  const p = THEMES[theme];
  let shapes = '';
  if (theme === 'meadow') {
    shapes = `
      <path d="M0 390 Q180 270 360 360 Q540 440 720 350 Q900 260 1080 350 Q1260 440 1440 350 Q1530 310 1600 330 L1600 430 L0 430 Z" fill="${p.far[0]}" opacity=".9"/>
      <path d="M0 420 Q200 340 410 400 Q620 460 830 390 Q1040 320 1240 400 Q1440 470 1600 405 L1600 430 L0 430 Z" fill="${p.far[1]}"/>
      <g fill="${p.far[2]}" opacity=".6"><circle cx="140" cy="350" r="42"/><circle cx="205" cy="368" r="32"/><circle cx="1010" cy="355" r="38"/><circle cx="1065" cy="370" r="28"/><circle cx="1470" cy="350" r="40"/></g>
      <path d="M820 300 Q960 160 1100 300" stroke="#ffd86e" stroke-width="8" fill="none" opacity=".4"/>`;
  } else if (theme === 'forest') {
    shapes = `
      <path d="M0 410 Q200 330 410 390 Q620 450 830 380 Q1040 310 1240 390 Q1440 450 1600 400 L1600 430 L0 430 Z" fill="${p.far[0]}"/>
      <g fill="${p.far[1]}" opacity=".85">
        <path d="M90 430 L90 210 L55 210 L105 130 L155 210 L120 210 L120 430 Z"/>
        <path d="M310 430 L310 180 L260 180 L330 75 L400 180 L350 180 L350 430 Z"/>
        <path d="M620 430 L620 210 L580 210 L640 110 L700 210 L660 210 L660 430 Z"/>
        <path d="M980 430 L980 170 L930 170 L990 70 L1050 170 L1010 170 L1010 430 Z"/>
        <path d="M1270 430 L1270 215 L1230 215 L1285 115 L1340 215 L1300 215 L1300 430 Z"/>
        <path d="M1480 430 L1480 190 L1430 190 L1490 90 L1550 190 L1510 190 L1510 430 Z"/>
      </g>
      <g fill="#ffe88e" opacity=".55"><circle cx="150" cy="240" r="5"/><circle cx="365" cy="210" r="4"/><circle cx="680" cy="220" r="5"/><circle cx="1040" cy="180" r="4"/><circle cx="1330" cy="230" r="5"/></g>
      <path d="M250 0 L410 430 L330 430 L190 0 Z" fill="#fff8cf" opacity=".12"/>
      <path d="M880 0 L1040 430 L960 430 L820 0 Z" fill="#fff8cf" opacity=".1"/>`;
  } else if (theme === 'cloud') {
    shapes = `
      <g fill="#ffffff" opacity=".7">
        <path d="M100 350 Q70 350 72 322 Q74 296 104 298 Q110 268 144 272 Q168 246 200 270 Q232 250 256 276 Q288 272 294 302 Q322 306 318 332 Q314 354 286 354 Q250 370 216 358 Q180 372 150 358 Q122 360 100 350 Z"/>
        <path d="M720 310 Q690 310 692 282 Q694 256 724 258 Q730 228 764 232 Q788 206 820 230 Q852 210 876 236 Q908 232 914 262 Q942 266 938 292 Q934 314 906 314 Q870 330 836 318 Q800 332 770 318 Q742 320 720 310 Z"/>
        <path d="M1240 360 Q1210 360 1212 332 Q1214 306 1244 308 Q1250 278 1284 282 Q1308 256 1340 280 Q1372 260 1396 286 Q1428 282 1434 312 Q1462 316 1458 342 Q1454 364 1426 364 Q1390 380 1356 368 Q1320 382 1290 368 Q1262 370 1240 360 Z"/>
      </g>
      <g fill="${p.far[0]}" opacity=".75">
        <path d="M430 355 Q400 355 402 330 Q404 306 430 308 Q435 280 466 284 Q490 260 520 284 Q550 264 574 290 Q604 286 610 314 Q638 318 634 342 Q630 364 602 364 Q568 378 536 366 Q502 380 472 366 Q448 368 430 355 Z"/>
      </g>
      <g fill="${p.far[2]}" opacity=".55"><ellipse cx="470" cy="390" rx="68" ry="18"/><ellipse cx="1180" cy="390" rx="80" ry="18"/></g>`;
  } else {
    shapes = `
      <path d="M0 405 Q160 300 330 380 Q500 455 670 370 Q840 285 1010 370 Q1180 455 1350 380 Q1480 320 1600 360 L1600 430 L0 430 Z" fill="${p.far[0]}" opacity=".9"/>
      <path d="M0 425 Q200 350 420 405 Q640 460 860 400 Q1080 340 1290 405 Q1460 455 1600 410 L1600 430 L0 430 Z" fill="${p.far[1]}"/>
      <g fill="${p.far[2]}" opacity=".55"><circle cx="170" cy="370" r="30"/><circle cx="330" cy="390" r="20"/><circle cx="1170" cy="365" r="32"/><circle cx="1420" cy="390" r="24"/></g>
      <g stroke="#fff4ef" stroke-width="8" stroke-linecap="round" opacity=".7">
        <path d="M120 360v-65"/><path d="M1450 360v-70"/>
      </g>
      <g><circle cx="120" cy="282" r="24" fill="#ff9fbf" stroke="#d96d92" stroke-width="3"/><circle cx="1450" cy="278" r="26" fill="#ffd166" stroke="#d8a83e" stroke-width="3"/></g>`;
  }
  return svgDoc(1600, 430, shapes);
}

function bgMidSVG(theme) {
  const p = THEMES[theme];
  let shapes = '';
  if (theme === 'meadow') {
    shapes = `
      <path d="M0 430 Q210 335 430 390 Q650 445 860 380 Q1080 315 1290 390 Q1460 445 1600 405 L1600 430 L0 430 Z" fill="${p.mid[0]}"/>
      <path d="M0 430 Q190 380 390 410 Q600 442 810 405 Q1020 365 1230 412 Q1440 455 1600 420 L1600 430 L0 430 Z" fill="${p.mid[1]}" opacity=".9"/>
      <g fill="${p.mid[2]}" opacity=".55"><circle cx="110" cy="400" r="24"/><circle cx="370" cy="410" r="18"/><circle cx="710" cy="400" r="22"/><circle cx="1080" cy="408" r="18"/><circle cx="1380" cy="405" r="24"/></g>
      <g fill="#ffb3c8"><circle cx="82" cy="412" r="5"/><circle cx="248" cy="405" r="4"/><circle cx="560" cy="414" r="5"/><circle cx="960" cy="409" r="4"/><circle cx="1310" cy="414" r="5"/></g>`;
  } else if (theme === 'forest') {
    shapes = `
      <path d="M0 430 Q230 360 430 400 Q640 440 850 390 Q1060 340 1270 400 Q1450 450 1600 410 L1600 430 L0 430 Z" fill="${p.mid[0]}"/>
      <path d="M0 430 Q200 395 410 415 Q630 435 850 405 Q1070 375 1290 415 Q1470 445 1600 425 L1600 430 L0 430 Z" fill="${p.mid[1]}" opacity=".85"/>
      <g fill="${p.mid[2]}" opacity=".6">
        <path d="M180 430 L180 290 L150 290 L200 205 L250 290 L220 290 L220 430 Z"/>
        <path d="M470 430 L470 270 L435 270 L495 165 L555 270 L520 270 L520 430 Z"/>
        <path d="M1010 430 L1010 280 L975 280 L1035 180 L1095 280 L1060 280 L1060 430 Z"/>
        <path d="M1340 430 L1340 300 L1305 300 L1360 205 L1415 300 L1380 300 L1380 430 Z"/>
      </g>
      <g fill="#ffe27d" opacity=".6"><circle cx="350" cy="330" r="5"/><circle cx="780" cy="350" r="4"/><circle cx="1190" cy="330" r="5"/><circle cx="1480" cy="360" r="4"/></g>`;
  } else if (theme === 'cloud') {
    shapes = `
      <path d="M0 430 Q170 365 350 400 Q530 435 700 400 Q880 365 1050 405 Q1230 445 1410 400 Q1520 375 1600 405 L1600 430 L0 430 Z" fill="${p.mid[0]}"/>
      <g fill="#ffffff" opacity=".55">
        <path d="M120 430 Q80 430 82 400 Q84 374 114 376 Q120 346 154 350 Q178 324 210 348 Q242 328 266 354 Q298 350 304 380 Q332 384 328 410 Q324 432 296 432 Q262 448 228 436 Q194 450 164 436 Q136 438 120 430 Z"/>
        <path d="M1210 430 Q1170 430 1172 400 Q1174 374 1204 376 Q1210 346 1244 350 Q1268 324 1300 348 Q1332 328 1356 354 Q1388 350 1394 380 Q1422 384 1418 410 Q1414 432 1386 432 Q1352 448 1318 436 Q1284 450 1254 436 Q1226 438 1210 430 Z"/>
      </g>
      <g fill="${p.mid[1]}" opacity=".5"><ellipse cx="450" cy="420" rx="120" ry="18"/><ellipse cx="980" cy="420" rx="130" ry="18"/></g>`;
  } else {
    shapes = `
      <path d="M0 430 Q180 360 380 405 Q580 450 780 400 Q980 350 1180 405 Q1380 460 1600 410 L1600 430 L0 430 Z" fill="${p.mid[0]}"/>
      <path d="M0 430 Q210 395 420 418 Q640 442 860 410 Q1080 378 1290 418 Q1470 450 1600 425 L1600 430 L0 430 Z" fill="${p.mid[1]}" opacity=".8"/>
      <g opacity=".7">
        <rect x="110" y="350" width="8" height="70" rx="4" fill="#fff7eb"/>
        <circle cx="114" cy="340" r="25" fill="#ff9ec1" stroke="#d56e96" stroke-width="3"/>
        <rect x="470" y="360" width="7" height="60" rx="3.5" fill="#fff7eb"/>
        <circle cx="473" cy="350" r="22" fill="#ffe06e" stroke="#d6b43f" stroke-width="3"/>
        <rect x="1050" y="350" width="8" height="70" rx="4" fill="#fff7eb"/>
        <circle cx="1054" cy="340" r="25" fill="#9be7d0" stroke="#62baa1" stroke-width="3"/>
        <rect x="1420" y="360" width="7" height="60" rx="3.5" fill="#fff7eb"/>
        <circle cx="1423" cy="350" r="22" fill="#ffb0ca" stroke="#d96e92" stroke-width="3"/>
      </g>`;
  }
  return svgDoc(1600, 430, shapes);
}

function groundSVG(theme) {
  const p = THEMES[theme];
  let top = '';
  if (theme === 'meadow') {
    top = `<g fill="#7edc7e"><path d="M0 40 Q28 14 56 40 Q84 14 112 40 Q140 14 168 40 Q196 14 224 40 Q252 14 280 40 Q308 14 336 40 Q364 14 392 40 Q420 14 448 40 Q476 14 504 40 Q532 14 560 40 Q588 14 616 40 Q644 14 672 40 Q700 14 728 40 Q756 14 784 40 Q812 14 840 40 Q868 14 896 40 Q924 14 952 40 Q980 14 1008 40 Q1036 14 1064 40 Q1092 14 1120 40 Q1148 14 1176 40 Q1204 14 1232 40 Q1260 14 1288 40 Q1316 14 1344 40 Q1372 14 1400 40 Q1428 14 1456 40 Q1484 14 1512 40 Q1540 14 1568 40 Q1586 24 1600 40 L1600 190 L0 190 Z"/></g>`;
  } else if (theme === 'forest') {
    top = `<g fill="#4aa66c"><path d="M0 40 Q40 10 80 40 Q120 10 160 40 Q200 10 240 40 Q280 10 320 40 Q360 10 400 40 Q440 10 480 40 Q520 10 560 40 Q600 10 640 40 Q680 10 720 40 Q760 10 800 40 Q840 10 880 40 Q920 10 960 40 Q1000 10 1040 40 Q1080 10 1120 40 Q1160 10 1200 40 Q1240 10 1280 40 Q1320 10 1360 40 Q1400 10 1440 40 Q1480 10 1520 40 Q1560 10 1600 40 L1600 190 L0 190 Z"/></g>`;
  } else if (theme === 'cloud') {
    top = `<g fill="#b8e2f6"><path d="M0 40 Q50 10 100 40 Q150 10 200 40 Q250 10 300 40 Q350 10 400 40 Q450 10 500 40 Q550 10 600 40 Q650 10 700 40 Q750 10 800 40 Q850 10 900 40 Q950 10 1000 40 Q1050 10 1100 40 Q1150 10 1200 40 Q1250 10 1300 40 Q1350 10 1400 40 Q1450 10 1500 40 Q1550 10 1600 40 L1600 190 L0 190 Z"/></g>
    <g fill="#ffffff" opacity=".7"><circle cx="100" cy="75" r="24"/><circle cx="460" cy="95" r="30"/><circle cx="820" cy="70" r="22"/><circle cx="1180" cy="90" r="28"/><circle cx="1520" cy="72" r="23"/></g>`;
  } else {
    top = `<g fill="#f6c5d7"><path d="M0 40 Q40 10 80 40 Q120 10 160 40 Q200 10 240 40 Q280 10 320 40 Q360 10 400 40 Q440 10 480 40 Q520 10 560 40 Q600 10 640 40 Q680 10 720 40 Q760 10 800 40 Q840 10 880 40 Q920 10 960 40 Q1000 10 1040 40 Q1080 10 1120 40 Q1160 10 1200 40 Q1240 10 1280 40 Q1320 10 1360 40 Q1400 10 1440 40 Q1480 10 1520 40 Q1560 10 1600 40 L1600 190 L0 190 Z"/></g>
    <g fill="#ffd8e8"><circle cx="150" cy="76" r="10"/><circle cx="420" cy="98" r="12"/><circle cx="700" cy="72" r="9"/><circle cx="980" cy="100" r="12"/><circle cx="1260" cy="74" r="10"/><circle cx="1510" cy="98" r="12"/></g>`;
  }

  let detail = '';
  if (theme === 'meadow') {
    detail = `<g fill="#4caf5b" opacity=".55"><path d="M70 90 Q82 58 94 90 M320 95 Q332 63 344 95 M620 88 Q632 56 644 88 M930 94 Q942 62 954 94 M1220 90 Q1232 58 1244 90 M1490 96 Q1502 64 1514 96" stroke="#3b944b" stroke-width="5" stroke-linecap="round" fill="none"/></g>
      <g fill="#ff9fba"><circle cx="80" cy="105" r="8"/><circle cx="334" cy="108" r="7"/><circle cx="632" cy="102" r="8"/><circle cx="944" cy="108" r="7"/><circle cx="1236" cy="104" r="8"/><circle cx="1502" cy="109" r="7"/></g>
      <g fill="#ffe36d"><circle cx="80" cy="105" r="3.5"/><circle cx="334" cy="108" r="3"/><circle cx="632" cy="102" r="3.5"/><circle cx="944" cy="108" r="3"/><circle cx="1236" cy="104" r="3.5"/><circle cx="1502" cy="109" r="3"/></g>`;
  } else if (theme === 'forest') {
    detail = `<g fill="#ffe27a" opacity=".8"><circle cx="120" cy="95" r="5"/><circle cx="370" cy="110" r="4"/><circle cx="650" cy="95" r="5"/><circle cx="920" cy="108" r="4"/><circle cx="1190" cy="96" r="5"/><circle cx="1470" cy="108" r="4"/></g>
      <g fill="#c8a2ff" opacity=".7"><circle cx="250" cy="122" r="5"/><circle cx="780" cy="118" r="4"/><circle cx="1040" cy="124" r="5"/><circle cx="1340" cy="120" r="4"/></g>`;
  } else if (theme === 'cloud') {
    detail = `<g fill="#ffffff" opacity=".55"><circle cx="180" cy="100" r="16"/><circle cx="610" cy="120" r="20"/><circle cx="980" cy="95" r="14"/><circle cx="1360" cy="115" r="18"/></g>
      <g fill="#ffd66e" opacity=".7"><path d="M300 78 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z"/><path d="M1110 80 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z"/></g>`;
  } else {
    detail = `<g fill="#fff4f7" opacity=".75"><circle cx="180" cy="100" r="13"/><circle cx="520" cy="115" r="15"/><circle cx="860" cy="95" r="12"/><circle cx="1190" cy="115" r="14"/><circle cx="1500" cy="100" r="12"/></g>
      <g fill="#ff8fb7"><circle cx="180" cy="100" r="5"/><circle cx="520" cy="115" r="5.5"/><circle cx="860" cy="95" r="4.5"/><circle cx="1190" cy="115" r="5"/><circle cx="1500" cy="100" r="4.5"/></g>`;
  }

  return svgDoc(1600, 190, `
    <rect width="1600" height="190" fill="${p.ground[1]}"/>
    <path d="M0 38 Q30 8 60 38 Q90 8 120 38 Q150 8 180 38 Q210 8 240 38 Q270 8 300 38 Q330 8 360 38 Q390 8 420 38 Q450 8 480 38 Q510 8 540 38 Q570 8 600 38 Q630 8 660 38 Q690 8 720 38 Q750 8 780 38 Q810 8 840 38 Q870 8 900 38 Q930 8 960 38 Q990 8 1020 38 Q1050 8 1080 38 Q1110 8 1140 38 Q1170 8 1200 38 Q1230 8 1260 38 Q1290 8 1320 38 Q1350 8 1380 38 Q1410 8 1440 38 Q1470 8 1500 38 Q1530 8 1560 38 Q1580 18 1600 38 L1600 190 L0 190 Z" fill="${p.ground[0]}"/>
    ${top}
    ${detail}
    <path d="M0 152 Q160 135 320 150 Q480 165 640 148 Q800 132 960 150 Q1120 168 1280 149 Q1440 132 1600 150 L1600 190 L0 190 Z" fill="${p.ground[1]}" opacity=".55"/>`);
}

function levelThumbSVG(theme) {
  const p = THEMES[theme];
  let feature = '';
  let extra = '';
  if (theme === 'meadow') {
    feature = `<g transform="translate(470 170) scale(.8)">${PROPS.treeMeadow.body}</g>
      <g transform="translate(620 210) scale(.58)">${PROPS.flower.body}</g>
      <g transform="translate(360 250) scale(.55)">${PROPS.bush.body}</g>`;
    extra = `<g fill="#ffb3c7"><circle cx="250" cy="280" r="7"/><circle cx="320" cy="300" r="5"/><circle cx="700" cy="286" r="7"/><circle cx="760" cy="305" r="5"/></g>`;
  } else if (theme === 'forest') {
    feature = `<g transform="translate(420 150) scale(.9)">${PROPS.treeForest.body}</g>
      <g transform="translate(610 220) scale(.65)">${PROPS.mushroomProp.body}</g>
      <g transform="translate(340 255) scale(.55)">${PROPS.mushroomProp.body}</g>`;
    extra = `<g fill="#ffe88a" opacity=".8"><circle cx="260" cy="290" r="5"/><circle cx="700" cy="310" r="4"/><circle cx="770" cy="260" r="5"/></g>`;
  } else if (theme === 'cloud') {
    feature = `<g transform="translate(330 190) scale(.9)">${PROPS.cloudIsland.body}</g>
      <g transform="translate(690 180) scale(.6)">${PROPS.cloudIsland.body}</g>
      <g transform="translate(470 235) scale(.55)">${PROPS.starFlower.body}</g>`;
    extra = `<g fill="#ffe27a"><path d="M780 120 l4 11 11 4 -11 4 -4 11 -4 -11 -11 -4 11 -4 z"/><path d="M230 180 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z"/></g>`;
  } else {
    feature = `<g transform="translate(420 120) scale(1)">${PROPS.lollipop.body}</g>
      <g transform="translate(650 190) scale(.65)">${PROPS.gumdropProp.body}</g>
      <g transform="translate(300 230) scale(.55)">${PROPS.candyCane.body}</g>`;
    extra = `<g fill="#fff6f9" opacity=".8"><circle cx="250" cy="280" r="8"/><circle cx="780" cy="290" r="6"/><circle cx="720" cy="250" r="7"/></g>`;
  }

  return svgDoc(800, 500, `
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="500" gradientUnits="userSpaceOnUse">
        <stop stop-color="${p.sky[0]}"/><stop offset=".62" stop-color="${p.sky[1]}"/><stop offset="1" stop-color="${p.sky[2]}"/>
      </linearGradient>
    </defs>
    <rect width="800" height="500" fill="url(#sky)"/>
    <circle cx="660" cy="90" r="64" fill="#fff6b0" opacity=".65"/>
    <g fill="#ffffff" opacity=".6">
      <path d="M100 130 Q75 130 77 105 Q79 82 105 84 Q111 58 141 62 Q163 40 191 62 Q219 44 241 68 Q269 64 275 90 Q300 94 296 116 Q292 134 268 134 Q238 148 210 138 Q182 150 158 138 Q132 142 100 130 Z"/>
      <path d="M500 190 Q478 190 480 168 Q482 148 504 150 Q510 128 536 132 Q556 112 580 132 Q606 116 626 138 Q650 134 656 156 Q678 160 674 180 Q670 198 648 198 Q620 210 594 200 Q568 212 546 200 Q522 202 500 190 Z"/>
    </g>
    <path d="M0 360 Q160 290 330 345 Q500 400 660 335 Q730 305 800 330 L800 500 L0 500 Z" fill="${p.mid[0]}"/>
    <path d="M0 405 Q160 345 340 395 Q520 445 690 385 Q750 365 800 390 L800 500 L0 500 Z" fill="${p.mid[1]}"/>
    ${feature}
    ${extra}
    <path d="M0 455 Q150 425 300 450 Q450 475 600 448 Q700 430 800 450 L800 500 L0 500 Z" fill="${p.ground[0]}"/>`);
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

function svgDataURI(svg) {
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

function textureDefs() {
  const defs = {};
  const poses = ['idle', 'runA', 'runB', 'jump', 'land', 'celebrate'];
  for (const pet of ['ghosty', 'spin', 'oakley']) {
    for (const pose of poses) {
      defs[`pet-${pet}-${pose}`] = { svg: petSVG(pet, pose), w: 420, h: 360 };
    }
  }
  for (const [key, item] of Object.entries(ITEMS)) {
    defs[`item-${key}`] = { svg: svgDoc(item.w, item.h, item.body, itemDefs()), w: item.w, h: item.h };
  }
  for (const [key, animal] of Object.entries(ANIMALS)) {
    defs[`animal-${key}`] = { svg: svgDoc(animal.w, animal.h, animal.body), w: animal.w, h: animal.h };
  }
  for (const [key, obs] of Object.entries(OBSTACLES)) {
    defs[`obs-${key}`] = { svg: svgDoc(obs.w, obs.h, obs.body), w: obs.w, h: obs.h };
  }
  for (const [key, prop] of Object.entries(PROPS)) {
    defs[`prop-${key}`] = { svg: svgDoc(prop.w, prop.h, prop.body), w: prop.w, h: prop.h };
  }
  for (const theme of Object.keys(THEMES)) {
    defs[`bg-far-${theme}`] = { svg: bgFarSVG(theme), w: 1600, h: 430 };
    defs[`bg-mid-${theme}`] = { svg: bgMidSVG(theme), w: 1600, h: 430 };
    defs[`ground-${theme}`] = { svg: groundSVG(theme), w: 1600, h: 190 };
    defs[`thumb-${theme}`] = { svg: levelThumbSVG(theme), w: 800, h: 500 };
  }
  return defs;
}

export const Art = {
  svgDoc,
  svgDataURI,
  petSVG,
  petDataURI(pet, pose = 'idle') { return svgDataURI(petSVG(pet, pose)); },
  itemDataURI(key) { return svgDataURI(svgDoc(ITEMS[key].w, ITEMS[key].h, ITEMS[key].body, itemDefs())); },
  animalDataURI(key) { return svgDataURI(svgDoc(ANIMALS[key].w, ANIMALS[key].h, ANIMALS[key].body)); },
  propDataURI(key) { return svgDataURI(svgDoc(PROPS[key].w, PROPS[key].h, PROPS[key].body)); },
  thumbDataURI(theme) { return svgDataURI(levelThumbSVG(theme)); },
  levelThumbSVG,
  textureDefs,
  PET_LOOKS,
  ITEMS,
  ANIMALS,
  OBSTACLES,
  PROPS,
  THEMES,
};

export { THEMES };