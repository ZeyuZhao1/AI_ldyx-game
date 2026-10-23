import './styles/main.css';
import { GameApp } from './app/GameApp';

window.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new GameApp();
    app.init();
  } catch (e) {
    console.error('Failed to initialize 两弹一星 GameApp:', e);
  }
});
