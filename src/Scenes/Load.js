class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load Environment Assets
        this.load.atlasXML("tiles", "spritesheet-tiles-default.png", "spritesheet-tiles-default.xml");
        this.load.tilemapTiledJSON("level1", "platformer-level-1.json");

        // Load XML Texture Atlases
        this.load.atlasXML("characters", "spritesheet-characters-default.png", "spritesheet-characters-default.xml");
        this.load.atlasXML("enemies", "spritesheet-enemies-default.png", "spritesheet-enemies-default.xml");
        this.load.atlasXML("backgrounds", "spritesheet-backgrounds-default.png", "spritesheet-backgrounds-default.xml");

        // Generate particle texture
        let g = this.make.graphics({x: 0, y: 0, add: false});
        g.fillStyle(0xffffff, 0.8).fillCircle(4, 4, 4);
        g.generateTexture('dust', 8, 8);

        // --- AUDIO SOUND EFFECTS PACK ---
        this.load.audio("sfx_bump", "sfx_bump.ogg");
        this.load.audio("sfx_coin", "sfx_coin.ogg");
        this.load.audio("sfx_disappear", "sfx_disappear.ogg");
        this.load.audio("sfx_gem", "sfx_gem.ogg");
        this.load.audio("sfx_hurt", "sfx_hurt.ogg");
        this.load.audio("sfx_jump", "sfx_jump.ogg");
        this.load.audio("sfx_jump_high", "sfx_jump-high.ogg");
        this.load.audio("sfx_magic", "sfx_magic.ogg");
        this.load.audio("sfx_select", "sfx_select.ogg");
        this.load.audio("sfx_throw", "sfx_throw.ogg");
    }

    create() {
        // 1. Walking Animation (The two frames on the bottom row)
        this.anims.create({
            key: 'walk',
            frames: [
                { key: 'characters', frame: 'character_beige_walk_a' },
                { key: 'characters', frame: 'character_beige_walk_b' }
            ],
            frameRate: 10,
            repeat: -1
        });

        // 2. Climbing Animation (The first two frames on the top row)
        this.anims.create({
            key: 'climb',
            frames: [
                { key: 'characters', frame: 'character_beige_climb_a' },
                { key: 'characters', frame: 'character_beige_climb_b' }
            ],
            frameRate: 8,
            repeat: -1
        });

        // 3. Idle Animation (Standard side-facing profile)
        this.anims.create({
            key: 'idle',
            frames: [{ key: 'characters', frame: 'character_beige_idle' }]
        });

        // 4. Jump Animation (Single-frame dynamic aerial pose)
        this.anims.create({
            key: 'jump',
            frames: [{ key: 'characters', frame: 'character_beige_jump' }]
        });

        // 5. Duck Animation (Crouching state)
        this.anims.create({
            key: 'duck',
            frames: [{ key: 'characters', frame: 'character_beige_duck' }]
        });

        // 6. Front Animation (Facing the screen directly)
        this.anims.create({
            key: 'front',
            frames: [{ key: 'characters', frame: 'character_beige_front' }]
        });

        // 7. Hit Animation (Knockback / Damage frame)
        this.anims.create({
            key: 'hit',
            frames: [{ key: 'characters', frame: 'character_beige_hit' }]
        });

        // --- ENEMY INFRASTRUCTURE ANIMATIONS ---
        this.anims.create({
            key: 'guard_walk',
            frames: [{ key: 'enemies', frame: 'slime_normal_walk_a' }, { key: 'enemies', frame: 'slime_normal_walk_b' }],
            frameRate: 6, repeat: -1
        });
        this.anims.create({
            key: 'fly_anim',
            frames: [{ key: 'enemies', frame: 'fly_a' }, { key: 'enemies', frame: 'fly_b' }],
            frameRate: 8, repeat: -1
        });
        this.anims.create({
            key: 'fish_anim',
            frames: [{ key: 'enemies', frame: 'fish_blue_swim_a' }, { key: 'enemies', frame: 'fish_blue_swim_b' }],
            frameRate: 6, repeat: -1
        });
        this.anims.create({
            key: 'saw_anim',
            frames: [{ key: 'enemies', frame: 'saw_a' }, { key: 'enemies', frame: 'saw_b' }],
            frameRate: 12, repeat: -1
        });
        this.anims.create({
            key: 'frog_anim',
            frames: [{ key: 'enemies', frame: 'frog_idle' }, { key: 'enemies', frame: 'frog_jump' }],
            frameRate: 4, repeat: -1
        });

        // --- FLAG ANIMATION LOOPS ---
        const colors = ['red', 'green', 'blue', 'yellow'];
        colors.forEach(color => {
            this.anims.create({
                key: `flag_${color}_anim`,
                frames: [
                    { key: 'tiles', frame: `flag_${color}_a` },
                    { key: 'tiles', frame: `flag_${color}_b` }
                ],
                frameRate: 4,
                repeat: -1
            });
        });

        this.scene.start("playScene");
    }
}