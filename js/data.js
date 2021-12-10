export const screen = { width: 1000, height: 600, bounds: 3000 };

export const assets = {
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
    { name: "hero-grab", path: "assets/sprites/grab.png", frameInfo: { frameWidth: 22, frameHeight: 42 } },
    { name: "coin", path: "assets/sprites/coin.png", frameInfo: { frameWidth: 16, frameHeight: 16 } }
  ],
  sounds: [
    { name: "main-theme", paths: ["assets/audio/main_theme.mp3"] },
    { name: "death-bit", paths: ["assets/audio/death_bit.mp3"] },
    { name: "game-over-theme", paths: ["assets/audio/game_over_theme.mp3"] },
  ]
}

export const animations = [
  { key: "idle", spriteName: "hero-idle", frameRate: 10 },
  { key: "walking", spriteName: "hero-run", frameRate: 10 },
  { key: "running", spriteName: "hero-run", frameRate: 17 },
  { key: "jumping", spriteName: "hero-jump" },
  { key: "falling", spriteName: "hero-fall", frameRate: 10 },
  { key: "landing", spriteName: "hero-land" },
  { key: "grabbing", spriteName: "hero-grab", frameRate: 10, repeat: 0 },
  { key: "coin-spin", spriteName: "coin", frameRate: 10, repeat: -1 },
];