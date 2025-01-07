import EventsManager, { EVENTS } from "./eventManager";

const FONT_START_ADDRESS = 0x50;

// prettier-ignore
const FONT_SET = [
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

const PROGRAM_START_ADDRESS = 0x200;

class Memory {
  private _memory = new Uint8Array(0x1000); // 4KB memory
  private eventManager: EventsManager;

  constructor() {
    this.eventManager = EventsManager.getInstance();
    this.loadFontSet();
  }

  get memory() {
    return this._memory as Readonly<Uint8Array>;
  }

  setMemory(address: number, value: number) {
    if (address < 0 || address > 0xfff) {
      throw new Error("Memory address out of bounds");
    }

    this._memory[address] = value;
    this.eventManager.publish(EVENTS.MEMORY_UPDATED, this._memory);
  }

  private loadFontSet() {
    for (let i = 0; i < FONT_SET.length; i++) {
      this._memory[FONT_START_ADDRESS + i] = FONT_SET[i];
    }
    this.eventManager.publish(EVENTS.MEMORY_UPDATED, this._memory);
  }

  loadProgram(program: Uint8Array, programOffset = PROGRAM_START_ADDRESS) {
    for (let i = 0; i < program.length; i++) {
      const address = i + programOffset;
      this._memory[address] = program[i];
    }
    this.eventManager.publish(EVENTS.MEMORY_UPDATED, this._memory);
  }
}

const RAM = new Memory();
export default RAM;
