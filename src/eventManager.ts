import Emitry from "emitry";
import Logger from "./logger";

export const EVENTS = {
  REGISTER_UPDATED: "REGISTER_UPDATED",
  PROGRAM_COUNTER_UPDATED: "PROGRAM_COUNTER_UPDATED",
  PROGRAM_LOADED: "PROGRAM_LOADED",
};

class EventsManager {
  private emitter = new Emitry();
  private static instance: EventsManager;
  private logger = Logger.getInstance("EventsManager");

  private constructor() {}

  public subscribe(eventName: string, callback: (...args: any[]) => void) {
    this.emitter.on(eventName, callback);
  }

  public publish(eventName: string, data: any) {
    this.emitter.emit(eventName, data);
  }

  public static getInstance(): EventsManager {
    if (!EventsManager.instance) {
      EventsManager.instance = new EventsManager();
    }
    return EventsManager.instance;
  }
}

export default EventsManager;
