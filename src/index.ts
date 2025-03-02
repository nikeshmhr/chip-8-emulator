import Emulator from "./emulator";
import EventsManager, { EVENTS } from "./eventManager";

window.addEventListener("DOMContentLoaded", async () => {
  const rom = await fetch("/rom/CAVE").then((response) =>
    response.arrayBuffer()
  );
  const emulator = new Emulator(new Uint8Array(rom));

  const eventsManager = EventsManager.getInstance();
  const EVENTS_HANDLER = {
    [EVENTS.REGISTER_UPDATED]: handleRegisterUpdate,
    [EVENTS.PROGRAM_COUNTER_UPDATED]: handlePCUpdate,
    [EVENTS.PROGRAM_LOADED]: printMemory,
  };

  for (const event in EVENTS_HANDLER) {
    eventsManager.subscribe(event, EVENTS_HANDLER[event]);
  }

  const registerUIElement = document.getElementById(
    "registers"
  ) as HTMLDivElement;
  const memoryUIElement = document.getElementById("memory") as HTMLDivElement;

  printMemory();

  function handleRegisterUpdate() {
    let html = `
      <div class="row">
          <div>Register values</div>
      </div>
      <div class="row">
          <div>Name</div>
          <div>Values</div>
      </div>
    `;

    const register = emulator.getEmulatorState().cpu.registers;
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

    registerUIElement.innerHTML = html;
  }

  function printMemory() {
    let html = `
      <div class="memory-heading">Memory</div>
    `;
    // const offSet = 0x200;
    const offSet = 0x0;

    const memory = emulator.getEmulatorState().memory.memory;
    const pc = emulator.getEmulatorState().cpu.PC;

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
    memoryUIElement.innerHTML = html;
  }

  function handlePCUpdate() {
    const pc = emulator.getEmulatorState().cpu.PC;

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

  // Start the emulator loop make sure to use requestAnimationFrame
  function mainLoop() {
    emulator.run();
    requestAnimationFrame(mainLoop);
  }

  mainLoop();
});
