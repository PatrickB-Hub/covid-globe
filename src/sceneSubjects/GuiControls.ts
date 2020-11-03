import {
  Mesh,
  InstancedMesh,
  BoxBufferGeometry,
  SphereBufferGeometry,
  MeshPhysicalMaterial,
  MeshBasicMaterial,
  ShaderMaterial,
  FrontSide,
  BackSide,
  DoubleSide,
  MultiplyOperation,
  MixOperation,
  AddOperation
} from "three";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";

import { EventBus } from "../events/EventBus";
import { renderCall, toggleGUI } from "../events/constants";

export class GUIControls {
  private eventBus: EventBus;
  private sphereMesh: Mesh<SphereBufferGeometry, MeshPhysicalMaterial>;
  private atmosphereMesh: Mesh<SphereBufferGeometry, ShaderMaterial>;
  private pointsMesh: InstancedMesh<BoxBufferGeometry, MeshBasicMaterial>;
  private guiElement: HTMLElement;

  private materialData: { color: number; emissive: number; glowColor: string; };

  constructor(
    eventBus: EventBus,
    sphereMesh: Mesh<SphereBufferGeometry, MeshPhysicalMaterial>,
    atmosphereMesh: Mesh<SphereBufferGeometry, ShaderMaterial>,
    pointsMesh: InstancedMesh<BoxBufferGeometry, MeshBasicMaterial>
  ) {
    this.eventBus = eventBus;
    this.sphereMesh = sphereMesh;
    this.atmosphereMesh = atmosphereMesh;
    this.pointsMesh = pointsMesh;

    this.guiElement = <HTMLElement>document.querySelector(".dg");
    this.materialData = this.createMaterialData();
    this.createBasicMaterialControls();
    this.createAdvancedMaterialControls();
    this.createSphereTransformationControls();
    this.createAtmosphereControls();
    this.createPointsControls();
    this.toggleGUI();
    this.subscribeToEvents();
  }

  private gui = new GUI();

  toggleGUI() {
    this.guiElement.classList.toggle("util-display-none");
  }

  private options = {
    side: {
      FrontSide: FrontSide,
      BackSide: BackSide,
      DoubleSide: DoubleSide,
    },
    combine: {
      MultiplyOperation: MultiplyOperation,
      MixOperation: MixOperation,
      AddOperation: AddOperation,
    },
  };

  private createMaterialData() {
    const materialData = {
      color: this.sphereMesh.material.color.getHex(),
      emissive: this.sphereMesh.material.emissive.getHex(),
      glowColor: this.atmosphereMesh.material.uniforms.glowColor.value.getHex(),
    };

    return materialData;
  }

  private createBasicMaterialControls() {
    let material = this.sphereMesh.material;

    const materialFolder = this.gui.addFolder("Material-Basic");
    materialFolder.add(material, "transparent").onChange(() => this.eventBus.post(renderCall));
    materialFolder.add(material, "opacity", 0, 1, 0.01).onChange(() => this.eventBus.post(renderCall));
    materialFolder.add(material, "depthTest").onChange(() => this.eventBus.post(renderCall));
    materialFolder.add(material, "depthWrite").onChange(() => this.eventBus.post(renderCall));
    materialFolder
      .add(material, "alphaTest", 0, 1, 0.01)
      .onChange(() => this.updateMaterial(material));
    materialFolder.add(material, "visible").onChange(() => this.eventBus.post(renderCall));
    materialFolder
      .add(material, "side", this.options.side)
      .onChange(() => this.updateMaterial(material));
  }

  private createAdvancedMaterialControls() {
    let material = this.sphereMesh.material;

    const meshPhysicalMaterialFolder = this.gui.addFolder("Material-Advanced");
    meshPhysicalMaterialFolder.addColor(this.materialData, "color").onChange(() => {
      material.color.setHex(Number(this.materialData.color.toString().replace("#", "0x")));
      this.eventBus.post(renderCall);
    });
    meshPhysicalMaterialFolder.addColor(this.materialData, "emissive").onChange(() => {
      material.emissive.setHex(Number(this.materialData.emissive.toString().replace("#", "0x")));
      this.eventBus.post(renderCall);
    });
    meshPhysicalMaterialFolder.add(material, "wireframe").onChange(() => this.eventBus.post(renderCall));
    meshPhysicalMaterialFolder
      .add(material, "flatShading")
      .onChange(() => this.updateMaterial(material));
    meshPhysicalMaterialFolder.add(material, "reflectivity", 0, 1).onChange(() => this.eventBus.post(renderCall));
    meshPhysicalMaterialFolder.add(material, "refractionRatio", 0, 1).onChange(() => this.eventBus.post(renderCall));
    meshPhysicalMaterialFolder.add(material, "envMapIntensity", 0, 1).onChange(() => this.eventBus.post(renderCall));
    meshPhysicalMaterialFolder.add(material, "roughness", 0, 1, 0.1).onChange(() => this.eventBus.post(renderCall));
    meshPhysicalMaterialFolder.add(material, "metalness", 0, 1, 0.1).onChange(() => this.eventBus.post(renderCall));
    meshPhysicalMaterialFolder.add(material, "clearcoat", 0, 1, 0.01).onChange(() => this.eventBus.post(renderCall));
    meshPhysicalMaterialFolder.add(material, "clearcoatRoughness", 0, 1, 0.01).onChange(() => this.eventBus.post(renderCall));
  }

  private createSphereTransformationControls() {
    const sphereFolder = this.gui.addFolder("Sphere");

    const sphereRotationFolder = sphereFolder.addFolder("Rotation")
    sphereRotationFolder.add(this.sphereMesh.rotation, "x", 0, Math.PI * 2, 0.01).onChange(() => this.eventBus.post(renderCall));
    sphereRotationFolder.add(this.sphereMesh.rotation, "y", 0, Math.PI * 2, 0.01).onChange(() => this.eventBus.post(renderCall));
    sphereRotationFolder.add(this.sphereMesh.rotation, "z", 0, Math.PI * 2, 0.01).onChange(() => this.eventBus.post(renderCall));

    const spherePositionFolder = sphereFolder.addFolder("Position");
    spherePositionFolder.add(this.sphereMesh.position, "x", -10, 10, 0.01).onChange(() => this.eventBus.post(renderCall));
    spherePositionFolder.add(this.sphereMesh.position, "y", -10, 10, 0.01).onChange(() => this.eventBus.post(renderCall));
    spherePositionFolder.add(this.sphereMesh.position, "z", -10, 10, 0.01).onChange(() => this.eventBus.post(renderCall));

    const sphereScaleFolder = sphereFolder.addFolder("Scale");
    sphereScaleFolder.add(this.sphereMesh.scale, "x", 0.1, 5, 0.01).onChange(() => this.eventBus.post(renderCall));
    sphereScaleFolder.add(this.sphereMesh.scale, "z", 0.1, 5, 0.01).onChange(() => this.eventBus.post(renderCall));
    sphereScaleFolder.add(this.sphereMesh.scale, "y", 0.1, 5, 0.01).onChange(() => this.eventBus.post(renderCall));
  }

  private createAtmosphereControls() {
    const atmosphereFolder = this.gui.addFolder("Atmosphere");
    atmosphereFolder.add(this.atmosphereMesh.material, "visible").onChange(() => this.eventBus.post(renderCall));
    atmosphereFolder.addColor(this.materialData, "glowColor").onChange(() => {
      this.atmosphereMesh.material.uniforms.glowColor.value.setHex(Number(this.materialData.glowColor.toString().replace("#", "0x")));
      this.eventBus.post(renderCall);
    });

    const atmospherePositionFolder = atmosphereFolder.addFolder("Position");
    atmospherePositionFolder.add(this.atmosphereMesh.position, "x", -10, 10, 0.01).onChange(() => this.eventBus.post(renderCall));
    atmospherePositionFolder.add(this.atmosphereMesh.position, "y", -10, 10, 0.01).onChange(() => this.eventBus.post(renderCall));
    atmospherePositionFolder.add(this.atmosphereMesh.position, "z", -10, 10, 0.01).onChange(() => this.eventBus.post(renderCall));

    const atmosphereScaleFolder = atmosphereFolder.addFolder("Scale");
    atmosphereScaleFolder.add(this.atmosphereMesh.scale, "x", 0.1, 5, 0.01).onChange(() => this.eventBus.post(renderCall));
    atmosphereScaleFolder.add(this.atmosphereMesh.scale, "z", 0.1, 5, 0.01).onChange(() => this.eventBus.post(renderCall));
    atmosphereScaleFolder.add(this.atmosphereMesh.scale, "y", 0.1, 5, 0.01).onChange(() => this.eventBus.post(renderCall));
    atmosphereFolder.add(this.atmosphereMesh.material.uniforms.power, "value", 0, 10, 1).name("power").onChange(() => this.eventBus.post(renderCall));
    atmosphereFolder.add(this.atmosphereMesh.material.uniforms.coeficient, "value", 0, 1, 0.01).name("coeficient").onChange(() => this.eventBus.post(renderCall));
  }

  private updateMaterial(material: MeshPhysicalMaterial | MeshBasicMaterial) {
    material.side = Number(material.side);
    material.needsUpdate = true;
    this.eventBus.post(renderCall)
  }

  private createPointsControls() {
    const boxesFolder = this.gui.addFolder("Boxes");
    boxesFolder.add(this.pointsMesh.material, "visible").onChange(() => this.eventBus.post(renderCall));
  }

  private subscribeToEvents() {
    this.eventBus.subscribe(toggleGUI, this.toggleGUI.bind(this));
  }
}