export const FPS = 700;
export const MILLISECONDS_IN_A_SECOND = 1000;
export const FRAME_TIME_MS = MILLISECONDS_IN_A_SECOND / FPS;

export const FONT_START_ADDRESS = 0x50;

// prettier-ignore
export const FONT_SET = [
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80  // F
];

export const PROGRAM_START_ADDRESS = 0x200;
export const MEMORY_SIZE = 0x1000;

export const INSTRUCTION_BYTES = 2;

export const SCREEN_WIDTH = 64;
export const SCREEN_HEIGHT = 32;
export const SCALE_FACTOR = 10;
export const SPRITE_WIDTH = 8;
export const PIXEL_COLOR = "#b4e5af";

type ON = 1;
type OFF = 0;

export type PixelState = ON | OFF;

export interface IDisplayRenderer {
  drawScreen(pixelState: Array<Array<PixelState>>): void;
}

export interface ISoundInterface {
  play(): void;
  stop(): void;
}

export type KeyState = true | false;

