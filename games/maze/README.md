# Maze Adventures

A complete, gentle, colorful maze adventure for two young children (about ages 3 and 5), starring **Ghosty**, **Spin**, and **Oakley** — the family's real pets.

Built with plain HTML, CSS, JavaScript (ES modules) and Canvas 2D. There is **no build step, no backend, no account, no ads, no analytics, no external network request, and no third-party JavaScript library**. All character, item and world art is original vector artwork generated at runtime; all music and sound effects are synthesized with WebAudio.

---

## Play locally

The game uses ES modules, so it must be served over `http://` (opening `index.html` with `file://` will not work).

```bash
cd maze
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

## Controls

- **Directional buttons** — large D-pad at the bottom left. Press and hold to keep moving; tap for one step.
- **Swipe** — swipe anywhere on the maze in the direction you want to go.
- **Keyboard (desktop)** — arrow keys or `W A S D`; `Escape` pauses.
- **Help buttons** — bottom right:
  - **Show the Way** — a glowing path from your pet to the goal for a few seconds.
  - **Trail** — toggles the whole correct route so your child can follow it.
  - **Hint** — highlights the next correct direction.
- **HUD** — home, restart this maze, and pause.

Movement is grid-based, so characters can never pass through walls. Characters walk smoothly from cell to cell, stop at walls, and face the direction of travel.

---

## What is included

### Characters

| Character | Look | Personality |
| --- | --- | --- |
| **Ghosty** | Entirely pure-white fluffy cat, blue-gray eyes, soft pink nose | Loving, peaceful, gentle |
| **Spin** | Black-and-white tuxedo cat, black cap and eye mask, white face/chest/legs, hazel eyes | Energetic, playful, curious |
| **Oakley** | Solid-black senior dog, gray-white muzzle whiskers, amber eyes, floppy ears, happy tongue | Loyal, cheerful, brave |

Each character has idle movement flourishes: Ghosty floats and sparkles, Spin occasionally spins, and Oakley has a gentle tail-wag/bounce. All three use the same underlying maze mechanics.

The vector artwork is shared with the family's **Pets Game** project and was color-checked against this game's character specification: Ghosty is pure white (no peach ears or forehead patches), Spin keeps his tuxedo markings, and Oakley stays solid black with a gray-white muzzle.

### Four worlds

| World | Look | Collectibles | Destination |
| --- | --- | --- | --- |
| **The Garden** | Green grass, flowers, bushes, butterflies, sunshine | Flowers, butterflies, stars | Flower arch |
| **Enchanted Forest** | Teal woodland, glowing mushrooms, star flowers, fireflies | Acorns, mushrooms, stars | Treehouse |
| **Candy Land** | Pink candy paths, lollipops, gumdrops, candy canes | Candy, lollipops, stars | Candy castle |
| **Treasure Island** | Sand, palm trees, rocks, shells, treasure | Coins, gems, treasure | Treasure chest |

Every world is available immediately and can be replayed at any time.

### Three difficulties

| Level | Grid | Feel |
| --- | --- | --- |
| **Little Explorer** | 6×6 | Wide, gentle paths, very few dead ends, short routes, optional trail |
| **Adventure Explorer** | 10×10 | More turns, some dead ends, side paths, collectibles |
| **Super Explorer** | 15×15 | Winding paths, more dead ends, longer routes, hidden collectibles |

All levels are available immediately. Difficulty comes from maze structure, not from making the character move faster.

### Find Your Friend (optional)

Turn on **Find Your Friend** on the home screen. One of the other two pets hides in the maze. Find them, enjoy a little reunion, and they follow you to the destination. If you reach the goal first, the game gently points you back toward your friend — there is no penalty. This mode works on every difficulty.

### Stickers

Every completed maze awards one sticker. The sticker book shows all 16 stickers: collected ones in full color, uncollected ones as faded silhouettes. Stickers are saved on the device. There is no score, currency, or purchase system.

### Settings (grown-up corner)

- Master sound on/off
- Music and sound-effect toggles
- Music and effects volume
- Controls: **Buttons**, **Swipe**, or **Both**
- Movement speed: **Chill**, **Normal**, or **Zippy**
- **Reset all progress** (two-step confirmation)

### Save data

Progress is stored in `localStorage` under `maze-adventures-progress-v1`. It remembers:

- selected character, world, difficulty and Find Your Friend setting
- completed mazes
- sticker collection
- collected-item totals
- sound/music/effects preferences, volumes, control mode and movement speed

No personal information is collected. Progress is per browser/device.

---

## Project structure

```
maze/
├── index.html              # screens, HUD, controls, modals
├── styles/
│   └── main.css            # responsive layout, themes, animations
├── src/
│   ├── main.js             # boot: load art, create systems, show home
│   ├── config.js           # characters, worlds, difficulties, stickers, defaults
│   ├── art.js              # shared original SVG art for Ghosty/Spin/Oakley + props
│   ├── world-art.js        # world collectibles, destinations, decorations, previews
│   ├── maze.js             # pure maze generation, BFS, validation
│   ├── render.js           # Canvas renderer (static layer + dynamic layer)
│   ├── game.js             # gameplay: movement, collection, rescue, assistance
│   ├── audio.js            # original WebAudio music and sound effects
│   ├── storage.js          # localStorage progress
│   └── ui.js               # screens, selections, settings, sticker book, celebrations
├── assets/
│   └── fonts/              # Baloo 2 (SIL OFL 1.1) + license
├── serve.py                # tiny local web server
├── package.json            # npm start / npm run check
├── .nojekyll               # GitHub Pages: skip Jekyll processing
└── README.md
```

### Maze engine

`src/maze.js` is pure logic and has no DOM dependency:

- **Generation:** randomized depth-first search (recursive backtracker) carves a fully connected maze.
- **Braiding:** easy and medium mazes open some dead ends to keep routes friendly; super explorer keeps the full challenge.
- **Route selection:** BFS distances from a random corner start choose a goal that matches the difficulty's route length.
- **Solvability:** BFS verifies start→goal and that every cell is reachable; an unsolvable layout is regenerated rather than shown.
- **Collectibles:** placed on accessible cells, mostly on the main route with some on side paths. A hidden surprise is placed off the main route.
- **Find Your Friend:** places the hidden pet in a side branch near the middle of the route, excluding collectibles and the goal.
- **Assistance:** BFS powers Hint, Show the Way, Follow the Trail and the "find your friend" beacon.

The engine was stress-tested with 1,500 generated mazes across all three difficulties: every maze was fully connected, solvable, and had accessible collectibles.

### Rendering

- The static maze (sky, island, floor, walls, destination, scenery) is painted once into an offscreen canvas.
- Each animation frame composites the static layer, then draws the trail, hints, collectibles, hidden friend, player and particles.
- The canvas is resolution-scaled for high-density iPad screens and reflows on resize/orientation change.
- The board reserves the actual on-screen control height, so it never sits underneath the D-pad or help buttons.

---

## GitHub Pages deployment

The game works from a subdirectory and uses only relative paths (`styles/main.css`, `src/main.js`, `../assets/fonts/...`, and inline data-URI artwork). No server-side configuration is needed.

### If `maze/` is a folder inside your existing Pages site

1. Copy this `maze/` folder into the repository (do not modify unrelated games).
2. Commit and push.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the branch (for example `main`) and the **`/ (root)`** folder.
6. Open `https://<username>.github.io/<repo>/maze/`.

All assets load from the `/maze/` subdirectory. `.nojekyll` is included so GitHub Pages serves the files as-is.

### If the `maze/` folder is the Pages root

Deploy the branch root as usual and open `https://<username>.github.io/<repo>/`. The same relative paths work.

No build step, no `npm install`, no environment variables.

---

## Testing performed

- **Maze engine:** 1,500 generated mazes across easy/medium/hard — 0 unsolvable, 0 unreachable cells, 0 collectibles on start/goal, 0 duplicate collectible cells.
- **Gameplay:** movement and wall collision, press-and-hold D-pad, swipe gestures, no page scrolling, collection, hidden surprises, hint expiry, show-the-way refresh, trail toggle, pause/resume, restart, completion, Play Again (same seed), Next Maze (new seed).
- **Dynamic rendering:** verified the animation loop paints the player, collectibles, trail, hint, hidden friend and particles (canvas pixel changes), not just the static maze.
- **Find Your Friend:** hidden pet placed off the route, rescue triggers, pet follows, goal requires the friend, completion shows the reunion.
- **Rewards:** sticker awarded, sticker book updates, progress survives reload, two-step reset clears everything.
- **Settings:** sound/music/effects toggles, volume sliders, control modes, movement speed, all persisted.
- **Layouts:** 800×554 desktop, 1024×768 iPad landscape, 768×1024 iPad portrait. No board/control overlap; home fits or scrolls gracefully.
- **Deployment:** served from `/maze/` in a simulated GitHub Pages subdirectory — no 404s, no console errors, fonts loaded.
- **Audio:** no AudioContext before the first interaction; context runs after a tap; mute silences the master bus.

---

## Future-ready extensions

The first version is deliberately single-player and complete. The architecture leaves room for:

- **Two-player cooperative mode:** `MazeGame` already separates player state from rendering, and `MazeRenderer.drawPlayer()` is reusable. A second player can be added as another player state with its own input mapping, without changing the maze engine.
- **Build Your Own Maze:** `generateLayout()` returns a plain layout object (`cols`, `rows`, `cells`, `start`, `goal`, `solution`, `collectibles`, …). A future builder can construct that object and pass it to `MazeGame.load()`; the renderer and theme system do not care how the layout was made.

Neither feature is required for the current game, and neither compromises the core experience.

---

## Credits and licenses

- **Ghosty, Spin, and Oakley artwork** — original vector artwork from the family's **Pets Game**, adapted here for the Maze Adventures character specification.
- **Baloo 2** — SIL Open Font License 1.1. See `assets/fonts/OFL.txt`.
- **Music and sound effects** — original WebAudio synthesis in `src/audio.js`; no audio files.
- **No third-party JavaScript libraries** are used.

All game artwork, code, music and sound design are original to this project and free of branded or franchise imagery.

---

## Known limitations

- Version 1 is single-player. Cooperative play and the maze builder are future-ready but not implemented.
- Progress is stored per browser/device; it does not sync between devices.
- Audio requires a first tap/click because of browser autoplay policies. The game is fully playable with sound off.
- The game is designed landscape-first; portrait works and rearranges the interface.
- iPad Safari hardware testing is still recommended for the final device pass. The code uses standard Pointer Events, Canvas 2D, WebAudio with `webkitAudioContext` fallback, and `ResizeObserver` with a window-resize fallback.