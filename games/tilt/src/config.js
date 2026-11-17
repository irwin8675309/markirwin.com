/**
 * Pet Tilt Adventures - shared configuration.
 * Worlds, characters, difficulties and tuning values live here.
 */

export const STORAGE_KEY = 'pta.save.v1';

export const CHARACTERS = {
  ghosty: {
    id: 'ghosty',
    name: 'Ghosty',
    species: 'cat',
    world: 'garden',
    color: '#ffffff',
    accent: '#8db6d1',
    tagline: 'The gentle garden cat',
  },
  spin: {
    id: 'spin',
    name: 'Spin',
    species: 'cat',
    world: 'chase',
    color: '#22252f',
    accent: '#c9d65c',
    tagline: 'The playful treat chaser',
  },
  oakley: {
    id: 'oakley',
    name: 'Oakley',
    species: 'dog',
    world: 'treasure',
    color: '#191b21',
    accent: '#cc8638',
    tagline: 'The brave treasure dog',
  },
};

export const WORLDS = {
  garden: {
    id: 'garden',
    name: 'Garden Paths',
    pet: 'ghosty',
    tagline: 'Flowers, butterflies & soft sunshine',
    cardTag: 'flowers & butterflies',
    cardSoft: '#eaffd8',
    accent: '#70d58c',
    accentDark: '#3f9b5c',
    collectibles: ['flower', 'star', 'butterfly'],
    counterIcon: 'flower',
    decor: 'garden',
    sky: ['#bff0ff', '#e9ffd6'],
    grass: ['#8fe08a', '#5cbe6b'],
    grassDark: '#3f9b5c',
    path: '#f7e6b8',
    pathLight: '#fff4d6',
    pathEdge: '#d6b273',
    water: '#8fdcf7',
    obstacleTint: '#6fcf86',
    stickerSet: ['ghosty', 'flower', 'butterfly', 'star'],
    music: { root: 261.63, scale: [0, 2, 4, 7, 9, 12, 14, 16] },
  },
  chase: {
    id: 'chase',
    name: 'Treat Chase',
    pet: 'spin',
    tagline: 'Toys, tunnels & tasty treats',
    cardTag: 'toys & treats',
    cardSoft: '#ffe6f2',
    accent: '#ff8fb7',
    accentDark: '#d9548a',
    collectibles: ['treat', 'yarn', 'star'],
    counterIcon: 'treat',
    decor: 'playground',
    sky: ['#ffe3f4', '#fff7dd'],
    grass: ['#8fe0c8', '#52c3a3'],
    grassDark: '#2f9d86',
    path: '#ffd9a4',
    pathLight: '#ffe9c6',
    pathEdge: '#e0a95f',
    water: '#8fd8ff',
    obstacleTint: '#ff9ab8',
    stickerSet: ['spin', 'treat', 'yarn', 'sparkle'],
    music: { root: 293.66, scale: [0, 2, 4, 7, 9, 12, 14, 16] },
  },
  treasure: {
    id: 'treasure',
    name: 'Treasure Trails',
    pet: 'oakley',
    tagline: 'Palms, bridges & hidden treasure',
    cardTag: 'coins & gems',
    cardSoft: '#fff0c9',
    accent: '#ffb347',
    accentDark: '#d98a1f',
    collectibles: ['coin', 'gem', 'star'],
    counterIcon: 'coin',
    decor: 'island',
    sky: ['#a5ebff', '#fff3c9'],
    grass: ['#ffe2a8', '#f5c977'],
    grassDark: '#d98a1f',
    path: '#f9d98f',
    pathLight: '#ffefc4',
    pathEdge: '#c99a4f',
    water: '#5fc9e8',
    obstacleTint: '#ffc46b',
    stickerSet: ['oakley', 'coin', 'gem', 'chest'],
    music: { root: 220.0, scale: [0, 2, 3, 7, 9, 12, 14, 15] },
  },
};

export const DIFFICULTIES = {
  little: {
    id: 'little',
    name: 'Little Paws',
    short: 'Little',
    blurb: 'Wide, gentle paths',
    pathWidth: 200,
    goalRadius: 78,
    segments: 5,
    turnAmount: 0.34,
    obstacleCount: 2,
    obstacleRadius: 34,
    movingObstacles: 0,
    collectibleCount: 6,
    hiddenCount: 1,
    checkpoints: 1,
    ballRadius: 26,
    physics: { accel: 470, drag: 2.25, maxSpeed: 285, bounce: 0.22, bumpBounce: 0.3 },
    sensitivity: 'gentle',
  },
  happy: {
    id: 'happy',
    name: 'Happy Paws',
    short: 'Happy',
    blurb: 'Winding paths and bridges',
    pathWidth: 170,
    goalRadius: 66,
    segments: 7,
    turnAmount: 0.5,
    obstacleCount: 4,
    obstacleRadius: 34,
    movingObstacles: 1,
    collectibleCount: 8,
    hiddenCount: 2,
    checkpoints: 2,
    ballRadius: 26,
    physics: { accel: 700, drag: 1.62, maxSpeed: 360, bounce: 0.38, bumpBounce: 0.45 },
    sensitivity: 'normal',
  },
  super: {
    id: 'super',
    name: 'Super Paws',
    short: 'Super',
    blurb: 'Twisty trails and moving bumpers',
    pathWidth: 142,
    goalRadius: 58,
    segments: 9,
    turnAmount: 0.66,
    obstacleCount: 6,
    obstacleRadius: 30,
    movingObstacles: 3,
    collectibleCount: 10,
    hiddenCount: 3,
    checkpoints: 3,
    ballRadius: 26,
    physics: { accel: 980, drag: 1.1, maxSpeed: 440, bounce: 0.5, bumpBounce: 0.58 },
    sensitivity: 'sensitive',
  },
};

export const SENSITIVITY = {
  gentle: { rangeDeg: 24, smooth: 3.2, gain: 0.92, label: 'Gentle' },
  normal: { rangeDeg: 19, smooth: 4.6, gain: 1.0, label: 'Normal' },
  sensitive: { rangeDeg: 15, smooth: 6.2, gain: 1.08, label: 'Sensitive' },
};

export const STICKERS = [
  { id: 'ghosty', name: 'Ghosty', art: 'ghosty', world: 'garden' },
  { id: 'flower', name: 'Flower', art: 'flower', world: 'garden' },
  { id: 'butterfly', name: 'Butterfly', art: 'butterfly', world: 'garden' },
  { id: 'star', name: 'Star', art: 'star', world: 'garden' },
  { id: 'spin', name: 'Spin', art: 'spin', world: 'chase' },
  { id: 'treat', name: 'Treat', art: 'treat', world: 'chase' },
  { id: 'yarn', name: 'Yarn Ball', art: 'yarn', world: 'chase' },
  { id: 'sparkle', name: 'Sparkle', art: 'sparkle', world: 'chase' },
  { id: 'oakley', name: 'Oakley', art: 'oakley', world: 'treasure' },
  { id: 'coin', name: 'Coin', art: 'coin', world: 'treasure' },
  { id: 'gem', name: 'Gem', art: 'gem', world: 'treasure' },
  { id: 'chest', name: 'Treasure', art: 'chest', world: 'treasure' },
];

export const STICKER_BY_ID = Object.fromEntries(STICKERS.map((s) => [s.id, s]));

export const SETTINGS_DEFAULTS = {
  sound: true,
  music: true,
  sfx: true,
  volume: 0.7,
  sensitivity: 'normal',
  deadZone: 3,
  control: 'auto', // 'auto' | 'tilt' | 'touch'
  flipX: false,
  flipY: false,
  ballSpeed: 1,
  guidance: true,
  showWay: true,
  difficulty: 'happy',
};

export const SAVE_DEFAULTS = {
  v: 1,
  selectedWorld: 'garden',
  selectedDifficulty: 'happy',
  levelIndex: { garden: 0, chase: 0, treasure: 0 },
  completed: {},
  stickers: [],
  settings: { ...SETTINGS_DEFAULTS },
};

export const WORLD_ORDER = ['garden', 'chase', 'treasure'];
export const DIFF_ORDER = ['little', 'happy', 'super'];

export const SAVE_VERSION = 1;

export const GAME_TITLE = 'Pet Tilt Adventures';