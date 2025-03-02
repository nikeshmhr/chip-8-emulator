import Emulator from "./emulator";

window.addEventListener("DOMContentLoaded", async() => {
  const rom = await fetch("/rom/INVADERS").then((response) => response.arrayBuffer());
  const emulator = new Emulator(new Uint8Array(rom));

  // Start the emulator loop make sure to use requestAnimationFrame
  function mainLoop() {
    emulator.run();
    requestAnimationFrame(mainLoop);
  }

  mainLoop();
});
