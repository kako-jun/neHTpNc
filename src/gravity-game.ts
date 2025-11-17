import * as THREE from 'three';
import { GameMode, GameState, TetrominoShape, BlockPosition } from './types';
import { getShapesByMode } from './shapes';
import { GameRenderer } from './renderer';

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const BLOCK_SIZE = 1;

/**
 * Gravity Flip Mode: ブロックが下から上に落ちる逆重力テトリス
 */
export class GravityFlipGame {
  private renderer: GameRenderer;
  private state: GameState;
  private grid: (THREE.Mesh | null)[][];
  private currentPiece: {
    shape: TetrominoShape;
    position: BlockPosition;
    rotation: number;
    meshes: THREE.Mesh[];
  } | null = null;

  private dropCounter = 0;
  private dropInterval = 1000;
  private lastTime = 0;

  private shapes: TetrominoShape[] = [];

  constructor(renderer: GameRenderer, mode: GameMode) {
    this.renderer = renderer;
    this.state = {
      mode,
      score: 0,
      level: 1,
      lines: 0,
      gameOver: false,
    };

    this.grid = Array(GRID_HEIGHT)
      .fill(null)
      .map(() => Array(GRID_WIDTH).fill(null));

    this.shapes = getShapesByMode('classic');

    this.setupGrid();
    this.spawnPiece();
  }

  private setupGrid() {
    const gridHelper = new THREE.GridHelper(GRID_WIDTH, GRID_WIDTH, 0x444444, 0x222222);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.set(GRID_WIDTH / 2 - 0.5, GRID_HEIGHT / 2 - 0.5, -1);
    this.renderer.scene.add(gridHelper);

    const frameGeometry = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(GRID_WIDTH, GRID_HEIGHT, 0.1)
    );
    const frameMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff }); // 違う色で区別
    const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
    frame.position.set(GRID_WIDTH / 2 - 0.5, GRID_HEIGHT / 2 - 0.5, 0);
    this.renderer.scene.add(frame);
  }

  private createBlockMesh(color: number): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(BLOCK_SIZE * 0.9, BLOCK_SIZE * 0.9, BLOCK_SIZE * 0.9);
    const material = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5,
      shininess: 100,
      specular: 0xffffff,
    });

    const mesh = new THREE.Mesh(geometry, material);

    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    mesh.add(edges);

    return mesh;
  }

  private spawnPiece() {
    if (this.state.gameOver) return;

    const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
    const startX = Math.floor(GRID_WIDTH / 2) - 1;
    const startY = 0; // 下から開始

    this.currentPiece = {
      shape,
      position: { x: startX, y: startY },
      rotation: 0,
      meshes: [],
    };

    shape.blocks.forEach((block) => {
      const mesh = this.createBlockMesh(shape.color);
      const worldPos = this.getWorldPosition(
        this.currentPiece!.position.x + block.x,
        this.currentPiece!.position.y + block.y // 上に向かうので+
      );
      mesh.position.set(worldPos.x, worldPos.y, worldPos.z);
      this.renderer.scene.add(mesh);
      this.currentPiece!.meshes.push(mesh);
    });

    if (this.checkCollision(0, 0)) {
      this.state.gameOver = true;
      console.log('Game Over!');
    }
  }

  private getWorldPosition(gridX: number, gridY: number): THREE.Vector3 {
    return new THREE.Vector3(gridX, gridY, 0);
  }

  private checkCollision(offsetX: number, offsetY: number): boolean {
    if (!this.currentPiece) return false;

    const { shape, position } = this.currentPiece;

    for (const block of shape.blocks) {
      const x = position.x + block.x + offsetX;
      const y = position.y + block.y + offsetY;

      // 境界チェック（上方向に移動するので上限をチェック）
      if (x < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) {
        return true;
      }

      // グリッド衝突チェック
      if (y >= 0 && y < GRID_HEIGHT && this.grid[y][x] !== null) {
        return true;
      }
    }

    return false;
  }

  private movePiece(offsetX: number, offsetY: number): boolean {
    if (!this.currentPiece) return false;

    if (!this.checkCollision(offsetX, offsetY)) {
      this.currentPiece.position.x += offsetX;
      this.currentPiece.position.y += offsetY;
      this.updatePieceMeshes();
      return true;
    }

    return false;
  }

  private updatePieceMeshes() {
    if (!this.currentPiece) return;

    this.currentPiece.meshes.forEach((mesh, i) => {
      const block = this.currentPiece!.shape.blocks[i];
      const worldPos = this.getWorldPosition(
        this.currentPiece!.position.x + block.x,
        this.currentPiece!.position.y + block.y
      );
      mesh.position.set(worldPos.x, worldPos.y, worldPos.z);
    });
  }

  private rotatePiece(clockwise = true) {
    if (!this.currentPiece) return;

    const { shape } = this.currentPiece;
    const rotatedBlocks: BlockPosition[] = clockwise
      ? shape.blocks.map((block) => ({
          x: -block.y,
          y: block.x,
        }))
      : shape.blocks.map((block) => ({
          x: block.y,
          y: -block.x,
        }));

    const originalBlocks = [...shape.blocks];
    shape.blocks = rotatedBlocks;

    if (this.checkCollision(0, 0)) {
      shape.blocks = originalBlocks;
    } else {
      this.updatePieceMeshes();
    }
  }

  private lockPiece() {
    if (!this.currentPiece) return;

    const { shape, position } = this.currentPiece;

    shape.blocks.forEach((block, i) => {
      const x = position.x + block.x;
      const y = position.y + block.y;

      if (y >= 0 && y < GRID_HEIGHT && x >= 0 && x < GRID_WIDTH) {
        this.grid[y][x] = this.currentPiece!.meshes[i];
      }
    });

    this.currentPiece = null;
    this.clearLines();
    this.spawnPiece();
  }

  private clearLines() {
    let linesCleared = 0;

    for (let y = 0; y < GRID_HEIGHT; y++) {
      if (this.grid[y].every((cell) => cell !== null)) {
        linesCleared++;

        this.grid[y].forEach((mesh) => {
          if (mesh) {
            this.renderer.scene.remove(mesh);
          }
        });

        // 下のブロックを上げる（重力反転なので）
        for (let yy = y; yy > 0; yy--) {
          this.grid[yy] = this.grid[yy - 1];
          this.grid[yy].forEach((mesh) => {
            if (mesh) {
              mesh.position.y += 1;
            }
          });
        }

        this.grid[0] = Array(GRID_WIDTH).fill(null);
        y--; // 同じ行を再チェック
      }
    }

    if (linesCleared > 0) {
      this.state.lines += linesCleared;
      this.state.score += linesCleared * 100 * this.state.level;
      this.state.level = Math.floor(this.state.lines / 10) + 1;
      this.dropInterval = Math.max(100, 1000 - this.state.level * 50);
    }
  }

  moveLeft() {
    this.movePiece(-1, 0);
  }

  moveRight() {
    this.movePiece(1, 0);
  }

  moveDown() {
    // 重力反転なので上に移動
    if (!this.movePiece(0, 1)) {
      this.lockPiece();
    }
  }

  rotate() {
    this.rotatePiece(true);
  }

  rotateCounterClockwise() {
    this.rotatePiece(false);
  }

  hardDrop() {
    while (this.movePiece(0, 1)) {
      // 上に移動し続ける
    }
    this.lockPiece();
  }

  update(time: number) {
    if (this.state.gameOver) return;

    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    this.dropCounter += deltaTime;

    if (this.dropCounter > this.dropInterval) {
      this.moveDown();
      this.dropCounter = 0;
    }

    if (this.currentPiece) {
      this.currentPiece.meshes.forEach((mesh) => {
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;
      });
    }
  }

  getState(): GameState {
    return { ...this.state };
  }

  destroy() {
    if (this.currentPiece) {
      this.currentPiece.meshes.forEach((mesh) => this.renderer.scene.remove(mesh));
    }

    this.grid.forEach((row) => {
      row.forEach((mesh) => {
        if (mesh) this.renderer.scene.remove(mesh);
      });
    });
  }
}
