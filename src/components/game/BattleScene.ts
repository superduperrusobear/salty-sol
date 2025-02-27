import Phaser from 'phaser';

interface Fighter {
  sprite: Phaser.GameObjects.Sprite;
  health: number;
}

export class BattleScene extends Phaser.Scene {
  private fighter1?: Fighter;
  private fighter2?: Fighter;
  private currentArena: number = 0;
  private arenaSprite?: Phaser.GameObjects.Sprite;
  private roundStartTime: number = 0;
  private roundDuration: number = 5000; // 5 seconds per round
  private battlePhase: 'BETTING' | 'BATTLE' | 'PAYOUT' = 'BETTING';

  constructor() {
    super({ key: 'BattleScene' });
  }

  preload() {
    // Load HASH character sprite frames
    // Idle animation (8 frames)
    for (let i = 1; i <= 8; i++) {
      this.load.image(`hash-idle-${i}`, `/fighters/HASH/idle_${i}.png`);
    }

    // Run animation (8 frames)
    for (let i = 1; i <= 8; i++) {
      this.load.image(`hash-run-${i}`, `/fighters/HASH/run_${i}.png`);
    }

    // Attack animation (8 frames)
    for (let i = 1; i <= 8; i++) {
      this.load.image(`hash-attack-${i}`, `/fighters/HASH/1_atk_${i}.png`);
    }

    // Take hit animation (6 frames)
    for (let i = 1; i <= 6; i++) {
      this.load.image(`hash-hit-${i}`, `/fighters/HASH/take_hit_${i}.png`);
    }

    // Death animation (19 frames)
    for (let i = 1; i <= 19; i++) {
      this.load.image(`hash-death-${i}`, `/fighters/HASH/death_${i}.png`);
    }

    // Load demon sprite frames
    // Idle animation (6 frames)
    for (let i = 1; i <= 6; i++) {
      this.load.image(`demon-idle-${i}`, `/fighters/demon/demon_idle_${i}.png`);
    }

    // Walk animation (12 frames)
    for (let i = 1; i <= 12; i++) {
      this.load.image(`demon-walk-${i}`, `/fighters/demon/demon_walk_${i}.png`);
    }

    // Attack/Cleave animation (15 frames)
    for (let i = 1; i <= 15; i++) {
      this.load.image(`demon-cleave-${i}`, `/fighters/demon/demon_cleave_${i}.png`);
    }

    // Take hit animation (5 frames)
    for (let i = 1; i <= 5; i++) {
      this.load.image(`demon-hit-${i}`, `/fighters/demon/demon_take_hit_${i}.png`);
    }

    // Death animation (22 frames)
    for (let i = 1; i <= 22; i++) {
      this.load.image(`demon-death-${i}`, `/fighters/demon/demon_death_${i}.png`);
    }

    // Load arena background
    this.load.image('arena', '/scenes/bullxarena.png');
  }

  create() {
    // Set up arena background
    this.arenaSprite = this.add.sprite(800, 450, 'arena');
    this.arenaSprite.setOrigin(0.5, 0.5);
    this.updateArenaScale();
    this.arenaSprite.setDepth(-1);

    // Create animation configurations
    this.createAnimations();
    
    // Create fighters
    this.createFighters();
    
    // Start the first round
    this.startRound();
  }

  private createAnimations() {
    // HASH character animations
    this.anims.create({
      key: 'hash-idle',
      frames: [
        ...Array(8).fill(0).map((_, i) => ({ key: `hash-idle-${i + 1}` }))
      ],
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'hash-run',
      frames: [
        ...Array(8).fill(0).map((_, i) => ({ key: `hash-run-${i + 1}` }))
      ],
      frameRate: 12,
      repeat: -1
    });

    this.anims.create({
      key: 'hash-attack',
      frames: [
        ...Array(8).fill(0).map((_, i) => ({ key: `hash-attack-${i + 1}` }))
      ],
      frameRate: 15,
      repeat: 0
    });

    this.anims.create({
      key: 'hash-hit',
      frames: [
        ...Array(6).fill(0).map((_, i) => ({ key: `hash-hit-${i + 1}` }))
      ],
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
      key: 'hash-death',
      frames: [
        ...Array(19).fill(0).map((_, i) => ({ key: `hash-death-${i + 1}` }))
      ],
      frameRate: 15,
      repeat: 0
    });

    // Demon animations
    // Idle animation
    this.anims.create({
      key: 'demon-idle',
      frames: [
        ...Array(6).fill(0).map((_, i) => ({ key: `demon-idle-${i + 1}` }))
      ],
      frameRate: 10,
      repeat: -1
    });

    // Walk animation
    this.anims.create({
      key: 'demon-walk',
      frames: [
        ...Array(12).fill(0).map((_, i) => ({ key: `demon-walk-${i + 1}` }))
      ],
      frameRate: 12,
      repeat: -1
    });

    // Attack/Cleave animation
    this.anims.create({
      key: 'demon-attack',
      frames: [
        ...Array(15).fill(0).map((_, i) => ({ key: `demon-cleave-${i + 1}` }))
      ],
      frameRate: 15,
      repeat: 0
    });

    // Take hit animation
    this.anims.create({
      key: 'demon-hit',
      frames: [
        ...Array(5).fill(0).map((_, i) => ({ key: `demon-hit-${i + 1}` }))
      ],
      frameRate: 10,
      repeat: 0
    });

    // Death animation
    this.anims.create({
      key: 'demon-death',
      frames: [
        ...Array(22).fill(0).map((_, i) => ({ key: `demon-death-${i + 1}` }))
      ],
      frameRate: 15,
      repeat: 0
    });
  }

  private updateArenaScale() {
    if (!this.arenaSprite) return;
    
    const canvasWidth = this.cameras.main.width;
    const canvasHeight = this.cameras.main.height;
    
    const scaleX = canvasWidth / this.arenaSprite.width;
    const scaleY = canvasHeight / this.arenaSprite.height;
    
    const scale = Math.max(scaleX, scaleY);
    this.arenaSprite.setScale(scale);
    this.arenaSprite.setPosition(canvasWidth / 2, canvasHeight / 2);
  }

  private createFighters() {
    const leftX = this.cameras.main.width * 0.25;
    const rightX = this.cameras.main.width * 0.75;
    const centerY = this.cameras.main.height * 0.6;

    // Fighter 1 (left side) - HASH character
    const sprite1 = this.add.sprite(leftX, centerY, 'hash-idle-1');
    sprite1.setScale(4.4);
    sprite1.setOrigin(0.5, 0.5);
    sprite1.play('hash-idle');
    this.fighter1 = { sprite: sprite1, health: 100 };

    // Fighter 2 (right side) - Demon
    const sprite2 = this.add.sprite(rightX, centerY, 'demon-idle-1');
    sprite2.setScale(3);
    sprite2.setOrigin(0.5, 0.5);
    sprite2.setFlipX(false);
    sprite2.play('demon-idle');
    this.fighter2 = { sprite: sprite2, health: 100 };
  }

  setBattlePhase(phase: 'BETTING' | 'BATTLE' | 'PAYOUT') {
    this.battlePhase = phase;
    if (phase === 'BATTLE') {
      this.startRound();
    } else {
      // Reset to idle animations when not in battle
      if (this.fighter1?.sprite) {
        this.fighter1.sprite.play('hash-idle');
      }
      if (this.fighter2?.sprite) {
        this.fighter2.sprite.play('demon-idle');
      }
    }
  }

  private startRound() {
    this.roundStartTime = this.time.now;

    if (this.fighter1 && this.fighter2) {
      const leftX = this.cameras.main.width * 0.25;
      const rightX = this.cameras.main.width * 0.75;
      const centerX = this.cameras.main.width * 0.5;
      const centerY = this.cameras.main.height * 0.6;
      
      const sprite1 = this.fighter1.sprite;
      const sprite2 = this.fighter2.sprite;
      
      // Reset positions at the sides
      sprite1.setPosition(leftX, centerY);
      sprite2.setPosition(rightX, centerY);
      
      // Only start animations if in battle phase
      if (this.battlePhase === 'BATTLE') {
        // Start running/walking animation
        sprite1.play('hash-run');
        sprite2.play('demon-walk');

        // Move fighters to center
        this.tweens.add({
          targets: sprite1,
          x: centerX - 100, // Slightly left of center
          duration: 1000,
          ease: 'Linear',
          onComplete: () => {
            if (this.battlePhase === 'BATTLE') {
              sprite1.play('hash-attack');
              sprite1.once('animationcomplete', () => {
                sprite1.play('hash-idle');
              });
            }
          }
        });

        this.tweens.add({
          targets: sprite2,
          x: centerX + 100, // Slightly right of center
          duration: 1000,
          ease: 'Linear',
          onComplete: () => {
            if (this.battlePhase === 'BATTLE') {
              sprite2.play('demon-attack');
              sprite2.once('animationcomplete', () => {
                sprite2.play('demon-idle');
              });
            }
          }
        });

        // After battle sequence, move them back to original positions
        this.time.delayedCall(3000, () => {
          if (this.battlePhase === 'BATTLE') {
            // Move back to sides
            this.tweens.add({
              targets: sprite1,
              x: leftX,
              duration: 1000,
              ease: 'Linear',
              onStart: () => {
                sprite1.play('hash-run');
              },
              onComplete: () => {
                sprite1.play('hash-idle');
              }
            });

            this.tweens.add({
              targets: sprite2,
              x: rightX,
              duration: 1000,
              ease: 'Linear',
              onStart: () => {
                sprite2.play('demon-walk');
              },
              onComplete: () => {
                sprite2.play('demon-idle');
              }
            });
          }
        });
      } else {
        // Keep them in idle animation if not in battle
        sprite1.play('hash-idle');
        sprite2.play('demon-idle');
      }
    }
  }

  update() {
    const elapsed = this.time.now - this.roundStartTime;
    
    // Start next round when current one ends
    if (elapsed >= this.roundDuration) {
      this.startRound();
    }
  }
} 