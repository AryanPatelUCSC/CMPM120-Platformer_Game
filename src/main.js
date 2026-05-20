const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    pixelArt: true, 
    render: {
        roundPixels: true // Prevents sub-pixel movement jitter on the player during fast motions
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1500 },
            debug: false
        }
    },
    scene: [Load, Menu, Play, GameOver]
};

const game = new Phaser.Game(config);