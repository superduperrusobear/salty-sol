import { Types } from 'phaser';
import { BattleScene } from '../BattleScene';

export const createGameConfig = (parent: HTMLElement): Types.Core.GameConfig => {
  return {
    type: Phaser.AUTO,
    parent,
    width: '100%',  // Use percentage instead of fixed width
    height: '100%', // Use percentage instead of fixed height
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
      mode: Phaser.Scale.RESIZE, // Changed from FIT to RESIZE
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%',
      parent: parent,
      expandParent: true
    },
    render: {
      pixelArt: false,
      antialias: true,
      transparent: true
    }
  };
}; 