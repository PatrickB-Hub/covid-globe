import {
  Scene,
  SphereBufferGeometry,
  TextureLoader,
  MeshPhysicalMaterial,
  Color,
  Mesh
} from "three";

import GlobeImage from "../images/globe.jpg";
import EarthSpecular from "../images/globe-specular.jpg";

import { EventBus } from "../events/EventBus";
import { renderCall } from "../events/constants";

export class Earth {
  private scene: Scene;
  private eventBus: EventBus;
  mesh: Mesh<SphereBufferGeometry, MeshPhysicalMaterial>;

  constructor(scene: Scene, eventBus: EventBus) {
    this.scene = scene;
    this.eventBus = eventBus;

    this.mesh = this.createEarth();
  }

  private createEarth() {
    const sphereGeometry = new SphereBufferGeometry(1, 64, 32);
    const loader = new TextureLoader();
    const texture = loader.load(GlobeImage, () => this.eventBus.post(renderCall));

    const material = new MeshPhysicalMaterial({ map: texture });
    const specularTexture = loader.load(EarthSpecular, () => this.eventBus.post(renderCall));

    material.metalnessMap = specularTexture;
    material.color = new Color(0xffffff);
    material.reflectivity = 0.25;
    material.refractionRatio = 0.5;
    material.envMapIntensity = 0.5;
    material.roughness = 0.7;
    material.metalness = 0.4;
    material.clearcoat = 0.8;
    material.clearcoatRoughness = 0.5;

    const sphereMesh = new Mesh(sphereGeometry, material);
    this.scene.add(sphereMesh);
    return sphereMesh;
  }
}