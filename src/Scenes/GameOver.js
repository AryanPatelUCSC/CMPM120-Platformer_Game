class GameOver extends Phaser.Scene {
    constructor() {
        super("gameOverScene");
    }

    init(data) {
        // 'win' or 'death' passed from Play.js
        this.outcome = data.outcome; 
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');

        let titleText = this.outcome === "win" 
            ? "The Gate is breached.\nVane will fall." 
            : "The Hollowed claimed you.\nThe truth dies here.";

        let color = this.outcome === "win" ? '#4CAF50' : '#F44336';

        this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, titleText, {
            fontFamily: 'Courier',
            fontSize: '32px',
            fill: color,
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, "Press 'R' to Restart", {
            fontFamily: 'Courier',
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Restart listener
        this.input.keyboard.on('keydown-R', () => {
            this.scene.start('playScene');
        });
    }
}