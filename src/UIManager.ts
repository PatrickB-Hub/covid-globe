import { Intersection, WebGLRenderer } from "three";

import {
  getCountryFlag,
  getCountryName,
  getCountryDetails,
  getCovidTypeCount,
  getDateIndex,
  getDateRange,
  getLatestDate
} from "./utils/utils";

import { EventBus } from "./events/EventBus.js";
import {
  covidTypeCountChange,
  covidTypeChange,
  timeseriesAction,
  areaChange,
  timeseriesSliderChange,
  timeseriesInputChange,
  toggleGUI,
  toggleStats,
  showCard
} from "./events/constants";

import { data } from "./types";

enum covidDataTypes {
  cases,
  active,
  deaths,
  recovered
}

/* Manages the ui elements, handles events and positions the country card */
export class UIManager {
  private renderer: WebGLRenderer;
  private eventBus: EventBus;
  private data: data;
  private isos: string[];
  private covidTypeIndex: 0;
  private intersectedIso: string;
  private targetDate: string;
  private currentDate: string;
  private countryCardUI: {
    countryCard: HTMLElement;
    countryCardTitle: HTMLElement;
    countryCardFlag: HTMLElement;
    countryCardDetails: HTMLElement
  };

  constructor(renderer: WebGLRenderer, isos: string[], eventBus: EventBus, data: data) {
    this.renderer = renderer;
    this.eventBus = eventBus;
    this.data = data;
    this.isos = isos;
    this.covidTypeIndex = 0;
    this.intersectedIso = "World";
    this.targetDate = getLatestDate(this.data);
    this.currentDate = this.targetDate;

    this.createUIEventListeners();
    this.countryCardUI = this.createCountryCard();
  }

  private createUIEventListeners() {
    // event listeners for the settings menu
    const settingsMenu = <HTMLElement>document.getElementById("settings-menu");
    const settingsOptions = <HTMLElement>document.getElementById("settings-options");
    const toggleStatsButton = <HTMLElement>document.getElementById("stats-button");
    const toggleControlsButton = <HTMLElement>document.getElementById("controls-button");
    settingsMenu.addEventListener("click", () => settingsOptions.classList.toggle("util-display-flex"));
    toggleStatsButton.addEventListener("click", () => this.eventBus.post(toggleStats))
    toggleControlsButton.addEventListener("click", () => this.eventBus.post(toggleGUI))

    // event listeners for the info modal
    const modal = <HTMLElement>document.getElementById("info-modal");
    const modalBox = <HTMLElement>document.getElementById("info-modal-box");
    const modalButton = <HTMLElement>document.getElementById("info-modal-button");
    modalButton.onclick = function () {
      modal.classList.toggle("util-display-flex");
    }

    // close the modal and settings menu when the user clicks outside of the element
    window.onclick = function (event) {
      if (event.target == modal && event.target !== modalBox)
        modal.classList.toggle("util-display-flex");

      if ((event.target !== settingsMenu && event.target.parentElement !== settingsMenu) && event.target.parentElement !== settingsOptions) {
        settingsOptions.classList.remove("util-display-flex");
      }
    }

    // event listener for the type selection (cases/active/deaths/recovered)
    const covidTypeCount = <HTMLElement>document.getElementById("type-count");
    const latestDate = getLatestDate(this.data);
    covidTypeCount.textContent = getCovidTypeCount(this.data, 0, getDateRange(this.data), latestDate);
    this.eventBus.subscribe(covidTypeCountChange, (count) => covidTypeCount.textContent = count);
    const covidTypes = <HTMLElement>document.getElementById("type-options");
    covidTypes.addEventListener("change", onTypeChange.bind(this));
    function onTypeChange(event: any) {
      this.covidType = covidDataTypes[event.target.value];
      this.eventBus.post(covidTypeChange, covidDataTypes[event.target.value]);
    }

    // event listeners for the play button, slider and datepicker
    const timeseriesButton = <HTMLElement>document.getElementById("timeseries-button");
    const timeseriesSlider = <HTMLInputElement>document.getElementById("timeseries-slider");
    const latestDateIndex = getDateIndex(this.data, latestDate).toString();
    timeseriesSlider.max = latestDateIndex;
    timeseriesSlider.value = latestDateIndex;
    const timeseriesInput = <HTMLInputElement>document.getElementById("timeseries-input");
    timeseriesInput.value = latestDate;
    timeseriesButton.addEventListener("click", onTimeseriesAction.bind(this));
    timeseriesSlider.addEventListener("click", onTimeseriesAction.bind(this));
    timeseriesInput.addEventListener("change", onTimeseriesAction.bind(this));
    function onTimeseriesAction(event: any) {

      const dateRange = getDateRange(this.data);

      if (
        event.target.type === "range" &&
        this.currentDate !== Object.keys(dateRange)[event.target.valueAsNumber]
      ) {
        this.targetDate = Object.keys(dateRange)[event.target.valueAsNumber];
      } else if (event.target.type === "date" && this.currentDate !== event.target.value) {
        this.targetDate = event.target.value;
      } else {
        this.targetDate = Object.keys(dateRange)[
          Object.keys(dateRange).length - 1
        ];
      }

      this.eventBus.post(timeseriesAction, this.targetDate, event);
    }
    this.eventBus.subscribe(timeseriesSliderChange, (val: string) => timeseriesSlider.value = val)
    this.eventBus.subscribe(timeseriesInputChange, (val: string) => timeseriesInput.value = val)
  }

  private createCountryCard() {
    const countryCard = <HTMLElement>document.getElementById("card");
    const countryCardFlag = <HTMLElement>document.getElementById("card-image");
    const countryCardTitle = <HTMLElement>document.getElementById("card-title");
    const countryCardDetails = <HTMLElement>document.getElementById("card-details");
    const countryCardLink = <HTMLElement>document.getElementById("card-link");

    countryCardLink.addEventListener("click", () => this.eventBus.post(areaChange, this.intersectedIso));

    this.eventBus.subscribe(showCard, this.updateCountryCard.bind(this));

    return { countryCard, countryCardTitle, countryCardFlag, countryCardDetails };
  }

  // show country card when one of the points gets intersected
  private updateCountryCard(intersects: Intersection[], mouse: { x: number, y: number }) {

    // remove all country card details 
    while (this.countryCardUI.countryCardDetails.firstChild)
      this.countryCardUI.countryCardDetails.removeChild(this.countryCardUI.countryCardDetails.firstChild);

    // check if sphere gets intersected
    if (intersects.length > 0 && intersects[0].instanceId) {
      this.intersectedIso = this.isos[intersects[0].instanceId].split("-")[0];

      // show county card
      this.countryCardUI.countryCard.classList.toggle("visible");

      this.countryCardUI.countryCardFlag.setAttribute(
        "src",
        `https://flagcdn.com/${this.intersectedIso.toLocaleLowerCase()}.svg`
      );

      const countryName = getCountryName(this.data, this.intersectedIso);
      if (countryName)
        this.countryCardUI.countryCardTitle.textContent = countryName;

      const countryDetails = getCountryDetails(
        this.data,
        this.targetDate,
        this.intersectedIso,
        covidDataTypes[this.covidTypeIndex],
        this.covidTypeIndex,
      );
      const countryDetailsKeys = Object.keys(countryDetails);
      if (countryDetails) {
        countryDetailsKeys.forEach(detail => {
          const listElement = document.createElement("li");
          listElement.textContent = `${detail}: ${countryDetails[detail]}`;
          this.countryCardUI.countryCardDetails.appendChild(listElement);
        });
      }

      // convert the normalized position to CSS coordinates
      const x = (mouse.x * .5 + .5) * this.renderer.domElement.clientWidth;
      const y = (mouse.y * -.5 + .5) * this.renderer.domElement.clientHeight;

      // position card slightly above the cursor
      this.countryCardUI.countryCard.style.transform = `translate(-50%, -50%) translate(${x}px,${y - 40}px)`;
    }
  }
}
