import {
  FRAME_TIME_MS,
  IDisplayRenderer,
  PROGRAM_START_ADDRESS,
} from "./constants";
import Cpu from "./cpu";
import DisplayBuffer from "./displayBuffer";
import Memory from "./memory";
import DisplayRenderer from "./displayRenderer";
import Logger from "./logger";
import SoundPlayer from "./soundPlayer";
import Input from "./Input";
import EventsManager, { EVENTS } from "./eventManager";

class Emulator {
  private memory: Memory;
  private cpu: Cpu;
  private displayBuffer: DisplayBuffer;
  private displayRenderer: IDisplayRenderer;
  private lastCycleTime = 0;
  private logger = Logger.getInstance("Emulator");

  constructor(rom: Uint8Array) {
    this.logger.log("Emulator created");
    this.memory = new Memory();
    this.displayBuffer = new DisplayBuffer();

    const canvas = document.getElementById("screen") as HTMLCanvasElement;
    this.displayRenderer = new DisplayRenderer(canvas.getContext("2d")!);

    this.cpu = new Cpu(
      this.memory,
      this.displayBuffer,
      this.displayRenderer,
      new SoundPlayer(),
      new Input()
    );

    this.initProgram(rom);
  }

  run() {
    const now = Date.now();
    if (now - this.lastCycleTime >= FRAME_TIME_MS) {
      this.lastCycleTime = now;
      this.cpu.executeCycle();
    }
  }

  getEmulatorState() {
    return {
      memory: this.memory.getState(),
      cpu: this.cpu.getState(),
    };
  }

  private initProgram(rom: Uint8Array) {
    this.loadProgram(rom);
    EventsManager.getInstance().publish(EVENTS.PROGRAM_LOADED, null);
  }

  private loadProgram(program: Uint8Array) {
    this.logger.log("Loading program...");
    for (let i = 0; i < program.length; i++) {
      const address = i + PROGRAM_START_ADDRESS;
      this.memory.setMemory(address, program[i]);
    }
  }
}

export default Emulator;
