import Phaser from 'phaser';
import { SpaceMainScene } from '../scenes/SpaceMainScene';

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 390,
      height: 844,
    },
    scene: [SpaceMainScene],
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
