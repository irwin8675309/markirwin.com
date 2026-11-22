# Installation guide

Grandkids' Magic TV is a local web app. It needs:

- A computer with a USB webcam.
- **Chrome or Edge** (recommended). Firefox/Safari may work but camera + MediaPipe support varies.
- Node.js 22 LTS (Vite 7 needs 20.19 or newer) only for building from source. After a build, `python3` (already on Fedora) is enough to serve and play the app.
- A 16:9 television or monitor (1920×1080 ideal), connected as a second screen or as the main display.

No internet connection is needed while playing. All models, fonts and sounds are local.

---

## 1. Install

### From source

```bash
cd magic-tv
npm install
npm run build
```

### Run the development server

```bash
npm run dev
```

Open **http://127.0.0.1:5173** (the dev server only listens on this computer; to test from another device on purpose use `npm run dev -- --host`). If port 5173 is busy the command stops with an error instead of silently picking another port, so camera permissions and kiosk shortcuts keep working.

### Run the production build

```bash
npm run preview
```

or serve `dist/` with any static server:

```bash
npx serve dist
```

> Use `localhost` or HTTPS. Browsers only expose the camera on secure origins. Opening `dist/index.html` directly with `file://` will **not** work.

---

## 2. Allow camera access

1. Open the app in Chrome/Edge.
2. When the permission prompt appears, choose **Allow**.
3. If you dismissed it:
   - Click the **camera icon** (or the sliders icon) at the left of the address bar.
   - Set **Camera** to **Allow**.
   - Reload the page (F5).
4. Or open `chrome://settings/content/camera`:
   - Enable **Sites can ask to use your camera**.
   - Under **Allowed to use your camera**, add `[http://localhost:5173](http://localhost:5173)` (or your `localhost` port).
5. In the app, press **Try again**.

The start screen shows a live preview and **Magic camera ready** when everything is working.

### Operating-system camera privacy

- **Windows:** Settings → Privacy & security → Camera → allow desktop apps.
- **macOS:** System Settings → Privacy & Security → Camera → enable your browser.
- **Linux:** the user must be in the `video` group (`sudo usermod -aG video $USER`, then log out/in). Check `ls /dev/video*`.

---

## 3. Camera placement

- Put the webcam **above or below the TV**, facing the children.
- The children stand **1.5–3 m (5–10 ft)** away.
- Avoid a bright window directly behind them; light the room from the front if possible.
- A 720p or 1080p USB webcam is enough. 60 fps is not required — the app defaults to 30 fps tracking.

### Calibrate once (recommended)

1. Menu → hold the **bottom-right corner** for ~2.6 s → Settings.
2. **Calibrate tracking area**.
3. The children stand back, hold up their hands and move them around for a few seconds.
4. The app saves the usable area and returns to Settings.

You can skip this: the app also learns the area automatically as the children play.

### Choose the Logitech C922 (or another camera)

Settings → Camera → select **C922 Pro Stream Webcam** (or the model name Chrome shows). The app remembers the camera by name, so re-plugging usually reconnects it. If it cannot open the camera (busy, unplugged, or a flaky USB connection), it automatically uses the default camera and shows a short notice.

Recommended quality: **Medium (1280×720)**. It is sharp enough for hand tracking and much lighter than 1080p on a mini PC.

---

## 4. Fullscreen / kiosk-style

- Press **F** in the app, or Settings → Fullscreen.
- **Linux / Fedora (recommended): use the launcher.** It builds the app the first time, serves it on this computer only, and opens it fullscreen:
  ```bash
  sudo dnf install nodejs python3 chromium    # once (Chromium is in Fedora's own repository)
  cd magic-tv
  scripts/start.sh                            # first run: builds, asks for camera permission
  ```
  The first run asks for camera permission in a small browser window; choose **Allow**. A separate browser profile (`~/.config/magic-tv-browser`) remembers it, so later starts need no clicks. On a dedicated TV computer you can skip the prompt entirely with `MAGICTV_AUTO_CAMERA=1 scripts/start.sh`.
  - `scripts/start.sh --windowed` opens a normal window; `scripts/start.sh --rebuild` rebuilds after you update the code.
  - Chrome (`google-chrome-stable`) or Edge also work and are picked up automatically if Chromium is not installed. Firefox is used only as a last resort.
  - The launcher serves the **production build** (`dist/`) on `127.0.0.1` only. Do not use `npm run dev` for everyday play.
- **Windows:** create a shortcut with:
  ```
  "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --app=http://localhost:5173
  ```
  (start the server first with `npm run preview`)
- **macOS:**
  ```bash
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --kiosk --app=http://localhost:5173
  ```
  (start the server first with `npm run preview`)
- Hide the mouse cursor and disable screen sleep in the OS for a cleaner experience.
- The app itself is designed so children cannot accidentally leave a game: exit requires holding a corner, and there is no browser chrome in kiosk mode.

### Autostart on Fedora (optional)

Run the launcher once by hand first (so the app is built and the camera allowed), then:

```bash
scripts/install-linux-autostart.sh            # start Magic TV when you log in + add a menu entry
scripts/install-linux-autostart.sh --remove   # undo
```

The entry runs `scripts/start.sh`, which starts the local server **and** opens the browser, so the TV never shows a "can't connect" page. The Boot screen still needs one click or key press on **Let's Play** each time (browsers only allow sound after that).

If the camera is unplugged or drops while playing, the screen shows "The magic camera is waking up…" and the app reconnects by itself as soon as the camera is back.

---

## 5. Sound

- Audio begins after the first click/key press (browser autoplay rule). Press **Let's Play** once.
- Adjust master, music and effects volume in Settings → Sound.
- Background music and the friendly voice can be turned off independently.
- Sound is synthesised locally; no downloads.

---

## 6. Multiple children

- Settings → Hands to track: **4 hands (two children)** (default).
- No player assignment or turns are needed; both children interact at once.
- If tracking feels busy, use 2 hands and let the children take turns naturally.

---

## 7. Troubleshooting

| Symptom | Fix |
| --- | --- |
| “Camera permission was blocked” | Allow the camera in site settings, reload, press **Try again**. |
| “No webcam was found” | Check the USB connection, close other camera apps, press **Try again**. |
| “The webcam is busy” | Close Zoom/Teams/other browser tabs using the camera, **Restart camera**. |
| Camera works but no hands | Stand farther back, raise both hands, improve lighting, increase **Sensitivity**. |
| Dot lags behind the hand | Lower **Smoothing**. |
| Dot jitters | Raise **Smoothing**. |
| Low frame rate | Lower video quality to Small, tracking to 30 fps, hands to 2, disable the skeleton. |
| Logitech selected but falls back | Another app is using it, or the USB connection is unreliable. Replug it (USB 3 port), then select it again. |
| App will not close from Settings | Press **Alt+F4** or close the tab; browsers restrict `window.close()`. |
| No sound | Check the tab is not muted, master volume, and the mute toggle. |
| Fullscreen does nothing | Browsers require a click/key press; use the **F** key or the Settings toggle. |

### Reset everything

Settings → **Reset settings**. This clears calibration, volumes and the selected camera.

### Data / privacy reset

The app stores only preferences (volumes, camera choice, calibration area) in `localStorage`. To clear them:

```js
localStorage.removeItem('grandkids-magic-tv/settings/v1')
```

No images, video or personal data are ever stored.

---

## 8. Moving to another computer (Windows 11)

You can run the same app on as many computers as you like. Settings and calibration stay local to each computer; there are no accounts or licences.

1. **Copy the project folder** (for example to a USB stick or network share).
   - It is fine to leave out `node_modules` and `dist` — they are rebuilt/served on the new machine, and `node_modules` is platform-specific.
   - **Keep `public/`** — it contains the MediaPipe model and WebAssembly runtime, so the app works offline.
2. **Install Node.js LTS** on the laptop from <https://nodejs.org> (the LTS installer is fine).
3. Open **PowerShell** in the copied `magic-tv` folder:
   ```powershell
   npm install
   npm run dev
   ```
4. Open **http://localhost:5173** in Chrome or Edge.
5. Allow camera access when prompted. If you dismissed it, use the camera icon in the address bar → **Camera → Allow**, then reload.
6. On Windows, also check **Settings → Privacy & security → Camera → Camera access / Let desktop apps access your camera**.
7. Plug in the USB webcam (USB 3 port recommended), then pick it in **Settings → Camera** if it is not the default.

### Optional: serve a pre-built copy

If you copy the `dist` folder instead of the source:

```powershell
npx serve dist
```

Then open the address it prints. Do **not** open `dist/index.html` directly with `file://` — the camera and local model files will not load.

### Windows kiosk shortcut

Create a shortcut with a target like:

```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --app=http://localhost:5173 --window-position=0,0 --window-size=1920,1080
```

For Edge:

```
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk --app=http://localhost:5173
```

### Notes

- Windows Firewall may ask about Vite/network access; you can cancel it, since the app only uses `localhost`.
- Both computers can run the app at the same time. They do not share settings, camera or progress.
- The same camera cannot be opened by two apps at once. Close other video-call apps if a camera is “busy”.
- If you copy only `node_modules` without running `npm install`, it will likely fail because native build binaries differ between Linux and Windows.

---

## 9. Uninstall

Delete the `magic-tv` folder. Optionally remove the local Chrome kiosk shortcut/autostart entry. Camera footage was never saved anywhere.

---

## 10. For developers

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

See README.md for architecture, the game API and how to add new games.