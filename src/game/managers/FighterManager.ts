import { EventEmitter } from 'events';

interface FighterAnimationConfig {
  idle: {
    frameWidth: number;
    frameHeight: number;
    frameRate: number;
    frames: { start: number; end: number; };
  };
  attack?: {
    frameWidth: number;
    frameHeight: number;
    frameRate: number;
    frames: { start: number; end: number; };
  };
  run?: {
    frameWidth: number;
    frameHeight: number;
    frameRate: number;
    frames: { start: number; end: number; };
  };
  hurt?: {
    frameWidth: number;
    frameHeight: number;
    frameRate: number;
    frames: { start: number; end: number; };
  };
}

interface SpriteSet {
  key: string;
  basePath: string;
  animations: FighterAnimationConfig;
}

interface Fighter {
  name: string;
  contractAddress: string;
  key: string;
  isEnabled: boolean;
  imagePath: string;
  portraitKey: string;
  scale: number;
  animations: FighterAnimationConfig;
  spritesheets: {
    idle: string;
    attack?: string;
    run?: string;
    hurt?: string;
  };
}

type PlayerType = 'player1' | 'player2';

export class FighterManager {
  private readonly SPRITE_PATH = '/game engine/sprites';
  private readonly SPRITE_SETS: SpriteSet[] = [
    {
      key: 'bat',
      basePath: `${this.SPRITE_PATH}/Bat with VFX`,
      animations: {
        idle: {
          frameWidth: 64,
          frameHeight: 64,
          frameRate: 8,
          frames: { start: 0, end: 6 }
        },
        attack: {
          frameWidth: 64,
          frameHeight: 64,
          frameRate: 12,
          frames: { start: 0, end: 4 }
        },
        run: {
          frameWidth: 64,
          frameHeight: 64,
          frameRate: 10,
          frames: { start: 0, end: 7 }
        },
        hurt: {
          frameWidth: 64,
          frameHeight: 64,
          frameRate: 8,
          frames: { start: 0, end: 3 }
        }
      }
    },
    {
      key: 'hero',
      basePath: `${this.SPRITE_PATH}/Colour1`,
      animations: {
        idle: {
          frameWidth: 120,
          frameHeight: 80,
          frameRate: 8,
          frames: { start: 0, end: 3 }
        },
        attack: {
          frameWidth: 120,
          frameHeight: 80,
          frameRate: 12,
          frames: { start: 0, end: 9 }
        },
        run: {
          frameWidth: 120,
          frameHeight: 80,
          frameRate: 10,
          frames: { start: 0, end: 7 }
        },
        hurt: {
          frameWidth: 120,
          frameHeight: 80,
          frameRate: 8,
          frames: { start: 0, end: 4 }
        }
      }
    },
    {
      key: 'knight-2d',
      basePath: `${this.SPRITE_PATH}/Knight 2D Pixel Art`,
      animations: {
        idle: {
          frameWidth: 160,
          frameHeight: 111,
          frameRate: 8,
          frames: { start: 0, end: 9 }
        },
        attack: {
          frameWidth: 160,
          frameHeight: 111,
          frameRate: 12,
          frames: { start: 0, end: 5 }
        },
        run: {
          frameWidth: 160,
          frameHeight: 111,
          frameRate: 10,
          frames: { start: 0, end: 7 }
        },
        hurt: {
          frameWidth: 160,
          frameHeight: 111,
          frameRate: 8,
          frames: { start: 0, end: 3 }
        }
      }
    }
  ];

  // Move currentlyUsedSpriteSets before fighter arrays and initialize it
  private currentlyUsedSpriteSets = new Set<string>();
  private events: EventEmitter;
  private loadedImages: Set<string> = new Set();

  private player1Fighters: Fighter[];
  private player2Fighters: Fighter[];
  private currentFighterIndices: { player1: number; player2: number } = {
    player1: -1,
    player2: -1
  };

  constructor() {
    this.events = new EventEmitter();
    
    // Initialize fighters after currentlyUsedSpriteSets is created
    this.player1Fighters = [
      { name: 'BATCAT', contractAddress: '4MpXgiYj9nEvN1xZYZ4qgB6zq5r2JMRy54WaQu5fpump', key: 'batcat', isEnabled: true },
      { name: 'DUKO', contractAddress: 'HLptm5e6rTgh4EKgDpYFrnRHbjpkMyVdEeREEa2G7rf9', key: 'duko', isEnabled: true },
      { name: 'VIGI', contractAddress: 'HeBCP2imwM8vosBqU5PBvm1PamCzWj2ch9ZhVrsLpump', key: 'vigi', isEnabled: true },
      { name: 'JAILSTOOL', contractAddress: 'AxriehR6Xw3adzHopnvMn7GcpRFcD41ddpiTWMg6pump', key: 'jailstool', isEnabled: true },
      { name: 'MAXI', contractAddress: '9CB8iSEQDyb3MzE7bDD3aE6XmY1sopF7PFnLjBtzpump', key: 'maxi', isEnabled: true },
      { name: 'ANGLERFISH', contractAddress: 'DjgujfEv2u2qz7PNuS6Ct7bctnxPFihfWE2zBpKZpump', key: 'anglerfish', isEnabled: true },
      { name: 'PINION', contractAddress: 'DjgujfEv2u2qz7PNuS6Ct7bctnxPFihfWE2zBpKZpump', key: 'pinion', isEnabled: false }
    ].map(fighter => this.assignRandomSpriteSet(fighter));

    this.player2Fighters = [
      { name: 'EAGLE', contractAddress: 'GnQUsLcyZ3NXUAPXymWoefMYfCwmJazBVkko4vb7pump', key: 'eagle', isEnabled: true },
      { name: 'DUO', contractAddress: 'KFTSxPQxDV1wGjEvzKHWD7mG6e9TsMVq4eF4mQppump', key: 'duo', isEnabled: true },
      { name: 'GWR', contractAddress: 'ETdqLnxH2DNnXxA8gx4JpCKtvHqzHBbPjFQYqtGvpump', key: 'gwr', isEnabled: true },
      { name: 'EBICHU', contractAddress: 'DpXJitV8bZrRCg6mWhsqqv43Epd7oYKyBM5SXStCTRXm', key: 'ebichu', isEnabled: true },
      { name: 'COKE', contractAddress: '2DJAyCbx9HkHiPsyJdZmgio9Pu9p1w6jujXDo5h4pump', key: 'coke', isEnabled: true },
      { name: 'CWF', contractAddress: '7atgF8KQo4wJrD5ATGX7t1V2zVvykPJbFfNeVf1icFv1', key: 'cwf', isEnabled: true },
      { name: 'TRUMP', contractAddress: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN', key: 'trump', isEnabled: true }
    ].map(fighter => this.assignRandomSpriteSet(fighter));
  }

  private getAvailableSpriteSet(): SpriteSet {
    // Filter out sprite sets that are already in use
    const availableSets = this.SPRITE_SETS.filter(set => !this.currentlyUsedSpriteSets.has(set.key));
    
    // If all sets are used (shouldn't happen with 4 sets and 2 fighters), clear and start over
    if (availableSets.length === 0) {
      this.currentlyUsedSpriteSets.clear();
      return this.SPRITE_SETS[Math.floor(Math.random() * this.SPRITE_SETS.length)];
    }

    // Get a random available set
    const spriteSet = availableSets[Math.floor(Math.random() * availableSets.length)];
    this.currentlyUsedSpriteSets.add(spriteSet.key);
    return spriteSet;
  }

  private assignRandomSpriteSet(fighter: Partial<Fighter>): Fighter {
    const spriteSet = this.getAvailableSpriteSet();
    const basePath = spriteSet.basePath;

    return {
      ...fighter,
      imagePath: `${basePath}/${spriteSet.key}-portrait.png`,
      portraitKey: `${fighter.key}-portrait`,
      scale: 3,
      animations: spriteSet.animations,
      spritesheets: {
        idle: `${basePath}/${spriteSet.key === 'bat' ? 'Bat-IdleFly' :
               spriteSet.key === 'hero' ? '_Idle' : 'IDLE'}.png`,
        attack: `${basePath}/${spriteSet.key === 'bat' ? 'Bat-Attack1' :
                 spriteSet.key === 'hero' ? '_Attack' : 'ATTACK 1'}.png`,
        run: `${basePath}/${spriteSet.key === 'bat' ? 'Bat-Run' :
              spriteSet.key === 'hero' ? '_Run' : 'RUN'}.png`,
        hurt: `${basePath}/${spriteSet.key === 'bat' ? 'Bat-Hurt' :
              spriteSet.key === 'hero' ? '_Hit' : 'HURT'}.png`
      }
    } as Fighter;
  }

  private getFighterPool(player: PlayerType): Fighter[] {
    return player === 'player1' ? this.player1Fighters : this.player2Fighters;
  }

  public getEnabledFighters(player: PlayerType): Fighter[] {
    return this.getFighterPool(player).filter(fighter => fighter.isEnabled);
  }

  public getCurrentFighter(player: PlayerType): Fighter | null {
    const index = this.currentFighterIndices[player];
    if (index === -1) {
      return null;
    }
    return this.getFighterPool(player)[index];
  }

  public getRandomFighter(player: PlayerType): Fighter {
    const enabledFighters = this.getEnabledFighters(player);
    const randomIndex = Math.floor(Math.random() * enabledFighters.length);
    const selectedFighter = enabledFighters[randomIndex];
    
    // Reassign random sprite set
    const updatedFighter = this.assignRandomSpriteSet(selectedFighter);
    
    // Update current fighter index
    this.currentFighterIndices[player] = this.getFighterPool(player)
      .findIndex(f => f.key === updatedFighter.key);
    
    // Emit fighter change event
    this.events.emit('fighterChange', { 
      player, 
      fighter: updatedFighter,
      imagePath: updatedFighter.imagePath,
      portraitKey: updatedFighter.portraitKey
    });
    
    return updatedFighter;
  }

  public getFighterByKey(player: PlayerType, key: string): Fighter | undefined {
    return this.getFighterPool(player).find(fighter => fighter.key === key);
  }

  public getFighterByAddress(player: PlayerType, address: string): Fighter | undefined {
    return this.getFighterPool(player).find(fighter => fighter.contractAddress === address);
  }

  public setFighterEnabled(player: PlayerType, key: string, enabled: boolean): void {
    const fighter = this.getFighterByKey(player, key);
    if (fighter) {
      fighter.isEnabled = enabled;
      this.events.emit('fighterStatusChange', { 
        player, 
        key, 
        enabled,
        imagePath: fighter.imagePath,
        portraitKey: fighter.portraitKey
      });
    }
  }

  public getRandomFighterPair(): { player1: Fighter; player2: Fighter } {
    // Clear the currently used sprite sets at the start of a new battle
    this.currentlyUsedSpriteSets.clear();
    
    return {
      player1: this.getRandomFighter('player1'),
      player2: this.getRandomFighter('player2')
    };
  }

  public getFighterImagePath(player: PlayerType, key: string): string | undefined {
    const fighter = this.getFighterByKey(player, key);
    return fighter?.imagePath;
  }

  public preloadFighterSprites(scene: Phaser.Scene): void {
    const loadSprites = (fighter: Fighter) => {
      // Load portrait
      if (!this.loadedImages.has(fighter.portraitKey)) {
        scene.load.image(fighter.portraitKey, fighter.imagePath);
        this.loadedImages.add(fighter.portraitKey);
      }

      // Load spritesheets
      const animations = ['idle', 'attack', 'run', 'hurt'] as const;
      animations.forEach(anim => {
        if (fighter.spritesheets[anim]) {
          const key = `${fighter.key}-${anim}`;
          if (!this.loadedImages.has(key)) {
            console.log(`Loading spritesheet: ${key}`, fighter.spritesheets[anim]);
            scene.load.spritesheet(key, fighter.spritesheets[anim]!, {
              frameWidth: fighter.animations[anim]!.frameWidth,
              frameHeight: fighter.animations[anim]!.frameHeight
            });
            this.loadedImages.add(key);
          }
        }
      });
    };

    // Load sprites for all fighters
    [...this.player1Fighters, ...this.player2Fighters].forEach(loadSprites);

    // Add load complete handler
    scene.load.on('complete', () => {
      console.log('All sprites loaded successfully');
      this.createAnimations(scene);
      this.events.emit('imagesLoaded');
    });

    // Add error handler
    scene.load.on('loaderror', (fileObj: any) => {
      console.error(`Error loading fighter assets:`, fileObj);
      this.events.emit('imageLoadError', fileObj);
    });
  }

  private createAnimations(scene: Phaser.Scene): void {
    const createFighterAnimations = (fighter: Fighter) => {
      const animations = ['idle', 'attack', 'run', 'hurt'] as const;
      
      animations.forEach(anim => {
        if (fighter.animations[anim]) {
          const config = fighter.animations[anim]!;
          const key = `${fighter.key}-${anim}`;
          
          // Remove existing animation if it exists
          if (scene.anims.exists(key)) {
            scene.anims.remove(key);
          }
          
          // Create new animation
          scene.anims.create({
            key: key,
            frames: scene.anims.generateFrameNumbers(`${fighter.key}-${anim}`, {
              start: config.frames.start,
              end: config.frames.end
            }),
            frameRate: config.frameRate,
            repeat: anim === 'idle' || anim === 'run' ? -1 : 0
          });
        }
      });
    };

    // Create animations for all fighters
    [...this.player1Fighters, ...this.player2Fighters].forEach(createFighterAnimations);
  }

  public getFighterScale(player: PlayerType, key: string): number {
    const fighter = this.getFighterByKey(player, key);
    return fighter?.scale ?? 1;
  }

  public isImageLoaded(portraitKey: string): boolean {
    return this.loadedImages.has(portraitKey);
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    this.events.on(event, listener);
  }

  public off(event: string, listener: (...args: any[]) => void): void {
    this.events.off(event, listener);
  }

  public getFighterByName(player: PlayerType, name: string): Fighter | undefined {
    const fighters = this.getFighterPool(player);
    return fighters.find(fighter => fighter.name.toLowerCase() === name.toLowerCase());
  }
} 