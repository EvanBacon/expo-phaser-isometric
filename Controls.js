import Expo from 'expo';
import React from 'react';
import { MultiTouchView } from 'expo-multi-touch';
import Game from './Game';

import { Animated, StyleSheet, View } from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
  ScrollView,
  State,
} from 'react-native-gesture-handler';

export default class Controls extends React.Component {
  constructor(props) {
    super(props);

    /* Pinching */
    this._baseScale = new Animated.Value(1);
    this._pinchScale = new Animated.Value(1);
    this._scale = Animated.multiply(this._baseScale, this._pinchScale);
    this._lastScale = 1;
    this._onPinchGestureEvent = Animated.event(
      [{ nativeEvent: { scale: this._pinchScale } }],
      { useNativeDriver: false },
    );

    this._translateX = new Animated.Value(0);
    this._translateY = new Animated.Value(0);
    this._lastOffset = { x: 0, y: 0 };
    this._onGestureEvent = Animated.event(
      [
        {
          nativeEvent: {
            translationX: this._translateX,
            translationY: this._translateY,
          },
        },
      ],
      { useNativeDriver: false },
    );
  }

  startObservingGestures = () => {
    this._pinchScale.addListener(({ value }) => {
      const scale = value * this._baseScale._value;
      console.log('scale', scale);
      this.game.onTransform({ scale });
    });

    this._translateX.addListener(({ value }) => {
      // const scale = value * this._baseScale._value;
      // console.log('x', value);
      this.game.onTransform({ x: value });
    });

    this._translateY.addListener(({ value }) => {
      // const scale = value;
      // console.log('y', value);
      this.game.onTransform({ y: value });
    });
  };

  _onPinchHandlerStateChange = event => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      this._lastScale *= event.nativeEvent.scale;
      this._baseScale.setValue(this._lastScale);
      this._pinchScale.setValue(1);
    }
  };

  _onHandlerStateChange = event => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      this._lastOffset.x += event.nativeEvent.translationX;
      this._lastOffset.y += event.nativeEvent.translationY;
      this._translateX.setOffset(this._lastOffset.x);
      this._translateX.setValue(0);
      this._translateY.setOffset(this._lastOffset.y);
      this._translateY.setValue(0);
    }
  };

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
      <PanGestureHandler
        id="image_tilt"
        minPointers={1}
        maxPointers={2}
        onGestureEvent={this._onGestureEvent}
        onHandlerStateChange={this._onHandlerStateChange}
      >
        <Animated.View style={styles.wrapper}>
          <PinchGestureHandler
            id="image_pinch"
            simultaneousHandlers="image_tilt"
            onGestureEvent={this._onPinchGestureEvent}
            onHandlerStateChange={this._onPinchHandlerStateChange}
          >
            <View style={styles.container} collapsable={false}>
              <Expo.GLView
                style={{ flex: 1 }}
                onContextCreate={context => {
                  this.game = new Game({ context });
                  this.props.onGame && this.props.onGame(this.game);
                  this.startObservingGestures();
                }}
              />
            </View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    );
  }
}

// <MultiTouchView
//             style={{ flex: 1 }}
//             onTouchesBegan={this.onTouchesBegan}
//             onTouchesEnded={this.onTouchesEnded}
//             onTouchesMoved={this.onTouchesMoved}
//             onTouchesCancelled={this.onTouchesEnded}
//           />

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    // overflow: 'hidden',
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  pinchableImage: {
    width: 250,
    height: 250,
  },
  wrapper: {
    flex: 1,
  },
});
