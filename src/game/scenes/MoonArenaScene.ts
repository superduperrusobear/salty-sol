import * as Phaser from 'phaser';
import { FighterManager } from '../managers/FighterManager';

type BattleStage = 'betting' | 'fighting' | 'payout';

interface Fighter {
  sprite: Phaser.GameObjects.Sprite;
  name: string;
  health: number;
  wins: number;
}

interface HealthBarContainer {
  background: Phaser.GameObjects.Rectangle;
  bar: Phaser.GameObjects.Rectangle;
  border: Phaser.GameObjects.Rectangle;
  nameText: Phaser.GameObjects.Text;
  healthText: Phaser.GameObjects.Text;
  avatar: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
}

export class MoonArenaScene extends Phaser.Scene {
  // Stage Management
  private currentStage: BattleStage = 'betting';
  private stageTimer: number = 13; // Initial betting phase timer
  private roundNumber: number = 1;
  private maxRounds: number = 3;
  
  // Scene Elements
  private background!: Phaser.GameObjects.Image;
  private overlay!: Phaser.GameObjects.Rectangle;
  private fighter1!: Fighter;
  private fighter2!: Fighter;
  private fighterManager: FighterManager;

  // UI Elements
  private timerText!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private betsOpenText!: Phaser.GameObjects.Text;
  private player1NameText!: Phaser.GameObjects.Text;
  private player2NameText!: Phaser.GameObjects.Text;
  private healthBarContainer1!: HealthBarContainer;
  private healthBarContainer2!: HealthBarContainer;

  // Battle State
  private betsLocked: boolean = false;
  private player1Bets: number = 0;
  private player2Bets: number = 0;
  private currentBackground: number = 0;
  private backgrounds: string[] = [
    'game engine/scenes/moon.png',
    'game engine/scenes/pumparena.png',
    'game engine/scenes/rugarena.png',
    'game engine/scenes/photon arena.png',
    'game engine/scenes/bullxarena.png'
  ];

  private fights = [
    { player1: 'BATCAT', player2: 'EAGLE' },
    { player1: 'EBICHU', player2: 'DUKO' },
    { player1: 'VIGI', player2: 'GWR' },
    { player1: 'COKE', player2: 'ANGLERFISH' },
    { player1: 'PINION', player2: 'TRUMP' }
  ];
  private currentFightIndex: number = 0;

  constructor() {
    super({ key: 'MoonArenaScene' });
    this.fighterManager = new FighterManager();
  }

  preload() {
    // Load all backgrounds
    this.backgrounds.forEach((bg, index) => {
      this.load.image(`arena-${index}`, bg);
    });

    // Load coin images for P1 and P2
    this.fights.forEach(fight => {
      // Load P1 coin images
      this.load.image(
        `p1-${fight.player1.toLowerCase()}`,
        `/images/P1/${fight.player1.toLowerCase()}.png`
      );
      // Load P2 coin images
      this.load.image(
        `p2-${fight.player2.toLowerCase()}`,
        `/images/P2/${fight.player2.toLowerCase()}.png`
      );
    });

    // Add loading error handler
    this.load.on('loaderror', (fileObj: any) => {
      console.error('Error loading asset:', fileObj.key, fileObj.src);
      this.events.emit('assetLoadError', { key: fileObj.key, src: fileObj.src });
    });

    // Load fighter assets
    this.fighterManager.preloadFighterSprites(this);
  }

  create() {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create background with error handling
    try {
      this.background = this.add.image(centerX, centerY, `arena-${this.currentBackground}`)
        .setDisplaySize(width, height)
        .setDepth(0);
    } catch (error) {
      console.error('Failed to create background, using fallback:', error);
      this.background = this.add.rectangle(centerX, centerY, width, height, 0x000033)
        .setDepth(0) as any;
    }

    // Add dark overlay
    this.overlay = this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.7)
      .setDepth(1);

    // Set up first fight
    const currentFight = this.fights[this.currentFightIndex];
    
    try {
      // Create fighter sprites with animations
      const player1Key = currentFight.player1.toLowerCase();
      const player2Key = currentFight.player2.toLowerCase();

      // Verify animations exist before creating sprites
      if (!this.anims.exists(`${player1Key}-idle`) || !this.anims.exists(`${player2Key}-idle`)) {
        console.error('Required animations not found, attempting to reload sprites');
        this.fighterManager.preloadFighterSprites(this);
      }

      // Create sprites with error handling
      this.fighter1 = {
        sprite: this.add.sprite(centerX - 200, centerY + 50, `${player1Key}-idle`),
        name: currentFight.player1,
        health: 100,
        wins: 0
      };

      this.fighter2 = {
        sprite: this.add.sprite(centerX + 200, centerY + 50, `${player2Key}-idle`),
        name: currentFight.player2,
        health: 100,
        wins: 0
      };

      // Set up sprite properties
      this.fighter1.sprite.setScale(4);
      this.fighter2.sprite.setScale(4);
      this.fighter2.sprite.setFlipX(true);  // Face left

      // Safely play animations with error handling
      this.playFighterAnimation(this.fighter1.sprite, `${player1Key}-idle`);
      this.playFighterAnimation(this.fighter2.sprite, `${player2Key}-idle`);

    } catch (error) {
      console.error('Error setting up fighters:', error);
      // Create fallback rectangles if sprites fail
      this.createFallbackFighters(centerX, centerY, currentFight);
    }

    this.setupUI(centerX, centerY, width);
    this.startNewBattle();

    // Emit event that scene is ready
    this.events.emit('sceneReady');
  }

  private setupUI(centerX: number, centerY: number, width: number) {
    // Timer - Made larger and more prominent
    this.timerText = this.add.text(centerX, 60, '', {
      fontSize: '48px',
      color: '#00FF00',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      stroke: '#003300',
      strokeThickness: 4,
      shadow: { color: '#000000', fill: true, offsetX: 2, offsetY: 2, blur: 8 }
    }).setOrigin(0.5).setDepth(3);

    // State Text - Moved to bottom with enhanced styling
    this.stateText = this.add.text(centerX, width - 100, '', {
      fontSize: '42px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { color: '#000000', fill: true, offsetX: 2, offsetY: 2, blur: 8 }
    }).setOrigin(0.5).setDepth(3).setAlpha(0);

    // Round Counter - Simplified with white text
    this.roundText = this.add.text(centerX, 25, 'ROUND 1/3', {
      fontSize: '28px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: { color: '#000000', fill: true, offsetX: 1, offsetY: 1, blur: 4 }
    }).setOrigin(0.5).setDepth(3);

    // Bets Open/Closed Text - Enhanced visibility
    this.betsOpenText = this.add.text(centerX, centerY - 100, '', {
      fontSize: '36px',
      color: '#FFFF00',
      fontStyle: 'bold',
      stroke: '#B45309',
      strokeThickness: 4,
      shadow: { color: '#000000', fill: true, offsetX: 2, offsetY: 2, blur: 8 }
    }).setOrigin(0.5).setDepth(3);

    // Fighter Names - Made more prominent
    this.player1NameText = this.add.text(centerX - 200, centerY - 50, '', {
      fontSize: '28px',
      color: '#FF3366',
      fontStyle: 'bold',
      stroke: '#881337',
      strokeThickness: 3,
      shadow: { color: '#000000', fill: true, offsetX: 2, offsetY: 2, blur: 4 }
    }).setOrigin(0.5).setDepth(3);

    this.player2NameText = this.add.text(centerX + 200, centerY - 50, '', {
      fontSize: '28px',
      color: '#3366FF',
      fontStyle: 'bold',
      stroke: '#1E3A8A',
      strokeThickness: 3,
      shadow: { color: '#000000', fill: true, offsetX: 2, offsetY: 2, blur: 4 }
    }).setOrigin(0.5).setDepth(3);

    // Create health bars
    this.createHealthBars(width);
  }

  private createHealthBars(width: number) {
    const padding = 15;
    const barWidth = width * 0.18;
    const barHeight = 14;
    const containerHeight = 40;

    // Player 1 Health Bar (Left Corner)
    this.healthBarContainer1 = this.createHealthBarContainer(
      padding,
      padding,
      barWidth,
      barHeight,
      containerHeight,
      0x22C55E,
      true
    );

    // Player 2 Health Bar (Right Corner)
    this.healthBarContainer2 = this.createHealthBarContainer(
      width - padding,
      padding,
      barWidth,
      barHeight,
      containerHeight,
      0x22C55E,
      false
    );
  }

  private createHealthBarContainer(
    x: number,
    y: number,
    barWidth: number,
    barHeight: number,
    containerHeight: number,
    color: number,
    isLeft: boolean
  ): HealthBarContainer {
    const containerWidth = barWidth + 45;
    const avatarSize = 32;
    
    // Container background (dark semi-transparent)
    const background = this.add.rectangle(
      x + (isLeft ? containerWidth/2 : -containerWidth/2),
      y + containerHeight/2,
      containerWidth,
      containerHeight,
      0x000000
    ).setDepth(2).setAlpha(0.7);

    // Health bar background (darker gray)
    const barBg = this.add.rectangle(
      x + (isLeft ? avatarSize + 8 : -avatarSize - 8),
      y + containerHeight/2,
      barWidth,
      barHeight,
      0x1a1a1a
    ).setDepth(3).setOrigin(isLeft ? 0 : 1, 0.5);

    // Health bar
    const bar = this.add.rectangle(
      x + (isLeft ? avatarSize + 8 : -avatarSize - 8),
      y + containerHeight/2,
      barWidth,
      barHeight,
      color
    ).setDepth(4).setOrigin(isLeft ? 0 : 1, 0.5);

    // Avatar background (darker circle)
    const avatarBg = this.add.circle(
      x + (isLeft ? avatarSize/2 : -avatarSize/2),
      y + containerHeight/2,
      avatarSize/2,
      0x1a1a1a
    ).setDepth(3);

    // Get current fight for initial coin image
    const currentFight = this.fights[this.currentFightIndex];
    const initialCoinKey = isLeft ? 
      `p1-${currentFight.player1.toLowerCase()}` : 
      `p2-${currentFight.player2.toLowerCase()}`;

    // Avatar sprite with coin image
    const avatar = this.add.sprite(
      x + (isLeft ? avatarSize/2 : -avatarSize/2),
      y + containerHeight/2,
      initialCoinKey
    ).setDepth(4)
      .setDisplaySize(avatarSize, avatarSize);

    // Create circular mask
    const mask = this.add.graphics()
      .setPosition(x + (isLeft ? avatarSize/2 : -avatarSize/2), y + containerHeight/2);
    mask.clear();
    mask.beginPath();
    mask.arc(0, 0, avatarSize/2, 0, Math.PI * 2, false);
    mask.fillPath();
    avatar.setMask(new Phaser.Display.Masks.GeometryMask(this, mask));

    // Name text
    const nameText = this.add.text(
      x + (isLeft ? avatarSize + 12 : -avatarSize - 12),
      y + 8,
      '',
      {
        fontSize: '14px',
        color: '#FFFFFF',
        fontStyle: 'bold'
      }
    ).setDepth(5).setOrigin(isLeft ? 0 : 1, 0.5);

    // Health text
    const healthText = this.add.text(
      x + (isLeft ? avatarSize + 12 : -avatarSize - 12),
      y + containerHeight - 8,
      '100/100 HP',
      {
        fontSize: '12px',
        color: '#FFFFFF',
        fontFamily: 'monospace'
      }
    ).setDepth(5).setOrigin(isLeft ? 0 : 1, 0.5);

    return {
      background,
      bar,
      border: barBg,
      nameText,
      healthText,
      avatar
    };
  }

  private startNewBattle() {
    this.currentStage = 'betting';
    this.stageTimer = 13;
    this.betsLocked = false;
    this.roundNumber = 1;
    this.fighter1.health = 100;
    this.fighter2.health = 100;
    this.fighter1.wins = 0;
    this.fighter2.wins = 0;

    // Update UI
    this.updateUI();
    this.showBetsOpen();
  }

  private startFightPhase() {
    this.currentStage = 'fighting';
    this.stageTimer = 55;
    this.betsLocked = true;
    this.hideBetsOpen();
    
    // Get current fighter keys
    const player1Key = this.fighter1.name.toLowerCase();
    const player2Key = this.fighter2.name.toLowerCase();

    // Store original positions
    const originalPos1 = { x: this.fighter1.sprite.x, y: this.fighter1.sprite.y };
    const originalPos2 = { x: this.fighter2.sprite.x, y: this.fighter2.sprite.y };
    const centerX = this.cameras.main.width / 2;

    // Fight sequence with error handling
    const fightSequence = async () => {
        try {
            // Run animations
            this.playFighterAnimation(this.fighter1.sprite, `${player1Key}-run`);
            this.playFighterAnimation(this.fighter2.sprite, `${player2Key}-run`);

            // Move fighters towards center
            this.tweens.add({
                targets: this.fighter1.sprite,
                x: centerX - 100,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => {
                    // Attack sequence
                    this.playFighterAnimation(this.fighter1.sprite, `${player1Key}-attack`);
                    setTimeout(() => {
                        // Play hurt animation for fighter 2
                        this.playFighterAnimation(this.fighter2.sprite, `${player2Key}-hurt`);
                        // Damage calculation
                        this.fighter2.health -= Math.random() * 20 + 10;
                    }, 500);
                }
            });

    this.tweens.add({
                targets: this.fighter2.sprite,
                x: centerX + 100,
      duration: 1000,
                ease: 'Power2',
      onComplete: () => {
                    // Counter attack sequence
                    setTimeout(() => {
                        this.playFighterAnimation(this.fighter2.sprite, `${player2Key}-attack`);
                        setTimeout(() => {
                            this.playFighterAnimation(this.fighter1.sprite, `${player1Key}-hurt`);
                            // Damage calculation
                            this.fighter1.health -= Math.random() * 20 + 10;
                        }, 500);
                    }, 1500);
                }
            });

            // Return to positions after attack sequence
            setTimeout(() => {
                // Run back animation
                this.playFighterAnimation(this.fighter1.sprite, `${player1Key}-run`);
                this.playFighterAnimation(this.fighter2.sprite, `${player2Key}-run`);
                this.fighter2.sprite.flipX = true;

                // Move back to original positions
                this.tweens.add({
                    targets: [this.fighter1.sprite, this.fighter2.sprite],
                    x: (target: any) => target === this.fighter1.sprite ? originalPos1.x : originalPos2.x,
                    duration: 1000,
                    ease: 'Power2',
                    onComplete: () => {
                        // Return to idle animations
                        this.playFighterAnimation(this.fighter1.sprite, `${player1Key}-idle`);
                        this.playFighterAnimation(this.fighter2.sprite, `${player2Key}-idle`);
                    }
                });
            }, 4000);
        } catch (error) {
            console.error('Error in fight sequence:', error);
            // Ensure fighters return to their positions even if animation fails
            this.fighter1.sprite.x = originalPos1.x;
            this.fighter2.sprite.x = originalPos2.x;
            this.playFighterAnimation(this.fighter1.sprite, `${player1Key}-idle`);
            this.playFighterAnimation(this.fighter2.sprite, `${player2Key}-idle`);
        }
    };

    // Start the fight sequence
    fightSequence().catch(error => {
        console.error('Fight sequence failed:', error);
        this.endRound(); // Ensure the round ends even if the sequence fails
    });

    // Enhanced FIGHT! text animation
    this.stateText.setText('FIGHT!')
      .setScale(0.5)
      .setAlpha(0);
    
    this.tweens.add({
      targets: this.stateText,
      scale: { from: 0.5, to: 1.5 },
      alpha: { from: 0, to: 1 },
      y: { from: this.cameras.main.height - 50, to: this.cameras.main.height - 150 },
      duration: 800,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 1000,
      onComplete: () => {
        this.stateText.setVisible(false);
      }
    });
  }

  private showBetsOpen() {
    this.betsOpenText.setText('BETS ARE NOW OPEN!')
      .setVisible(true);
    
    // Enhanced flash effect
    this.tweens.add({
      targets: this.betsOpenText,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.8, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
      yoyo: true,
      repeat: 2
    });
  }

  private hideBetsOpen() {
    this.betsOpenText.setText('BETS ARE LOCKED!')
      .setVisible(true);

    // Enhanced flash effect with scale
    this.tweens.add({
      targets: this.betsOpenText,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.8, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.betsOpenText.setVisible(false);
      }
    });
  }

  private updateUI() {
    // Update timer with padding for consistent width
    const timerValue = Math.ceil(this.stageTimer);
    this.timerText.setText(timerValue.toString().padStart(2, '0'));
    
    // Update round text with more stylish format
    this.roundText.setText(`ROUND ${this.roundNumber}/${this.maxRounds}`);
    
    // Update fighter names with $ prefix
    this.player1NameText.setText(`$${this.fighter1.name}`);
    this.player2NameText.setText(`$${this.fighter2.name}`);
    
    // Update health bars
    this.updateHealthBar(this.healthBarContainer1, this.fighter1);
    this.updateHealthBar(this.healthBarContainer2, this.fighter2);

    // Add pulsing effect to timer when low
    if (timerValue <= 5 && this.currentStage !== 'payout') {
      this.timerText.setTint(0xFF0000);
      if (!this.timerText.getData('pulsing')) {
        this.timerText.setData('pulsing', true);
        this.tweens.add({
          targets: this.timerText,
          scale: { from: 1, to: 1.2 },
          duration: 200,
          yoyo: true,
          repeat: -1
        });
      }
    } else {
      this.timerText.clearTint();
      if (this.timerText.getData('pulsing')) {
        this.timerText.setData('pulsing', false);
        this.timerText.setScale(1);
        this.tweens.killTweensOf(this.timerText);
      }
    }
  }

  private updateHealthBar(container: HealthBarContainer, fighter: Fighter) {
    const healthPercentage = fighter.health / 100;
    
    // Update health bar width
    container.bar.setScale(healthPercentage, 1);
    
    // Update health text with monospace font for alignment
    container.healthText.setText(`${Math.ceil(fighter.health).toString().padStart(3, ' ')}/100 HP`);
    
    // Update name text with $ prefix
    container.nameText.setText(`$${fighter.name}`);
    
    // Update avatar texture with correct coin image
    if (container.avatar instanceof Phaser.GameObjects.Sprite) {
      const isPlayer1 = fighter === this.fighter1;
      const coinKey = `${isPlayer1 ? 'p1' : 'p2'}-${fighter.name.toLowerCase()}`;
      container.avatar.setTexture(coinKey);
    }
    
    // Update health bar color based on percentage
    let color = 0x22C55E; // Green
    if (healthPercentage <= 0.3) {
      color = 0xEF4444; // Red
    } else if (healthPercentage <= 0.6) {
      color = 0xEAB308; // Yellow
    }
    container.bar.setFillStyle(color);
  }

  private endRound() {
    const winner = this.fighter1.health > this.fighter2.health ? this.fighter1 : this.fighter2;
    winner.wins++;

    if (this.roundNumber >= this.maxRounds || winner.wins > this.maxRounds / 2) {
      this.endBattle(winner);
    } else {
      this.roundNumber++;
      this.fighter1.health = 100;
      this.fighter2.health = 100;
      this.startFightPhase();
    }
  }

  private endBattle(winner: Fighter) {
    this.currentStage = 'payout';
    this.stateText
      .setText(`$${winner.name} WINS THE BATTLE!`)
      .setVisible(true)
      .setAlpha(0)
      .setScale(0.5);

    // Enhanced winner announcement animation
    this.tweens.add({
      targets: this.stateText,
      scale: { from: 0.5, to: 1.2 },
      alpha: { from: 0, to: 1 },
      y: { from: this.cameras.main.height - 50, to: this.cameras.main.height - 150 },
      duration: 1000,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.stateText,
          scale: { from: 1.2, to: 1 },
      duration: 200,
          ease: 'Power2'
        });
      }
    });

    // Emit winner event
    this.events.emit('battleEnd', {
      winner: winner === this.fighter1 ? 'player1' : 'player2',
      totalPool: this.player1Bets + this.player2Bets
    });

    // Progress to next fight after delay
    this.time.delayedCall(5000, () => {
      this.cycleBackground();
      this.currentFightIndex++;
      if (this.currentFightIndex < this.fights.length) {
        const nextFight = this.fights[this.currentFightIndex];
        
        // Update fighter names
        this.fighter1.name = nextFight.player1;
        this.fighter2.name = nextFight.player2;
        
        // Update sprites and animations
        const player1Key = nextFight.player1.toLowerCase();
        const player2Key = nextFight.player2.toLowerCase();
        
        this.fighter1.sprite.setTexture(`${player1Key}-idle`);
        this.fighter2.sprite.setTexture(`${player2Key}-idle`);
        
        this.fighter1.sprite.play(`${player1Key}-idle`);
        this.fighter2.sprite.play(`${player2Key}-idle`);
      }
      this.startNewBattle();
    });
  }

  private cycleBackground() {
    this.currentBackground = (this.currentBackground + 1) % this.backgrounds.length;
    try {
      if (this.background instanceof Phaser.GameObjects.Image) {
        this.background.setTexture(`arena-${this.currentBackground}`);
      }
    } catch (error) {
      console.error('Failed to cycle background:', error);
      // If texture loading fails, we'll keep the current background
    }
  }

  update() {
    // Update timer
    if (this.currentStage !== 'payout') {
      this.stageTimer = Math.max(0, this.stageTimer - (1/60));
      this.updateUI();

      if (this.stageTimer <= 0) {
        switch (this.currentStage) {
          case 'betting':
        this.startFightPhase();
            break;
          case 'fighting':
            this.endRound();
            break;
        }
      }
    }
  }

  // Required for compatibility with existing code
  public updateBettingAmounts(player1Bet: number, player2Bet: number) {
    if (!this.betsLocked) {
      this.player1Bets = player1Bet;
      this.player2Bets = player2Bet;
    }
  }

  public setFighters(player1: any, player2: any) {
    // Update fighter names and sprites
    this.fighter1.name = player1.name;
    this.fighter2.name = player2.name;
    
    // Update sprites
    this.fighter1.sprite.setTexture(player1.key);
    this.fighter2.sprite.setTexture(player2.key);

    // Update UI
    this.updateUI();
  }

  public updateFighter(player: 'player1' | 'player2', fighter: any) {
    const targetFighter = player === 'player1' ? this.fighter1 : this.fighter2;
    targetFighter.name = fighter.name;
    targetFighter.sprite.setTexture(fighter.key);
    this.updateUI();
  }

  public updatePlayerImageFromAPI(playerId: 'player1' | 'player2', imageData: any) {
    const fighter = playerId === 'player1' ? this.fighter1 : this.fighter2;
        if (imageData.name) {
      fighter.name = imageData.name;
    }
    this.updateUI();
  }

  // Add helper methods for safer animation handling
  private playFighterAnimation(sprite: Phaser.GameObjects.Sprite, animKey: string) {
    try {
        if (this.anims.exists(animKey)) {
            sprite.play(animKey);
        } else {
            console.warn(`Animation ${animKey} not found, using fallback`);
            // Try to find any valid animation for this sprite
            const baseKey = animKey.split('-')[0];
            const fallbackKey = `${baseKey}-idle`;
            
            if (this.anims.exists(fallbackKey)) {
                sprite.play(fallbackKey);
            } else {
                console.warn(`No fallback animation found for ${animKey}`);
            }
        }
    } catch (error) {
        console.error(`Error playing animation ${animKey}:`, error);
    }
  }

  private createFallbackFighters(centerX: number, centerY: number, currentFight: any) {
    // Create colored rectangles as fallback fighters
    this.fighter1 = {
        sprite: this.add.rectangle(centerX - 200, centerY + 50, 64, 64, 0x00ff00) as any,
        name: currentFight.player1,
        health: 100,
        wins: 0
    };

    this.fighter2 = {
        sprite: this.add.rectangle(centerX + 200, centerY + 50, 64, 64, 0xff0000) as any,
        name: currentFight.player2,
        health: 100,
        wins: 0
    };
  }
} 