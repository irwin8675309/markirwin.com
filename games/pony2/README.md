# Enchanted Pony Palace 🦄

A gentle, no-reading web game for two young players (ages 3 and 5). Pick a pony or unicorn each, then brush, feed, bathe, decorate and magically transform them. No ads, no accounts, no tracking, no timers, no losing.

Plain HTML/CSS/JS with all art drawn in SVG and all sounds synthesized in the browser. No build step, no backend, no external requests. Progress (stars, chosen ponies, looks) is saved in the browser's localStorage.

## Run locally
    python3 -m http.server 8000     # then open http://localhost:8000

## Host on GitHub Pages
Push this folder to a repository, then Settings → Pages → Deploy from branch → `main` / root. On an iPad, open the site in Safari and use Share → Add to Home Screen for a full-screen app.

## Files
- `index.html` – the five screens
- `css/style.css` – layout, buttons, animations
- `js/art.js` – SVG ponies, scenery and icons
- `js/audio.js` – music and sound effects (starts only after the first touch)
- `js/game.js` – game logic and activities
