# Coloring Library Guide

The coloring library is a static, data-driven folder inside this project. It is separate from the React source code, but it ships with the app.

```text
coloring-library/
├── catalog.json
├── images/
│   ├── animals/
│   ├── cats/
│   └── ...
├── thumbnails/
│   ├── animals/
│   └── ...
└── metadata/
    └── image-sources.json
```

The app loads `./coloring-library/catalog.json` relative to its deployed location. Image and thumbnail paths in the catalog are resolved relative to the catalog URL.

## Golden rules

- Use **relative paths** in `catalog.json`.
- Do not use absolute URLs, repository names, usernames, or domain names.
- Do not hardcode categories or pages in the React code.
- Do not add an admin UI or upload feature to the app.
- Do not change application code just to add a coloring page.
- Keep thumbnails small; the full image is loaded only when a child opens the page.
- Set `published: false` to hide an image without deleting its files.
- Preserve saved artwork: removing a remote catalog entry never deletes a child's local artwork.

## Adding a coloring page

1. Generate or draw an original coloring image using an external tool.
2. Export it as PNG (preferred) or SVG.
3. Add the full image under a category folder:

   ```text
   coloring-library/images/cats/kitten-002.png
   ```

4. Create a thumbnail. A square thumbnail around 420×420 px is a good default:

   ```text
   coloring-library/thumbnails/cats/kitten-002.png
   ```

5. Add an entry to the correct category in `coloring-library/catalog.json`.
6. Add provenance metadata to `coloring-library/metadata/image-sources.json`.
7. Commit and publish the changes.

The app refreshes the catalog while it is active and on startup. New pages appear automatically; no rebuild or reinstall is required.

## Catalog structure

```json
{
  "version": 1,
  "lastUpdated": "2026-11-15",
  "categories": [
    {
      "id": "cats",
      "name": "Cats",
      "images": [
        {
          "id": "kitten-002",
          "name": "Sleepy Kitten",
          "image": "images/cats/kitten-002.png",
          "thumbnail": "thumbnails/cats/kitten-002.png",
          "format": "png",
          "difficulty": "easy",
          "published": true,
          "description": "A sleepy kitten curled up on a cushion.",
          "sourceType": "AI-generated",
          "provider": "External image tool",
          "generatedDate": "2026-11-15",
          "prompt": "Original thick-line kitten coloring page...",
          "rightsNotes": "Subject to the applicable provider terms.",
          "usageTerms": "Personal and educational use with this app."
        }
      ]
    }
  ]
}
```

### Required image fields

| Field | Description |
| --- | --- |
| `id` | Unique image ID. Use lowercase letters, numbers, and hyphens. |
| `name` | Child-friendly display name. |
| `image` | Full image path, relative to `catalog.json`. |
| `thumbnail` | Thumbnail path, relative to `catalog.json`. |
| `format` | `"png"` or `"svg"`. |
| `difficulty` | `"easy"`, `"medium"`, or `"advanced"`. |
| `published` | `true` to show, `false` to hide. |

### Recommended optional fields

- `description`
- `sourceType`
- `provider`
- `generatedDate`
- `prompt`
- `rightsNotes`
- `usageTerms`

Optional metadata is preserved for provenance. The app ignores unknown future fields so the catalog can evolve.

## Creating a category

Add a new object to the `categories` array:

```json
{
  "id": "space",
  "name": "Space",
  "images": []
}
```

Then add image entries with paths such as:

```text
images/space/rocket-001.png
thumbnails/space/rocket-001.png
```

New categories appear automatically in the gallery once they contain at least one published image. The category order follows the order in `catalog.json`.

## Hiding or removing an image

To hide an image temporarily:

```json
"published": false
```

The app filters out unpublished images during synchronization. To remove it permanently, delete its catalog entry and, if desired, its files. Do not delete local artwork records; they are stored separately in IndexedDB.

## Naming conventions

Use lowercase, hyphen-separated names:

```text
images/<category>/<subject>-<number>.<ext>
thumbnails/<category>/<subject>-<number>.<ext>
```

Examples:

```text
images/dinosaurs/brontosaurus-002.png
thumbnails/dinosaurs/brontosaurus-002.png
images/fantasy/dragon-003.svg
thumbnails/fantasy/dragon-003.png
```

Keep IDs unique across the entire catalog, even if two categories use similar subjects.

## Thumbnails

- Use PNG or SVG.
- Square thumbnails work best in the gallery.
- A 420×420 px thumbnail is a good balance for this app.
- Keep the same visual framing as the full image.
- Do not use a thumbnail with a different aspect ratio unless you intentionally want letterboxing.

## Difficulty levels

- **Easy**: large closed regions, thick outlines, minimal detail.
- **Medium**: more shapes, moderately detailed line art.
- **Advanced**: many smaller regions and finer detail.

Difficulty is display metadata. The paint bucket works from the line art itself; it does not require special metadata.

## Catalog synchronization behavior

- The app fetches the catalog on startup.
- It checks periodically while the app is visible and online.
- It falls back to the last cached catalog when offline.
- It filters out entries with `published: false`.
- It resolves image paths with `new URL(path, catalogUrl)`.
- It caches downloaded images in IndexedDB.
- It keeps saved artwork even if a remote entry is removed.

The service worker uses a network-first strategy for `catalog.json` so a stale cache does not hide new pages indefinitely. If the network is unavailable, the cached catalog is used.

## Publishing workflow

1. Add or replace files in `coloring-library/`.
2. Update `catalog.json`.
3. Update `metadata/image-sources.json`.
4. Commit the changes.
5. Publish the GitHub Pages build or the static site update.

If the site is already online, the app should pick up the new catalog on its next refresh. A full page reload also forces a fresh catalog request.

## Provenance metadata

Record enough information to understand where the image came from and whether it can be used:

- generation provider or author
- generation date
- original prompt or description
- human modifications
- applicable provider terms
- rights and attribution notes

Do not automatically label AI-generated artwork as public domain or CC0.

See [IMAGE_GENERATION_GUIDE.md](./IMAGE_GENERATION_GUIDE.md) for artwork standards.