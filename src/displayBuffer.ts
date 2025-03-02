import {
  PixelState,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  SPRITE_WIDTH,
} from "./constants";
import Logger from "./logger";

class DisplayBuffer {
  private pixelState: Array<Array<PixelState>> = [[]];
  private logger = Logger.getInstance("DisplayBuffer");

  constructor() {
    this.pixelState = new Array(SCREEN_HEIGHT)
      .fill(0)
      .map(() => new Array(SCREEN_WIDTH).fill(0));
  }

  clear() {
    for (let i = 0; i < SCREEN_HEIGHT; i++) {
      for (let j = 0; j < SCREEN_WIDTH; j++) {
        this.pixelState[i][j] = 0;
      }
    }
  }

  // updates the pixel state
  write(x: number, y: number, sprite: Uint8Array): boolean {
    let collision = false;

    try {
      // draw screen logic from left to right, top to down
      for (let i = 0; i < sprite.length; i++) {
        // column/height
        const spriteData = sprite[i];
        for (let j = 0; j < SPRITE_WIDTH; j++) {
          // row/width
          const pixel = (spriteData >> (7 - j)) & 0x1;
          const xCord = (x + j) % SCREEN_WIDTH;
          const yCord = (y + i) % SCREEN_HEIGHT;

          // If the pixel we want to turn on is already on, set collision to true
          if (this.pixelState[yCord][xCord] === 1 && pixel === 1) {
            collision = true;
          }
          this.pixelState[yCord][xCord] ^= pixel; // XOR drawing mode
        }
      }
    } catch (error) {
      this.logger.error(error);
    }

    return collision;
  }

  get pixelData() {
    return this.pixelState;
  }
}

export default DisplayBuffer;
