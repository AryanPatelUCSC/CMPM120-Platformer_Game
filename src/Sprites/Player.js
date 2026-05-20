class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "characters", "character_beige_idle");
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.scene = scene;
        this.setScale(0.5);
        this.setCollideWorldBounds(true);
        
        this.ACCEL = 600;
        this.DRAG = 800;
        this.JUMP_VELOCITY = -700;
        
        this.health = 3.0;
        this.isInvulnerable = false;
        
        // Footprint dust tracking emission modules
        this.runTrail = scene.add.particles(0, 0, 'dust', { 
            speedX: { min: -10, max: 10 }, 
            speedY: { min: -5, max: -15 }, 
            scale: { start: 0.4, end: 0 }, 
            lifespan: 100, 
            frequency: 30, 
            emitting: false 
        });
        
        this.jumpDust = scene.add.particles(0, 0, 'dust', { speed: { min: 30, max: 120 }, scale: { start: 1, end: 0 }, lifespan: 250, gravityY: 100, emitting: false });
        this.cursors = scene.input.keyboard.createCursorKeys();
    }

    takeDamage(amount) {
        if (!this.isInvulnerable && this.body.enable) {
            this.isInvulnerable = true;
            this.health -= amount;
            this.scene.drawHeartsHUD();
            this.scene.sound.play("sfx_hurt"); 

            let targetFrame = amount === 0.5 ? "hud_heart_half" : "hud_heart";
            let floatingHeart = this.scene.add.image(this.x, this.y - 16, "tiles", targetFrame).setScale(0.4);
            
            this.scene.tweens.add({
                targets: floatingHeart,
                y: floatingHeart.y - 64,
                alpha: 0,
                duration: 600,
                onComplete: () => { floatingHeart.destroy(); }
            });

            if (this.health <= 0) {
                this.body.enable = false;
                this.anims.play('hit');
                this.runTrail.emitting = false; 
                this.scene.time.delayedCall(500, () => {
                    this.scene.scene.start("gameOverScene", { outcome: "death" });
                });
            } else {
                this.scene.tweens.add({
                    targets: this, alpha: 0.3, duration: 100, yoyo: true, repeat: 4,
                    onComplete: () => { this.alpha = 1.0; this.isInvulnerable = false; }
                });
            }
        }
    }

    update(onLadder) {
        if (!this.body.enable) return;

        let isClimbing = false;
        let isCrouching = false;

        if (onLadder) {
            if (this.cursors.up.isDown) {
                this.body.setAllowGravity(false);
                this.setVelocityY(-250);
                this.anims.play('climb', true);
                isClimbing = true;
            } else if (this.cursors.down.isDown) {
                this.body.setAllowGravity(false);
                this.setVelocityY(250);
                this.anims.play('climb', true);
                isClimbing = true;
            } else {
                if (!this.body.blocked.down) {
                    this.body.setAllowGravity(false);
                    this.setVelocityY(0);
                    this.anims.play('climb', true).anims.stop();
                    isClimbing = true;
                } else {
                    this.body.setAllowGravity(true);
                }
            }
        } else {
            this.body.setAllowGravity(true);
        }

        if (!isClimbing && this.cursors.down.isDown && this.body.blocked.down) {
            isCrouching = true;
            this.setAccelerationX(0);
            this.setVelocityX(0);
            this.anims.play('duck', true);
            this.runTrail.emitting = false; 
        }

        if (!isCrouching) {
            if (this.cursors.left.isDown) {
                this.setAccelerationX(-this.ACCEL);
                this.setFlipX(true);
                if (!isClimbing) this.anims.play('walk', true);
                this.runTrail.emitting = true;
                this.runTrail.setPosition(this.x + 8, this.y + 24);
            } else if (this.cursors.right.isDown) {
                this.setAccelerationX(this.ACCEL);
                this.setFlipX(false);
                if (!isClimbing) this.anims.play('walk', true);
                this.runTrail.emitting = true;
                this.runTrail.setPosition(this.x - 8, this.y + 24);
            } else {
                this.setAccelerationX(0);
                this.setDragX(this.DRAG);
                if (!isClimbing) this.anims.play('idle');
                this.runTrail.emitting = false; 
            }
        }

        if (!this.body.blocked.down && !isClimbing) {
            this.anims.play('jump');
        }
        
        if (this.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.cursors.up) && !isCrouching && !isClimbing) {
            this.scene.sound.play("sfx_jump");
            this.setVelocityY(this.JUMP_VELOCITY);
            this.jumpDust.explode(12, this.x, this.y + 24);
        }
    }
}