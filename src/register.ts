import EventsManager, { EVENTS } from "./eventManager";

class Register {
  private readonly _V = new Uint8Array(16); // registers
  private _PC = 0; // program counter
  private _I = 0; // index register
  private eventManager: EventsManager;

  constructor() {
    this.eventManager = EventsManager.getInstance();
  }

  get V() {
    return this._V as Readonly<Uint8Array>;
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

  get I() {
    return this._I;
  }

  set I(value: number) {
    this._I = value;

    this.eventManager.publish(EVENTS.INDEX_REGISTER_UPDATED, this._I);
  }
}

const register = new Register();
export default register;
