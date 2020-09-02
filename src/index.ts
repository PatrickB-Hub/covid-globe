import './styles/main.scss';

import { EventBus } from './events/EventBus';
import { SceneManager } from './SceneManager';

const canvas = <HTMLCanvasElement>document.getElementById('canvas');

async function init() {

  const eventBus = new EventBus();
  const sceneManager = new SceneManager(canvas, eventBus);

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