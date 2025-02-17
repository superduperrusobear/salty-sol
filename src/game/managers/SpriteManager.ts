import { Scene } from 'phaser';

export interface CharacterSprite {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  animations: {
    [key: string]: {
      frames: number[];
      frameRate: number;
      repeat: number;
    };
  };
}

export class SpriteManager {
  private static instance: SpriteManager;
  private scene: Scene;
  private isLoading: boolean = false;

  private readonly characters: CharacterSprite[] = [
    {
      key: 'knight',
      path: '/game%20engine/sprites/Knight%202D%20Pixel%20Art/Sprite%20Sheets/Idle.png',
      frameWidth: 128,
      frameHeight: 64,
      animations: {
        idle: {
          frames: [0, 1, 2, 3, 4, 5],
          frameRate: 8,
          repeat: -1
        },
        attack: {
          frames: [0, 1, 2, 3],
          frameRate: 12,
          repeat: 0
        }
      }
    },
    {
      key: 'nightborne',
      path: '/game%20engine/sprites/nightborne/Sprite%20Sheets/Idle.png',
      frameWidth: 80,
      frameHeight: 80,
      animations: {
        idle: {
          frames: [0, 1, 2, 3, 4, 5],
          frameRate: 8,
          repeat: -1
        },
        attack: {
          frames: [0, 1, 2, 3],
          frameRate: 12,
          repeat: 0
        }
      }
    },
    {
      key: 'colour1',
      path: '/game%20engine/sprites/Colour1/Sprite%20Sheets/Idle.png',
      frameWidth: 64,
      frameHeight: 64,
      animations: {
        idle: {
          frames: [0, 1, 2, 3],
          frameRate: 8,
          repeat: -1
        },
        attack: {
          frames: [0, 1, 2, 3],
          frameRate: 12,
          repeat: 0
        }
      }
    }
  ];

  private constructor(scene: Scene) {
    this.scene = scene;
  }

  static getInstance(scene: Scene): SpriteManager {
    if (!SpriteManager.instance) {
      SpriteManager.instance = new SpriteManager(scene);
    }
    SpriteManager.instance.scene = scene; // Update scene reference
    return SpriteManager.instance;
  }

  public preloadSprites() {
    if (!this.scene || !this.scene.load || this.isLoading) {
      console.error('Scene or loader not available');
      return;
    }
    
    this.isLoading = true;
    console.log('Preloading sprites for characters:', this.characters.map(c => c.key));

    try {
      this.characters.forEach(character => {
        const spriteKey = character.key;
        console.log(`Loading sprite sheet: ${spriteKey} from ${character.path}`);
        
        // Load the sprite sheet
        this.scene.load.spritesheet(spriteKey, character.path, {
          frameWidth: character.frameWidth,
          frameHeight: character.frameHeight
        });
      });

      // Add load error handler for individual files
      this.scene.load.on('loaderror', (file: any) => {
        console.error(`Error loading sprite ${file.key}:`, file.src);
      });

    } catch (error) {
      console.error('Error in preloadSprites:', error);
      this.isLoading = false;
    }
  }

  public createAnimations() {
    if (!this.scene || !this.scene.anims) {
      console.error('Scene or animations system not available');
      return;
    }
    
    console.log('Creating animations for characters');
    
    this.characters.forEach(character => {
      // First check if the texture exists
      if (!this.scene.textures.exists(character.key)) {
        console.error(`Texture ${character.key} not found, cannot create animations`);
        return;
      }

      Object.entries(character.animations).forEach(([animName, config]) => {
        const key = `${character.key}_${animName}`;
        
        // Remove existing animation if it exists
        if (this.scene.anims.exists(key)) {
          this.scene.anims.remove(key);
        }
        
        try {
          console.log(`Creating animation: ${key}`, {
            frames: config.frames,
            frameRate: config.frameRate,
            repeat: config.repeat
          });
          
          this.scene.anims.create({
            key: key,
            frames: this.scene.anims.generateFrameNumbers(character.key, {
              frames: config.frames
            }),
            frameRate: config.frameRate,
            repeat: config.repeat
          });
          
          console.log(`Successfully created animation: ${key}`);
        } catch (error) {
          console.error(`Failed to create animation ${key}:`, error);
        }
      });
    });
  }

  public getRandomCharacter(): CharacterSprite {
    const randomIndex = Math.floor(Math.random() * this.characters.length);
    return this.characters[randomIndex];
  }

  public getAllCharacters(): CharacterSprite[] {
    return [...this.characters];
  }
} 