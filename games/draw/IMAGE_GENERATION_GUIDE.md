# Image Generation Guide

This guide is for the person who creates coloring pages outside the app. The app itself has **no AI image-generation feature** and no upload interface. Images are generated externally, reviewed, and committed to the coloring library.

## Image goals

A good coloring page for a 3–5 year old should be:

- Instantly recognizable.
- Friendly and calm.
- Made of large, closed shapes.
- Free of tiny details that are hard to fill.
- Free of text, logos, watermarks, and signatures.
- Printable or viewable on a white background.
- Original and age-appropriate.

## Recommended output

- **Format**: PNG preferred; SVG supported.
- **Canvas**: square is easiest, for example 1024×1024 or 1536×1536.
- **Background**: pure white.
- **Outlines**: pure black or near-black `#111111`.
- **Line weight**: thick and consistent. At 1024×1024, roughly 10–16 px is a good starting point.
- **Color**: none. No gray shading, gradients, texture, or color fills.
- **Text**: none in the artwork.
- **Watermark**: none.
- **Margins**: leave a little breathing room around the subject.

## Line-art standards

1. Use closed outlines around every region you want a child to fill.
2. Avoid gaps where two lines should meet. Small gaps can cause paint to leak.
3. Avoid extremely thin or light gray lines; the paint bucket uses line darkness to detect barriers.
4. Avoid shading or hatching that creates many tiny enclosed slivers.
5. Keep the main subject large within the frame.
6. Use simple facial features and rounded shapes.
7. Do not add background clutter that competes with the main subject.
8. Do not use recognizable copyrighted characters, branded mascots, or imitations of a specific artist's style.

## Difficulty guidelines

### Easy

- One main subject.
- A few large regions.
- Thick outlines.
- Minimal interior detail.
- Good for ages 3–4.

Example subjects: a smiling sun, a simple car, a snowman, a large flower, a friendly elephant.

### Medium

- More shapes and moderate detail.
- Several enclosed regions.
- Some patterns or accessories.
- Good for ages 4–5.

Example subjects: a puppy with a collar, a fish with fins and scales, a fairy with wings, a unicorn head.

### Advanced

- Many smaller regions.
- Detailed costumes, buildings, or fantasy creatures.
- Fine but still clear outlines.
- Best for older children or children who enjoy detail.

Example subjects: a storybook castle, a friendly dragon, a busy underwater scene.

## Prompt guidance

A useful prompt includes:

1. Subject and age-appropriateness.
2. Composition and framing.
3. Line-art style.
4. Background and color requirements.
5. Difficulty/detail level.
6. Negative constraints.

Example:

```text
Create an original children's coloring page of a friendly long-necked dinosaur.
Square composition, centered subject, simple rounded shapes, thick pure black outlines on a pure white background.
Large closed regions for easy coloring. No shading, no gradients, no gray, no color, no text, no watermark, no logo.
Original design, not based on any existing character or franchise.
```

For a more detailed page:

```text
Create an original storybook castle coloring page with several towers, flags, arched windows, and a large gate.
Square composition, thick black outlines, pure white background, many clearly enclosed regions.
Advanced detail but still bold and readable for a child. No text, no watermark, no shading, no gradients, no color.
Original design, not based on any existing character or franchise.
```

## Review checklist

Before adding an image to the library:

- [ ] The subject is original and age-appropriate.
- [ ] The background is pure white.
- [ ] The outlines are pure black or near-black.
- [ ] The lines are thick enough to read on a tablet.
- [ ] All intended coloring regions are closed.
- [ ] No gray shading, gradients, or color.
- [ ] No text, watermark, logo, or signature.
- [ ] No recognizable copyrighted character or branded mascot.
- [ ] The image works at thumbnail size.
- [ ] The paint bucket fills the intended regions without leaking.
- [ ] The image has a unique ID and a matching thumbnail.
- [ ] The catalog entry uses a relative path.
- [ ] Provenance is recorded in `metadata/image-sources.json`.

## Test the paint bucket

Open the image in the app's coloring editor and tap inside several regions:

- A region should fill with the selected color.
- Adjacent regions should remain unchanged.
- Black outlines should remain visible.
- Tapping a line should not fill the entire page.
- Undo should restore the previous color layer.
- Saving and reopening should preserve both the outlines and the colors.

If a region leaks, close the gaps in the source image and regenerate or edit it. The app has a fallback for imperfect segmentation, but clean source line art gives the best result.

## Thumbnail creation

Create a square thumbnail from the approved image:

- 420×420 px is a good default.
- Keep the full subject visible.
- Use a white background.
- Save as PNG under `coloring-library/thumbnails/<category>/`.

Example using ImageMagick:

```bash
magick input.png -resize 420x420 -background white -gravity center -extent 420x420 -depth 8 output.png
```

## Naming

Use lowercase, hyphen-separated names:

```text
<subject>-<number>.png
```

Examples:

```text
kitten-001.png
brontosaurus-002.png
castle-003.png
```

Keep the full image and thumbnail names aligned:

```text
images/cats/kitten-001.png
thumbnails/cats/kitten-001.png
```

## Rights and provenance

Record for every image:

- generation provider or human author
- generation date
- original prompt or description
- human modifications
- applicable provider terms
- rights and attribution notes

Do not automatically label AI-generated artwork as public domain or CC0. Provider terms and local law determine what can be claimed.

The sample library in this project contains original hand-authored SVG illustrations so the app works immediately. Replace or extend them with externally generated artwork as desired. Update `metadata/image-sources.json` whenever provenance changes.