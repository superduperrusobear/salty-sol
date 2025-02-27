import { Types } from 'phaser';
import { BattleScene } from '../BattleScene';

export const createGameConfig = (parent: HTMLElement): Types.Core.GameConfig => {
  return {
    type: Phaser.AUTO,
    parent,
    width: 1600,  // 16:9 ratio
    height: 900,  // 16:9 ratio
    transparent: true,  // Make canvas background transparent
    scene: BattleScene,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
      pixelArt: false,
      antialias: true,
      transparent: true
    }
  };
}; 