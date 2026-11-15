import { Progress } from './progress.js?v=18';
import { AudioManager } from './audio.js?v=18';
import { UI } from './ui.js?v=18';
import { BootScene } from './scenes/BootScene.js?v=18';
import { MenuScene } from './scenes/MenuScene.js?v=18';
import { AdventureScene } from './scenes/AdventureScene.js?v=18';
import { GAME_HEIGHT, GAME_WIDTH } from './config.js?v=18';

const progress = new Progress();
const audio = new AudioManager(progress);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#9ddfff',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1900 },
      debug: false,
    },
  },
  render: {
    antialias: true,
    roundPixels: false,
    powerPreference: 'high-performance',
  },
  audio: { noAudio: true },
  input: { activePointers: 3 },
  fps: { target: 60, min: 30 },
  banner: false,
  scene: [BootScene, MenuScene, AdventureScene],
});

const ui = new UI(game, progress, audio);
window.PetsGame = { game, progress, audio, ui };

// Phaser can finish loading before this module has attached its UI listeners.
// Poll briefly so the menu appears no matter how quickly the browser decodes.
let bootChecks = 0;
const showMenuWhenReady = () => {
  if (ui.ready) return;
  if (game.scene.isActive('Menu')) {
    ui.ready = true;
    ui.showScreen('menu');
    return;
  }
  bootChecks += 1;
  if (bootChecks < 24) window.setTimeout(showMenuWhenReady, 100);
};
window.setTimeout(showMenuWhenReady, 80);

const stopPageGesture = (event) => event.preventDefault();
document.addEventListener('gesturestart', stopPageGesture, { passive: false });
document.addEventListener('gesturechange', stopPageGesture, { passive: false });
document.addEventListener('dblclick', (event) => event.preventDefault(), { passive: false });

window.addEventListener('keydown', (event) => {
  const inGame = window.PetsGame?.ui?.currentScreen === 'game';
  if (inGame && ['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
    event.preventDefault();
  } else if (['PageUp', 'PageDown'].includes(event.code)) {
    event.preventDefault();
  }
}, { passive: false });

window.addEventListener('resize', () => {
  game.scale.refresh();
});

window.addEventListener('pagehide', () => {
  audio.stopMusic();
});

window.addEventListener('pageshow', () => {
  if (audio.musicOn && audio.unlocked) audio.startMusic(audio.musicTheme);
});