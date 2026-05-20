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

        // --- SPECIFIC KENNEY FANTASY UI SHEET SEPARATIONS ---
        // Main structural slate container board
        // Circled Left Box: Gray-filled main slate plate container background
        this.load.image("ui_panel", "kenney_fantasy-ui-borders/PNG/Default/Transparent center/panel-transparent-center-022.png");
        
        // Circled Middle-Right Box: Solid inset panel frames used for the inventory slot grids
        this.load.image("ui_slot", "kenney_fantasy-ui-borders/PNG/Default/Transparent center/panel-transparent-center-008.png");
        
        // Circled Middle-Right Box: Double-outlined interactive selection buttons
        this.load.image("ui_button", "kenney_fantasy-ui-borders/PNG/Default/Transparent center/panel-transparent-center-020.png");
        
        // Circled Bottom-Right Box: Horizontal lines with cross-ornaments used for header titles
        this.load.image("ui_divider", "kenney_fantasy-ui-borders/PNG/Default/Divider Fade/divider-fade-000.png");

        // Generate particle footprint texture
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
        // --- PLAYER BEIGE ASTRONAUT ANIMATIONS ---
        this.anims.create({
            key: 'walk',
            frames: [{ key: 'characters', frame: 'character_beige_walk_a' }, { key: 'characters', frame: 'character_beige_walk_b' }],
            frameRate: 10, repeat: -1
        });
        this.anims.create({
            key: 'climb',
            frames: [{ key: 'characters', frame: 'character_beige_climb_a' }, { key: 'characters', frame: 'character_beige_climb_b' }],
            frameRate: 8, repeat: -1
        });
        this.anims.create({
            key: 'idle', frames: [{ key: 'characters', frame: 'character_beige_idle' }]
        });
        this.anims.create({
            key: 'jump', frames: [{ key: 'characters', frame: 'character_beige_jump' }]
        });
        this.anims.create({
            key: 'duck', frames: [{ key: 'characters', frame: 'character_beige_duck' }]
        });
        this.anims.create({
            key: 'front', frames: [{ key: 'characters', frame: 'character_beige_front' }]
        });
        this.anims.create({
            key: 'hit', frames: [{ key: 'characters', frame: 'character_beige_hit' }]
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

        this.scene.start("menuScene");
    }
}