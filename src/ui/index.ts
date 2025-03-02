import Emulator from "../emulator";
import EventsManager, { EVENTS } from "../eventManager";

class UI {
  private readonly emulator: Emulator;

  constructor(emulator: Emulator, currentProgram: string) {
    console.log("UI class initialized");
    this.emulator = emulator;
    this.init();
    this.setProgramOptions(currentProgram);
    this.loadProgramHandler();
  }

  get memoryUIElement() {
    return document.getElementById("memory") as HTMLDivElement;
  }

  get registerUIElement() {
    return document.getElementById("registers") as HTMLDivElement;
  }

  get selectProgramElement() {
    return document.getElementById("select-program") as HTMLSelectElement;
  }

  get loadProgramButtonElement() {
    return document.getElementById("load-program") as HTMLButtonElement;
  }

  get toggleDebuggerButtonElement() {
    return document.getElementById("toggle-debugger") as HTMLButtonElement;
  }

  get stepButtonElement() {
    return document.getElementById("step") as HTMLButtonElement;
  }

  get continueProgramButtonElement() {
    return document.getElementById("continue") as HTMLButtonElement;
  }

  handleRegisterUpdate() {
    let html = `
      <div class="row">
          <div>Register values</div>
      </div>
      <div class="row">
          <div>Name</div>
          <div>Values</div>
      </div>
    `;

    const register = this.emulator.getEmulatorState().cpu.registers;
    for (let r = 0; r < register.length; r++) {
      const valueAs4ByteHex = register[r].toString(16).padStart(8, "0");
      const element = `
        <div class="row">
            <div title="${register[r]}">V${r}</div>
            <div title="${register[r]}">0x${valueAs4ByteHex}</div>
        </div>
      `;

      html += element;
    }

    this.registerUIElement.innerHTML = html;
  }

  printMemory() {
    let html = `
      <div class="memory-heading">Memory</div>
    `;
    // const offSet = 0x200;
    const offSet = 0x0;

    const memory = this.emulator.getEmulatorState().memory.memory;
    const pc = this.emulator.getEmulatorState().cpu.PC;

    for (let i = 0; i < memory.length; i += 2) {
      const twoBytesAddress = (i + offSet).toString(16).padStart(4, "0");
      const opcode = ((memory[i + offSet] << 8) | memory[i + offSet + 1])
        .toString(16)
        .padStart(4, "0");

      const element = `
        <div id="p${twoBytesAddress}" class="${
        pc === i + offSet ? "current-pc" : ""
      }">
          <span class="address">${twoBytesAddress}</span>
          <span class="opcode">0x${opcode}</span>
        </div>
      `;

      html += element;
    }
    this.memoryUIElement.innerHTML = html;
  }

  handlePCUpdate() {
    const pc = this.emulator.getEmulatorState().cpu.PC;

    const pc4ByteString = pc.toString(16).padStart(4, "0");
    const pcElement = document.getElementById(`p${pc4ByteString}`);
    if (pcElement) {
      const activeElement = document.querySelector(".current-pc");
      if (activeElement) {
        activeElement.classList.remove("current-pc");
      }
      pcElement.classList.add("current-pc");
      // Scroll to the current program counter
      pcElement.scrollIntoView({
        behavior: "instant",
        block: "center",
        inline: "center",
      });
    }
  }

  setProgramOptions(selectedProgram: string) {
    const selectElement = this.selectProgramElement;
    const roms = [
      "BLINKY",
      "CAVE",
      "IBM_LOGO",
      "INVADERS",
      "MAZE",
      "OUTLAW",
      "PONG",
      "TANK",
      "TETRIS",
    ];

    for (const rom of roms) {
      const option = document.createElement("option");
      option.value = rom;
      option.text = rom;
      selectElement.add(option);
    }

    selectElement.value = selectedProgram;
  }

  loadProgramHandler() {
    const loadButton = this.loadProgramButtonElement;
    loadButton.addEventListener("click", () => {
      const rom = this.selectProgramElement.value;
      window.location.href = `?rom=${rom}`;
    });
  }

  private init() {
    const eventsManager = EventsManager.getInstance();
    const EVENTS_HANDLER = {
      [EVENTS.REGISTER_UPDATED]: this.handleRegisterUpdate.bind(this),
      [EVENTS.PROGRAM_COUNTER_UPDATED]: this.handlePCUpdate.bind(this),
      [EVENTS.PROGRAM_LOADED]: this.printMemory.bind(this),
    };

    for (const event in EVENTS_HANDLER) {
      eventsManager.subscribe(event, EVENTS_HANDLER[event]);
    }
  }
}

export default UI;
