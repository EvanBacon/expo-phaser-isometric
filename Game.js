import Expo from 'expo';
import ExpoPhaser from 'expo-phaser';
import './phaser-plugin-isometric.js';
import Playable from './states/Playable';

export default class Game {
  constructor({ context }) {
    Expo.ScreenOrientation.allow(Expo.ScreenOrientation.Orientation.PORTRAIT);
    const game = ExpoPhaser.game({ context });
    this.playable = new Playable({ game, context });
    game.state.add('Playable', this.playable);
    game.state.start('Playable');
  }

  onTransform = transform => this.playable.onTransform(transform);

  updateControls = velocity =>
    this.playable && this.playable.updateControls({ velocity });
  onTouchesBegan = (x, y) =>
    this.playable && this.playable.onTouchesBegan(x, y);
  onTouchesMoved = (x, y) =>
    this.playable && this.playable.onTouchesMoved(x, y);
  onTouchesEnded = (x, y) =>
    this.playable && this.playable.onTouchesEnded(x, y);
}
