import EventsManager, { EVENTS } from "./eventManager";
import RAM from "./memory";
import register from "./register";
import IBMLogo from "./rom/ibm-logo";
import { ROM_MAPS } from "./rom/rom.map";

const eventsManager = EventsManager.getInstance();

(async () => {
  const SCALE = 10;

  const UNIT = 1;
  const WIDTH = 64 * SCALE;
  const HEIGHT = 32 * SCALE;
  const PROGRAM_START_ADDRESS = 0x200;

  const FPS = 60;
  const MILLISECONDS_IN_A_SECOND = 1000;
  const FRAME_TIME = MILLISECONDS_IN_A_SECOND / FPS;

  const COLORS = {
    ON: "#b4e5af",
    OFF: "#000000",
    GRID_OUTLINE: "#ffffff33",
  };

  const PROGRAM_STATE = {
    running: false,
    debuggerEnabled: false,
  };

  // const canvas = document.createElement("canvas");
  const canvas = document.getElementById("screen") as HTMLCanvasElement;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  // canvas.id = "screen";
  // document.getElementById("container")!.appendChild(canvas);

  const BLINKING_ANIMATION_PARAMS: [Keyframe[], KeyframeAnimationOptions] = [
    [
      { backgroundColor: "rgba(255, 255, 0, 0.5)" },
      { backgroundColor: "rgba(255, 255, 0, 0)" },
    ],
    {
      duration: 1000,
      iterations: 3,
    },
  ];

  const SCROLL_BEHAVIOR_PARAMS: ScrollIntoViewOptions = {
    behavior: "instant",
    block: "center",
    inline: "center",
  };

  const registerUIElement = document.getElementById(
    "registers"
  ) as HTMLDivElement;

  const memoryUIElement = document.getElementById("memory") as HTMLDivElement;
  memoryUIElement.style.height = `${HEIGHT * 2}px`;
  const memoryContentUIElement = document.getElementById(
    "memory-content"
  ) as HTMLDivElement;
  const followPCUIElement = document.getElementById(
    "follow-pc"
  ) as HTMLInputElement;
  const gotoAddressUIInputElement = document.getElementById(
    "memory-search"
  ) as HTMLInputElement;

  // memory controls ui elements
  const gotoPCUIElement = document.getElementById(
    "go-to-pc"
  ) as HTMLButtonElement;
  const memorySearchUIElement = document.getElementById(
    "memory-search"
  ) as HTMLInputElement;
  const memorySearchButton = document.getElementById(
    "memory-search-btn"
  ) as HTMLButtonElement;

  // debugger page elements
  const toggleDebuggerUIElement = document.getElementById(
    "toggle-debugger"
  ) as HTMLInputElement;
  const stepUIElement = document.getElementById("step") as HTMLButtonElement;
  const continueUIElement = document.getElementById(
    "continue"
  ) as HTMLButtonElement;

  // load program ui element
  const selectProgramUIElement = document.getElementById(
    "select-program"
  ) as HTMLSelectElement;
  const loadProgramUIElement = document.getElementById(
    "load-program"
  ) as HTMLButtonElement;

  setupUIEventHandlers();

  function setupUIEventHandlers() {
    gotoPCUIElement.addEventListener("click", gotoPC);
    memorySearchUIElement.addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        gotoAddress();
      }
    });
    memorySearchButton.addEventListener("click", gotoAddress);

    loadProgramUIElement.addEventListener("click", loadProgram);

    toggleDebuggerUIElement.addEventListener("click", toggleDebugger);
    stepUIElement.addEventListener("click", () => {
      PROGRAM_STATE.running = true;
    });
    continueUIElement.addEventListener("click", () => {
      PROGRAM_STATE.debuggerEnabled = false;
      PROGRAM_STATE.running = true;
      toggleDebuggerUIElement.checked = false;
    });
  }

  const EVENTS_HANDLER = {
    [EVENTS.REGISTER_UPDATED]: handleRegisterUpdate,
    [EVENTS.PROGRAM_COUNTER_UPDATED]: handlePCUpdate,
    [EVENTS.MEMORY_UPDATED]: printMemory,
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
  const REGISTER = register;

  // setGrid();

  async function loop() {
    if (PROGRAM_STATE.running) {
      const now = Date.now();
      if (now - lastPaintTime >= FRAME_TIME) {
        lastPaintTime = now;

        const opcode =
          (RAM.memory[REGISTER.pc] << 8) | RAM.memory[REGISTER.pc + 1];

        let nextInstruction = REGISTER.pc + 2;

        const { X, Y, N, NN, NNN } = {
          X: (opcode & 0x0f00) >> 8,
          Y: (opcode & 0x00f0) >> 4,
          N: opcode & 0x000f,
          NN: opcode & 0x00ff,
          NNN: opcode & 0x0fff,
        };

        switch (opcode & 0xf000) {
          case 0x0000:
            // clear screen
            if (NNN == 0x00e0) {
              clearScreen();
            }
            break;

          // 1NNN (jump)
          case 0x1000:
            nextInstruction = NNN;
            break;

          // 6XNN (set register VX)
          case 0x6000:
            const register = X;
            const value = NN;
            REGISTER.setRegister(register, value);
            break;

          // 7XNN (add value to register VX)
          case 0x7000:
            const r = X;
            const val = NN;
            REGISTER.setRegister(r, REGISTER.V[r] + val);
            break;

          // ANNN (set index register I)
          case 0xa000:
            const v = NNN;
            REGISTER.I = v;
            break;

          // DXYN (display/draw)
          case 0xd000:
            const height = N;
            const x = REGISTER.V[X];
            const y = REGISTER.V[Y];
            REGISTER.setRegister(0xf, 0);
            for (let i = 0; i < height; i++) {
              const spriteData = RAM.memory[REGISTER.I + i];
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
            break;

          default:
            console.error(`Unknown opcode: ${opcode.toString(16)}`);
            PROGRAM_STATE.running = false;
            throw new Error(`Unknown opcode: ${opcode.toString(16)}`);
        }

        REGISTER.pc = nextInstruction;
      }

      checkDebugger();
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
    const program =
      ROM_MAPS[selectProgramUIElement.value as keyof typeof ROM_MAPS];
    RAM.loadProgram(Uint8Array.from(program));

    // start program
    startProgram();
  }

  async function startProgram() {
    REGISTER.pc = PROGRAM_START_ADDRESS;
    printMemory();
    handleRegisterUpdate();
    PROGRAM_STATE.running = true;
    await sleep(200);

    loop();
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
          <h2>Register values</h2>
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
    let html = ``;
    const offSet = 0x0;

    for (let i = 0; i < RAM.memory.length; i += 2) {
      const twoBytesAddress = (i + offSet).toString(16).padStart(4, "0");
      const opcode = (
        (RAM.memory[i + offSet] << 8) |
        RAM.memory[i + offSet + 1]
      )
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
    memoryContentUIElement.innerHTML = html;
  }

  function handlePCUpdate() {
    const pc4ByteString = REGISTER.pc.toString(16).padStart(4, "0");
    const pcElement = document.getElementById(`p${pc4ByteString}`);
    if (pcElement) {
      const activeElement = document.querySelector(".current-pc");
      const classesToAddAndRemove = ["current-pc"];
      if (PROGRAM_STATE.debuggerEnabled) {
        classesToAddAndRemove.push("breakpoint");
      }
      if (activeElement) {
        activeElement.classList.remove(...classesToAddAndRemove);
      }
      pcElement.classList.add(...classesToAddAndRemove);

      // Scroll to the current program counter
      const followPC = followPCUIElement.checked;
      if (followPC) {
        pcElement.scrollIntoView(SCROLL_BEHAVIOR_PARAMS);
      }
    }
  }

  function checkDebugger() {
    if (PROGRAM_STATE.debuggerEnabled) {
      PROGRAM_STATE.running = false;
    }
  }

  // UI Event handlers
  function gotoAddress() {
    const value = gotoAddressUIInputElement.value;

    if (!value) return;

    const prefixedValue = value.startsWith("0x") ? value : `0x${value}`;
    let address = parseInt(prefixedValue, 16);

    if (!isNaN(address) && address >= 0 && address <= 0xfff) {
      address = address & 0xffe; // make sure it's even
      const addressHex = address.toString(16).padStart(4, "0");
      const pcElement = document.getElementById(`p${addressHex}`);
      if (pcElement) {
        pcElement.scrollIntoView(SCROLL_BEHAVIOR_PARAMS);

        // play a little animation
        pcElement.animate(...BLINKING_ANIMATION_PARAMS);
      }
    } else {
      console.error("Invalid address");
    }
  }

  function gotoPC() {
    const pc = REGISTER.pc;
    const pc4ByteString = pc.toString(16).padStart(4, "0");
    const pcElement = document.getElementById(`p${pc4ByteString}`);
    if (pcElement) {
      pcElement.scrollIntoView(SCROLL_BEHAVIOR_PARAMS);

      // play a little animation
      pcElement.animate(...BLINKING_ANIMATION_PARAMS);
    }
  }

  function toggleDebugger() {
    PROGRAM_STATE.debuggerEnabled = toggleDebuggerUIElement.checked;
    if (PROGRAM_STATE.debuggerEnabled) {
      PROGRAM_STATE.running = false;
    } else {
      PROGRAM_STATE.running = true;
    }
  }

  //@ts-ignore
  window.gotoAddress = gotoAddress;
  //@ts-ignore
  window.gotoPC = gotoPC;
  //@ts-ignore
  window.loadProgram = loadProgram;
})();
