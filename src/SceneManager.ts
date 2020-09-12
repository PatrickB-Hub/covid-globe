import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Raycaster
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";

import { EventBus } from "./events/EventBus";
import { renderCall } from "./events/constants";

import { Light } from "./sceneSubjects/Light";
import { Earth } from "./sceneSubjects/Earth";
import { EarthAtmosphere } from "./sceneSubjects/EarthAtmosphere";
import { Boxes } from "./sceneSubjects/Boxes";
import { ResourceMonitor } from "./sceneSubjects/ResourceMonitor";
import { GUIControls } from "./sceneSubjects/GuiControls";

import { data } from "./types";

interface sceneSubjectsProps {
  light: Light;
  earth: Earth;
  atmosphere: EarthAtmosphere;
  boxes: Boxes;
  stats: ResourceMonitor;
  gui: GUIControls;
}

/* Builds the scene components and exposes render and resize functions */
export class SceneManager {
  private canvas: HTMLCanvasElement;
  private width: number;
  private height: number;
  private renderRequested: boolean;
  private data: data;

  scene: Scene;
  renderer: WebGLRenderer;
  camera: PerspectiveCamera;
  controls: OrbitControls;
  eventBus: EventBus;
  raycaster: Raycaster;
  sceneSubjects: sceneSubjectsProps;

  constructor(canvas: HTMLCanvasElement, eventBus: EventBus, data: data) {
    this.canvas = canvas;
    this.eventBus = eventBus;
    this.width = this.canvas.offsetWidth || window.innerWidth;
    this.height = this.canvas.offsetHeight || window.innerHeight;
    this.renderRequested = false;
    this.data = data;

    this.scene = this.buildScene();
    this.renderer = this.buildRender();
    this.camera = this.buildCamera();
    this.controls = this.buildControls();
    this.raycaster = this.buildRaycaster();
    this.sceneSubjects = this.createSceneSubjects();
  }


  private buildScene() {
    const scene = new Scene();
    return scene;
  }

  private buildRender() {
    const renderer = new WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    const DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;
    renderer.setPixelRatio(DPR);
    renderer.setSize(this.width, this.height);

    this.eventBus.subscribe(renderCall, this.requestRenderIfNotRequested.bind(this));
    return renderer;
  }

  private buildCamera() {
    const fieldOfView = 60;
    const aspectRatio = this.width / this.height;
    const nearPlane = 0.1;
    const farPlane = 10;
    const camera = new PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
    camera.position.set(2, 1.7, -.8); // position camera above the Mediterranean Sea
    this.scene.add(camera);

    return camera;
  }

  private buildControls() {
    const controls = new OrbitControls(this.camera, this.canvas);
    controls.minDistance = 1.85;
    controls.maxDistance = 4;
    controls.screenSpacePanning = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.addEventListener("change", this.requestRenderIfNotRequested.bind(this));
    controls.update();

    return controls;
  }

  private buildRaycaster() {
    const raycaster = new Raycaster();
    this.renderer.domElement.addEventListener("mousemove", onMousemoveHandler.bind(this));

    function onMousemoveHandler(event: MouseEvent) {
      const mouse = {
        x: (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1,
      };
      raycaster.setFromCamera(mouse, this.camera);
    }

    return raycaster;
  }

  private createSceneSubjects() {
    const light = new Light(this.camera);
    const earth = new Earth(
      this.scene,
      this.eventBus
    );
    const atmosphere = new EarthAtmosphere(
      this.scene,
      earth.mesh.geometry
    );
    const boxes = new Boxes(
      this.scene,
      this.eventBus,
      this.data
    );
    const stats = new ResourceMonitor();
    const gui = new GUIControls(
      this.eventBus,
      earth.mesh,
      atmosphere.earthAtmosphere,
    );

    return {
      light,
      earth,
      atmosphere,
      boxes,
      stats,
      gui
    };
  }

  private render() {
    this.renderRequested = false;

    if (this.sceneSubjects && this.sceneSubjects.boxes.numTweensRunning > 0) {
      TWEEN.update();
      this.requestRenderIfNotRequested();
    }

    if (this.sceneSubjects)
      this.sceneSubjects.stats.update();

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  resizeScene() {
    const { width, height } = this.canvas;
    this.width = width;
    this.height = height;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.render();
  }

  requestRenderIfNotRequested() {
    if (!this.renderRequested) {
      this.renderRequested = true;
      requestAnimationFrame(this.render.bind(this));
    }
  }
}