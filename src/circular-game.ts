import * as THREE from 'three';
import { GameState, TetrominoShape } from './types';
import { CLASSIC_SHAPES } from './shapes';
import { GameRenderer } from './renderer';

const CIRCULAR_RINGS = 12; // 円の層の数
const BLOCKS_PER_RING = 16; // 各リングのブロック数
const BLOCK_SIZE = 0.8;
const RING_RADIUS_STEP = 1.2;

export class CircularTetrisGame {
  private renderer: GameRenderer;
  private state: GameState;
  private grid: Map<string, THREE.Mesh>; // "ring:index" -> mesh
  private currentPiece: {
    shape: TetrominoShape;
    ring: number; // 外周からの距離
    index: number; // リング上の位置
    rotation: number;
    meshes: THREE.Mesh[];
  } | null = null;

  private dropCounter = 0;
  private dropInterval = 1500;
  private lastTime = 0;

  private shapes: TetrominoShape[] = CLASSIC_SHAPES;

  constructor(renderer: GameRenderer) {
    this.renderer = renderer;
    this.state = {
      mode: 'circular',
      score: 0,
      level: 1,
      lines: 0,
      gameOver: false,
    };

    this.grid = new Map();

    this.setupCircularGrid();
    this.spawnPiece();
  }

  private setupCircularGrid() {
    // 円形のグリッドガイドを描画
    for (let ring = 0; ring < CIRCULAR_RINGS; ring++) {
      const radius = (CIRCULAR_RINGS - ring) * RING_RADIUS_STEP;
      const circleGeometry = new THREE.RingGeometry(
        radius - 0.05,
        radius + 0.05,
        BLOCKS_PER_RING
      );
      const circleMaterial = new THREE.MeshBasicMaterial({
        color: 0x333333,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
      });
      const circle = new THREE.Mesh(circleGeometry, circleMaterial);
      circle.rotation.x = -Math.PI / 2;
      this.renderer.scene.add(circle);
    }

    // 中心のターゲット
    const centerGeometry = new THREE.CircleGeometry(RING_RADIUS_STEP * 0.8, 32);
    const centerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.3,
    });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.rotation.x = -Math.PI / 2;
    this.renderer.scene.add(center);
  }

  private getRingPosition(ring: number, index: number): THREE.Vector3 {
    const radius = (CIRCULAR_RINGS - ring) * RING_RADIUS_STEP;
    const angle = (index / BLOCKS_PER_RING) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    return new THREE.Vector3(x, 0, z);
  }

  private createBlockMesh(color: number): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    const material = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
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
    const startRing = 0; // 外周から
    const startIndex = Math.floor(Math.random() * BLOCKS_PER_RING);

    this.currentPiece = {
      shape,
      ring: startRing,
      index: startIndex,
      rotation: 0,
      meshes: [],
    };

    // 簡略化: 4ブロックを円周上に配置
    const positions = this.getCircularBlockPositions(shape, startRing, startIndex);

    positions.forEach((pos) => {
      const mesh = this.createBlockMesh(shape.color);
      mesh.position.copy(pos);
      this.renderer.scene.add(mesh);
      this.currentPiece!.meshes.push(mesh);
    });

    // 衝突チェック
    if (this.checkCollision(0, 0)) {
      this.state.gameOver = true;
      console.log('Game Over!');
    }
  }

  private getCircularBlockPositions(
    shape: TetrominoShape,
    ring: number,
    index: number
  ): THREE.Vector3[] {
    // 簡略化: ブロックを円周上に配置
    const positions: THREE.Vector3[] = [];

    shape.blocks.forEach((block, i) => {
      const blockIndex = (index + i) % BLOCKS_PER_RING;
      const pos = this.getRingPosition(ring, blockIndex);
      pos.y = block.y * BLOCK_SIZE; // 高さは維持
      positions.push(pos);
    });

    return positions;
  }

  private checkCollision(ringOffset: number, indexOffset: number): boolean {
    if (!this.currentPiece) return false;

    const { shape, ring, index } = this.currentPiece;
    const newRing = ring + ringOffset;

    // リングの境界チェック
    if (newRing >= CIRCULAR_RINGS) {
      return true;
    }

    // 各ブロックの衝突チェック
    for (let i = 0; i < shape.blocks.length; i++) {
      const blockIndex = (index + indexOffset + i + BLOCKS_PER_RING) % BLOCKS_PER_RING;
      const key = `${newRing}:${blockIndex}`;

      if (this.grid.has(key)) {
        return true;
      }
    }

    return false;
  }

  private movePiece(ringOffset: number, indexOffset: number): boolean {
    if (!this.currentPiece) return false;

    if (!this.checkCollision(ringOffset, indexOffset)) {
      this.currentPiece.ring += ringOffset;
      this.currentPiece.index =
        (this.currentPiece.index + indexOffset + BLOCKS_PER_RING) % BLOCKS_PER_RING;
      this.updatePieceMeshes();
      return true;
    }

    return false;
  }

  private updatePieceMeshes() {
    if (!this.currentPiece) return;

    const positions = this.getCircularBlockPositions(
      this.currentPiece.shape,
      this.currentPiece.ring,
      this.currentPiece.index
    );

    this.currentPiece.meshes.forEach((mesh, i) => {
      mesh.position.copy(positions[i]);
    });
  }

  private lockPiece() {
    if (!this.currentPiece) return;

    const { ring, index } = this.currentPiece;

    this.currentPiece.meshes.forEach((mesh, i) => {
      const blockIndex = (index + i) % BLOCKS_PER_RING;
      const key = `${ring}:${blockIndex}`;
      this.grid.set(key, mesh);
    });

    this.currentPiece = null;
    this.clearRings();
    this.spawnPiece();
  }

  private clearRings() {
    let ringsCleared = 0;

    // 各リングをチェック
    for (let ring = 0; ring < CIRCULAR_RINGS; ring++) {
      let isFull = true;

      for (let i = 0; i < BLOCKS_PER_RING; i++) {
        const key = `${ring}:${i}`;
        if (!this.grid.has(key)) {
          isFull = false;
          break;
        }
      }

      if (isFull) {
        ringsCleared++;

        // リングを削除
        for (let i = 0; i < BLOCKS_PER_RING; i++) {
          const key = `${ring}:${i}`;
          const mesh = this.grid.get(key);
          if (mesh) {
            this.renderer.scene.remove(mesh);
            this.grid.delete(key);
          }
        }

        // 外側のブロックを内側に移動
        const newGrid = new Map<string, THREE.Mesh>();

        this.grid.forEach((mesh, key) => {
          const [r, idx] = key.split(':').map(Number);
          if (r < ring) {
            const newKey = `${r + 1}:${idx}`;
            newGrid.set(newKey, mesh);

            // メッシュの位置を更新
            const newPos = this.getRingPosition(r + 1, idx);
            mesh.position.x = newPos.x;
            mesh.position.z = newPos.z;
          } else {
            newGrid.set(key, mesh);
          }
        });

        this.grid = newGrid;
      }
    }

    if (ringsCleared > 0) {
      this.state.lines += ringsCleared;
      this.state.score += ringsCleared * 200 * this.state.level;
      this.state.level = Math.floor(this.state.lines / 5) + 1;
      this.dropInterval = Math.max(200, 1500 - this.state.level * 100);
    }
  }

  moveLeft() {
    this.movePiece(0, -1);
  }

  moveRight() {
    this.movePiece(0, 1);
  }

  moveDown() {
    if (!this.movePiece(1, 0)) {
      this.lockPiece();
    }
  }

  rotate() {
    // 円形モードでは回転は移動に変換（右に移動）
    this.movePiece(0, 1);
  }

  rotateCounterClockwise() {
    // 円形モードでは回転は移動に変換（左に移動）
    this.movePiece(0, -1);
  }

  hardDrop() {
    while (this.movePiece(1, 0)) {
      // 中心に向かって移動
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
    if (this.currentPiece) {
      this.currentPiece.meshes.forEach((mesh) => {
        mesh.rotation.x += 0.02;
        mesh.rotation.y += 0.02;
      });
    }

    // グリッドのブロックも回転
    this.grid.forEach((mesh) => {
      mesh.rotation.y += 0.005;
    });
  }

  getState(): GameState {
    return { ...this.state };
  }

  destroy() {
    if (this.currentPiece) {
      this.currentPiece.meshes.forEach((mesh) => this.renderer.scene.remove(mesh));
    }

    this.grid.forEach((mesh) => this.renderer.scene.remove(mesh));
    this.grid.clear();
  }
}
