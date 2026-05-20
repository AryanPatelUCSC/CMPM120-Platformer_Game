const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    pixelArt: true, // Prevents blurring of pixel art
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1500 },
            debug: false
        }
    },
    scene: [Load, Play, GameOver]
};

const game = new Phaser.Game(config);