import EventsManager, { EVENTS } from "./eventManager";

class Register {
  private _V = new Uint8Array(16); // registers
  private _PC = 0x200; // program counter
  private eventManager: EventsManager;

  constructor() {
    this.eventManager = EventsManager.getInstance();
  }

  get V() {
    return this._V;
  }

  setRegister(register: number, value: number) {
    this._V[register] = value;
    this.eventManager.publish(EVENTS.REGISTER_UPDATED, this._V);
  }

  get pc() {
    return this._PC;
  }

  set pc(value: number) {
    const previousPC = this._PC;
    this._PC = value;

    // only publish the event if the value is different
    if (previousPC !== this._PC)
      this.eventManager.publish(EVENTS.PROGRAM_COUNTER_UPDATED, this._PC);
  }
}

const register = new Register();
export default register;
