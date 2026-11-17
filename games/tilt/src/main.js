/**
 * Bootstrap: load art, build the game and wire the screens together.
 */

import { loadArt } from './art.js';
import { Renderer } from './render.js';
import { TiltInput } from './motion.js';
import { Game } from './game.js';
import { UI } from './ui.js';
import { audio } from './audio.js';
import { loadSave, save } from './storage.js';
import { WORLDS, DIFFICULTIES } from './config.js';

const canvas = document.getElementById('game-canvas');

async function boot() {
  const tip = document.getElementById('loading-tip');
  const tips = [
    'Getting the garden ready…',
    'Waking up Ghosty, Spin and Oakley…',
    'Polishing the marble…',
    'Almost ready to roll!',
  ];
  let tipIndex = 0;
  const tipTimer = window.setInterval(() => {
    tipIndex = Math.min(tips.length - 1, tipIndex + 1);
    if (tip) tip.textContent = tips[tipIndex];
  }, 420);

  loadSave();

  const renderer = new Renderer(canvas);
  const motion = new TiltInput();

  const game = new Game({ canvas, renderer, motion, audio });
  const ui = new UI({ game, motion, renderer });

  game.cb = {
    onHud: (h) => ui.updateHud(h),
    onLevelStart: (l) => ui.onLevelStart(l),
    onComplete: (summary) => ui.showComplete(summary),
    onPause: () => ui.showPause(),
    onResume: () => ui.toast('Keep rolling!'),
    onReset: () => {},
    onRecover: () => ui.toast('Back to safety!'),
    onCollect: () => {},
    onSurprise: ({ type }) => {
      const names = { butterfly: 'A butterfly!', yarn: 'A ball of yarn!', chest: 'A treasure chest!' };
      ui.toast(names[type] || 'A hidden surprise!');
    },
    onCheckpoint: () => ui.toast('Checkpoint!'),
    onAssist: () => ui.toast('Nice and slow…'),
    onHint: () => ui.toast('Follow the sparkles!'),
  };

  // Let the loading screen paint before generating art.
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  await loadArt((p) => {
    if (tip) tip.textContent = `Getting the garden ready… ${Math.round(p * 100)}%`;
  });

  window.clearInterval(tipTimer);

  ui.init();
  audio.setEnabled({
    sound: save.data.settings.sound,
    music: save.data.settings.music,
    sfx: save.data.settings.sfx,
    volume: save.data.settings.volume,
  });
  game.startLoop();

  document.getElementById('screen-loading')?.classList.remove('is-active');

  // Small developer hook used for automated checks and debugging.
  window.PTA = {
    game,
    ui,
    motion,
    renderer,
    audio,
    save,
    startLevel(world = save.data.selectedWorld, difficulty = save.data.selectedDifficulty, levelIndex = 0) {
      ui.motionGranted = true;
      ui.playLevel(world, difficulty, levelIndex);
    },
  };

  handleTestHash();
  window.addEventListener('hashchange', handleTestHash);
}

/**
 * Allows quick testing links such as:
 *   index.html#play=garden:super:2&touch=1
 * Handy for checking a specific world/difficulty without the menus.
 */
function handleTestHash() {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return;
  const params = new URLSearchParams(hash);
  const play = params.get('play');
  if (!play) return;
  const [world, difficulty, level] = play.split(':');
  if (!WORLDS[world]) return;
  const diff = DIFFICULTIES[difficulty] ? difficulty : save.data.selectedDifficulty;
  const idx = Number.isFinite(parseInt(level, 10)) ? Math.max(0, parseInt(level, 10)) : 0;

  if (params.get('touch') === '1') {
    save.data.settings.control = 'touch';
    window.PTA.motion.setTouchMode(true);
  }
  window.PTA.ui.motionGranted = true;
  window.PTA.ui.playLevel(world, diff, idx);
}

boot().catch((err) => {
  // Never leave the child staring at a blank screen.
  const tip = document.getElementById('loading-tip');
  if (tip) tip.textContent = 'Something went wrong. Please refresh the page.';
  // eslint-disable-next-line no-console
  console.error('[Pet Tilt Adventures] boot failed', err);
});