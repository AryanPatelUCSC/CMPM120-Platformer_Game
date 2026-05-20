class Play extends Phaser.Scene {
    constructor() {
        super("playScene");
    }

    init() {
        this.portalCooldown = true;
        this.inventory = { red: false, green: false, yellow: false, blue: false };
        this.isReadingStory = false;
        this.lastDiscoveredLocation = "";
    }

    create() {
        // 1. IMPORT ENVIRONMENT MAP
        this.map = this.add.tilemap("level1");
        this.tileset = this.map.addTilesetImage("kenney_tilemap_packed", "tiles", 64, 64, 0, 1);
        
        this.bgSky = this.add.tileSprite(0, 0, this.map.widthInPixels, this.map.heightInPixels, "backgrounds", "background_solid_sky").setOrigin(0, 0).setScrollFactor(0.1);
        this.bgClouds = this.add.tileSprite(0, 100, this.map.widthInPixels, 256, "backgrounds", "background_clouds").setOrigin(0, 0).setScrollFactor(0.3);

        this.platforms = this.map.createLayer("Platforms", this.tileset, 0, 0);
        this.platforms.setCollisionByProperty({ collides: true });

        this.ladders = this.map.createLayer("Ladders", this.tileset, 0, 0);
        this.ladders.setCollisionByProperty({ collides: true });
        
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // 2. INITIALIZE ACTOR GROUPS
        this.guards = this.physics.add.group();
        this.saws = this.physics.add.group();
        this.hazards = this.physics.add.group();
        this.flies = this.physics.add.group();
        this.fish = this.physics.add.group();
        this.frogs = this.physics.add.group();
        this.keys = this.physics.add.group();
        this.lockBlocks = this.physics.add.staticGroup();
        this.flagsMap = {};

        // 3. COMPILE TILED INTERACTIVES VIA MODULAR SPAWNER
        let leftmostLockX = Spawner.parseObjects(this);

        // 4. INSTANTIATE PLAYER PREFAB CLASS
        const pSpawn = this.map.findObject("Spawns", obj => obj.name === "playerSpawn") || { x: 100, y: 100 };
        let pX = pSpawn.x + (pSpawn.width ? pSpawn.width / 2 : 0);
        let pY = pSpawn.y - (pSpawn.height ? pSpawn.height / 2 : 0);
        
        this.player = new Player(this, pX, pY);

        // 5. SECURITY & ENEMY PHYSICS BARRIERS
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.lockBlocks, this.tryUnlockBlock, null, this);

        this.physics.add.collider(this.guards, this.platforms);
        this.physics.add.collider(this.guards, this.ladders);
        this.physics.add.collider(this.frogs, this.platforms);

        let barrierHeight = this.map.heightInPixels / 2;
        let barrierY = this.map.heightInPixels - (barrierHeight / 2);
        this.forceField = this.add.zone(leftmostLockX + 16, barrierY, 32, barrierHeight);
        this.physics.add.existing(this.forceField, true); 
        this.forceField.body.checkCollision.up = false;
        this.forceField.body.checkCollision.down = false;

        this.physics.add.collider(this.player, this.forceField, null, () => {
            return this.lockBlocks.countActive() > 0 && this.player.y > (this.map.heightInPixels / 2);
        }, this);

        // 6. DYNAMICALLY LOOP AND SPAWN FROM OBJECT LAYER
        const spawnObjects = this.map.getObjectLayer("Spawns").objects;
        spawnObjects.forEach(obj => {
            let x = obj.x;
            let y = obj.y;
            if (obj.width && obj.height) {
                x = obj.x + obj.width / 2;
                y = obj.gid ? (obj.y - obj.height / 2) : (obj.y + obj.height / 2);
            }

            if (obj.name === "storySign") {
                this.storySignZone = this.physics.add.sprite(x, y, "tiles", "sign");
                this.storySignZone.body.setAllowGravity(false);
                this.storySignZone.body.setImmovable(true);
            }
        });

        // 7. MAP OVERLAP RECOGNIZERS
        this.physics.add.overlap(this.player, this.keys, (player, key) => {
            this.sound.play("sfx_coin"); 
            this.inventory[key.keyColor] = true;
            this.updateHUDText();
            key.destroy();
        }, null, this);

        this.physics.add.overlap(this.player, this.guards, () => this.player.takeDamage(1.0));
        this.physics.add.overlap(this.player, this.hazards, () => this.player.takeDamage(1.0));
        this.physics.add.overlap(this.player, this.flies, () => this.player.takeDamage(1.0));
        this.physics.add.overlap(this.player, this.fish, () => this.player.takeDamage(1.0));
        this.physics.add.overlap(this.player, this.frogs, () => this.player.takeDamage(1.0));
        this.physics.add.overlap(this.player, this.saws, () => this.player.takeDamage(0.5));

        // Link Portals & Gates
        this.portalsGroup = this.add.group();
        const pA_start = this.map.findObject("Spawns", obj => obj.name === "portalA_start");
        const pA_end = this.map.findObject("Spawns", obj => obj.name === "portalA_end");
        const pB_start = this.map.findObject("Spawns", obj => obj.name === "portalB_start");
        const pB_end = this.map.findObject("Spawns", obj => obj.name === "portalB_end");
        if (pA_start && pA_end) this.linkPortals(pA_start, pA_end, "A");
        if (pB_start && pB_end) this.linkPortals(pB_start, pB_end, "B");

        const exitSpawn = this.map.findObject("Spawns", obj => obj.name === "levelExit");
        if (exitSpawn) {
            let exX = exitSpawn.x + (exitSpawn.width ? exitSpawn.width / 2 : 0);
            let exY = exitSpawn.y - (exitSpawn.height ? exitSpawn.height / 2 : 0);
            this.exitZone = this.add.zone(exX, exY, 64, 64);
            this.physics.add.existing(this.exitZone);
            this.exitZone.body.setAllowGravity(false);
            this.physics.add.overlap(this.player, this.exitZone, () => this.scene.start("gameOverScene", { outcome: "win" }));
        }

        // 8. INTERFACE HUD & CAMERA SETUP
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 1.0, 1.0);
        this.cameras.main.setDeadzone(120, 60);

        this.hudHearts = [];
        for (let i = 0; i < 3; i++) {
            let heart = this.add.image(32 + i * 42, 32, "tiles", "hud_heart").setScrollFactor(0).setScale(0.6).setDepth(30);
            this.hudHearts.push(heart);
        }

        // --- FIXED: VISUAL INVENTORY HUD PANEL COLORS ---
        this.inventoryPanel = this.add.nineslice(16, 55, "ui_panel", null, 260, 100, 20, 20, 20, 20).setOrigin(0, 0).setScrollFactor(0).setDepth(30);
        // Changed to charcoal black for clear legibility on the light gray board layer
        this.inventoryTitle = this.add.text(146, 62, "Inventory", { fontSize: '15px', fill: '#1a1a1a', fontFamily: 'MedievalSharp', fontWeight: 'bold' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(31);
        
        this.slots = [];
        this.slotIcons = [];
        this.slotQuantities = [];
        const colors = ['red', 'green', 'yellow', 'blue'];
        
        colors.forEach((color, idx) => {
            let sX = 34 + (idx * 56);
            let sY = 85;
            
            let slot = this.add.image(sX, sY, "ui_slot").setOrigin(0, 0).setScrollFactor(0).setDepth(31).setDisplaySize(44, 44);
            let icon = this.add.image(sX + 22, sY + 22, "tiles", `key_${color}`).setScrollFactor(0).setDepth(32).setScale(0.7).setAlpha(0.25);
            let qty = this.add.text(sX + 22, sY + 35, "0", { fontSize: '11px', fill: '#1a1a1a', fontFamily: 'MedievalSharp' }).setOrigin(0.5).setScrollFactor(0).setDepth(33);
            
            this.slots.push(slot);
            this.slotIcons.push(icon);
            this.slotQuantities.push(qty);
        });

        // Prompt Notification Plate Setup
        this.promptUIBox = this.add.nineslice(400, 250, "ui_button", null, 200, 50, 15, 15, 15, 15).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(10);
        // Changed to obsidian dark brown text format
        this.promptText = this.add.text(400, 250, "", { fontSize: '16px', fill: '#1a1a1a', fontFamily: 'MedievalSharp', fontWeight: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(11);
        
        // --- FIXED: CINEMATIC RPG BOTTOM NARRATIVE DIALOGUE LAYOUT ---
        // Moved down to y: 500 and widened to 720px to prevent colliding with top inventory arrays!
        this.storyUIBox = this.add.nineslice(400, 500, "ui_panel", null, 720, 140, 20, 20, 20, 20).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(40);
        // Changed fill style to high-contrast absolute black (#1a1a1a) for maximum crisp readability
        this.storyUIText = this.add.text(400, 500, "", {
            fontFamily: 'MedievalSharp',
            fontSize: '16px',
            fill: '#1a1a1a',
            align: 'center',
            wordWrap: { width: 660 },
            lineSpacing: 6
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(41);

        // --- LOCATION POPUP BANNER SYSTEM ---
        this.locSubtitleText = this.add.text(400, 225, "Location discovered", { fontFamily: 'MedievalSharp', fontSize: '14px', fill: '#555555' }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(41);
        this.locTitleText = this.add.text(400, 255, "", { fontFamily: 'MedievalSharp', fontSize: '28px', fill: '#8b0000', fontWeight: 'bold' }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(41);
        
        this.locLeftDivider = this.add.image(400, 225, "ui_divider").setScrollFactor(0).setVisible(false).setDepth(40).setScale(0.8);
        this.locRightDivider = this.add.image(400, 225, "ui_divider").setScrollFactor(0).setVisible(false).setDepth(40).setScale(0.8);

        this.eKey = this.input.keyboard.addKey('E');

        this.time.delayedCall(500, () => { this.portalCooldown = false; });
    }

    triggerLocationDiscovery(locationName) {
        if (this.lastDiscoveredLocation === locationName) return;
        this.lastDiscoveredLocation = locationName;

        this.tweens.killTweensOf([this.locSubtitleText, this.locTitleText, this.locLeftDivider, this.locRightDivider]);
        this.locTitleText.setText(locationName);
        
        let textWidth = this.locSubtitleText.width;
        this.locLeftDivider.setPosition(400 - (textWidth / 2) - 80, 225);
        this.locRightDivider.setPosition(400 + (textWidth / 2) + 80, 225);

        let uiElements = [this.locSubtitleText, this.locTitleText, this.locLeftDivider, this.locRightDivider];

        uiElements.forEach(el => { el.setVisible(true).setAlpha(0).setScale(1.0); });
        this.locLeftDivider.setScale(0.8); this.locRightDivider.setScale(0.8);

        this.tweens.add({
            targets: uiElements, alpha: 1, duration: 600,
            onComplete: () => {
                this.time.delayedCall(2000, () => {
                    this.tweens.add({
                        targets: uiElements, alpha: 0, scaleY: 0.2, scaleX: 0.8, duration: 800, ease: 'Quad.easeOut',
                        onComplete: () => { uiElements.forEach(el => el.setVisible(false)); }
                    });
                });
            }
        });
    }

    updateHUDText() {
        const colors = ['red', 'green', 'yellow', 'blue'];
        colors.forEach((color, idx) => {
            if (this.inventory[color]) {
                this.slotIcons[idx].setAlpha(1.0);
                this.slotQuantities[idx].setText("1").setFill("#8b0000"); // Distinct red number count indicator
            } else {
                this.slotIcons[idx].setAlpha(0.25);
                this.slotQuantities[idx].setText("0").setFill("#1a1a1a");
            }
        });
    }

    drawHeartsHUD() {
        let remainder = this.player.health;
        for (let i = 0; i < 3; i++) {
            if (remainder >= 1.0) { this.hudHearts[i].setFrame("hud_heart"); remainder -= 1.0; } 
            else if (remainder >= 0.5) { this.hudHearts[i].setFrame("hud_heart_half"); remainder -= 0.5; } 
            else { this.hudHearts[i].setFrame("hud_heart_empty"); }
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
            if (!this.sound.isPlaying("sfx_bump")) this.sound.play("sfx_bump");
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

    update() {
        if (!this.player.body.enable) return;

        const onLadder = this.ladders.getTileAtWorldXY(this.player.x, this.player.y);

        // --- STORY-THEMED GRID REGION DISCOVERY MAPS ---
        if (this.player.y > this.map.heightInPixels * 0.5 && this.player.x > this.map.widthInPixels * 0.35 && this.player.x < this.map.widthInPixels * 0.60) {
            this.triggerLocationDiscovery("Vane’s Sunken Crypts");
            this.bgSky.setTint(0x1a1a24); this.bgClouds.setVisible(false);
        } 
        else if (this.player.y > this.map.heightInPixels * 0.5 && this.player.x >= this.map.widthInPixels * 0.60) {
            this.triggerLocationDiscovery("The Hollowed Bastion");
            this.bgSky.setTint(0x1a1a24); this.bgClouds.setVisible(false);
        }
        else if (this.player.x < this.map.widthInPixels * 0.28) {
            this.triggerLocationDiscovery("Village of Aethel");
            this.bgSky.clearTint(); this.bgClouds.setVisible(true);
        }
        else if (this.player.x >= this.map.widthInPixels * 0.28 && this.player.x < this.map.widthInPixels * 0.60) {
            this.triggerLocationDiscovery("Moat of the Whispering Falls");
            this.bgSky.clearTint(); this.bgClouds.setVisible(true);
        }
        else {
            this.triggerLocationDiscovery("Fortress of Aethelred");
            this.bgSky.clearTint(); this.bgClouds.setVisible(true);
        }

        this.promptText.setText(""); 
        this.promptUIBox.setVisible(false);

        // OPTIONAL INTERACTIVE NARRATIVE LOGIC
        let touchingSign = false;
        if (this.storySignZone) {
            touchingSign = this.physics.overlap(this.player, this.storySignZone);
        }

        if (touchingSign) {
            if (!this.isReadingStory) {
                this.promptText.setText("Press E to Read Sign");
                if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                    this.sound.play("sfx_select");
                    this.isReadingStory = true;
                    this.storyUIBox.setVisible(true);
                    this.storyUIText.setText("Kaelen, the final echo... The Hollowed forces have seized the cavern gates. Gather the keys scattered across the realm to breach the fortress, before the truth dies here.");
                    this.storyUIText.setVisible(true);
                }
            } else {
                this.promptText.setText("Press E to Close");
                if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                    this.sound.play("sfx_bump");
                    this.isReadingStory = false;
                    this.storyUIBox.setVisible(false);
                    this.storyUIText.setVisible(false);
                }
            }
        } else {
            this.isReadingStory = false;
            this.storyUIBox.setVisible(false);
            this.storyUIText.setVisible(false);
        }

        // Warp Portals logic configurations (Only checks if not busy reading the sign)
        if (!touchingSign) {
            let overlappingPortal = null;
            this.physics.overlap(this.player, this.portalsGroup, (player, portal) => { overlappingPortal = portal; });

            if (overlappingPortal && !this.portalCooldown) {
                let type = overlappingPortal.portalType;
                if (type === "A" && this.inventory.red) {
                    this.promptText.setText("Press E to Enter Portal");
                    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                        this.sound.play("sfx_magic"); this.portalCooldown = true;
                        this.player.setPosition(overlappingPortal.targetX, overlappingPortal.targetY);
                        this.time.delayedCall(800, () => { this.portalCooldown = false; });
                    }
                } else if (type === "B" && this.inventory.red && this.inventory.green && this.inventory.yellow && this.inventory.blue) {
                    this.promptText.setText("Press E to Enter Portal");
                    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                        this.sound.play("sfx_magic"); this.portalCooldown = true;
                        this.player.setPosition(overlappingPortal.targetX, overlappingPortal.targetY);
                        this.time.delayedCall(800, () => { this.portalCooldown = false; });
                    }
                } else {
                    this.promptText.setStyle({ fill: '#8b0000' }); // Dark red for access errors
                    this.promptText.setText(type === "A" ? "Requires RED Key" : "Requires RED, GREEN, YELLOW, & BLUE Keys");
                }
            }
        }

        if (this.promptText.text !== "") {
            this.promptUIBox.setVisible(true);
            this.promptUIBox.width = this.promptText.width + 40;
        }

        this.player.update(onLadder);
        Spawner.updateEnemies(this);
    }
}