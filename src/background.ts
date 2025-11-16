import * as THREE from 'three';

interface ShootingStar {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
  age: number;
}

export class BackgroundEffects {
  private scene: THREE.Scene;
  private stars!: THREE.Points;
  private shootingStars: ShootingStar[] = [];
  private lastShootingStarTime = 0;
  private shootingStarInterval = 2000; // 2秒ごと

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createStarField();
  }

  private createStarField() {
    // 星空の作成（パーティクルシステム）
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;

      // ランダムな位置に配置（広範囲に）
      positions[i3] = (Math.random() - 0.5) * 200;
      positions[i3 + 1] = (Math.random() - 0.5) * 200;
      positions[i3 + 2] = -50 - Math.random() * 50; // 背景の奥に

      // 色のバリエーション（白～青白～ピンクっぽい星）
      const colorChoice = Math.random();
      if (colorChoice < 0.7) {
        // 白っぽい星
        colors[i3] = 1;
        colors[i3 + 1] = 1;
        colors[i3 + 2] = 1;
      } else if (colorChoice < 0.85) {
        // 青白い星
        colors[i3] = 0.7;
        colors[i3 + 1] = 0.8;
        colors[i3 + 2] = 1;
      } else {
        // ピンクっぽい星
        colors[i3] = 1;
        colors[i3 + 1] = 0.8;
        colors[i3 + 2] = 0.9;
      }

      // サイズのバリエーション
      sizes[i] = Math.random() * 2 + 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: false,
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  private createShootingStar() {
    // 流れ星の生成
    const geometry = new THREE.CylinderGeometry(0.05, 0.02, 3, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // ランダムな開始位置（画面外から）
    const startX = (Math.random() - 0.5) * 100;
    const startY = 30 + Math.random() * 20;
    const startZ = -20 - Math.random() * 30;

    mesh.position.set(startX, startY, startZ);

    // 速度（斜め下に）
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      -0.5 - Math.random() * 0.3,
      Math.random() * 0.1
    );

    // 軌跡の向きに回転
    const direction = velocity.clone().normalize();
    const axis = new THREE.Vector3(0, 1, 0);
    const angle = Math.acos(axis.dot(direction));
    const rotationAxis = new THREE.Vector3().crossVectors(axis, direction).normalize();
    mesh.setRotationFromAxisAngle(rotationAxis, angle);

    this.scene.add(mesh);

    const shootingStar: ShootingStar = {
      mesh,
      velocity,
      lifetime: 3000, // 3秒
      age: 0,
    };

    this.shootingStars.push(shootingStar);
  }

  update(deltaTime: number, currentTime: number) {
    // 星をゆっくり回転させる
    if (this.stars) {
      this.stars.rotation.z += 0.0001;
    }

    // 流れ星を定期的に生成
    if (currentTime - this.lastShootingStarTime > this.shootingStarInterval) {
      // ランダムに1〜3個生成
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        this.createShootingStar();
      }
      this.lastShootingStarTime = currentTime;
      // 次の間隔をランダム化
      this.shootingStarInterval = 2000 + Math.random() * 3000;
    }

    // 流れ星の更新
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const star = this.shootingStars[i];
      star.age += deltaTime;

      // 位置を更新
      star.mesh.position.add(star.velocity);

      // フェードアウト
      const fadeProgress = star.age / star.lifetime;
      const material = star.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 1 - fadeProgress);

      // 寿命が尽きたら削除
      if (star.age >= star.lifetime) {
        this.scene.remove(star.mesh);
        star.mesh.geometry.dispose();
        material.dispose();
        this.shootingStars.splice(i, 1);
      }
    }
  }

  dispose() {
    // 星空の削除
    if (this.stars) {
      this.scene.remove(this.stars);
      this.stars.geometry.dispose();
      (this.stars.material as THREE.Material).dispose();
    }

    // 流れ星の削除
    this.shootingStars.forEach((star) => {
      this.scene.remove(star.mesh);
      star.mesh.geometry.dispose();
      (star.mesh.material as THREE.Material).dispose();
    });
    this.shootingStars = [];
  }
}
