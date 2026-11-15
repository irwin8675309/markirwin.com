# Little Artists

A gentle, iPad-first drawing and coloring studio for children ages 3–5.

Little Artists is a Progressive Web Application built with React, TypeScript, Vite,
HTML5 Canvas, SVG, IndexedDB, CSS animation, and the Web Audio API. It has no backend
and no accounts.

## Original artwork promise

Every illustration, coloring page, sticker, background, interface drawing, icon, and
sound in this project was made specifically for Little Artists inside this repository.

- Coloring pages are original SVG line art. No stock coloring books, commercial
  characters, branded artwork, or copied assets are used.
- Stickers and decorative backgrounds are original SVGs with transparent backgrounds.
- Interface illustrations are original inline SVG/CSS.
- Sounds are synthesized at runtime with the Web Audio API. There are no audio files
  from third parties.
- Icons are original SVGs rendered to PNG for the app manifest.

## Features

### Drawing studio
- Free Draw, Coloring Book, Sticker Studio, and My Artwork.
- Finger and Apple Pencil input through Pointer Events.
- Pressure-responsive strokes with a forgiving default curve.
- Tilt is used as a subtle width/opacity enhancement where the browser exposes it.
- Crayon, marker, paintbrush, rainbow, glitter, and stamp brushes.
- Three large brush sizes, three very large sizes in Easy mode, a large color palette,
  undo/redo, eraser, clear with confirmation, and save.
- Best-effort palm protection: Pencil input pauses touch input for a short grace period
  after the Pencil lifts. A parent can choose Pencil-only mode for stronger protection.

### Coloring book
- 36 original coloring pages across 13 categories, including Horses & Ponies and
  Unicorns.
- Large previews, visual category browsing, and completed-page badges.
- Fill mode with scanline flood fill, line-art barriers, gap tolerance, and a color
  tolerance so neighboring areas stay separate.
- Freehand coloring with every brush and color.
- Original black outlines remain above the color layer.

### Sticker studio
- Original transparent SVG stickers in 12 categories.
- Tap to add, drag to move, corner handle to resize, top handle to rotate, and a delete
  button.
- Decorative backgrounds and free drawing on the same canvas.

### My Artwork
- IndexedDB storage with automatic thumbnails.
- Reopen and continue editing, make copies, download PNGs, share where the Web Share
  API is available, and delete with confirmation.
- My Art Wall slideshow.

### Grown-up corner
- Hold-to-confirm plus a simple adult question.
- Sound toggle.
- Easy / Creative default experience.
- Auto / Pencil-only / Finger-only input modes.
- Artwork management, storage usage, and a full reset.
- No external links, ads, purchases, accounts, or social features.

### PWA
- Web app manifest with original icons.
- Service worker with offline app-shell caching and runtime asset caching.
- Installable from Safari on iPad via Share → Add to Home Screen.
- Works from a subpath such as GitHub Pages because Vite uses a relative base.

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For the most representative layout, use a tablet
sized viewport in landscape.

## Build and test

```bash
npm test
npm run build
npm run preview
```

`npm test` covers flood fill, line-art barriers, stroke smoothing, pressure mapping,
deterministic randomness, template integrity, and sticker-library integrity.

## Deploy to GitHub Pages

A workflow is included at `.github/workflows/deploy.yml`.

1. Push the project to a GitHub repository.
2. In the repository settings, set **Pages → Build and deployment → Source** to
   **GitHub Actions**.
3. Push to `main` or run the workflow manually.
4. The app is published to the Pages URL.

The Vite config uses `base: './'`, so the build also works when hosted under a project
path such as `https://example.github.io/little-artists/`.

For a manual deployment, run `npm run build` and publish the contents of `dist/`.

## Install on an iPad

1. Open the deployed HTTPS URL in Safari.
2. Tap the Share button.
3. Choose **Add to Home Screen**.
4. Launch Little Artists from the home-screen icon.

After the first successful online load, the service worker caches the app shell and
bundled artwork. The core drawing and coloring experience then works offline.

## Apple Pencil testing checklist

Use an actual iPad with Safari. Desktop Chrome is useful for development but is not a
substitute for iPad testing.

1. Draw slowly and quickly with a finger. Check for gaps and smooth joins.
2. Draw with Apple Pencil. Check pressure response and stroke continuity.
3. Rest a palm on the canvas while drawing with the Pencil. Check for stray marks.
   For the strongest protection, open Grown-up Corner and choose **Pencil only**.
4. Draw with Pencil, lift, then immediately touch with a finger. Auto mode ignores
   touch briefly after Pencil use.
5. Rotate the iPad between landscape and portrait. Check that the canvas and tools
   remain usable.
6. Fill several coloring regions. Check that color does not leak through outlines.
7. Save a picture, close Safari, reopen the app, and confirm the artwork is still in
   My Artwork.
8. Turn on Airplane Mode after the first load and confirm drawing, coloring, stickers,
   and saved artwork still work.
9. Check the Grown-up Corner hold and question flow.

### Browser limitation

Safari does not expose a guarantee that palm contact can be perfectly distinguished
from intentional finger drawing. Little Artists uses Pencil-priority input, a touch
grace period after Pencil use, and an optional Pencil-only mode. This is best-effort
palm protection, not native PencilKit palm rejection. A future native iPad app could
replace the `InputManager` implementation with PencilKit while keeping the same
drawing engine and document format.

Tilt is also browser-dependent. When tilt values are unavailable, pressure and tilt
are simply treated as optional enhancements; drawing remains fully usable.

## Project structure

```text
src/
  components/        React screens and controls
  drawing/           Drawing engine, input manager, brushes, smoothing, pressure
  coloring/          Flood fill and coloring engine helpers
  templates/         Original SVG coloring pages
  stickers/          Original sticker and background library
  storage/           IndexedDB artwork storage, settings, PNG rendering
  audio/             Synthesized Web Audio sounds
  hooks/             Shared hooks
  styles/            Design system and responsive styles
  utils/             Shared helpers
tests/               Vitest algorithm and asset-integrity tests
public/              Manifest, service worker, original icons
```

## Development status

Phases 1–3 are implemented: the drawing studio, coloring book, and stickers/artwork.
Phase 4 and 5 remain ongoing: additional creative polish and a physical-iPad testing
pass. The most important remaining work is testing on the target iPad hardware,
especially Pencil pressure, palm contact, offline reloads, and long drawing sessions.

## Privacy

Little Artists does not collect personal information and does not require an account.
Artwork is stored locally in IndexedDB on the device. Sharing only happens when a
grown-up explicitly uses the share control and the iPad share sheet.