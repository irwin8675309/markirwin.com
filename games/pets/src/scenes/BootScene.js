import { Art, THEMES } from '../art.js';

function createSkyTexture(scene, theme) {
  const palette = THEMES[theme];
  const skyWidth = 800;
  const skyHeight = 450;
  const texture = scene.textures.createCanvas(`sky-${theme}`, skyWidth, skyHeight);
  if (!texture) return;
  const ctx = texture.getContext();
  const gradient = ctx.createLinearGradient(0, 0, 0, skyHeight);
  gradient.addColorStop(0, palette.sky[0]);
  gradient.addColorStop(0.62, palette.sky[1]);
  gradient.addColorStop(1, palette.sky[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, skyWidth, skyHeight);

  const glow = ctx.createRadialGradient(skyWidth * 0.82, 60, 10, skyWidth * 0.82, 60, 210);
  glow.addColorStop(0, 'rgba(255,255,235,.55)');
  glow.addColorStop(1, 'rgba(255,255,235,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, skyWidth, skyHeight);
  texture.refresh();
}

function svgToCanvas(svg, width, height) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(image, 0, 0, width, height);
      resolve(canvas);
    };
    image.onerror = () => resolve(null);
    image.src = Art.svgDataURI(svg);
  });
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  async create() {
    const defs = Art.textureDefs();
    const entries = Object.entries(defs);
    let complete = 0;

    await Promise.all(entries.map(async ([key, def]) => {
      const canvas = await svgToCanvas(def.svg, def.w, def.h);
      if (canvas) {
        this.textures.addCanvas(key, canvas);
      } else {
        console.warn('Pets Game could not rasterize texture:', key);
      }
      complete += 1;
      this.game.events.emit('pets:loading', complete / entries.length);
    }));

    for (const theme of Object.keys(THEMES)) {
      createSkyTexture(this, theme);
    }

    this.game.events.emit('pets:ready');
    this.scene.start('Menu');
  }
}