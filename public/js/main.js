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
        // scene: [preloadGame, playGame]
    };

    game = new Phaser.Game(config);
}

class preloadGame extends Phaser.Scene {
    constructor() {
        super("PreloadGame");
    }

    preload() {
        // Loads spritesheet and image
        this.load.spritesheet('ball', 'assets/sprites/pie-ball.png', { frameWidth: 53, frameHeight: 53 });
        this.load.image('platform', 'assets/sprites/bar.png');

        // Adds sound effects
        this.load.audio('addPoint', 'assets/sounds/add_point.mp3');
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
        this.scene.start("TitleScreen");
    }
}

class titleScreen extends Phaser.Scene {
    constructor() {
        super("TitleScreen");
    }

    preload() {
        this.load.image('start', 'assets/sprites/start-screen.png');
    }

    create() {
        this.title = this.add.sprite(300, 300, 'start');
        this.spacebar = this.input.keyboard.addKey('SPACE');
    }

    update() {
        if (this.spacebar.isDown) {
            this.scene.start('PlayGame');
        }
    }
}

class playGame extends Phaser.Scene {
    constructor() {
        super("PlayGame");
    }

    create() {
        // Platform group and platform movement
        this.platforms = this.physics.add.group({
            allowGravity: false,
            immovable: true,
            velocityY: -150
        });

        // Adds player
        this.player = this.physics.add.sprite(300, 60, 'ball');

        this.player.setCollideWorldBounds(true);

        // Adds collider to player and platforms
        this.physics.add.collider(this.player, this.platforms);

        // Adds platforms
        this.platformCreator = this.time.addEvent({
            delay: 1000,
            callback: this.addPlatforms,
            callbackScope: this,
            loop: true
        });
        this.addPlatforms();

        // Sets initial score to 0
        this.score = 0;
        this.scoreText = this.add.text(10, 580);
        this.scoreText.setDepth(1000);
    }

    addPlatforms() {
        this.posX1 = Math.floor(Math.random() * (200 - -200 + 1)) + -200;
        this.posX2 = this.posX1 + 690;

        this.platforms.create(this.posX1, 620, 'platform');
        this.platforms.create(this.posX2, 620, 'platform');
    }

    update() {
        // Adds keyboard movement and animations (left/right)
        this.cursors = this.input.keyboard.createCursorKeys();

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-200);
            this.player.flipX = true;
            this.player.anims.play('roll', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(200);
            this.player.flipX = false;
            this.player.anims.play('roll', true);
        } else {
            this.player.setVelocityX(0)
            this.player.anims.stop();

        }

        // Deletes offscreen platforms
        this.platforms.children.each(function(element) {
            if(element.y < 0) {
                element.destroy();
            }
        });

        // Keeps track of score
        this.platforms.children.each(function(platform) {
            this.scoreText.setText('Score: ' + this.score.toString());
            if (!platform.scored && platform.y <= this.player.y) {
                this.increaseScore(platform);
            }
        }.bind(this))

        // Ends game
        if (this.player.y < 25) {
            this.killPlayer();
        }
    }

    increaseScore(platform) {
        // Sound effect
        this.sound.play('addPoint');

        // Adds point
        platform.scored = true;
        this.score += 0.5; 
        this.scoreText.setText('Score: ' + this.score.toString());
    }

    killPlayer() {
        // Sound effect
        this.sound.play('lose');

        // Restarts Game
        // this.scene.start("PlayGame");

        // Returns to title screen
        this.scene.start("TitleScreen");
        // this.scene.destroy(true);
    }
}