class Spawner {
    static parseObjects(scene) {
        const spawnObjects = scene.map.getObjectLayer("Spawns").objects;
        let leftmostLockX = scene.map.widthInPixels;

        spawnObjects.forEach(obj => {
            let x = obj.x;
            let y = obj.y;
            if (obj.width && obj.height) {
                x = obj.x + obj.width / 2;
                y = obj.gid ? (obj.y - obj.height / 2) : (obj.y + obj.height / 2);
            }

            if (obj.name === "enemySpawn") {
                let e = scene.guards.create(x, y, "enemies", "slime_normal_walk_a");
                e.setCollideWorldBounds(true).setVelocityX(80).anims.play('guard_walk');
            }
            else if (obj.name === "sawSpawn") {
                let e = scene.saws.create(x, y, "enemies", "saw_a");
                e.body.setAllowGravity(false).setImmovable(true).setCircle(24);
                e.anims.play('saw_anim');
            }
            else if (obj.name === "blockHazardSpawn") {
                let e = scene.hazards.create(x, y, "enemies", "block_idle");
                e.body.setAllowGravity(false).setImmovable(true);
            }
            else if (obj.name === "flySpawn") {
                let e = scene.flies.create(x, y, "enemies", "fly_a");
                e.body.setAllowGravity(false).setVelocityX(100); e.startX = x;
                e.anims.play('fly_anim');
            }
            else if (obj.name === "fishSpawn") {
                let e = scene.fish.create(x, y, "enemies", "fish_blue_swim_a");
                e.body.setAllowGravity(false).setVelocityX(90); e.startX = x;
                e.anims.play('fish_anim');
            }
            else if (obj.name === "frogSpawn") {
                let e = scene.frogs.create(x, y, "enemies", "frog_idle");
                e.setCollideWorldBounds(true).setVelocityX(25);
                e.anims.play('frog_anim');
            }
            else if (obj.name.startsWith("key_")) {
                let color = obj.name.split("_")[1];
                let k = scene.keys.create(x, y, "tiles", `key_${color}`);
                k.body.setAllowGravity(false);
                k.keyColor = color;
            }
            else if (obj.name.startsWith("lock_")) {
                let color = obj.name.split("_")[1];
                let b = scene.lockBlocks.create(x, y, "tiles", `lock_${color}`);
                b.lockColor = color;
                b.refreshBody();
                
                if (x < leftmostLockX) leftmostLockX = x;
            }
            else if (obj.name.startsWith("flag_")) {
                let color = obj.name.split("_")[1];
                let f = scene.add.sprite(x, y + 64, "tiles", `flag_${color}_a`);
                f.setAngle(90); 
                f.anims.play(`flag_${color}_anim`);
                scene.flagsMap[color] = f;
            }
        });

        return leftmostLockX;
    }

    static updateEnemies(scene) {
        scene.guards.getChildren().forEach(enemy => {
            if (enemy.body.blocked.right) { enemy.setVelocityX(-80); enemy.setFlipX(false); }
            else if (enemy.body.blocked.left) { enemy.setVelocityX(80); enemy.setFlipX(true); }
        });

        scene.flies.getChildren().forEach(enemy => {
            if (enemy.x >= enemy.startX + 192) { enemy.setVelocityX(-100); enemy.setFlipX(false); }
            else if (enemy.x <= enemy.startX - 192) { enemy.setVelocityX(100); enemy.setFlipX(true); }
        });

        scene.fish.getChildren().forEach(enemy => {
            if (enemy.x >= enemy.startX + 192) { enemy.setVelocityX(-90); enemy.setFlipX(false); }
            else if (enemy.x <= enemy.startX - 192) { enemy.setVelocityX(90); enemy.setFlipX(true); }
        });

        scene.frogs.getChildren().forEach(enemy => {
            if (enemy.body.blocked.right) { enemy.setVelocityX(-25); enemy.setFlipX(false); }
            else if (enemy.body.blocked.left) { enemy.setVelocityX(25); enemy.setFlipX(true); }
            
            if (enemy.body.blocked.down && Phaser.Math.Between(0, 100) < 2) { 
                scene.sound.play("sfx_jump_high", { volume: 0.6 }); 
                enemy.setVelocityY(-350); 
            }
        });
    }
}