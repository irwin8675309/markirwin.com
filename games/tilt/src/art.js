/**
 * Original vector artwork for Pet Tilt Adventures.
 *
 * Ghosty, Spin and Oakley are drawn from scratch as SVG, reusing the exact
 * character artwork and palette established in the family's earlier
 * "Pets Game" project (pets/src/art.js) so the pets always look the same.
 *
 * Every sprite is generated locally as an SVG data URL - no network requests,
 * no external image files.
 */

const NS = 'http://www.w3.org/2000/svg';

function svgDoc(w, h, body, defs = '') {
  return `<svg xmlns="${NS}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">${defs}${body}</svg>`;
}

function shadowEllipse(cx, cy, rx, ry, opacity = 0.14) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#4b3c62" opacity="${opacity}"/>`;
}

/* ------------------------------------------------------------------ */
/* Pets - identical look to the Pets Game project                     */
/* ------------------------------------------------------------------ */

const PET_LOOKS = {
  ghosty: {
    outline: '#e8dbee',
    body: ['#fffefc', '#f4ebf7'],
    head: ['#ffffff', '#f7f0f8'],
    ear: '#ffd1b0',
    earInner: '#ffad9d',
    tail: ['#fffdfb', '#f2e9f4'],
    eye: '#8db6d1',
    pupil: '#273244',
    nose: '#f4a7b5',
    blush: '#ffc1ca',
    legFar: '#f5edf7',
    legNear: '#fffdfb',
    paw: '#f8f1f7',
    chest: '#ffffff',
  },
  spin: {
    outline: '#15171f',
    body: ['#3c4355', '#171a24'],
    head: ['#fffdfb', '#f4edf3'],
    cap: ['#3a4152', '#11141d'],
    ear: '#2c3242',
    earInner: '#f7b3bc',
    tail: ['#3a4152', '#151821'],
    eye: '#c9d65c',
    pupil: '#27301b',
    nose: '#f1a4b1',
    blush: '#ffb8c0',
    legFar: '#2d3342',
    legNear: '#faf6f8',
    paw: '#fffaf9',
    chest: '#fffdf9',
  },
  oakley: {
    outline: '#17191f',
    body: ['#3a3d46', '#15171d'],
    head: ['#3b3e47', '#16181e'],
    ear: '#25272e',
    earInner: '#46434a',
    muzzle: ['#d3cecd', '#aaa3a5'],
    eye: '#cc8638',
    pupil: '#2b1a0e',
    nose: '#0f1014',
    tongue: '#ff8d9c',
    blush: '#c78083',
    legFar: '#272930',
    legNear: '#191b21',
    paw: '#272930',
    chest: '#555961',
    gray: '#d8d3d0',
  },
};

function eyeSVG(cx, cy, rx, ry, iris, pupil, sparkle = true, closed = false) {
  if (closed) {
    return `<path d="M${cx - rx} ${cy} Q${cx} ${cy + ry * 0.9} ${cx + rx} ${cy}" stroke="#4a3d5c" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;
  }
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
  else if (pose === 'happy') angle = 6;

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
  else if (pose === 'happy') angle = 14;

  return `<g transform="rotate(${angle} 150 230)">
    <path d="M150 230 C95 250 60 215 70 175 C77 147 100 134 120 142"
      stroke="#17191f" stroke-width="38" stroke-linecap="round"/>
    <path d="M150 230 C95 250 60 215 70 175 C77 147 100 134 120 142"
      stroke="#2c2f37" stroke-width="29" stroke-linecap="round"/>
    <path d="M70 175 C77 147 100 134 120 142" stroke="#d9d4d1" stroke-width="10" stroke-linecap="round" opacity=".65"/>
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
  } else if (pose === 'celebrate' || pose === 'happy') {
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

  const raised = pose === 'celebrate' || pose === 'happy'
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
      [262, 51, 20, look.legNear, look.paw],
    ];
  } else if (pose === 'celebrate' || pose === 'happy') {
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

  const raised = pose === 'celebrate' || pose === 'happy'
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
  const closed = pose === 'blink';
  return `<g transform="rotate(${headRot} 286 166)">
    <path d="M232 118 Q216 55 254 45 Q278 66 287 104 Z" fill="${look.ear}" stroke="${look.outline}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M242 104 Q235 68 253 59 Q265 75 270 101 Z" fill="${look.earInner}" opacity=".85"/>
    <path d="M315 102 Q336 45 366 58 Q374 84 357 118 Z" fill="${look.ear}" stroke="${look.outline}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M326 103 Q342 64 359 70 Q362 90 351 108 Z" fill="${look.earInner}" opacity=".85"/>

    <ellipse cx="286" cy="166" rx="86" ry="77" fill="url(#head)" stroke="${look.outline}" stroke-width="4"/>
    <path d="M227 118 Q283 76 341 111 Q326 142 292 145 Q255 142 227 118 Z" fill="#ffe2d2" opacity=".5"/>

    <ellipse cx="303" cy="205" rx="51" ry="33" fill="#fffdfa" stroke="#f0e4ef" stroke-width="3"/>
    <ellipse cx="303" cy="222" rx="33" ry="17" fill="#fff8f2" opacity=".8"/>

    ${eyeSVG(258, eyeY, 20, 27, look.eye, look.pupil, true, closed)}
    ${eyeSVG(320, eyeY - 2, 20, 27, look.eye, look.pupil, true, closed)}

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
  const closed = pose === 'blink';
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
    ${eyeSVG(258, eyeY, 19, 26, look.eye, look.pupil, true, closed)}
    ${eyeSVG(319, eyeY - 2, 19, 26, look.eye, look.pupil, true, closed)}

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
  const closed = pose === 'blink';
  return `<g transform="rotate(${headRot} 286 166)">
    <path d="M225 106 Q186 121 192 204 Q196 247 222 251 Q239 222 232 174 Q229 137 242 113 Z" fill="${look.ear}" stroke="#111318" stroke-width="4" stroke-linejoin="round"/>
    <path d="M349 104 Q387 120 381 204 Q377 249 351 250 Q335 220 341 173 Q343 136 330 111 Z" fill="${look.ear}" stroke="#111318" stroke-width="4" stroke-linejoin="round"/>
    <path d="M204 170 Q204 214 217 233 Q226 207 224 172 Z" fill="#3b3b42" opacity=".55"/>
    <path d="M368 168 Q367 214 354 235 Q346 207 349 170 Z" fill="#3b3b42" opacity=".55"/>

    <ellipse cx="286" cy="168" rx="92" ry="82" fill="url(#head)" stroke="${look.outline}" stroke-width="4"/>
    <path d="M240 104 Q286 79 336 106 Q323 132 291 137 Q260 131 240 104 Z" fill="#4c4e57" opacity=".55"/>

    ${eyeSVG(258, eyeY, 20, 25, look.eye, look.pupil, true, closed)}
    ${eyeSVG(320, eyeY - 2, 20, 25, look.eye, look.pupil, true, closed)}
    <path d="M234 132 Q249 124 265 130" stroke="#73757e" stroke-width="5" stroke-linecap="round" opacity=".7"/>
    <path d="M303 128 Q318 122 332 128" stroke="#73757e" stroke-width="5" stroke-linecap="round" opacity=".7"/>

    <ellipse cx="303" cy="208" rx="58" ry="39" fill="url(#muzzle)" stroke="#9f989a" stroke-width="3"/>
    <ellipse cx="303" cy="227" rx="38" ry="20" fill="#e4dedc" opacity=".55"/>

    <path d="M309 186 Q321 180 332 186 Q335 194 324 199 Q318 202 316 198 Q305 193 309 186 Z" fill="${look.nose}" stroke="#060708" stroke-width="2"/>

    <path d="M283 206 Q303 199 323 207 Q331 228 315 238 Q298 246 285 233 Q275 220 283 206 Z" fill="#2b1d20"/>
    <path d="M294 224 Q309 215 321 225 Q318 239 305 240 Q294 238 294 224 Z" fill="${look.tongue}"/>
    <path d="M300 226 Q308 222 316 226" stroke="#d95d70" stroke-width="2" stroke-linecap="round" opacity=".65"/>

    <ellipse cx="238" cy="199" rx="18" ry="8" fill="#c47e80" opacity=".35"/>
    <ellipse cx="359" cy="198" rx="16" ry="8" fill="#c47e80" opacity=".32"/>
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
       <path d="M135 218 Q154 188 178 211 Q157 235 135 218 Z" fill="#5a5d66" opacity=".3"/>`
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
      ${pose === 'celebrate' || pose === 'happy' ? `<path d="M78 103 l5 15 15 5 -15 5 -5 15 -5 -15 -15 -5 15 -5 z" fill="#ffe16b" opacity=".95"/>
      <path d="M365 64 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 z" fill="#fff0a1" opacity=".9"/>` : ''}
    </g>
  `, defs);
}

/* ------------------------------------------------------------------ */
/* Item artwork                                                       */
/* ------------------------------------------------------------------ */

const ITEM_DEFS = `
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
    <linearGradient id="violet" x1="30" y1="20" x2="96" y2="110" gradientUnits="userSpaceOnUse">
      <stop stop-color="#cfb3ff"/><stop offset="1" stop-color="#8d67e8"/>
    </linearGradient>
    <linearGradient id="wood" x1="30" y1="30" x2="100" y2="108" gradientUnits="userSpaceOnUse">
      <stop stop-color="#d99a5e"/><stop offset="1" stop-color="#a9662f"/>
    </linearGradient>
  </defs>`;

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
  flower: {
    w: 128, h: 128,
    body: `${shadowEllipse(64, 114, 28, 7, .1)}
      <g fill="#ff8fb5" stroke="#d95c85" stroke-width="3">
        <circle cx="64" cy="42" r="23"/><circle cx="92" cy="62" r="21"/><circle cx="82" cy="92" r="21"/>
        <circle cx="46" cy="92" r="21"/><circle cx="36" cy="62" r="21"/>
      </g>
      <circle cx="64" cy="68" r="21" fill="#ffe27a" stroke="#e8b62b" stroke-width="3"/>
      <circle cx="56" cy="60" r="5" fill="#fff7c8" opacity=".85"/>
      <path d="M96 30 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" fill="#fff" opacity=".8"/>`,
  },
  treat: {
    w: 128, h: 128,
    body: `${shadowEllipse(64, 112, 34, 8, .1)}
      <g transform="rotate(-18 64 65)">
        <path d="M23 45 C17 32 30 23 41 29 C47 32 50 37 52 43 L76 43 C78 36 83 30 90 30 C101 30 111 40 106 52 C103 59 97 62 91 61 L85 78 C90 86 86 99 75 101 C64 103 56 95 57 86 L71 69 L45 69 L59 87 C59 96 51 104 40 101 C29 98 25 87 31 79 L37 62 C27 60 21 54 23 45 Z" fill="url(#gold)" stroke="#d7961d" stroke-width="3" stroke-linejoin="round"/>
        <path d="M40 36 Q52 31 61 42" stroke="#fff8b0" stroke-width="5" stroke-linecap="round" opacity=".7"/>
      </g>`,
  },
  yarn: {
    w: 128, h: 128,
    body: `${shadowEllipse(64, 112, 40, 7, .1)}
      <circle cx="64" cy="62" r="48" fill="#d78bd9" stroke="#a859b4" stroke-width="4"/>
      <path d="M27 40 Q64 20 101 46 M20 64 Q64 40 108 70 M27 88 Q68 63 105 94 M42 104 Q72 80 100 106" stroke="#a859b4" stroke-width="5" stroke-linecap="round" opacity=".75"/>
      <path d="M25 55 Q70 84 104 43 M38 30 Q78 58 108 30" stroke="#f3c5ef" stroke-width="4" stroke-linecap="round" opacity=".7"/>
      <path d="M101 100 Q119 105 116 118 Q109 126 100 119" stroke="#d78bd9" stroke-width="7" stroke-linecap="round"/>`,
  },
  coin: {
    w: 128, h: 128,
    body: `${shadowEllipse(64, 114, 34, 8, .12)}
      <circle cx="64" cy="62" r="48" fill="url(#gold)" stroke="#d9921f" stroke-width="4"/>
      <circle cx="64" cy="62" r="37" fill="none" stroke="#f0a42b" stroke-width="3" opacity=".8"/>
      <circle cx="64" cy="62" r="30" fill="#ffe98a" opacity=".55"/>
      <ellipse cx="64" cy="68" rx="13" ry="11" fill="#f0a42b"/>
      <circle cx="52" cy="51" r="5" fill="#f0a42b"/><circle cx="76" cy="51" r="5" fill="#f0a42b"/>
      <circle cx="60" cy="43" r="4.5" fill="#f0a42b"/><circle cx="68" cy="43" r="4.5" fill="#f0a42b"/>
      <path d="M40 30 Q52 20 66 22" stroke="#fffbe0" stroke-width="5" stroke-linecap="round" opacity=".75"/>`,
  },
  chest: {
    w: 128, h: 128,
    body: `${shadowEllipse(64, 116, 44, 8, .12)}
      <path d="M20 60 Q20 34 64 32 Q108 34 108 60 L108 100 Q108 110 98 110 L30 110 Q20 110 20 100 Z" fill="url(#wood)" stroke="#7d4a1e" stroke-width="4"/>
      <path d="M20 60 Q64 44 108 60 L108 74 Q64 60 20 74 Z" fill="#ffd978" stroke="#c9971f" stroke-width="3"/>
      <rect x="20" y="74" width="88" height="36" fill="url(#wood)" stroke="#7d4a1e" stroke-width="4"/>
      <rect x="56" y="70" width="16" height="22" rx="4" fill="#ffe27a" stroke="#c9971f" stroke-width="3"/>
      <circle cx="64" cy="80" r="3" fill="#8a5d00"/>
      <path d="M28 92 Q64 82 100 92" stroke="#8a5220" stroke-width="3" opacity=".5"/>
      <path d="M96 26 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" fill="#fff6a8"/>`,
  },
  heart: {
    w: 128, h: 128,
    body: `${shadowEllipse(64, 112, 32, 8, .12)}
      <path d="M64 109 C24 82 13 48 34 31 C47 21 60 27 64 38 C68 27 81 21 94 31 C115 48 104 82 64 109 Z" fill="url(#pink)" stroke="#df5a80" stroke-width="4" stroke-linejoin="round"/>
      <path d="M37 44 Q32 65 47 82" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".45"/>`,
  },
};

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

function toDataUrl(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

const ITEM_URLS = {};
const ITEM_SVGS = {};

export function itemUrl(name) {
  if (ITEM_URLS[name]) return ITEM_URLS[name];
  const item = ITEMS[name];
  if (!item) return '';
  const svg = svgDoc(128, 128, item.body, ITEM_DEFS);
  ITEM_SVGS[name] = svg;
  ITEM_URLS[name] = toDataUrl(svg);
  return ITEM_URLS[name];
}

export function petUrl(pet, pose = 'idle') {
  return toDataUrl(petSVG(pet, pose));
}

export function petSvg(pet, pose = 'idle') {
  return petSVG(pet, pose);
}

export const ART = {
  ghosty: null,
  ghostyBlink: null,
  ghostyHappy: null,
  spin: null,
  spinBlink: null,
  spinHappy: null,
  oakley: null,
  oakleyBlink: null,
  oakleyHappy: null,
  flower: null,
  star: null,
  butterfly: null,
  treat: null,
  yarn: null,
  sparkle: null,
  gem: null,
  coin: null,
  chest: null,
  heart: null,
};

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Loads every sprite into an Image object for fast canvas drawing.
 * Returns a promise that always resolves (missing art falls back to null).
 */
export async function loadArt(onProgress) {
  const entries = [
    ['ghosty', petUrl('ghosty', 'idle')],
    ['ghostyBlink', petUrl('ghosty', 'blink')],
    ['ghostyHappy', petUrl('ghosty', 'happy')],
    ['spin', petUrl('spin', 'idle')],
    ['spinBlink', petUrl('spin', 'blink')],
    ['spinHappy', petUrl('spin', 'happy')],
    ['oakley', petUrl('oakley', 'idle')],
    ['oakleyBlink', petUrl('oakley', 'blink')],
    ['oakleyHappy', petUrl('oakley', 'happy')],
    ['flower', itemUrl('flower')],
    ['star', itemUrl('star')],
    ['butterfly', itemUrl('butterfly')],
    ['treat', itemUrl('treat')],
    ['yarn', itemUrl('yarn')],
    ['sparkle', itemUrl('sparkle')],
    ['gem', itemUrl('gem')],
    ['coin', itemUrl('coin')],
    ['chest', itemUrl('chest')],
    ['heart', itemUrl('heart')],
  ];

  let done = 0;
  await Promise.all(entries.map(async ([key, src]) => {
    ART[key] = await loadImage(src);
    done += 1;
    if (onProgress) onProgress(done / entries.length);
  }));

  return ART;
}