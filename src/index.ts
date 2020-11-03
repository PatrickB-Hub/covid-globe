import './styles/main.scss';

import { EventBus } from './events/EventBus';
import { SceneManager } from './SceneManager';
import { ChartManager } from './ChartManager';
import { UIManager } from './UIManager';

import { data } from './types';

const canvas = <HTMLCanvasElement>document.getElementById('canvas');

async function init() {
  const res = await fetch('/dist/covid_data.json');
  const data: data = await res.json();

  const eventBus = new EventBus();
  const sceneManager = new SceneManager(canvas, eventBus, data);
  const chartManager = new ChartManager(eventBus, data);

  new UIManager(
    sceneManager.renderer,
    sceneManager.sceneSubjects.boxes.isos,
    eventBus,
    data
  );

  let timeout: number;

  window.onresize = () => {
    resizeCanvas();
    clearTimeout(timeout);

    // Smoother resize
    timeout = window.setTimeout(() => chartManager.resizeChart(), 100);
  };
  resizeCanvas();

  function resizeCanvas() {
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    sceneManager.resizeScene();
  }
}

init();