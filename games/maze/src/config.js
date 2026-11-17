/**
 * Maze Adventures — game content and tuning.
 *
 * The three characters, their names, markings and personalities come from the
 * family's real pets. The vector artwork for them lives in ./art.js and is
 * shared with the "Pets Game" project so the characters stay consistent.
 */

export const CHARACTERS = {
  ghosty: {
    id: 'ghosty',
    name: 'Ghosty',
    species: 'cat',
    kind: 'The Gentle Cat',
    personality: 'Loving · Peaceful · Gentle',
    description:
      'A soft, fluffy white cat with big blue-gray eyes and a little pink nose.',
    message: "Let's explore together!",
    accent: '#9fc7e8',
    accentDark: '#6d9cc4',
    soft: '#eff7ff',
    glow: 'rgba(159, 199, 232, .65)',
    float: true,
  },
  spin: {
    id: 'spin',
    name: 'Spin',
    species: 'cat',
    kind: 'The Playful Cat',
    personality: 'Energetic · Curious · Mischievous',
    description:
      'A black-and-white tuxedo cat with a black cap and mask, white chest and bright hazel eyes.',
    message: 'Ready for an adventure?',
    accent: '#8d8fb8',
    accentDark: '#5e6190',
    soft: '#f1f0fb',
    glow: 'rgba(141, 143, 184, .65)',
    float: false,
  },
  oakley: {
    id: 'oakley',
    name: 'Oakley',
    species: 'dog',
    kind: 'The Brave Dog',
    personality: 'Loyal · Cheerful · Brave',
    description:
      'A friendly solid-black senior dog with floppy ears, gray-white muzzle whiskers and warm amber eyes.',
    message: 'Let’s find some treasure!',
    accent: '#e7a86b',
    accentDark: '#bf7f45',
    soft: '#fff4e8',
    glow: 'rgba(231, 168, 107, .65)',
    float: false,
  },
};

export const CHARACTER_ORDER = ['ghosty', 'spin', 'oakley'];

/* ------------------------------------------------------------------ */
/* Collectibles                                                        */
/* ------------------------------------------------------------------ */

export const COLLECTIBLES = {
  star: { id: 'star', name: 'Star', art: 'item:star', tint: '#ffd84d' },
  heart: { id: 'heart', name: 'Heart', art: 'item:heart', tint: '#ff7fa5' },
  butterfly: { id: 'butterfly', name: 'Butterfly', art: 'item:butterfly', tint: '#a98bf2' },
  sparkle: { id: 'sparkle', name: 'Sparkle', art: 'item:sparkle', tint: '#ffe27a' },
  gem: { id: 'gem', name: 'Gem', art: 'item:gem', tint: '#67c8ff' },
  treat: { id: 'treat', name: 'Treat', art: 'item:treat', tint: '#ffd84d' },
  flower: { id: 'flower', name: 'Flower', art: 'world:flower', tint: '#ff8fb5' },
  acorn: { id: 'acorn', name: 'Acorn', art: 'world:acorn', tint: '#c98a52' },
  mushroom: { id: 'mushroom', name: 'Mushroom', art: 'world:mushroom', tint: '#b98bf0' },
  candy: { id: 'candy', name: 'Candy', art: 'world:candy', tint: '#ff8fb5' },
  lollipop: { id: 'lollipop', name: 'Lollipop', art: 'world:lollipop', tint: '#ff7d9f' },
  coin: { id: 'coin', name: 'Coin', art: 'world:coin', tint: '#ffd04d' },
  treasure: { id: 'treasure', name: 'Treasure', art: 'world:treasure', tint: '#ffcf5c' },
};

/* ------------------------------------------------------------------ */
/* Worlds                                                              */
/* ------------------------------------------------------------------ */

export const WORLDS = {
  garden: {
    id: 'garden',
    name: 'The Garden',
    short: 'Garden',
    subtitle: 'Flowers, butterflies & warm sunshine',
    accent: '#56c46a',
    accentDark: '#2f8f46',
    soft: '#ecfce8',
    sky: ['#8bdcff', '#dcf7ff'],
    hill: '#a7e39a',
    hillBack: '#c4f0b8',
    ground: '#74d37f',
    board: {
      floor: ['#e4f8c9', '#c9efab'],
      floorAlt: '#d6f4b6',
      wall: '#4fae5d',
      wallEdge: '#2f7f43',
      wallHi: '#93e094',
      pattern: 'grass',
      outside: '#8fe08b',
    },
    collectibles: ['flower', 'butterfly', 'star'],
    surprise: 'ladybug',
    destination: 'flower-arch',
    previewProps: ['treeMeadow', 'flower', 'bush'],
  },
  forest: {
    id: 'forest',
    name: 'Enchanted Forest',
    short: 'Forest',
    subtitle: 'Glowing mushrooms & friendly woodland',
    accent: '#4aa89a',
    accentDark: '#2b7a70',
    soft: '#e9fbf6',
    sky: ['#9dc9ef', '#d6eef0'],
    hill: '#7fc0ad',
    hillBack: '#9fd8c6',
    ground: '#5ab08d',
    board: {
      floor: ['#e3f7d6', '#c4ecc0'],
      floorAlt: '#d5f1cf',
      wall: '#4f8f73',
      wallEdge: '#2f6650',
      wallHi: '#8fd3a8',
      pattern: 'moss',
      outside: '#7cc9a3',
    },
    collectibles: ['acorn', 'mushroom', 'star'],
    surprise: 'firefly',
    destination: 'treehouse',
    previewProps: ['treeForest', 'mushroomProp', 'starFlower'],
  },
  candy: {
    id: 'candy',
    name: 'Candy Land',
    short: 'Candy',
    subtitle: 'Lollipops, gumdrops & sweet surprises',
    accent: '#f273a6',
    accentDark: '#c94e82',
    soft: '#fff0f7',
    sky: ['#ffc6e2', '#ffe8f2'],
    hill: '#f9b3d2',
    hillBack: '#ffd0e4',
    ground: '#f29bc3',
    board: {
      floor: ['#fff4f8', '#ffe3ef'],
      floorAlt: '#ffedf5',
      wall: '#f584b0',
      wallEdge: '#c94e82',
      wallHi: '#ffc2da',
      pattern: 'candy',
      outside: '#ffb7d5',
    },
    collectibles: ['candy', 'lollipop', 'star'],
    surprise: 'sprinkle',
    destination: 'candy-castle',
    previewProps: ['lollipop', 'gumdropProp', 'candyCane'],
  },
  treasure: {
    id: 'treasure',
    name: 'Treasure Island',
    short: 'Treasure',
    subtitle: 'Palm trees, coins & hidden treasure',
    accent: '#f0a93c',
    accentDark: '#bb7417',
    soft: '#fff8e7',
    sky: ['#7fd4ff', '#d7f4ff'],
    hill: '#7fd6d0',
    hillBack: '#a5e6e0',
    ground: '#f4d79a',
    board: {
      floor: ['#fbe9be', '#f6d998'],
      floorAlt: '#f9e2ae',
      wall: '#c98a45',
      wallEdge: '#8f5a22',
      wallHi: '#f0bd74',
      pattern: 'sand',
      outside: '#f7dd9f',
    },
    collectibles: ['coin', 'gem', 'treasure'],
    surprise: 'crab',
    destination: 'treasure-chest',
    previewProps: ['palmTree', 'treasureChest', 'bush'],
  },
};

export const WORLD_ORDER = ['garden', 'forest', 'candy', 'treasure'];

/* ------------------------------------------------------------------ */
/* Difficulties                                                        */
/* ------------------------------------------------------------------ */

export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    name: 'Little Explorer',
    short: 'Little',
    tag: 'Ages 2–3',
    description: 'A cozy 6×6 maze with wide, gentle paths.',
    grid: 6,
    items: 6,
    braid: 0.92,
    routeBias: 0.52,
    speed: 2.3,
    hintGlow: true,
    accent: '#5ec46f',
  },
  medium: {
    id: 'medium',
    name: 'Adventure Explorer',
    short: 'Adventure',
    tag: 'Ages 4–5',
    description: 'A 10×10 maze with more turns and side paths.',
    grid: 10,
    items: 9,
    braid: 0.32,
    routeBias: 0.76,
    speed: 2.9,
    hintGlow: false,
    accent: '#4aa8e8',
  },
  hard: {
    id: 'hard',
    name: 'Super Explorer',
    short: 'Super',
    tag: 'Ages 5+',
    description: 'A 15×15 maze with winding paths and dead ends.',
    grid: 15,
    items: 12,
    braid: 0.0,
    routeBias: 1.0,
    speed: 3.4,
    hintGlow: false,
    accent: '#a97cf0',
  },
};

export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

export const SPEED_SETTINGS = {
  chill: { id: 'chill', name: 'Chill', multiplier: 0.78 },
  normal: { id: 'normal', name: 'Normal', multiplier: 1.0 },
  zippy: { id: 'zippy', name: 'Zippy', multiplier: 1.28 },
};

/* ------------------------------------------------------------------ */
/* Stickers                                                            */
/* ------------------------------------------------------------------ */

export const STICKERS = [
  { id: 'sticker-ghosty', name: 'Ghosty', art: 'char:ghosty:celebrate', world: 'garden' },
  { id: 'sticker-spin', name: 'Spin', art: 'char:spin:celebrate', world: 'garden' },
  { id: 'sticker-oakley', name: 'Oakley', art: 'char:oakley:celebrate', world: 'garden' },
  { id: 'sticker-flower', name: 'Flower', art: 'world:flower', world: 'garden' },
  { id: 'sticker-butterfly', name: 'Butterfly', art: 'item:butterfly', world: 'garden' },
  { id: 'sticker-star', name: 'Star', art: 'item:star', world: 'garden' },
  { id: 'sticker-acorn', name: 'Acorn', art: 'world:acorn', world: 'forest' },
  { id: 'sticker-mushroom', name: 'Mushroom', art: 'world:mushroom', world: 'forest' },
  { id: 'sticker-sparkle', name: 'Magic Sparkle', art: 'item:sparkle', world: 'forest' },
  { id: 'sticker-candy', name: 'Candy', art: 'world:candy', world: 'candy' },
  { id: 'sticker-lollipop', name: 'Lollipop', art: 'world:lollipop', world: 'candy' },
  { id: 'sticker-heart', name: 'Sweet Heart', art: 'item:heart', world: 'candy' },
  { id: 'sticker-coin', name: 'Gold Coin', art: 'world:coin', world: 'treasure' },
  { id: 'sticker-gem', name: 'Gem', art: 'item:gem', world: 'treasure' },
  { id: 'sticker-treasure', name: 'Treasure', art: 'world:treasure', world: 'treasure' },
  { id: 'sticker-treat', name: 'Golden Treat', art: 'item:treat', world: 'treasure' },
];

export const STICKER_BY_ID = Object.fromEntries(STICKERS.map((s) => [s.id, s]));

/* ------------------------------------------------------------------ */
/* Save data                                                           */
/* ------------------------------------------------------------------ */

export const STORAGE_KEY = 'maze-adventures-progress-v1';

export const DEFAULT_PROGRESS = {
  version: 1,
  selectedCharacter: 'ghosty',
  difficulty: 'easy',
  world: 'garden',
  findFriend: false,
  settings: {
    sound: true,
    music: true,
    sfx: true,
    musicVolume: 0.55,
    sfxVolume: 0.75,
    controls: 'both',
    speed: 'normal',
  },
  stickers: {},
  completed: {},
  totalCollected: {},
  lastPlayed: null,
};

export const MESSAGES = {
  complete: [
    'You did it!',
    'Great exploring!',
    'Wonderful adventure!',
    'You found the treasure!',
    'What a happy adventure!',
    'Amazing exploring!',
  ],
  friendFound: [
    'You found your friend!',
    'A happy reunion!',
    'Together again!',
    'Your friend says hello!',
  ],
  bump: [
    'Oops, a wall! Try another way.',
    'A little bump — let’s turn!',
    'That path is closed.',
  ],
};

export const getCharacter = (id) => CHARACTERS[id] || CHARACTERS.ghosty;
export const getWorld = (id) => WORLDS[id] || WORLDS.garden;
export const getDifficulty = (id) => DIFFICULTIES[id] || DIFFICULTIES.easy;