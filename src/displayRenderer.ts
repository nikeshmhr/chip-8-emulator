import {
  IDisplayRenderer,
  PIXEL_COLOR,
  PixelState,
  SCALE_FACTOR,
} from "./constants";

class DisplayRenderer implements IDisplayRenderer {
  constructor(private context: CanvasRenderingContext2D) {}

  private fillRect(x: number, y: number, width: number, height: number): void {
    this.context.fillStyle = PIXEL_COLOR;
    this.context.fillRect(x, y, width, height);
  }

  private clearRect(x: number, y: number, width: number, height: number): void {
    this.context.clearRect(x, y, width, height);
  }

  drawScreen(pixelState: Array<Array<PixelState>>) {
    const width = pixelState[0].length * SCALE_FACTOR;
    const height = pixelState.length * SCALE_FACTOR;
    this.clearRect(0, 0, width, height);

    // Draw pixels from left to right top to down
    for (let row = 0; row < pixelState.length; row++) {
      for (let col = 0; col < pixelState[row].length; col++) {
        // Since we've already cleared the screen, we only need to draw the pixels that are on
        if (pixelState[row][col] === 1) {
          this.fillRect(
            col * SCALE_FACTOR,
            row * SCALE_FACTOR,
            SCALE_FACTOR,
            SCALE_FACTOR
          );
        }
      }
    }
  }
}

export default DisplayRenderer;
