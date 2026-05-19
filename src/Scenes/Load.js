class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load Tilemap Data
        this.load.image("tiles", "tilemap_packed.png");
        this.load.tilemapTiledJSON("level1", "platformer-level-1.json");

        // Load Spritesheets (Assumes standard Kenney 24x24 characters and 18x18 tiles)
        this.load.spritesheet("characters", "tilemap-characters-packed.png", { frameWidth: 24, frameHeight: 24 });
        this.load.spritesheet("items", "tilemap_packed.png", { frameWidth: 18, frameHeight: 18 });

        // Generate custom particle textures dynamically (so it works without extra image files)
        let g = this.make.graphics({x: 0, y: 0, add: false});
        g.fillStyle(0xffffff, 0.8).fillCircle(4, 4, 4);
        g.generateTexture('dust', 8, 8);
    }

    create() {
        // Kaelen's Animations (Assuming character 1 in Kenney pack)
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('characters', { start: 0, end: 1 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'idle',
            frames: [{ key: 'characters', frame: 0 }],
        });
        this.anims.create({
            key: 'jump',
            frames: [{ key: 'characters', frame: 1 }],
        });

        // Hollowed Guard Animations (Assuming character 2 in Kenney pack)
        this.anims.create({
            key: 'guard_walk',
            frames: this.anims.generateFrameNumbers('characters', { start: 2, end: 3 }),
            frameRate: 6,
            repeat: -1
        });

        this.scene.start("playScene");
    }
}