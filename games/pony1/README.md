# Enchanted Pony Palace 🦄

A self-contained, offline-friendly web game for preschoolers (ages 3–5) who love
ponies and unicorns. Built with plain HTML, CSS and JavaScript — no build step, no
backend, no accounts, no ads, no tracking.

## Run it

Just open `index.html` in a browser. That's it.

For the best experience (and to make sure audio behaves the same everywhere), serve
it over HTTP:

```bash
# any static server works
python3 -m http.server 8000
# then open http://localhost:8000
```

## Host it on GitHub Pages

1. Create a repository and push these files.
2. Repo **Settings → Pages → Source: Deploy from a branch → `main` / root**.
3. Wait a minute, then open `https://<you>.github.io/<repo>/`.

No build step, no config, no environment variables.

## What's in the box

| File | Purpose |
| --- | --- |
| `index.html` | All screens and the HUD. |
| `css/style.css` | The whole visual design: pastel world, buttons, animations. |
| `js/pony.js` | Pony/unicorn roster + procedural SVG artwork (body, mane, tail, horn, accessories). |
| `js/art.js` | Scenery (hills, castle, trees, flowers, butterflies) and particle effects. |
| `js/audio.js` | Synthesised music and sound effects via the Web Audio API, plus speech. |
| `js/activities.js` | The five care activities: brush, feed, bath, dress-up, makeover. |
| `js/game.js` | Screens, navigation, stars, saving, celebrations. |

Every visual is drawn with CSS or SVG generated at runtime. There are **no image
files, no fonts to download and no network requests**, so the game works offline and
can never break because a CDN went away.

## How to play

1. **Play** → the castle.
2. **Pick your ponies.** Tap any pony card to add it to your family (up to four).
   Tap the green arrow when you're happy.
3. **The Magical Meadow.** Tap a pony to pet it. Use the picture buttons along the
   bottom:
   - **Brush** — swipe the brush over the mane.
   - **Yummy** — drag apples, carrots or sugar cubes to the pony's mouth.
   - **Bath** — scrub the mud spots away with the sponge.
   - **Dress Up** — tap bows, flowers, crowns and colours.
   - **Magic** — tap the colour orbs for a rainbow makeover.
4. **Celebrate!** Every activity earns stars, confetti and fireworks.
5. **Home** (the house button) takes you back to pick a different pony.

If two children are playing, each can adopt her own pony. The pony portraits at the
top of the meadow switch between them instantly — no competition, no scores, no losing.

## Design notes

- **No reading required.** Everything is a picture, a colour or an animation.
  Words are decoration, never instructions.
- **No failure states.** There are no timers, no scores to lose, no wrong answers.
  Dropping food outside the mouth just makes a soft *pop*.
- **Touch first.** Built on Pointer Events, so mouse, touch and pen all behave the
  same. `touch-action: none`, `user-scalable=no` and gesture handlers stop iOS
  Safari from zooming or scrolling mid-game.
- **Big targets.** Every interactive control is at least ~56 px on the smallest
  phone and much larger on an iPad.
- **Nothing to get stuck on.** The celebration screen returns to the meadow by
  itself after a few seconds, and every activity has a big close button.
- **Progress is local.** Stars, adopted ponies and their outfits are saved to
  `localStorage` under `enchanted-pony-palace-v1`. Nothing ever leaves the device.
- **Sound is opt-in by gesture.** Browsers block autoplay, so the audio context is
  created on the first tap. Music and sound effects have separate toggles in the
  top-right corner and their state is remembered.

## Tested

Verified in Chromium at 320×568, 390×844, 768×1024, 1024×768 and 1440×900:
no scrolling, no overlapping controls, no console errors, and every activity
completes end-to-end with mouse-style and touch-style pointer input.

## Licence

Original artwork generated in code. Free for the family to play, print and share.