class Play extends Phaser.Scene {
    constructor() {
        super("playScene");
    }

    init() {
        this.ACCEL = 600;
        this.DRAG = 800;
        this.JUMP_VELOCITY = -700;
        
        // Health Configuration (3.0 Max = 3 Visual Hearts)
        this.playerHealth = 3.0;
        this.isInvulnerable = false;
        this.portalCooldown = true;

        // Inventory Management State
        this.inventory = {
            red: false,
            green: false,
            yellow: false,
            blue: false
        };
    }

    create() {
        // 1. IMPORT MAP & LAYERS
        this.map = this.add.tilemap("level1");
        
        // Slices the unified "tiles" atlas cleanly for map rendering using 64x64 grids and 1px spacing
        this.tileset = this.map.addTilesetImage("kenney_tilemap_packed", "tiles", 64, 64, 0, 1);
        
        this.bgSky = this.add.tileSprite(0, 0, this.map.widthInPixels, this.map.heightInPixels, "backgrounds", "background_solid_sky").setOrigin(0, 0).setScrollFactor(0.1);
        this.bgClouds = this.add.tileSprite(0, 100, this.map.widthInPixels, 256, "backgrounds", "background_clouds").setOrigin(0, 0).setScrollFactor(0.3);

        this.platforms = this.map.createLayer("Platforms", this.tileset, 0, 0);
        this.platforms.setCollisionByProperty({ collides: true });

        this.ladders = this.map.createLayer("Ladders", this.tileset, 0, 0);
        this.ladders.setCollisionByProperty({ collides: true });
        
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // 2. SPAWN PLAYER (Kaelen) - 128x128px scaled to 0.5 to fit 64x64px grid
        const pSpawn = this.map.findObject("Spawns", obj => obj.name === "playerSpawn") || { x: 100, y: 100 };
        let pX = pSpawn.x + (pSpawn.width ? pSpawn.width / 2 : 0);
        let pY = pSpawn.y - (pSpawn.height ? pSpawn.height / 2 : 0);
        
        this.player = this.physics.add.sprite(pX, pY, "characters", "character_beige_idle");
        this.player.setScale(0.5);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);

        // 3. INITIALIZE GROUPS
        this.guards = this.physics.add.group();
        this.saws = this.physics.add.group();
        this.hazards = this.physics.add.group();
        this.flies = this.physics.add.group();
        this.fish = this.physics.add.group();
        this.frogs = this.physics.add.group();
        
        this.keys = this.physics.add.group();
        this.lockBlocks = this.physics.add.staticGroup();
        this.flagsMap = {};

        // Track leftmost lock position to position our Force Field barrier properly
        let leftmostLockX = this.map.widthInPixels;

        const spawnObjects = this.map.getObjectLayer("Spawns").objects;

        spawnObjects.forEach(obj => {
            // Smart layout orientation calculations to perfectly match Tiled placement origins
            let x = obj.x;
            let y = obj.y;
            if (obj.width && obj.height) {
                x = obj.x + obj.width / 2;
                y = obj.gid ? (obj.y - obj.height / 2) : (obj.y + obj.height / 2);
            }

            // All items below are native 64x64px textures, rendered at full 1.0 scale
            if (obj.name === "enemySpawn") {
                let e = this.guards.create(x, y, "enemies", "slime_normal_walk_a");
                e.setCollideWorldBounds(true).setVelocityX(80).anims.play('guard_walk');
            }
            else if (obj.name === "sawSpawn") {
                let e = this.saws.create(x, y, "enemies", "saw_a");
                e.body.setAllowGravity(false).setImmovable(true).setCircle(24);
                e.anims.play('saw_anim');
            }
            else if (obj.name === "blockHazardSpawn") {
                let e = this.hazards.create(x, y, "enemies", "block_idle");
                e.body.setAllowGravity(false).setImmovable(true);
            }
            else if (obj.name === "flySpawn") {
                let e = this.flies.create(x, y, "enemies", "fly_a");
                e.body.setAllowGravity(false).setVelocityX(100); e.startX = x;
                e.anims.play('fly_anim');
            }
            else if (obj.name === "fishSpawn") {
                let e = this.fish.create(x, y, "enemies", "fish_blue_swim_a");
                e.body.setAllowGravity(false).setVelocityX(90); e.startX = x;
                e.anims.play('fish_anim');
            }
            else if (obj.name === "frogSpawn") {
                let e = this.frogs.create(x, y, "enemies", "frog_idle");
                e.setCollideWorldBounds(true).setVelocityX(25);
                e.anims.play('frog_anim');
            }
            else if (obj.name.startsWith("key_")) {
                let color = obj.name.split("_")[1];
                let k = this.keys.create(x, y, "tiles", `key_${color}`);
                k.body.setAllowGravity(false);
                k.keyColor = color;
            }
            else if (obj.name.startsWith("lock_")) {
                let color = obj.name.split("_")[1];
                let b = this.lockBlocks.create(x, y, "tiles", `lock_${color}`);
                b.lockColor = color;
                b.refreshBody();
                
                if (x < leftmostLockX) {
                    leftmostLockX = x;
                }
            }
            else if (obj.name.startsWith("flag_")) {
                let color = obj.name.split("_")[1];
                // Kept fixed vertical snapping index position
                let f = this.add.sprite(x, y + 64, "tiles", `flag_${color}_a`);
                f.setAngle(90); 
                f.anims.play(`flag_${color}_anim`);
                this.flagsMap[color] = f;
            }
        });

        this.physics.add.collider(this.guards, this.platforms);
        this.physics.add.collider(this.guards, this.ladders);
        this.physics.add.collider(this.frogs, this.platforms);
        this.physics.add.collider(this.player, this.lockBlocks, this.tryUnlockBlock, null, this);

        // CREATE FORCE FIELD BARRIER
        let barrierHeight = this.map.heightInPixels / 2;
        let barrierY = this.map.heightInPixels - (barrierHeight / 2);
        
        this.forceField = this.add.zone(leftmostLockX + 16, barrierY, 32, barrierHeight);
        this.physics.add.existing(this.forceField, true); 

        // Kept structural top/bottom block fix intact to stop floating bugs
        this.forceField.body.checkCollision.up = false;
        this.forceField.body.checkCollision.down = false;

        this.physics.add.collider(this.player, this.forceField, null, () => {
            return this.lockBlocks.countActive() > 0 && this.player.y > (this.map.heightInPixels / 2);
        }, this);

        this.physics.add.overlap(this.player, this.keys, (player, key) => {
            this.sound.play("sfx_coin"); 
            this.inventory[key.keyColor] = true;
            this.updateHUDText();
            key.destroy();
        }, null, this);

        this.physics.add.overlap(this.player, this.guards, () => this.takeDamage(1.0));
        this.physics.add.overlap(this.player, this.hazards, () => this.takeDamage(1.0));
        this.physics.add.overlap(this.player, this.flies, () => this.takeDamage(1.0));
        this.physics.add.overlap(this.player, this.fish, () => this.takeDamage(1.0));
        this.physics.add.overlap(this.player, this.frogs, () => this.takeDamage(1.0));
        this.physics.add.overlap(this.player, this.saws, () => this.takeDamage(0.5));

        // 4. PORTALS PIPELINE SYSTEM
        this.portalsGroup = this.add.group();
        const pA_start = this.map.findObject("Spawns", obj => obj.name === "portalA_start");
        const pA_end = this.map.findObject("Spawns", obj => obj.name === "portalA_end");
        const pB_start = this.map.findObject("Spawns", obj => obj.name === "portalB_start");
        const pB_end = this.map.findObject("Spawns", obj => obj.name === "portalB_end");

        if (pA_start && pA_end) this.linkPortals(pA_start, pA_end, "A");
        if (pB_start && pB_end) this.linkPortals(pB_start, pB_end, "B");

        // 5. EXIT ZONE SETUP
        const exitSpawn = this.map.findObject("Spawns", obj => obj.name === "levelExit");
        if (exitSpawn) {
            let exX = exitSpawn.x + (exitSpawn.width ? exitSpawn.width / 2 : 0);
            let exY = exitSpawn.y - (exitSpawn.height ? exitSpawn.height / 2 : 0);
            this.exitZone = this.add.zone(exX, exY, 64, 64);
            this.physics.add.existing(this.exitZone);
            this.exitZone.body.setAllowGravity(false);
            this.physics.add.overlap(this.player, this.exitZone, () => this.scene.start("gameOverScene", { outcome: "win" }));
        }

        this.runTrail = this.add.particles(0, 0, 'dust', { speedX: { min: -20, max: 20 }, speedY: { min: -10, max: -30 }, scale: { start: 0.6, end: 0 }, lifespan: 200, emitting: false });
        this.jumpDust = this.add.particles(0, 0, 'dust', { speed: { min: 30, max: 120 }, scale: { start: 1, end: 0 }, lifespan: 250, gravityY: 100, emitting: false });

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setDeadzone(120, 60);

        // HUD Hearts setup
        this.hudHearts = [];
        for (let i = 0; i < 3; i++) {
            let heart = this.add.image(32 + i * 42, 32, "tiles", "hud_heart").setScrollFactor(0).setScale(0.6);
            this.hudHearts.push(heart);
        }

        this.inventoryText = this.add.text(16, 60, "Keys: None", { fontSize: '16px', fill: '#FFF', fontFamily: 'Courier' }).setScrollFactor(0);
        this.promptText = this.add.text(400, 250, "", { fontSize: '20px', fill: '#FFFF00', fontFamily: 'Courier' }).setOrigin(0.5).setScrollFactor(0);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.eKey = this.input.keyboard.addKey('E');

        this.time.delayedCall(500, () => { this.portalCooldown = false; });
    }

    updateHUDText() {
        let currentKeys = [];
        if (this.inventory.red) currentKeys.push("RED");
        if (this.inventory.green) currentKeys.push("GREEN");
        if (this.inventory.yellow) currentKeys.push("YELLOW");
        if (this.inventory.blue) currentKeys.push("BLUE");
        this.inventoryText.setText("Keys: " + (currentKeys.length > 0 ? currentKeys.join(", ") : "None"));
    }

    drawHeartsHUD() {
        let remainder = this.playerHealth;
        for (let i = 0; i < 3; i++) {
            if (remainder >= 1.0) {
                this.hudHearts[i].setFrame("hud_heart");
                remainder -= 1.0;
            } else if (remainder >= 0.5) {
                this.hudHearts[i].setFrame("hud_heart_half");
                remainder -= 0.5;
            } else {
                this.hudHearts[i].setFrame("hud_heart_empty");
            }
        }
    }

    tryUnlockBlock(player, block) {
        let color = block.lockColor;
        if (this.inventory[color]) {
            this.sound.play("sfx_disappear"); 
            this.inventory[color] = false;
            this.updateHUDText();
            
            if (this.flagsMap[color]) {
                this.flagsMap[color].anims.stop();
                this.flagsMap[color].setFrame("flag_off");
            }
            block.destroy();
        } else {
            if (!this.sound.isPlaying("sfx_bump")) {
                this.sound.play("sfx_bump");
            }
        }
    }

    linkPortals(loc1, loc2, type) {
        let w1 = loc1.width || 64; let h1 = loc1.height || 64;
        let w2 = loc2.width || 64; let h2 = loc2.height || 64;

        let gate1 = this.add.zone(loc1.x + w1 / 2, loc1.y - h1 / 2, w1, h1);
        let gate2 = this.add.zone(loc2.x + w2 / 2, loc2.y - h2 / 2, w2, h2);
        
        this.physics.add.existing(gate1); this.physics.add.existing(gate2);
        gate1.body.setAllowGravity(false); gate2.body.setAllowGravity(false);

        gate1.targetX = loc2.x + w2 / 2; gate1.targetY = loc2.y - h2 / 2;
        gate2.targetX = loc1.x + w1 / 2; gate2.targetY = loc1.y - h1 / 2;
        gate1.portalType = type; gate2.portalType = type;

        this.portalsGroup.add(gate1); this.portalsGroup.add(gate2);
    }

    takeDamage(amount) {
        if (!this.isInvulnerable && this.player.body.enable) {
            this.isInvulnerable = true;
            this.playerHealth -= amount;
            this.drawHeartsHUD();
            this.sound.play("sfx_hurt"); 

            // Floating damage hearts effect
            let targetFrame = amount === 0.5 ? "hud_heart_half" : "hud_heart";
            let floatingHeart = this.add.image(this.player.x, this.player.y - 16, "tiles", targetFrame).setScale(0.4);
            
            this.tweens.add({
                targets: floatingHeart,
                y: floatingHeart.y - 64,
                alpha: 0,
                duration: 600,
                onComplete: () => { floatingHeart.destroy(); }
            });

            if (this.playerHealth <= 0) {
                this.player.body.enable = false;
                this.player.anims.play('hit');
                this.runTrail.stop();
                this.time.delayedCall(500, () => this.scene.start("gameOverScene", { outcome: "death" }));
            } else {
                this.tweens.add({
                    targets: this.player, alpha: 0.3, duration: 100, yoyo: true, repeat: 4,
                    onComplete: () => { this.player.alpha = 1.0; this.isInvulnerable = false; }
                });
            }
        }
    }

    update() {
        if (!this.player.body.enable) return;

        const onLadder = this.ladders.getTileAtWorldXY(this.player.x, this.player.y);
        let isClimbing = false;
        let isCrouching = false;

        // FIXED: BOUNDED DYNAMIC BACKGROUND MECHANIC
        // Changes look ONLY when player enters the central underwater cave or the final right-side lock room.
        // It uses an X-axis check (> 35% of level width) to ignore the starting bunker room on the left!
        if (this.player.y > this.map.heightInPixels / 2 && this.player.x > this.map.widthInPixels * 0.35) {
            this.bgSky.setTint(0x1a1a24); // Dark cave tint
            this.bgClouds.setVisible(false); // Hide overworld clouds
        } else {
            this.bgSky.clearTint(); // Restore standard sky colors
            this.bgClouds.setVisible(true); // Re-render drifting clouds
        }

        this.promptText.setText(""); 
        let overlappingPortal = null;

        this.physics.overlap(this.player, this.portalsGroup, (player, portal) => {
            overlappingPortal = portal;
        });

        // Portal Activation Input Tracking
        if (overlappingPortal && !this.portalCooldown) {
            let type = overlappingPortal.portalType;
            if (type === "A") {
                if (this.inventory.red) {
                    this.promptText.setText("Press E to Enter Portal");
                    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                        this.sound.play("sfx_magic"); 
                        this.portalCooldown = true;
                        this.player.setPosition(overlappingPortal.targetX, overlappingPortal.targetY);
                        this.time.delayedCall(800, () => { this.portalCooldown = false; });
                    }
                } else {
                    this.promptText.setText("Requires RED Key");
                }
            } else if (type === "B") {
                if (this.inventory.red && this.inventory.green && this.inventory.yellow && this.inventory.blue) {
                    this.promptText.setText("Press E to Enter Portal");
                    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                        this.sound.play("sfx_magic"); 
                        this.portalCooldown = true;
                        this.player.setPosition(overlappingPortal.targetX, overlappingPortal.targetY);
                        this.time.delayedCall(800, () => { this.portalCooldown = false; });
                    }
                } else {
                    this.promptText.setText("Requires RED, GREEN, YELLOW, & BLUE Keys");
                }
            }
        }

        // Climbing Controls
        if (onLadder) {
            if (this.cursors.up.isDown) {
                this.player.body.setAllowGravity(false);
                this.player.setVelocityY(-250);
                this.player.anims.play('climb', true);
                isClimbing = true;
            } else if (this.cursors.down.isDown) {
                this.player.body.setAllowGravity(false);
                this.player.setVelocityY(250);
                this.player.anims.play('climb', true);
                isClimbing = true;
            } else {
                if (!this.player.body.blocked.down) {
                    this.player.body.setAllowGravity(false);
                    this.player.setVelocityY(0);
                    this.player.anims.play('climb', true).anims.stop();
                    isClimbing = true;
                } else {
                    this.player.body.setAllowGravity(true);
                }
            }
        } else {
            this.player.body.setAllowGravity(true);
        }

        if (!isClimbing && this.cursors.down.isDown && this.player.body.blocked.down) {
            isCrouching = true;
            this.player.setAccelerationX(0); this.player.setVelocityX(0);
            this.player.anims.play('duck', true);
            this.runTrail.stop();
        }

        if (!isCrouching) {
            if (this.cursors.left.isDown) {
                this.player.setAccelerationX(-this.ACCEL); this.player.setFlipX(true);
                if (!isClimbing) this.player.anims.play('walk', true);
                this.runTrail.start().setPosition(this.player.x + 8, this.player.y + 24);
            } else if (this.cursors.right.isDown) {
                this.player.setAccelerationX(this.ACCEL); this.player.setFlipX(false);
                if (!isClimbing) this.player.anims.play('walk', true);
                this.runTrail.start().setPosition(this.player.x - 8, this.player.y + 24);
            } else {
                this.player.setAccelerationX(0); this.player.setDragX(this.DRAG);
                if (!isClimbing) this.player.anims.play('idle');
                this.runTrail.stop();
            }
        }

        if (!this.player.body.blocked.down && !isClimbing) this.player.anims.play('jump');
        
        if (this.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.cursors.up) && !isCrouching && !isClimbing) {
            this.sound.play("sfx_jump");
            this.player.setVelocityY(this.JUMP_VELOCITY);
            this.jumpDust.explode(12, this.player.x, this.player.y + 24);
        }

        // --- ENEMY RADIAL PATROLS & MOVEMENTS ---
        this.guards.getChildren().forEach(enemy => {
            if (enemy.body.blocked.right) { enemy.setVelocityX(-80); enemy.setFlipX(false); }
            else if (enemy.body.blocked.left) { enemy.setVelocityX(80); enemy.setFlipX(true); }
        });
        this.flies.getChildren().forEach(enemy => {
            if (enemy.x >= enemy.startX + 192) { enemy.setVelocityX(-100); enemy.setFlipX(false); }
            else if (enemy.x <= enemy.startX - 192) { enemy.setVelocityX(100); enemy.setFlipX(true); }
        });
        this.fish.getChildren().forEach(enemy => {
            if (enemy.x >= enemy.startX + 192) { enemy.setVelocityX(-90); enemy.setFlipX(false); }
            else if (enemy.x <= enemy.startX - 192) { enemy.setVelocityX(90); enemy.setFlipX(true); }
        });
        
        this.frogs.getChildren().forEach(enemy => {
            if (enemy.body.blocked.right) { enemy.setVelocityX(-25); enemy.setFlipX(false); }
            else if (enemy.body.blocked.left) { enemy.setVelocityX(25); enemy.setFlipX(true); }
            
            if (enemy.body.blocked.down && Phaser.Math.Between(0, 100) < 2) { 
                this.sound.play("sfx_jump_high", { volume: 0.6 }); 
                enemy.setVelocityY(-350); 
            }
        });
    }
}