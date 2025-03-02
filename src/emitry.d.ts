declare module "emitry" {
  class Emitry {
    on(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): void;
    once(event: string, listener: (...args: any[]) => void): this;
  }

  export default Emitry;
}
