import { Scene } from 'phaser';
import Fighter, { FighterConfig } from '../classes/Fighter';
import BattleHUD from '../classes/BattleHUD';

/**
 * High-fidelity pixel-art fighting scene with full HUD,
 * rain particles, colored lighting, and auto-battle loop.
 */
export class BattleScene extends Scene {
    private p1!: Fighter;
    private p2!: Fighter;
    private hud!: BattleHUD;

    // Background layers
    private bgGfx!: Phaser.GameObjects.Graphics;
    private rainEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private lightOverlay!: Phaser.GameObjects.Graphics;
    private reflectionGfx!: Phaser.GameObjects.Graphics;

    // CRT background elements
    private crtScreens: Phaser.GameObjects.Graphics[] = [];
    private crtTexts: Phaser.GameObjects.Text[] = [];

    // AI Pets & Multiplayer
    private p1Pet!: Phaser.GameObjects.Sprite;
    private p2Pet!: Phaser.GameObjects.Sprite;
    private p1PetBaseY: number = 0;
    private p2PetBaseY: number = 0;
    private petTimer!: Phaser.Time.TimerEvent;

    private ws: WebSocket | null = null;
    private playerIndex: number = 0;
    private cpuTimer!: Phaser.Time.TimerEvent;
    private wasdKeys: any;
    private cursorKeys: any;

    // Battle loop
    private battleActive = false;
    private battleData: any = null;

    constructor() {
        super('BattleScene');
    }

    init(data: any) {
        this.battleData = data || {};
    }

    create() {
        this.cameras.main.setBackgroundColor(0x0a0e14);

        this.drawBackground();
        this.drawCRTScreens();
        this.drawGroundReflections();
        this.createRain();
        this.createLightingOverlay();

        // Spawn fighters
        const p1Config: FighterConfig = {
            id: 'p1',
            name: this.battleData?.p1Name || 'Player 1',
            atlas: this.battleData?.p1Atlas || 'sophia',
            side: 'left',
            tintColor: 0x4488ff,
            glowColor: 0x2266ff,
        };

        const p2Config: FighterConfig = {
            id: 'p2',
            name: this.battleData?.p2Name || 'Player 2',
            atlas: this.battleData?.p2Atlas || 'aristotle',
            side: 'right',
            tintColor: 0xff4444,
            glowColor: 0xff2222,
        };

        this.p1 = new Fighter(this, p1Config);
        this.p2 = new Fighter(this, p2Config);

        this.spawnPets();

        // HUD
        this.hud = new BattleHUD(this);
        this.hud.setPortraits(p1Config.atlas, p2Config.atlas);

        this.battleActive = true;
        this.setupManualControls();
        this.startPetAI();

        // ESC to go back
        this.input.keyboard!.on('keydown-ESC', () => {
            this.cleanupAndReturn();
        });

        // Listen for external START_BATTLE events
        const handleBattle = (e: CustomEvent) => {
            this.battleData = e.detail;
            this.scene.restart(e.detail);
        };
        window.addEventListener('START_BATTLE_SCENE', handleBattle as EventListener);
        this.events.on(Phaser.Scenes.Events.DESTROY, () => {
            window.removeEventListener('START_BATTLE_SCENE', handleBattle as EventListener);
        });
    }

    /* ——— Background Rendering ——— */

    private drawBackground() {
        this.bgGfx = this.add.graphics().setDepth(0);
        const W = this.game.config.width as number;
        const H = this.game.config.height as number;

        // Sky gradient (dark blue-green)
        for (let y = 0; y < H * 0.35; y++) {
            const t = y / (H * 0.35);
            const r = Phaser.Math.Linear(8, 15, t);
            const g = Phaser.Math.Linear(12, 28, t);
            const b = Phaser.Math.Linear(22, 35, t);
            const color = (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
            this.bgGfx.fillStyle(color, 1);
            this.bgGfx.fillRect(0, y, W, 1);
        }

        // Garden walls (dark stone)
        this.bgGfx.fillStyle(0x1a2a1a, 1);
        this.bgGfx.fillRect(0, H * 0.15, W * 0.12, H * 0.55);
        this.bgGfx.fillRect(W * 0.88, H * 0.15, W * 0.12, H * 0.55);

        // Wall top
        this.bgGfx.fillStyle(0x2a3a2a, 1);
        this.bgGfx.fillRect(0, H * 0.14, W * 0.15, 8);
        this.bgGfx.fillRect(W * 0.85, H * 0.14, W * 0.15, 8);

        // Vine accents on walls
        this.drawVines();

        // Ground paving stones
        this.drawPavingStones();
    }

    private drawVines() {
        const W = this.game.config.width as number;
        const H = this.game.config.height as number;
        const vineG = this.add.graphics().setDepth(1);

        // Left wall vine
        for (let i = 0; i < 8; i++) {
            const x = W * 0.10 + Math.sin(i * 0.8) * 6;
            const y = H * 0.18 + i * 30;
            vineG.fillStyle(0x2d6b2d, 0.8);
            vineG.fillCircle(x, y, 5);
            vineG.fillStyle(0x3a8a3a, 0.6);
            vineG.fillCircle(x + 3, y - 2, 3);
        }

        // Right wall vine
        for (let i = 0; i < 8; i++) {
            const x = W * 0.90 + Math.sin(i * 0.8 + 1) * 6;
            const y = H * 0.20 + i * 28;
            vineG.fillStyle(0x2d6b2d, 0.8);
            vineG.fillCircle(x, y, 5);
            vineG.fillStyle(0x3a8a3a, 0.6);
            vineG.fillCircle(x - 3, y - 2, 3);
        }

        // Lush ground shrubs along edges
        for (let i = 0; i < 12; i++) {
            const x = W * 0.05 + i * (W * 0.09);
            const y = H * 0.72 + Math.sin(i) * 8;
            vineG.fillStyle(0x1a5a1a, 0.6);
            vineG.fillCircle(x, y, 12 + Math.random() * 6);
            vineG.fillStyle(0x2a7a2a, 0.4);
            vineG.fillCircle(x + 4, y - 4, 8);
        }
    }

    private drawPavingStones() {
        const W = this.game.config.width as number;
        const H = this.game.config.height as number;

        // Ground area
        const groundTop = H * 0.55;
        const groundBot = H * 0.82;

        // Base ground color
        this.bgGfx.fillStyle(0x3a3a44, 1);
        this.bgGfx.fillRect(0, groundTop, W, groundBot - groundTop);

        // Stone tiles in grid
        const tileW = 48;
        const tileH = 32;
        for (let row = 0; row < 6; row++) {
            const offset = (row % 2) * (tileW / 2);
            for (let col = -1; col < W / tileW + 1; col++) {
                const x = col * tileW + offset;
                const y = groundTop + row * tileH;

                // Stone color variation
                const shade = 0x30 + Math.floor(Math.random() * 0x15);
                const color = (shade << 16) | (shade << 8) | (shade + 0x08);
                this.bgGfx.fillStyle(color, 1);
                this.bgGfx.fillRect(x + 1, y + 1, tileW - 2, tileH - 2);

                // Highlight edge
                this.bgGfx.lineStyle(1, 0x555566, 0.3);
                this.bgGfx.strokeRect(x + 1, y + 1, tileW - 2, tileH - 2);
            }
        }

        // Wet shine effect
        this.bgGfx.fillStyle(0x88aacc, 0.06);
        this.bgGfx.fillRect(0, groundTop, W, groundBot - groundTop);
    }

    private drawGroundReflections() {
        this.reflectionGfx = this.add.graphics().setDepth(3).setAlpha(0.15);
        // Will be updated in update() to mirror fighter positions
    }

    private drawCRTScreens() {
        const W = this.game.config.width as number;
        const H = this.game.config.height as number;

        // Left CRT
        const crt1 = this.add.graphics().setDepth(1);
        crt1.fillStyle(0x0a1a2a, 0.7);
        crt1.fillRoundedRect(W * 0.02, H * 0.22, 80, 60, 4);
        crt1.lineStyle(1, 0x336688, 0.5);
        crt1.strokeRoundedRect(W * 0.02, H * 0.22, 80, 60, 4);
        this.crtScreens.push(crt1);

        const crtText1 = this.add.text(W * 0.02 + 6, H * 0.22 + 6, 'SYS:OK\nAGENT.v2\nSTATUS:\nACTIVE', {
            fontFamily: 'Courier, monospace', fontSize: '7px', color: '#336688',
            lineSpacing: 2,
        }).setDepth(2).setAlpha(0.6);
        this.crtTexts.push(crtText1);

        // Right CRT
        const crt2 = this.add.graphics().setDepth(1);
        crt2.fillStyle(0x0a1a2a, 0.7);
        crt2.fillRoundedRect(W * 0.88, H * 0.25, 80, 55, 4);
        crt2.lineStyle(1, 0x336688, 0.5);
        crt2.strokeRoundedRect(W * 0.88, H * 0.25, 80, 55, 4);
        this.crtScreens.push(crt2);

        const crtText2 = this.add.text(W * 0.88 + 6, H * 0.25 + 6, 'MAP:LOAD\nSECTOR-7\nDATA:RDY\nCOMBAT', {
            fontFamily: 'Courier, monospace', fontSize: '7px', color: '#336688',
            lineSpacing: 2,
        }).setDepth(2).setAlpha(0.6);
        this.crtTexts.push(crtText2);

        // CRT flicker tween
        this.tweens.add({
            targets: [...this.crtTexts],
            alpha: { from: 0.4, to: 0.7 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /* ——— Atmospheric Effects ——— */

    private createRain() {
        const W = this.game.config.width as number;

        // Create a tiny rain drop texture programmatically
        const rainGfx = this.add.graphics();
        rainGfx.fillStyle(0xaabbcc, 1);
        rainGfx.fillRect(0, 0, 1, 4);
        rainGfx.generateTexture('rain_drop', 1, 4);
        rainGfx.destroy();

        this.rainEmitter = this.add.particles(0, -10, 'rain_drop', {
            x: { min: 0, max: W },
            lifespan: 1200,
            speedY: { min: 200, max: 350 },
            speedX: { min: -20, max: -10 },
            alpha: { start: 0.3, end: 0 },
            scale: { start: 1, end: 0.5 },
            quantity: 2,
            frequency: 40,
        });
        this.rainEmitter.setDepth(45);
    }

    private createLightingOverlay() {
        this.lightOverlay = this.add.graphics().setDepth(44).setScrollFactor(0);
    }

    private updateLighting(time: number) {
        const W = this.game.config.width as number;
        const H = this.game.config.height as number;
        this.lightOverlay.clear();

        if (!this.p1 || !this.p2) return;

        const pulse = Math.sin(time * 0.002) * 0.05 + 0.1;

        // Blue light from P1
        this.lightOverlay.fillStyle(0x2244aa, pulse * 0.3);
        this.lightOverlay.fillCircle(this.p1.sprite.x, this.p1.sprite.y, 160);

        // Red light from P2
        this.lightOverlay.fillStyle(0xaa2222, pulse * 0.3);
        this.lightOverlay.fillCircle(this.p2.sprite.x, this.p2.sprite.y, 160);

        // Subtle vignette
        this.lightOverlay.fillStyle(0x000000, 0.2);
        this.lightOverlay.fillRect(0, 0, 60, H);
        this.lightOverlay.fillRect(W - 60, 0, 60, H);
    }

    private updateReflections() {
        this.reflectionGfx.clear();
        if (!this.p1 || !this.p2) return;

        const groundY = (this.game.config.height as number) * 0.78;

        // Simple colored reflection splotches
        this.reflectionGfx.fillStyle(0x2266ff, 0.1);
        this.reflectionGfx.fillEllipse(this.p1.sprite.x, groundY, 80, 16);

        this.reflectionGfx.fillStyle(0xff2222, 0.1);
        this.reflectionGfx.fillEllipse(this.p2.sprite.x, groundY, 80, 16);
    }

    /* ——— AI Pets & Manual Controls ——— */

    private spawnPets() {
        const p1Atlas = this.battleData?.p1PetAtlas || 'plato';
        const p2Atlas = this.battleData?.p2PetAtlas || 'socrates';

        this.p1Pet = this.add.sprite(this.p1.sprite.x - 60, this.p1.sprite.y - 20, p1Atlas, `${p1Atlas}-right`)
            .setDepth(4).setScale(1.6);
        this.p2Pet = this.add.sprite(this.p2.sprite.x + 60, this.p2.sprite.y - 20, p2Atlas, `${p2Atlas}-left`)
            .setDepth(4).setScale(1.6);

        this.p1PetBaseY = this.p1Pet.y;
        this.p2PetBaseY = this.p2Pet.y;
    }

    private setupManualControls() {
        if (!this.input.keyboard) return;
        const mode = this.battleData?.gameMode || 'ai';

        if (mode === 'online') {
            this.setupOnlineMode();
        } else if (mode === 'ai') {
            this.setupAIMode();
        } else {
            // Local PvP
            this.input.keyboard.on('keydown-F', () => this.executeAction(this.p1, this.p2, 'attack', 'left'));
            this.input.keyboard.on('keydown-G', () => this.executeAction(this.p1, this.p2, 'block', 'left'));
            this.input.keyboard.on('keydown-H', () => this.executeAction(this.p1, this.p2, 'dodge', 'left'));

            this.input.keyboard.on('keydown-I', () => this.executeAction(this.p2, this.p1, 'attack', 'right'));
            this.input.keyboard.on('keydown-O', () => this.executeAction(this.p2, this.p1, 'block', 'right'));
            this.input.keyboard.on('keydown-P', () => this.executeAction(this.p2, this.p1, 'dodge', 'right'));
        }
    }

    private setupAIMode() {
        // Player 1 controls
        this.input.keyboard!.on('keydown-F', () => this.executeAction(this.p1, this.p2, 'attack', 'left'));
        this.input.keyboard!.on('keydown-G', () => this.executeAction(this.p1, this.p2, 'block', 'left'));
        this.input.keyboard!.on('keydown-H', () => this.executeAction(this.p1, this.p2, 'dodge', 'left'));

        // simple CPU for P2
        this.cpuTimer = this.time.addEvent({
            delay: 1500,
            callback: () => {
                if (!this.battleActive) return;
                const actions = ['attack', 'block', 'dodge'] as const;
                const act = actions[Math.floor(Math.random() * 3)];
                this.executeAction(this.p2, this.p1, act, 'right');
            },
            loop: true
        });
    }

    private setupOnlineMode() {
        this.ws = new WebSocket('ws://localhost:8080');

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'init') {
                this.playerIndex = data.playerIndex;
                this.hud.showCombo(this.playerIndex === 1 ? 'left' : 'right', 99); // Visual indicator of our player
            } else if (data.type === 'start') {
                console.log("Online battle starting!");
            } else if (data.type === 'action') {
                // Opponent action received
                if (data.player === 1 && this.playerIndex === 2) {
                    this.executeAction(this.p1, this.p2, data.action, 'left');
                } else if (data.player === 2 && this.playerIndex === 1) {
                    this.executeAction(this.p2, this.p1, data.action, 'right');
                }
            } else if (data.type === 'disconnect') {
                this.endBattle();
            }
        };

        // If I am Player 1, bind FGH and emit. If Player 2, bind FGH but it controls P2!
        this.input.keyboard!.on('keydown-F', () => this.sendOnlineAction('attack'));
        this.input.keyboard!.on('keydown-G', () => this.sendOnlineAction('block'));
        this.input.keyboard!.on('keydown-H', () => this.sendOnlineAction('dodge'));
    }

    private sendOnlineAction(action: 'attack' | 'block' | 'dodge') {
        if (!this.battleActive || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        // Execute locally first for instant feedback (optimistic)
        if (this.playerIndex === 1) this.executeAction(this.p1, this.p2, action, 'left');
        else if (this.playerIndex === 2) this.executeAction(this.p2, this.p1, action, 'right');

        // Broadcast
        this.ws.send(JSON.stringify({ type: 'action', action }));
    }

    private startPetAI() {
        // Pets cast support or attack spells every 4 seconds
        this.petTimer = this.time.addEvent({
            delay: 4000,
            callback: () => {
                if (!this.battleActive) return;

                // Randomly offset the two pets, don't shoot perfectly at the same time
                this.time.delayedCall(Math.random() * 500, () => this.firePetProjectile(this.p1Pet, this.p2.sprite, 0x00ffcc));
                this.time.delayedCall(Math.random() * 500 + 1000, () => this.firePetProjectile(this.p2Pet, this.p1.sprite, 0xff00cc));
            },
            loop: true
        });
    }

    private firePetProjectile(pet: Phaser.GameObjects.Sprite, target: Phaser.GameObjects.Sprite, color: number) {
        if (target.alpha < 1) return; // dodged or dead

        // Quick cast animation
        this.tweens.add({
            targets: pet,
            scale: 2.0,
            duration: 100,
            yoyo: true
        });

        const proj = this.add.graphics().setDepth(20);
        proj.fillStyle(color, 1);
        proj.fillCircle(0, 0, 8);
        proj.fillStyle(0xffffff, 0.8);
        proj.fillCircle(0, 0, 4);
        proj.setPosition(pet.x, pet.y);

        this.tweens.add({
            targets: proj,
            x: target.x,
            y: target.y,
            duration: 350,
            ease: 'Power1',
            onComplete: () => {
                proj.destroy();
                this.showHitSpark(target.x, target.y - 10);
            }
        });
    }

    private executeAction(
        attacker: Fighter,
        defender: Fighter,
        action: 'attack' | 'block' | 'dodge',
        side: 'left' | 'right'
    ) {
        if (attacker.state !== 'idle') return; // Debounce actions
        if (!this.battleActive) return;

        switch (action) {
            case 'attack': {
                attacker.playAttack(() => {
                    // Check if defender is blocking or dodging
                    if (defender.state === 'block') {
                        // Reduced damage
                        defender.playHit(5);
                        attacker.score += 50;
                    } else if (defender.state === 'dodge') {
                        // Miss!
                    } else {
                        // Full hit
                        const dmg = 10 + Math.floor(Math.random() * 8);
                        defender.playHit(dmg);
                        attacker.comboCount++;
                        attacker.score += 100 + attacker.comboCount * 20;

                        if (attacker.comboCount >= 3) {
                            this.hud.showCombo(side, attacker.comboCount);
                        }
                    }

                    // Mana cost
                    attacker.mana = Math.max(0, attacker.mana - 5);
                });

                // Show hit spark
                this.time.delayedCall(200, () => {
                    if (defender.state !== 'dodge') {
                        this.showHitSpark(defender.sprite.x, defender.sprite.y - 20);
                    }
                });
                break;
            }

            case 'block': {
                attacker.playBlock();
                // Regen some mana while blocking
                attacker.mana = Math.min(attacker.maxMana, attacker.mana + 3);
                attacker.comboCount = 0; // Reset combo on block
                break;
            }

            case 'dodge': {
                attacker.playDodge();
                attacker.mana = Math.max(0, attacker.mana - 3);
                attacker.comboCount = 0;
                break;
            }
        }

        // Check for battle end after action
        this.time.delayedCall(500, () => {
            if (this.p1.health <= 0 || this.p2.health <= 0) {
                this.endBattle();
            }
        });
    }

    private showHitSpark(x: number, y: number) {
        const sparkGfx = this.add.graphics().setDepth(30);

        // Draw a starburst
        const colors = [0xffffff, 0xffdd44, 0xff8800];
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const len = 12 + Math.random() * 8;
            sparkGfx.lineStyle(2, colors[i % 3], 1);
            sparkGfx.lineBetween(x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        }

        // Center flash
        sparkGfx.fillStyle(0xffffff, 0.9);
        sparkGfx.fillCircle(x, y, 6);

        this.tweens.add({
            targets: sparkGfx,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 300,
            onComplete: () => sparkGfx.destroy()
        });

        // Floating damage text
        const dmgText = this.add.text(x, y - 10, `${10 + Math.floor(Math.random() * 8)}`, {
            fontFamily: '"Press Start 2P", Courier, monospace',
            fontSize: '14px',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(35);

        this.tweens.add({
            targets: dmgText,
            y: y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => dmgText.destroy()
        });
    }

    private endBattle() {
        if (!this.battleActive) return;
        this.battleActive = false;
        if (this.petTimer) this.petTimer.destroy();
        if (this.cpuTimer) this.cpuTimer.destroy();
        if (this.ws) this.ws.close();

        const p1Won = this.p1.health > this.p2.health;
        const winner = p1Won ? 'PLAYER 1' : 'PLAYER 2';
        const winColor = p1Won ? '#88DDFF' : '#FF8866';

        this.hud.updateStatus(`${winner} WINS!`);

        // Show big winner text
        const winText = this.add.text(
            (this.game.config.width as number) / 2,
            (this.game.config.height as number) / 2 - 40,
            `🏆 ${winner} WINS! 🏆`,
            {
                fontFamily: '"Press Start 2P", Courier, monospace',
                fontSize: '28px',
                color: winColor,
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center',
            }
        ).setOrigin(0.5).setDepth(60).setScrollFactor(0).setScale(0);

        this.tweens.add({
            targets: winText,
            scale: 1,
            duration: 500,
            ease: 'Back.easeOut'
        });

        // Return to game after delay
        this.time.delayedCall(4000, () => {
            winText.destroy();
            this.cleanupAndReturn();
        });
    }

    private cleanupAndReturn() {
        if (this.petTimer) this.petTimer.destroy();
        if (this.cpuTimer) this.cpuTimer.destroy();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.p1.destroy();
        this.p2.destroy();
        this.p1Pet.destroy();
        this.p2Pet.destroy();
        this.hud.destroy();

        window.dispatchEvent(new Event('BATTLE_ENDED'));

        this.scene.start('Game');
    }

    /* ——— Main Update Loop ——— */

    update(time: number, _delta: number) {
        this.handleMovementInputs();
        this.updatePets(time);

        if (this.p1) this.p1.update(time);
        if (this.p2) this.p2.update(time);
        if (this.hud) this.hud.update(this.p1, this.p2);

        this.updateLighting(time);
        this.updateReflections();
    }

    private updatePets(time: number) {
        if (!this.p1Pet || !this.p2Pet || !this.p1 || !this.p2 || !this.battleActive) return;

        const p1TargetX = this.p1.sprite.x - 60;
        const p1TargetY = this.p1.sprite.y - 20;

        const p2TargetX = this.p2.sprite.x + 60;
        const p2TargetY = this.p2.sprite.y - 20;

        // Smooth follow
        this.p1Pet.x += (p1TargetX - this.p1Pet.x) * 0.05;
        this.p1PetBaseY += (p1TargetY - this.p1PetBaseY) * 0.05;

        this.p2Pet.x += (p2TargetX - this.p2Pet.x) * 0.05;
        this.p2PetBaseY += (p2TargetY - this.p2PetBaseY) * 0.05;

        // Manual float bobbing
        const floatOffset1 = Math.sin(time * 0.003) * 5;
        const floatOffset2 = Math.sin(time * 0.003 + Math.PI) * 5;

        this.p1Pet.y = this.p1PetBaseY + floatOffset1;
        this.p2Pet.y = this.p2PetBaseY + floatOffset2;
    }

    private handleMovementInputs() {
        if (!this.battleActive || !this.p1 || !this.input.keyboard) return;

        // Ensure keys are initialized
        if (!this.wasdKeys) {
            this.wasdKeys = {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
            };
        }

        const moveSpeed = 4;
        let dx = 0;
        let dy = 0;

        if (this.wasdKeys.left.isDown) dx -= moveSpeed;
        if (this.wasdKeys.right.isDown) dx += moveSpeed;
        if (this.wasdKeys.up.isDown) dy -= moveSpeed;
        if (this.wasdKeys.down.isDown) dy += moveSpeed;

        if (dx !== 0 || dy !== 0) {
            this.p1.move(dx, dy);
        } else {
            this.p1.stopMoving();
        }

        // --- Player 2 Movement ---
        const mode = this.battleData?.gameMode || 'ai';
        if (mode === 'ai') {
            // Simple AI movement: move towards P1 if too far, away if too close
            const distX = this.p1.sprite.x - this.p2.sprite.x;
            const distY = this.p1.sprite.y - this.p2.sprite.y;
            const dist = Phaser.Math.Distance.Between(0, 0, distX, distY);

            let dx2 = 0;
            let dy2 = 0;
            const aiSpeed = moveSpeed * 0.4; // AI moves slower

            if (dist > 200) {
                dx2 = (distX > 0 ? 1 : -1) * aiSpeed;
                dy2 = (distY > 0 ? 1 : -1) * aiSpeed;
            } else if (dist < 100) {
                dx2 = (distX > 0 ? -1 : 1) * aiSpeed;
                dy2 = (distY > 0 ? -1 : 1) * aiSpeed;
            }

            // Small random jitter
            if (Math.random() < 0.1) {
                dx2 += (Math.random() - 0.5) * 4;
                dy2 += (Math.random() - 0.5) * 4;
            }

            if (Math.abs(dx2) > 0.2 || Math.abs(dy2) > 0.2) {
                this.p2.move(dx2, dy2);
            } else {
                this.p2.stopMoving();
            }
        } else if (mode !== 'online') {
            // Local PvP Arrow Keys
            if (!this.cursorKeys) {
                this.cursorKeys = this.input.keyboard.createCursorKeys();
            }

            let dx2 = 0;
            let dy2 = 0;

            if (this.cursorKeys.left.isDown) dx2 -= moveSpeed;
            if (this.cursorKeys.right.isDown) dx2 += moveSpeed;
            if (this.cursorKeys.up.isDown) dy2 -= moveSpeed;
            if (this.cursorKeys.down.isDown) dy2 += moveSpeed;

            if (dx2 !== 0 || dy2 !== 0) {
                this.p2.move(dx2, dy2);
            } else {
                this.p2.stopMoving();
            }
        }
    }
}
