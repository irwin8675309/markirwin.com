/**
 * Ghosty, Spin, and Oakley's Great Escape — entry point.
 */

import { Progress } from './storage.js';
import { AudioManager } from './audio.js';
import { EscapeRenderer, loadArt } from './render.js';
import { EscapeGame } from './game.js';
import { App } from './ui.js';

const $ = (selector) => document.querySelector(selector);

async function boot() {
  try {
    const images = await loadArt();
    const progress = new Progress();
    const audio = new AudioManager(progress);
    const canvas = $('#game-canvas');
    const renderer = new EscapeRenderer(canvas, images);
    const game = new EscapeGame(renderer, audio);
    const app = new App({ progress, audio, renderer, game });
    app.init();

    // Handy for debugging in the console and for automated smoke tests.
    window.GreatEscape = { progress, audio, renderer, game, app };

    document.addEventListener('visibilitychange', () => app.handleVisibility());
  } catch (error) {
    console.error('Great Escape failed to start:', error);
    const loading = $('#screen-loading');
    if (loading) {
      loading.innerHTML = `
        <div class="loading-card">
          <div class="loading-title">Oops!</div>
          <div class="loading-dots"><i></i><i></i><i></i></div>
          <p style="max-width:420px;margin:14px auto;color:#6b5b82">The game could not start. Please refresh the page.</p>
        </div>`;
    }
  }
}

boot();

// Stop the music when the page is put away, and resume it when it returns.
window.addEventListener('pagehide', () => {
  window.GreatEscape?.audio?.stopMusic();
});
window.addEventListener('pageshow', () => {
  const audio = window.GreatEscape?.audio;
  if (audio?.musicOn && audio.unlocked) audio.startMusic(audio.musicTheme);
});

// Register the service worker for offline play (production / https only).
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline support is a progressive enhancement */
    });
  });
}