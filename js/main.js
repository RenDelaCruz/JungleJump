const screen = { width: 1000, height: 600, bounds: 3000 };

const assets = {
  images: [
    { name: "forest-1", path: "assets/backgrounds/forest-1.png" },
    { name: "forest-2", path: "assets/backgrounds/forest-2.png" },
    { name: "forest-3", path: "assets/backgrounds/forest-3.png" },
    { name: "forest-4", path: "assets/backgrounds/forest-4.png" },
    { name: "ground", path: "assets/platform.png" },
    { name: "bomb", path: "assets/bomb.png" },
  ],
  sprites: [
    { name: "hero-idle", path: "assets/sprites/idle.png", frameInfo: { frameWidth: 21, frameHeight: 35 } },
    { name: "hero-run", path: "assets/sprites/run.png", frameInfo: { frameWidth: 23, frameHeight: 34 } },
    { name: "hero-jump", path: "assets/sprites/jump.png", frameInfo: { frameWidth: 19, frameHeight: 36 } },
    { name: "hero-fall", path: "assets/sprites/midair.png", frameInfo: { frameWidth: 22, frameHeight: 37 } },
    { name: "hero-land", path: "assets/sprites/landing.png", frameInfo: { frameWidth: 22, frameHeight: 37 } },
    { name: "coin", path: "assets/sprites/coin.png", frameInfo: { frameWidth: 16, frameHeight: 16 } }
  ]
}

const animations = [
  { key: "idle", spriteName: "hero-idle", frameRate: 10 },
  { key: "walking", spriteName: "hero-run", frameRate: 10 },
  { key: "running", spriteName: "hero-run", frameRate: 15 },
  { key: "jumping", spriteName: "hero-jump" },
  { key: "falling", spriteName: "hero-fall", frameRate: 10 },
  { key: "landing", spriteName: "hero-land" },
  { key: "coin-spin", spriteName: "coin", frameRate: 10, repeat: -1 },
];

const config = {
  type: Phaser.AUTO,
  width: screen.width,
  height: screen.height,
  backgroundColor: "#A5D9C4",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 600 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  audio: {
    disableWebAudio: false
  }
};

let player;
let coins;
let bombs;
let platforms;
let cursors;
let score = 0;
let gameOver = false;
let scoreText;
let music;

const game = new Phaser.Game(config);

function preload() {
  const { images, sprites } = assets;

  // Load images
  for (let image of images) {
    this.load.image(image.name, image.path)
  }

  // Load sprites
  for (let sprite of sprites) {
    const { name, path, frameInfo } = sprite;
    this.load.spritesheet(name, path, frameInfo);
  }

  // Load audio
  this.load.audio("theme", ["assets/theme.mp3"]);
}

let backgrounds = [];

function create() {
  // Create parallax background
  const backgroundNames = assets.images
    .filter(image => image.name.startsWith("forest-"))
    .map(image => image.name);

  // Add music
  music = this.sound.add("theme");
  music.muted = true;
  music.play();

  for (let backgroundName of backgroundNames) {
    backgrounds.push(
      this.add.tileSprite(screen.width / 2, screen.height / 2, 384, 216, backgroundName)
        .setScrollFactor(0, 1)
        .setScale(screen.height / 200)
    );
  }

  // Create platforms
  platforms = this.physics.add.staticGroup();
  platforms.create(600, 400, "ground");
  platforms.create(50, 250, "ground");
  platforms.create(750, 220, "ground");
  platforms.create(1200, 220, "ground");

  let platformStep = 200;
  for (let index = 0; index < screen.bounds; index += platformStep) {
    console.log(index * platformStep)
    platforms.create(index, 540, "ground")
      .setOrigin(0)
      .setScale(2)
      .refreshBody();
  }

  // Create player
  player = this.physics.add
    .sprite(300, 450, "hero-idle")
    .setScale(3)
    .setBounce(0.2)
    .setCollideWorldBounds(true);

  // Set camera
  this.cameras.main.startFollow(player);
  this.cameras.main.setBounds(0, 0, screen.bounds, screen.height);
  this.physics.world.setBounds(0, 0, screen.bounds, screen.height);

  cursors = this.input.keyboard.createCursorKeys();
  scoreText = this.add.text(16, 16, "Score: 0", { fontSize: "32px", fill: "#000" })
    .setScrollFactor(0);

  // Set sprite animations
  for (let animation of animations) {
    const { spriteName, ...animationConfig } = animation;
    this.anims.create({
      ...animationConfig,
      frames: this.anims.generateFrameNumbers(spriteName),
    });
  }

  let step = 70;
  coins = this.physics.add.group({
    key: "coin",
    repeat: Math.floor(screen.bounds / step),
    setXY: { x: 20, y: 0, stepX: step }
  });

  coins.children.iterate(function (child) {
    child.anims.play("coin-spin")
      .setBounceY(Phaser.Math.FloatBetween(0.4, 0.8))
      .setCollideWorldBounds(true)
      .setScale(1.75);
  });

  bombs = this.physics.add.group();

  this.physics.add.collider(player, platforms);
  this.physics.add.collider(coins, platforms);
  this.physics.add.collider(bombs, platforms);

  this.physics.add.overlap(player, coins, collectCoin, null, this);
  this.physics.add.collider(player, bombs, hitBomb, null, this);
}

let pressedJump;
let canDoubleJump;

function move(flipped, velocity, animationName) {
  if (flipped != null) {
    player.flipX = flipped;
  }
  player.setVelocityX(velocity);

  if (player.body.onFloor()) {
    player.anims.play(animationName, true);
  }
}

function update() {
  if (gameOver) {
    return;
  }

  // Horizontal movement
  if (cursors.left.isDown) {
    if (cursors.shift.isDown) {
      move(true, -450, "running")
    } else {
      move(true, -300, "walking")
    }
  } else if (cursors.right.isDown) {
    if (cursors.shift.isDown) {
      move(false, 450, "running")
    } else {
      move(false, 300, "walking")
    }
  } else if (player.body.onFloor()) {
    move(null, 0, "idle");
  }

  pressedJump = Phaser.Input.Keyboard.JustDown(cursors.space);

  // Jumping movement
  if (pressedJump) {
    if (player.body.onFloor()) {
      canDoubleJump = true;
      player.body.setVelocityY(-350);
    } else if (canDoubleJump) {
      canDoubleJump = false;
      player.body.setVelocityY(-350);
    }
  }

  // Airborne movement
  if (!player.body.onFloor()) {
    if (player.body.velocity.y > 0) {
      player.anims.play("falling", true);

      if (cursors.down.isDown) {
        player.body.setVelocityY(600);
      }
    } else {
      player.anims.play("jumping", true);
    }
  }

  // Move parallax background
  for (let [index, background] of backgrounds.entries()) {
    background.setTilePosition(this.cameras.main.scrollX * (index + 0.5) * 0.1);
  }
}

function collectCoin(player, coin) {
  coin.disableBody(true, true);

  score += 10;
  scoreText.setText("Score: " + score);

  if (coins.countActive(true) === 0) {
    // Spawn new coins once all of them are collected
    coins.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });
  }

  if (score % 100 == 0) {
    let spawnLocation = Phaser.Math.Between(player.x - 200, player.x + 200)
    let numberOfBombs = Math.floor(score / 100);
    while (--numberOfBombs > 0) {
      let bombSize = Phaser.Math.Between(2, 4)

      bombs.create(spawnLocation, 16, "bomb")
        .setBounce(1)
        .setScale(bombSize)
        .setCollideWorldBounds(true)
        .setVelocity(Phaser.Math.Between(-200, 200), 20)
        .allowGravity = false;
    }
  }
}

function hitBomb(player, bomb) {
  this.physics.pause();
  player.setTint(0xff0000);
  player.anims.play("falling");
  music.stop();
  gameOver = true;
}