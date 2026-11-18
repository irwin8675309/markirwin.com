# Ghosty, Spin, and Oakley's Great Escape

A complete, gentle, colorful escape adventure for two young children (about ages 3 and 5), starring **Ghosty**, **Spin**, and **Oakley** — the family's real pets.

Built with plain **HTML, CSS, JavaScript (ES modules) and Canvas 2D**. There is **no build step, no backend, no account, no ads, no analytics, no external network request, and no third-party JavaScript library**. All character, object and world art is original vector artwork generated at runtime; all music and sound effects are synthesised with WebAudio.

The game is a tap-to-move, drag-and-drop puzzle adventure: help a pet find its way through a cozy place, move oversized objects out of the path, collect optional treasures, and reunite with a friend before reaching the cozy destination.

> The title is an original name created for this family project. It has **not** been trademark-cleared, and no claim is made that it is.

---

## Play locally

The game uses ES modules, so it must be served over `http://` (opening `index.html` with `file://` will not work).

```bash
cd escape
python3 serve.py
```

Open **http://127.0.0.1:8080** in Safari, Chrome, or Firefox.

Alternatives:

```bash
python3 -m http.server 8080
# or
npm start
```

There is no `npm install` required.

### iPad

1. Open the game in **Safari on iPad**.
2. Use **landscape** orientation for the best experience (portrait is supported and rearranges the layout).
3. Tap the share button → **Add to Home Screen** for a full-screen, app-like feel.
4. Tap once anywhere to enable sound (browser audio rules require a user gesture).

Double-tap zoom, page scrolling, pull-to-refresh and accidental navigation are suppressed during play.

For testing on an iPad over Wi-Fi, serve on all interfaces and open the computer's LAN address on the iPad:

```bash
python3 -m http.server 8080 --bind 0.0.0.0
# then open http://<computer-ip>:8080 on the iPad
```

---

## How to play

- **Move your pet** — tap any open floor tile and the pet walks there along a clear path. Wide paths and bright visuals make it easy for little fingers.
- **Move objects** — press and drag a pillow, cushion, block, box, ball or crate onto any free floor tile to clear the way. Drop it almost anywhere; if the spot is not valid the object gently returns.
- **Find the way** — each level is a small, friendly maze with a cozy destination (a pillow fort, garden tent, toy chest or sunny gate). Reach it to finish.
- **Collect treasures** — stars, hearts, treats, sparkles, gems and butterflies are optional. Collect them for extra stickers.
- **Find a friend** — some levels hide one of the other pets. Walk to them for a happy reunion.
- **Help & Do it** — the **Help** button shows a glowing route; **Do it** gently performs the next step (moves an object or walks a step) so no child ever gets stuck. There are no penalties.

There are **no timers, no lives, no failure screens and no negative scoring**. Difficulty changes path length and complexity, never the pet's speed.

---

## What is included

### Characters (strict spec)

| Character | Look | Personality |
| --- | --- | --- |
| **Ghosty** | Entirely pure-white fluffy cat, soft **gray** eyes, soft pink nose | Loving, peaceful, gentle |
| **Spin** | Black-and-white tuxedo cat, black cap and soft eye mask, white face/chest/legs, **yellow-green/hazel** eyes | Energetic, playful, curious |
| **Oakley** | Solid-black senior dog, floppy ears, lighter gray-white muzzle whiskers, **amber** eyes, happy tongue | Loyal, cheerful, brave |

Each character has idle flourishes: Ghosty floats and sparkles, Spin occasionally spins, Oakley has a gentle tail-wag/bounce. The vector artwork is shared with the family's earlier pet games so the pets always look identical, and it was color-checked for this project: Ghosty has **0% peach/cream fur**, gray irises and a pink nose; Oakley stays solid black with a gray-white muzzle; Spin keeps his tuxedo markings.

### Four worlds

| World | Look | Movable objects | Destination |
| --- | --- | --- | --- |
| **The Pillow Fort** | Cozy lavender & pink, puffy pillow walls | Pillows, cushions | Pillow-fort arch |
| **The Backyard Adventure** | Green grass, flowers, butterflies, sunshine | Blocks, balls | Garden tent |
| **The Toy Box** | Bright toy blocks, warm floor | Blocks, cardboard boxes | Giant toy chest |
| **The Great Pet Adventure** | Sunny trails, bunting, balloons | Crates, balls | Sunny celebration gate |

Every world is available immediately and can be replayed at any time.

### Nine levels × three difficulties

Each of the 9 handcrafted levels (see `src/levels.js`) has its own map for each difficulty:

| Difficulty | Feel |
| --- | --- |
| **Little Paws** (Age 3) | Short, gentle routes, few walls, big obvious objects, extra help glowing |
| **Happy Paws** (Age 4) | Longer routes, more walls, a few more treasures |
| **Super Paws** (Age 5) | Longest routes, most walls, extra exploration |

All levels are available immediately. Difficulty comes from route length and wall complexity, not from making the pet move faster.

### Stickers

Every finished level awards stickers: the helper character, the world's destination, and any collectible types found. The **sticker book** shows all 19 stickers in full color when earned and as faded silhouettes when not. Stickers are saved on the device. There is no score, currency, or purchase system.

### Settings (grown-up corner)

- Master sound on/off
- Music and sound-effect toggles
- Music and effects volume
- Movement speed: **Chill**, **Normal**, or **Zippy**
- **Reset all progress** (two-step confirmation)

### Save data

Progress is stored in `localStorage` under `great-escape-progress-v1`. It remembers:

- selected helper, world and difficulty
- completed levels
- earned stickers
- collected treasure counts
- sound/music/sfx/volume and speed settings

No account or personal information is collected. Reset it any time from Settings.

---

## Technology stack

- **HTML5** semantic screens (`index.html`)
- **CSS** custom properties, flexbox/grid, rounded storybook styling (`styles/main.css`)
- **JavaScript ES modules**, no framework
- **Canvas 2D** rendering with a cached static layer + dynamic layer (`src/render.js`)
- **WebAudio** for original generative music and sound effects (`src/audio.js`)
- **localStorage** for saves (`src/storage.js`)
- **Service worker** for offline play (`sw.js`)

## Project structure

```
escape/
├─ index.html                # All screens & modals
├─ styles/
│  └─ main.css               # Storybook UI styling
├─ src/
│  ├─ main.js                # Entry point / boot
│  ├─ config.js              # Characters, worlds, difficulties, stickers, tuning
│  ├─ art.js                 # Canonical pet artwork (shared, color-checked)
│  ├─ world-art.js           # Original world objects, destinations, previews
│  ├─ levels.js              # ASCII level maps (easy to edit/extend)
│  ├─ board.js               # Pure logic: parse, pathfind, drag, hints, validate
│  ├─ audio.js               # WebAudio music + sfx
│  ├─ storage.js             # localStorage progress
│  ├─ render.js              # Canvas renderer
│  ├─ game.js                # Gameplay controller (movement, drag, collect, win)
│  └─ ui.js                  # DOM/screens/input/modals/stickers/settings
├─ tests/
│  ├─ levels.test.mjs        # Validates every map parses, is solvable, scales
│  └─ game.test.mjs          # Headless full-playthrough simulation
├─ sw.js                     # Service worker (offline)
├─ serve.py                  # No-cache dev server
└─ package.json
```

## Commands

```bash
npm start          # serve at http://127.0.0.1:8080
npm run check      # syntax-check every source module
npm test           # run both test suites
```

## Build & deploy (GitHub Pages)

There is no compile step — the static files in this folder are the deployable site. Because the game may live in a **subdirectory** of a larger Pages site (e.g. `https://user.github.io/games/ghosty-spin-oakley-great-escape/`), all asset references are **relative** (`styles/main.css`, `src/main.js`, `./sw.js`), so the game works from any base path without configuration.

1. Commit this folder into your Pages site (for example under `games/ghosty-spin-oakley-great-escape/`).
2. Push to the branch that GitHub Pages serves.
3. In the repo settings, set Pages to serve from that branch/folder (root or `/docs` as appropriate).
4. The included `.nojekyll` file prevents GitHub from ignoring files/folders that begin with an underscore.

The service worker uses a **versioned cache** (`great-escape-vN`) with **stale-while-revalidate** for assets and **network-first** for navigation, so new deploys appear without being blocked by an old cache. If you change many files, bump `VERSION` in `sw.js`.

## Adding future adventures

### Add a level

1. Open `src/levels.js`.
2. Add a new object to the `LEVELS` array with an `id`, `world`, `name`, `story`, and `maps` for `little`, `happy`, and `super`.
3. Draw the map with the ASCII legend documented at the top of that file (`#` wall, `.` floor, `S` start, `G` goal, `F` friend, `P/C/B/X/O/K` movable objects, `* h t w m y` collectibles).
4. Keep every row the same length and include exactly one `S` and one `G` per map.
5. Run `npm test` — it verifies every map parses, is solvable, has collectibles, and scales in difficulty.

No engine changes are needed. The renderer, controls, hints and sticker logic pick up new levels automatically.

### Add or change artwork

- **Characters** live in `src/art.js` (`PET_LOOKS`, `petSVG`). Preserve the official colors: Ghosty pure white + gray eyes + pink nose; Spin tuxedo + hazel eyes; Oakley solid black + amber eyes + gray-white muzzle.
- **World objects / destinations / previews** live in `src/world-art.js` (`OBJECTS`, `DESTINATIONS`, `DECOR`, `PREVIEWS`). Each is a function returning an SVG data URI.
- **Collectibles** come from `src/art.js` (`ITEMS`).
- **Stickers** are registered in `config.js` (`STICKERS`) and mapped to art in `ui.js` (`STICKER_ART`).

### Character consistency checklist

When adding or editing art, confirm:

- Ghosty is **entirely white** with **gray** eyes and a **pink** nose — no peach, cream, orange or flame-point markings.
- Spin is a **black-and-white tuxedo** with a black cap/mask and **yellow-green/hazel** eyes.
- Oakley is a **solid-black** dog with a lighter **gray-white muzzle** and **amber** eyes.

## Accessibility & comfort

- Large buttons and touch targets, generous spacing, no hover-only interactions.
- No multiple-finger gestures; single tap and single-finger drag only.
- Optional gentle background music; the game is fully playable without audio.
- Respects `prefers-reduced-motion` (animations collapse to near-instant).
- No flashing, no sudden loud sounds, no scary content.

## Known limitations / notes

- Physical iPad testing (real Safari touch, orientation change, Add-to-Home-Screen) should still be done on a device; the layout and pointer logic were verified in a desktop Chromium browser and via headless simulation.
- Audio starts only after the first tap, per browser autoplay rules.

## License

Original artwork, code, music and sound for this private family project. Not for redistribution. The title has not been trademark-cleared.