import {
  getCovidTypeCount,
  getDateIndex,
  getDateRange,
  getLatestDate
} from "./utils/utils";

import { data } from "./types";

/* Manages the ui elements, handles events and positions the country card */
export class UIManager {
  private data: data;

  constructor(data: data) {
    this.data = data;

    this.createUIEventListeners();
  }

  private createUIEventListeners() {
    // event listeners for the settings menu
    const settingsMenu = <HTMLElement>document.getElementById("settings-menu");
    const settingsOptions = <HTMLElement>document.getElementById("settings-options");
    settingsMenu.addEventListener("click", () => settingsOptions.classList.toggle("util-display-flex"));

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

    // event listeners for the play button, slider and datepicker
    const timeseriesSlider = <HTMLInputElement>document.getElementById("timeseries-slider");
    const latestDateIndex = getDateIndex(this.data, latestDate).toString();
    timeseriesSlider.max = latestDateIndex;
    timeseriesSlider.value = latestDateIndex;
    const timeseriesInput = <HTMLInputElement>document.getElementById("timeseries-input");
    timeseriesInput.value = latestDate;
  }
}