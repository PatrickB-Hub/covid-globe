import './styles/main.scss';

import { EventBus } from './events/EventBus';
import { SceneManager } from './SceneManager';
import { UIManager } from './UIManager';

import { data } from './types';

const canvas = <HTMLCanvasElement>document.getElementById('canvas');

async function init() {
  const res = await fetch('/dist/covid_data_geojson.json');
  const data: data = await res.json();

  const eventBus = new EventBus();
  const sceneManager = new SceneManager(canvas, eventBus, data);

  new UIManager(data);

  window.onresize = () => {
    resizeCanvas();
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