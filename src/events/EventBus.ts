export class EventBus {
  private eventCallbacksPairs: { eventType: string, callbacks: ((arg1?: any, arg2?: any) => void)[]; }[];

  constructor() {
    this.eventCallbacksPairs = [];
  }

  subscribe(eventType: string, callback: (arg1?: any, arg2?: any) => void) {
    const eventCallbacksPair = this.findEventCallbacksPair(eventType);

    if (eventCallbacksPair)
      eventCallbacksPair.callbacks.push(callback);
    else
      this.eventCallbacksPairs.push({ eventType, callbacks: [callback] });
  }

  post(eventType: string, arg1?: any, arg2?: any) {
    const eventCallbacksPair = this.findEventCallbacksPair(eventType);

    if (!eventCallbacksPair) {
      console.error("no subscribers for event " + eventType);
      return;
    }

    eventCallbacksPair.callbacks.forEach(callback => callback(arg1, arg2));
  }

  private findEventCallbacksPair(eventType: string) {
    return this.eventCallbacksPairs.find(eventObject => eventObject.eventType === eventType);
  }
}