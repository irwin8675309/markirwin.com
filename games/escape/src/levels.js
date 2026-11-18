/**
 * Ghosty, Spin, and Oakley's Great Escape — level definitions.
 *
 * Levels are authored as small ASCII maps so they are easy to read, review and
 * extend. Every level provides three maps, one per difficulty, and every map is
 * playable on its own (no level requires finishing another first).
 *
 * ── Map legend ───────────────────────────────────────────────────────────
 *   #  wall / obstacle (drawn as pillows, hedges, blocks or fences)
 *   .  open floor
 *   S  pet start
 *   G  destination (the cozy way out)
 *   F  a friend pet to find and reunite with
 *
 *   Movable objects (the child can drag these out of the way):
 *   P  pillow        C  cushion       B  toy block
 *   X  cardboard box O  bouncy ball  K  wooden crate
 *
 *   Optional collectibles:
 *   *  star     h  heart     t  treat
 *   w  sparkle m  gem       y  butterfly
 *
 * The puzzle is always gentle: any wall-free route is enough to finish, and
 * movable objects can always be set down on another open floor tile.
 */

export const LEVELS = [
  /* ─────────────────────────── WORLD 1 · PILLOW FORT ─────────────────── */
  {
    id: 'pillow-1',
    world: 'pillow',
    name: 'Cozy Opening',
    story: 'A giant pillow fort! Find the soft opening and wiggle out.',
    maps: {
      little: [
        '#########',
        '#S..*...#',
        '#..PP...#',
        '#.......#',
        '#..##...#',
        '#....*.G#',
        '#########',
      ],
      happy: [
        '###########',
        '#S...*....#',
        '#..PPP....#',
        '#....##...#',
        '#.*..##.h.#',
        '#....PP...#',
        '#.##......#',
        '#.....*..G#',
        '###########',
      ],
      super: [
        '###########',
        '#S..P..*..#',
        '#.#.#.#.#.#',
        '#.#...#...#',
        '#.###.###.#',
        '#...P...P.#',
        '#.#.###.#.#',
        '#F..*....G#',
        '###########',
      ],
    },
  },
  {
    id: 'pillow-2',
    world: 'pillow',
    name: 'Blanket Tunnels',
    story: 'Soft blanket tunnels twist and turn. Help your pet slip through!',
    maps: {
      little: [
        '#########',
        '#S......#',
        '#.####..#',
        '#.#..#..#',
        '#.#.*#..#',
        '#...P..G#',
        '#########',
      ],
      happy: [
        '###########',
        '#S...#....#',
        '#.##.#.##.#',
        '#....#..#.#',
        '#.##....#.#',
        '#.#..P#...#',
        '#.#.##.##.#',
        '#...*....G#',
        '###########',
      ],
      super: [
        '###########',
        '#S.#....*.#',
        '#..#.##.#.#',
        '##.#.#..#.#',
        '#..#.#.##.#',
        '#.##.#....#',
        '#.#..#.##.#',
        '#F...#...G#',
        '###########',
      ],
    },
  },

  /* ───────────────────────── WORLD 2 · BACKYARD ──────────────────────── */
  {
    id: 'backyard-1',
    world: 'backyard',
    name: 'Flower Path',
    story: 'A sunny flower garden! Follow the path past the blooms.',
    maps: {
      little: [
        '#########',
        '#S.....O#',
        '#.*..#..#',
        '#....#..#',
        '#.##.#..#',
        '#....*.G#',
        '#########',
      ],
      happy: [
        '###########',
        '#S...O....#',
        '#.*.#.#.*.#',
        '#...#.#.#.#',
        '#.#...#...#',
        '#.#.###.#.#',
        '#.#..B..#.#',
        '#...*..*.G#',
        '###########',
      ],
      super: [
        '###########',
        '#S.#....*.#',
        '#..#.##.#.#',
        '##.#..#.#.#',
        '#..#.##.#.#',
        '#.##....#.#',
        '#.#..O##..#',
        '#F...*...G#',
        '###########',
      ],
    },
  },
  {
    id: 'backyard-2',
    world: 'backyard',
    name: 'Garden Gate',
    story: 'A little garden gate is hiding. Can you find the way through?',
    maps: {
      little: [
        '#########',
        '#S..#...#',
        '#.#.#.#.#',
        '#.#...#.#',
        '#.###.#.#',
        '#.*..O.G#',
        '#########',
      ],
      happy: [
        '###########',
        '#S..#.....#',
        '#.#.#.###.#',
        '#.#...#...#',
        '#.###.#.#.#',
        '#.....#.#.#',
        '#.###.#.#.#',
        '#.*..O...G#',
        '###########',
      ],
      super: [
        '###########',
        '#S.#.....##',
        '#..#.###..#',
        '##.#.#....#',
        '#..#.#.##.#',
        '#.##.#..#.#',
        '#.#..#..#.#',
        '#F*.O...*G#',
        '###########',
      ],
    },
  },

  /* ──────────────────────────── WORLD 3 · TOY BOX ────────────────────── */
  {
    id: 'toybox-1',
    world: 'toybox',
    name: 'Block Path',
    story: 'An enormous toy box! Slide the bright blocks to make a path.',
    maps: {
      little: [
        '#########',
        '#S..B...#',
        '#.###...#',
        '#...#.#.#',
        '#.#...#.#',
        '#.*..B.G#',
        '#########',
      ],
      happy: [
        '###########',
        '#S..B.....#',
        '#.###.###.#',
        '#...#.#...#',
        '#.#...#.#.#',
        '#.#.###.#.#',
        '#.#.....#.#',
        '#.*..B...G#',
        '###########',
      ],
      super: [
        '###########',
        '#S.#.....*#',
        '#..#.###..#',
        '##.#...#..#',
        '#..#.#.#.##',
        '#.##.#.#..#',
        '#.#..#..#.#',
        '#F*.B...*G#',
        '###########',
      ],
    },
  },
  {
    id: 'toybox-2',
    world: 'toybox',
    name: 'Toy Chest',
    story: 'The giant toy chest is overflowing. Pop the boxes and climb in!',
    maps: {
      little: [
        '#########',
        '#S......#',
        '#.##.##.#',
        '#....#..#',
        '#.##.#..#',
        '#.*..X.G#',
        '#########',
      ],
      happy: [
        '###########',
        '#S...X....#',
        '#.##.#.##.#',
        '#....#....#',
        '#.##.#.##.#',
        '#....#.#..#',
        '#.##...#..#',
        '#.*..X...G#',
        '###########',
      ],
      super: [
        '###########',
        '#S.#.....##',
        '#..#.##.#.#',
        '##.#..#.#.#',
        '#..##.#.#.#',
        '#.#...#..##',
        '#.#.##.#..#',
        '#F*.X...*G#',
        '###########',
      ],
    },
  },

  /* ────────────────────── WORLD 4 · GREAT PET ADVENTURE ───────────────── */
  {
    id: 'adventure-1',
    world: 'adventure',
    name: 'Sunny Trail',
    story: 'The great adventure begins! Find your friend, then the sunny way out.',
    maps: {
      little: [
        '#########',
        '#S.....G#',
        '#.#####.#',
        '#.#...#.#',
        '#.#.#.#.#',
        '#F*.O.*.#',
        '#########',
      ],
      happy: [
        '###########',
        '#S...O....#',
        '#.#.###.#.#',
        '#.#.....#.#',
        '#.#.###.#.#',
        '#.#...#.#.#',
        '#.###.#.#.#',
        '#F*...*..G#',
        '###########',
      ],
      super: [
        '###########',
        '#S.#.....##',
        '#..#.##.#.#',
        '##.#..#.#.#',
        '#..#.##.#.#',
        '#.##....#.#',
        '#.#..#..#.#',
        '#F*.O#..*G#',
        '###########',
      ],
    },
  },
  {
    id: 'adventure-2',
    world: 'adventure',
    name: 'Little Bridge',
    story: 'A wobbly little bridge crosses the garden. Help everyone across!',
    maps: {
      little: [
        '#########',
        '#S.....G#',
        '#.#####.#',
        '#.......#',
        '#.#####.#',
        '#F..O..*#',
        '#########',
      ],
      happy: [
        '###########',
        '#S...#....#',
        '#.##.#.##.#',
        '#....#....#',
        '#.##.#.##.#',
        '#....#....#',
        '#.##.#.##.#',
        '#F*..O...G#',
        '###########',
      ],
      super: [
        '###########',
        '#S.#.....##',
        '#..#.###..#',
        '##.#.#....#',
        '#..#.#.##.#',
        '#.##.#..#.#',
        '#.#..#.#..#',
        '#F*.O#..*G#',
        '###########',
      ],
    },
  },
  {
    id: 'adventure-3',
    world: 'adventure',
    name: 'All Together',
    story: 'The grand finale! Bring all three pets together for a happy reunion.',
    maps: {
      little: [
        '#########',
        '#S..*..G#',
        '#.##.##.#',
        '#.......#',
        '#.##.##.#',
        '#F..O..F#',
        '#########',
      ],
      happy: [
        '###########',
        '#S...O....#',
        '#.##.#.##.#',
        '#....#....#',
        '#.##.#.##.#',
        '#....#....#',
        '#.##.#.##.#',
        '#F*..O..FG#',
        '###########',
      ],
      super: [
        '###########',
        '#S.#.....##',
        '#..#.##.#.#',
        '##.#..#.#.#',
        '#..#.##.#.#',
        '#.##....#.#',
        '#.#..#..#.#',
        '#F*.O#.*FG#',
        '###########',
      ],
    },
  },
];

export const LEVEL_BY_ID = Object.fromEntries(LEVELS.map((l) => [l.id, l]));

export const levelsForWorld = (worldId) => LEVELS.filter((l) => l.world === worldId);

export const nextLevel = (levelId) => {
  const i = LEVELS.findIndex((l) => l.id === levelId);
  if (i < 0 || i + 1 >= LEVELS.length) return null;
  return LEVELS[i + 1];
};