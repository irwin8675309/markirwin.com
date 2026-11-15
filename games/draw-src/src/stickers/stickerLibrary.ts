export type StickerCategory =
  | 'Animals'
  | 'Cats'
  | 'Dogs'
  | 'Unicorns'
  | 'Flowers'
  | 'Butterflies'
  | 'Stars'
  | 'Hearts'
  | 'Rainbows'
  | 'Princess'
  | 'Dinosaurs'
  | 'Space'

export interface Sticker {
  id: string
  name: string
  category: StickerCategory
  svg: string
}

const OUTLINE = '#3b3553'

function sticker(body: string, defs = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs>${defs}</defs><g stroke="${OUTLINE}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`
}

const stickers: Sticker[] = [
  {
    id: 'bunny-sticker',
    name: 'Bunny',
    category: 'Animals',
    svg: sticker(`
      <ellipse cx="60" cy="76" rx="36" ry="32" fill="#fff4f8"/>
      <circle cx="60" cy="50" r="30" fill="#fff4f8"/>
      <ellipse cx="45" cy="20" rx="10" ry="23" fill="#fff4f8" transform="rotate(-12 45 20)"/>
      <ellipse cx="75" cy="20" rx="10" ry="23" fill="#fff4f8" transform="rotate(12 75 20)"/>
      <ellipse cx="45" cy="20" rx="4" ry="15" fill="#ffc2d8" stroke="none" transform="rotate(-12 45 20)"/>
      <ellipse cx="75" cy="20" rx="4" ry="15" fill="#ffc2d8" stroke="none" transform="rotate(12 75 20)"/>
      <circle cx="48" cy="48" r="3.5" fill="${OUTLINE}" stroke="none"/>
      <circle cx="72" cy="48" r="3.5" fill="${OUTLINE}" stroke="none"/>
      <path d="M56 57 Q60 61 64 57" fill="none"/>
      <circle cx="45" cy="80" r="5" fill="#ffc2d8" stroke="none"/>
      <circle cx="75" cy="80" r="5" fill="#ffc2d8" stroke="none"/>
    `),
  },
  {
    id: 'turtle-sticker',
    name: 'Turtle',
    category: 'Animals',
    svg: sticker(`
      <ellipse cx="58" cy="65" rx="42" ry="32" fill="#8fd8a4"/>
      <path d="M28 58 Q58 30 88 58" fill="none"/>
      <path d="M38 75 Q58 56 78 75" fill="none"/>
      <circle cx="101" cy="55" r="15" fill="#b8e8a8"/>
      <circle cx="98" cy="51" r="2.5" fill="${OUTLINE}" stroke="none"/>
      <path d="M98 60 Q103 63 107 59" fill="none"/>
      <path d="M25 80 Q15 90 24 98" fill="none"/>
      <path d="M45 96 L40 108 M75 96 L80 108" fill="none"/>
    `),
  },
  {
    id: 'elephant-sticker',
    name: 'Elephant',
    category: 'Animals',
    svg: sticker(`
      <ellipse cx="60" cy="74" rx="36" ry="30" fill="#bcd0e4"/>
      <circle cx="60" cy="46" r="25" fill="#bcd0e4"/>
      <ellipse cx="33" cy="47" rx="13" ry="18" fill="#d7e4f1"/>
      <ellipse cx="87" cy="47" rx="13" ry="18" fill="#d7e4f1"/>
      <path d="M77 54 C96 63 97 86 85 95 C79 99 73 95 76 89" fill="#bcd0e4"/>
      <circle cx="52" cy="44" r="3" fill="${OUTLINE}" stroke="none"/>
      <circle cx="68" cy="44" r="3" fill="${OUTLINE}" stroke="none"/>
      <path d="M54 57 Q60 62 66 57" fill="none"/>
    `),
  },
  {
    id: 'horse-sticker',
    name: 'Horse',
    category: 'Animals',
    svg: sticker(`
      <ellipse cx="56" cy="70" rx="34" ry="24" fill="#e8b98d"/>
      <path d="M78 58 Q82 34 94 24 Q106 16 112 28 Q116 40 104 48 L96 58" fill="#e8b98d"/>
      <path d="M94 24 Q92 12 100 8 Q106 18 106 28" fill="#c98b5e"/>
      <circle cx="104" cy="33" r="2.5" fill="${OUTLINE}" stroke="none"/>
      <path d="M112 40 Q118 43 120 48" fill="none"/>
      <path d="M36 66 Q20 56 14 68 Q20 80 38 78" fill="#c98b5e"/>
      <path d="M34 90 L32 108 M54 92 L54 108 M74 88 L78 108" fill="none" stroke-width="6"/>
      <path d="M88 52 Q80 44 78 52" fill="none"/>
    `),
  },
  {
    id: 'horseshoe-sticker',
    name: 'Horseshoe',
    category: 'Animals',
    svg: sticker(`
      <path d="M28 96 Q16 40 60 18 Q104 40 92 96 L78 96 Q88 50 60 34 Q32 50 42 96 Z" fill="#ffd93d"/>
      <circle cx="28" cy="76" r="3" fill="${OUTLINE}" stroke="none"/>
      <circle cx="92" cy="76" r="3" fill="${OUTLINE}" stroke="none"/>
      <circle cx="42" cy="36" r="3" fill="${OUTLINE}" stroke="none"/>
      <circle cx="78" cy="36" r="3" fill="${OUTLINE}" stroke="none"/>
    `),
  },
  {
    id: 'cat-sticker',
    name: 'Cat',
    category: 'Cats',
    svg: sticker(`
      <path d="M25 45 L22 18 L45 33" fill="#ffd1a8"/>
      <path d="M95 45 L98 18 L75 33" fill="#ffd1a8"/>
      <ellipse cx="60" cy="64" rx="38" ry="34" fill="#ffd1a8"/>
      <circle cx="47" cy="58" r="3.5" fill="${OUTLINE}" stroke="none"/>
      <circle cx="73" cy="58" r="3.5" fill="${OUTLINE}" stroke="none"/>
      <path d="M55 69 Q60 73 65 69" fill="none"/>
      <path d="M60 73 L60 78 M60 78 Q54 84 49 79 M60 78 Q66 84 71 79" fill="none"/>
      <path d="M30 68 L10 63 M30 76 L9 80 M90 68 L110 63 M90 76 L111 80" fill="none"/>
    `),
  },
  {
    id: 'kitten-sticker',
    name: 'Kitten',
    category: 'Cats',
    svg: sticker(`
      <ellipse cx="60" cy="72" rx="40" ry="31" fill="#e7d2ff"/>
      <circle cx="60" cy="49" r="28" fill="#e7d2ff"/>
      <path d="M38 29 L32 8 L53 23" fill="#e7d2ff"/>
      <path d="M82 29 L88 8 L67 23" fill="#e7d2ff"/>
      <path d="M47 49 Q52 54 57 49 M63 49 Q68 54 73 49" fill="none"/>
      <path d="M56 59 Q60 62 64 59" fill="none"/>
      <path d="M31 62 L12 57 M31 70 L10 74 M89 62 L108 57 M89 70 L110 74" fill="none"/>
    `),
  },
  {
    id: 'paw-sticker',
    name: 'Paw',
    category: 'Cats',
    svg: sticker(`
      <path d="M60 56 C42 56 30 72 35 85 C40 98 52 98 60 92 C68 98 80 98 85 85 C90 72 78 56 60 56 Z" fill="#ffb6d5"/>
      <ellipse cx="29" cy="47" rx="11" ry="14" fill="#ffb6d5"/>
      <ellipse cx="48" cy="32" rx="10" ry="13" fill="#ffb6d5"/>
      <ellipse cx="72" cy="32" rx="10" ry="13" fill="#ffb6d5"/>
      <ellipse cx="91" cy="47" rx="11" ry="14" fill="#ffb6d5"/>
    `),
  },
  {
    id: 'puppy-sticker',
    name: 'Puppy',
    category: 'Dogs',
    svg: sticker(`
      <ellipse cx="60" cy="72" rx="34" ry="31" fill="#f0c99e"/>
      <circle cx="60" cy="47" r="27" fill="#f0c99e"/>
      <ellipse cx="33" cy="49" rx="12" ry="24" fill="#d8a873" transform="rotate(14 33 49)"/>
      <ellipse cx="87" cy="49" rx="12" ry="24" fill="#d8a873" transform="rotate(-14 87 49)"/>
      <circle cx="51" cy="45" r="3" fill="${OUTLINE}" stroke="none"/>
      <circle cx="69" cy="45" r="3" fill="${OUTLINE}" stroke="none"/>
      <ellipse cx="60" cy="56" rx="8" ry="6" fill="${OUTLINE}" stroke="none"/>
      <path d="M60 62 L60 68 M60 68 Q55 73 51 69 M60 68 Q65 73 69 69" fill="none"/>
    `),
  },
  {
    id: 'bone-sticker',
    name: 'Bone',
    category: 'Dogs',
    svg: sticker(`
      <path d="M31 42 C20 28 6 40 16 52 C6 64 20 76 31 62 L89 62 C100 76 114 64 104 52 C114 40 100 28 89 42 Z" fill="#fff4dc"/>
      <path d="M38 52 L82 52" fill="none"/>
    `),
  },
  {
    id: 'doghouse-sticker',
    name: 'Dog House',
    category: 'Dogs',
    svg: sticker(`
      <path d="M20 58 L60 24 L100 58 L100 102 L20 102 Z" fill="#ffb28a"/>
      <path d="M37 102 L37 72 Q60 55 83 72 L83 102" fill="#ffe2c9"/>
      <circle cx="60" cy="80" r="9" fill="#f0c99e"/>
      <circle cx="56" cy="78" r="1.8" fill="${OUTLINE}" stroke="none"/>
      <circle cx="64" cy="78" r="1.8" fill="${OUTLINE}" stroke="none"/>
      <path d="M56 84 Q60 87 64 84" fill="none"/>
    `),
  },
  {
    id: 'unicorn-sticker',
    name: 'Unicorn',
    category: 'Unicorns',
    svg: sticker(`
      <path d="M34 108 Q28 72 44 50 Q56 32 78 36 Q98 40 98 60 Q98 82 78 90 Q68 94 66 108" fill="#fff4ff"/>
      <path d="M78 36 L86 6 L98 42" fill="#ffd36e"/>
      <path d="M78 36 L70 20" fill="none"/>
      <circle cx="69" cy="57" r="3" fill="${OUTLINE}" stroke="none"/>
      <circle cx="86" cy="55" r="3" fill="${OUTLINE}" stroke="none"/>
      <path d="M72 70 Q79 75 86 69" fill="none"/>
      <path d="M40 52 Q28 42 22 52 Q18 62 32 64" fill="#ffc6e4"/>
      <path d="M45 68 Q58 76 70 68" fill="none"/>
    `),
  },
  {
    id: 'rainbow-sticker',
    name: 'Rainbow',
    category: 'Unicorns',
    svg: sticker(`
      <path d="M15 92 Q15 24 60 24 Q105 24 105 92" fill="none" stroke="#ef4b5f" stroke-width="12"/>
      <path d="M27 92 Q27 38 60 38 Q93 38 93 92" fill="none" stroke="#ffd93d" stroke-width="11"/>
      <path d="M39 92 Q39 52 60 52 Q81 52 81 92" fill="none" stroke="#5ec96d" stroke-width="10"/>
      <path d="M50 92 Q50 66 60 66 Q70 66 70 92" fill="none" stroke="#4aa8ff" stroke-width="9"/>
      <path d="M18 96 Q32 84 45 96 Q32 108 18 96" fill="#ffffff"/>
      <path d="M75 96 Q89 84 102 96 Q89 108 75 96" fill="#ffffff"/>
    `),
  },
  {
    id: 'cloud-sticker',
    name: 'Cloud',
    category: 'Unicorns',
    svg: sticker(`
      <path d="M28 82 Q12 82 12 68 Q12 54 28 54 Q32 36 50 36 Q66 36 70 50 Q88 46 94 60 Q106 64 102 78 Q98 88 84 88 L32 88 Q24 88 28 82" fill="#e8f6ff"/>
      <path d="M42 63 Q48 68 54 63 M66 63 Q72 68 78 63" fill="none"/>
      <path d="M48 74 Q60 82 72 74" fill="none"/>
    `),
  },
  {
    id: 'flower-sticker',
    name: 'Flower',
    category: 'Flowers',
    svg: sticker(`
      <circle cx="60" cy="48" r="16" fill="#ffd93d"/>
      <ellipse cx="60" cy="19" rx="13" ry="18" fill="#ff8fc7"/>
      <ellipse cx="60" cy="77" rx="13" ry="18" fill="#ff8fc7"/>
      <ellipse cx="31" cy="48" rx="18" ry="13" fill="#ff8fc7"/>
      <ellipse cx="89" cy="48" rx="18" ry="13" fill="#ff8fc7"/>
      <ellipse cx="39" cy="27" rx="13" ry="17" fill="#ffb6d5" transform="rotate(-45 39 27)"/>
      <ellipse cx="81" cy="27" rx="13" ry="17" fill="#ffb6d5" transform="rotate(45 81 27)"/>
      <ellipse cx="39" cy="69" rx="13" ry="17" fill="#ffb6d5" transform="rotate(45 39 69)"/>
      <ellipse cx="81" cy="69" rx="13" ry="17" fill="#ffb6d5" transform="rotate(-45 81 69)"/>
      <circle cx="55" cy="45" r="2.5" fill="${OUTLINE}" stroke="none"/>
      <circle cx="65" cy="45" r="2.5" fill="${OUTLINE}" stroke="none"/>
      <path d="M55 53 Q60 57 65 53" fill="none"/>
    `),
  },
  {
    id: 'tulip-sticker',
    name: 'Tulip',
    category: 'Flowers',
    svg: sticker(`
      <path d="M60 62 L60 108" fill="none"/>
      <path d="M60 84 Q36 70 30 84 Q42 98 60 92" fill="#7ed69a"/>
      <path d="M60 90 Q84 76 90 90 Q78 104 60 98" fill="#7ed69a"/>
      <path d="M38 30 Q38 12 50 22 Q60 8 70 22 Q82 12 82 30 Q82 62 60 66 Q38 62 38 30" fill="#ff8fc7"/>
    `),
  },
  {
    id: 'sunflower-sticker',
    name: 'Sunflower',
    category: 'Flowers',
    svg: sticker(`
      <path d="M60 64 L60 110" fill="none"/>
      <path d="M60 92 Q32 78 26 94 Q40 108 60 102" fill="#5ec96d"/>
      <circle cx="60" cy="48" r="18" fill="#b97a45"/>
      <ellipse cx="60" cy="17" rx="10" ry="15" fill="#ffd93d"/>
      <ellipse cx="60" cy="79" rx="10" ry="15" fill="#ffd93d"/>
      <ellipse cx="29" cy="48" rx="15" ry="10" fill="#ffd93d"/>
      <ellipse cx="91" cy="48" rx="15" ry="10" fill="#ffd93d"/>
      <ellipse cx="38" cy="27" rx="10" ry="14" fill="#ffd93d" transform="rotate(-45 38 27)"/>
      <ellipse cx="82" cy="27" rx="10" ry="14" fill="#ffd93d" transform="rotate(45 82 27)"/>
      <ellipse cx="38" cy="69" rx="10" ry="14" fill="#ffd93d" transform="rotate(45 38 69)"/>
      <ellipse cx="82" cy="69" rx="10" ry="14" fill="#ffd93d" transform="rotate(-45 82 69)"/>
    `),
  },
  {
    id: 'butterfly-sticker',
    name: 'Butterfly',
    category: 'Butterflies',
    svg: sticker(`
      <path d="M58 50 Q30 12 12 34 Q-2 54 22 70 Q38 82 56 68" fill="#c6a7ff"/>
      <path d="M62 50 Q90 12 108 34 Q122 54 98 70 Q82 82 64 68" fill="#c6a7ff"/>
      <path d="M58 70 Q36 82 32 102 Q30 116 48 110 Q58 104 60 86" fill="#ff8fc7"/>
      <path d="M62 70 Q84 82 88 102 Q90 116 72 110 Q62 104 60 86" fill="#ff8fc7"/>
      <ellipse cx="60" cy="62" rx="6" ry="38" fill="#5b4a7a"/>
      <path d="M56 30 Q44 16 34 18 M64 30 Q76 16 86 18" fill="none"/>
      <circle cx="30" cy="45" r="6" fill="#ffd93d" stroke="none"/>
      <circle cx="90" cy="45" r="6" fill="#ffd93d" stroke="none"/>
    `),
  },
  {
    id: 'ladybug-sticker',
    name: 'Ladybug',
    category: 'Butterflies',
    svg: sticker(`
      <ellipse cx="60" cy="66" rx="36" ry="42" fill="#ef4b5f"/>
      <path d="M60 26 L60 104" fill="none"/>
      <circle cx="44" cy="52" r="7" fill="${OUTLINE}" stroke="none"/>
      <circle cx="76" cy="52" r="7" fill="${OUTLINE}" stroke="none"/>
      <circle cx="42" cy="78" r="7" fill="${OUTLINE}" stroke="none"/>
      <circle cx="78" cy="78" r="7" fill="${OUTLINE}" stroke="none"/>
      <path d="M60 26 Q44 12 36 22 M60 26 Q76 12 84 22" fill="none"/>
      <circle cx="60" cy="24" r="10" fill="${OUTLINE}"/>
    `),
  },
  {
    id: 'caterpillar-sticker',
    name: 'Caterpillar',
    category: 'Butterflies',
    svg: sticker(`
      <circle cx="24" cy="78" r="17" fill="#8fd8a4"/>
      <circle cx="46" cy="68" r="18" fill="#b7e8a8"/>
      <circle cx="69" cy="65" r="19" fill="#ffd93d"/>
      <circle cx="92" cy="70" r="18" fill="#ffb28a"/>
      <circle cx="33" cy="74" r="2.5" fill="${OUTLINE}" stroke="none"/>
      <circle cx="47" cy="64" r="2.5" fill="${OUTLINE}" stroke="none"/>
      <circle cx="70" cy="61" r="2.5" fill="${OUTLINE}" stroke="none"/>
      <path d="M92 65 Q99 69 103 64" fill="none"/>
      <path d="M23 62 L18 50 M46 52 L43 39 M70 47 L70 34 M94 53 L99 41" fill="none"/>
      <path d="M16 92 L12 100 M40 92 L38 102 M64 92 L64 102 M86 92 L89 102" fill="none"/>
    `),
  },
  {
    id: 'star-sticker',
    name: 'Star',
    category: 'Stars',
    svg: sticker(`
      <path d="M60 10 L73 42 L108 45 L81 67 L90 102 L60 82 L30 102 L39 67 L12 45 L47 42 Z" fill="#ffd93d"/>
      <circle cx="48" cy="55" r="3" fill="${OUTLINE}" stroke="none"/>
      <circle cx="72" cy="55" r="3" fill="${OUTLINE}" stroke="none"/>
      <path d="M52 66 Q60 73 68 66" fill="none"/>
    `),
  },
  {
    id: 'moon-sticker',
    name: 'Moon',
    category: 'Stars',
    svg: sticker(`
      <path d="M76 12 Q42 28 42 60 Q42 92 76 108 Q38 118 18 82 Q-2 42 32 18 Q52 4 76 12" fill="#fff2a8"/>
      <circle cx="58" cy="58" r="3" fill="${OUTLINE}" stroke="none"/>
      <path d="M58 68 Q64 74 70 68" fill="none"/>
      <path d="M88 28 L96 20 M94 40 L106 38 M86 52 L98 56" fill="none"/>
    `),
  },
  {
    id: 'sparkle-sticker',
    name: 'Sparkle',
    category: 'Stars',
    svg: sticker(`
      <path d="M60 10 Q66 44 92 52 Q66 60 60 94 Q54 60 28 52 Q54 44 60 10" fill="#c6a7ff"/>
      <path d="M94 78 Q97 92 108 95 Q97 98 94 110 Q91 98 80 95 Q91 92 94 78" fill="#ffd93d"/>
      <path d="M24 20 Q26 30 36 32 Q26 34 24 44 Q22 34 12 32 Q22 30 24 20" fill="#ff8fc7"/>
    `),
  },
  {
    id: 'heart-sticker',
    name: 'Heart',
    category: 'Hearts',
    svg: sticker(`
      <path d="M60 104 C20 74 8 48 26 30 C40 16 56 24 60 38 C64 24 80 16 94 30 C112 48 100 74 60 104 Z" fill="#ef4b5f"/>
      <path d="M38 42 Q44 34 52 36" fill="none" stroke="#ffffff" stroke-width="5"/>
    `),
  },
  {
    id: 'double-heart-sticker',
    name: 'Two Hearts',
    category: 'Hearts',
    svg: sticker(`
      <path d="M42 96 C18 76 12 58 24 46 C34 36 44 42 46 50 C48 42 58 36 68 46 C80 58 74 76 50 96 Z" fill="#ff8fc7"/>
      <path d="M78 108 C60 92 56 78 65 69 C72 62 80 66 82 72 C84 66 92 62 99 69 C108 78 104 92 86 108 Z" fill="#c6a7ff"/>
    `),
  },
  {
    id: 'heart-balloon-sticker',
    name: 'Heart Balloon',
    category: 'Hearts',
    svg: sticker(`
      <path d="M60 86 C26 60 18 42 32 28 C44 16 56 24 60 34 C64 24 76 16 88 28 C102 42 94 60 60 86 Z" fill="#ff8fc7"/>
      <path d="M60 86 Q52 100 62 112" fill="none"/>
      <path d="M42 40 Q48 32 54 36" fill="none" stroke="#ffffff" stroke-width="4"/>
    `),
  },
  {
    id: 'rainbow-cloud-sticker',
    name: 'Rainbow Cloud',
    category: 'Rainbows',
    svg: sticker(`
      <path d="M16 84 Q16 52 48 52 Q52 30 74 32 Q92 34 94 52 Q110 52 110 70 Q110 84 96 84 Z" fill="#ffffff"/>
      <path d="M28 92 Q28 70 48 70 Q52 54 70 56 Q84 58 84 72 Q96 72 96 84 Q96 94 84 94" fill="none" stroke="#ef4b5f" stroke-width="6"/>
      <path d="M38 94 Q38 78 54 78 Q58 66 72 68 Q82 70 82 80 Q90 80 90 88 Q90 95 82 95" fill="none" stroke="#ffd93d" stroke-width="5"/>
      <path d="M46 94 Q46 84 58 84 Q62 76 72 78 Q78 80 78 86 Q84 86 84 91" fill="none" stroke="#5ec96d" stroke-width="4"/>
    `),
  },
  {
    id: 'sun-sticker',
    name: 'Sun',
    category: 'Rainbows',
    svg: sticker(`
      <circle cx="60" cy="60" r="29" fill="#ffd93d"/>
      <path d="M60 12 L60 24 M60 96 L60 108 M12 60 L24 60 M96 60 L108 60 M26 26 L35 35 M85 85 L94 94 M94 26 L85 35 M35 85 L26 94" fill="none"/>
      <circle cx="50" cy="56" r="3" fill="${OUTLINE}" stroke="none"/>
      <circle cx="70" cy="56" r="3" fill="${OUTLINE}" stroke="none"/>
      <path d="M51 68 Q60 76 69 68" fill="none"/>
    `),
  },
  {
    id: 'crown-sticker',
    name: 'Crown',
    category: 'Princess',
    svg: sticker(`
      <path d="M18 88 L12 34 L38 54 L60 18 L82 54 L108 34 L102 88 Z" fill="#ffd93d"/>
      <path d="M18 88 Q60 108 102 88" fill="#ffe98a"/>
      <circle cx="12" cy="28" r="6" fill="#ff8fc7"/>
      <circle cx="60" cy="12" r="6" fill="#ff8fc7"/>
      <circle cx="108" cy="28" r="6" fill="#ff8fc7"/>
      <circle cx="60" cy="66" r="8" fill="#4aa8ff"/>
    `),
  },
  {
    id: 'wand-sticker',
    name: 'Magic Wand',
    category: 'Princess',
    svg: sticker(`
      <path d="M22 102 L74 50" fill="none" stroke="#a879f2" stroke-width="9"/>
      <path d="M82 12 L88 34 L110 40 L88 46 L82 68 L76 46 L54 40 L76 34 Z" fill="#ffd93d"/>
      <path d="M38 26 L42 34 L50 38 L42 42 L38 50 L34 42 L26 38 L34 34 Z" fill="#ff8fc7"/>
      <circle cx="20" cy="52" r="3" fill="#4aa8ff" stroke="none"/>
      <circle cx="102" cy="82" r="3" fill="#5ec96d" stroke="none"/>
    `),
  },
  {
    id: 'castle-sticker',
    name: 'Castle',
    category: 'Princess',
    svg: sticker(`
      <path d="M18 102 L18 48 L34 48 L34 34 L48 34 L48 48 L72 48 L72 34 L86 34 L86 48 L102 48 L102 102 Z" fill="#ffb6d5"/>
      <path d="M46 102 L46 80 Q60 66 74 80 L74 102" fill="#fff4f8"/>
      <path d="M18 48 L26 32 L34 48 M72 48 L80 32 L88 48" fill="#c6a7ff"/>
      <circle cx="60" cy="38" r="6" fill="#ffd93d"/>
    `),
  },
  {
    id: 'dino-sticker',
    name: 'Dinosaur',
    category: 'Dinosaurs',
    svg: sticker(`
      <path d="M20 82 Q20 52 46 46 Q72 40 90 58 Q102 70 94 84 L28 84 Q18 84 20 82" fill="#8fd8a4"/>
      <path d="M40 46 L34 28 L52 40 M58 40 L58 18 L72 36 M76 46 L88 26 L90 50" fill="#b7e8a8"/>
      <path d="M20 72 Q8 66 6 76 Q8 86 20 84" fill="#8fd8a4"/>
      <circle cx="88" cy="64" r="2.5" fill="${OUTLINE}" stroke="none"/>
      <path d="M88 72 Q94 75 99 70" fill="none"/>
      <path d="M36 84 L34 104 M78 84 L80 104" fill="none"/>
    `),
  },
  {
    id: 'trex-sticker',
    name: 'T-Rex',
    category: 'Dinosaurs',
    svg: sticker(`
      <path d="M30 92 Q24 58 48 42 Q68 28 88 42 Q104 54 98 72 Q94 84 80 86 L76 104 L58 104 L60 88 Q44 90 40 104 L24 104 Q28 94 30 92" fill="#b7e8a8"/>
      <path d="M48 42 Q40 24 54 12 Q70 2 84 18 Q94 30 86 42" fill="#b7e8a8"/>
      <circle cx="76" cy="28" r="2.5" fill="${OUTLINE}" stroke="none"/>
      <path d="M82 36 Q90 34 95 39" fill="none"/>
      <path d="M46 60 Q62 68 78 60" fill="none"/>
    `),
  },
  {
    id: 'dino-egg-sticker',
    name: 'Dino Egg',
    category: 'Dinosaurs',
    svg: sticker(`
      <path d="M60 14 Q88 14 98 60 Q106 104 60 108 Q14 104 22 60 Q32 14 60 14" fill="#fff4dc"/>
      <path d="M30 52 Q44 42 58 52 Q72 42 88 52" fill="none"/>
      <circle cx="45" cy="40" r="9" fill="#b7e8a8"/>
      <circle cx="74" cy="34" r="6" fill="#ff8fc7"/>
      <circle cx="78" cy="82" r="8" fill="#4aa8ff"/>
      <path d="M46 68 Q60 76 74 68" fill="none"/>
    `),
  },
  {
    id: 'rocket-sticker',
    name: 'Rocket',
    category: 'Space',
    svg: sticker(`
      <path d="M60 8 Q82 30 82 64 L38 64 Q38 30 60 8" fill="#e8f6ff"/>
      <circle cx="60" cy="42" r="10" fill="#4aa8ff"/>
      <path d="M38 64 L26 86 L44 80" fill="#ef4b5f"/>
      <path d="M82 64 L94 86 L76 80" fill="#ef4b5f"/>
      <path d="M48 64 L48 94 Q60 104 72 94 L72 64" fill="#ffd93d"/>
      <path d="M54 76 Q60 70 66 76 Q70 84 60 90 Q50 84 54 76" fill="#ff8a3d"/>
      <circle cx="24" cy="28" r="3" fill="#ffd93d" stroke="none"/>
      <circle cx="100" cy="50" r="3" fill="#ff8fc7" stroke="none"/>
    `),
  },
  {
    id: 'planet-sticker',
    name: 'Planet',
    category: 'Space',
    svg: sticker(`
      <circle cx="60" cy="60" r="34" fill="#c6a7ff"/>
      <ellipse cx="60" cy="60" rx="54" ry="14" fill="none" stroke="#ffd93d" stroke-width="5" transform="rotate(-18 60 60)"/>
      <circle cx="48" cy="48" r="7" fill="#a879f2" stroke="none"/>
      <circle cx="72" cy="70" r="5" fill="#a879f2" stroke="none"/>
      <circle cx="92" cy="26" r="3" fill="#ffd93d" stroke="none"/>
      <circle cx="20" cy="94" r="3" fill="#ff8fc7" stroke="none"/>
    `),
  },
  {
    id: 'astronaut-sticker',
    name: 'Astronaut',
    category: 'Space',
    svg: sticker(`
      <circle cx="60" cy="34" r="26" fill="#ffffff"/>
      <circle cx="60" cy="34" r="17" fill="#b9e4ff"/>
      <path d="M38 62 Q60 52 82 62 L86 96 Q60 108 34 96 Z" fill="#ffffff"/>
      <path d="M48 72 L72 72 M48 82 L72 82" fill="none"/>
      <circle cx="60" cy="66" r="5" fill="#ef4b5f" stroke="none"/>
      <path d="M36 74 Q20 80 18 94 M84 74 Q100 80 102 94" fill="none"/>
      <path d="M40 100 L36 112 M80 100 L84 112" fill="none"/>
    `),
  },
]

export const STICKERS = stickers

export const STICKER_CATEGORIES: StickerCategory[] = [
  'Animals',
  'Cats',
  'Dogs',
  'Unicorns',
  'Flowers',
  'Butterflies',
  'Stars',
  'Hearts',
  'Rainbows',
  'Princess',
  'Dinosaurs',
  'Space',
]

const stickerMap = new Map(stickers.map((item) => [item.id, item]))

export function getSticker(id: string): Sticker | undefined {
  return stickerMap.get(id)
}

export function stickersByCategory(category: StickerCategory): Sticker[] {
  return stickers.filter((item) => item.category === category)
}

export function stickerDataUrl(sticker: Sticker): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sticker.svg)}`
}

export interface DecorativeBackground {
  id: string
  name: string
  css: string
  svg: string
}

const backgrounds: DecorativeBackground[] = [
  {
    id: 'clouds',
    name: 'Clouds',
    css: 'linear-gradient(180deg, #dff4ff 0%, #f7fcff 100%)',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><g fill="#ffffff" opacity=".9"><ellipse cx="130" cy="110" rx="80" ry="42"/><ellipse cx="190" cy="100" rx="58" ry="34"/><ellipse cx="650" cy="160" rx="90" ry="46"/><ellipse cx="710" cy="145" rx="58" ry="32"/></g></svg>`,
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    css: 'linear-gradient(180deg, #eaf7ff 0%, #fff5fa 100%)',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><g fill="none" stroke-width="18" opacity=".45"><path d="M60 460 Q60 160 400 160 Q740 160 740 460" stroke="#ff8fa3"/><path d="M110 460 Q110 210 400 210 Q690 210 690 460" stroke="#ffd93d"/><path d="M160 460 Q160 260 400 260 Q640 260 640 460" stroke="#8fd8a4"/><path d="M210 460 Q210 310 400 310 Q590 310 590 460" stroke="#8ec9ff"/></g></svg>`,
  },
  {
    id: 'garden',
    name: 'Garden',
    css: 'linear-gradient(180deg, #e7fbef 0%, #f8fff5 100%)',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><g stroke="#4a9a63" stroke-width="8" fill="none"><path d="M60 560 Q40 430 80 330 M740 560 Q760 430 720 330"/></g><g fill="#ff8fc7"><circle cx="80" cy="320" r="26"/><circle cx="52" cy="350" r="18"/><circle cx="108" cy="350" r="18"/></g><g fill="#ffd93d"><circle cx="720" cy="320" r="26"/><circle cx="692" cy="350" r="18"/><circle cx="748" cy="350" r="18"/></g></svg>`,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    css: 'linear-gradient(180deg, #bfe9ff 0%, #7bc8f0 100%)',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><g fill="#ffffff" opacity=".5"><circle cx="120" cy="130" r="16"/><circle cx="180" cy="90" r="10"/><circle cx="660" cy="150" r="20"/><circle cx="710" cy="110" r="12"/></g><path d="M0 470 Q100 430 200 470 Q300 510 400 470 Q500 430 600 470 Q700 510 800 470 L800 600 L0 600 Z" fill="#4aa8c8" opacity=".5"/></svg>`,
  },
  {
    id: 'space',
    name: 'Space',
    css: 'linear-gradient(180deg, #24224a 0%, #4a3a78 100%)',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><g fill="#fff2a8"><circle cx="90" cy="90" r="5"/><circle cx="220" cy="160" r="4"/><circle cx="650" cy="100" r="6"/><circle cx="720" cy="250" r="4"/><circle cx="560" cy="500" r="5"/><circle cx="140" cy="470" r="4"/><circle cx="400" cy="70" r="3"/></g><circle cx="680" cy="440" r="50" fill="#c6a7ff" opacity=".8"/><ellipse cx="680" cy="440" rx="80" ry="15" fill="none" stroke="#ffd93d" stroke-width="6" opacity=".8" transform="rotate(-18 680 440)"/></svg>`,
  },
  {
    id: 'castle',
    name: 'Castle',
    css: 'linear-gradient(180deg, #ffe8f2 0%, #f8f2ff 100%)',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><g fill="#ffb6d5" opacity=".7"><path d="M250 500 L250 300 L290 300 L290 260 L330 260 L330 300 L470 300 L470 260 L510 260 L510 300 L550 300 L550 500 Z"/></g><g fill="#c6a7ff" opacity=".7"><path d="M250 300 L270 260 L290 300 M470 300 L490 260 L510 300"/></g></svg>`,
  },
]

export const DECORATIVE_BACKGROUNDS = backgrounds

export function getBackground(id: string | undefined): DecorativeBackground | undefined {
  return backgrounds.find((item) => item.id === id)
}

export function backgroundDataUrl(background: DecorativeBackground): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(background.svg)}`
}