# Pets Game

A warm, colorful, original browser adventure starring **Ghosty**, **Spin**, and **Oakley** — a white cat, a black-and-white cat, and a black dog drawn as gentle cartoon versions of the real pets.

Built with HTML5, CSS3, JavaScript, and **Phaser 3**. No backend, accounts, ads, purchases, external APIs, or remote assets are used. All character art, backgrounds, props, and UI illustrations are original SVG artwork generated in `src/art.js`; all music and sound effects are synthesized with WebAudio.

## Run locally

A local web server is required because the game uses JavaScript modules.

```bash
cd pets
python3 serve.py
```

Open **http://127.0.0.1:8080** in Safari, Chrome, or Firefox.

Alternatively:

```bash
python3 -m http.server 8080
# or, if you have Node/npm:
npm start
```

There is no build step and no `npm install` required. Opening `index.html` directly with `file://` will not work because browsers block ES modules from local files.

## iPad / home screen

- Open the game in **Safari on iPad**.
- Use landscape orientation for the best experience.
- Tap the share button → **Add to Home Screen** for a full-screen, app-like feel.
- The layout is responsive and uses large touch targets.
- Double-tap zoom, page scrolling, and pull-to-refresh are suppressed.

## Controls

- **Jump:** tap/click anywhere in the play area, tap the big orange **JUMP** button, press **Space**, or press **Up Arrow**.
- **Pause:** the pause button at the top right.
- **Change pet during a level:** pause, then tap one of the three pet portraits.
- **Sound:** separate music and sound-effect toggles on the menu and in the game HUD.
- There is no keyboard requirement for core play.

## What is included

### Phase 1 — core game
- Animated main menu with a Phaser meadow backdrop.
- Character selection for Ghosty, Spin, and Oakley, with individual idle, run, jump, land, and celebration poses.
- Rainbow Meadow side-scrolling level.
- Automatic forward movement and one-button jumping.
- Puddles, logs, yarn balls, clouds, bubbles, mushrooms, gumdrops, candy canes, and chocolate puddles — all friendly and all recovery-positive.
- Stars, gems, hearts, butterflies, sparkles, ribbons, and golden treats.
- Large collection counter, progress paw, and finish-line celebration.
- localStorage saving for selected pet, completed levels, collected rewards, rescued animals, and sound settings.

### Phase 2 — expanded game
- **Rainbow Meadow**, **Enchanted Forest**, **Cloud Kingdom**, and **Candyland Valley**.
- Two animal-rescue moments per level with a large **Help!** button.
- Animal Sanctuary showing every unique friend the children have helped.
- Original synthesized sound effects and gentle, theme-specific background music.
- Parent-only reset: open the small lock button on the menu and **hold the reset button for about 2.3 seconds**.

### Phase 3 — optional / shared play
- The game is designed for **shared-device and alternating play**: both children can pick a pet, pass the iPad, and take turns. There is no competitive scoring or split-screen mode.
- Progress is saved locally on the device.

## Project structure

```
pets/
├── index.html
├── styles/
│   └── main.css
├── src/
│   ├── main.js
│   ├── config.js
│   ├── art.js
│   ├── audio.js
│   ├── progress.js
│   ├── ui.js
│   └── scenes/
│       ├── BootScene.js
│       ├── MenuScene.js
│       └── AdventureScene.js
├── assets/
│   ├── fonts/
│   └── vendor/phaser.min.js
├── serve.py
└── package.json
```

## GitHub Pages deployment

1. Push this folder to a GitHub repository.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the branch (for example `main`) and the `/ (root)` folder.
5. Wait for the Pages URL, then open it on iPad or desktop.

No build step is needed. All paths are relative and all assets are bundled locally.

## Design notes

- **Original artwork:** Ghosty, Spin, and Oakley are drawn from scratch as vector shapes in `src/art.js`. They are not based on any existing franchise or character.
- **Always positive:** obstacles never cause failure, lives, or a game-over. Contact produces a gentle bounce, splash, or puff and the game continues.
- **No reading required:** the main actions use large illustrated buttons. Text is present for grown-ups and accessibility.
- **Audio is opt-in:** the WebAudio context is created only after the first pointer or keyboard interaction.
- **Offline-friendly:** once loaded, there are no network requests.
- **Kid-safe:** no ads, analytics, accounts, external links, purchases, or personal-data collection.

## Testing notes

- Tested in Chromium at a small landscape viewport (800 × 554) and through the full menu → pet selection → world selection → gameplay → rescue → finish → next-world flow.
- Verified jump input, obstacle contact and recovery, collectible pickup, rescue completion, pause/character switching, sound toggles, level unlocking, localStorage persistence, parent reset, and all four environment starts.
- iPad Safari device testing is still recommended for the final hardware pass. The code uses standard Pointer Events, WebAudio with `webkitAudioContext` fallback, and Phaser's WebGL/Canvas renderer.
- If you see a blank loading screen, make sure the game is being served over `http://` rather than opened as a `file://` URL.

## Known limitations

- Two-player is shared/alternating rather than simultaneous split-screen.
- Progress is stored per browser/device; it does not sync between devices.
- The game is designed for landscape orientation. Portrait works, but the playfield is letterboxed.
- Audio quality depends on the device's WebAudio implementation; all audio is generated locally and is intentionally soft.

## Third-party licenses

- **Phaser 3.90.0** — MIT. See `assets/vendor/Phaser-LICENSE.md`.
- **Baloo 2** — SIL Open Font License 1.1. See `assets/fonts/OFL.txt`.

All game artwork, code, music, and sound design are original to this project.