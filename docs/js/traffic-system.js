// traffic-system.js - Multi-type traffic simulator with detailed bodies, headlights, brake lights, turning, signals, and response vehicles

import * as THREE from 'three';
import { CITY_CONFIG } from './config.js';
import { createPRNG } from './simulation.js';
import { mergeParts, box, cyl } from './geo-utils.js';

export class TrafficSystem {
  constructor(scene, carCount = 90, seed = 42) {
    this.scene = scene;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    this.carCount = isMobile ? 40 : Math.min(carCount, 110);
    this.seed = seed;
    this.cars = [];
    this.dummy = new THREE.Object3D();
    this.colorHelper = new THREE.Color();

    // Muted realistic automotive palette
    this.carPalette = [
      0xE8E6E1, // White
      0x1E232A, // Black/Charcoal
      0x8A929C, // Silver
      0x546274, // Slate Grey
      0x2A4870, // Dark Navy
      0x8C3337, // Muted Red
      0x2E5339  // Forest Green
    ];

    this.init();
  }

  init() {
    const rng = createPRNG(this.seed + 888);
    const { gridSize, blockSize, streetWidth, riverWidth, riverBlockIndex } = CITY_CONFIG;
    const totalSpan = gridSize * blockSize + (gridSize - 1) * streetWidth + riverWidth;
    const halfSpan = totalSpan / 2;

    // Compound vehicle geometry with cab and wheels for scale model realism
    // v3: painted body (lower body, hood, trunk, roof) + a dark detail mesh (glass, wheels, lights) sharing each car's matrix
    const chassisGeo = mergeParts([
      { geo: box(1.62, 0.5, 3.5), pos: [0, 0.48, 0] },
      { geo: box(1.5, 0.12, 1.75), pos: [0, 1.11, -0.25] },
      { geo: box(1.58, 0.08, 0.9), pos: [0, 0.76, 1.2] },
    ]);
    const detailGeo = mergeParts([
      { geo: box(1.48, 0.42, 1.7), pos: [0, 0.92, -0.25] }, // glasshouse
      ...[[-0.78, 1.15], [0.78, 1.15], [-0.78, -1.15], [0.78, -1.15]].map(([x, z]) => ({ geo: cyl(0.34, 0.34, 0.26, 12), pos: [x, 0.34, z], rot: [0, 0, Math.PI / 2] })),
      { geo: box(1.66, 0.14, 0.12), pos: [0, 0.38, 1.76] }, { geo: box(1.66, 0.14, 0.12), pos: [0, 0.38, -1.76] }, // bumpers
    ]);
    this.detailMesh = new THREE.InstancedMesh(detailGeo, new THREE.MeshStandardMaterial({ color: 0x14181d, roughness: 0.25, metalness: 0.6 }), this.carCount);
    this.detailMesh.castShadow = true;
    this.scene.add(this.detailMesh);

    const carMat = new THREE.MeshStandardMaterial({ roughness: 0.28, metalness: 0.55 });
    this.mesh = new THREE.InstancedMesh(chassisGeo, carMat, this.carCount);
    this.mesh.castShadow = true;
    this.mesh.name = 'instanced_cars';
    this.scene.add(this.mesh);

    // Car Headlights (Forward light beam cone)
    const lightBeamGeo = new THREE.PlaneGeometry(1.4, 3.5);
    lightBeamGeo.rotateX(-Math.PI / 2);
    lightBeamGeo.translate(0, 0.05, 2.5);
    const headMat = new THREE.MeshBasicMaterial({
      color: 0xFFF0B3,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });
    this.headlightsMesh = new THREE.InstancedMesh(lightBeamGeo, headMat, this.carCount);
    this.scene.add(this.headlightsMesh);

    // Brake Light mesh (Red illumination behind car)
    const brakeBeamGeo = new THREE.PlaneGeometry(1.4, 1.2);
    brakeBeamGeo.rotateX(-Math.PI / 2);
    brakeBeamGeo.translate(0, 0.05, -1.8);
    const brakeMat = new THREE.MeshBasicMaterial({
      color: 0xE5484D,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });
    this.brakeLightsMesh = new THREE.InstancedMesh(brakeBeamGeo, brakeMat, this.carCount);
    this.scene.add(this.brakeLightsMesh);

    // Generate Road Tracks
    this.xRoads = [];
    for (let gx = 0; gx <= gridSize; gx++) {
      this.xRoads.push(-halfSpan + gx * (blockSize + streetWidth));
    }

    this.zRoads = [];
    for (let gz = 0; gz <= gridSize; gz++) {
      let z = -halfSpan + gz * (blockSize + streetWidth);
      if (gz >= riverBlockIndex) z += riverWidth;
      this.zRoads.push(z);
    }

    for (let i = 0; i < this.carCount; i++) {
      const isNorthSouth = rng() > 0.5;
      const roadX = this.xRoads[Math.floor(rng() * this.xRoads.length)];
      const roadZ = this.zRoads[Math.floor(rng() * this.zRoads.length)];
      const direction = rng() > 0.5 ? 1 : -1;
      const speed = 7.0 + rng() * 10.0;
      const laneOffset = (direction > 0 ? 1 : -1) * (streetWidth * 0.22);

      // 10% chance to be bus, 10% emergency response vehicle
      const isBus = i % 10 === 0;
      const isEmergency = i % 15 === 1;

      let x, z;
      if (isNorthSouth) {
        x = roadX + laneOffset;
        z = (rng() - 0.5) * totalSpan;
      } else {
        x = (rng() - 0.5) * totalSpan;
        z = roadZ + laneOffset;
      }

      let color = this.carPalette[Math.floor(rng() * this.carPalette.length)];
      if (isBus) color = 0x3B82D4; // Blue municipal bus
      if (isEmergency) color = 0xE5484D; // Emergency red

      this.colorHelper.setHex(color);
      this.mesh.setColorAt(i, this.colorHelper);

      this.cars.push({
        id: i,
        isNorthSouth,
        roadX,
        roadZ,
        x,
        z,
        y: 0.12,
        direction,
        baseSpeed: isEmergency ? speed * 1.5 : speed,
        currentSpeed: speed,
        laneOffset,
        totalSpan,
        isBus,
        isEmergency,
        busStopTimer: 0,
        isBraking: false
      });
    }

    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  update(dt, incidentBlocks = []) {
    const half = (CITY_CONFIG.gridSize * CITY_CONFIG.blockSize + (CITY_CONFIG.gridSize - 1) * CITY_CONFIG.streetWidth + CITY_CONFIG.riverWidth) / 2;
    const zeroScale = new THREE.Matrix4().makeScale(0, 0, 0);

    for (let i = 0; i < this.cars.length; i++) {
      const c = this.cars[i];

      // 1. Bus Stop Pauses
      if (c.isBus) {
        if (c.busStopTimer > 0) {
          c.busStopTimer -= dt;
          c.currentSpeed = 0;
          c.isBraking = true;
        } else if (Math.random() < 0.001) {
          c.busStopTimer = 3.0 + Math.random() * 2.0; // Stop for 3-5s
        }
      }

      // 2. Proximity to incidents & emergency vehicle yield
      let targetSpeed = c.baseSpeed;
      c.isBraking = false;

      for (const inc of incidentBlocks) {
        const distSq = (c.x - inc.x) ** 2 + (c.z - inc.z) ** 2;
        if (distSq < 196) {
          targetSpeed = inc.stopsTraffic ? 0.0 : c.baseSpeed * 0.25;
          c.isBraking = true;
          break;
        }
      }

      // Safe following distance behind car ahead in same lane
      for (let j = 0; j < this.cars.length; j++) {
        if (i === j) continue;
        const other = this.cars[j];
        if (other.isNorthSouth === c.isNorthSouth && other.direction === c.direction) {
          const latDiff = c.isNorthSouth ? Math.abs(c.x - other.x) : Math.abs(c.z - other.z);
          if (latDiff < 2.0) {
            const longDiff = c.isNorthSouth ? (other.z - c.z) * c.direction : (other.x - c.x) * c.direction;
            if (longDiff > 0 && longDiff < 7.0) {
              targetSpeed = Math.min(targetSpeed, other.currentSpeed * 0.8);
              c.isBraking = true;
            }
          }
        }
      }

      c.currentSpeed = THREE.MathUtils.lerp(c.currentSpeed, targetSpeed, 0.15);

      if (c.isNorthSouth) {
        c.z += c.direction * c.currentSpeed * dt;
        if (c.z > half) c.z = -half;
        if (c.z < -half) c.z = half;

        this.dummy.position.set(c.x, c.y, c.z);
        this.dummy.rotation.set(0, c.direction > 0 ? 0 : Math.PI, 0);
      } else {
        c.x += c.direction * c.currentSpeed * dt;
        if (c.x > half) c.x = -half;
        if (c.x < -half) c.x = half;

        this.dummy.position.set(c.x, c.y, c.z);
        this.dummy.rotation.set(0, c.direction > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
      }

      this.dummy.scale.set(c.isBus ? 1.45 : 1, c.isBus ? 1.9 : 1, c.isBus ? 2.6 : 1);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      if (this.detailMesh) this.detailMesh.setMatrixAt(i, this.dummy.matrix);
      this.dummy.scale.set(1, 1, 1); this.dummy.updateMatrix();

      if (this.headlightsMesh) {
        this.headlightsMesh.setMatrixAt(i, this.dummy.matrix);
      }

      // Brake light activation
      if (this.brakeLightsMesh) {
        if (c.isBraking) {
          this.brakeLightsMesh.setMatrixAt(i, this.dummy.matrix);
        } else {
          this.brakeLightsMesh.setMatrixAt(i, zeroScale);
        }
      }
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.detailMesh) this.detailMesh.instanceMatrix.needsUpdate = true;
    this.updatePeople(dt);
    if (this.headlightsMesh) this.headlightsMesh.instanceMatrix.needsUpdate = true;
    if (this.brakeLightsMesh) this.brakeLightsMesh.instanceMatrix.needsUpdate = true;
  }

  // ---------- v3: people walking the sidewalks ----------
  initPeople() {
    const rng = createPRNG(this.seed + 4242);
    const { gridSize, blockSize, streetWidth, riverWidth, riverBlockIndex } = CITY_CONFIG;
    const totalSpan = gridSize * blockSize + (gridSize - 1) * streetWidth + riverWidth; const halfSpan = totalSpan / 2;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const n = isMobile ? 90 : 240;
    const bodyGeo = mergeParts([
      { geo: cyl(0.2, 0.17, 0.62, 8), pos: [0, 1.0, 0] },      // torso
      { geo: box(0.13, 0.62, 0.15), pos: [-0.1, 0.38, 0] }, { geo: box(0.13, 0.62, 0.15), pos: [0.1, 0.38, 0] }, // legs
      { geo: box(0.09, 0.5, 0.11), pos: [-0.27, 0.98, 0] }, { geo: box(0.09, 0.5, 0.11), pos: [0.27, 0.98, 0] }, // arms
    ]);
    const headGeo = new THREE.SphereGeometry(0.15, 10, 8); headGeo.translate(0, 1.47, 0);
    this.people = new THREE.InstancedMesh(bodyGeo, new THREE.MeshStandardMaterial({ roughness: 0.8 }), n);
    this.heads = new THREE.InstancedMesh(headGeo, new THREE.MeshStandardMaterial({ roughness: 0.7 }), n);
    this.people.castShadow = true;
    const clothes = [0x2B3A55, 0x8C3337, 0x2E5339, 0xD9C9A8, 0x1E232A, 0x6B5B95, 0xC0763B, 0x4C8DFF, 0xE8E6E1, 0x7A7F87];
    const skin = [0xF1C9A5, 0xD9A47E, 0xB07A55, 0x8A5A3C, 0x5E3B26];
    const col = new THREE.Color();
    const blocks = [];
    for (let bx = 0; bx < gridSize; bx++) for (let bz = 0; bz < gridSize; bz++) {
      let x = -halfSpan + bx * (blockSize + streetWidth) + blockSize / 2, z = -halfSpan + bz * (blockSize + streetWidth) + blockSize / 2;
      if (bz >= riverBlockIndex) z += riverWidth;
      const busy = (bx >= 2 && bx <= 4 && bz >= 1 && bz <= 3) ? 3 : (bx >= 5 && bz >= 5) ? 0.4 : 1; // downtown is busier
      blocks.push({ x, z, w: busy });
    }
    const totalW = blocks.reduce((s, b) => s + b.w, 0);
    this.walkers = [];
    for (let i = 0; i < n; i++) {
      let r = rng() * totalW, b = blocks[0]; for (const bb of blocks) { r -= bb.w; if (r <= 0) { b = bb; break; } }
      const half = blockSize / 2 - 0.55;
      this.walkers.push({ b, half, s: rng() * 8 * half, dir: rng() > 0.5 ? 1 : -1, speed: 0.9 + rng() * 0.9, phase: rng() * 6.28, side: (rng() - 0.5) * 0.5 });
      this.people.setColorAt(i, col.setHex(clothes[Math.floor(rng() * clothes.length)]));
      this.heads.setColorAt(i, col.setHex(skin[Math.floor(rng() * skin.length)]));
    }
    this.people.instanceColor.needsUpdate = true; this.heads.instanceColor.needsUpdate = true;
    this.scene.add(this.people); this.scene.add(this.heads);
  }

  updatePeople(dt) {
    if (!this.people) this.initPeople();
    const d = this.dummy;
    for (let i = 0; i < this.walkers.length; i++) {
      const w = this.walkers[i]; const P = 8 * w.half;
      w.s = (w.s + w.dir * w.speed * dt + P) % P; w.phase += dt * w.speed * 7;
      // walk the block's perimeter: 4 sides of length 2*half
      const side = Math.floor(w.s / (2 * w.half)), t = w.s % (2 * w.half) - w.half, h = w.half + w.side;
      let x, z, ry;
      if (side === 0) { x = w.b.x + t; z = w.b.z - h; ry = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
      else if (side === 1) { x = w.b.x + h; z = w.b.z + t; ry = w.dir > 0 ? 0 : Math.PI; }
      else if (side === 2) { x = w.b.x - t; z = w.b.z + h; ry = w.dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
      else { x = w.b.x - h; z = w.b.z - t; ry = w.dir > 0 ? Math.PI : 0; }
      d.position.set(x, 0.25 + Math.abs(Math.sin(w.phase)) * 0.05, z); d.rotation.set(Math.sin(w.phase) * 0.04, ry, 0); d.scale.set(1, 1, 1); d.updateMatrix();
      this.people.setMatrixAt(i, d.matrix); this.heads.setMatrixAt(i, d.matrix);
    }
    this.people.instanceMatrix.needsUpdate = true; this.heads.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    for (const m of [this.detailMesh, this.people, this.heads, this.brakeLightsMesh]) { if (m) { this.scene.remove(m); m.geometry.dispose(); m.material.dispose(); } }
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
    if (this.headlightsMesh) {
      this.scene.remove(this.headlightsMesh);
      this.headlightsMesh.geometry.dispose();
      this.headlightsMesh.material.dispose();
    }
  }
}
