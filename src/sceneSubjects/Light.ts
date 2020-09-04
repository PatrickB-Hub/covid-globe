import { DirectionalLight, PerspectiveCamera } from "three";

export class Light {
  private camera: PerspectiveCamera;
  directionalLight: DirectionalLight;

  constructor(camera: PerspectiveCamera) {
    this.camera = camera;

    this.directionalLight = this.createLight();
  }


  private createLight() {
    const directionalLight = new DirectionalLight(0xffffff, 1.5);
    this.camera.add(directionalLight);

    return directionalLight;
  }
}