import { ISoundInterface } from "./constants";

class SoundPlayer implements ISoundInterface {
  private audioContext: AudioContext;
  private mainGainNode: GainNode;
  private oscillator: OscillatorNode;

  constructor() {
    this.audioContext = new AudioContext();

    this.mainGainNode = this.audioContext.createGain();
    this.mainGainNode.connect(this.audioContext.destination);
    this.mainGainNode.gain.value = 0.5;

    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.connect(this.mainGainNode);

    this.oscillator.type = "square";
    this.oscillator.frequency.value = 87.307057858250971;
  }

  beep() {
    this.oscillator.start();
    console.log("beep");
    this.oscillator.stop(this.audioContext.currentTime + 0.2);
  }
}

export default SoundPlayer;
