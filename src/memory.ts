import { MEMORY_SIZE } from "./constants";
import EventsManager, { EVENTS } from "./eventManager";
import { StateableRetrievable } from "./interface";

class Memory implements StateableRetrievable {
  private _memory = new Uint8Array(MEMORY_SIZE); // 4KB memory
  private _stack: number[]; // 16 levels of stack

  constructor() {
    this._stack = [];
  }

  getState() {
    return {
      memory: this._memory,
      stack: this._stack,
    };
  }

  get memory() {
    return this._memory as Readonly<Uint8Array>;
  }

  setMemory(address: number, value: number) {
    if (address < 0 || address > this._memory.length) {
      throw new Error("Memory address out of bounds");
    }

    this._memory[address] = value;
    EventsManager.getInstance().publish(EVENTS.REGISTER_UPDATED, this.memory);
  }

  pushStack(value: number) {
    this._stack.push(value);
  }

  popStack(): number {
    if (this._stack.length === 0) {
      throw new Error("Stack is empty");
    }

    return this._stack.pop()!;
  }
}

export default Memory;
