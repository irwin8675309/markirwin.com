import { GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../config.js?v=18';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.cameras.main.setBackgroundColor('#8fd8ff');
    this.cameras.main.fadeIn(500, 255, 255, 255);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'sky-meadow')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(-20);

    this.add.image(1320, 170, 'prop-sun')
      .setDisplaySize(330, 330)
      .setAlpha(0.86)
      .setDepth(-18);

    this.add.image(1150, 500, 'obs-rainbow')
      .setDisplaySize(720, 360)
      .setAlpha(0.5)
      .setDepth(-16);

    this.add.image(0, GROUND_Y - 408, 'bg-far-meadow')
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, 430)
      .setDepth(-15);

    this.add.image(0, GROUND_Y - 340, 'bg-mid-meadow')
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, 430)
      .setDepth(-14);

    this.add.image(0, GROUND_Y, 'ground-meadow')
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, 190)
      .setDepth(-10);

    const cloudData = [
      [120, 230, 1.35, 0.72],
      [520, 145, 0.9, 0.5],
      [980, 270, 1.15, 0.62],
      [1360, 120, 0.8, 0.45],
      [760, 340, 0.65, 0.4],
    ];
    for (const [x, y, scale, alpha] of cloudData) {
      const cloud = this.add.image(x, y, 'obs-cloud')
        .setScale(scale)
        .setAlpha(alpha)
        .setDepth(-17);
      this.tweens.add({
        targets: cloud,
        x: x + 70 + Math.random() * 70,
        duration: 14000 + Math.random() * 9000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const treeLeft = this.add.image(70, GROUND_Y + 30, 'prop-treeMeadow')
      .setOrigin(0.5, 1)
      .setScale(1.35)
      .setDepth(-5);
    const treeRight = this.add.image(1540, GROUND_Y + 30, 'prop-treeMeadow')
      .setOrigin(0.5, 1)
      .setScale(1.15)
      .setFlipX(true)
      .setDepth(-5);
    this.tweens.add({ targets: [treeLeft, treeRight], angle: 1.2, duration: 4200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.image(245, GROUND_Y + 35, 'prop-bush')
      .setOrigin(0.5, 1)
      .setScale(1.2)
      .setDepth(3);
    this.add.image(1380, GROUND_Y + 35, 'prop-bush')
      .setOrigin(0.5, 1)
      .setScale(1.5)
      .setFlipX(true)
      .setDepth(3);

    const flowerSpots = [
      [150, 0.65, '#ff8fb2'], [320, 0.48, '#ffd166'], [520, 0.58, '#9bd7ff'],
      [1080, 0.5, '#ff9fc4'], [1250, 0.62, '#ffd166'], [1450, 0.5, '#9bd7ff'],
    ];
    for (const [x, scale] of flowerSpots) {
      const flower = this.add.image(x, GROUND_Y + 40, 'prop-flower')
        .setOrigin(0.5, 1)
        .setScale(scale)
        .setDepth(4);
      this.tweens.add({ targets: flower, angle: 3, duration: 2200 + Math.random() * 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    for (let i = 0; i < 7; i += 1) {
      const butterfly = this.add.image(
        180 + Math.random() * 1250,
        280 + Math.random() * 330,
        'item-butterfly',
      )
        .setScale(0.42 + Math.random() * 0.24)
        .setAlpha(0.82)
        .setDepth(8);
      this.tweens.add({
        targets: butterfly,
        x: butterfly.x + 50 + Math.random() * 90,
        y: butterfly.y - 35 - Math.random() * 50,
        angle: 12,
        duration: 2800 + Math.random() * 2600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: butterfly,
        scaleX: butterfly.scaleX * 0.7,
        duration: 240 + Math.random() * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    for (let i = 0; i < 12; i += 1) {
      const sparkle = this.add.image(
        120 + Math.random() * 1360,
        240 + Math.random() * 380,
        'item-sparkle',
      )
        .setScale(0.12 + Math.random() * 0.18)
        .setAlpha(0.25)
        .setDepth(7);
      this.tweens.add({
        targets: sparkle,
        alpha: 0.9,
        scale: sparkle.scale * 1.6,
        duration: 1100 + Math.random() * 1500,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 1800,
        ease: 'Sine.easeInOut',
      });
    }
  }
}