class Input {
  private keyState: boolean[] = new Array(16).fill(false);
  private keyMap: { [key: string]: number } = {
    "0": 0,
    "1": 1,
    "3": 2,
    "4": 3,
    q: 4,
    w: 5,
    e: 6,
    r: 7,
    a: 8,
    s: 9,
    d: 10,
    f: 11,
    z: 12,
    x: 13,
    c: 14,
    v: 15,
  };

  constructor() {
    window.addEventListener("keydown", this.onKeyDown.bind(this));
    window.addEventListener("keyup", this.onKeyUp.bind(this));
  }

  private onKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (this.keyMap.hasOwnProperty(key)) {
      this.keyState[this.keyMap[key]] = true;
    }
  }

  private onKeyUp(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (this.keyMap.hasOwnProperty(key)) {
      this.keyState[this.keyMap[key]] = false;
    }
  }

  get key() {
    return this.keyState as ReadonlyArray<boolean>;
  }
}

export default Input;
