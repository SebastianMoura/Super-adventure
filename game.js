const WIDTH = 1920;
const HEIGHT = 1080;
const WORLD_WIDTH = 5200;


// CONFIGURAÇÕES DE ÁUDIO COMPARTILHADAS
let GAME_SOUND_ON = true;
let GAME_MUSIC_ON = true;

function playGameTone(scene, frequency, duration = 0.12, wave = "sine", volume = 0.07) {
    if (!GAME_SOUND_ON || !scene.sound || !scene.sound.context) return;

    try {
        const context = scene.sound.context;
        if (context.state === "suspended") context.resume();

        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = wave;
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        gain.gain.setValueAtTime(volume, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + duration);
    } catch (error) {
        // O jogo continua funcionando mesmo se o navegador bloquear o áudio.
    }
}

function startGameMusic(scene) {
    if (!GAME_MUSIC_ON || scene.musicEvent) return;

    const notes = [392, 494, 587, 494, 440, 523, 659, 523];
    let index = 0;

    scene.musicEvent = scene.time.addEvent({
        delay: 420,
        loop: true,
        callback: () => {
            if (GAME_MUSIC_ON) {
                playGameTone(scene, notes[index % notes.length], 0.22, "sine", 0.025);
                index++;
            }
        }
    });
}

function stopGameMusic(scene) {
    if (scene.musicEvent) {
        scene.musicEvent.remove(false);
        scene.musicEvent = null;
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    create() {
        this.cameras.main.setBackgroundColor("#75d5ff");

        const bg = this.add.graphics();
        bg.fillStyle(0xffdf68);
        bg.fillCircle(1600, 170, 85);

        for (let i = 0; i < 9; i++) {
            const x = i * 250;
            bg.fillStyle(0x68bd79);
            bg.fillEllipse(x + 150, 920, 420, 260);
            bg.fillStyle(0x319b55);
            bg.fillCircle(x + 90, 850, 65);
            bg.fillCircle(x + 150, 820, 85);
            bg.fillCircle(x + 210, 855, 60);
        }

        for (let i = 0; i < 7; i++) {
            const x = 100 + i * 300;
            const y = 150 + (i % 3) * 65;
            bg.fillStyle(0xffffff, 0.95);
            bg.fillCircle(x, y, 34);
            bg.fillCircle(x + 38, y - 15, 42);
            bg.fillCircle(x + 78, y, 32);
            bg.fillRoundedRect(x - 8, y, 95, 28, 14);
        }

        bg.setDepth(-2);

        this.add.rectangle(
            WIDTH / 2, HEIGHT / 2, 790, 650, 0x17243d, 0.88
        ).setStrokeStyle(8, 0xffffff, 0.9);

        this.add.text(WIDTH / 2, 250, "SUPER AVENTURA", {
            fontFamily: "Arial",
            fontSize: "82px",
            fontStyle: "bold",
            color: "#ffe27a",
            stroke: "#63351f",
            strokeThickness: 12
        }).setOrigin(0.5);

        this.add.text(WIDTH / 2, 345, "Uma jornada cartoon cheia de desafios!", {
            fontFamily: "Arial",
            fontSize: "30px",
            color: "#ffffff",
            stroke: "#17243d",
            strokeThickness: 5
        }).setOrigin(0.5);

        this.makeMenuButton(WIDTH / 2, 500, 390, 88, "JOGAR", 0x43bd61, () => {
            if (this.sound && this.sound.context && this.sound.context.state === "suspended") {
                this.sound.context.resume();
            }
            playGameTone(this, 660, 0.12, "triangle", 0.08);
            this.scene.start("AdventureScene");
        });

        this.makeMenuButton(WIDTH / 2, 620, 390, 70, "INSTRUÇÕES", 0x348bd1, () => {
            this.showInstructions();
        });

        const audioButton = this.makeMenuButton(
            WIDTH / 2, 720, 390, 70,
            this.audioLabel(), 0xb87932, () => {
                GAME_SOUND_ON = !GAME_SOUND_ON;
                GAME_MUSIC_ON = GAME_SOUND_ON;
                audioButton.text.setText(this.audioLabel());

                if (GAME_SOUND_ON) {
                    playGameTone(this, 740, 0.15, "sine", 0.08);
                    startGameMusic(this);
                } else {
                    stopGameMusic(this);
                }
            }
        );

        this.add.text(WIDTH / 2, 850,
            "Computador: setas ou A/D para andar • Espaço/W/↑ para pular", {
                fontFamily: "Arial",
                fontSize: "21px",
                color: "#ffffff",
                stroke: "#17243d",
                strokeThickness: 4,
                align: "center"
            }).setOrigin(0.5);

        this.input.keyboard.once("keydown-ENTER", () => {
            if (this.sound && this.sound.context && this.sound.context.state === "suspended") {
                this.sound.context.resume();
            }
            this.scene.start("AdventureScene");
        });

        this.events.once("shutdown", () => stopGameMusic(this));
    }

    audioLabel() {
        return GAME_SOUND_ON ? "SOM: LIGADO" : "SOM: DESLIGADO";
    }

    makeMenuButton(x, y, width, height, label, color, callback) {
        const button = this.add.rectangle(x, y, width, height, color)
            .setStrokeStyle(5, 0xffffff, 1)
            .setInteractive({ useHandCursor: true });

        const text = this.add.text(x, y, label, {
            fontFamily: "Arial",
            fontSize: "34px",
            fontStyle: "bold",
            color: "#ffffff",
            stroke: "#17243d",
            strokeThickness: 6
        }).setOrigin(0.5);

        button.on("pointerover", () => button.setScale(1.05));
        button.on("pointerout", () => button.setScale(1));
        button.on("pointerdown", callback);

        return { button, text };
    }

    showInstructions() {
        const panel = this.add.container(0, 0).setDepth(20);
        const shade = this.add.rectangle(
            WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x071326, 0.82
        ).setInteractive();

        const box = this.add.rectangle(
            WIDTH / 2, HEIGHT / 2, 820, 500, 0x17243d, 1
        ).setStrokeStyle(6, 0xffe27a);

        const title = this.add.text(WIDTH / 2, 350, "COMO JOGAR", {
            fontSize: "52px", fontStyle: "bold", color: "#ffe27a"
        }).setOrigin(0.5);

        const instructions = this.add.text(WIDTH / 2, 520,
            "← → ou A/D: movimentar\nESPAÇO, W ou ↑: pular\nP: pausar ou continuar\nPule sobre os inimigos para derrotá-los\nColete moedas e alcance o castelo!", {
                fontSize: "29px",
                color: "#ffffff",
                align: "center",
                lineSpacing: 16
            }).setOrigin(0.5);

        const close = this.add.text(WIDTH / 2, 700, "VOLTAR", {
            fontSize: "30px",
            fontStyle: "bold",
            color: "#ffe27a",
            backgroundColor: "#348bd1",
            padding: { x: 28, y: 14 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        close.on("pointerdown", () => panel.destroy());
        panel.add([shade, box, title, instructions, close]);
    }
}
class AdventureScene extends Phaser.Scene {

    constructor() {
        super("AdventureScene");
    }

    create() {
        this.score = 0;
        this.lives = 3;
        this.finished = false;
        this.invulnerable = false;
        this.paused = false;
        this.lastFacing = 1;

        this.createTextures();
        this.createBackground();
        this.createWorld();
        this.createPlayer();
        this.createEnemies();
        this.createCoins();
        this.createHUD();
        this.createControls();
        startGameMusic(this);
        this.events.once("shutdown", () => stopGameMusic(this));

        this.physics.add.collider(this.player, this.platforms);

        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.goal, this.winGame, null, this);

        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, HEIGHT);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1);

        this.updateHUD();
    }

    createTextures() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // HERÓI CARTOON
        g.fillStyle(0x4a291b);
        g.fillRoundedRect(8, 5, 54, 28, 13);
        g.fillCircle(17, 20, 12);
        g.fillCircle(53, 20, 12);
        g.fillStyle(0xd94b35);
        g.fillRoundedRect(5, 3, 60, 17, 8);
        g.fillStyle(0xff7654);
        g.fillEllipse(33, 7, 48, 10);
        g.fillStyle(0x8e3828);
        g.fillRoundedRect(15, 15, 38, 7, 4);

        g.fillStyle(0x9b5437);
        g.fillCircle(10, 43, 8);
        g.fillCircle(62, 43, 8);
        g.fillStyle(0xffc18b);
        g.fillRoundedRect(10, 20, 52, 43, 17);
        g.lineStyle(4, 0x713b2a, 1);
        g.strokeRoundedRect(10, 20, 52, 43, 17);

        g.fillStyle(0xf28c78, 0.75);
        g.fillEllipse(19, 48, 12, 7);
        g.fillEllipse(53, 48, 12, 7);
        g.fillStyle(0xffffff);
        g.fillEllipse(25, 38, 13, 17);
        g.fillEllipse(46, 38, 13, 17);
        g.fillStyle(0x30231e);
        g.fillCircle(28, 40, 4);
        g.fillCircle(49, 40, 4);
        g.fillStyle(0xffffff);
        g.fillCircle(29, 38, 1.8);
        g.fillCircle(50, 38, 1.8);
        g.fillStyle(0xe99a70);
        g.fillCircle(36, 47, 3);
        g.lineStyle(3, 0x8e3828, 1);
        g.beginPath();
        g.arc(36, 47, 10, 0.25, Math.PI - 0.25, false);
        g.strokePath();

        g.fillStyle(0x63351f);
        g.fillRoundedRect(7, 61, 56, 36, 12);
        g.fillStyle(0x2f62c9);
        g.fillRoundedRect(9, 63, 52, 34, 11);
        g.lineStyle(3, 0x183b86, 1);
        g.strokeRoundedRect(9, 63, 52, 34, 11);
        g.fillStyle(0xf04e43);
        g.fillRoundedRect(18, 61, 34, 28, 9);
        g.fillStyle(0xff8a63);
        g.fillRoundedRect(21, 64, 28, 7, 4);
        g.fillStyle(0xffd65a);
        g.fillCircle(35, 78, 4);

        g.fillStyle(0xffc18b);
        g.fillRoundedRect(0, 68, 14, 23, 7);
        g.fillRoundedRect(58, 68, 14, 23, 7);
        g.fillStyle(0xffffff);
        g.fillCircle(7, 91, 7);
        g.fillCircle(65, 91, 7);

        g.fillStyle(0x234b9e);
        g.fillRoundedRect(15, 91, 19, 20, 6);
        g.fillRoundedRect(39, 91, 19, 20, 6);
        g.fillStyle(0x63351f);
        g.fillRoundedRect(8, 105, 29, 12, 6);
        g.fillRoundedRect(37, 105, 29, 12, 6);
        g.fillStyle(0x9b6542);
        g.fillRoundedRect(12, 106, 20, 4, 2);
        g.fillRoundedRect(41, 106, 20, 4, 2);
        g.generateTexture("hero", 72, 120);
        g.clear();

        // PLATAFORMA COM GRAMA E TERRA
        g.fillStyle(0x60391f);
        g.fillRoundedRect(0, 12, 120, 48, 10);
        g.fillStyle(0x9a5b32);
        g.fillRoundedRect(2, 10, 116, 45, 9);
        g.fillStyle(0x6b3c25);
        g.fillRoundedRect(5, 35, 110, 19, 6);
        g.fillStyle(0x42a94d);
        g.fillRoundedRect(0, 2, 120, 21, 9);
        g.fillStyle(0x76d957);
        g.fillRoundedRect(4, 2, 112, 10, 6);
        g.fillStyle(0x2e873d);
        g.fillRect(8, 18, 104, 4);

        g.fillStyle(0x55c84f);
        for (let x = 8; x < 118; x += 18) {
            g.fillTriangle(x, 7, x + 5, -2, x + 10, 8);
        }

        g.fillStyle(0xd18a4b);
        g.fillCircle(25, 38, 4);
        g.fillCircle(84, 46, 3);
        g.fillStyle(0x754326);
        g.fillCircle(55, 31, 3);
        g.lineStyle(2, 0x754326);
        g.lineBetween(12, 52, 25, 47);
        g.lineBetween(92, 53, 108, 48);
        g.generateTexture("platform", 120, 62);
        g.clear();

        // MOEDA DOURADA
        g.fillStyle(0x9b5c12);
        g.fillCircle(22, 22, 21);
        g.fillStyle(0xf5a900);
        g.fillCircle(22, 20, 19);
        g.fillStyle(0xffd83d);
        g.fillCircle(21, 19, 15);
        g.lineStyle(3, 0xfff19a, 1);
        g.strokeCircle(21, 19, 13);
        g.fillStyle(0xfff7c4);
        g.fillEllipse(15, 11, 8, 5);
        g.fillStyle(0xe99a12);
        g.fillRoundedRect(19, 9, 6, 21, 3);
        g.fillStyle(0xffef88);
        g.fillRect(21, 11, 2, 17);
        g.generateTexture("coin", 44, 44);
        g.clear();

        // INIMIGO MONSTRINHO
        g.fillStyle(0x44245e);
        g.fillTriangle(11, 20, 8, 0, 27, 15);
        g.fillTriangle(43, 15, 62, 0, 58, 23);
        g.fillStyle(0x7139a3);
        g.fillEllipse(33, 38, 62, 56);
        g.fillStyle(0x9a5ac5);
        g.fillEllipse(31, 30, 49, 37);
        g.lineStyle(4, 0x492568, 1);
        g.strokeEllipse(33, 38, 62, 56);
        g.fillStyle(0xffffff);
        g.fillEllipse(22, 32, 15, 19);
        g.fillEllipse(44, 32, 15, 19);
        g.fillStyle(0x24142f);
        g.fillCircle(25, 34, 5);
        g.fillCircle(47, 34, 5);
        g.fillStyle(0xffffff);
        g.fillCircle(26, 32, 2);
        g.fillCircle(48, 32, 2);
        g.lineStyle(4, 0x492568, 1);
        g.lineBetween(14, 20, 27, 23);
        g.lineBetween(40, 23, 54, 20);
        g.fillStyle(0xffc0d5);
        g.fillEllipse(33, 51, 18, 9);
        g.fillStyle(0xffffff);
        g.fillTriangle(25, 47, 30, 47, 28, 53);
        g.fillTriangle(36, 47, 41, 47, 39, 53);
        g.fillStyle(0x492568);
        g.fillRoundedRect(5, 58, 22, 12, 6);
                g.fillRoundedRect(39, 58, 22, 12, 6);
        g.fillStyle(0xf2b6ff);
        g.fillCircle(14, 68, 5);
        g.fillCircle(52, 68, 5);
        g.generateTexture("enemy", 66, 74);
        g.destroy();
    }

    createBackground() {
        this.cameras.main.setBackgroundColor("#78d9ff");

        // Fundo distante: montanhas e nuvens com parallax suave.
        const far = this.add.graphics();
        far.setDepth(-20);
        far.setScrollFactor(0.12, 0.18);

        far.fillStyle(0xb8f0ff, 0.35);
        far.fillEllipse(920, 130, 1500, 260);

        // Sol com halo
        far.fillStyle(0xfff1a8, 0.18);
        far.fillCircle(1540, 175, 150);
        far.fillStyle(0xffd95b);
        far.fillCircle(1540, 175, 88);
        far.fillStyle(0xffef9a);
        far.fillCircle(1515, 148, 56);

        for (let i = 0; i < 10; i++) {
            const x = i * 430 + 50;
            const y = 125 + (i % 3) * 90;
            far.fillStyle(0xffffff, 0.88);
            far.fillEllipse(x + 50, y + 12, 150, 42);
            far.fillCircle(x + 20, y, 30);
            far.fillCircle(x + 55, y - 18, 42);
            far.fillCircle(x + 95, y, 32);
            far.fillStyle(0xd9f7ff, 0.55);
            far.fillEllipse(x + 55, y + 20, 90, 8);
        }

        for (let i = 0; i < 9; i++) {
            const x = i * 680 - 120;
            far.fillStyle(0x9ed7c5);
            far.fillTriangle(x, 880, x + 340, 390, x + 690, 880);
            far.fillStyle(0xe8fff1, 0.85);
            far.fillTriangle(x + 255, 515, x + 340, 390, x + 425, 515);
            far.fillStyle(0x70b99d);
            far.fillTriangle(x + 340, 880, x + 650, 510, x + 970, 880);
        }

        // Camada média: colinas e árvores.
        const mid = this.add.graphics();
        mid.setDepth(-15);
        mid.setScrollFactor(0.32, 0.35);

        for (let i = 0; i < 12; i++) {
            const x = i * 500 - 100;
            mid.fillStyle(i % 2 ? 0x79c96d : 0x67bb68);
            mid.fillEllipse(x + 240, 940, 650, 250);
            mid.fillStyle(0x4b9f58);
            mid.fillEllipse(x + 100, 950, 300, 160);
        }

        for (let i = 0; i < 24; i++) {
            const x = i * 250 + 60;
            const y = 790 + (i % 3) * 32;
            mid.fillStyle(0x80502d);
            mid.fillRoundedRect(x - 8, y, 24, 100, 7);
            mid.fillStyle(i % 2 ? 0x269b50 : 0x35ad58);
            mid.fillCircle(x, y - 18, 42);
            mid.fillCircle(x - 25, y + 2, 27);
            mid.fillCircle(x + 25, y + 2, 27);
            mid.fillStyle(0x7bdf70, 0.8);
            mid.fillCircle(x - 8, y - 35, 10);
        }

        // Flores e pequenos arbustos decorativos.
        const near = this.add.graphics();
        near.setDepth(-5);
        near.setScrollFactor(0.7, 0.8);

        for (let i = 0; i < 70; i++) {
            const x = i * 82 + 25;
            const y = 985 + (i % 4) * 8;
            near.fillStyle(0x238c43);
            near.fillEllipse(x, y, 35, 16);

            if (i % 3 === 0) {
                near.fillStyle(0xffe56d);
                near.fillCircle(x + 8, y - 13, 5);
                near.fillStyle(0xffffff);
                near.fillCircle(x + 8, y - 13, 2);
            }
        }
    }

    createWorld() {
        this.physics.world.setBounds(0, 0, WORLD_WIDTH, HEIGHT);
        this.platforms = this.physics.add.staticGroup();

        // CHÃO
        for (let x = 0; x < WORLD_WIDTH; x += 100) {
            this.platforms.create(x + 50, 1030, "platform")
                .setScale(1, 2)
                .refreshBody();
        }

        // PLATAFORMAS SUSPENSAS
        const positions = [
            [400, 820], [550, 820],
            [900, 700], [1050, 700],
            [1400, 830], [1550, 830],
            [1900, 720], [2050, 720],
            [2400, 820], [2550, 820],
            [2900, 680], [3050, 680],
            [3400, 820], [3550, 820],
            [3900, 710], [4050, 710],
            [4400, 830], [4550, 830]
        ];

        positions.forEach(([x, y]) => {
            this.platforms.create(x, y, "platform");
        });

        // CASTELO
        this.add.rectangle(4950, 900, 180, 260, 0x777788);

        this.add.triangle(
            4950, 740,
            -100, 100,
            100, 100,
            0, -100,
            0x9a9aaa
        );

        this.add.rectangle(4950, 970, 55, 120, 0x29243a);
        this.add.rectangle(4950, 800, 100, 15, 0xffd447);

        this.goal = this.add.zone(4950, 850, 180, 300);
        this.physics.add.existing(this.goal, true);
    }

    createPlayer() {
        this.player = this.physics.add.sprite(120, 800, "hero");

        this.player.setScale(1.0);
        this.player.setCollideWorldBounds(true);

        this.playerShadow = this.add.ellipse(
            this.player.x, this.player.y + 48, 58, 15, 0x173d35, 0.28
        ).setDepth(-1);

        this.player.setBounce(0);
        this.player.setGravityY(1600);
        this.player.setMaxVelocity(420, 1200);
        this.player.body.setSize(46, 98);
        this.player.body.setOffset(13, 10);
    }

    createControls() {
        this.cursors = this.input.keyboard.createCursorKeys();

        this.keys = this.input.keyboard.addKeys({
            A: Phaser.Input.Keyboard.KeyCodes.A,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            W: Phaser.Input.Keyboard.KeyCodes.W,
            R: Phaser.Input.Keyboard.KeyCodes.R,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.mobileLeft = false;
        this.mobileRight = false;
        this.mobileJumpQueued = false;

        if (this.sys.game.device.input.touch) {
            this.createMobileButton(145, HEIGHT - 145, "◀", "left");
            this.createMobileButton(335, HEIGHT - 145, "▶", "right");
            this.createMobileButton(WIDTH - 165, HEIGHT - 155, "PULAR", "jump", true);

            this.input.on("pointerup", () => {
                this.mobileLeft = false;
                this.mobileRight = false;
            });
        }
    }

    createMobileButton(x, y, label, action, wide = false) {
        const width = wide ? 210 : 145;
        const height = wide ? 125 : 145;
        const button = this.add.container(x, y)
            .setScrollFactor(0)
            .setDepth(250);

        const circle = this.add.ellipse(
            0, 0, width, height, 0x17243d, 0.72
        ).setStrokeStyle(6, 0xffffff, 0.9);

        const text = this.add.text(0, 0, label, {
            fontFamily: "Arial",
            fontSize: wide ? "29px" : "58px",
            fontStyle: "bold",
            color: "#ffffff",
            align: "center"
        }).setOrigin(0.5);

        button.add([circle, text]);

        circle.setInteractive(
            new Phaser.Geom.Ellipse(0, 0, width, height),
            Phaser.Geom.Ellipse.Contains
        );

        circle.on("pointerdown", pointer => {
            pointer.event?.preventDefault?.();

            if (action === "left") this.mobileLeft = true;
            if (action === "right") this.mobileRight = true;
            if (action === "jump") this.mobileJumpQueued = true;

            button.setScale(0.92);
        });

        const release = () => {
            if (action === "left") this.mobileLeft = false;
            if (action === "right") this.mobileRight = false;
            button.setScale(1);
        };

        circle.on("pointerup", release);
        circle.on("pointerout", release);

        return button;
    }

    createCoins() {
        this.coins = this.physics.add.staticGroup();

        const positions = [
            [430, 740], [580, 740],
            [930, 620], [1080, 620],
            [1430, 750], [1580, 750],
            [1930, 640], [2080, 640],
            [2430, 740], [2580, 740],
            [2930, 600], [3080, 600],
            [3430, 740], [3580, 740],
            [3930, 630], [4080, 630],
            [4430, 750], [4580, 750]
        ];

        positions.forEach(([x, y]) => {
            const coin = this.coins.create(x, y, "coin");

            coin.setScale(1.2);
            coin.refreshBody();

            this.tweens.add({
                targets: coin,
                scaleX: 1.32,
                scaleY: 1.32,
                duration: 520,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut"
            });

            this.tweens.add({
                targets: coin,
                y: y - 18,
                duration: 700,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut"
            });
        });
    }

    createEnemies() {
        this.enemies = this.physics.add.group();

        const positions = [
            [700, 940, 620, 850],
            [1250, 940, 1150, 1350],
            [2200, 940, 2150, 2350],
            [3200, 940, 3150, 3350],
            [4200, 940, 4150, 4350]
        ];

        positions.forEach(([x, y, min, max]) => {
            const enemy = this.enemies.create(x, y, "enemy");

            enemy.setSize(58, 55);
            enemy.setOffset(3, 7);
            enemy.body.allowGravity = false;
            enemy.setImmovable(true);

            enemy.minX = min;
            enemy.maxX = max;
            enemy.setVelocityX(110);
        });
    }

    createHUD() {
        this.hudPanel = this.add.rectangle(
            34, 28, 430, 104, 0x17243d, 0.88
        ).setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(100);

        this.hudPanel.setStrokeStyle(4, 0xffffff, 0.85);

        this.hudTitle = this.add.text(58, 42, "AVENTURA", {
            fontSize: "22px",
            fontFamily: "Arial",
            fontStyle: "bold",
            color: "#ffe27a",
            stroke: "#17243d",
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(101);

        this.coinHud = this.add.text(58, 76, "", {
            fontSize: "25px",
            fontFamily: "Arial",
            fontStyle: "bold",
            color: "#ffffff",
            stroke: "#17243d",
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(101);

        this.lifeHud = this.add.text(260, 76, "", {
            fontSize: "25px",
            fontFamily: "Arial",
            fontStyle: "bold",
            color: "#ff7777",
            stroke: "#17243d",
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(101);

        this.progressBg = this.add.rectangle(
            WIDTH - 330, 48, 270, 22, 0x17243d, 0.88
        ).setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(100);

        this.progressBg.setStrokeStyle(3, 0xffffff, 0.9);

        this.progressBar = this.add.rectangle(
            WIDTH - 326, 48, 1, 14, 0x65e572, 1
        ).setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(101);

        this.progressText = this.add.text(
            WIDTH - 330, 70, "PROGRESSO", {
                fontSize: "16px",
                fontFamily: "Arial",
                fontStyle: "bold",
                color: "#ffffff"
            }
        ).setScrollFactor(0).setDepth(101);

        this.mobileHint = this.add.text(
            WIDTH / 2, HEIGHT - 28,
            "CONTROLES NA TELA", {
                fontSize: "15px",
                fontFamily: "Arial",
                fontStyle: "bold",
                color: "#ffffff",
                stroke: "#17243d",
                strokeThickness: 3
            }
        ).setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(101);

        this.mobileHint.setVisible(
            !!this.sys.game.device.input.touch
        );

        this.pauseHint = this.add.text(
            WIDTH - 42, 108, "P: PAUSAR", {
                fontSize: "16px",
                fontFamily: "Arial",
                fontStyle: "bold",
                color: "#ffffff",
                stroke: "#17243d",
                strokeThickness: 3
            }
        ).setOrigin(1, 0)
            .setScrollFactor(0)
            .setDepth(101);

        this.pauseKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.P
        );

        this.pauseOverlay = this.add.container(0, 0)
            .setDepth(300)
            .setScrollFactor(0);

        this.pauseOverlay.setVisible(false);

        const pauseShade = this.add.rectangle(
            WIDTH / 2,
            HEIGHT / 2,
            WIDTH,
            HEIGHT,
            0x071326,
            0.72
        );

        const pauseLabel = this.add.text(
            WIDTH / 2,
            HEIGHT / 2 - 20,
            "JOGO PAUSADO", {
                fontSize: "64px",
                fontFamily: "Arial",
                fontStyle: "bold",
                color: "#ffe27a",
                stroke: "#17243d",
                strokeThickness: 8
            }
        ).setOrigin(0.5);

        const pauseSub = this.add.text(
            WIDTH / 2,
            HEIGHT / 2 + 55,
            "Pressione P para continuar", {
                fontSize: "28px",
                fontFamily: "Arial",
                color: "#ffffff"
            }
        ).setOrigin(0.5);

        this.pauseOverlay.add([
            pauseShade,
            pauseLabel,
            pauseSub
        ]);
    }

    updateHUD() {
        if (!this.coinHud) return;

        this.coinHud.setText("MOEDAS: " + this.score);
        this.lifeHud.setText("VIDAS: " + this.lives);

        const progress = Phaser.Math.Clamp(
            this.player ? this.player.x / (WORLD_WIDTH - 180) : 0,
            0,
            1
        );

        this.progressBar.width = Math.max(1, 262 * progress);

        this.progressText.setText(
            "PROGRESSO: " + Math.round(progress * 100) + "%"
        );
    }
        showFloatingText(x, y, message, color) {
        const popup = this.add.text(x, y, message, {
            fontSize: "28px",
            fontFamily: "Arial",
            fontStyle: "bold",
            color: color,
            stroke: "#25304c",
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(150);

        this.tweens.add({
            targets: popup,
            y: y - 65,
            alpha: 0,
            scale: 1.25,
            duration: 750,
            ease: "Cubic.easeOut",
            onComplete: () => popup.destroy()
        });
    }

    burstEffect(x, y, color, amount = 8) {
        for (let i = 0; i < amount; i++) {
            const size = Phaser.Math.Between(4, 8);
            const particle = i % 3 === 0
                ? this.add.star(x, y, 4, size * 0.45, size, color)
                : this.add.circle(x, y, size, color);

            particle.setDepth(140);

            const angle = (Math.PI * 2 * i) / amount +
                Phaser.Math.FloatBetween(-0.2, 0.2);

            const distance = Phaser.Math.Between(38, 82);

            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance + 18,
                angle: Phaser.Math.Between(-180, 180),
                alpha: 0,
                scale: 0.15,
                duration: Phaser.Math.Between(380, 620),
                ease: "Cubic.easeOut",
                onComplete: () => particle.destroy()
            });
        }
    }

    collectCoin(player, coin) {
        if (!coin.active) return;

        const coinX = coin.x;
        const coinY = coin.y;

        coin.destroy();

        this.score += 10;
        playGameTone(this, 880, 0.13, "sine", 0.08);

        this.burstEffect(coinX, coinY, 0xffd447, 10);
        this.showFloatingText(coinX, coinY - 10, "+10", "#ffe27a");

        this.updateHUD();
    }

    hitEnemy(player, enemy) {
        if (!enemy.active || this.invulnerable) return;

        const falling = player.body.velocity.y > 100;
        const aboveEnemy = player.body.bottom < enemy.body.center.y + 20;

        if (falling && aboveEnemy) {
            const enemyX = enemy.x;
            const enemyY = enemy.y;

            enemy.destroy();
            playGameTone(this, 220, 0.16, "square", 0.06);

            player.setVelocityY(-650);

            this.burstEffect(enemyX, enemyY, 0xffa45c, 12);
            this.showFloatingText(enemyX, enemyY - 20, "+50", "#9cff9c");

            this.score += 50;
            this.updateHUD();

        } else {
            this.damagePlayer();
        }
    }

    damagePlayer() {
        if (this.invulnerable || this.finished) return;

        this.lives--;
        playGameTone(this, 150, 0.28, "sawtooth", 0.08);

        this.burstEffect(this.player.x, this.player.y, 0xff5555, 10);
        this.showFloatingText(
            this.player.x,
            this.player.y - 35,
            "-1 VIDA",
            "#ff7777"
        );

        this.updateHUD();

        if (this.lives <= 0) {
            this.endGame(false);
            return;
        }

        this.invulnerable = true;

        this.player.setVelocity(-350, -600);
        this.player.setTint(0xff7777);

        this.tweens.add({
            targets: this.player,
            alpha: 0.2,
            duration: 100,
            yoyo: true,
            repeat: 8,

            onComplete: () => {
                this.player.setAlpha(1);
                this.player.clearTint();
                this.invulnerable = false;
            }
        });
    }

    winGame() {
        if (this.finished) return;
        this.endGame(true);
    }

    endGame(won) {
        this.finished = true;
        stopGameMusic(this);
        this.physics.pause();

        if (won) {
            playGameTone(this, 660, 0.18, "triangle", 0.08);
            this.time.delayedCall(180, () =>
                playGameTone(this, 880, 0.25, "triangle", 0.08)
            );
        } else {
            playGameTone(this, 130, 0.45, "sawtooth", 0.08);
        }

        const message = won ? "FASE COMPLETA!" : "GAME OVER";

        this.add.rectangle(
            WIDTH / 2, HEIGHT / 2, 700, 250, 0x101426, 0.9
        )
        .setScrollFactor(0)
        .setDepth(200);

        this.add.text(
            WIDTH / 2,
            HEIGHT / 2 - 35,
            message,
            {
                fontSize: "64px",
                fontStyle: "bold",
                color: won ? "#ffd447" : "#ff5555",
                stroke: "#000000",
                strokeThickness: 7
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

        this.add.text(
            WIDTH / 2,
            HEIGHT / 2 + 18,
            "Pontuação: " + this.score,
            {
                fontSize: "30px",
                fontStyle: "bold",
                color: "#ffffff"
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

        this.add.text(
            WIDTH / 2,
            HEIGHT / 2 + 75,
            "Pressione R para jogar novamente",
            {
                fontSize: "28px",
                color: "#ffffff"
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);
    }
        update() {
        if (this.finished) {
            if (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.R)) {
                this.scene.restart();
            }

            return;
        }

        // PAUSAR / CONTINUAR COM A TECLA P
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
            this.paused = !this.paused;

            if (this.paused) {
                this.physics.world.pause();
                this.tweens.pauseAll();
                this.pauseOverlay.setVisible(true);
            } else {
                this.physics.world.resume();
                this.tweens.resumeAll();
                this.pauseOverlay.setVisible(false);
            }

            return;
        }

        if (this.paused) return;

        // MOVIMENTAÇÃO
        if (
            this.cursors.left.isDown ||
            this.keys.A.isDown ||
            this.mobileLeft
        ) {
            this.player.setVelocityX(-420);
            this.player.setFlipX(true);

        } else if (
            this.cursors.right.isDown ||
            this.keys.D.isDown ||
            this.mobileRight
        ) {
            this.player.setVelocityX(420);
            this.player.setFlipX(false);

        } else {
            this.player.setVelocityX(0);
        }

        // PULO
        const jumpPressed =
            Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
            Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
            Phaser.Input.Keyboard.JustDown(this.keys.W) ||
            this.mobileJumpQueued;

        if (
            jumpPressed &&
            (this.player.body.blocked.down || this.player.body.touching.down)
        ) {
            this.mobileJumpQueued = false;
            this.player.setVelocityY(-850);
            playGameTone(this, 440, 0.11, "triangle", 0.06);

            this.tweens.add({
                targets: this.player,
                scaleX: 1.22,
                scaleY: 0.92,
                duration: 90,
                yoyo: true,
                ease: "Quad.easeOut"
            });
        }

        if (
            this.mobileJumpQueued &&
            !(this.player.body.blocked.down || this.player.body.touching.down)
        ) {
            // Mantém o toque até o personagem poder saltar.
        }

        // EFEITO DE CORRIDA
        if (
            Math.abs(this.player.body.velocity.x) > 20 &&
            (this.player.body.blocked.down || this.player.body.touching.down)
        ) {
            this.player.setScale(1.14, 1.06);
        } else {
            this.player.setScale(1.1, 1.1);
        }

        // SOMBRA DO PERSONAGEM
        if (this.playerShadow && this.player.active) {
            this.playerShadow.setPosition(
                this.player.x,
                this.player.y + 54
            );

            const airborne = !(
                this.player.body.blocked.down ||
                this.player.body.touching.down
            );

            this.playerShadow.setScale(
                airborne ? 0.72 : 1,
                airborne ? 0.72 : 1
            );

            this.playerShadow.setAlpha(airborne ? 0.16 : 0.28);
        }

        this.updateHUD();

        // MOVIMENTAÇÃO DOS INIMIGOS
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            if (enemy.x <= enemy.minX) {
                enemy.setVelocityX(110);
                enemy.setFlipX(false);
            }

            if (enemy.x >= enemy.maxX) {
                enemy.setVelocityX(-110);
                enemy.setFlipX(true);
            }
        });

        // QUEDA DO MAPA
        if (this.player.y > HEIGHT + 200) {
            this.damagePlayer();

            if (!this.finished) {
                this.player.setPosition(
                    this.cameras.main.scrollX + 150,
                    600
                );

                this.player.setVelocity(0, 0);
            }
        }
    }
}

// CONFIGURAÇÃO DO PHASER
const config = {
    type: Phaser.AUTO,

    width: WIDTH,
    height: HEIGHT,

    parent: "game-container",

    backgroundColor: "#78c9ff",

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    physics: {
        default: "arcade",

        arcade: {
            gravity: {
                y: 0
            },

            debug: false
        }
    },

    scene: [MenuScene, AdventureScene]
};

// INICIAR JOGO
const game = new Phaser.Game(config);