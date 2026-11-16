# Little Canvas

A polished, child-friendly drawing and coloring-book PWA for young children, designed first for iPad. It includes a free-draw canvas, a data-driven coloring library, a paint bucket, undo/redo, local artwork saving, and offline support.

Everything lives inside this project folder. There is no backend, no account system, no paid API, no analytics, and no advertising.

## What it includes

- Large, illustrated home screen with three activities: **Free Draw**, **Coloring Book**, and **My Artwork**.
- Finger drawing and Apple Pencil pressure support.
- Multiple brush sizes, a large color palette, eraser, undo/redo, and clear.
- Paint-bucket coloring that preserves the original black outlines.
- Coloring categories and pages loaded from `coloring-library/catalog.json`.
- Saved artwork stored in IndexedDB, including the original coloring-page outlines and the child's color layer.
- Draft recovery when leaving an unfinished drawing or coloring page.
- Offline app shell, cached coloring images, and cached catalog.
- Installable PWA with a relative manifest and a service worker scoped to this folder.
- Export artwork as PNG.
- No administrative interface, image upload UI, or in-app AI generation.

## Technology

- React 19
- TypeScript
- Vite
- HTML5 Canvas
- IndexedDB
- Service Workers
- Static JSON catalog
- GitHub Pages-friendly relative paths

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build and preview

```bash
npm run build
npm run preview
```

The production build is written to `dist/`. The build automatically copies `coloring-library/` into `dist/coloring-library/` and generates:

- `dist/asset-manifest.json` — app-shell files to precache.
- `dist/cache-version.json` — cache version used by the service worker.

## Relative-path design

The app never assumes it is hosted at a domain root.

- Vite is configured with `base: "./"`.
- The catalog is loaded from `./coloring-library/catalog.json` and resolved against the current document URL.
- Catalog image paths are resolved with `new URL(imagePath, catalogUrl)`.
- The manifest uses `start_url: "./"` and `scope: "./"`.
- The service worker is registered relative to the current document, and its cache keys are derived from its own registration scope.
- All artwork, icons, CSS, JavaScript, and catalog references are relative.

This means the same build can be served from:

```text
https://example.com/games/drawing-app/
https://example.com/projects/drawing-app/
https://example.com/anything/else/
```

You can move or rename the entire folder and redeploy it without source changes.

## GitHub Pages deployment

The app is a static site. It has no server-side requirements.

### Option A: deploy this app at the Pages site root

1. Push this project to a GitHub repository.
2. Build with `npm run build`.
3. Publish the contents of `dist/` with GitHub Pages.
4. Open the Pages URL and, on iPad Safari, use **Share → Add to Home Screen**.

### Option B: publish inside an existing site at a nested path

Because the app uses relative paths, it also works when the built files are placed under a subfolder such as:

```text
games/
  drawing-app/
    index.html
    assets/
    coloring-library/
    manifest.json
    service-worker.js
```

Publish the **contents of `dist/`** into that nested folder. Do not publish the Vite source folder itself. If the parent site is built by a static-site generator or GitHub Actions workflow, copy `dist/` into the nested path as part of that workflow.

For example, the deployed URL may look like:

```text
https://<username>.github.io/<repository>/games/drawing-app/
```

No code change is needed for that path.

### PWA scope

The service worker is intentionally scoped to the folder containing `index.html`. It will not try to control the parent website. The manifest also uses a relative start URL and scope.

## Updating the coloring library

Coloring pages are managed as data and files, not application code.

Short workflow:

1. Create or generate an original coloring image outside the app.
2. Save it as PNG or SVG under `coloring-library/images/<category>/`.
3. Create a thumbnail under `coloring-library/thumbnails/<category>/`.
4. Add an entry to `coloring-library/catalog.json`.
5. Add provenance details to `coloring-library/metadata/image-sources.json`.
6. Commit and publish.

The app retrieves the catalog automatically. No rebuild, reinstall, or app update is required for new pages or new categories.

See [COLORING_LIBRARY_GUIDE.md](./COLORING_LIBRARY_GUIDE.md).

## Image generation policy

The application itself contains **no AI image-generation feature**. New artwork is generated externally with an approved tool and manually uploaded to the GitHub library.

See [IMAGE_GENERATION_GUIDE.md](./IMAGE_GENERATION_GUIDE.md) for line-art standards, prompt guidance, naming, difficulty levels, and rights documentation.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the drawing engine, coloring engine, catalog sync, caching, IndexedDB stores, and portability design.

## Project layout

```text
.
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   ├── manifest.json
│   ├── service-worker.js
│   └── icons/
├── src/
│   ├── components/
│   ├── drawing/
│   ├── hooks/
│   ├── services/
│   ├── storage/
│   ├── styles/
│   ├── App.tsx
│   ├── config.ts
│   ├── main.tsx
│   └── types.ts
├── coloring-library/
│   ├── catalog.json
│   ├── images/
│   ├── thumbnails/
│   └── metadata/
└── dist/                 # generated by npm run build
```

## Zero-cost notes

The app is designed for zero ongoing operating costs:

- GitHub Pages hosting for the static build.
- A static JSON catalog.
- Browser IndexedDB and Cache Storage.
- No backend, database, or paid API.
- No paid image generation inside the app.

GitHub Pages free-tier limits can change. Check the current GitHub Pages documentation for repository size, bandwidth, and build limits. Keep coloring images reasonably sized, use thumbnails in the gallery, and avoid committing unnecessary large files.

## iPad install

1. Open the deployed app in Safari.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Open it from the home screen for the full standalone experience.

The app supports portrait and landscape layouts and respects safe-area insets.

## Development checks

```bash
npm run typecheck
npm run build
```

Manual checks worth repeating after changes:

- Draw with a finger and with Apple Pencil.
- Change brush size and color.
- Erase, undo, redo, and clear.
- Open a coloring page and use the fill tool.
- Save artwork and reopen it from **My Artwork**.
- Go offline and reopen previously downloaded pages.
- Add a new image to `catalog.json` and confirm it appears without rebuilding.
- Deploy the build in a nested folder and confirm the manifest/service worker scope.

## Child-safety and privacy

- No ads.
- No purchases or subscriptions.
- No accounts.
- No external links for children.
- No analytics or tracking.
- No administrative or parent section.
- No in-app AI prompting.

Saved artwork stays in the browser on the device. Clearing site data or Safari storage removes local artwork; export important pictures as PNG.