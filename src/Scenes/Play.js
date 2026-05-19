class Play extends Phaser.Scene {
    constructor() {
        super("playScene");
    }

    init() {
        this.ACCEL = 400;
        this.DRAG = 600;
        this.JUMP_VELOCITY = -650;
        this.SCALE = 2.0;
        this.score = 0;
    }

    create() {
        // 1. TILEMAP
        this.map = this.add.tilemap("level1");
        this.tileset = this.map.addTilesetImage("kenney_tilemap_packed", "tiles"); // Must match Tiled tileset name
        
        this.platforms = this.map.createLayer("Platforms", this.tileset, 0, 0);
        this.platforms.setScale(this.SCALE);
        this.platforms.setCollisionByProperty({ collides: true });
        this.physics.world.setBounds(0, 0, this.map.widthInPixels * this.SCALE, this.map.heightInPixels * this.SCALE);

        // 2. PLAYER (Kaelen)
        const pSpawn = this.map.findObject("Spawns", obj => obj.name === "playerSpawn") || {x: 50, y: 50};
        this.player = this.physics.add.sprite(pSpawn.x * this.SCALE, pSpawn.y * this.SCALE, "characters", 0).setScale(this.SCALE);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);

        // 3. COLLECTIBLES (Memory Shards)
        this.shards = this.physics.add.group();
        const shardObjs = this.map.filterObjects("Spawns", obj => obj.name === "shard") || [];
        shardObjs.forEach(obj => {
            // Frame 67 is usually the blue diamond in Kenney packs
            let shard = this.shards.create(obj.x * this.SCALE, (obj.y - 18) * this.SCALE, "items", 67).setScale(this.SCALE);
            shard.body.setAllowGravity(false);
            shard.body.setImmovable(true);
        });
        this.physics.add.overlap(this.player, this.shards, (player, shard) => {
            shard.destroy();
            this.score += 1;
            this.scoreText.setText("Memory Shards: " + this.score);
        });

        // 4. ENEMIES (Hollowed Guards)
        this.enemies = this.physics.add.group();
        const enemySpawns = this.map.filterObjects("Spawns", obj => obj.name === "enemySpawn") || [];
        enemySpawns.forEach(spawn => {
            let enemy = this.enemies.create(spawn.x * this.SCALE, (spawn.y - 18) * this.SCALE, "characters", 2).setScale(this.SCALE);
            enemy.setCollideWorldBounds(true);
            enemy.setVelocityX(100);
            enemy.anims.play('guard_walk');
        });
        this.physics.add.collider(this.enemies, this.platforms);
        
        // Touch an enemy = Death (Betrayal memory overwhelming Kaelen)
        this.physics.add.overlap(this.player, this.enemies, () => {
            this.scene.start("gameOverScene", { outcome: "death" }); 
        });

        // 5. GOAL (The Fortress Gate)
        const exitSpawn = this.map.findObject("Spawns", obj => obj.name === "levelExit");
        if (exitSpawn) {
            this.exitZone = this.add.zone(exitSpawn.x * this.SCALE, exitSpawn.y * this.SCALE, 36, 36);
            this.physics.add.existing(this.exitZone);
            this.exitZone.body.setAllowGravity(false);
            this.physics.add.overlap(this.player, this.exitZone, () => {
                this.scene.start("gameOverScene", { outcome: "win" });
            });
        }

        // 6. PARTICLES (VFX Juice)
        // Run Trail
        this.runTrail = this.add.particles(0, 0, 'dust', {
            speedX: { min: -20, max: 20 },
            speedY: { min: -10, max: -30 },
            scale: { start: 0.5, end: 0 },
            lifespan: 250,
            emitting: false
        });
        
        // Jump Explosion
        this.jumpDust = this.add.particles(0, 0, 'dust', {
            speed: { min: 20, max: 100 },
            scale: { start: 1, end: 0 },
            lifespan: 300,
            gravityY: 200,
            emitting: false
        });

        // 7. CAMERA & UI
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels * this.SCALE, this.map.heightInPixels * this.SCALE);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1); 
        this.cameras.main.setDeadzone(100, 50);

        this.scoreText = this.add.text(16, 16, "Memory Shards: 0", { fontSize: '24px', fill: '#FFF' }).setScrollFactor(0);
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        // Player Horizontal Movement
        if (this.cursors.left.isDown) {
            this.player.setAccelerationX(-this.ACCEL);
            this.player.setFlipX(true);
            this.player.anims.play('walk', true);
            this.runTrail.start();
            this.runTrail.setPosition(this.player.x + 10, this.player.y + 20);
        } else if (this.cursors.right.isDown) {
            this.player.setAccelerationX(this.ACCEL);
            this.player.setFlipX(false);
            this.player.anims.play('walk', true);
            this.runTrail.start();
            this.runTrail.setPosition(this.player.x - 10, this.player.y + 20);
        } else {
            this.player.setAccelerationX(0);
            this.player.setDragX(this.DRAG);
            this.player.anims.play('idle');
            this.runTrail.stop();
        }

        // Player Jump
        if (!this.player.body.blocked.down) {
            this.player.anims.play('jump');
        }
        if (this.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.player.setVelocityY(this.JUMP_VELOCITY);
            this.jumpDust.explode(15, this.player.x, this.player.y + 20);
        }

        // Enemy Patrol Logic
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.body.blocked.right) {
                enemy.setVelocityX(-100);
                enemy.setFlipX(true);
            } else if (enemy.body.blocked.left) {
                enemy.setVelocityX(100);
                enemy.setFlipX(false);
            }
        });
    }
}