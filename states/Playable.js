import Assets from '../Assets';
import uri from '../utils/uri';
import { PixelRatio } from 'react-native';
import { Phaser } from 'expo-phaser';
import Settings from '../Settings';

const scale = PixelRatio.get();

import EasyStar from 'easystarjs';
import Level from '../game/map';
import Dude from '../game/dude';

class State {
  static get size() {
    return 36;
  }

  static get startPosition() {
    return {
      x: State.size * (11 - 0.5),
      y: State.size * (11 - 0.5),
    };
  }

  // player;
  // aliens;
  // bullets;
  // bulletTime = 0;
  // //   cursors;
  // //   fireButton;
  // explosions;
  // starfield;
  // score = 0;
  // scoreText;
  // lives;
  // enemyBullet;
  // firingTimer = 0;
  // stateText;
  // livingEnemies = [];

  constructor({ game, context }) {
    this.game = game;
    this.context = context;
  }

  preload = () => {
    const { game } = this;
    game.time.advancedTiming = true;
    game.debug.renderShadow = false;
    game.stage.disableVisibilityChange = true;
    game.plugins.add(new Phaser.Plugin.Isometric(game));
    game.world.setBounds(0, 0, 2048, 2048);
    game.iso.anchor.setTo(0.5, 0.5);

    game.load.atlasJSONHash(
      'tileset',
      uri(Assets.sprites['tileset.png']),
      uri(Assets.sprites['tileset.json']),
    );
    game.load.atlasJSONHash(
      'char',
      uri(Assets.sprites['char.png']),
      uri(Assets.sprites['char.json']),
    );
    game.load.atlasJSONHash(
      'object',
      uri(Assets.sprites['object.png']),
      uri(Assets.sprites['object.json']),
    );

    // game.load.image('bullet', uri(Assets.files['bullet.png']));
    // game.load.image('enemyBullet', uri(Assets.files['enemy-bullet.png']));
    // game.load.spritesheet(
    //   'invader',
    //   uri(Assets.files['invader32x32x4.png']),
    //   Settings.invader,
    //   Settings.invader,
    // );
    // game.load.image('ship', uri(Assets.files['player.png']));
    // game.load.spritesheet(
    //   'kaboom',
    //   uri(Assets.files['explode.png']),
    //   Settings.explosion,
    //   Settings.explosion,
    // );
    game.load.image('starfield', uri(Assets.files['starfield.png']));
  };

  updateControls = ({ velocity }) => {
    const { player } = this;
    // if (player && player.alive) {
    //   let speed = Math.floor(velocity * Settings.playerSpeed);
    //   //  Reset the player, then check for movement keys
    //   player.body.velocity.setTo(0, 0);
    //   player.body.velocity.x = speed;
    // }
  };

  get width() {
    return this.game.world.width;
  }
  get height() {
    return this.game.world.height;
  }

  scaleNode = node => {
    node.width *= scale;
    node.height *= scale;
  };

  onTouchesBegan = () => (this.pressing = true);

  onTouchesEnded = () => {
    this.pressing = false;
    if (this.player) {
      if (this.player.alive) {
        this.fireBullet();
      } else {
        this.restart();
      }
    }
  };

  create = () => {
    const { game } = this;

    this.groundGroup = this.game.add.group();
    this.objectGroup = this.game.add.group();
    this.water = [];
    this.cursorPos = new Phaser.Plugin.Isometric.Point3();
    this.easystar = new EasyStar.js(); // eslint-disable-line new-cap
    this.finding = false;

    this.easystar.setGrid(Level.walkable);
    this.easystar.setAcceptableTiles([1]);
    // this.easystar.enableDiagonals();
    // this.easystar.disableCornerCutting();

    // Generate ground
    for (let y = 0; y < Level.ground.length; y += 1) {
      for (let x = 0; x < Level.ground[y].length; x += 1) {
        const tile = this.game.add.isoSprite(
          State.size * x,
          State.size * y,
          0,
          'tileset',
          Level.groundNames[Level.ground[y][x]],
          this.groundGroup,
        );

        // Anchor is bottom middle
        tile.anchor.set(0.5, 1 - (tile.height - tile.width / 2) / tile.height);
        tile.scale.x = Level.direction[y][x];
        tile.initialZ = 0;

        if (Level.ground[y][x] === 0) {
          // Add to water tiles
          tile.initialZ = -4;
          this.water.push(tile);
        }

        if (Level.ground[y][x] === 4) {
          // Make bridge higher
          tile.isoZ += 4;
          tile.initialZ += 4;

          // Put tile under bridge
          const waterUnderBridge = this.game.add.isoSprite(
            State.size * x,
            State.size * y,
            0,
            'tileset',
            Level.groundNames[0],
            this.groundGroup,
          );
          waterUnderBridge.anchor.set(0.5, 1);
          waterUnderBridge.initialZ = -4;
          this.water.push(waterUnderBridge);
        }
      }
    }

    // Generate objects
    for (let y = 0; y < Level.object.length; y += 1) {
      for (let x = 0; x < Level.object[y].length; x += 1) {
        if (Level.object[y][x] !== 0) {
          const tile = this.game.add.isoSprite(
            State.size * x,
            State.size * y,
            0,
            'object',
            Level.objectNames[Level.object[y][x]],
            this.objectGroup,
          );

          // Anchor is bottom middle
          tile.anchor.set(0.5, 1);
          tile.initialZ = 0;
        }
      }
    }

    this.game.iso.simpleSort(this.groundGroup);

    // Create dude
    this.dude = new Dude(this.game, State.startPosition);
    this.objectGroup.add(this.dude.sprite);
    this.game.camera.follow(this.dude.sprite);

    // game.stage.backgroundColor = '#4488AA';
    // game.physics.startSystem(Phaser.Physics.ARCADE);

    /**
     *
     *  A TileSprite is a Sprite that has a repeating texture.
     *  The texture can be scrolled and scaled independently of the TileSprite itself.
     *  Textures will automatically wrap and are designed so that you can create game
     *  backdrops using seamless textures as a source.
     *
     **/
    //  The scrolling starfield background
    // this.starfield = game.add.tileSprite(0, 0, this.width, this.height, 'starfield');
    this.starfield = game.add.sprite(0, 0, 'starfield');
    this.starfield.width = this.width;
    this.starfield.height = this.height;
    //  Our bullet group
    // this.bullets = game.add.group();
    // this.bullets.enableBody = true;
    // this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    // this.bullets.createMultiple(30, 'bullet');
    // this.bullets.setAll('anchor.x', 0.5);
    // this.bullets.setAll('anchor.y', 1);
    // this.bullets.setAll('width', 6 * scale);
    // this.bullets.setAll('height', 36 * scale);
    // this.bullets.setAll('outOfBoundsKill', true);
    // this.bullets.setAll('checkWorldBounds', true);

    // // The enemy's bullets
    // this.enemyBullets = game.add.group();
    // this.enemyBullets.enableBody = true;
    // this.enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    // this.enemyBullets.createMultiple(30, 'enemyBullet');
    // this.enemyBullets.setAll('anchor.x', 0.5);
    // this.enemyBullets.setAll('anchor.y', 1);
    // this.enemyBullets.setAll('width', 9 * scale);
    // this.enemyBullets.setAll('height', 9 * scale);
    // this.enemyBullets.setAll('outOfBoundsKill', true);
    // this.enemyBullets.setAll('checkWorldBounds', true);

    // //  The hero!
    // this.player = game.add.sprite(
    //   this.width * 0.5,
    //   this.height * 0.833333333,
    //   'ship'
    // );
    // this.player.anchor.setTo(0.5, 0.5);
    // this.scaleNode(this.player);
    // game.physics.enable(this.player, Phaser.Physics.ARCADE);

    // //  The baddies!
    // this.aliens = game.add.group();
    // this.aliens.enableBody = true;
    // this.aliens.physicsBodyType = Phaser.Physics.ARCADE;

    // this.createAliens();

    // //  Lives
    // this.lives = game.add.group();

    // const lives = 3;
    // const shipOffset = this.width * 0.125;
    // const initialshipXoffset = this.width - shipOffset * lives;
    // const shipInterval = 30 * scale;
    // const shipY = 60 * scale;
    // for (var i = 0; i < lives; i++) {
    //   var ship = this.lives.create(
    //     initialshipXoffset + shipInterval * i,
    //     shipY,
    //     'ship'
    //   );
    //   this.scaleNode(ship);
    //   ship.anchor.setTo(0.5, 0.5);
    //   ship.angle = 90;
    //   ship.alpha = 0.4;
    // }

    // //  An explosion pool
    // this.explosions = game.add.group();
    // // this.explosions.scale = scale;
    // this.explosions.createMultiple(30, 'kaboom');
    // this.explosions.setAll('height', 128 * scale);
    // this.explosions.setAll('width', 128 * scale);
    // this.explosions.setAll('transparent', true);

    // this.explosions.forEach(this.setupInvader, this);

    //  And some controls to play the game with
    // this.cursors = game.input.keyboard.createCursorKeys();
    // this.fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  };

  // createAliens = () => {
  //   const alienDelta = this.width * 0.25;
  //   const alienAvailableSpace = this.width - alienDelta;
  //   const alienWidth = 32 * scale;
  //   const alienPadding = 12;
  //   const aliens = Math.floor(
  //     alienAvailableSpace / (alienPadding + alienWidth)
  //   );

  //   const dimensions = {
  //     rows: 4,
  //     columns: aliens,
  //   };
  //   const alienOffset = {
  //     x: alienAvailableSpace / dimensions.columns,
  //   };
  //   for (let y = 0; y < dimensions.rows; y++) {
  //     for (let x = 0; x < dimensions.columns; x++) {
  //       const alien = this.aliens.create(
  //         x * alienOffset.x,
  //         y * alienOffset.x,
  //         'invader'
  //       );
  //       this.scaleNode(alien);
  //       alien.anchor.setTo(0.5, 0.5);
  //       alien.animations.add('fly', [0, 1, 2, 3], 20, true);
  //       alien.play('fly');
  //       alien.body.moves = false;
  //     }
  //   }

  //   // const alienOffset = this.game.world.width
  //   this.aliens.x = alienWidth / 2;
  //   this.aliens.y = this.height * 0.0625;

  //   //  All this does is basically start the invaders moving. Notice we're moving the Group they belong to, rather than the invaders directly.
  //   const tween = this.game.add
  //     .tween(this.aliens)
  //     .to(
  //       { x: this.width - alienAvailableSpace + alienWidth / 2 },
  //       2000,
  //       Phaser.Easing.Linear.None,
  //       true,
  //       0,
  //       1000,
  //       true
  //     );

  //   //  When the tween loops it calls descend
  //   tween.onRepeat.add(this.descend, this);
  // };

  // setupInvader = invader => {
  //   invader.anchor.x = 0.5;
  //   invader.anchor.y = 0.5;
  //   invader.animations.add('kaboom');
  // };

  // descend = () => {
  //   console.log('Loop');
  //   this.aliens.y += this.height * 0.0166666667;
  // };

  // collisionHandler = (bullet, alien) => {
  //   //  When a bullet hits an alien we kill them both
  //   bullet.kill();
  //   alien.kill();

  //   //  Increase the score
  //   this.score += 20;
  //   // this.scoreText.text = this.scoreString + this.score;

  //   //  And create an explosion :)
  //   const explosion = this.explosions.getFirstExists(false);
  //   if (explosion) {
  //     explosion.reset(alien.body.x, alien.body.y);
  //     explosion.play('kaboom', 30, false, true);
  //   }
  //   if (this.aliens.countLiving() == 0) {
  //     this.score += 1000;

  //     this.enemyBullets.callAll('kill', this);
  //     // this.stateText.text = " You Won, \n Click to restart";
  //     // this.stateText.visible = true;

  //     //the "click to restart" handler
  //     this.game.input.onTap.addOnce(this.restart, this);
  //   }
  // };

  // enemyHitsPlayer = (player, bullet) => {
  //   const { game } = this;
  //   bullet.kill();

  //   this.live = this.lives.getFirstAlive();

  //   if (this.live) {
  //     this.live.kill();
  //   }

  //   //  And create an explosion :)
  //   const explosion = this.explosions.getFirstExists(false);
  //   if (explosion) {
  //     explosion.reset(player.body.x, player.body.y);
  //     explosion.play('kaboom', 30, false, true);
  //   }
  //   // When the player dies
  //   if (this.lives.countLiving() < 1) {
  //     player.kill();
  //     this.enemyBullets.callAll('kill');

  //     // this.stateText.text=" GAME OVER \n Click to restart";
  //     // this.stateText.visible = true;

  //     //the "click to restart" handler
  //     game.input.onTap.addOnce(this.restart, this);
  //   }
  // };

  // enemyFires = () => {
  //   const { game } = this;
  //   //  Grab the first bullet we can from the pool
  //   this.enemyBullet = this.enemyBullets.getFirstExists(false);

  //   this.livingEnemies.length = 0;

  //   this.aliens.forEachAlive(alien => {
  //     // put every living enemy in an array
  //     this.livingEnemies.push(alien);
  //   });

  //   if (this.enemyBullet && this.livingEnemies.length > 0) {
  //     var random = game.rnd.integerInRange(0, this.livingEnemies.length - 1);

  //     // randomly select one of them
  //     var shooter = this.livingEnemies[random];
  //     // And fire the bullet from this enemy
  //     this.enemyBullet.reset(shooter.body.x, shooter.body.y);

  //     game.physics.arcade.moveToObject(this.enemyBullet, this.player, 120);
  //     this.firingTimer = game.time.now + 2000;
  //   }
  // };

  // fireBullet = () => {
  //   let { game, bulletTime, bullet, bullets, player } = this;
  //   //  To avoid them being allowed to fire too fast we set a time limit
  //   if (game.time.now > bulletTime) {
  //     //  Grab the first bullet we can from the pool
  //     bullet = bullets.getFirstExists(false);

  //     if (bullet) {
  //       //  And fire it
  //       bullet.reset(player.x, player.y + 8 * scale);
  //       bullet.body.velocity.y = -400 * scale;
  //       bulletTime = game.time.now + 200 * scale;
  //     }
  //   }
  // };

  // resetBullet = bullet => {
  //   //  Called if the bullet goes out of the screen
  //   bullet.kill();
  // };

  // restart = () => {
  //   const { lives, aliens, createAliens, player } = this;
  //   //  A new level starts

  //   //resets the life count
  //   lives.callAll('revive');
  //   //  And brings the aliens back from the dead :)
  //   aliens.removeAll();
  //   createAliens();

  //   //revives the player
  //   player.revive();
  //   //hides the text
  //   // stateText.visible = false;
  // };

  // cycleNode = node => {
  //   const half = node.width / 2;
  //   if (node.x < -half) {
  //     node.x = this.width + half;
  //   } else if (node.x > this.width + half) {
  //     node.x = -half;
  //   }
  // };

  update = () => {
    // Update the cursor position.
    //
    // It's important to understand that screen-to-isometric projection means
    // you have to specify a z position manually, as this cannot be easily
    // determined from the 2D pointer position without extra trickery.
    //
    // By default, the z position is 0 if not set.
    this.game.iso.unproject(
      this.game.input.activePointer.position,
      this.cursorPos,
    );

    // Loop through all tiles
    this.groundGroup.forEach(t => {
      const tile = t;
      const x = tile.isoX / State.size;
      const y = tile.isoY / State.size;
      const inBounds = tile.isoBounds.containsXY(
        this.cursorPos.x,
        this.cursorPos.y,
      );

      // Test to see if the 3D position from above intersects
      // with the automatically generated IsoSprite tile bounds.
      if (!tile.selected && inBounds && !this.water.includes(tile)) {
        // If it does, do a little animation and tint change.
        tile.selected = true;
        if (!tile.inPath) {
          tile.tint = 0x86bfda;
        }
        this.game.add.tween(tile).to(
          {
            isoZ: tile.initialZ + 4,
          },
          200,
          Phaser.Easing.Quadratic.InOut,
          true,
        );
      } else if (tile.selected && !inBounds) {
        // If not, revert back to how it was.
        tile.selected = false;
        if (!tile.inPath) {
          tile.tint = 0xffffff;
        }
        this.game.add.tween(tile).to(
          {
            isoZ: tile.initialZ + 0,
          },
          200,
          Phaser.Easing.Quadratic.InOut,
          true,
        );
      }

      if (!this.finding && this.game.input.activePointer.isDown && inBounds) {
        // Start path finding
        this.finding = true;
        const dp = this.dudePosition();
        this.easystar.findPath(dp.x, dp.y, x, y, this.processPath.bind(this));
        this.easystar.calculate();
      }
    });

    this.water.forEach(w => {
      const waterTile = w;
      waterTile.isoZ =
        waterTile.initialZ +
        -2 * Math.sin((this.game.time.now + waterTile.isoX * 7) * 0.004) +
        -1 * Math.sin((this.game.time.now + waterTile.isoY * 8) * 0.005);
      waterTile.alpha = Phaser.Math.clamp(1 + waterTile.isoZ * 0.1, 0.2, 1);
    });

    if (this.isMoving) {
      this.move();
    }

    this.game.iso.simpleSort(this.objectGroup);

    //   const {
    //     starfield,
    //     player,
    //     game,
    //     firingTimer,
    //     bullets,
    //     aliens,
    //     collisionHandler,
    //     enemyBullets,
    //     enemyHitsPlayer,
    //   } = this;
    //   //  Scroll the background
    //   if (starfield.tilePosition) {
    //     starfield.tilePosition.y += 2;
    //   }
    //   if (player.alive) {
    //     //  Firing?
    //     if (game.time.now > firingTimer) {
    //       this.enemyFires();
    //     }
    //     this.cycleNode(player);
    //     if (this.aliens.y >= player.y && this.lives.countLiving() > 0) {
    //       player.kill();
    //       this.enemyBullets.callAll('kill');
    //       // this.stateText.text=" GAME OVER \n Click to restart";
    //       // this.stateText.visible = true;
    //       //the "click to restart" handler
    //       game.input.onTap.addOnce(this.restart, this);
    //     }
    //     //  Run collision
    //     game.physics.arcade.overlap(
    //       bullets,
    //       aliens,
    //       collisionHandler,
    //       null,
    //       this
    //     );
    //     game.physics.arcade.overlap(
    //       enemyBullets,
    //       player,
    //       enemyHitsPlayer,
    //       null,
    //       this
    //     );
    //   }
  };

  processPath(path) {
    this.finding = false;
    if (!path || path.length === 0) {
      return;
    }

    // Keep moving if already moving towards same direction;
    if (
      this.isMoving &&
      this.pathIndex < this.path.length &&
      path.length > 1 &&
      this.path[this.pathIndex].x === path[1].x &&
      this.path[this.pathIndex].y === path[1].y
    ) {
      this.pathIndex = 1;
    } else {
      this.pathIndex = 0;
    }

    this.isMoving = true;

    // Loop tiles
    this.groundGroup.forEach(t => {
      const tile = t;
      if (tile.inPath) {
        // Clear tint from previous path
        tile.tint = 0xffffff;
      }
      const x = tile.isoX / State.size;
      const y = tile.isoY / State.size;
      const inPath = path.some(point => point.x === x && point.y === y);
      if (inPath) {
        tile.tint = 0xaa3333;
        tile.inPath = true;
      } else {
        tile.inPath = false;
      }
    });
    this.path = path;
  }

  dudePosition() {
    return {
      x: Math.round(this.dude.x / State.size + 0.5),
      y: Math.round(this.dude.y / State.size + 0.5),
    };
  }

  move() {
    if (!this.path || this.pathIndex === this.path.length) {
      // No path or finished moving
      this.isMoving = false;
      this.path = null;
      this.dude.stop();
      return;
    }
    const target = this.path[this.pathIndex];
    const x = this.dude.x + State.size / 2 - target.x * State.size;
    const y = this.dude.y + State.size / 2 - target.y * State.size;
    if (x === 0 && y === 0) {
      // Reached next tile
      this.pathIndex += 1;
    } else if (x < 0 && y === 0) {
      this.dude.x += 1;
      this.dude.play('walkFrontLeft');
    } else if (x > 0 && y === 0) {
      this.dude.x -= 1;
      this.dude.play('walkBackLeft');
    } else if (x === 0 && y < 0) {
      this.dude.y += 1;
      this.dude.play('walkFrontRight');
    } else if (x === 0 && y > 0) {
      this.dude.y -= 1;
      this.dude.play('walkBackRight');
    }
  }
}

export default State;
