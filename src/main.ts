import Phaser from 'phaser';
import { createGameConfig } from './config/gameConfig';

window.addEventListener('load', () => {
  const config = createGameConfig();
  const game = new Phaser.Game(config);
  
  window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
  });
  
  (window as any).game = game;
});
