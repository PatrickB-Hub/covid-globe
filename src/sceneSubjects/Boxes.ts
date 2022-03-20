import {
  Scene,
  Object3D,
  Color,
  BoxBufferGeometry,
  MeshBasicMaterial,
  InstancedMesh,
  MathUtils,
  Intersection,
  DataTexture,
} from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";

import {
  getSceneData,
  getTotalPoints,
  getLatestDate,
  getDateRange,
  getDateIndex,
  getCovidTypeCount,
} from "../utils/utils";

import { EventBus } from "../events/EventBus.js";
import {
  covidTypeChange,
  covidTypeCountChange,
  earthIntersection,
  renderCall,
  showCard,
  timeseriesAction,
  timeseriesInputChange,
  timeseriesSliderChange,
} from "../events/constants";

import { data } from "../types";

interface helpersProps {
  lngHelper: Object3D;
  latHelper: Object3D;
  positionHelper: Object3D;
  originHelper: Object3D;
  colorHelper: Color;
}

interface transformBoxProps {
  lng: number;
  lat: number;
  hue: number;
  zScale: number;
  instanceId: number;
}

export class Boxes {
  private scene: Scene;
  private eventBus: EventBus;
  private data: any;
  private currentIso: string;
  private boxes: { [key: string]: number };
  private covidDataType: number;
  private currentDate: string;
  private lastDate: string;
  private targetDate: string;
  private helpers: helpersProps;

  mesh: any;
  isos: string[];
  numTweensRunning: number;

  constructor(scene: Scene, eventBus: EventBus, data: data) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.data = data;
    this.currentIso = "World";
    this.mesh = new InstancedMesh(
      new BoxBufferGeometry(1, 1, 1),
      new MeshBasicMaterial(),
      getTotalPoints(this.data)
    );
    this.boxes = {};
    this.covidDataType = 0;
    this.currentDate = "";
    this.targetDate = getLatestDate(this.data);
    this.lastDate = this.targetDate;
    this.isos = [];
    this.numTweensRunning = 0;

    this.helpers = this.createHelpers();
    this.createBoxes();
  }

  // these helpers make it easier to position the boxes
  private createHelpers() {
    // We can rotate the lon helper on its Y axis to the longitude
    const lngHelper = new Object3D();
    this.scene.add(lngHelper);

    // We rotate the latHelper on its X axis to the latitude
    const latHelper = new Object3D();
    lngHelper.add(latHelper);

    // The position helper moves the object to the edge of the sphere
    const positionHelper = new Object3D();
    positionHelper.position.z = 1;
    latHelper.add(positionHelper);

    // Used to move the center of the cube so it scales from the position Z axis
    const originHelper = new Object3D();
    originHelper.position.z = 0.5;
    positionHelper.add(originHelper);

    const colorHelper = new Color();

    return { lngHelper, latHelper, positionHelper, originHelper, colorHelper };
  }

  private createBoxes() {
    const hue = 0.6;
    const zScale = 0.01;
    const boxInfos = getSceneData(this.data, {
      targetDateIndex: getDateIndex(this.data, this.targetDate),
      covidDataType: this.covidDataType,
    });
    boxInfos.forEach((info, instanceId) => {
      const { lng, lat, iso } = info;
      this.transformBox({ lng, lat, hue, zScale, instanceId });

      this.isos.push(iso);
      this.boxes[`${instanceId}hue`] = hue;
      this.boxes[`${instanceId}zScale`] = zScale;
    });

    this.scene.add(this.mesh);
    this.eventBus.post(renderCall);

    this.eventBus.subscribe(covidTypeChange, (type: number) => {
      this.covidDataType = type;
      this.updateBoxes();
    });
    this.eventBus.subscribe(
      timeseriesAction,
      this.handleTimeseriesAction.bind(this)
    );
    this.eventBus.subscribe(earthIntersection, this.highlightBoxes.bind(this));

    setTimeout(() => this.updateBoxes(), 2000);
  }

  private transformBox(props: transformBoxProps) {
    const { lng, lat, hue, zScale, instanceId } = props;

    const xRotation = MathUtils.degToRad(lat - 180);
    const yRotation = MathUtils.degToRad(lng - 90);

    // adjust the helpers to point to the latitude and longitude
    this.helpers.latHelper.rotation.x = xRotation;
    this.helpers.lngHelper.rotation.y = yRotation;

    // use the world matrix of the origin helper to position this geometry
    this.helpers.positionHelper.scale.set(0.005, 0.005, zScale);
    this.helpers.originHelper.updateWorldMatrix(true, false);

    // originHelper.matrixWorld = latHelper.matrix X lngHelper.matrix X positionHelper.matrix
    this.mesh.setMatrixAt(instanceId, this.helpers.originHelper.matrixWorld);
    this.mesh.instanceMatrix.needsUpdate = true;

    this.helpers.colorHelper.setHSL(hue, 1, 0.5);
    this.mesh.setColorAt(instanceId, this.helpers.colorHelper);
    this.mesh.instanceColor.needsUpdate = true;
  }

  updateBoxes(duration = 1000) {
    this.currentDate = this.targetDate;

    const dateRange = getDateRange(this.data);
    const prevValues = { ...this.boxes };
    const boxInfos = getSceneData(this.data, {
      targetDateIndex: getDateIndex(this.data, this.targetDate),
      covidDataType: this.covidDataType,
    });
    const targets: { [key: string]: number } = {};
    boxInfos.forEach((info, idx) => {
      targets[`${idx}zScale`] = MathUtils.lerp(0.01, 0.5, info.amount);
      targets[`${idx}hue`] = MathUtils.lerp(0.6, 0.01, info.amount);
    });

    // animate to the new set of boxes
    this.numTweensRunning += 1;
    const updateCalls = duration / 40;
    const dates = Object.keys(dateRange);
    const datesDiff = dateRange[this.lastDate] - dateRange[this.targetDate];
    const x = Math.ceil(
      (-1 * (dateRange[this.lastDate] - dateRange[this.targetDate])) /
        updateCalls
    );
    let indx = dateRange[this.lastDate];

    const tween = new TWEEN.Tween(this.boxes)
      .to(targets)
      .duration(duration)
      .onUpdate((obj: { [key: string]: number }) => {
        for (let instanceId = 0; instanceId < this.mesh.count; instanceId++) {
          if (
            obj[`${instanceId}zScale`] !== prevValues[`${instanceId}zScale`]
          ) {
            this.transformBox({
              lng: boxInfos[instanceId].lng,
              lat: boxInfos[instanceId].lat,
              hue: obj[`${instanceId}hue`],
              zScale: obj[`${instanceId}zScale`],
              instanceId,
            });
          }
        }
        if (
          indx <= dates.length &&
          (datesDiff <= 0
            ? indx <= dateRange[this.targetDate]
            : indx > dateRange[this.targetDate])
        ) {
          this.eventBus.post(timeseriesSliderChange, indx.toString());
          this.eventBus.post(timeseriesInputChange, dates[indx]);

          indx += x;
        }
      })
      .onComplete(() => {
        this.numTweensRunning -= 1;
        if (duration === 200) {
          this.targetDate = dates[dates.length - 1];
          this.updateBoxes(5000);
        }
        this.eventBus.post(
          timeseriesSliderChange,
          dateRange[this.targetDate].toString()
        );
        this.eventBus.post(timeseriesInputChange, this.targetDate);
      })
      .start();

    this.eventBus.post(
      covidTypeCountChange,
      getCovidTypeCount(
        this.data,
        this.covidDataType,
        getDateRange(this.data),
        this.targetDate
      )
    );
    this.eventBus.post(renderCall);
  }

  private handleTimeseriesAction(target: string, event: any) {
    const dateRange = getDateRange(this.data);
    this.targetDate = target;

    if (
      (event.target.type === "range" &&
        this.currentDate !==
          Object.keys(dateRange)[event.target.valueAsNumber]) ||
      (event.target.type === "date" && this.currentDate !== event.target.value)
    ) {
      this.updateBoxes();
      this.lastDate =
        event.target.type === "range"
          ? Object.keys(dateRange)[event.target.valueAsNumber]
          : event.target.value;
    } else {
      if (dateRange[this.lastDate] >= dateRange[target]) {
        this.targetDate = Object.keys(dateRange)[1];
        this.updateBoxes(200);
        this.lastDate = this.targetDate;
      } else {
        this.updateBoxes(5000);
        this.lastDate = this.targetDate;
      }
    }
  }

  private highlightBoxes(
    intersects: Intersection[],
    mouse: { x: number; y: number }
  ) {
    const countryCard = <HTMLElement>document.getElementById("card");
    // hide country card
    countryCard.classList.remove("visible");

    const canvas = document.body.querySelector("canvas");
    canvas.onclick = () => {};

    // checks if instancedMesh is intersected and visible to the user
    if (intersects.length > 0 && intersects[0].instanceId) {
      const intersectedIso = this.isos[intersects[0].instanceId].split("-")[0];

      if (intersectedIso !== this.currentIso.split("-")[0]) {
        this.currentIso = intersectedIso;

        this.isos.forEach((iso, idx) => {
          if (iso.split("-")[0] === intersectedIso) {
            this.mesh.setColorAt(
              idx,
              this.helpers.colorHelper.setHSL(this.boxes[`${idx}hue`], 1, 0.95)
            );
          } else {
            this.mesh.setColorAt(
              idx,
              this.helpers.colorHelper.setHSL(this.boxes[`${idx}hue`], 1, 0.5)
            );
          }
        });
        this.mesh.instanceColor.needsUpdate = true;
        this.eventBus.post(renderCall);
      } else {
        canvas.style.cursor = "pointer";
        canvas.onclick = () => {
          this.eventBus.post(showCard, intersects, mouse);
        };
      }
    } else {
      document.body.querySelector("canvas").style.cursor = "move";
    }
  }
}
