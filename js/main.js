import { screen, assets, animations } from "./data.js";

const config = {
    type: Phaser.AUTO,
    width: screen.width,
    height: screen.height,
    backgroundColor: "#A5D9C4",
    pixelArt: true,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 1500 },
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
let fistBox;
let platforms;
let coins;
let bombs;

let cursors;
let score = 0;
let scoreText;
let gameOver = false;

let mainTheme;
let deathBit;
let gameOverTheme;

const game = new Phaser.Game(config);

function preload() {
    const { images, sprites, sounds } = assets;

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
    for (let sound of sounds) {
        this.load.audio(sound.name, sound.paths);
    }
}

let backgrounds = [];

function create() {
    // Create parallax background
    const backgroundNames = assets.images
        .filter(image => image.name.startsWith("forest-"))
        .map(image => image.name);

    for (let backgroundName of backgroundNames) {
        backgrounds.push(
            this.add.tileSprite(screen.width / 2, screen.height / 2, 384, 216, backgroundName)
                .setScrollFactor(0, 1)
                .setScale(screen.height / 200)
        );
    }

    // Add music
    mainTheme = this.sound.add("main-theme");
    mainTheme.setLoop(true);
    mainTheme.play();

    deathBit = this.sound.add("death-bit");

    gameOverTheme = this.sound.add("game-over-theme");

    // Create platforms
    platforms = this.physics.add.staticGroup();
    platforms.create(600, 400, "ground");
    platforms.create(50, 250, "ground");
    platforms.create(750, 220, "ground");
    platforms.create(1200, 220, "ground");

    let platformStep = 200;
    for (let index = 0; index < screen.bounds; index += platformStep) {
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

    // Player fist hitbox
    fistBox = this.physics.add
        .sprite(300, 450)
    fistBox.body.setSize(player.displayWidth * 1.3, player.displayHeight / 5, true);
    fistBox.body.allowGravity = false;

    // Set camera
    this.cameras.main.startFollow(player);
    this.cameras.main.setBounds(0, 0, screen.bounds, screen.height);
    this.physics.world.setBounds(0, 0, screen.bounds, screen.height, true, true, false, true);

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
            .setScale(1.75)
            .body.offset.y = 20;
    });

    bombs = this.physics.add.group();

    this.physics.add.collider(coins, platforms);
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(bombs, bombs);
    this.physics.add.collider(player, platforms);

    this.physics.add.collider(fistBox, platforms, grabLedge, inTheAir, this);
    this.physics.add.overlap(player, coins, collectCoin, null, this);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
}


let pressedJump;
let canGrabLedge = true;

function inTheAir() {
    return !player.body.onFloor();
}

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

    fistBox.x = player.x;
    fistBox.y = player.y - 40;

    // Horizontal movement
    if (cursors.left.isDown) {
        if (cursors.shift.isDown) {
            move(true, -470, "running")
        } else {
            move(true, -300, "walking")
        }
    } else if (cursors.right.isDown) {
        if (cursors.shift.isDown) {
            move(false, 470, "running")
        } else {
            move(false, 300, "walking")
        }
    } else if (player.body.onFloor()) {
        move(null, 0, "idle");
    }

    pressedJump = Phaser.Input.Keyboard.JustDown(cursors.space);

    // Jumping movement
    if (pressedJump) {
        if (player.body.onFloor() || hangingOnLedge()) {
            player.anims.play("jumping", true);
            player.body.setVelocityY(-600);
        }
    }

    // Airborne movement
    if (!player.body.onFloor() && !touchingLeftRight()) {
        if (player.body.velocity.y > 0) {
            canGrabLedge = true;
            if (player.body.velocity.y < 500) {
                player.anims.play("landing", true);
            } else {
                player.anims.play("falling", true);
            }

            if (cursors.down.isDown) {
                player.body.setVelocityY(600);
            }
        } else {
            player.anims.play("jumping", true);
        }
    }

    if (!hangingOnLedge() || pressedJump) {
        player.body.allowGravity = true;
    }

    // Move parallax background
    for (let [index, background] of backgrounds.entries()) {
        background.setTilePosition(this.cameras.main.scrollX * (index + 0.5) * 0.1);
    }
}

function holdingLeftRight() {
    return cursors.left.isDown || cursors.right.isDown;
}

function touchingLeftRight() {
    return player.body.touching.left || player.body.touching.right;
}

function hangingOnLedge() {
    return holdingLeftRight() && touchingLeftRight();
}

function grabLedge(fist, platform) {
    if (hangingOnLedge()) {
        if (canGrabLedge) {
            canGrabLedge = false;
            player.setVelocityY(0);
            player.body.allowGravity = false;
            player.anims.play("grabbing", true);
        }
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
            const bombSize = Phaser.Math.Between(2, 4)
            const angularDirection = Math.random() < 0.5 ? 1 : -1;

            const bomb = bombs.create(spawnLocation, 16, "bomb")
                .setBounce(1)
                .setScale(bombSize)
                .setCollideWorldBounds(true)
                .setVelocity(Phaser.Math.Between(-200, 200), 20);

            bomb.allowGravity = false;
            bomb.body.angularVelocity = bombSize * 25 * angularDirection;
        }
    }
}

function hitBomb(player, bomb) {
    player.setTint(0xff0000);
    player.anims.play("falling");
    this.cameras.main.shake(100, 0.005);

    mainTheme.stop();

    if (!gameOver) {
        deathBit.play();
        setTimeout(() => {
            gameOverTheme.play();
            this.cameras.main.fadeOut(13200, 0, 0, 0);
            setTimeout(() => {
                this.physics.pause();
            }, 12700);
        }, 4500);
    }

    player.body.angularVelocity = 200;
    player.allowGravity = false;
    player.setBounce(1);

    gameOver = true;
}