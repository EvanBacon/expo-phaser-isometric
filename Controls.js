import Expo from 'expo';
import React from 'react';
import { MultiTouchView } from 'expo-multi-touch';
import Game from './Game';

export default class Controls extends React.Component {
  componentDidMount() {
    this._subscribe();
  }
  componentWillUnmount() {
    this._unsubscribe();
  }

  _subscribe = () => {
    Expo.Accelerometer.setUpdateInterval(16);
    this._subscription = Expo.Accelerometer.addListener(
      ({ x }) => this.game && this.game.updateControls(x),
    );
  };

  _unsubscribe = () => {
    Expo.Accelerometer.removeAllListeners();
    this._subscription && this._subscription.remove();
    this._subscription = null;
  };

  shouldComponentUpdate = () => false;

  onTouchesBegan = ({ pageX: x, pageY: y }) =>
    this.game && this.game.onTouchesBegan(x, y);
  onTouchesMoved = ({ pageX: x, pageY: y }) =>
    this.game && this.game.onTouchesMoved(x, y);
  onTouchesEnded = ({ pageX: x, pageY: y }) =>
    this.game && this.game.onTouchesEnded(x, y);
  render() {
    return (
      <MultiTouchView
        style={{ flex: 1 }}
        onTouchesBegan={this.onTouchesBegan}
        onTouchesEnded={this.onTouchesEnded}
        onTouchesMoved={this.onTouchesMoved}
        onTouchesCancelled={this.onTouchesEnded}
      >
        <Expo.GLView
          style={{ flex: 1 }}
          onContextCreate={context => (this.game = new Game({ context }))}
        />
      </MultiTouchView>
    );
  }
}
