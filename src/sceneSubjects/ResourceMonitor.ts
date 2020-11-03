import Stats from "three/examples/jsm/libs/stats.module";

import { EventBus } from "../events/EventBus";
import { toggleStats } from "../events/constants";
export class ResourceMonitor {
  private eventBus: EventBus;
  private resourceMonitor: Stats;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;

    this.resourceMonitor = this.createResourceMonitor();
    this.toggleResourceMonitor();
  }


  toggleResourceMonitor() {
    this.resourceMonitor.dom.classList.toggle("util-display-none");
  }

  update() {
    this.resourceMonitor.update();
  }

  private createResourceMonitor() {
    const stats = Stats();
    stats.dom.style.left = "";
    stats.dom.style.right = "280px";
    document.body.appendChild(stats.dom);

    this.eventBus.subscribe(toggleStats, this.toggleResourceMonitor.bind(this));

    return stats;
  }
}