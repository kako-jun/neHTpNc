import * as THREE from 'three';
import { GameMode, GameState, TetrominoShape, BlockPosition } from './types';
import { getShapesByMode } from './shapes';
import { GameRenderer } from './renderer';

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const BLOCK_SIZE = 1;

/**
 * Mirror Mode: 左右対称に2つのピースが同時に操作される鏡像テトリス
 */
export class MirrorGame {
  private renderer: GameRenderer;
  private state: GameState;
  private grid: (THREE.Mesh | null)[][];
  private leftPiece: {
    shape: TetrominoShape;
    position: BlockPosition;
    rotation: number;
    meshes: THREE.Mesh[];
  } | null = null;

  private rightPiece: {
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
    const frameMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 }); // 黄色で区別
    const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
    frame.position.set(GRID_WIDTH / 2 - 0.5, GRID_HEIGHT / 2 - 0.5, 0);
    this.renderer.scene.add(frame);

    // 中央のミラーライン
    const mirrorLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(GRID_WIDTH / 2 - 0.5, 0, 0.1),
      new THREE.Vector3(GRID_WIDTH / 2 - 0.5, GRID_HEIGHT, 0.1),
    ]);
    const mirrorLineMaterial = new THREE.LineBasicMaterial({
      color: 0xffff00,
      linewidth: 3,
    });
    const mirrorLine = new THREE.Line(mirrorLineGeometry, mirrorLineMaterial);
    this.renderer.scene.add(mirrorLine);
  }

  private createBlockMesh(color: number, isMirror = false): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(BLOCK_SIZE * 0.9, BLOCK_SIZE * 0.9, BLOCK_SIZE * 0.9);

    // ミラー側は少し透明にして区別
    const material = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: isMirror ? 0.3 : 0.5,
      shininess: 100,
      specular: 0xffffff,
      transparent: isMirror,
      opacity: isMirror ? 0.7 : 1.0,
    });

    const mesh = new THREE.Mesh(geometry, material);

    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    mesh.add(edges);

    return mesh;
  }

  private getMirrorX(x: number): number {
    // グリッドの中央を基準に鏡像の位置を計算
    const center = GRID_WIDTH / 2;
    return Math.floor(center + (center - x - 1));
  }

  private spawnPiece() {
    if (this.state.gameOver) return;

    const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
    const startX = 1; // 左側から開始
    const startY = GRID_HEIGHT - 1;

    // 左側のピース
    this.leftPiece = {
      shape: JSON.parse(JSON.stringify(shape)), // Deep copy
      position: { x: startX, y: startY },
      rotation: 0,
      meshes: [],
    };

    // 右側のピース（鏡像）
    this.rightPiece = {
      shape: JSON.parse(JSON.stringify(shape)), // Deep copy
      position: { x: this.getMirrorX(startX), y: startY },
      rotation: 0,
      meshes: [],
    };

    // 左側のメッシュを作成
    shape.blocks.forEach((block) => {
      const mesh = this.createBlockMesh(shape.color, false);
      const worldPos = this.getWorldPosition(
        this.leftPiece!.position.x + block.x,
        this.leftPiece!.position.y - block.y
      );
      mesh.position.set(worldPos.x, worldPos.y, worldPos.z);
      this.renderer.scene.add(mesh);
      this.leftPiece!.meshes.push(mesh);
    });

    // 右側のメッシュを作成（鏡像）
    shape.blocks.forEach((block) => {
      const mesh = this.createBlockMesh(shape.color, true);
      const mirrorX = -block.x; // X軸反転
      const worldPos = this.getWorldPosition(
        this.rightPiece!.position.x + mirrorX,
        this.rightPiece!.position.y - block.y
      );
      mesh.position.set(worldPos.x, worldPos.y, worldPos.z);
      this.renderer.scene.add(mesh);
      this.rightPiece!.meshes.push(mesh);
    });

    // 衝突チェック
    if (this.checkCollision(0, 0)) {
      this.state.gameOver = true;
      console.log('Game Over!');
    }
  }

  private getWorldPosition(gridX: number, gridY: number): THREE.Vector3 {
    return new THREE.Vector3(gridX, gridY, 0);
  }

  private checkCollision(offsetX: number, offsetY: number): boolean {
    if (!this.leftPiece || !this.rightPiece) return false;

    // 左側のピースのチェック
    for (const block of this.leftPiece.shape.blocks) {
      const x = this.leftPiece.position.x + block.x + offsetX;
      const y = this.leftPiece.position.y - block.y + offsetY;

      if (x < 0 || x >= GRID_WIDTH || y < 0) {
        return true;
      }

      if (y < GRID_HEIGHT && this.grid[y][x] !== null) {
        return true;
      }
    }

    // 右側のピースのチェック
    for (const block of this.rightPiece.shape.blocks) {
      const mirrorX = -block.x;
      const x = this.rightPiece.position.x + mirrorX + offsetX;
      const y = this.rightPiece.position.y - block.y + offsetY;

      if (x < 0 || x >= GRID_WIDTH || y < 0) {
        return true;
      }

      if (y < GRID_HEIGHT && this.grid[y][x] !== null) {
        return true;
      }
    }

    return false;
  }

  private movePiece(offsetX: number, offsetY: number): boolean {
    if (!this.leftPiece || !this.rightPiece) return false;

    if (!this.checkCollision(offsetX, offsetY)) {
      this.leftPiece.position.x += offsetX;
      this.leftPiece.position.y += offsetY;
      this.rightPiece.position.x += offsetX; // 同じ方向に移動
      this.rightPiece.position.y += offsetY;
      this.updatePieceMeshes();
      return true;
    }

    return false;
  }

  private updatePieceMeshes() {
    if (!this.leftPiece || !this.rightPiece) return;

    // 左側のメッシュ更新
    this.leftPiece.meshes.forEach((mesh, i) => {
      const block = this.leftPiece!.shape.blocks[i];
      const worldPos = this.getWorldPosition(
        this.leftPiece!.position.x + block.x,
        this.leftPiece!.position.y - block.y
      );
      mesh.position.set(worldPos.x, worldPos.y, worldPos.z);
    });

    // 右側のメッシュ更新
    this.rightPiece.meshes.forEach((mesh, i) => {
      const block = this.rightPiece!.shape.blocks[i];
      const mirrorX = -block.x;
      const worldPos = this.getWorldPosition(
        this.rightPiece!.position.x + mirrorX,
        this.rightPiece!.position.y - block.y
      );
      mesh.position.set(worldPos.x, worldPos.y, worldPos.z);
    });
  }

  private rotatePiece(clockwise = true) {
    if (!this.leftPiece || !this.rightPiece) return;

    const rotatedBlocks: BlockPosition[] = clockwise
      ? this.leftPiece.shape.blocks.map((block) => ({
          x: -block.y,
          y: block.x,
        }))
      : this.leftPiece.shape.blocks.map((block) => ({
          x: block.y,
          y: -block.x,
        }));

    const originalBlocks = [...this.leftPiece.shape.blocks];
    this.leftPiece.shape.blocks = rotatedBlocks;
    this.rightPiece.shape.blocks = [...rotatedBlocks]; // 同じ回転

    if (this.checkCollision(0, 0)) {
      this.leftPiece.shape.blocks = originalBlocks;
      this.rightPiece.shape.blocks = [...originalBlocks];
    } else {
      this.updatePieceMeshes();
    }
  }

  private lockPiece() {
    if (!this.leftPiece || !this.rightPiece) return;

    // 左側のピースをロック
    this.leftPiece.shape.blocks.forEach((block, i) => {
      const x = this.leftPiece!.position.x + block.x;
      const y = this.leftPiece!.position.y - block.y;

      if (y >= 0 && y < GRID_HEIGHT && x >= 0 && x < GRID_WIDTH) {
        this.grid[y][x] = this.leftPiece!.meshes[i];
      }
    });

    // 右側のピースをロック
    this.rightPiece.shape.blocks.forEach((block, i) => {
      const mirrorX = -block.x;
      const x = this.rightPiece!.position.x + mirrorX;
      const y = this.rightPiece!.position.y - block.y;

      if (y >= 0 && y < GRID_HEIGHT && x >= 0 && x < GRID_WIDTH) {
        this.grid[y][x] = this.rightPiece!.meshes[i];
      }
    });

    this.leftPiece = null;
    this.rightPiece = null;
    this.clearLines();
    this.spawnPiece();
  }

  private clearLines() {
    let linesCleared = 0;

    for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
      if (this.grid[y].every((cell) => cell !== null)) {
        linesCleared++;

        this.grid[y].forEach((mesh) => {
          if (mesh) {
            this.renderer.scene.remove(mesh);
          }
        });

        for (let yy = y; yy < GRID_HEIGHT - 1; yy++) {
          this.grid[yy] = this.grid[yy + 1];
          this.grid[yy].forEach((mesh) => {
            if (mesh) {
              mesh.position.y -= 1;
            }
          });
        }

        this.grid[GRID_HEIGHT - 1] = Array(GRID_WIDTH).fill(null);
        y++;
      }
    }

    if (linesCleared > 0) {
      this.state.lines += linesCleared;
      // ミラーモードはより難しいのでボーナススコア
      this.state.score += linesCleared * 150 * this.state.level;
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
    if (!this.movePiece(0, -1)) {
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
    while (this.movePiece(0, -1)) {
      // 下に移動し続ける
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

    // 回転アニメーション
    if (this.leftPiece && this.rightPiece) {
      this.leftPiece.meshes.forEach((mesh) => {
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;
      });
      this.rightPiece.meshes.forEach((mesh) => {
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;
      });
    }
  }

  getState(): GameState {
    return { ...this.state };
  }

  destroy() {
    if (this.leftPiece) {
      this.leftPiece.meshes.forEach((mesh) => this.renderer.scene.remove(mesh));
    }
    if (this.rightPiece) {
      this.rightPiece.meshes.forEach((mesh) => this.renderer.scene.remove(mesh));
    }

    this.grid.forEach((row) => {
      row.forEach((mesh) => {
        if (mesh) this.renderer.scene.remove(mesh);
      });
    });
  }
}
