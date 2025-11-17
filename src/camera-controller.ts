import * as THREE from 'three';

/**
 * CameraController: 人間の目の動きを模倣した自然なカメラの揺れを実現
 */
export class CameraController {
  private camera: THREE.OrthographicCamera;
  private basePosition: THREE.Vector3;
  private baseLookAt: THREE.Vector3;

  // 現在のオフセット
  private currentPositionOffset = new THREE.Vector3();
  private currentLookAtOffset = new THREE.Vector3();

  // ターゲットオフセット
  private targetPositionOffset = new THREE.Vector3();
  private targetLookAtOffset = new THREE.Vector3();

  // タイマー
  private nextTargetTime = 0;
  private targetInterval = 3000; // 3秒ごとに新しいターゲット

  // イージングパラメータ
  private lerpSpeed = 0.02; // ゆっくりとしたイージング

  // 揺れの範囲
  private positionRange = {
    x: 0.3,
    y: 0.3,
    z: 1.0,
  };

  private lookAtRange = {
    x: 0.5,
    y: 0.5,
    z: 0,
  };

  constructor(camera: THREE.OrthographicCamera, basePosition: THREE.Vector3, baseLookAt: THREE.Vector3) {
    this.camera = camera;
    this.basePosition = basePosition.clone();
    this.baseLookAt = baseLookAt.clone();

    // 初期ターゲットを設定
    this.generateNewTarget();
  }

  private generateNewTarget() {
    // ランダムなターゲットオフセットを生成
    this.targetPositionOffset.set(
      (Math.random() - 0.5) * 2 * this.positionRange.x,
      (Math.random() - 0.5) * 2 * this.positionRange.y,
      (Math.random() - 0.5) * 2 * this.positionRange.z
    );

    this.targetLookAtOffset.set(
      (Math.random() - 0.5) * 2 * this.lookAtRange.x,
      (Math.random() - 0.5) * 2 * this.lookAtRange.y,
      0
    );

    // 次のターゲット変更までの時間をランダム化（2〜4秒）
    this.targetInterval = 2000 + Math.random() * 2000;
  }

  update(currentTime: number) {
    // 新しいターゲットを生成するタイミング
    if (currentTime > this.nextTargetTime) {
      this.generateNewTarget();
      this.nextTargetTime = currentTime + this.targetInterval;
    }

    // 現在のオフセットをターゲットに向けてイージング
    this.currentPositionOffset.lerp(this.targetPositionOffset, this.lerpSpeed);
    this.currentLookAtOffset.lerp(this.targetLookAtOffset, this.lerpSpeed);

    // カメラの位置と視点を更新
    const newPosition = this.basePosition.clone().add(this.currentPositionOffset);
    const newLookAt = this.baseLookAt.clone().add(this.currentLookAtOffset);

    this.camera.position.copy(newPosition);
    this.camera.lookAt(newLookAt);
  }

  // ベース位置を更新（モード切り替え時など）
  setBasePosition(position: THREE.Vector3, lookAt: THREE.Vector3) {
    this.basePosition.copy(position);
    this.baseLookAt.copy(lookAt);

    // カメラをリセット
    this.camera.position.copy(position);
    this.camera.lookAt(lookAt);

    // オフセットをリセット
    this.currentPositionOffset.set(0, 0, 0);
    this.currentLookAtOffset.set(0, 0, 0);
    this.targetPositionOffset.set(0, 0, 0);
    this.targetLookAtOffset.set(0, 0, 0);
  }

  // 有効/無効を切り替え（円形モードなど特定のモードで無効にする）
  reset() {
    this.currentPositionOffset.set(0, 0, 0);
    this.currentLookAtOffset.set(0, 0, 0);
    this.targetPositionOffset.set(0, 0, 0);
    this.targetLookAtOffset.set(0, 0, 0);

    this.camera.position.copy(this.basePosition);
    this.camera.lookAt(this.baseLookAt);
  }
}
