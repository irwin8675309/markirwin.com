# Architecture

Little Canvas is a client-only React/TypeScript PWA. It has no backend and no runtime services beyond static files on GitHub Pages (or any static host).

## High-level structure

```text
React screens
  ├── HomeScreen
  ├── FreeDrawEditor
  ├── ColoringGallery
  ├── ColoringEditor
  └── ArtworkGallery
        │
        ├── Drawing engines (Canvas)
        │     ├── FreeDrawEngine
        │     └── ColoringEngine
        │
        ├── Catalog service (fetch + validate + resolve)
        │
        ├── Image cache (IndexedDB + blob URLs)
        │
        ├── Local storage (IndexedDB)
        │     ├── artwork
        │     ├── catalog
        │     ├── assets
        │     └── drafts
        │
        └── PWA service worker (cache versioned by build)
```

## Screen flow

`App.tsx` owns a small screen-state union:

- `home`
- `coloring`
- `artwork`
- `free`
- `coloring-editor`

Navigation is in-app state rather than a router. This keeps the app simple, avoids nested-path routing problems, and lets editors preserve canvas state while mounted.

When an editor exits without saving, it writes a draft to IndexedDB. When the same editor is opened again, it restores the draft. Saving writes a finished artwork record and removes the draft.

## Drawing engines

### FreeDrawEngine

`src/drawing/FreeDrawEngine.ts`

- Owns a single high-resolution canvas.
- Fills the paper white.
- Draws smooth round-cap segments with pointer coordinates.
- Uses pointer pressure for Apple Pencil when available.
- Uses white paint for the eraser so exported PNGs have a white background.
- Keeps undo/redo snapshots of the canvas.
- Supports loading a previously saved flattened image.
- Produces a full-resolution PNG and a smaller gallery preview.

### ColoringEngine

`src/drawing/ColoringEngine.ts`

The coloring document is layered:

1. **Base layer** — the original black line art, scaled to a working resolution.
2. **Color layer** — the child's transparent paint.
3. **Display canvas** — white paper, color layer, then the base layer composited with `multiply`.

This layering preserves the original outlines while allowing the color layer to be edited, undone, cleared, and saved independently.

The engine supports:

- brush segments with pressure
- eraser via `destination-out` on the color layer
- flood-fill paint bucket
- undo/redo snapshots of the color layer
- clear colors
- exporting the flattened composite
- loading saved base and color layers

### Paint bucket

`src/drawing/floodFill.ts`

The bucket does not recolor the source image. It works on the color layer:

1. Build a barrier mask from the original line art. Dark or translucent pixels are barriers; white page pixels are fillable.
2. Dilate the barrier mask by one pixel to reduce antialiasing leaks.
3. Flood-fill the connected color-layer region from the tapped point.
4. Only pixels matching the starting color and not blocked by a line are changed.
5. Preserve the black outlines because the base layer is always composited on top.

If a tap misses a closed region, the app shows a gentle hint instead of doing nothing silently. If line art is imperfect, the fallback is to use the brush or to regenerate/edit the source image with cleaner closed outlines.

## Catalog and relative paths

### Configuration

`src/config.ts` derives every runtime location from the current document:

- `APP_BASE_URL`
- `CATALOG_URL`
- `SERVICE_WORKER_URL`
- `SERVICE_WORKER_SCOPE`

There are no repository names, usernames, domains, or absolute site paths in the source.

### Catalog loading

`src/services/catalog.ts`

- Fetches `./coloring-library/catalog.json` relative to the deployment folder.
- Uses `cache: "no-store"` so the browser does not indefinitely serve a stale catalog.
- Validates the JSON shape in `catalogValidation.ts`.
- Saves the last successful catalog in IndexedDB.
- Falls back to the cached catalog when offline.
- Resolves image and thumbnail paths with `new URL(path, catalogUrl)`.
- Filters out `published: false` entries.
- Fingerprints the catalog to avoid unnecessary React updates.

### Catalog synchronization

`src/hooks/useCatalog.ts`

- Loads the cached catalog immediately.
- Refreshes from the network on startup.
- Rechecks periodically while the document is visible and online.
- Rechecks on the `online` event.
- Rechecks when the app returns to the foreground.
- Keeps the last successful catalog when the network is unavailable.

New categories and images are data changes only. No application rebuild is required.

## Image caching

`src/services/imageCache.ts`

- Fetches image blobs when online.
- Stores them in the `assets` IndexedDB store keyed by URL.
- Falls back to the stored blob when offline.
- Creates stable blob URLs for React `<img>` and canvas loading.
- Avoids duplicate downloads for the same URL during a session.

Thumbnails and full images are cached only after they are requested. The app shell and catalog are precached by the service worker.

## IndexedDB stores

Database: `little-canvas`

| Store | Key | Contents |
| --- | --- | --- |
| `artwork` | `id` | Finished drawings and coloring pages |
| `catalog` | `id` (`current`) | Last successfully retrieved catalog |
| `assets` | `url` | Downloaded image blobs |
| `drafts` | `id` | Unfinished editor state |

### Artwork record

A saved coloring page stores:

- preview image
- original base image data URL
- child's color-layer data URL
- source ID/name/category
- source URL
- timestamps and dimensions

A saved free drawing stores:

- preview image
- flattened PNG data URL
- timestamps and dimensions

Because the original coloring-page outlines are stored with the artwork, saved artwork remains editable even if the remote coloring library later removes or replaces that page.

## Service worker and offline support

`public/service-worker.js`

- Uses a scope restricted to the app folder.
- Derives all cache URLs from `self.registration.scope`.
- Derives a scope-specific cache name so sibling apps on the same origin do not share or delete each other's caches.
- Reads `cache-version.json` generated at build time and uses a cache name derived from that version.
- Precaches the app shell from `asset-manifest.json`.
- Serves navigation requests network-first, falling back to the cached `index.html`.
- Serves `catalog.json` network-first so new pages are not hidden by a stale cache.
- Serves hashed app assets cache-first.
- Serves coloring images cache-first with background refresh when a cached copy exists.
- Cleans up older app caches on activation.

This design keeps old and new builds from sharing an inconsistent cache during updates. A clean service-worker installation works offline immediately after one online load.

## PWA configuration

- `public/manifest.json`
  - `start_url: "./"`
  - `scope: "./"`
  - relative icon paths
  - standalone display
  - any orientation
- `index.html`
  - relative manifest and icon links
  - Apple touch icon
  - safe-area viewport
- `src/App.tsx`
  - registers the service worker only in production
  - uses the relative service-worker URL and scope

## Relative-path architecture

Vite is configured with:

```ts
base: "./"
```

The production build therefore emits relative asset URLs. At runtime, the app resolves resources from the document URL:

```ts
new URL("coloring-library/catalog.json", document.baseURI)
new URL(imagePath, catalogUrl)
```

The service worker registration scope is also derived from the document URL. The service worker never assumes it controls the parent site.

The build plugin copies `coloring-library/` into `dist/coloring-library/`, writes `asset-manifest.json`, and writes a content-derived `cache-version.json`.

## State and persistence flow

1. Child opens **Free Draw** or **Coloring Book**.
2. Editor creates a canvas engine.
3. If a draft exists, the editor restores it.
4. Drawing/coloring updates the engine and marks the editor dirty.
5. Leaving the editor writes a draft to IndexedDB.
6. Tapping **Save** writes an `ArtworkRecord`, removes the draft, and navigates to **My Artwork**.
7. **My Artwork** loads records from IndexedDB.
8. Opening an artwork restores its stored layers.
9. Export composes a PNG and triggers a download.

## Extending the app

Possible future additions that fit this architecture:

- more brush textures
- sticker/stamp layers
- per-artwork color palettes
- export sizes
- optional cloud export through a user-chosen provider

A native app could reuse the drawing and coloring engines, replacing IndexedDB with a native storage adapter and the service worker with native asset caching.

## Constraints

- No backend.
- No paid APIs.
- No in-app AI generation.
- No admin or parent dashboard.
- No tracking or advertising.
- No external links for children.
- No account system.
- No App Store requirement.