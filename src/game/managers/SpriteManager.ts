import { Scene } from 'phaser';

export interface SpriteConfig {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
}

export class SpriteManager {
  private static instance: SpriteManager;
  private scene: Scene;

  private constructor(scene: Scene) {
    this.scene = scene;
  }

  static getInstance(scene: Scene): SpriteManager {
    if (!SpriteManager.instance) {
      SpriteManager.instance = new SpriteManager(scene);
    }
    return SpriteManager.instance;
  }

  public preloadSprites() {
    // We'll add sprite loading here
  }

  public createAnimation(key: string, frames: number[], frameRate: number = 10, repeat: number = -1) {
    // We'll add animation creation here
  }
} 