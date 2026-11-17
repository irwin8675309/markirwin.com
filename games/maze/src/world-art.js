/**
 * Original artwork for the four maze worlds.
 *
 * Character and generic item art comes from ./art.js (shared with the Pets
 * Game). Everything here is drawn from scratch for Maze Adventures: the
 * world-specific collectibles, decorations, destinations and preview cards.
 */

import { Art } from './art.js';

const NS = 'http://www.w3.org/2000/svg';

export function svgDoc(w, h, body, defs = '') {
  return `<svg xmlns="${NS}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">${defs}${body}</svg>`;
}

export function svgDataURI(svg) {
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

/* ------------------------------------------------------------------ */
/* Small world-specific collectibles (128 x 128)                       */
/* ------------------------------------------------------------------ */

const FLOWER = svgDoc(
  128,
  128,
  `<ellipse cx="64" cy="116" rx="24" ry="5" fill="#4b3c62" opacity=".12"/>
   <path d="M64 112 Q61 90 64 74" stroke="#47a55c" stroke-width="7" stroke-linecap="round"/>
   <path d="M62 98 Q42 92 35 74 Q55 74 64 90 Z" fill="#73d182"/>
   <g fill="#ff8fb5" stroke="#d95c85" stroke-width="3">
     <circle cx="64" cy="36" r="20"/><circle cx="90" cy="52" r="18"/>
     <circle cx="82" cy="78" r="18"/><circle cx="46" cy="78" r="18"/><circle cx="38" cy="52" r="18"/>
   </g>
   <circle cx="64" cy="57" r="17" fill="#ffe27a" stroke="#e8b62b" stroke-width="3"/>
   <circle cx="58" cy="51" r="3.5" fill="#fff7c8" opacity=".85"/>`,
);

const ACORN = svgDoc(
  128,
  128,
  `<ellipse cx="64" cy="116" rx="24" ry="5" fill="#4b3c62" opacity=".12"/>
   <path d="M64 22 Q68 12 76 10" stroke="#6f4a2b" stroke-width="7" stroke-linecap="round"/>
   <path d="M38 55 Q40 100 64 108 Q88 100 90 55 Z" fill="#d79a5a" stroke="#a76b35" stroke-width="4"/>
   <path d="M42 72 Q60 84 86 72" stroke="#f0c188" stroke-width="5" stroke-linecap="round" opacity=".7"/>
   <path d="M30 58 Q32 34 64 32 Q96 34 98 58 Q84 68 64 68 Q44 68 30 58 Z" fill="#8b5b33" stroke="#603a1d" stroke-width="4"/>
   <path d="M44 44 Q64 36 84 44 M46 54 Q64 48 82 54" stroke="#a9764a" stroke-width="4" stroke-linecap="round" opacity=".8"/>
   <circle cx="50" cy="84" r="4" fill="#f4d0a0" opacity=".8"/>`,
);

const MUSHROOM = svgDoc(
  128,
  128,
  `<ellipse cx="64" cy="116" rx="26" ry="5" fill="#4b3c62" opacity=".12"/>
   <path d="M53 72 Q48 104 57 112 Q64 117 72 111 Q81 100 76 72 Z" fill="#fff2da" stroke="#d7b98d" stroke-width="3"/>
   <path d="M16 70 Q21 24 64 20 Q107 25 112 70 Q90 84 64 84 Q38 84 16 70 Z" fill="#a782e8" stroke="#7354b8" stroke-width="4"/>
   <ellipse cx="64" cy="62" rx="46" ry="11" fill="#d9c6ff" opacity=".5"/>
   <circle cx="44" cy="46" r="8" fill="#fff0ff" opacity=".95"/><circle cx="72" cy="34" r="6.5" fill="#fff0ff" opacity=".95"/>
   <circle cx="92" cy="52" r="6" fill="#fff0ff" opacity=".9"/><circle cx="60" cy="62" r="4.5" fill="#fff0ff" opacity=".85"/>
   <circle cx="58" cy="96" r="2.5" fill="#d7b98d" opacity=".7"/><circle cx="71" cy="100" r="2" fill="#d7b98d" opacity=".7"/>`,
);

const CANDY = svgDoc(
  128,
  128,
  `<ellipse cx="64" cy="116" rx="26" ry="5" fill="#4b3c62" opacity=".12"/>
   <g transform="rotate(-16 64 62)">
     <path d="M30 62 Q14 46 22 34 Q36 26 48 44 L48 80 Q36 98 22 90 Q14 78 30 62 Z" fill="#ff9ec2" stroke="#d95f8f" stroke-width="3.5"/>
     <path d="M98 62 Q114 46 106 34 Q92 26 80 44 L80 80 Q92 98 106 90 Q114 78 98 62 Z" fill="#8fdcff" stroke="#4f9fd6" stroke-width="3.5"/>
     <rect x="40" y="38" width="48" height="48" rx="16" fill="#ffd166" stroke="#dfa52a" stroke-width="4"/>
     <path d="M48 48 Q60 42 76 48" stroke="#fff3c4" stroke-width="5" stroke-linecap="round" opacity=".8"/>
     <path d="M44 74 Q60 80 82 70" stroke="#ff8fb5" stroke-width="5" stroke-linecap="round" opacity=".9"/>
     <path d="M48 58 Q64 64 80 56" stroke="#8fdcff" stroke-width="4" stroke-linecap="round" opacity=".85"/>
   </g>`,
);

const LOLLIPOP = svgDoc(
  128,
  128,
  `<ellipse cx="64" cy="117" rx="20" ry="5" fill="#4b3c62" opacity=".12"/>
   <rect x="59" y="58" width="10" height="58" rx="5" fill="#fff8ef" stroke="#d9c5b5" stroke-width="2.5"/>
   <circle cx="64" cy="42" r="34" fill="#ff8fae" stroke="#d75e86" stroke-width="3.5"/>
   <path d="M64 8 A34 34 0 0 1 98 42 A17 34 0 0 0 64 8 Z" fill="#ffd0df" opacity=".55"/>
   <path d="M46 31 Q64 14 82 31 Q71 31 64 42 Q57 31 46 31 Z" fill="#fff2a0" opacity=".9"/>
   <path d="M52 54 Q64 44 76 54 Q64 63 52 54 Z" fill="#fff" opacity=".45"/>
   <circle cx="46" cy="39" r="3" fill="#fff" opacity=".8"/>`,
);

const COIN = svgDoc(
  128,
  128,
  `<ellipse cx="64" cy="116" rx="24" ry="5" fill="#4b3c62" opacity=".12"/>
   <circle cx="64" cy="64" r="44" fill="#f6b93b" stroke="#c9871b" stroke-width="4"/>
   <circle cx="64" cy="64" r="34" fill="#ffd965" stroke="#e0a52c" stroke-width="3"/>
   <path d="M64 36 L71 56 L92 58 L75 71 L81 92 L64 79 L47 92 L53 71 L36 58 L57 56 Z" fill="#fff4b0" stroke="#e0a52c" stroke-width="2.5" stroke-linejoin="round"/>
   <path d="M38 42 Q50 28 68 28" stroke="#fff8d0" stroke-width="6" stroke-linecap="round" opacity=".75"/>`,
);

const TREASURE = svgDoc(
  128,
  128,
  `<ellipse cx="64" cy="116" rx="34" ry="5" fill="#4b3c62" opacity=".13"/>
   <path d="M24 64 Q24 40 64 40 Q104 40 104 64 L104 96 Q104 108 92 108 L36 108 Q24 108 24 96 Z" fill="#b5763f" stroke="#7d4c24" stroke-width="4"/>
   <path d="M24 64 Q24 44 64 44 Q104 44 104 64" stroke="#e0a45e" stroke-width="7" fill="none"/>
   <path d="M40 64 L40 106 M88 64 L88 106" stroke="#f2c24f" stroke-width="7"/>
   <path d="M24 80 L104 80" stroke="#8d5a2c" stroke-width="3" opacity=".6"/>
   <rect x="54" y="72" width="20" height="20" rx="5" fill="#ffd95e" stroke="#c9871b" stroke-width="3"/>
   <circle cx="64" cy="82" r="3" fill="#8d5a2c"/>
   <path d="M30 40 Q38 20 64 20 Q90 20 98 40 Q82 48 64 48 Q46 48 30 40 Z" fill="#c98a4f" stroke="#7d4c24" stroke-width="4"/>
   <path d="M40 28 Q64 16 88 28" stroke="#f0c48a" stroke-width="4" stroke-linecap="round" opacity=".7"/>
   <path d="M46 48 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" fill="#ffe66d"/>`,
);

/* ------------------------------------------------------------------ */
/* Hidden-surprise friends (64 x 64)                                   */
/* ------------------------------------------------------------------ */

const LADYBUG = svgDoc(
  64,
  64,
  `<ellipse cx="32" cy="54" rx="20" ry="4" fill="#4b3c62" opacity=".12"/>
   <circle cx="32" cy="34" r="20" fill="#ff6b6b" stroke="#b83232" stroke-width="3"/>
   <path d="M32 14 A20 20 0 0 1 32 54 Z" fill="#3a3242"/>
   <path d="M32 14 L32 54" stroke="#2a2430" stroke-width="3"/>
   <circle cx="24" cy="28" r="4.5" fill="#2a2430"/><circle cx="24" cy="42" r="4" fill="#2a2430"/>
   <circle cx="40" cy="31" r="3.5" fill="#2a2430"/><circle cx="40" cy="44" r="4" fill="#2a2430"/>
   <circle cx="32" cy="13" r="8" fill="#3a3242"/>
   <path d="M25 7 Q20 2 15 4 M39 7 Q44 2 49 4" stroke="#3a3242" stroke-width="3" stroke-linecap="round"/>`,
);

const FIREFLY = svgDoc(
  64,
  64,
  `<circle cx="32" cy="36" r="28" fill="#fff4a8" opacity=".28"/>
   <circle cx="32" cy="36" r="18" fill="#ffe66d" opacity=".5"/>
   <ellipse cx="32" cy="38" rx="9" ry="12" fill="#6d5a3f" stroke="#4a3c28" stroke-width="2.5"/>
   <circle cx="32" cy="30" r="7" fill="#4a3c28"/>
   <path d="M26 24 Q20 16 14 14 M38 24 Q44 16 50 14" stroke="#4a3c28" stroke-width="2.5" stroke-linecap="round"/>
   <ellipse cx="22" cy="36" rx="7" ry="10" fill="#fff8d0" opacity=".7" transform="rotate(-25 22 36)"/>
   <ellipse cx="42" cy="36" rx="7" ry="10" fill="#fff8d0" opacity=".7" transform="rotate(25 42 36)"/>
   <circle cx="32" cy="42" r="5" fill="#fff6a8"/>`,
);

const SPRINKLE = svgDoc(
  64,
  64,
  `<ellipse cx="32" cy="54" rx="18" ry="4" fill="#4b3c62" opacity=".1"/>
   <g stroke-width="6" stroke-linecap="round">
     <path d="M18 18 L26 26" stroke="#ff7fa5"/>
     <path d="M42 14 L46 24" stroke="#6fd1ff"/>
     <path d="M12 38 L20 42" stroke="#ffe27a"/>
     <path d="M46 36 L52 44" stroke="#7ce3a8"/>
     <path d="M26 48 L34 50" stroke="#b98bf0"/>
   </g>
   <path d="M32 8 L37 26 L56 28 L41 39 L46 58 L32 47 L18 58 L23 39 L8 28 L27 26 Z" fill="#fff3b0" stroke="#e8b62b" stroke-width="3" stroke-linejoin="round"/>
   <circle cx="32" cy="33" r="6" fill="#ffd84d"/>`,
);

const CRAB = svgDoc(
  64,
  64,
  `<ellipse cx="32" cy="56" rx="22" ry="4" fill="#4b3c62" opacity=".12"/>
   <ellipse cx="32" cy="40" rx="19" ry="14" fill="#ff8c5a" stroke="#c85a2e" stroke-width="3"/>
   <path d="M16 36 Q6 28 8 18 Q20 20 22 32 Z" fill="#ff8c5a" stroke="#c85a2e" stroke-width="3"/>
   <path d="M48 36 Q58 28 56 18 Q44 20 42 32 Z" fill="#ff8c5a" stroke="#c85a2e" stroke-width="3"/>
   <circle cx="25" cy="31" r="4.5" fill="#fff"/><circle cx="39" cy="31" r="4.5" fill="#fff"/>
   <circle cx="25" cy="31" r="2.2" fill="#2a2430"/><circle cx="39" cy="31" r="2.2" fill="#2a2430"/>
   <path d="M26 43 Q32 48 38 43" stroke="#a8451f" stroke-width="2.5" stroke-linecap="round"/>
   <path d="M20 52 l-6 8 M44 52 l6 8" stroke="#c85a2e" stroke-width="3.5" stroke-linecap="round"/>`,
);

/* ------------------------------------------------------------------ */
/* Decorations                                                         */
/* ------------------------------------------------------------------ */

const PALM_TREE = svgDoc(
  260,
  340,
  `<ellipse cx="130" cy="326" rx="56" ry="8" fill="#4b3c62" opacity=".12"/>
   <path d="M118 322 Q126 210 108 126 Q100 84 128 52 Q154 86 148 132 Q140 214 148 322 Z" fill="#b9824c" stroke="#8a5c30" stroke-width="4"/>
   <path d="M124 300 Q130 250 126 200 M134 250 Q140 196 134 150 M128 150 Q132 112 140 82" stroke="#8a5c30" stroke-width="5" stroke-linecap="round" opacity=".55"/>
   <g fill="#5fc06a" stroke="#3e9b50" stroke-width="4">
     <path d="M128 54 Q64 24 26 62 Q74 66 128 54 Z"/>
     <path d="M128 54 Q188 18 238 48 Q186 62 128 54 Z"/>
     <path d="M128 52 Q104 6 52 10 Q84 42 128 52 Z"/>
     <path d="M128 52 Q160 4 216 10 Q178 44 128 52 Z"/>
     <path d="M128 54 Q116 84 74 96 Q106 64 128 54 Z"/>
     <path d="M128 54 Q148 84 196 92 Q158 62 128 54 Z"/>
   </g>
   <circle cx="112" cy="64" r="11" fill="#9c6a3c" stroke="#6f4a26" stroke-width="3"/>
   <circle cx="146" cy="66" r="10" fill="#9c6a3c" stroke="#6f4a26" stroke-width="3"/>`,
);

const TREASURE_CHEST = svgDoc(
  260,
  220,
  `<ellipse cx="130" cy="204" rx="94" ry="10" fill="#4b3c62" opacity=".13"/>
   <path d="M40 110 Q40 70 130 66 Q220 70 220 110 L220 172 Q220 190 202 190 L58 190 Q40 190 40 172 Z" fill="#b5763f" stroke="#7d4c24" stroke-width="5"/>
   <path d="M40 116 Q40 80 130 78 Q220 80 220 116" stroke="#e0a45e" stroke-width="9" fill="none"/>
   <path d="M70 92 L70 188 M190 92 L190 188" stroke="#f2c24f" stroke-width="10"/>
   <path d="M40 142 L220 142" stroke="#8d5a2c" stroke-width="4" opacity=".65"/>
   <rect x="112" y="126" width="36" height="34" rx="8" fill="#ffd95e" stroke="#c9871b" stroke-width="4"/>
   <circle cx="130" cy="143" r="5" fill="#8d5a2c"/>
   <path d="M52 70 Q62 22 130 18 Q198 22 208 70 Q172 86 130 86 Q88 86 52 70 Z" fill="#c98a4f" stroke="#7d4c24" stroke-width="5"/>
   <path d="M70 40 Q130 16 190 40" stroke="#f0c48a" stroke-width="6" stroke-linecap="round" opacity=".7"/>
   <path d="M82 70 l4 11 11 4 -11 4 -4 11 -4 -11 -11 -4 11 -4 z" fill="#ffe66d"/>
   <path d="M168 58 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 z" fill="#fff2a0"/>`,
);

const ROCK = svgDoc(
  180,
  140,
  `<ellipse cx="90" cy="126" rx="66" ry="8" fill="#4b3c62" opacity=".12"/>
   <path d="M28 118 Q18 86 44 62 Q64 38 98 46 Q136 50 150 82 Q162 112 144 120 Z" fill="#9aa7b5" stroke="#6d7b8a" stroke-width="4"/>
   <path d="M44 62 Q62 58 74 70 Q60 84 38 78 Z" fill="#c2ccd6" opacity=".75"/>
   <circle cx="110" cy="84" r="7" fill="#7e8c9a" opacity=".6"/>
   <circle cx="132" cy="104" r="5" fill="#7e8c9a" opacity=".5"/>`,
);

const SHELL = svgDoc(
  140,
  120,
  `<ellipse cx="70" cy="108" rx="44" ry="6" fill="#4b3c62" opacity=".1"/>
   <path d="M70 100 Q22 96 18 62 Q26 26 70 22 Q114 26 122 62 Q118 96 70 100 Z" fill="#ffd0c0" stroke="#e0957f" stroke-width="4"/>
   <path d="M70 24 L70 98 M44 30 Q52 66 44 96 M96 30 Q88 66 96 96 M28 44 Q52 68 34 92 M112 44 Q88 68 106 92" stroke="#e0957f" stroke-width="3" opacity=".6"/>
   <circle cx="70" cy="66" r="9" fill="#fff1e6" opacity=".9"/>`,
);

/* ------------------------------------------------------------------ */
/* Destinations (240 x 240)                                            */
/* ------------------------------------------------------------------ */

const FLOWER_ARCH = svgDoc(
  240,
  240,
  `<ellipse cx="120" cy="222" rx="86" ry="10" fill="#4b3c62" opacity=".13"/>
   <path d="M46 218 Q46 92 120 56 Q194 92 194 218" stroke="#4f9f5f" stroke-width="18" stroke-linecap="round" fill="none"/>
   <path d="M46 218 Q46 92 120 56 Q194 92 194 218" stroke="#7ed489" stroke-width="9" stroke-linecap="round" fill="none" opacity=".8"/>
   <g fill="#ff8fb5" stroke="#d95c85" stroke-width="2.5">
     <circle cx="48" cy="196" r="10"/><circle cx="50" cy="154" r="9"/><circle cx="62" cy="116" r="10"/>
     <circle cx="86" cy="84" r="9"/><circle cx="120" cy="60" r="11"/><circle cx="154" cy="84" r="9"/>
     <circle cx="178" cy="116" r="10"/><circle cx="190" cy="154" r="9"/><circle cx="192" cy="196" r="10"/>
   </g>
   <g fill="#ffe27a">
     <circle cx="48" cy="196" r="4"/><circle cx="50" cy="154" r="3.5"/><circle cx="62" cy="116" r="4"/>
     <circle cx="86" cy="84" r="3.5"/><circle cx="120" cy="60" r="4.5"/><circle cx="154" cy="84" r="3.5"/>
     <circle cx="178" cy="116" r="4"/><circle cx="190" cy="154" r="3.5"/><circle cx="192" cy="196" r="4"/>
   </g>
   <g fill="#6fd07a">
     <path d="M60 206 Q38 190 28 200 Q40 216 60 210 Z"/>
     <path d="M180 206 Q202 190 212 200 Q200 216 180 210 Z"/>
     <path d="M92 196 Q104 178 118 186 Q112 200 92 200 Z"/>
   </g>
   <path d="M96 222 Q120 206 144 222 Q132 234 120 234 Q108 234 96 222 Z" fill="#8fe08b"/>
   <g fill="#fff">
     <circle cx="74" cy="70" r="4" opacity=".9"/><circle cx="166" cy="70" r="4" opacity=".9"/>
     <circle cx="120" cy="40" r="4.5" opacity=".9"/>
   </g>`,
);

const TREEHOUSE = svgDoc(
  240,
  240,
  `<ellipse cx="120" cy="226" rx="92" ry="10" fill="#4b3c62" opacity=".13"/>
   <path d="M104 222 Q112 160 104 108 Q100 74 120 58 Q140 74 136 108 Q128 160 136 222 Z" fill="#8a6248" stroke="#624230" stroke-width="4"/>
   <g fill="#6fc98f" stroke="#429f6a" stroke-width="4">
     <circle cx="92" cy="84" r="40"/><circle cx="150" cy="78" r="44"/><circle cx="120" cy="50" r="40"/>
   </g>
   <g fill="#9ae7b5" opacity=".7"><circle cx="82" cy="72" r="22"/><circle cx="144" cy="62" r="24"/></g>
   <rect x="92" y="120" width="58" height="52" rx="8" fill="#f0c98a" stroke="#b98a4f" stroke-width="4"/>
   <path d="M84 122 L121 92 L158 122 Z" fill="#d96a6a" stroke="#a84848" stroke-width="4"/>
   <rect x="113" y="142" width="20" height="30" rx="4" fill="#8a5a34"/>
   <circle cx="127" cy="157" r="2.5" fill="#ffd84d"/>
   <rect x="98" y="132" width="13" height="13" rx="3" fill="#bfe9ff" stroke="#7fb9d9" stroke-width="2.5"/>
   <path d="M94 174 L94 214 M148 174 L148 214" stroke="#c98a4f" stroke-width="5" stroke-linecap="round"/>
   <path d="M94 184 L148 184 M94 196 L148 196 M94 208 L148 208" stroke="#c98a4f" stroke-width="4" stroke-linecap="round"/>
   <g fill="#ffe78a"><circle cx="84" cy="144" r="4"/><circle cx="160" cy="136" r="4"/></g>`,
);

const CANDY_CASTLE = svgDoc(
  240,
  240,
  `<ellipse cx="120" cy="226" rx="92" ry="10" fill="#4b3c62" opacity=".12"/>
   <rect x="46" y="112" width="148" height="108" rx="12" fill="#ffc2da" stroke="#e0709e" stroke-width="4"/>
   <rect x="46" y="112" width="148" height="20" fill="#fff0f6" opacity=".8"/>
   <path d="M40 114 L64 78 L88 114 Z" fill="#ff8fb5" stroke="#d95c85" stroke-width="4"/>
   <path d="M152 114 L176 78 L200 114 Z" fill="#8fdcff" stroke="#4f9fd6" stroke-width="4"/>
   <path d="M104 114 L120 84 L136 114 Z" fill="#ffe27a" stroke="#e0b52a" stroke-width="4"/>
   <rect x="96" y="152" width="48" height="68" rx="20" fill="#ff9ec2" stroke="#d95c85" stroke-width="4"/>
   <path d="M96 186 Q120 170 144 186 L144 220 L96 220 Z" fill="#fff0f6" opacity=".85"/>
   <circle cx="120" cy="196" r="5" fill="#d95c85"/>
   <g fill="#fff6a8">
     <circle cx="62" cy="136" r="5"/><circle cx="178" cy="136" r="5"/>
     <circle cx="62" cy="170" r="5"/><circle cx="178" cy="170" r="5"/>
     <circle cx="80" cy="196" r="4"/><circle cx="160" cy="196" r="4"/>
   </g>
   <path d="M64 78 L64 52" stroke="#e0709e" stroke-width="4"/>
   <path d="M64 52 L84 60 L64 68 Z" fill="#ffe27a"/>
   <path d="M176 78 L176 48" stroke="#4f9fd6" stroke-width="4"/>
   <path d="M176 48 L196 56 L176 64 Z" fill="#ff8fb5"/>
   <g fill="#ff8fb5"><circle cx="46" cy="220" r="8"/><circle cx="194" cy="220" r="8"/></g>
   <g fill="#7ce3c2"><circle cx="68" cy="218" r="6"/><circle cx="172" cy="218" r="6"/></g>`,
);

const TREASURE_DEST = svgDoc(
  240,
  240,
  `<ellipse cx="120" cy="220" rx="92" ry="10" fill="#4b3c62" opacity=".13"/>
   <path d="M44 106 Q44 66 120 62 Q196 66 196 106 L196 186 Q196 206 176 206 L64 206 Q44 206 44 186 Z" fill="#b5763f" stroke="#7d4c24" stroke-width="5"/>
   <path d="M44 112 Q44 76 120 74 Q196 76 196 112" stroke="#e0a45e" stroke-width="9" fill="none"/>
   <path d="M74 88 L74 204 M166 88 L166 204" stroke="#f2c24f" stroke-width="11"/>
   <path d="M44 146 L196 146" stroke="#8d5a2c" stroke-width="4" opacity=".6"/>
   <rect x="100" y="130" width="40" height="38" rx="9" fill="#ffd95e" stroke="#c9871b" stroke-width="4"/>
   <circle cx="120" cy="149" r="5" fill="#8d5a2c"/>
   <path d="M54 72 Q64 22 120 18 Q176 22 186 72 Q152 88 120 88 Q88 88 54 72 Z" fill="#c98a4f" stroke="#7d4c24" stroke-width="5"/>
   <path d="M74 42 Q120 16 166 42" stroke="#f0c48a" stroke-width="6" stroke-linecap="round" opacity=".7"/>
   <g fill="#ffe66d">
     <circle cx="70" cy="110" r="8"/><circle cx="170" cy="110" r="8"/>
     <circle cx="96" cy="116" r="6"/><circle cx="146" cy="116" r="6"/>
   </g>
   <g fill="#6fd1ff" stroke="#3f78d8" stroke-width="2">
     <path d="M96 86 l9 12 -9 12 -9 -12 z"/><path d="M144 86 l9 12 -9 12 -9 -12 z"/>
   </g>
   <path d="M86 84 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3 z" fill="#fff2a0"/>
   <path d="M156 78 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3 z" fill="#fff2a0"/>`,
);

/* ------------------------------------------------------------------ */
/* Preview cards (480 x 300)                                           */
/* ------------------------------------------------------------------ */

function previewShell(sky, hills, ground, body) {
  return svgDoc(
    480,
    300,
    `<defs>
       <linearGradient id="sky" x1="0" y1="0" x2="0" y2="300" gradientUnits="userSpaceOnUse">
         <stop stop-color="${sky[0]}"/><stop offset=".7" stop-color="${sky[1]}"/><stop offset="1" stop-color="#fff6d8"/>
       </linearGradient>
     </defs>
     <rect width="480" height="300" fill="url(#sky)"/>
     <circle cx="386" cy="58" r="42" fill="#fff7b0" opacity=".7"/>
     <g fill="#ffffff" opacity=".65">
       <path d="M60 78 Q40 78 42 58 Q44 40 64 42 Q70 20 94 24 Q112 8 134 26 Q158 12 178 32 Q202 28 206 50 Q226 54 222 72 Q218 90 198 90 Q174 102 152 94 Q130 104 108 94 Q84 98 60 78 Z"/>
       <path d="M300 112 Q282 112 284 96 Q286 80 302 82 Q308 64 328 66 Q344 52 364 68 Q386 56 402 74 Q424 70 428 88 Q448 92 444 108 Q440 124 422 124 Q402 134 382 128 Q362 136 344 128 Q324 132 300 112 Z"/>
     </g>
     <path d="M0 214 Q80 174 168 208 Q256 242 344 202 Q412 172 480 206 L480 300 L0 300 Z" fill="${hills[0]}"/>
     <path d="M0 244 Q90 212 180 242 Q270 272 360 238 Q426 214 480 238 L480 300 L0 300 Z" fill="${hills[1]}"/>
     <path d="M0 268 Q120 244 240 266 Q360 288 480 262 L480 300 L0 300 Z" fill="${ground}"/>
     ${body}`,
  );
}

const PREVIEW_GARDEN = previewShell(
  ['#8fdcff', '#dcf7ff'],
  ['#a7e39a', '#8bd886'],
  '#6fd07a',
  `<g transform="translate(96 92) scale(.46)">${Art.PROPS.treeMeadow.body}</g>
   <g transform="translate(292 150) scale(.34)">${Art.PROPS.bush.body}</g>
   <g transform="translate(236 150) scale(.3)">${Art.PROPS.flower.body}</g>
   <g transform="translate(330 104) scale(.24)">${Art.ITEMS.butterfly.body}</g>
   <g transform="translate(156 226) scale(.2)">${Art.PROPS.flower.body}</g>
   <g fill="#ff9fba"><circle cx="210" cy="236" r="5"/><circle cx="250" cy="246" r="4"/><circle cx="300" cy="232" r="5"/></g>`,
);

const PREVIEW_FOREST = previewShell(
  ['#9dc9ef', '#d6eef0'],
  ['#88c3af', '#74b49c'],
  '#5ab08d',
  `<g transform="translate(90 64) scale(.5)">${Art.PROPS.treeForest.body}</g>
   <g transform="translate(282 150) scale(.36)">${Art.PROPS.mushroomProp.body}</g>
   <g transform="translate(348 182) scale(.28)">${Art.PROPS.mushroomProp.body}</g>
   <g transform="translate(220 168) scale(.26)">${Art.PROPS.starFlower.body}</g>
   <g fill="#ffe78a"><circle cx="180" cy="118" r="4"/><circle cx="330" cy="126" r="4"/><circle cx="260" cy="96" r="3.5"/></g>`,
);

const PREVIEW_CANDY = previewShell(
  ['#ffc6e2', '#ffe8f2'],
  ['#f9b3d2', '#f19bc2'],
  '#f29bc3',
  `<g transform="translate(92 76) scale(.42)">${Art.PROPS.lollipop.body}</g>
   <g transform="translate(286 132) scale(.34)">${Art.PROPS.gumdropProp.body}</g>
   <g transform="translate(340 120) scale(.26)">${Art.PROPS.candyCane.body}</g>
   <g transform="translate(214 180) scale(.22)">${Art.PROPS.lollipop.body}</g>
   <g fill="#fff6f9" opacity=".8"><circle cx="200" cy="140" r="5"/><circle cx="250" cy="120" r="4"/><circle cx="360" cy="160" r="5"/></g>`,
);

const PREVIEW_TREASURE = previewShell(
  ['#7fd4ff', '#d7f4ff'],
  ['#8fded8', '#7fd6d0'],
  '#f4d79a',
  `<g transform="translate(92 66) scale(.42)">${PALM_TREE.body}</g>
   <g transform="translate(296 160) scale(.34)">${TREASURE_CHEST.body}</g>
   <g transform="translate(230 190) scale(.24)">${ROCK.body}</g>
   <g transform="translate(360 206) scale(.2)">${SHELL.body}</g>
   <g fill="#ffd95e"><circle cx="250" cy="232" r="4"/><circle cx="274" cy="242" r="3.5"/></g>`,
);

/* ------------------------------------------------------------------ */
/* Public art table                                                    */
/* ------------------------------------------------------------------ */

const CUSTOM_ITEMS = {
  flower: FLOWER,
  acorn: ACORN,
  mushroom: MUSHROOM,
  candy: CANDY,
  lollipop: LOLLIPOP,
  coin: COIN,
  treasure: TREASURE,
};

const SURPRISES = {
  ladybug: LADYBUG,
  firefly: FIREFLY,
  sprinkle: SPRINKLE,
  crab: CRAB,
};

const DESTINATIONS = {
  'flower-arch': FLOWER_ARCH,
  treehouse: TREEHOUSE,
  'candy-castle': CANDY_CASTLE,
  'treasure-chest': TREASURE_DEST,
};

const DECOR = {
  palmTree: PALM_TREE,
  treasureChest: TREASURE_CHEST,
  rock: ROCK,
  shell: SHELL,
};

const PREVIEWS = {
  garden: PREVIEW_GARDEN,
  forest: PREVIEW_FOREST,
  candy: PREVIEW_CANDY,
  treasure: PREVIEW_TREASURE,
};

export const WorldArt = {
  svgDoc,
  svgDataURI,
  item(key) {
    if (CUSTOM_ITEMS[key]) return svgDataURI(CUSTOM_ITEMS[key]);
    return Art.itemDataURI(key);
  },
  surprise(key) {
    return svgDataURI(SURPRISES[key] || SURPRISES.ladybug);
  },
  destination(key) {
    return svgDataURI(DESTINATIONS[key] || FLOWER_ARCH);
  },
  decor(key) {
    return svgDataURI(DECOR[key]);
  },
  preview(worldId) {
    return svgDataURI(PREVIEWS[worldId] || PREVIEW_GARDEN);
  },
  character(pet, pose = 'idle') {
    return Art.petDataURI(pet, pose);
  },
  prop(key) {
    return Art.propDataURI(key);
  },
  itemBody(key) {
    if (CUSTOM_ITEMS[key]) return CUSTOM_ITEMS[key];
    const info = Art.ITEMS?.[key];
    return info ? svgDoc(info.w, info.h, info.body, '') : FLOWER;
  },
};

export { CUSTOM_ITEMS, SURPRISES, DESTINATIONS, DECOR, PREVIEWS };