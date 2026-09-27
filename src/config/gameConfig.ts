import Phaser from 'phaser';
import { MainScene } from '../scenes/MainScene';

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#0f172a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 390,
      height: 844,
    },
    scene: [MainScene],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
  };

  return config;
}
