import Stats from "three/examples/jsm/libs/stats.module";

import { EventBus } from "../events/EventBus";

export class ResourceMonitor {
  private eventBus: EventBus;
  private resourceMonitor: Stats;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;

    this.resourceMonitor = this.createResourceMonitor();
  }

  update() {
    this.resourceMonitor.update();
  }

  private createResourceMonitor() {
    const stats = Stats();
    stats.dom.style.left = "";
    stats.dom.style.right = "280px";
    document.body.appendChild(stats.dom);

    return stats;
  }
}