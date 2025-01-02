import EventsManager, { EVENTS } from "./eventManager";
import register from "./register";
import IBMLogo from "./rom/ibm-logo";

const eventsManager = EventsManager.getInstance();

(async () => {
  const SCALE = 10;

  const UNIT = 1;
  const WIDTH = 64 * SCALE;
  const HEIGHT = 32 * SCALE;

  const COLORS = {
    ON: "#b4e5af",
    OFF: "#000000",
    GRID_OUTLINE: "#ffffff33",
  };

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvas.id = "screen";
  document.getElementById("container")!.appendChild(canvas);

  const registerUIElement = document.getElementById(
    "registers"
  ) as HTMLDivElement;

  const memoryUIElement = document.getElementById("memory") as HTMLDivElement;
  memoryUIElement.style.height = `${HEIGHT}px`;

  const EVENTS_HANDLER = {
    [EVENTS.REGISTER_UPDATED]: handleRegisterUpdate,
    [EVENTS.PROGRAM_COUNTER_UPDATED]: handlePCUpdate,
  };

  for (const event in EVENTS_HANDLER) {
    eventsManager.subscribe(event, EVENTS_HANDLER[event]);
  }

  const ctx = canvas.getContext("2d")!;
  if (!ctx) {
    throw new Error("2d context not supported");
  }
  const DEBUG = true;
  let lastPaintTime = 0;

  const pixelState = new Array(WIDTH * HEIGHT).fill(0);
  const memory = new Uint8Array(4096);
  // const V = new Uint8Array(16); // registers
  const REGISTER = register;
  let I = 0; // index register
  // let pc = 0x200;

  loadProgram();
  printMemory();
  handleRegisterUpdate();

  let running = true;
  await sleep(500);

  setGrid();

  loop();

  async function loop() {
    if (running) {
      const now = Date.now();
      // if (lastPaintTime < now - 1000 / 60) {
      lastPaintTime = now;

      const opcode = (memory[REGISTER.pc] << 8) | memory[REGISTER.pc + 1];

      switch (opcode & 0xf000) {
        case 0x0000:
          if ((opcode & 0x0fff) == 0x00e0) {
            clearScreen();
            REGISTER.pc += 2;
          }
          break;

        case 0x1000:
          REGISTER.pc = opcode & 0x0fff;
          break;

        case 0x6000:
          const register = (opcode & 0x0f00) >> 8;
          const value = opcode & 0x00ff;
          REGISTER.setRegister(register, value);
          REGISTER.pc += 2;
          break;

        case 0x7000:
          const r = (opcode & 0x0f00) >> 8;
          const val = opcode & 0x00ff;
          REGISTER.setRegister(r, REGISTER.V[r] + val);
          REGISTER.pc += 2;
          break;

        case 0xa000:
          const v = opcode & 0x0fff;
          I = v;
          REGISTER.pc += 2;
          break;

        case 0xd000:
          const height = opcode & 0x000f;
          const x = REGISTER.V[(opcode & 0x0f00) >> 8];
          const y = REGISTER.V[(opcode & 0x00f0) >> 4];
          REGISTER.setRegister(0xf, 0);
          for (let i = 0; i < height; i++) {
            const spriteData = memory[I + i];
            for (let j = 0; j < 8; j++) {
              const pixel = (spriteData >> (7 - j)) & 0x1;
              const pixelIndex = c2p(x + j, y + i);
              if (pixelState[pixelIndex] === 1 && pixel === 1) {
                REGISTER.setRegister(0xf, 1);
              }
              pixelState[pixelIndex] = pixelState[pixelIndex] ^ pixel;
            }
          }
          drawScreen();
          REGISTER.pc += 2;
          break;

        default:
          console.error(`Unknown opcode: ${opcode.toString(16)}`);
          running = false;
      }
      // }

      await sleep(500);
    }
    requestAnimationFrame(loop);
  }

  function drawScreen() {
    for (let i = 0; i < pixelState.length; i++) {
      const [x, y] = p2c(i);

      ctx.fillStyle = pixelState[i] === 1 ? COLORS.ON : COLORS.OFF;
      ctx.fillRect(x * SCALE, y * SCALE, UNIT * SCALE, UNIT * SCALE);
    }
    DEBUG && setGrid();
  }

  // pixelIndex to coordinate
  function p2c(pixelIndex: number): [number, number] {
    return [pixelIndex % WIDTH, Math.floor(pixelIndex / WIDTH)];
  }

  // coordinate to pixelIndex
  function c2p(x: number, y: number): number {
    return y * WIDTH + x;
  }

  function clearScreen() {
    pixelState.fill(0);
    drawScreen();
    DEBUG && setGrid();
  }

  function loadProgram() {
    const program = IBMLogo;
    for (let i = 0; i < program.length; i++) {
      memory[i + 512] = program[i];
    }
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Sets the canvas background to grid
  function setGrid() {
    ctx.fillStyle = COLORS.GRID_OUTLINE;
    for (let x = 0; x < WIDTH; x += SCALE) {
      ctx.fillRect(x, 0, UNIT, HEIGHT);
    }
    for (let y = 0; y < HEIGHT; y += SCALE) {
      ctx.fillRect(0, y, WIDTH, UNIT);
    }
  }

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

    for (let r = 0; r < REGISTER.V.length; r++) {
      const valueAs4ByteHex = REGISTER.V[r].toString(16).padStart(8, "0");
      const element = `
        <div class="row">
            <div title="${REGISTER.V[r]}">V${r}</div>
            <div title="${REGISTER.V[r]}">0x${valueAs4ByteHex}</div>
        </div>
      `;

      html += element;
    }

    registerUIElement.innerHTML = html;
  }

  function printMemory() {
    // const programLength = IBMLogo.length;
    let html = `
      <div class="memory-heading">Memory</div>
    `;
    // const offSet = 0x200;
    const offSet = 0x0;

    for (let i = 0; i < memory.length; i += 2) {
      const twoBytesAddress = (i + offSet).toString(16).padStart(4, "0");
      const opcode = ((memory[i + offSet] << 8) | memory[i + offSet + 1])
        .toString(16)
        .padStart(4, "0");

      const element = `
        <div id="p${twoBytesAddress}" class="${
        REGISTER.pc === i + offSet ? "current-pc" : ""
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
    const pc4ByteString = REGISTER.pc.toString(16).padStart(4, "0");
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
})();
