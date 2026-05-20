class Menu extends Phaser.Scene {
    constructor() {
        super("menuScene");
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a24');

        // --- 1. TITLE CONTROLLER BOARD ---
        this.add.nineslice(400, 95, "ui_panel", null, 640, 110, 20, 20, 20, 20).setOrigin(0.5);
        
        // FIXED: Removed the clipping ui_divider line image that was breaking the upper border outline window!
        
        // Crisp high-contrast dark red heading for the light panel background
        this.add.text(400, 95, "Echoes of the Vanguard", {
            fontFamily: 'MedievalSharp',
            fontSize: '38px',
            fill: '#8b0000',
            align: 'center',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // --- 2. CORE INSTRUCTIONS BOARD ---
        this.add.nineslice(400, 290, "ui_panel", null, 540, 220, 20, 20, 20, 20).setOrigin(0.5);

        let controlsText = "CONTROLS:\n\n" +
                           "← / →  : Move Left / Right\n" +
                           "↑      : Jump / Climb Up Ladder\n" +
                           "↓      : Crouch / Climb Down Ladder\n" +
                           "E      : Interact (Portals / Signs)";
        
        // Crisp deep charcoal text body lines
        this.add.text(400, 290, controlsText, {
            fontFamily: 'MedievalSharp',
            fontSize: '18px',
            fill: '#1a1a1a',
            align: 'left',
            lineSpacing: 4
        }).setOrigin(0.5);

        // --- 3. SELECTION ACTION BUTTONS & ATTRIBUTIONS ---
        this.add.nineslice(400, 475, "ui_button", null, 320, 60, 15, 15, 15, 15).setOrigin(0.5);
        this.add.text(400, 475, "Begin Journey", {
            fontFamily: 'MedievalSharp',
            fontSize: '20px',
            fill: '#1a1a1a',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // FIXED: Shifted position cleanly right under the button plate UI elements
        // Changed fill color property to bright white (#ffffff) to guarantee solid text contrast against the canvas!
        this.add.text(400, 525, "Press SPACEBAR to Continue", {
            fontFamily: 'MedievalSharp',
            fontSize: '16px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Open-source license asset attribution line at the bottom boundary layer
        this.add.text(400, 570, "Framework: Phaser 3/4  |  Assets Pack: Kenney (kenney.nl)", {
            fontFamily: 'MedievalSharp',
            fontSize: '12px',
            fill: '#555555'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => {
            this.sound.play("sfx_select"); 
            this.scene.start('playScene');
        });
    }
}