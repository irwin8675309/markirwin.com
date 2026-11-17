# Pet Tilt Adventures

A gentle, colourful iPad game for two young girls (about 3 and 5). Instead of
buttons, the marble is steered by **physically tilting the iPad** — like
rolling a marble around a real board.

Three recurring pets star in three adventure worlds:

| World | Pet | Feel |
| --- | --- | --- |
| **Garden Paths** | **Ghosty** — a completely pure-white cat with blue-grey eyes | peaceful flowers, butterflies and soft sunshine |
| **Treat Chase** | **Spin** — a black-and-white tuxedo cat with hazel eyes | playful toys, tunnels and tasty treats |
| **Treasure Trails** | **Oakley** — a solid-black senior dog with grey/white muzzle whiskers and amber eyes | palm trees, wooden bridges and hidden treasure |

No ads, no accounts, no purchases, no personal data, no network requests.
Everything (art, music, sound effects) is generated locally in the browser.

---

## Quick start

The game uses ES modules, so it needs to be served over `http://` (opening
`index.html` from `file://` will not work).

```bash
cd tilt
python3 serve.py
```

Then open **http://127.0.0.1:8080**.

Alternatives:

```bash
python3 -m http.server 8080
# or
npx serve .
```

### Playing on an iPad

1. Open the game in **Safari** (it must be an **https://** page for motion
   sensors — see below).
2. Tap **LET’S PLAY**.
3. Tap **START** on the “Hold your iPad comfortably” screen and allow motion
   access when Safari asks.
4. Hold the iPad however is comfy (lap, pillow, both hands) and hold still for
   a moment while it finds your neutral position.
5. Tilt gently to roll the marble.

For an app-like experience: **Share → Add to Home Screen**.

> **HTTPS is required for tilt.** Safari only exposes motion sensors on secure
> pages. GitHub Pages provides HTTPS. On `http://` or `file://` the game
> detects this and offers the big arrow buttons instead.

---

## How to play

- **Roll** by tilting. The marble accelerates gently, keeps a little momentum,
  and slows down through friction.
- **Collect** flowers / treats / coins and stars. They are always optional.
- **Reach the hole** at the end of the trail to finish the adventure.
- **Checkpoints** light up as you pass. If the marble ever gets stuck it is
  gently returned to the last checkpoint — nothing is lost.
- **Buttons** (large, top of the screen): Pause · Reset · Recalibrate ·
  Show the way · Sound.
- **Touch fallback**: big arrow buttons appear automatically if the browser has
  no motion sensor, or can be selected in Settings.

### Difficulty (all available immediately)

| Level | Paths | Obstacles | For |
| --- | --- | --- | --- |
| **Little Paws** | wide, gentle, short | a couple of soft bushes | ~3 years |
| **Happy Paws** | winding, with bridges | more obstacles, one moving bumper | ~4 years |
| **Super Paws** | twisty, narrow, longer | more obstacles, several moving bumpers | ~5 years |

Difficulty changes **level design** (width, turns, obstacle count, moving
obstacles) and the marble tuning — it never just makes the ball faster. Every
generated level is checked to be passable (see *Testing*).

---

## Features

- Tilt control with **permission handling**, **calibration**, **dead zone**,
  **three sensitivities**, **smoothing**, **axis flips** and **live tilt test**.
- Screen-orientation-aware maths: left/right/forward/back always match what the
  player sees, in portrait, both landscape orientations and upside down.
- Fixed-timestep physics (120 Hz) with sub-stepping so the marble can never
  tunnel through a wall.
- The marble is kept on the trail by construction; obstacles are circles that
  push it away softly.
- Three pets with consistent artwork, blinking, happy reactions and a
  companion that runs beside the marble.
- Collectibles, hidden surprises (butterfly / yarn / treasure chest),
  checkpoints, target hole, confetti celebrations.
- Sticker book with 12 stickers (saved locally).
- Gentle synthesised music per world and soft sound effects (WebAudio).
- Pause freezes physics and clears stored motion input, so the marble never
  jumps when play resumes.
- Auto-pause when the tab is hidden; orientation changes re-calibrate gently.
- Fully responsive, touch-first UI with no keyboard or hover requirement.

---

## Settings (grown-ups)

Open the gear button on the home screen:

- **Tilt sensitivity** — Gentle / Normal / Sensitive.
- **Dead zone** — ignores tiny hand wobbles.
- **Controls** — Tilt / Arrows / Auto (Auto falls back to arrows if the device
  cannot tilt).
- **Flip sideways / up-down** — if a particular iPad reports axes differently.
- **Tilt test** — watch the pink bubble follow your hands.
- **Marble speed** — Sleepy / Normal / Zippy.
- **Gentle guidance** (soft arrow to the goal) and **Show the way** button.
- **Starting difficulty**, **music**, **sound effects**, **volume**.
- **Reset progress** (asks for confirmation first).

---

## Project structure

```
tilt/
├── index.html              # screens and HUD
├── styles/main.css         # all styling (Baloo 2, rounded kid-friendly UI)
├── src/
│   ├── main.js             # bootstrap + dev/test hash links
│   ├── config.js           # worlds, characters, difficulties, stickers
│   ├── art.js              # original SVG pets + item artwork (data URLs)
│   ├── storage.js          # localStorage save data
│   ├── motion.js           # DeviceOrientation permission, calibration, smoothing
│   ├── physics.js          # marble physics + collisions (no DOM)
│   ├── levels.js           # seeded procedural level generation
│   ├── render.js           # canvas renderer, sprites, particles
│   ├── audio.js            # WebAudio music + sound effects
│   ├── game.js             # fixed-timestep loop and rules
│   └── ui.js               # screens, HUD, settings, stickers
├── assets/fonts/           # Baloo 2 (SIL OFL 1.1)
├── tests/levels.test.mjs   # level passability + containment checks
├── serve.py                # no-cache dev server
├── package.json
└── .nojekyll               # so GitHub Pages serves the folder as-is
```

No build step, no package install, no external runtime dependencies.

### Character artwork

Ghosty, Spin and Oakley are drawn from scratch as SVG in `src/art.js`, reusing
the exact character artwork and palette from the family's earlier
[Pets Game](../pets) so the pets always look the same. Ghosty is always pure
white; Spin keeps his tuxedo mask and chest; Oakley keeps his solid-black coat
with grey/white muzzle whiskering and amber eyes.

---

## Save data

Progress lives in `localStorage` under the key `pta.save.v1`:

- selected world and difficulty, current level per world
- completed levels
- collected stickers
- sound / music / volume, sensitivity, dead zone, control mode, axis flips,
  marble speed, guidance options

Nothing leaves the device. If storage is unavailable (private mode), the game
keeps working for the session and says so in Settings.

---

## GitHub Pages deployment

The game is designed to live in a **subdirectory** of an existing Pages site,
for example `https://example.github.io/pet-tilt-adventures/`.

1. Copy this folder into the site repository (do not touch sibling folders).
2. Keep `.nojekyll` so GitHub Pages does not try to run Jekyll on the folder.
3. Push to the Pages branch. No build step is required.
4. In **Settings → Pages**, deploy from the branch/folder that contains
   `index.html`.

All asset paths are **relative** (`styles/main.css`, `src/*.js`,
`assets/fonts/*`), so the game works from any subdirectory. Serve it over
HTTPS (GitHub Pages does this automatically) so tilt controls are available.

To check the deployment: open the Pages URL on an iPad in Safari, allow motion,
and confirm that tilting left/right/forward/back moves the marble the way the
screen looks.

---

## Testing

### In-repo level validation

```bash
node tests/levels.test.mjs
```

This checks all 54 generated levels (3 worlds × 3 difficulties × 6 levels):

1. **Passability** — a grid flood-fill proves the marble always has a
   continuous, obstacle-free route from start to goal. Obstacles are
   radius-capped and evenly spaced so they can never seal a trail.
2. **Containment** — 20 seconds of random tilt input never pushes the marble
   off the trail.

### Verified during development (headless Chrome, DevTools protocol)

- **Tilt maths** with synthetic `deviceorientation` events at screen angles
  0°, 90°, −90° and 180°: “right edge down” rolls the marble right and “top
  edge down” rolls it up in every orientation; neutral stays still; dead zone,
  sensitivity and axis flips behave correctly; pause clears stored input.
- **Full play flow**: home → play → calibration/permission fallback → game →
  touch controls → pause/resume → completion → sticker → next level → sticker
  book → settings → reload persistence.
- **Rendering**: pixel probes confirm the marble, path, grass, pet companion,
  obstacles and collectibles are actually drawn.
- **Layout** at 1180×820, 1024×768, 820×1180, 1366×1024 and 800×600: no page
  scrolling, all controls inside the viewport, HUD and touch pad never overlap.
- No console errors or page exceptions in any of those runs.

### Still to do on real hardware

**The motion controls have not been physically tested on an iPad.** The sensor
maths is verified with synthetic events and follows the W3C
`DeviceOrientation` model, but real devices vary. Please run this check on the
actual iPad:

1. Play a Little Paws level in each orientation you expect to use.
2. Tilt the right edge down — the marble should roll right.
3. Tilt the top edge away — the marble should roll up.
4. Put the iPad flat and still — the marble should not drift.
5. Press Pause, wait, press Resume — the marble must not jump.
6. Press Recalibrate, hold comfortably, press START — play continues smoothly.

If any axis feels reversed on your device, open **Settings → Flip sideways /
Flip up-down**. That is the supported per-device correction, and it is saved.

### Dev/test shortcuts

Append a hash to jump straight into a level (useful for checking a specific
world or difficulty):

```
index.html#play=garden:little:0        # world:difficulty:levelIndex
index.html#play=treasure:super:2&touch=1
```

---

## Design notes

- Always positive: no lives, no timers, no failure states, no penalties.
- Collectibles are optional; finishing is always enough for a celebration and a
  sticker.
- Text is only there for grown-ups — the main actions are pictures and colour.
- Audio starts only after a real tap, and the game is fully playable muted.
- `prefers-reduced-motion` disables the decorative CSS animations.

## Credits

- **Baloo 2** — SIL Open Font License 1.1 (`assets/fonts/OFL.txt`).
- Character artwork, code, music and sound design are original to this family's
  projects; Ghosty, Spin and Oakley are based on the family's real pets.