export const GAME_WIDTH = 1600;
export const GAME_HEIGHT = 900;
export const GROUND_Y = 758;
export const PLAYER_START_X = 310;
export const LEVEL_CLEAR_X = 430;

export const PETS = {
  ghosty: {
    id: 'ghosty',
    name: 'Ghosty',
    personality: 'Calm & loving',
    accent: '#ffb27a',
    accentDark: '#d98c52',
    glow: 'rgba(255, 210, 158, .65)',
    soft: '#fff4e6',
    eye: '#8db6d1',
  },
  spin: {
    id: 'spin',
    name: 'Spin',
    personality: 'Playful & curious',
    accent: '#8a8fae',
    accentDark: '#55597a',
    glow: 'rgba(176, 184, 228, .6)',
    soft: '#f0eff9',
    eye: '#c9d65c',
  },
  oakley: {
    id: 'oakley',
    name: 'Oakley',
    personality: 'Loyal & cheerful',
    accent: '#ffae72',
    accentDark: '#c67b42',
    glow: 'rgba(255, 184, 127, .6)',
    soft: '#fff0e4',
    eye: '#cc8638',
  },
};

export const LEVELS = [
  {
    id: 'meadow',
    index: 0,
    theme: 'meadow',
    name: 'Rainbow Meadow',
    subtitle: 'Flowers, butterflies & soft hills',
    length: 8800,
    speed: 154,
    accent: '#ffb65c',
    rescue: ['bunny', 'duckling'],
    obstacles: ['puddle', 'log', 'yarn', 'cloud'],
    collectibles: ['star', 'heart', 'butterfly', 'sparkle'],
  },
  {
    id: 'forest',
    index: 1,
    theme: 'forest',
    name: 'Enchanted Forest',
    subtitle: 'Glowing mushrooms & sleepy sunbeams',
    length: 9200,
    speed: 156,
    accent: '#b797f0',
    rescue: ['squirrel', 'kitten'],
    obstacles: ['mushroom', 'log', 'puddle', 'cloud'],
    collectibles: ['star', 'sparkle', 'ribbon', 'butterfly'],
  },
  {
    id: 'cloud',
    index: 2,
    theme: 'cloud',
    name: 'Cloud Kingdom',
    subtitle: 'Floating islands & rainbow bridges',
    length: 9500,
    speed: 158,
    accent: '#6fd1ff',
    rescue: ['bird', 'turtle'],
    obstacles: ['cloud', 'cloud', 'log', 'bubble'],
    collectibles: ['star', 'gem', 'sparkle', 'heart'],
  },
  {
    id: 'candy',
    index: 3,
    theme: 'candy',
    name: 'Candyland Valley',
    subtitle: 'Lollipops, gumdrops & chocolate streams',
    length: 9800,
    speed: 160,
    accent: '#ff96bf',
    rescue: ['kitten', 'puppy'],
    obstacles: ['gumdrop', 'chocolate', 'candy', 'mushroom'],
    collectibles: ['heart', 'gem', 'ribbon', 'treat'],
  },
];

export const LEVEL_BY_ID = Object.fromEntries(LEVELS.map((level) => [level.id, level]));

export const RESCUE_COPY = {
  bunny: { greeting: 'A bunny needs a little help!', thanks: 'Thank you!' },
  bird: { greeting: 'A little bird needs a hand!', thanks: 'Tweet! Thank you!' },
  kitten: { greeting: 'A kitten needs a little help!', thanks: 'Purr! Thank you!' },
  turtle: { greeting: 'A turtle needs a little help!', thanks: 'Thank you!' },
  duckling: { greeting: 'A duckling needs a little help!', thanks: 'Quack! Thank you!' },
  squirrel: { greeting: 'A squirrel needs a little help!', thanks: 'Thank you!' },
  puppy: { greeting: 'A puppy needs a little help!', thanks: 'Woof! Thank you!' },
};

export const STORAGE_KEY = 'pets-game-progress-v1';

export const DEFAULT_PROGRESS = {
  version: 1,
  selectedPet: 'ghosty',
  completed: [],
  unlocked: ['meadow'],
  collected: 0,
  itemCounts: {},
  rescued: [],
  settings: { music: true, sfx: true },
  lastPlayed: null,
};