window.onload = function () {
    let config = {
        type: Phaser.AUTO,
        width: 600,
        height: 600,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 1000 }
            }
        },
        scene: [preloadGame, titleScreen, playGame]
        // scene: [preloadGame, playGame] // Switch this for line above if using without title screen
    };

    let game = new Phaser.Game(config);
}

class preloadGame extends Phaser.Scene {
    constructor() {
        super("PreloadGame");
    }

    preload() {
        // Loads spritesheet and image
        this.load.spritesheet('ball', 'assets/sprites/pie-ball.png', { frameWidth: 53, frameHeight: 53 });
        this.load.spritesheet('soundToggle', 'assets/sprites/sound-toggle.png', { frameWidth: 32, frameHeight: 32 });
        this.load.image('platform', 'assets/sprites/bar.png');

        // Loads sound effects
        this.load.audio('addPoint', 'assets/sounds/add-point.mp3');
        this.load.audio('lose', 'assets/sounds/lose.mp3');
    }

    create() {
        // Creates animation
        this.anims.create({
            key: 'roll',
            frames: this.anims.generateFrameNumbers('ball', {start: 0, end: 5}),
            frameRate: 10,
            repeat: -1
        });

        // this.scene.start("PlayGame");
        this.scene.start("TitleScreen"); // Switch this for line above if playing without title screen
    }
}

// Remove this class if playing without title screen
class titleScreen extends Phaser.Scene {
    constructor() {
        super("TitleScreen");
    }

    preload() {
        // Loads title screen 
        this.load.image('start', 'assets/sprites/start-screen.png');
    }

    create() {
        // Adds title screen
        let title = this.add.sprite(300, 300, 'start');

        // Adds space key
        this.spacebar = this.input.keyboard.addKey('SPACE');
    }

    update() {
        if (this.spacebar.isDown) {
            // Starts game
            this.scene.start('PlayGame');
        }
    }
}

class playGame extends Phaser.Scene {
    constructor() {
        super("PlayGame");
    }

    create() {
        // Creates platform group and platform movement
        this.platforms = this.physics.add.group({
            allowGravity: false,
            immovable: true,
            // velocityY: -150
            velocityY: 0
        });

        // Adds player
        this.player = this.physics.add.sprite(300, 60, 'ball');
        this.player.setCollideWorldBounds(true); // Confines player to world bounds

        // Adds collider to player and platforms
        this.physics.add.collider(this.player, this.platforms);

        // Adds platforms
        let platformCreator = this.time.addEvent({
            delay: 1000,
            callback: this.addPlatforms,
            callbackScope: this,
            loop: true
        });
        this.addPlatforms();

        // Adds mute button
        this.soundToggler = this.physics.add.sprite(575, 580, 'soundToggle');
        this.soundToggler.body.setAllowGravity(false); // Disables gravity
        this.soundToggler.setDepth(1000); // Z-index for mute icon

        // Adds listener to space bar for sound toggling
        this.spacebar = this.input.keyboard.addKey('SPACE'); 

        // Adds text for sound toggling
        this.spaceText = this.add.text(440, 573);
        this.spaceText
            .setText('Press Space: ')
            .setDepth(1000);

        // Creates score
        this.score = 0; // Sets initial score to 0 
        this.scoreText = this.add.text(10, 573); // Adds text to screen
        this.scoreText.setDepth(1000); // Z-index for score text
    }

    update() {
        // Adds keyboard movement and animations (left/right)
        let cursors = this.input.keyboard.createCursorKeys();

        if (cursors.left.isDown) {
            this.player.setVelocityX(-200);
            this.player.flipX = true;
            this.player.anims.play('roll', true);
        } else if (cursors.right.isDown) {
            this.player.setVelocityX(200);
            this.player.flipX = false;
            this.player.anims.play('roll', true);
        } else {
            this.player.setVelocityX(0)
            this.player.anims.stop();
        }

        // Deletes offscreen platforms
        this.platforms.children.each( (element) => {
            if(element.y < 0) {
                element.destroy();
            }
        });

        // Adds points to score when passing through platforms
        this.platforms.children.each( (platform) => {
            this.scoreText.setText('Score: ' + this.score.toString());
            if (!platform.scored && platform.y <= this.player.y) {
                this.increaseScore(platform);
            }
        });

        // Toggles mute
        this.spacebar.on('down', (event) => {
            console.log('space');
            this.toggleMute();
        });

        // Ends game
        if (this.player.y < 25) {
            this.killPlayer();
        }
    }

    addPlatforms() {
        let posX1 = Math.floor(Math.random() * (200 - -200 + 1)) + -200; // Randomly generates X position of first bar
        let posX2 = posX1 + 690; // Positions additional bar 50px to the right of the first bar

        // Places platforms on screen below game view
        this.platforms.create(posX1, 620, 'platform');
        this.platforms.create(posX2, 620, 'platform');
    }

    toggleMute() {
        if (!this.game.sound.mute && !this.mute) {
            this.game.sound.mute = true;
            this.soundToggler.setFrame(1);
        } else {
            this.game.sound.mute = false;
            this.soundToggler.setFrame(0);
        }
    }

    increaseScore(platform) {
        // Sound effect
        this.sound.play('addPoint');

        // Adds point
        platform.scored = true;
        this.score += 0.5; // Each platform is two separate bars, so passing 1 platform is (0.5 * 2) bars
        this.scoreText.setText('Score: ' + this.score.toString());
    }

    killPlayer() {
        // Sound effect
        if (!this.game.sound.mute) {
            this.sound.play('lose');
        }

        // Revert mute status to default
        this.game.sound.mute = false;

        // Restarts Game
        // this.scene.start("PlayGame");

        // Returns to title screen
        this.scene.start("TitleScreen"); // Switch this with line 173 if playing without title screen

        // Destroys game instance
        // this.scene.destroy(true); // Not sure if necessary for this iteration of the game, but potentially useful
    }
}