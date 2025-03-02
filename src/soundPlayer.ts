import { ISoundInterface } from "./constants";

class SoundPlayer implements ISoundInterface {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new AudioContext();
  }

  beep() {
    const mainGainNode = this.audioContext.createGain();
    mainGainNode.connect(this.audioContext.destination);
    mainGainNode.gain.value = 0.5;

    const oscillator = this.audioContext.createOscillator();
    oscillator.connect(mainGainNode);

    oscillator.type = "square";
    oscillator.frequency.value = 87.307057858250971;

    oscillator.start();
    console.log("beep");
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }
}

export default SoundPlayer;
