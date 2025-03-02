import { ISoundInterface } from "./constants";

class SoundPlayer implements ISoundInterface {
  private audio: HTMLAudioElement;

  constructor() {
    this.audio = new Audio();
    this.audio.src =
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA="; // Beep sound data URL
    this.audio.load();
  }

  play() {
    this.audio.currentTime = 0; // Reset to start
    this.audio.play();
  }

  stop() {
    if (!this.audio.paused) {
      this.audio.pause();
      this.audio.currentTime = 0; // Reset to start
    }
  }
}

export default SoundPlayer;
