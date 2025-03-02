class Logger {
  private name: string;

  private constructor(name: string) {
    this.name = name;
  }

  log(message: any) {
    console.log(`${this.name}:`, message);
  }

  error(message: any) {
    console.error(`${this.name}:`, message);
  }

  static getInstance(name: string) {
    return new Logger(name);
  }
}

export default Logger;
