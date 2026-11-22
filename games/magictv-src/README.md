# Grandkids' Magic TV

Turn an ordinary television into a magical playground for two young children (about 3 and 5 years old). A webcam watches the room, MediaPipe finds their hands, and the children pop bubbles, paint with their fingers in the air, make a friendly character dance, grow a butterfly garden, pop balloons and explore an underwater world — no controllers, no mouse, no reading required.

Everything runs locally. The camera is never recorded or uploaded.

---

## Quick start

```bash
npm install
npm run dev
```

Open **http://127.0.0.1:5173** in Chrome or Edge, allow camera access, and press **Let's Play**.

**For everyday use on the TV computer (Linux/Fedora)**, use the launcher instead of the dev server. It builds once, serves the app on this computer only, and opens it fullscreen:

```bash
scripts/start.sh
```

See [INSTALL.md](INSTALL.md#4-fullscreen--kiosk-style) for autostart on login.

For a production build you serve yourself:

```bash
npm run build
npm run preview
```

The app is designed for a 16:9 television at 1920×1080. Press **F** (or use Settings → Fullscreen) to fill the screen. See [INSTALL.md](INSTALL.md) for kiosk-style setup on Linux, Windows and macOS.

> No internet is needed after installation. The MediaPipe model and WebAssembly runtime are included in `public/`.
>
> **Moving to another computer:** copy the folder (leave out `node_modules`), install Node.js LTS, then run `npm install` and `npm run dev` there. Windows 11 instructions, kiosk shortcuts and camera-permission steps are in [INSTALL.md](INSTALL.md#8-moving-to-another-computer-windows-11). Both computers can run the app independently.

---

## New in round 2

- **Far-away hands** (Settings → Tracking): when nobody is seen for 2 seconds the camera also looks at zoomed-in crops of the picture, and locks on when it finds a small, distant hand. Uses a second copy of the hand model, loaded only when needed. Turn it off in settings if it ever causes trouble.
- **Waiting screen**: the game pictures take turns bouncing when nobody has been seen for a few seconds, and the friendly "Wave your hand" message appears on the menu too.
- **Save my painting**: a new Save button in the painting dock saves the picture as a PNG.
- **Rest reminder** (Settings → Screen & grown-ups): optional "Time for a little rest" screen after 10/20/30 minutes of play. Hold the Grown-ups corner to continue.
- **Install and offline**: a web-app manifest and offline helper (service worker) let it be added to a home screen and run without internet after the first load.

## The six games

| Game | What children do |
| --- | --- |
| **Magic Bubble Pop** | Point at bubbles to pop them, sweep an open hand through a crowd, pinch a bubble to grow it, release for a big pop. Rainbow, star, animal, giant, firework and splitting bubbles. |
| **Magic Finger Painting** | Point to paint, open the hand for wide rainbow strokes, pinch to change colour. Glitter, star, bubble and stamp brushes. Hold both fists to clear. |
| **Magic Character** | Wave and the character waves back, raise both hands to make it jump, move hands side to side to make it dance, clap to celebrate, pinch for a kiss. Five original characters appear over time. |
| **Butterfly Garden** | Wave to make flowers grow, touch flowers to bloom them, guide butterflies with your hands, clap for a petal shower. Find the golden butterfly. |
| **Balloon Party** | Pop balloons, swipe through several, pinch to grab and carry one, release to let it float away. Two pinching hands charge a giant balloon. |
| **Underwater Adventure** | Guide fish and dolphins, pop bubbles, point at creatures for tricks, move both hands to make currents. |

There are no scores, timers, lives or game-over screens. Play continues indefinitely.

---

## Grown-up controls

Children should never get stuck, and grown-ups should never have to hunt through menus.

| Action | How |
| --- | --- |
| Pick a game | Point at a picture and hold for about a second (or click it). |
| Open grown-up settings | Hold the **bottom-right corner** of the menu for ~2.6 seconds (mouse/finger, or hold a hand still there). |
| Return to the menu | Hold the **top-right corner** during a game for ~2.2 seconds, or press **Esc**. |
| Fullscreen | Press **F**, or Settings → Fullscreen. |
| Jump straight to a game | Press **1**–**6** on the menu (handy for testing). |
| Close settings | **← Back to games** button, or **Esc**. |

### Settings include

- Camera selection, live preview, video quality (640 / 1280 / 1920).
- Tracking sensitivity and smoothing.
- Mirror mode, hand skeleton overlay.
- Hands to track (2 or 4) and tracking speed (30 or 60 fps).
- Calibration of the usable tracking area.
- Master, music and sound-effect volume; mute; friendly voice on/off.
- Pretend-hands demo mode (play without a camera).
- Reset settings, fullscreen, exit.

---

## Camera setup

1. Plug the USB webcam into the computer (USB 3 is best for 1080p).
2. Open the app in Chrome or Edge on `localhost` (or HTTPS).
3. When the browser asks, choose **Allow** for camera access.
4. The start screen shows a live preview and **Magic camera ready**.
5. For best tracking:
   - Mount the camera above or below the television, facing the children.
   - Light the room reasonably well; avoid a strong window directly behind the children.
   - Have the children stand 1.5–3 m (5–10 ft) from the TV.
   - Use **Settings → Calibrate tracking area** once: the children stand back, hold up their hands and move them around for a few seconds. This is optional — the app also learns the area automatically while playing.

If the selected camera is unplugged, busy in another app, or Chrome changed its device id, the app falls back to the default camera and shows a short notice. Open Settings → Camera to pick again.

### Using the Logitech C922 (or any 1080p webcam)

The app lists every camera Chrome reports, for example:

- `C922 Pro Stream Webcam`
- `HP Truevision HD`

Choose the Logitech in **Settings → Camera**. The app remembers it by its friendly name as well as its device id, so re-plugging usually keeps working. Medium quality (1280×720) is recommended: 1080p looks sharper but costs more CPU on a mini PC.

If Chrome cannot open the Logitech at all, close other apps using it, then unplug/replug it (ideally a different USB port), and press **Restart camera**. Some USB webcams deliver corrupted frames on certain kernels/cables; in that case the built-in HP-style camera or another webcam is the practical fallback.

---

## Using it without a camera

On the start screen choose **Try pretend hands** (or Settings → Pretend hands). Two synthetic hands move around and every game is fully playable. This is useful for testing the TV end-to-end before the children arrive.

---

## Privacy

- Camera frames are processed in the browser by MediaPipe, locally.
- Nothing is recorded, saved, uploaded or sent anywhere.
- No accounts, ads, analytics or tracking.
- No facial recognition or identity features.
- The camera is released when pretend-hands mode is on, and stops when the tab/app closes.
- The camera indicator is always visible on the start screen, menu and settings.

---

## How it works

```
Webcam → <video> → MediaPipe Hand Landmarker (21 landmarks per hand)
       → hand matching + One Euro smoothing → gestures
       → FrameState ref → game update/draw on a 1920×1080 canvas
```

- **Camera/tracking engine** (`src/camera`, `src/tracking`): device selection, graceful recovery, up to 4 hands, stable hand ids, smoothing, pinch/open/point/fist, wave/clap/together/apart detection, automatic area learning and simple calibration.
- **Game framework** (`src/games`): each game is a small module with `enter`, `update`, `draw` and optional `onGesture`. Add a new folder and register it — no core changes.
- **Shared effects** (`src/games/shared`): particle system (pops, sparkles, confetti, petals, fireworks, hearts, floating text) and the "magic hand" cursor so children can always see where the TV thinks their hands are.
- **Audio** (`src/audio`): every sound is synthesised with the Web Audio API — no audio files, no downloads. Optional friendly voice uses the browser's local speech synthesis.
- **Presentation** (`src/components`): boot, hand-operated main menu, settings, calibration, tracking test, grown-up hold-corners.

### Project structure

```
grandkids-magic-tv/
├── public/
│   ├── models/hand_landmarker.task      # local MediaPipe model
│   └── mediapipe-wasm/                  # local vision runtime
├── src/
│   ├── camera/CameraProvider.tsx        # camera + tracking loop + calibration
│   ├── tracking/                        # MediaPipe wrapper, hand builder, tracker, gestures, demo
│   ├── gestures/ (see tracking/gestures.ts)
│   ├── games/
│   │   ├── bubble-pop/ finger-painting/ magic-character/
│   │   ├── butterfly-garden/ balloon-party/ underwater-adventure/
│   │   ├── shared/                      # particles, cursors, HUD helpers
│   │   ├── registry.ts                  # game list
│   │   └── types.ts                     # GameDefinition / GameInstance
│   ├── audio/AudioEngine.ts
│   ├── components/                      # screens, menu, settings, hold zones
│   ├── settings.ts  styles/  utils/  types.ts
│   ├── App.tsx  main.tsx
├── README.md  INSTALL.md
```

### Adding a new game

1. Create `src/games/my-game/MyGame.ts`:

```ts
import type { GameContext, GameDefinition, GameInstance } from '../types';
import { Particles } from '../shared/particles';
import { drawHandCursors } from '../shared/hud';

class MyGame implements GameInstance {
  private particles = new Particles();
  enter(ctx: GameContext) { ctx.audio.speak('Let us play!'); }
  update(ctx: GameContext) {
    for (const hand of ctx.frame.hands) {
      // hand.tip / hand.palm are in 1920×1080 world coordinates
      if (hand.pinchActive) this.particles.sparkleBurst(hand.tip.x, hand.tip.y, 8);
    }
    this.particles.update(ctx.dt);
  }
  draw(ctx: CanvasRenderingContext2D, g: GameContext) {
    ctx.fillStyle = '#123';
    ctx.fillRect(0, 0, 1920, 1080);
    this.particles.draw(ctx);
    drawHandCursors(ctx, g.frame, g.settings);
  }
  onGesture(e, ctx) { /* e.type === 'wave' | 'clap' | ... */ }
}

export const myGame: GameDefinition = {
  id: 'my-game', title: 'My Game', adultLabel: 'My Game',
  voice: 'Let us play!', colors: ['#6ff2ff', '#ff8ad8'],
  create: () => new MyGame(),
};
```

2. Add `myGame` to `GAMES` in `src/games/registry.ts`.
3. (Optional) add artwork in `src/components/GameArt.tsx`.

The menu, dwell selection, audio, fullscreen and grown-up controls come for free.

Hand fields worth knowing:

| Field | Meaning |
| --- | --- |
| `hand.tip` | main touch point (fingertip or pinch midpoint) |
| `hand.palm` | centre of the palm |
| `hand.radius` | forgiving touch radius in world pixels |
| `hand.open` / `pointing` / `fist` / `pinchActive` | easy child-friendly states |
| `hand.velocity`, `hand.speed` | smoothed world pixels/second |
| `hand.landmarks` | 21 MediaPipe landmarks in world coordinates |
| `ctx.frame.events` | `wave`, `clap`, `pinch`, `release`, `handsTogether`, `handsApart`, `bothHandsUp`, ... |

Coordinates are 1920×1080 with the origin at the top-left and y pointing down, regardless of window size.

---

## Performance

- Default tracking 30 fps, rendering on `requestAnimationFrame` (up to 60).
- If the TV/PC feels sluggish:
  - Settings → Video quality **Small (fastest)**.
  - Tracking speed **30 fps**.
  - Hands to track **2**.
  - Turn off the hand skeleton.
  - Close other browser tabs.
- Games use a single 1080p canvas; effects are pooled and capped (1000 particles).
- The app targets ordinary desktops and mini PCs, not gaming hardware.

---

## Troubleshooting

| Problem | Try |
| --- | --- |
| “Camera permission was blocked” | Click the camera icon in the address bar → Camera → Allow → reload. See INSTALL.md. |
| “No webcam was found” | Plug in the webcam, close other camera apps, press **Try again**. |
| “The webcam is busy” | Close Zoom/Teams/other tabs, then **Restart camera**. |
| Camera works but no hands appear | Improve lighting, stand 1.5–3 m away, hold hands up, raise **Sensitivity**. |
| Tracking jitter | Raise **Smoothing**. Lower it if the dot feels laggy. |
| Everything is slow | Lower video quality / tracking speed, turn off the skeleton. |
| Selected camera keeps falling back | It may be busy or have a flaky USB connection. Replug it, try another port, or pick the other camera. |
| Window will not close from Settings | Browsers block `window.close()` for normal tabs. Press **Alt+F4** or close the tab. |
| No sound | Check the master volume, mute toggle and browser tab mute. Audio starts after the first click (browser rule). |

---

## Development

```bash
npm install
npm run dev        # http://127.0.0.1:5173 (this computer only)
npm run typecheck
npm test           # unit tests for hand tracking and gestures (uses tsx via npx)
npm run build
npm run preview
```

Debug handles are available in `npm run dev`, or in a production build opened with `?debug` at the end of the address (for example `http://127.0.0.1:5173/?debug`). They are off for normal play. In the browser console:

```js
__magicTV.getFrame()   // latest hands, gestures, fps
__magicTV.getScreen()  // 'boot' | 'menu' | 'game' | 'settings' | 'tracking'
__magicTV.getGame()    // current game id
__magicPerf            // { fps, renderMs }
```

Number keys **1–6** open games directly from the menu.

---

## Credits

- Hand tracking: [MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe) (Apache-2.0), running locally.
- Artwork, game logic and sound synthesis: original to this project. No branded or copyrighted characters.
- Built with React, TypeScript, Vite and the Web Audio API.

**Privacy by design:** no network calls during play, no recording, no accounts, no analytics.