/**
 * Original artwork for the four Great Escape worlds.
 *
 * Character and generic collectible art comes from ./art.js (the family's
 * shared pet artwork). Everything in this file is drawn from scratch for this
 * game: the movable objects (pillows, blocks, boxes, balls, crates), the
 * destinations, the little decorations and the world preview cards.
 */

import { Art } from './art.js';

const NS = 'http://www.w3.org/2000/svg';

export function svgDoc(w, h, body, defs = '') {
  return `<svg xmlns="${NS}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">${defs}${body}</svg>`;
}

export function svgDataURI(svg) {
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

const shadow = (cx, cy, rx, ry, o = 0.14) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#4b3c62" opacity="${o}"/>`;

/* ------------------------------------------------------------------ */
/* Movable objects (200 x 200)                                         */
/* ------------------------------------------------------------------ */

const PILLOW = svgDoc(
  200,
  200,
  `${shadow(100, 176, 74, 12, 0.12)}
   <path d="M36 62 Q30 40 52 38 Q100 30 148 38 Q170 40 164 62 Q172 100 164 138 Q170 160 148 162 Q100 170 52 162 Q30 160 36 138 Q28 100 36 62 Z"
     fill="#c9a7ff" stroke="#9a6fe0" stroke-width="5" stroke-linejoin="round"/>
   <path d="M50 60 Q46 46 62 45 Q100 39 138 45 Q154 46 150 60 Q156 100 150 140 Q154 154 138 155 Q100 161 62 155 Q46 154 50 140 Q44 100 50 60 Z"
     fill="#e4d2ff" opacity=".75"/>
   <path d="M60 78 Q100 66 140 78" stroke="#b48cf0" stroke-width="4" stroke-linecap="round" opacity=".7"/>
   <path d="M60 122 Q100 134 140 122" stroke="#b48cf0" stroke-width="4" stroke-linecap="round" opacity=".7"/>
   <circle cx="100" cy="100" r="9" fill="#b48cf0" stroke="#8a5fd6" stroke-width="3"/>
   <circle cx="97" cy="97" r="3" fill="#efe4ff"/>
   <path d="M70 50 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" fill="#fff" opacity=".8"/>`,
);

const CUSHION = svgDoc(
  200,
  200,
  `${shadow(100, 176, 72, 12, 0.12)}
   <circle cx="100" cy="104" r="70" fill="#ff9ec7" stroke="#d95f8f" stroke-width="5"/>
   <circle cx="100" cy="104" r="56" fill="#ffc0da" opacity=".7"/>
   <path d="M100 34 Q118 70 100 104 Q82 138 100 174 M30 104 Q66 86 100 104 Q134 122 170 104 M44 58 Q80 92 44 150 M156 58 Q120 92 156 150"
     stroke="#d95f8f" stroke-width="4" fill="none" opacity=".55"/>
   <circle cx="100" cy="104" r="11" fill="#d95f8f"/>
   <circle cx="97" cy="101" r="3.5" fill="#ffe3ef"/>
   <circle cx="70" cy="70" r="5" fill="#fff" opacity=".7"/>`,
);

function blockBody(top, side, front, mark) {
  return `${shadow(100, 178, 66, 11, 0.13)}
    <path d="M40 84 L100 58 L160 84 L160 96 L100 122 L40 96 Z" fill="${top}" stroke="#8a5a2b" stroke-width="4" stroke-linejoin="round"/>
    <path d="M40 96 L100 122 L100 172 L40 146 Z" fill="${front}" stroke="#8a5a2b" stroke-width="4" stroke-linejoin="round"/>
    <path d="M160 96 L100 122 L100 172 L160 146 Z" fill="${side}" stroke="#8a5a2b" stroke-width="4" stroke-linejoin="round"/>
    <path d="M52 100 L88 115 L88 128 L52 113 Z" fill="#fff" opacity=".35"/>
    ${mark}`;
}

const BLOCK_RED = svgDoc(
  200,
  200,
  blockBody(
    '#ff8f8f',
    '#e05a5a',
    '#f06a6a',
    `<path d="M124 108 l6 15 16 1 -12 11 4 16 -14 -8 -14 8 4 -16 -12 -11 16 -1 z" fill="#fff3b0" stroke="#e0a52a" stroke-width="2.5" stroke-linejoin="round"/>`,
  ),
);

const BLOCK_BLUE = svgDoc(
  200,
  200,
  blockBody(
    '#8fd0ff',
    '#4f9fe0',
    '#5fb0f0',
    `<circle cx="130" cy="130" r="15" fill="#eaf7ff" stroke="#3f78d8" stroke-width="3"/>
     <path d="M130 118 A12 12 0 0 1 130 142 Z" fill="#8fd0ff"/>`,
  ),
);

const BLOCK_YELLOW = svgDoc(
  200,
  200,
  blockBody(
    '#ffe27a',
    '#e8b62b',
    '#f5c93f',
    `<path d="M130 112 l5 12 13 2 -9 9 2 13 -11 -6 -11 6 2 -13 -9 -9 13 -2 z" fill="#fff8d0" stroke="#d8a83e" stroke-width="2.5" stroke-linejoin="round"/>`,
  ),
);

const BOX = svgDoc(
  200,
  200,
  `${shadow(100, 178, 72, 11, 0.13)}
   <path d="M42 84 L100 64 L158 84 L158 156 L100 176 L42 156 Z" fill="#e0a45e" stroke="#a76b35" stroke-width="5" stroke-linejoin="round"/>
   <path d="M100 64 L158 84 L158 100 L100 80 Z" fill="#f0c188" opacity=".8"/>
   <path d="M42 84 L100 104 L100 176 L42 156 Z" fill="#c98a4f" stroke="#a76b35" stroke-width="4"/>
   <path d="M100 104 L158 84 L158 156 L100 176 Z" fill="#d79a5a" stroke="#a76b35" stroke-width="4"/>
   <path d="M42 84 L20 60 L78 52 L100 64 Z" fill="#f0c188" stroke="#a76b35" stroke-width="4" stroke-linejoin="round"/>
   <path d="M158 84 L180 60 L122 52 L100 64 Z" fill="#f0c188" stroke="#a76b35" stroke-width="4" stroke-linejoin="round"/>
   <path d="M100 104 L100 176" stroke="#a76b35" stroke-width="3" opacity=".55"/>
   <rect x="60" y="118" width="26" height="20" rx="4" fill="#fff3d8" opacity=".85"/>
   <path d="M66 128 h14 M73 121 v14" stroke="#c98a4f" stroke-width="3" stroke-linecap="round"/>`,
);

const BALL = svgDoc(
  200,
  200,
  `${shadow(100, 176, 60, 11, 0.12)}
   <circle cx="100" cy="104" r="68" fill="#ff8fae" stroke="#d75e86" stroke-width="5"/>
   <path d="M100 36 A68 68 0 0 1 168 104 L100 104 Z" fill="#8fdcff"/>
   <path d="M100 172 A68 68 0 0 1 32 104 L100 104 Z" fill="#ffe27a"/>
   <path d="M100 36 A68 68 0 0 0 32 104 L100 104 Z" fill="#7ce3a8"/>
   <path d="M100 172 A68 68 0 0 0 168 104 L100 104 Z" fill="#c9a7ff"/>
   <circle cx="100" cy="104" r="16" fill="#fff" opacity=".85"/>
   <path d="M62 66 Q80 48 104 50" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".6"/>
   <circle cx="100" cy="104" r="68" fill="none" stroke="#d75e86" stroke-width="5"/>`,
);

const CRATE = svgDoc(
  200,
  200,
  `${shadow(100, 178, 70, 11, 0.13)}
   <rect x="40" y="64" width="120" height="108" rx="8" fill="#c98a4f" stroke="#8a5a2b" stroke-width="5"/>
   <path d="M40 88 L160 88 M40 148 L160 148" stroke="#8a5a2b" stroke-width="4" opacity=".7"/>
   <path d="M52 64 L52 172 M148 64 L148 172" stroke="#e0a45e" stroke-width="7"/>
   <path d="M40 64 L64 40 L136 40 L160 64 Z" fill="#e0a45e" stroke="#8a5a2b" stroke-width="4" stroke-linejoin="round"/>
   <path d="M52 64 L64 40 M148 64 L136 40" stroke="#8a5a2b" stroke-width="3" opacity=".55"/>
   <g fill="#f2c24f" stroke="#c9871b" stroke-width="2.5">
     <circle cx="60" cy="76" r="5"/><circle cx="140" cy="76" r="5"/>
     <circle cx="60" cy="160" r="5"/><circle cx="140" cy="160" r="5"/>
   </g>
   <path d="M84 118 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 z" fill="#ffe66d"/>`,
);

/* ------------------------------------------------------------------ */
/* Destinations (260 x 260)                                            */
/* ------------------------------------------------------------------ */

const DEST_PILLOWFORT = svgDoc(
  260,
  260,
  `${shadow(130, 240, 96, 12, 0.14)}
   <path d="M40 236 Q40 92 130 54 Q220 92 220 236" stroke="#c9a7ff" stroke-width="26" stroke-linecap="round" fill="none"/>
   <path d="M40 236 Q40 92 130 54 Q220 92 220 236" stroke="#e4d2ff" stroke-width="14" stroke-linecap="round" fill="none" opacity=".8"/>
   <g fill="#ff9ec7" stroke="#d95f8f" stroke-width="2.5">
     <circle cx="42" cy="206" r="14"/><circle cx="46" cy="156" r="13"/><circle cx="62" cy="112" r="14"/>
     <circle cx="90" cy="80" r="13"/><circle cx="130" cy="60" r="15"/><circle cx="170" cy="80" r="13"/>
     <circle cx="198" cy="112" r="14"/><circle cx="214" cy="156" r="13"/><circle cx="218" cy="206" r="14"/>
   </g>
   <g fill="#ffe27a">
     <circle cx="42" cy="206" r="5"/><circle cx="62" cy="112" r="5"/><circle cx="130" cy="60" r="5.5"/>
     <circle cx="198" cy="112" r="5"/><circle cx="218" cy="206" r="5"/>
   </g>
   <path d="M96 236 Q130 216 164 236 Q150 250 130 250 Q110 250 96 236 Z" fill="#ffd6ea"/>
   <path d="M104 240 Q130 226 156 240" stroke="#d95f8f" stroke-width="3" fill="none" opacity=".6"/>
   <g fill="#fff">
     <circle cx="130" cy="34" r="4.5"/><circle cx="74" cy="70" r="4"/><circle cx="186" cy="70" r="4"/>
   </g>`,
);

const DEST_GARDENTENT = svgDoc(
  260,
  260,
  `${shadow(130, 240, 98, 12, 0.14)}
   <path d="M130 48 L214 214 L46 214 Z" fill="#7ed489" stroke="#3f9f5f" stroke-width="5" stroke-linejoin="round"/>
   <path d="M130 48 L130 214 L46 214 Z" fill="#9ae7a5" opacity=".65"/>
   <path d="M130 48 L214 214 L130 214 Z" fill="#5fc06a" opacity=".5"/>
   <path d="M96 214 Q96 130 130 112 Q164 130 164 214 Z" fill="#2f7f43" opacity=".85"/>
   <path d="M104 214 Q104 146 130 132 Q156 146 156 214 Z" fill="#ffe9a8" opacity=".9"/>
   <path d="M130 48 L130 30" stroke="#8a5a2b" stroke-width="5" stroke-linecap="round"/>
   <path d="M130 30 L166 42 L130 54 Z" fill="#ff8fb5" stroke="#d95c85" stroke-width="2.5"/>
   <g fill="#ff8fb5" stroke="#d95c85" stroke-width="2">
     <circle cx="60" cy="206" r="8"/><circle cx="200" cy="206" r="8"/>
   </g>
   <g fill="#ffe27a"><circle cx="60" cy="206" r="3"/><circle cx="200" cy="206" r="3"/></g>
   <g fill="#5fc06a">
     <path d="M52 218 Q34 206 28 216 Q40 228 52 222 Z"/>
     <path d="M208 218 Q226 206 232 216 Q220 228 208 222 Z"/>
   </g>
   <g fill="#fff"><circle cx="96" cy="96" r="4"/><circle cx="170" cy="82" r="3.5"/></g>`,
);

const DEST_TOYCHEST = svgDoc(
  260,
  260,
  `${shadow(130, 240, 98, 12, 0.14)}
   <path d="M44 120 Q44 74 130 70 Q216 74 216 120 L216 206 Q216 224 198 224 L62 224 Q44 224 44 206 Z" fill="#e0a45e" stroke="#8a5a2b" stroke-width="5"/>
   <path d="M44 120 Q44 84 130 82 Q216 84 216 120" stroke="#f0c188" stroke-width="9" fill="none"/>
   <path d="M74 96 L74 222 M186 96 L186 222" stroke="#f2c24f" stroke-width="11"/>
   <path d="M44 156 L216 156" stroke="#a76b35" stroke-width="4" opacity=".6"/>
   <rect x="108" y="140" width="44" height="40" rx="9" fill="#ffd95e" stroke="#c9871b" stroke-width="4"/>
   <circle cx="130" cy="160" r="5.5" fill="#8a5a2b"/>
   <path d="M52 70 Q64 22 130 18 Q196 22 208 70 Q172 88 130 88 Q88 88 52 70 Z" fill="#f0c188" stroke="#8a5a2b" stroke-width="5"/>
   <path d="M76 44 Q130 18 184 44" stroke="#ffdfae" stroke-width="6" stroke-linecap="round" opacity=".75"/>
   <g fill="#ffe66d">
     <circle cx="64" cy="96" r="8"/><circle cx="196" cy="96" r="8"/>
   </g>
   <g>
     <path d="M96 66 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3 z" fill="#fff2a0"/>
     <path d="M170 58 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3 z" fill="#fff2a0"/>
   </g>`,
);

const DEST_ADVENTURE = svgDoc(
  260,
  260,
  `${shadow(130, 240, 100, 12, 0.14)}
   <path d="M40 232 L40 96 Q40 52 130 52 Q220 52 220 96 L220 232" stroke="#ffd978" stroke-width="24" stroke-linecap="round" fill="none"/>
   <path d="M40 232 L40 96 Q40 52 130 52 Q220 52 220 96 L220 232" stroke="#fff0b8" stroke-width="11" stroke-linecap="round" fill="none" opacity=".8"/>
   <g>
     <path d="M60 128 l6 14 15 2 -11 11 3 15 -13 -8 -13 8 3 -15 -11 -11 15 -2 z" fill="#ff8fb5"/>
     <path d="M200 128 l6 14 15 2 -11 11 3 15 -13 -8 -13 8 3 -15 -11 -11 15 -2 z" fill="#8fdcff"/>
   </g>
   <path d="M74 96 Q130 74 186 96" stroke="#7ce3c2" stroke-width="9" stroke-linecap="round" fill="none"/>
   <g>
     <circle cx="130" cy="52" r="22" fill="#fff6a8" stroke="#ffc83d" stroke-width="5"/>
     <path d="M130 34 l5 12 13 2 -9 9 2 13 -11 -6 -11 6 2 -13 -9 -9 13 -2 z" fill="#ffd23f"/>
   </g>
   <path d="M88 232 Q130 208 172 232 Q156 250 130 250 Q104 250 88 232 Z" fill="#ffb3d1" opacity=".85"/>
   <g stroke-width="4" stroke-linecap="round">
     <path d="M54 118 L54 60" stroke="#ff8fb5"/>
     <path d="M206 118 L206 60" stroke="#8fdcff"/>
   </g>
   <ellipse cx="54" cy="50" rx="16" ry="20" fill="#ff8fb5" stroke="#d95c85" stroke-width="3"/>
   <ellipse cx="206" cy="50" rx="16" ry="20" fill="#8fdcff" stroke="#4f9fd6" stroke-width="3"/>
   <g fill="#fff"><circle cx="92" cy="70" r="3.5"/><circle cx="168" cy="70" r="3.5"/></g>`,
);

/* ------------------------------------------------------------------ */
/* Decorations                                                         */
/* ------------------------------------------------------------------ */

const DECOR_FLOWER = svgDoc(
  140,
  200,
  `<path d="M70 192 Q66 146 70 106" stroke="#47a55c" stroke-width="8" stroke-linecap="round"/>
   <path d="M68 158 Q44 148 36 124 Q60 124 70 144 Z" fill="#73d182"/>
   <path d="M72 146 Q96 136 106 114 Q80 116 70 136 Z" fill="#8be292"/>
   <g fill="#ff8fb5" stroke="#d95c85" stroke-width="3">
     <circle cx="70" cy="56" r="26"/><circle cx="102" cy="76" r="23"/><circle cx="92" cy="106" r="23"/>
     <circle cx="52" cy="106" r="23"/><circle cx="40" cy="76" r="23"/>
   </g>
   <circle cx="70" cy="82" r="23" fill="#ffe27a" stroke="#e8b62b" stroke-width="3"/>
   <circle cx="62" cy="74" r="4.5" fill="#fff7c8" opacity=".85"/>`,
);

const DECOR_BUSH = svgDoc(
  300,
  170,
  `${shadow(150, 154, 120, 8, 0.1)}
   <g fill="#69cf7f" stroke="#409f5d" stroke-width="3">
     <circle cx="70" cy="108" r="43"/><circle cx="120" cy="75" r="52"/>
     <circle cx="179" cy="80" r="53"/><circle cx="232" cy="111" r="42"/>
   </g>
   <g fill="#9aeaa2" opacity=".7">
     <circle cx="55" cy="97" r="23"/><circle cx="108" cy="57" r="27"/>
     <circle cx="173" cy="58" r="26"/><circle cx="228" cy="98" r="21"/>
   </g>
   <g fill="#ffb1c9"><circle cx="99" cy="101" r="7"/><circle cx="159" cy="91" r="6"/><circle cx="207" cy="108" r="6"/></g>`,
);

const DECOR_CLOUD = svgDoc(
  260,
  140,
  `<g fill="#ffffff" opacity=".9">
     <path d="M48 100 Q22 100 24 74 Q26 50 54 52 Q60 26 90 30 Q116 8 146 32 Q176 26 184 54 Q212 54 216 78 Q218 102 190 104 Q160 118 130 110 Q100 122 74 110 Q56 112 48 100 Z"/>
   </g>`,
);

const DECOR_BALLOON = svgDoc(
  140,
  240,
  `<path d="M70 150 Q64 190 74 228" stroke="#b98a5a" stroke-width="3" fill="none"/>
   <ellipse cx="70" cy="96" rx="48" ry="58" fill="#ff8fb5" stroke="#d95c85" stroke-width="4"/>
   <path d="M70 38 A48 58 0 0 1 118 96 L70 96 Z" fill="#ffb6d0" opacity=".7"/>
   <path d="M52 70 Q60 54 74 54" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".7"/>
   <path d="M70 154 l-10 12 h20 z" fill="#d95c85"/>`,
);

/* ------------------------------------------------------------------ */
/* Preview cards (480 x 300)                                           */
/* ------------------------------------------------------------------ */

function previewShell(skyTop, skyBottom, hill, ground, body) {
  return svgDoc(
    480,
    300,
    `<defs>
       <linearGradient id="sky" x1="0" y1="0" x2="0" y2="300" gradientUnits="userSpaceOnUse">
         <stop stop-color="${skyTop}"/><stop offset=".7" stop-color="${skyBottom}"/><stop offset="1" stop-color="#fff6d8"/>
       </linearGradient>
     </defs>
     <rect width="480" height="300" fill="url(#sky)"/>
     <circle cx="392" cy="56" r="40" fill="#fff7b0" opacity=".7"/>
     <g fill="#ffffff" opacity=".65">
       <path d="M60 78 Q40 78 42 58 Q44 40 64 42 Q70 20 94 24 Q112 8 134 26 Q158 12 178 32 Q202 28 206 50 Q226 54 222 72 Q218 90 198 90 Q174 102 152 94 Q130 104 108 94 Q84 98 60 78 Z"/>
     </g>
     <path d="M0 214 Q80 174 168 208 Q256 242 344 202 Q412 172 480 206 L480 300 L0 300 Z" fill="${hill}"/>
     <path d="M0 250 Q120 224 240 248 Q360 272 480 244 L480 300 L0 300 Z" fill="${ground}"/>
     ${body}`,
  );
}

const PREVIEW_PILLOW = previewShell(
  ['#ffd6ea', '#ffeaf4'],
  '#d9b6ff',
  '#e7d2ff',
  `<g transform="translate(150 96) scale(.9)">${PILLOW.body}</g>
   <g transform="translate(250 132) scale(.62)">${CUSHION.body}</g>
   <g transform="translate(96 150) scale(.5)">${PILLOW.body}</g>
   <g fill="#fff6b0"><circle cx="360" cy="120" r="5"/><circle cx="392" cy="150" r="4"/><circle cx="330" cy="170" r="4"/></g>`,
);

const PREVIEW_BACKYARD = previewShell(
  ['#9fe0ff', '#dff6ff'],
  '#a7e39a',
  '#6fd07a',
  `<g transform="translate(96 84) scale(.42)">${DECOR_BUSH.body}</g>
   <g transform="translate(288 150) scale(.44)">${DECOR_FLOWER.body}</g>
   <g transform="translate(360 116) scale(.3)">${Art.ITEMS.butterfly.body}</g>
   <g transform="translate(190 214) scale(.3)">${DECOR_FLOWER.body}</g>
   <g fill="#ff9fba"><circle cx="250" cy="242" r="5"/><circle cx="300" cy="250" r="4"/></g>`,
);

const PREVIEW_TOYBOX = previewShell(
  ['#bfe9ff', '#eaf7ff'],
  '#ffd9a8',
  '#ffcf8a',
  `<g transform="translate(112 92) scale(.6)">${BLOCK_RED.body}</g>
   <g transform="translate(236 110) scale(.56)">${BLOCK_BLUE.body}</g>
   <g transform="translate(320 150) scale(.5)">${BLOCK_YELLOW.body}</g>
   <g transform="translate(180 180) scale(.42)">${BALL.body}</g>
   <g fill="#fff6f9" opacity=".8"><circle cx="360" cy="96" r="5"/><circle cx="392" cy="130" r="4"/></g>`,
);

const PREVIEW_ADVENTURE = previewShell(
  ['#ffcf8a', '#ffe9f0'],
  '#ffd0a0',
  '#ffb877',
  `<g transform="translate(150 78) scale(.7)">${DEST_ADVENTURE.body}</g>
   <g transform="translate(300 160) scale(.4)">${DECOR_BALLOON.body}</g>
   <g transform="translate(96 176) scale(.3)">${DECOR_FLOWER.body}</g>
   <g fill="#fff6b0"><circle cx="380" cy="110" r="5"/><circle cx="410" cy="146" r="4"/></g>`,
);

/* ------------------------------------------------------------------ */
/* Public art table                                                    */
/* ------------------------------------------------------------------ */

const OBJECTS = {
  pillow: PILLOW,
  cushion: CUSHION,
  block: BLOCK_RED,
  blockBlue: BLOCK_BLUE,
  blockYellow: BLOCK_YELLOW,
  box: BOX,
  ball: BALL,
  crate: CRATE,
};

const DESTINATIONS = {
  pillowfort: DEST_PILLOWFORT,
  gardentent: DEST_GARDENTENT,
  toychest: DEST_TOYCHEST,
  adventure: DEST_ADVENTURE,
};

const DECOR = {
  flower: DECOR_FLOWER,
  bush: DECOR_BUSH,
  cloud: DECOR_CLOUD,
  balloon: DECOR_BALLOON,
};

const PREVIEWS = {
  pillow: PREVIEW_PILLOW,
  backyard: PREVIEW_BACKYARD,
  toybox: PREVIEW_TOYBOX,
  adventure: PREVIEW_ADVENTURE,
};

const BLOCK_VARIANTS = ['block', 'blockBlue', 'blockYellow'];

export const WorldArt = {
  svgDoc,
  svgDataURI,
  object(key) {
    return svgDataURI(OBJECTS[key] || OBJECTS.pillow);
  },
  objectBody(key) {
    return (OBJECTS[key] || OBJECTS.pillow).body;
  },
  destination(key) {
    return svgDataURI(DESTINATIONS[key] || DEST_PILLOWFORT);
  },
  decor(key) {
    return svgDataURI(DECOR[key] || DECOR_FLOWER);
  },
  preview(worldId) {
    return svgDataURI(PREVIEWS[worldId] || PREVIEW_PILLOW);
  },
  character(pet, pose = 'idle') {
    return Art.petDataURI(pet, pose);
  },
  item(key) {
    return Art.itemDataURI(key);
  },
  blocks() {
    return BLOCK_VARIANTS.slice();
  },
};

export { OBJECTS, DESTINATIONS, DECOR, PREVIEWS };