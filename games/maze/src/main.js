/**
 * Maze Adventures — entry point.
 */

import { Progress } from './storage.js';
import { AudioManager } from './audio.js';
import { MazeRenderer, loadArt } from './render.js';
import { MazeGame } from './game.js';
import { App } from './ui.js';

const $ = (selector) => document.querySelector(selector);

async function boot() {
  try {
    const images = await loadArt();
    const progress = new Progress();
    const audio = new AudioManager(progress);
    const canvas = $('#maze-canvas');
    const renderer = new MazeRenderer(canvas, images);
    const game = new MazeGame(renderer, audio);
    const app = new App({ progress, audio, renderer, game });
    app.init();

    // Handy for debugging in the browser console and for automated tests.
    window.MazeAdventures = { progress, audio, renderer, game, app };
  } catch (error) {
    console.error('Maze Adventures failed to start:', error);
    const loading = $('#screen-loading');
    if (loading) {
      loading.innerHTML = `
        <div class="loading-card">
          <div class="loading-title">Oops!</div>
          <div class="loading-dots"><i></i><i></i><i></i></div>
          <p style="max-width:420px;margin:14px auto;color:#6b5b82">Maze Adventures could not start. Please refresh the page.</p>
        </div>`;
    }
  }
}

boot();

// Stop the music when the page is put away, and resume it when it returns.
window.addEventListener('pagehide', () => {
  window.MazeAdventures?.audio?.stopMusic();
});
window.addEventListener('pageshow', () => {
  const audio = window.MazeAdventures?.audio;
  if (audio?.musicOn && audio.unlocked) audio.startMusic(audio.musicTheme);
});