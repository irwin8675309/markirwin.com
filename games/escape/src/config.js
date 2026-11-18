/**
 * Ghosty, Spin, and Oakley's Great Escape — game content and tuning.
 *
 * The three characters, their names, markings and personalities come from the
 * family's real pets. The vector artwork for them lives in ./art.js and is the
 * same artwork shared with the family's earlier pet games, so the pets always
 * look identical. Every environment, object and sticker in this game is
 * original artwork created for this project.
 */

export const GAME_TITLE = "Ghosty, Spin, and Oakley's Great Escape";
export const GAME_SHORT = 'Great Escape';

export const CHARACTERS = {
  ghosty: {
    id: 'ghosty',
    name: 'Ghosty',
    species: 'cat',
    kind: 'The Gentle Cat',
    personality: 'Loving · Peaceful · Gentle',
    description:
      'A completely white, fluffy cat with soft gray eyes and a little pink nose.',
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
      'A black-and-white tuxedo cat with a black cap and soft eye mask, white face and chest, and bright hazel eyes.',
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
      'A friendly solid-black senior dog with floppy ears, lighter gray-white muzzle whiskers and warm amber eyes.',
    message: 'Let’s find some treats!',
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
  star: { id: 'star', name: 'Star', tint: '#ffd84d' },
  heart: { id: 'heart', name: 'Heart', tint: '#ff7fa5' },
  treat: { id: 'treat', name: 'Treat', tint: '#ffd84d' },
  sparkle: { id: 'sparkle', name: 'Sparkle', tint: '#ffe27a' },
  gem: { id: 'gem', name: 'Gem', tint: '#67c8ff' },
  butterfly: { id: 'butterfly', name: 'Butterfly', tint: '#a98bf2' },
};

/* ------------------------------------------------------------------ */
/* Worlds                                                              */
/* ------------------------------------------------------------------ */

export const WORLDS = {
  pillow: {
    id: 'pillow',
    name: 'The Pillow Fort',
    short: 'Pillow Fort',
    subtitle: 'Fluffy pillows, cozy blankets & soft tunnels',
    story: 'A giant pillow fort! Help your pet find the cozy opening.',
    accent: '#c58bff',
    accentDark: '#8a53d6',
    soft: '#f6ecff',
    requiredKind: 'pillow',
    optionalKind: 'cushion',
    collectibles: ['star', 'heart', 'sparkle'],
    render: {
      bgTop: '#ffe4f2',
      bgBottom: '#e7dcff',
      floorA: '#fff6fb',
      floorB: '#ffe6f2',
      floorLine: 'rgba(197,139,255,.16)',
      wall: '#c9a7ff',
      wallEdge: '#9a6fe0',
      wallHi: '#e8d9ff',
      wallStyle: 'pillow',
      outside: '#efe0ff',
      accent: '#c58bff',
      ambient: 'sparkle',
    },
    preview: ['#ffd6ea', '#e7dcff', '#f3e6ff'],
  },
  backyard: {
    id: 'backyard',
    name: 'The Backyard Adventure',
    short: 'Backyard',
    subtitle: 'Green grass, flowers, butterflies & sunny skies',
    story: 'A sunny backyard full of flowers. Help your pet find the garden path.',
    accent: '#5ec46f',
    accentDark: '#2f8f46',
    soft: '#ecfce8',
    requiredKind: 'block',
    optionalKind: 'ball',
    collectibles: ['butterfly', 'star', 'heart'],
    render: {
      bgTop: '#9fe0ff',
      bgBottom: '#eaffd9',
      floorA: '#e6f9c9',
      floorB: '#d2f0ad',
      floorLine: 'rgba(74,160,80,.18)',
      wall: '#57b869',
      wallEdge: '#2f7f43',
      wallHi: '#9ae89a',
      wallStyle: 'hedge',
      outside: '#8fe08b',
      accent: '#5ec46f',
      ambient: 'leaf',
    },
    preview: ['#9fe0ff', '#bff0a0', '#6fd07a'],
  },
  toybox: {
    id: 'toybox',
    name: 'The Toy Box',
    short: 'Toy Box',
    subtitle: 'Building blocks, toy trains, balls & boxes',
    story: 'An enormous toy box! Move the blocks to make a path.',
    accent: '#ff9f5c',
    accentDark: '#d9722b',
    soft: '#fff2e6',
    requiredKind: 'block',
    optionalKind: 'box',
    collectibles: ['star', 'gem', 'treat'],
    render: {
      bgTop: '#bfe9ff',
      bgBottom: '#fff0d6',
      floorA: '#ffeccc',
      floorB: '#ffdca8',
      floorLine: 'rgba(217,140,60,.18)',
      wall: '#ff9f5c',
      wallEdge: '#c96a2f',
      wallHi: '#ffc79a',
      wallStyle: 'block',
      outside: '#ffd9a8',
      accent: '#ff9f5c',
      ambient: 'star',
    },
    preview: ['#bfe9ff', '#ffe0b0', '#ffb877'],
  },
  adventure: {
    id: 'adventure',
    name: 'The Great Pet Adventure',
    short: 'Great Adventure',
    subtitle: 'Sunny trails, little bridges & happy reunions',
    story: 'The biggest adventure! Bring all three pets together.',
    accent: '#ffb03a',
    accentDark: '#c97e12',
    soft: '#fff7e2',
    requiredKind: 'crate',
    optionalKind: 'ball',
    collectibles: ['heart', 'star', 'treat'],
    render: {
      bgTop: '#ffd9a0',
      bgBottom: '#ffe9f0',
      floorA: '#fff1cf',
      floorB: '#ffe0a8',
      floorLine: 'rgba(201,126,18,.16)',
      wall: '#e8894a',
      wallEdge: '#b25f26',
      wallHi: '#ffbe86',
      wallStyle: 'fence',
      outside: '#ffd9a8',
      accent: '#ffb03a',
      ambient: 'sparkle',
    },
    preview: ['#ffcf8a', '#ffe3c0', '#ff9ec1'],
  },
};

export const WORLD_ORDER = ['pillow', 'backyard', 'toybox', 'adventure'];

/* ------------------------------------------------------------------ */
/* Difficulties                                                        */
/* ------------------------------------------------------------------ */

export const DIFFICULTIES = {
  little: {
    id: 'little',
    name: 'Little Paws',
    short: 'Little',
    tag: 'Age 3',
    description: 'Short, gentle paths with big, obvious objects. Extra help is always glowing.',
    speed: 2.0,
    guides: 'always',
    clutter: false,
    accent: '#5ec46f',
  },
  happy: {
    id: 'happy',
    name: 'Happy Paws',
    short: 'Happy',
    tag: 'Age 4',
    description: 'A few more turns, extra things to move and a couple of hidden treasures.',
    speed: 2.6,
    guides: 'sometimes',
    clutter: true,
    accent: '#4aa8e8',
  },
  super: {
    id: 'super',
    name: 'Super Paws',
    short: 'Super',
    tag: 'Age 5',
    description: 'Longer routes, more objects and extra exploration for bigger adventurers.',
    speed: 3.2,
    guides: 'off',
    clutter: true,
    accent: '#a97cf0',
  },
};

export const DIFFICULTY_ORDER = ['little', 'happy', 'super'];

export const SPEED_SETTINGS = {
  chill: { id: 'chill', name: 'Chill', multiplier: 0.8 },
  normal: { id: 'normal', name: 'Normal', multiplier: 1.0 },
  zippy: { id: 'zippy', name: 'Zippy', multiplier: 1.25 },
};

/* ------------------------------------------------------------------ */
/* Stickers                                                            */
/* ------------------------------------------------------------------ */

export const STICKERS = [
  { id: 'ghosty', name: 'Ghosty', art: 'char:ghosty', hint: 'Finish any adventure with Ghosty.' },
  { id: 'spin', name: 'Spin', art: 'char:spin', hint: 'Finish any adventure with Spin.' },
  { id: 'oakley', name: 'Oakley', art: 'char:oakley', hint: 'Finish any adventure with Oakley.' },
  { id: 'star', name: 'Happy Star', art: 'item:star', hint: 'Find a shiny star.' },
  { id: 'heart', name: 'Sweet Heart', art: 'item:heart', hint: 'Collect a warm, fuzzy heart.' },
  { id: 'sparkle', name: 'Magic Sparkle', art: 'item:sparkle', hint: 'Spot a twinkling sparkle.' },
  { id: 'treat', name: 'Golden Treat', art: 'item:treat', hint: 'Sniff out a tasty treat.' },
  { id: 'butterfly', name: 'Butterfly', art: 'item:butterfly', hint: 'Catch a fluttery butterfly.' },
  { id: 'gem', name: 'Jewel', art: 'item:gem', hint: 'Pick up a sparkling jewel.' },
  { id: 'pillow', name: 'Fluffy Pillow', art: 'obj:pillow', hint: 'Move a soft pillow out of the way.' },
  { id: 'cushion', name: 'Cozy Cushion', art: 'obj:cushion', hint: 'Find a squishy cushion.' },
  { id: 'block', name: 'Rainbow Block', art: 'obj:block', hint: 'Slide a bright toy block.' },
  { id: 'box', name: 'Cardboard Box', art: 'obj:box', hint: 'Open up a cardboard box.' },
  { id: 'ball', name: 'Bouncy Ball', art: 'obj:ball', hint: 'Roll a colorful ball aside.' },
  { id: 'flower', name: 'Happy Flower', art: 'world:flower', hint: 'Visit the backyard garden.' },
  { id: 'pillowfort', name: 'Pillow Fort', art: 'dest:pillowfort', hint: 'Escape the pillow fort.' },
  { id: 'gardentent', name: 'Garden Tent', art: 'dest:gardentent', hint: 'Find the backyard tent.' },
  { id: 'toychest', name: 'Toy Chest', art: 'dest:toychest', hint: 'Reach the giant toy chest.' },
  { id: 'escape', name: 'Great Escape', art: 'dest:adventure', hint: 'Complete the Great Pet Adventure.' },
];

export const STICKER_BY_ID = Object.fromEntries(STICKERS.map((s) => [s.id, s]));

/* ------------------------------------------------------------------ */
/* Save data                                                           */
/* ------------------------------------------------------------------ */

export const STORAGE_KEY = 'great-escape-progress-v1';

export const DEFAULT_PROGRESS = {
  version: 1,
  character: 'ghosty',
  world: 'pillow',
  difficulty: 'little',
  settings: {
    sound: true,
    music: true,
    sfx: true,
    musicVolume: 0.5,
    sfxVolume: 0.7,
    speed: 'normal',
  },
  stickers: {},
  completed: {},
  collected: {},
  lastPlayed: null,
};

export const MESSAGES = {
  complete: [
    'You did it!',
    'Great helping!',
    'What a happy adventure!',
    'Hooray for you!',
    'You found the way!',
    'Amazing exploring!',
  ],
  pet: {
    ghosty: ['Look at Ghosty!', 'Ghosty is so happy!', 'Gentle Ghosty made it!'],
    spin: ['Spin found the way!', 'Playful Spin did it!', 'Spin says hooray!'],
    oakley: ['Oakley is so happy!', 'Brave Oakley made it!', 'Good dog, Oakley!'],
  },
  friend: [
    'You found your friend!',
    'A happy reunion!',
    'Together again!',
    'Your friend says hello!',
  ],
  bump: [
    'Oops, something is in the way!',
    'Let’s move that out of the path.',
    'Try another way around.',
  ],
  drop: ['Nice moving!', 'A perfect spot!', 'That helps a lot!'],
};

export const getCharacter = (id) => CHARACTERS[id] || CHARACTERS.ghosty;
export const getWorld = (id) => WORLDS[id] || WORLDS.pillow;
export const getDifficulty = (id) => DIFFICULTIES[id] || DIFFICULTIES.little;