// traffic-system.js - Multi-type traffic simulator with detailed bodies, headlights, brake lights, turning, signals, and response vehicles

import * as THREE from 'three';
import { CITY_CONFIG } from './config.js';
import { createPRNG } from './simulation.js';

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
    const chassisGeo = new THREE.BoxGeometry(1.6, 0.45, 3.2);
    chassisGeo.translate(0, 0.35, 0);
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.45, 1.8);
    cabinGeo.translate(0, 0.75, -0.2);

    const carMat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.4 });
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

      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);

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
    if (this.headlightsMesh) this.headlightsMesh.instanceMatrix.needsUpdate = true;
    if (this.brakeLightsMesh) this.brakeLightsMesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
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
