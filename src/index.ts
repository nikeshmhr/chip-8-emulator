import Emulator from "./emulator";
import UI from "./ui";

window.addEventListener("DOMContentLoaded", async () => {
  let romToLoad = "IBM_LOGO";

  const urlParams = new URLSearchParams(window.location.search);
  const romQuery = urlParams.get("rom") || "";
  if (romQuery) {
    romToLoad = romQuery;
  }

  const rom = await fetch(`./rom/${romToLoad}`).then((response) =>
    response.arrayBuffer()
  );
  const emulator = new Emulator(new Uint8Array(rom));
  const ui = new UI(emulator, romToLoad);
  ui.printMemory();

  function mainLoop() {
    emulator.run();
    requestAnimationFrame(mainLoop);
  }

  mainLoop();
});
