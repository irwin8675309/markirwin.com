import {
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_Y,
  LEVEL_BY_ID,
  LEVEL_CLEAR_X,
  PLAYER_START_X,
} from '../config.js?v=18';

const OBSTACLE_META = {
  puddle: {
    key: 'obs-puddle', w: 220, h: 93, zoneW: 190, zoneH: 42, zoneY: GROUND_Y - 18,
    toast: 'Splash!', sound: 'splash', bounce: -280, color: 0x7fd4ff,
  },
  log: {
    key: 'obs-log', w: 175, h: 106, zoneW: 155, zoneH: 62, zoneY: GROUND_Y - 30,
    toast: 'Boing!', sound: 'boing', bounce: -510, color: 0x9bd77b,
  },
  yarn: {
    key: 'obs-yarn', w: 130, h: 123, zoneW: 112, zoneH: 90, zoneY: GROUND_Y - 42,
    toast: 'Boing!', sound: 'boing', bounce: -540, color: 0xffb7ef,
  },
  mushroom: {
    key: 'obs-mushroom', w: 155, h: 147, zoneW: 132, zoneH: 96, zoneY: GROUND_Y - 44,
    toast: 'Boing!', sound: 'boing', bounce: -570, color: 0xd4a9ff,
  },
  gumdrop: {
    key: 'obs-gumdrop', w: 132, h: 132, zoneW: 112, zoneH: 84, zoneY: GROUND_Y - 36,
    toast: 'Bounce!', sound: 'boing', bounce: -540, color: 0x9bffe1,
  },
  chocolate: {
    key: 'obs-chocolate', w: 220, h: 93, zoneW: 190, zoneH: 42, zoneY: GROUND_Y - 18,
    toast: 'Chocolate splash!', sound: 'splash', bounce: -280, color: 0xc88b66,
  },
  cloud: {
    key: 'obs-cloud', w: 190, h: 107, zoneW: 155, zoneH: 68, zoneY: GROUND_Y - 295,
    toast: 'Poof!', sound: 'whoosh', bounce: -420, color: 0xffffff, floating: true,
  },
  bubble: {
    key: 'item-bubble', w: 155, h: 155, zoneW: 122, zoneH: 112, zoneY: GROUND_Y - 292,
    toast: 'Pop!', sound: 'pop', bounce: -350, color: 0xa8f3ff, floating: true,
  },
  candy: {
    key: 'obs-candy', w: 118, h: 170, zoneW: 100, zoneH: 128, zoneY: GROUND_Y - 46,
    toast: 'Boing!', sound: 'boing', bounce: -500, color: 0xffb4c7,
  },
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const RESCUE_ANIMALS = ['bunny', 'bird', 'kitten', 'turtle', 'duckling', 'squirrel', 'puppy'];

function themeProps(theme) {
  if (theme === 'meadow') {
    return [
      { key: 'prop-flower', min: 0.45, max: 0.8, y: GROUND_Y + 36, depth: 3 },
      { key: 'prop-bush', min: 0.5, max: 0.95, y: GROUND_Y + 35, depth: 2 },
      { key: 'prop-treeMeadow', min: 0.8, max: 1.15, y: GROUND_Y + 35, depth: -6 },
    ];
  }
  if (theme === 'forest') {
    return [
      { key: 'prop-mushroomProp', min: 0.45, max: 0.8, y: GROUND_Y + 36, depth: 3 },
      { key: 'prop-treeForest', min: 0.8, max: 1.2, y: GROUND_Y + 35, depth: -6 },
      { key: 'prop-flower', min: 0.4, max: 0.65, y: GROUND_Y + 36, depth: 3 },
    ];
  }
  if (theme === 'cloud') {
    return [
      { key: 'prop-starFlower', min: 0.45, max: 0.8, y: GROUND_Y + 36, depth: 3 },
      { key: 'prop-cloudIsland', min: 0.35, max: 0.62, y: 560, depth: -7, floating: true },
    ];
  }
  return [
    { key: 'prop-lollipop', min: 0.45, max: 0.9, y: GROUND_Y + 35, depth: -5 },
    { key: 'prop-gumdropProp', min: 0.45, max: 0.8, y: GROUND_Y + 36, depth: 2 },
    { key: 'prop-candyCane', min: 0.45, max: 0.75, y: GROUND_Y + 36, depth: 3 },
  ];
}

export class AdventureScene extends Phaser.Scene {
  constructor() {
    super('Adventure');
  }

  init(data) {
    this.level = LEVEL_BY_ID[data?.levelId] || LEVEL_BY_ID.meadow;
    this.petId = data?.petId || window.PetsGame?.progress?.selectedPet || 'ghosty';
  }

  create() {
    this.collectedRun = 0;
    this.lastRatio = -1;
    this.grounded = true;
    this.jumpBuffer = 0;
    this.runClock = 0;
    this.runFrame = 'runA';
    this.landTimer = false;
    this.isRescuing = false;
    this.currentRescue = null;
    this.finished = false;
    this.rescues = [];
    this.obstacles = [];
    this.ambient = [];
    this.progress = window.PetsGame?.progress;
    this.audio = window.PetsGame?.audio;

    this.collectibles = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.world.setBounds(0, 0, this.level.length, GROUND_Y);
    this.cameras.main.setBackgroundColor('#9ddfff');
    this.cameras.main.setBounds(0, 0, this.level.length, GAME_HEIGHT);

    this.createBackground();
    this.createPlayer();
    this.generateWorld();
    this.setupInput();

    this.audio?.setTheme(this.level.theme);
    this.cameras.main.fadeIn(360, 255, 255, 255);
    this.game.events.emit('pets:level-start', {
      levelId: this.level.id,
      petId: this.petId,
      collected: 0,
    });
    this.game.events.emit('pets:progress', 0);
  }

  /* ----------------------------- background ----------------------------- */

  createBackground() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, `sky-${this.level.theme}`)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(-20);

    this.add.image(1340, 165, 'prop-sun')
      .setDisplaySize(310, 310)
      .setAlpha(0.8)
      .setDepth(-19);

    this.farLayer = this.add.tileSprite(0, GROUND_Y - 408, GAME_WIDTH, 430, `bg-far-${this.level.theme}`)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-15);
    this.midLayer = this.add.tileSprite(0, GROUND_Y - 338, GAME_WIDTH, 430, `bg-mid-${this.level.theme}`)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-14);
    this.groundLayer = this.add.tileSprite(0, GROUND_Y, GAME_WIDTH, 190, `ground-${this.level.theme}`)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-10);

    const cloudCount = this.level.theme === 'forest' ? 3 : 5;
    for (let i = 0; i < cloudCount; i += 1) {
      const x = 60 + i * (1480 / cloudCount) + Math.random() * 90;
      const y = 95 + Math.random() * 170;
      const cloud = this.add.image(x, y, 'obs-cloud')
        .setScale(0.62 + Math.random() * 0.72)
        .setAlpha(0.5 + Math.random() * 0.25)
        .setScrollFactor(0)
        .setDepth(-18);
      this.tweens.add({
        targets: cloud,
        x: x + 60 + Math.random() * 70,
        duration: 16000 + Math.random() * 8000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.addAmbient();
    this.addWorldProps();
    this.addDecor();
  }

  addAmbient() {
    const count = this.level.theme === 'forest' ? 12 : 8;
    for (let i = 0; i < count; i += 1) {
      const key = this.level.theme === 'meadow' ? 'item-butterfly'
        : this.level.theme === 'forest' ? 'item-sparkle'
          : this.level.theme === 'cloud' ? 'item-star'
            : 'item-sparkle';
      const x = 90 + Math.random() * 1420;
      const y = 230 + Math.random() * 380;
      const sprite = this.add.image(x, y, key)
        .setScale(key === 'item-butterfly' ? 0.32 + Math.random() * 0.22 : 0.1 + Math.random() * 0.14)
        .setAlpha(0.42 + Math.random() * 0.35)
        .setScrollFactor(0)
        .setDepth(7);
      if (key === 'item-butterfly') {
        this.tweens.add({
          targets: sprite,
          x: x + 50 + Math.random() * 80,
          y: y - 30 - Math.random() * 50,
          angle: 14,
          duration: 3000 + Math.random() * 2600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else {
        this.tweens.add({
          targets: sprite,
          alpha: 0.95,
          scale: sprite.scale * 1.6,
          duration: 1100 + Math.random() * 1300,
          yoyo: true,
          repeat: -1,
          delay: Math.random() * 1800,
          ease: 'Sine.easeInOut',
        });
      }
      this.ambient.push(sprite);
    }
  }

  addWorldProps() {
    const rng = mulberry32(hashString(`${this.level.id}-props`));
    const choices = themeProps(this.level.theme);
    let x = 360 + rng() * 260;
    while (x < this.level.length - 500) {
      const choice = choices[Math.floor(rng() * choices.length)];
      const scale = choice.min + rng() * (choice.max - choice.min);
      const image = this.add.image(x, choice.y, choice.key)
        .setOrigin(0.5, 1)
        .setScale(scale)
        .setDepth(choice.depth);
      if (choice.floating) {
        this.tweens.add({
          targets: image,
          y: choice.y - 14 - rng() * 20,
          duration: 3600 + rng() * 2600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
      if (choice.key === 'prop-flower' || choice.key === 'prop-starFlower') {
        this.tweens.add({
          targets: image,
          angle: 2.5,
          duration: 2300 + rng() * 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
      x += 340 + rng() * 400;
    }
  }

  addDecor() {
    const rng = mulberry32(hashString(`${this.level.id}-decor`));

    for (const x of [1750, 4650]) {
      if (x > this.level.length - 900) continue;
      const bed = this.add.image(x, GROUND_Y + 30, 'obs-flowerbed')
        .setOrigin(0.5, 1)
        .setScale(1.1)
        .setDepth(-2);
      for (let i = 0; i < 3; i += 1) {
        const butterfly = this.add.image(x - 70 + i * 70, GROUND_Y - 85 - i * 20, 'item-butterfly')
          .setScale(0.34 + i * 0.03)
          .setDepth(9);
        this.tweens.add({
          targets: butterfly,
          x: butterfly.x + 35,
          y: butterfly.y - 28,
          angle: 12,
          duration: 1800 + i * 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }

    const gateX = Math.min(4250, this.level.length - 1200);
    const gate = this.add.image(gateX, GROUND_Y + 30, 'obs-gate')
      .setOrigin(0.5, 1)
      .setDisplaySize(260, 295)
      .setDepth(-1);
    this.tweens.add({ targets: gate, alpha: 0.82, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    if (this.level.theme === 'cloud' || this.level.theme === 'meadow' || this.level.theme === 'candy') {
      const rainbowX = Math.min(6550, this.level.length - 800);
      this.add.image(rainbowX, GROUND_Y - 105, 'obs-rainbow')
        .setOrigin(0.5, 1)
        .setDisplaySize(620, 310)
        .setAlpha(0.42)
        .setDepth(-8);
    }

    const finishX = this.level.length - 300;
    const finish = this.add.image(finishX, GROUND_Y + 32, 'obs-finish')
      .setOrigin(0.5, 1)
      .setDisplaySize(430, 440)
      .setDepth(5);
    this.tweens.add({ targets: finish, scaleX: finish.scaleX * 1.015, scaleY: finish.scaleY * 1.015, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.finishX = this.level.length - 430;
    this.finishVisual = finish;

    if (rng() > 0.5) {
      this.add.image(760, GROUND_Y - 340, 'obs-cloud')
        .setScale(0.7)
        .setAlpha(0.55)
        .setDepth(-8);
    }
  }

  /* ------------------------------- player ------------------------------- */

  createPlayer() {
    const key = `pet-${this.petId}-idle`;
    this.player = this.physics.add.sprite(PLAYER_START_X, GROUND_Y + 24, key)
      .setOrigin(0.5, 1)
      .setDisplaySize(330, 283)
      .setDepth(10);
    this.player.body.setSize(200, 260);
    this.player.body.setOffset(110, 70);
    this.player.setCollideWorldBounds(true);
    this.player.setVelocityX(this.level.speed);
    this.player.setMaxVelocity(260, 1100);
    this.pose = 'idle';
    this.runFrame = 'runA';
    this.grounded = true;
  }

  setPose(pose) {
    if (this.pose === pose) return;
    this.pose = pose;
    const key = `pet-${this.petId}-${pose}`;
    if (this.textures.exists(key)) this.player.setTexture(key);
  }

  changePet(petId) {
    if (!['ghosty', 'spin', 'oakley'].includes(petId)) return;
    this.petId = petId;
    const key = `pet-${petId}-${this.pose || 'idle'}`;
    if (this.textures.exists(key)) this.player.setTexture(key);
  }

  /* ------------------------------- world -------------------------------- */

  generateWorld() {
    const rng = mulberry32(hashString(this.level.id));
    const rescueXs = [
      Math.round(this.level.length * 0.36),
      Math.round(this.level.length * 0.68),
    ];
    this.rescueXs = rescueXs;

    const collectibleStart = 840;
    for (let x = collectibleStart; x < this.level.length - 650; x += 720 + rng() * 220) {
      const type = this.level.collectibles[Math.floor(rng() * this.level.collectibles.length)];
      const count = 5 + Math.floor(rng() * 2);
      const baseY = rng() > 0.48 ? 596 : 505;
      const arc = 55 + rng() * 55;
      this.spawnCollectibleTrail(x, baseY, count, arc, type);
    }

    const obstacleXStart = 1230;
    let x = obstacleXStart;
    while (x < this.level.length - 720) {
      const tooCloseToRescue = rescueXs.some((rx) => Math.abs(x - rx) < 430);
      if (!tooCloseToRescue) {
        const type = this.level.obstacles[Math.floor(rng() * this.level.obstacles.length)];
        this.createObstacle(x, type);
      }
      x += 420 + rng() * 250;
    }

    rescueXs.forEach((rx, index) => {
      const type = this.level.rescue[index] || RESCUE_ANIMALS[index % RESCUE_ANIMALS.length];
      this.createRescue(rx, type);
    });

    this.physics.add.overlap(this.player, this.collectibles, (_player, item) => {
      if (item.active) this.collectItem(item);
    });

    if (this.level.theme === 'cloud') {
      this.createBubbleField(1650, 520);
      this.createBubbleField(5300, 540);
    }
  }

  spawnCollectibleTrail(startX, baseY, count, arc, type) {
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const x = startX + i * 72;
      const y = baseY - Math.sin(Math.PI * t) * arc;
      this.createCollectible(x, y, type);
    }
  }

  createCollectible(x, y, type) {
    const key = `item-${type}`;
    if (!this.textures.exists(key)) return;
    const item = this.collectibles.create(x, y, key);
    const size = 62 + Math.random() * 14;
    item.setDisplaySize(size, size).setDepth(8);
    item.body.setAllowGravity(false);
    item.body.setImmovable(true);
    item.setData('collected', false);
    item.setData('baseY', y);
    this.tweens.add({
      targets: item,
      y: y - 9 - Math.random() * 8,
      duration: 1100 + Math.random() * 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createObstacle(x, type) {
    const meta = OBSTACLE_META[type];
    if (!meta) return;

    const y = meta.floating ? GROUND_Y - 260 : GROUND_Y + 18;
    const sprite = this.add.image(x, y, meta.key)
      .setOrigin(0.5, 1)
      .setDisplaySize(meta.w, meta.h)
      .setDepth(6);

    if (meta.floating) {
      this.tweens.add({
        targets: sprite,
        y: y - 12,
        duration: 1900 + Math.random() * 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const zone = this.add.zone(x, meta.zoneY, meta.zoneW, meta.zoneH);
    this.physics.add.existing(zone, true);
    const entry = { type, meta, sprite, zone, active: true, offered: false };
    zone.setData('entry', entry);
    this.obstacles.push(entry);

    this.physics.add.overlap(this.player, zone, () => this.hitObstacle(entry));
  }

  hitObstacle(entry) {
    if (!entry.active || this.finished || this.isRescuing) return;
    entry.active = false;
    entry.zone.destroy();

    const { meta, sprite } = entry;
    const x = sprite.x;
    const y = sprite.y - meta.h * 0.55;

    this.audio?.sfx(meta.sound);
    this.burst(x, y, meta.color, entry.type === 'bubble' ? 'item-bubble' : 'item-sparkle', 9);
    this.game.events.emit('pets:toast', meta.toast);

    const body = this.player.body;
    if (body.velocity.y > meta.bounce) {
      this.player.setVelocityY(meta.bounce);
      this.grounded = false;
      this.setPose('jump');
    }

    if (meta.floating) {
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 70,
        alpha: 0,
        scale: sprite.scale * 1.35,
        duration: 420,
        ease: 'Cubic.easeOut',
        onComplete: () => sprite.destroy(),
      });
    } else {
      this.tweens.add({
        targets: sprite,
        alpha: 0,
        scaleX: sprite.scaleX * 1.08,
        scaleY: sprite.scaleY * 0.72,
        duration: 300,
        ease: 'Cubic.easeOut',
        onComplete: () => sprite.destroy(),
      });
    }
  }

  createBubbleField(x, y) {
    for (let i = 0; i < 4; i += 1) {
      const bubble = this.add.image(x + i * 58, y - i * 12, 'item-bubble')
        .setScale(0.55 + Math.random() * 0.3)
        .setAlpha(0.85)
        .setDepth(7);
      this.tweens.add({
        targets: bubble,
        y: bubble.y - 16 - Math.random() * 14,
        duration: 1400 + Math.random() * 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  collectItem(item) {
    if (!item.active || item.getData('collected')) return;
    item.setData('collected', true);
    item.disableBody(true, false);
    item.setDepth(20);
    const type = item.texture.key.replace('item-', '');
    this.collectedRun += 1;
    this.progress?.addCollectible(type, 1);
    this.audio?.sfx('collect');
    this.burst(item.x, item.y, 0xffe27a, 'item-sparkle', 5);
    this.game.events.emit('pets:collect', { count: this.collectedRun, type });
    this.tweens.add({
      targets: item,
      y: item.y - 42,
      scale: item.scale * 1.8,
      alpha: 0,
      duration: 420,
      ease: 'Cubic.easeOut',
      onComplete: () => item.destroy(),
    });
  }

  /* ------------------------------- rescue ------------------------------- */

  createRescue(x, type) {
    const animal = this.add.image(x, GROUND_Y + 24, `animal-${type}`)
      .setOrigin(0.5, 1)
      .setDisplaySize(148, 148)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });

    const ring = this.add.ellipse(x, GROUND_Y - 76, 132, 132)
      .setStrokeStyle(7, 0xffffff, 0.8)
      .setDepth(10)
      .setScale(0.62)
      .setAlpha(0.2);
    this.tweens.add({
      targets: ring,
      scale: 1.05,
      alpha: 0.7,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const icon = this.add.image(x, GROUND_Y - 192, 'item-heart')
      .setDisplaySize(58, 58)
      .setDepth(12);
    this.tweens.add({
      targets: icon,
      y: icon.y - 12,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const entry = { type, x, animal, ring, icon, offered: false };
    animal.on('pointerdown', () => {
      if (this.currentRescue === entry) this.completeRescue();
    });
    this.rescues.push(entry);
  }

  offerRescue(entry) {
    if (this.isRescuing || this.finished) return;
    entry.offered = true;
    this.currentRescue = entry;
    this.isRescuing = true;
    this.player.setVelocityX(0);
    this.setPose('idle');
    this.player.setAngle(0);
    this.audio?.sfx('button');
    this.game.events.emit('pets:rescue-offer', {
      type: entry.type,
      levelId: this.level.id,
      x: entry.x,
    });
  }

  completeRescue() {
    const entry = this.currentRescue;
    if (!entry) return;
    this.currentRescue = null;
    this.isRescuing = false;
    this.progress?.rescueAnimal(this.level.id, entry.type);
    this.audio?.sfx('rescue');
    this.burst(entry.x, GROUND_Y - 105, 0xff9fb8, 'item-heart', 9);
    this.burst(entry.x, GROUND_Y - 90, 0xffe27a, 'item-star', 7);
    this.game.events.emit('pets:rescue-complete', { type: entry.type, levelId: this.level.id });
    this.game.events.emit('pets:toast', 'Thank you!');

    this.tweens.add({
      targets: [entry.ring, entry.icon],
      alpha: 0,
      scale: 1.6,
      duration: 300,
      onComplete: () => {
        entry.ring.destroy();
        entry.icon.destroy();
      },
    });
    this.tweens.add({
      targets: entry.animal,
      y: entry.animal.y - 85,
      alpha: 0,
      scale: entry.animal.scale * 1.2,
      duration: 650,
      ease: 'Back.easeOut',
      onComplete: () => entry.animal.destroy(),
    });

    this.time.delayedCall(1050, () => {
      if (!this.finished && this.scene.isActive()) {
        this.player.setVelocityX(this.level.speed);
        this.setPose('runA');
        this.grounded = true;
      }
    });
  }

  /* -------------------------------- input -------------------------------- */

  setupInput() {
    this.input.on('pointerdown', () => this.tryJump());
    this.input.keyboard?.on('keydown-SPACE', (event) => {
      event.preventDefault();
      this.tryJump();
    });
    this.input.keyboard?.on('keydown-UP', (event) => {
      event.preventDefault();
      this.tryJump();
    });
  }

  tryJump() {
    if (this.finished || this.isRescuing) return;
    if (this.grounded || (this.player.body.blocked.down && this.player.body.velocity.y >= 0)) {
      this.doJump();
    } else {
      this.jumpBuffer = 0.18;
    }
  }

  doJump() {
    if (this.finished || this.isRescuing) return;
    this.jumpBuffer = 0;
    this.grounded = false;
    this.landTimer = false;
    this.player.setVelocityY(-790);
    this.setPose('jump');
    this.audio?.sfx('jump');
    this.burst(this.player.x, GROUND_Y - 10, 0xffffff, 'item-sparkle', 4);
  }

  onLand() {
    this.grounded = true;
    this.landTimer = true;
    this.setPose('land');
    this.audio?.sfx('land');
    this.burst(this.player.x, GROUND_Y - 8, 0xffffff, 'item-sparkle', 4);
    this.time.delayedCall(170, () => {
      this.landTimer = false;
      if (this.grounded && !this.isRescuing && !this.finished) this.setPose('runA');
    });
  }

  /* -------------------------------- update ------------------------------- */

  update(time, delta) {
    if (!this.player || this.finished) return;
    const dt = Math.min(delta, 40) / 1000;
    this.updateCamera();
    this.updateParallax();
    this.updatePlayer(dt);
    this.updateProgress();
    this.checkRescue();
    this.checkFinish();
  }

  updateCamera() {
    const target = Phaser.Math.Clamp(this.player.x - LEVEL_CLEAR_X, 0, this.level.length - GAME_WIDTH);
    this.cameras.main.scrollX = target;
  }

  updateParallax() {
    const scroll = this.cameras.main.scrollX;
    this.farLayer.tilePositionX = scroll * 0.12;
    this.midLayer.tilePositionX = scroll * 0.28;
    this.groundLayer.tilePositionX = scroll;
  }

  updatePlayer(dt) {
    if (this.isRescuing) {
      this.player.setAngle(Math.sin(this.time.now / 280) * 1.2);
      return;
    }

    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    const onGround = (this.player.body.blocked.down || this.player.body.touching.down)
      && this.player.body.velocity.y >= 0;

    if (onGround) {
      if (!this.grounded) this.onLand();
      this.grounded = true;
      if (this.jumpBuffer > 0) {
        this.jumpBuffer = 0;
        this.doJump();
      } else if (!this.landTimer) {
        this.runClock += dt;
        if (this.runClock > 0.16) {
          this.runClock = 0;
          this.runFrame = this.runFrame === 'runA' ? 'runB' : 'runA';
          this.setPose(this.runFrame);
        }
      }
      this.player.setAngle(Math.sin(this.time.now / 180) * 1.1);
    } else {
      this.grounded = false;
      this.setPose('jump');
      this.player.setAngle(-4);
    }
  }

  updateProgress() {
    const ratio = Phaser.Math.Clamp(
      (this.player.x - PLAYER_START_X) / Math.max(1, this.finishX - PLAYER_START_X),
      0,
      1,
    );
    if (Math.abs(ratio - this.lastRatio) > 0.002) {
      this.lastRatio = ratio;
      this.game.events.emit('pets:progress', ratio);
    }
  }

  checkRescue() {
    if (this.isRescuing) return;
    for (const entry of this.rescues) {
      if (!entry.offered && this.player.x >= entry.x - 350 && this.player.x <= entry.x + 240) {
        this.offerRescue(entry);
        break;
      }
    }
  }

  checkFinish() {
    if (this.player.x >= this.finishX) this.completeLevel();
  }

  completeLevel() {
    if (this.finished) return;
    this.finished = true;
    this.isRescuing = false;
    this.player.setVelocityX(0);
    this.player.setVelocityY(0);
    this.setPose('celebrate');
    this.player.setAngle(-5);
    this.audio?.sfx('celebrate');
    this.cameras.main.flash(280, 255, 255, 255);
    this.cameras.main.shake(220, 0.0018);
    this.burst(this.player.x, GROUND_Y - 180, 0xffe27a, 'item-star', 18);
    this.burst(this.player.x, GROUND_Y - 220, 0xff9fb8, 'item-heart', 12);

    this.time.delayedCall(1000, () => {
      this.scene.pause();
      this.game.events.emit('pets:complete', {
        levelId: this.level.id,
        petId: this.petId,
        collected: this.collectedRun,
        rescued: this.rescues.length,
      });
    });
  }

  /* -------------------------------- effects ------------------------------ */

  burst(x, y, tint = 0xffffff, texture = 'item-sparkle', count = 8) {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.45;
      const distance = 35 + Math.random() * 95;
      const sprite = this.add.image(x, y, texture)
        .setScale(0.16 + Math.random() * 0.22)
        .setAlpha(0.95)
        .setTint(tint)
        .setDepth(22)
        .setAngle(Math.random() * 360);
      this.tweens.add({
        targets: sprite,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance - 18,
        alpha: 0,
        scale: 0.02,
        angle: sprite.angle + 160,
        duration: 500 + Math.random() * 380,
        ease: 'Cubic.easeOut',
        onComplete: () => sprite.destroy(),
      });
    }
  }
}