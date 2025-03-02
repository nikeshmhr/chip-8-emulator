import {
  FONT_SET,
  FONT_START_ADDRESS,
  IDisplayRenderer,
  ISoundInterface,
  PROGRAM_START_ADDRESS,
} from "./constants";
import DisplayBuffer from "./displayBuffer";
import EventsManager, { EVENTS } from "./eventManager";
import Input from "./Input";
import { StateableRetrievable } from "./interface";
import Logger from "./logger";
import Memory from "./memory";

interface IDecodeInstruction {
  x: number;
  y: number;
  n: number;
  nn: number;
  nnn: number;
  instructionSet: number;
}

class Cpu implements StateableRetrievable {
  private readonly V = new Uint8Array(16); // registers
  private PC = PROGRAM_START_ADDRESS; // program counter
  private I = 0; // index register
  private logger = Logger.getInstance("Cpu");
  private delayTimer = 0;
  private soundTimer = 0;

  constructor(
    private readonly memory: Memory,
    private readonly displayBuffer: DisplayBuffer,
    private readonly displayRenderer: IDisplayRenderer,
    private readonly soundInterface: ISoundInterface,
    private readonly keyInput: Input
  ) {
    this.loadFontSet();
    this.startTimers();
  }

  getState() {
    return {
      registers: this.V,
      PC: this.PC,
      I: this.I,
      delayTimer: this.delayTimer,
      soundTimer: this.soundTimer,
    };
  }

  private loadFontSet() {
    this.logger.log("Loading font set...");
    for (let i = 0; i < FONT_SET.length; i++) {
      const address = i + FONT_START_ADDRESS;
      this.memory.setMemory(address, FONT_SET[i]);
    }
    this.logger.log("Font set loaded");
  }

  private startTimers() {
    setInterval(() => {
      if (this.delayTimer > 0) {
        this.delayTimer--;
      }
      if (this.soundTimer > 0) {
        console.log("BEEP");
        this.soundInterface.beep();
        this.soundTimer--;
      }
    }, 1000 / 60);
  }

  private setPC(pc: number) {
    const previousPC = this.PC;
    this.PC = pc;
    // only publish the event if the value is different
    if (previousPC !== this.PC) {
      EventsManager.getInstance().publish(
        EVENTS.PROGRAM_COUNTER_UPDATED,
        this.PC
      );
    }
  }

  private setRegisterValue(register: number, value: number) {
    const prevRegisterValue = this.V[register];
    this.V[register] = value;
    if (prevRegisterValue !== value) {
      this.V[register] = value;
      EventsManager.getInstance().publish(EVENTS.REGISTER_UPDATED, {
        register,
        value,
      });
    }
  }

  private fetchInstruction(): number {
    // Read two bytes starting from the program counter
    const opcode =
      (this.memory.memory[this.PC] << 8) | this.memory.memory[this.PC + 1];
    this.setPC(this.PC + 2);
    return opcode;
  }

  private decodeInstruction(opcode: number): IDecodeInstruction {
    return {
      x: (opcode & 0x0f00) >> 8, // refers to register Vx
      y: (opcode & 0x00f0) >> 4, // refers to register Vy
      n: opcode & 0x000f, // refers to nibble
      nn: opcode & 0x00ff, // refers to byte
      nnn: opcode & 0x0fff, // refers to address on memory
      instructionSet: opcode & 0xf000, // refers to instruction type
    };
  }

  private executeInstruction(opcode: number, decodedInst: IDecodeInstruction) {
    const { x, y, n, nn, nnn, instructionSet } = decodedInst;

    switch (instructionSet) {
      case 0x0000:
        // clear screen
        switch (nn) {
          case 0xe0:
            this.displayBuffer.clear();
            this.displayRenderer.drawScreen(this.displayBuffer.pixelData);
            break;

          // 0x00EE (return from subroutine)
          case 0xee:
            const stackValue = this.memory.popStack();
            this.setPC(stackValue);
            break;

          default:
            throw new Error(
              `Unknown opcode: ${opcode.toString(16).padStart(4, "0")}`
            );
        }
        break;

      // 1NNN (jump)
      case 0x1000:
        this.setPC(nnn);
        break;

      // 6XNN (set register VX to nn)
      case 0x6000:
        this.setRegisterValue(x, nn);
        break;

      // 7XNN (add NN value to register VX)
      case 0x7000:
        this.setRegisterValue(x, this.V[x] + nn);
        break;

      // ANNN (set index register I to NNN)
      case 0xa000:
        this.I = nnn;
        break;

      // DXYN (display/draw)
      case 0xd000: {
        const height = n;
        const xCord = this.V[x];
        const yCord = this.V[y];
        this.setRegisterValue(0xf, 0);
        const spriteData = new Uint8Array(height);
        for (let i = 0; i < height; i++) {
          spriteData[i] = this.memory.memory[this.I + i];
        }

        const hasCollision = this.displayBuffer.write(xCord, yCord, spriteData);
        this.setRegisterValue(0xf, hasCollision ? 1 : 0);
        this.displayRenderer.drawScreen(this.displayBuffer.pixelData);
        break;
      }

      // 3XNN (skip next instruction if VX equals NN)
      case 0x3000:
        if (this.V[x] === nn) {
          this.setPC(this.PC + 2);
        }
        break;

      // 5XY0 (skip next instruction if VX equals VY)
      case 0x5000:
        if (this.V[x] === this.V[y]) {
          this.setPC(this.PC + 2);
        }
        break;

      // 4XNN (skip next instruction if VX does not equal NN)
      case 0x4000:
        if (this.V[x] !== nn) {
          this.setPC(this.PC + 2);
        }
        break;

      // 8XYN (arithmetic)
      case 0x8000:
        switch (n) {
          // 8XY0 (sets VX to the value of VY)
          case 0x0:
            this.setRegisterValue(x, this.V[y]);
            break;

          // 8XY1 (sets VX to VX OR VY)
          case 0x1:
            this.setRegisterValue(x, this.V[x] | this.V[y]);
            break;

          // 8XY2 (sets VX to VX AND VY)
          case 0x2:
            this.setRegisterValue(x, this.V[x] & this.V[y]);
            break;

          // 8XY3 (sets VX to VX XOR VY)
          case 0x3:
            this.setRegisterValue(x, this.V[x] ^ this.V[y]);
            break;

          // 8XY4 (add VY to VX, VF is set to 1 if there is a carry)
          case 0x4:
            this.setRegisterValue(0xf, this.V[x] + this.V[y] > 255 ? 1 : 0);
            this.setRegisterValue(x, this.V[x] + this.V[y]);
            break;

          // 8XY5 (sets VX to the result of VX - VY)
          case 0x5:
            this.setRegisterValue(0xf, this.V[x] > this.V[y] ? 1 : 0);
            this.setRegisterValue(x, this.V[x] - this.V[y]);
            break;

          // 8XY7 (sets VX to VY - VX)
          case 0x7:
            this.setRegisterValue(0xf, this.V[x] > this.V[y] ? 1 : 0);
            this.setRegisterValue(x, this.V[y] - this.V[x]);
            break;

          // 8XY6 (VX is set to VY, then shifts right by one, VF is set to the value of the least significant bit of VX before the shift)
          case 0x6:
            this.setRegisterValue(x, this.V[y]);
            this.setRegisterValue(0xf, this.V[x] >> 7);
            this.setRegisterValue(x, this.V[x] >> 1);
            break;

          // 8XYE (VX is set to VY, then shifts VX left by one, VF is set to the value of the most significant bit of VX before the shift)
          case 0xe:
            this.setRegisterValue(x, this.V[y]);
            this.setRegisterValue(0xf, this.V[x] >> 7);
            this.setRegisterValue(x, this.V[x] << 1);
            break;

          default:
            throw new Error(`Unknown opcode: ${opcode.toString(16)}`);
        }
        break;

      case 0xf000:
        switch (nn) {
          // FX29 (font character) -  I is set to the address of the hexadecimal character in VX
          case 0x29:
            const fontValue = this.V[x];
            const fontAddress = FONT_START_ADDRESS + fontValue * 5; // each font is represented by 5 bytes
            this.I = this.memory.memory[fontAddress];
            break;

          // FX55 (store registers) - store V0 to VX in memory starting at address I
          case 0x55: {
            for (let i = 0; i <= x; i++) {
              this.memory.setMemory(this.I + i, this.V[i]);
            }
            this.I = this.I + x + 1;

            break;
          }

          // FX65 (load registers) - load V0 to VX (if X is 0, then only V0) from memory starting at address I
          case 0x65: {
            for (let i = 0; i <= x; i++) {
              this.setRegisterValue(i, this.memory.memory[this.I + i]);
            }
            this.I = this.I + x + 1;
            break;
          }

          // FX33 (binary-coded decimal conversion)
          case 0x33: {
            const value = this.V[x];
            this.memory.setMemory(this.I, Math.floor(value / 100));
            this.memory.setMemory(this.I + 1, Math.floor((value % 100) / 10));
            this.memory.setMemory(this.I + 2, value % 10);
            break;
          }

          // FX1E (add register VX to I)
          case 0x1e:
            this.I += this.V[x];
            break;

          // FX15 (set delay timer to VX)
          case 0x15:
            this.delayTimer = this.V[x];
            break;

          // FX07 (set VX to the value of the delay timer)
          case 0x07:
            this.setRegisterValue(x, this.delayTimer);
            break;

          // FX18 (set sound timer to VX)
          case 0x18:
            console.log("timer set");
            this.soundTimer = this.V[x];
            break;

          // FX0A (wait for key press, store key in VX)
          case 0x0a:
            let keyPressed = false;
            for (let i = 0; i < this.keyInput.key.length; i++) {
              if (this.keyInput.key[i] === true) {
                this.setRegisterValue(x, i);
                keyPressed = true;
                break;
              }
            }

            if (!keyPressed) {
              this.setPC(this.PC - 2);
            }
            break;

          default:
            throw new Error(`Unknown opcode: ${opcode.toString(16)}`);
        }
        break;

      // 9XY0 (skip next instruction if VX does not equal VY)
      case 0x9000:
        if (this.V[x] !== this.V[y]) {
          this.setPC(this.PC + 2);
        }
        break;

      // 2NNN (call subroutine)
      case 0x2000:
        this.memory.pushStack(this.PC);
        this.setPC(nnn);
        break;

      // BNNN (jump with offset)
      case 0xb000:
        this.setPC(nnn + this.V[0]);
        break;

      // CXNN (set VX to a random number AND NN)
      case 0xc000:
        this.setRegisterValue(x, Math.floor(Math.random() * 0xff) & nn);
        break;

      // EXXX (keyboard operations)
      case 0xe000:
        switch (nn) {
          // EXA1 (skip next instruction if key stored in VX is not pressed)
          case 0xa1:
            if (this.keyInput.key[this.V[x]] === false) {
              this.setPC(this.PC + 2);
            }
            break;

          // EX9E (skip next instruction if key stored in VX is pressed)
          case 0x9e:
            if (this.keyInput.key[this.V[x]] === true) {
              this.setPC(this.PC + 2);
            }
            break;

          default:
            throw new Error(`Unknown opcode: ${opcode.toString(16)}`);
        }
        break;

      default:
        const errMsg = `Unknown opcode: ${opcode.toString(16)}`;
        this.logger.error(errMsg);
        throw new Error(errMsg);
    }
  }

  executeCycle() {
    const opcode = this.fetchInstruction();
    const decodedInst = this.decodeInstruction(opcode);
    this.executeInstruction(opcode, decodedInst);
  }
}

export default Cpu;
