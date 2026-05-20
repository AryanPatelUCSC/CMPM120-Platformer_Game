class GameOver extends Phaser.Scene {
    constructor() {
        super("gameOverScene");
    }

    init(data) {
        this.outcome = (data && data.outcome) ? data.outcome : 'death'; 
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a24');

        // --- MAIN BOX PANEL BOARD ---
        this.add.nineslice(400, 300, "ui_panel", null, 620, 320, 20, 20, 20, 20).setOrigin(0.5);

        let titleText = this.outcome === "win" 
            ? "The Gate is breached.\nVane will fall." 
            : "The Hollowed claimed you.\nThe truth dies here.";

        // High-contrast clean fantasy colors (Dark green versus dark red signatures)
        let headerColor = this.outcome === "win" ? '#1e4620' : '#8b0000'; 

        this.add.text(400, 230, titleText, {
            fontFamily: 'MedievalSharp',
            fontSize: '30px',
            fill: headerColor,
            align: 'center',
            fontWeight: 'bold',
            lineSpacing: 10
        }).setOrigin(0.5);

        // --- BACKPACK RESET TRIGGER SELECTION BUTTON ---
        this.add.nineslice(400, 375, "ui_button", null, 360, 60, 15, 15, 15, 15).setOrigin(0.5);
        this.add.text(400, 375, "Restart Journey", {
            fontFamily: 'MedievalSharp',
            fontSize: '20px',
            fill: '#1a1a1a',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 435, "Press 'R' to Confirm Selection", {
            fontFamily: 'MedievalSharp',
            fontSize: '14px',
            fill: '#4a2c11'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-R', () => {
            this.sound.play("sfx_select");
            this.scene.start('playScene');
        });
    }
}