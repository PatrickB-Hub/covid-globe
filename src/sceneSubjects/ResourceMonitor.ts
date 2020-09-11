import Stats from "three/examples/jsm/libs/stats.module";
export class ResourceMonitor {
  private resourceMonitor: Stats;

  constructor() {
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