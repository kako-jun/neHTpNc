import * as THREE from 'three';
import { GameRenderer } from './renderer';
import { TetrisGame } from './game';
import { CircularTetrisGame } from './circular-game';
import { GameMode } from './types';

class App {
  private renderer: GameRenderer;
  private game: TetrisGame | CircularTetrisGame | null = null;
  private currentMode: GameMode = 'classic';
  private animationId: number | null = null;

  constructor() {
    const app = document.getElementById('app')!;
    this.renderer = new GameRenderer(app);

    this.setupUI();
    this.setupControls();
    this.startGame('classic');
    this.animate(0);
  }

  private setupUI() {
    // モード切り替えボタン
    const buttons = {
      classic: document.getElementById('mode-classic')!,
      trio: document.getElementById('mode-trio')!,
      pento: document.getElementById('mode-pento')!,
      circular: document.getElementById('mode-circular')!,
    };

    Object.entries(buttons).forEach(([mode, button]) => {
      button.addEventListener('click', () => {
        this.switchMode(mode as GameMode);
        // アクティブ状態を更新
        Object.values(buttons).forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
      });
    });
  }

  private setupControls() {
    document.addEventListener('keydown', (e) => {
      if (!this.game) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.game.moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.game.moveRight();
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.game.moveDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.game.rotate();
          break;
        case ' ':
          e.preventDefault();
          this.game.hardDrop();
          break;
      }
    });
  }

  private switchMode(mode: GameMode) {
    if (this.currentMode === mode) return;

    this.currentMode = mode;
    this.startGame(mode);
  }

  private startGame(mode: GameMode) {
    // 既存のゲームを破棄
    if (this.game) {
      this.game.destroy();
    }

    // シーンをクリア
    while (this.renderer.scene.children.length > 0) {
      const obj = this.renderer.scene.children[0];
      this.renderer.scene.remove(obj);
    }

    // ライティングを再設定
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.renderer.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    this.renderer.scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xff00ff, 1, 50);
    pointLight1.position.set(-10, 10, 10);
    this.renderer.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00ffff, 1, 50);
    pointLight2.position.set(10, -10, 10);
    this.renderer.scene.add(pointLight2);

    // 新しいゲームを開始
    if (mode === 'circular') {
      this.game = new CircularTetrisGame(this.renderer);
      // 円形モードではカメラを上から見下ろす
      this.renderer.camera.position.set(0, 20, 0.1);
      this.renderer.camera.lookAt(0, 0, 0);
    } else {
      this.game = new TetrisGame(this.renderer, mode);
      // 通常モードではカメラを正面から
      this.renderer.camera.position.set(0, 0, 30);
      this.renderer.camera.lookAt(0, 0, 0);
    }
  }

  private animate(time: number) {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    if (this.game) {
      this.game.update(time);

      // スコア更新
      const state = this.game.getState();
      const scoreElement = document.getElementById('score')!;
      scoreElement.textContent = `Score: ${state.score} | Level: ${state.level} | Lines: ${state.lines}`;

      if (state.gameOver) {
        scoreElement.textContent += ' | GAME OVER';
      }
    }

    this.renderer.render();
  }

  dispose() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.game) {
      this.game.destroy();
    }
    this.renderer.dispose();
  }
}

// アプリ起動
new App();
