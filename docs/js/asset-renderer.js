// asset-renderer.js - InstancedMesh rendering, health colors, pulse animations, streetlight illumination pools, and glowing underground water network

import * as THREE from 'three';
import { CITY_CONFIG, COLORS, streetGrid } from './config.js';
import { createPRNG } from './simulation.js';
import { mergeParts, box, cyl } from './geo-utils.js';

export class AssetRenderer {
  constructor(scene, masterAssets, seed = 42) {
    this.scene = scene;
    this.masterAssets = masterAssets;
    this.seed = seed;
    this.undergroundVisible = false;
    this.labelsVisible = true;

    this.instancedMeshes = {};
    this.dummy = new THREE.Object3D();
    this.colorHelper = new THREE.Color();

    this.assetPositions = [];

    this.initMeshes();
    this.positionAssets();
  }

  initMeshes() {
    // 1. Streetlights (400)
    // v3: tapered pole, base, curved-out arm and a cobra-head luminaire (arm points toward the road, +x local)
    const postGeo = mergeParts([
      { geo: cyl(0.1, 0.17, 4.6, 8), pos: [0, 2.3, 0] },
      { geo: cyl(0.26, 0.3, 0.35, 8), pos: [0, 0.17, 0] },
      { geo: box(1.7, 0.09, 0.09), pos: [0.8, 4.45, 0], rot: [0, 0, 0.12] },
      { geo: box(0.75, 0.16, 0.34), pos: [1.65, 4.48, 0] },
    ]);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x99A3AD, roughness: 0.5, metalness: 0.8 });
    const streetlightMesh = new THREE.InstancedMesh(postGeo, postMat, 400);
    streetlightMesh.castShadow = true;
    streetlightMesh.name = 'instanced_streetlight';
    this.scene.add(streetlightMesh);
    this.instancedMeshes.streetlight = streetlightMesh;

    // Streetlight Hit Proxy (Enlarged cylinder for easy clicking/touching)
    const slProxyGeo = new THREE.CylinderGeometry(1.2, 1.2, 4.0, 8);
    slProxyGeo.translate(0, 2.0, 0);
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
    const slProxyMesh = new THREE.InstancedMesh(slProxyGeo, proxyMat, 400);
    slProxyMesh.name = 'proxy_streetlight';
    this.scene.add(slProxyMesh);
    this.proxyMeshes = this.proxyMeshes || {};
    this.proxyMeshes.streetlight = slProxyMesh;

    // Streetlight Ground Light Pools
    const poolGeo = new THREE.CircleGeometry(5.0, 14);
    poolGeo.rotateX(-Math.PI / 2);
    const poolMat = new THREE.MeshBasicMaterial({
      color: 0xFFE58F,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    this.streetlightPools = new THREE.InstancedMesh(poolGeo, poolMat, 400);
    this.streetlightPools.position.y = 0.08;
    this.scene.add(this.streetlightPools);

    // 2. Water Main Segments (300) - Glowing 3D network with Pipe Health Colors
    const pipeGeo = new THREE.CylinderGeometry(0.5, 0.5, 6.2, 8);
    pipeGeo.rotateX(Math.PI / 2);
    const pipeMat = new THREE.MeshBasicMaterial({
      color: 0x7FB98A,
      transparent: true,
      opacity: 0.95,
      depthWrite: true
    });
    const waterMainMesh = new THREE.InstancedMesh(pipeGeo, pipeMat, 300);
    waterMainMesh.name = 'instanced_waterMain';
    waterMainMesh.visible = this.undergroundVisible;
    this.scene.add(waterMainMesh);
    this.instancedMeshes.waterMain = waterMainMesh;

    // Water Main Hit Proxy (Wider cylinder)
    const wmProxyGeo = new THREE.CylinderGeometry(1.8, 1.8, 6.4, 8);
    wmProxyGeo.rotateX(Math.PI / 2);
    const wmProxyMesh = new THREE.InstancedMesh(wmProxyGeo, proxyMat, 300);
    wmProxyMesh.name = 'proxy_waterMain';
    wmProxyMesh.visible = this.undergroundVisible;
    this.scene.add(wmProxyMesh);
    this.proxyMeshes.waterMain = wmProxyMesh;

    // 3. Bridges (6)
    // v3: deck, railings, two concrete piers in the river and a steel arch on each side
    const archParts = [];
    for (let k = 0; k <= 10; k++) {
      const a = (k / 10) * Math.PI, z = -10 + (k / 10) * 20, y = 1.9 + Math.sin(a) * 4.2;
      for (const x of [-3.9, 3.9]) {
        archParts.push({ geo: box(0.3, 0.3, 2.3), pos: [x, y, z], rot: [-Math.cos(a) * 0.62, 0, 0] });
        if (k > 0 && k < 10 && k % 2 === 0) archParts.push({ geo: box(0.1, y - 1.9, 0.1), pos: [x, 1.9 + (y - 1.9) / 2, z] });
      }
    }
    const bridgeGeo = mergeParts([
      { geo: box(8.2, 0.7, 22.0), pos: [0, 1.5, 0] },
      { geo: box(0.25, 0.7, 22.0), pos: [-4.0, 2.2, 0] }, { geo: box(0.25, 0.7, 22.0), pos: [4.0, 2.2, 0] },
      { geo: box(6.5, 2.0, 1.4), pos: [0, 0.2, -4.5] }, { geo: box(6.5, 2.0, 1.4), pos: [0, 0.2, 4.5] },
      ...archParts,
    ]);
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x88929E, roughness: 0.7, metalness: 0.3 });
    const bridgeMesh = new THREE.InstancedMesh(bridgeGeo, bridgeMat, 6);
    bridgeMesh.castShadow = true;
    bridgeMesh.receiveShadow = true;
    bridgeMesh.name = 'instanced_bridge';
    this.scene.add(bridgeMesh);
    this.instancedMeshes.bridge = bridgeMesh;

    // 4. Traffic Signals (40)
    // v3: pole with a mast arm over the road and two signal heads
    const signalGeo = mergeParts([
      { geo: cyl(0.14, 0.18, 4.6, 8), pos: [0, 2.3, 0] },
      { geo: box(3.6, 0.13, 0.13), pos: [1.8, 4.4, 0] },
      { geo: box(0.38, 1.05, 0.34), pos: [2.3, 3.85, 0] }, { geo: box(0.38, 1.05, 0.34), pos: [3.4, 3.85, 0] },
      { geo: box(0.3, 0.6, 0.3), pos: [0, 2.6, 0.24] },
    ]);
    const signalMat = new THREE.MeshStandardMaterial({ color: 0x5C6675, roughness: 0.6 });
    const trafficSignalMesh = new THREE.InstancedMesh(signalGeo, signalMat, 40);
    trafficSignalMesh.castShadow = true;
    trafficSignalMesh.name = 'instanced_trafficSignal';
    this.scene.add(trafficSignalMesh);
    this.instancedMeshes.trafficSignal = trafficSignalMesh;

    // Traffic Signal Hit Proxy (Enlarged box)
    const sigProxyGeo = new THREE.BoxGeometry(2.4, 4.5, 2.4);
    sigProxyGeo.translate(0, 2.25, 0);
    const sigProxyMesh = new THREE.InstancedMesh(sigProxyGeo, proxyMat, 40);
    sigProxyMesh.name = 'proxy_trafficSignal';
    this.scene.add(sigProxyMesh);
    this.proxyMeshes.trafficSignal = sigProxyMesh;

    // 5. Pump Stations (12)
    // v3: block pump house with a slab roof overhang, roof vent, discharge pipes and a valve chamber
    const pumpGeo = mergeParts([
      { geo: box(4.5, 3.0, 4.0), pos: [0, 1.5, 0] },
      { geo: box(5.1, 0.3, 4.6), pos: [0, 3.15, 0] },
      { geo: cyl(0.4, 0.4, 1.0, 10), pos: [1.2, 3.8, 0.6] },
      { geo: cyl(0.32, 0.32, 3.2, 10), pos: [-2.9, 0.6, -0.8], rot: [0, 0, Math.PI / 2] },
      { geo: cyl(0.32, 0.32, 3.2, 10), pos: [-2.9, 0.6, 0.8], rot: [0, 0, Math.PI / 2] },
      { geo: box(1.6, 0.5, 1.6), pos: [-4.0, 0.25, 0] },
    ]);
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x6E7B8B, roughness: 0.6, metalness: 0.4 });
    const pumpMesh = new THREE.InstancedMesh(pumpGeo, pumpMat, 12);
    pumpMesh.castShadow = true;
    pumpMesh.receiveShadow = true;
    pumpMesh.name = 'instanced_pumpStation';
    this.scene.add(pumpMesh);
    this.instancedMeshes.pumpStation = pumpMesh;
  }

  positionAssets() {
    const rng = createPRNG(this.seed + 555);
    const { gridSize, blockSize, streetWidth, riverWidth, riverBlockIndex } = CITY_CONFIG;
    const totalSpan = gridSize * blockSize + (gridSize - 1) * streetWidth + riverWidth;
    const halfSpan = totalSpan / 2;
    const SG = streetGrid();
    const riverZPos = SG.riverZ;

    // v4: intersections are where the real streets cross
    const intersections = [];
    SG.xs.forEach((x, gx) => SG.zs.forEach((z, gz) => intersections.push({ x, z, gx, gz })));
    // spread the 40 signals across the grid instead of bunching them on the first streets
    intersections.sort((a, b) => ((a.gx * 7 + a.gz * 3) % 9) - ((b.gx * 7 + b.gz * 3) % 9) || a.gx - b.gx || a.gz - b.gz);

    // 1. Bridges: one on each bridged north-south street, spanning the river
    const bridgeXCoords = SG.bridgeKs.map((k) => SG.xs[k]);

    for (let i = 0; i < 6; i++) {
      const x = bridgeXCoords[i % bridgeXCoords.length];
      const z = riverZPos;
      this.dummy.position.set(x, -1.25, z); // deck top sits just above street level so cars drive across it
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();
      this.instancedMeshes.bridge.setMatrixAt(i, this.dummy.matrix);

      this.assetPositions.push({
        id: `BRI-${String(i + 1).padStart(4, '0')}`,
        type: 'bridge',
        instanceIndex: i,
        position: new THREE.Vector3(x, 1.2, z),
        street: `Bridge ${i + 1}`
      });
    }
    this.instancedMeshes.bridge.instanceMatrix.needsUpdate = true;

    // 2. Pump Stations
    const pumpLocations = [
      { x: -halfSpan + 1 * (blockSize + streetWidth) + 6, z: SG.riverMin - 12 },
      { x: -halfSpan + 3 * (blockSize + streetWidth) + 6, z: SG.riverMin - 12 },
      { x: -halfSpan + 5 * (blockSize + streetWidth) + 6, z: SG.riverMin - 12 },
      { x: -halfSpan + 7 * (blockSize + streetWidth) + 6, z: SG.riverMin - 12 },
      { x: -halfSpan + 2 * (blockSize + streetWidth) + 6, z: SG.riverMax + 10 },
      { x: -halfSpan + 4 * (blockSize + streetWidth) + 6, z: SG.riverMax + 10 },
      { x: -halfSpan + 6 * (blockSize + streetWidth) + 6, z: SG.riverMax + 10 },
      { x: halfSpan - 20, z: halfSpan - 20 },
      { x: halfSpan - 45, z: halfSpan - 20 },
      { x: -halfSpan + 25, z: -halfSpan + 25 },
      { x: halfSpan - 25, z: -halfSpan + 35 },
      { x: -halfSpan + 30, z: halfSpan - 30 }
    ];

    for (let i = 0; i < 12; i++) {
      const loc = pumpLocations[i];
      this.dummy.position.set(loc.x, 0.1, loc.z);
      this.dummy.rotation.set(0, rng() * Math.PI, 0);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();
      this.instancedMeshes.pumpStation.setMatrixAt(i, this.dummy.matrix);

      this.assetPositions.push({
        id: `PUM-${String(i + 1).padStart(4, '0')}`,
        type: 'pumpStation',
        instanceIndex: i,
        position: new THREE.Vector3(loc.x, 2.0, loc.z)
      });
    }
    this.instancedMeshes.pumpStation.instanceMatrix.needsUpdate = true;

    // 3. Traffic Signals
    for (let i = 0; i < 40; i++) {
      const inter = intersections[i % intersections.length];
      const offsetX = (rng() > 0.5 ? 1 : -1) * (streetWidth / 2 + 1.2);
      const offsetZ = (rng() > 0.5 ? 1 : -1) * (streetWidth / 2 + 1.2);
      const x = inter.x + offsetX;
      const z = inter.z + offsetZ;

      this.dummy.position.set(x, 0.1, z);
      this.dummy.rotation.set(0, (i % 4) * (Math.PI / 2), 0);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();
      this.instancedMeshes.trafficSignal.setMatrixAt(i, this.dummy.matrix);
      if (this.proxyMeshes?.trafficSignal) {
        this.proxyMeshes.trafficSignal.setMatrixAt(i, this.dummy.matrix);
      }

      this.assetPositions.push({
        id: `TRA-${String(i + 1).padStart(4, '0')}`,
        type: 'trafficSignal',
        instanceIndex: i,
        position: new THREE.Vector3(x, 2.0, z)
      });
    }
    this.instancedMeshes.trafficSignal.instanceMatrix.needsUpdate = true;

    // 4. Streetlights
    let slIdx = 0;
    for (let gx = 0; gx <= gridSize && slIdx < 400; gx++) {
      const x = SG.xs[gx];
      for (let step = 0; step < 16 && slIdx < 400; step++) {
        let z = -halfSpan + (step / 16) * totalSpan;
        if (z > SG.riverMin - 1 && z < SG.riverMax + 1) z = SG.riverMin - 2;
        const sideOffset = (slIdx % 2 === 0 ? 1 : -1) * (streetWidth / 2 + 0.6);

        this.dummy.position.set(x + sideOffset, 0.1, z);
        this.dummy.rotation.set(0, sideOffset > 0 ? Math.PI : 0, 0);
        this.dummy.scale.set(1, 1, 1);
        this.dummy.updateMatrix();
        this.instancedMeshes.streetlight.setMatrixAt(slIdx, this.dummy.matrix);
        if (this.proxyMeshes?.streetlight) {
          this.proxyMeshes.streetlight.setMatrixAt(slIdx, this.dummy.matrix);
        }

        this.dummy.position.set(x, 0.08, z);
        this.dummy.updateMatrix();
        this.streetlightPools.setMatrixAt(slIdx, this.dummy.matrix);

        this.assetPositions.push({
          id: `STR-${String(slIdx + 1).padStart(4, '0')}`,
          type: 'streetlight',
          instanceIndex: slIdx,
          position: new THREE.Vector3(x + sideOffset, 1.8, z)
        });
        slIdx++;
      }
    }
    this.instancedMeshes.streetlight.instanceMatrix.needsUpdate = true;
    this.streetlightPools.instanceMatrix.needsUpdate = true;

    // 5. Water Main Segments (Positioned at y = -0.5 so they are visible underground)
    let wmIdx = 0;
    for (let gz = 0; gz <= gridSize && wmIdx < 300; gz++) {
      const z = SG.zs[gz];
      for (let step = 0; step < 12 && wmIdx < 300; step++) {
        const x = -halfSpan + (step / 12) * totalSpan;

        this.dummy.position.set(x, -0.6, z);
        this.dummy.rotation.set(0, 0, 0);
        this.dummy.scale.set(1, 1, 1);
        this.dummy.updateMatrix();
        this.instancedMeshes.waterMain.setMatrixAt(wmIdx, this.dummy.matrix);
        if (this.proxyMeshes?.waterMain) {
          this.proxyMeshes.waterMain.setMatrixAt(wmIdx, this.dummy.matrix);
        }

        this.assetPositions.push({
          id: `WAT-${String(wmIdx + 1).padStart(4, '0')}`,
          type: 'waterMain',
          instanceIndex: wmIdx,
          position: new THREE.Vector3(x, -0.6, z)
        });
        wmIdx++;
      }
    }
    this.instancedMeshes.waterMain.instanceMatrix.needsUpdate = true;
    if (this.proxyMeshes?.trafficSignal) this.proxyMeshes.trafficSignal.instanceMatrix.needsUpdate = true;
    if (this.proxyMeshes?.streetlight) this.proxyMeshes.streetlight.instanceMatrix.needsUpdate = true;
    if (this.proxyMeshes?.waterMain) this.proxyMeshes.waterMain.instanceMatrix.needsUpdate = true;

    // Compute bounding boxes and bounding spheres for accurate raycasting on all instanced meshes
    for (const key in this.instancedMeshes) {
      const mesh = this.instancedMeshes[key];
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    }
    for (const key in this.proxyMeshes) {
      const mesh = this.proxyMeshes[key];
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    }
  }

  setUnderground(visible) {
    this.undergroundVisible = visible;
    if (this.instancedMeshes.waterMain) {
      this.instancedMeshes.waterMain.visible = visible;
    }
    if (this.proxyMeshes?.waterMain) {
      this.proxyMeshes.waterMain.visible = visible;
    }
  }

  getClickableMeshes() {
    const list = [];
    if (this.instancedMeshes.bridge) list.push(this.instancedMeshes.bridge);
    if (this.instancedMeshes.pumpStation) list.push(this.instancedMeshes.pumpStation);
    if (this.proxyMeshes?.trafficSignal) list.push(this.proxyMeshes.trafficSignal);
    else if (this.instancedMeshes.trafficSignal) list.push(this.instancedMeshes.trafficSignal);
    if (this.proxyMeshes?.streetlight) list.push(this.proxyMeshes.streetlight);
    else if (this.instancedMeshes.streetlight) list.push(this.instancedMeshes.streetlight);
    if (this.undergroundVisible) {
      if (this.proxyMeshes?.waterMain) list.push(this.proxyMeshes.waterMain);
      else if (this.instancedMeshes.waterMain) list.push(this.instancedMeshes.waterMain);
    }
    return list;
  }

  updateFromSnapshot(snapshot, timeSec = 0) {
    if (!snapshot || !snapshot.assetStates) return;

    const statusColors = COLORS.status;
    const pulseFactor = Math.sin(timeSec * 6) * 0.5 + 0.5;
    const slowPulse = Math.sin(timeSec * 3) * 0.5 + 0.5;

    const counts = {
      pumpStation: 0,
      waterMain: 0,
      bridge: 0,
      streetlight: 0,
      trafficSignal: 0
    };

    const dummyZero = new THREE.Matrix4().makeScale(0, 0, 0);

    for (let i = 0; i < snapshot.assetStates.length; i++) {
      const state = snapshot.assetStates[i];
      const master = this.masterAssets[i];
      if (!master) continue;

      const mesh = this.instancedMeshes[master.type];
      const instanceIndex = counts[master.type]++;
      if (!mesh || instanceIndex >= mesh.count) continue;

      let hexColor = statusColors.healthy;
      if (state.status === 'failed') {
        hexColor = statusColors.failed;
        this.colorHelper.set(hexColor);
        this.colorHelper.lerp(new THREE.Color(0xff8888), pulseFactor * 0.4);

        if (master.type === 'streetlight' && this.streetlightPools) {
          this.streetlightPools.setMatrixAt(instanceIndex, dummyZero);
        }
      } else if (state.status === 'critical') {
        hexColor = statusColors.critical;
        this.colorHelper.set(hexColor);
        this.colorHelper.lerp(new THREE.Color(0xffaa55), slowPulse * 0.3);
      } else if (state.status === 'degrading') {
        hexColor = statusColors.degrading;
        this.colorHelper.set(hexColor);
      } else {
        hexColor = statusColors.healthy;
        this.colorHelper.set(hexColor);
      }

      mesh.setColorAt(instanceIndex, this.colorHelper);
    }

    for (const key in this.instancedMeshes) {
      if (this.instancedMeshes[key].instanceColor) {
        this.instancedMeshes[key].instanceColor.needsUpdate = true;
      }
    }
    if (this.streetlightPools) {
      this.streetlightPools.instanceMatrix.needsUpdate = true;
    }
  }

  findAssetAt(intersectedMesh, instanceId) {
    if (!intersectedMesh || instanceId === undefined || instanceId === null) return null;
    const meshName = intersectedMesh.name.replace('proxy_', '').replace('instanced_', '');
    const found = this.assetPositions.find(p => p.type === meshName && p.instanceIndex === instanceId);
    if (!found) return null;

    const master = this.masterAssets.find(a => a.id === found.id);
    return {
      ...found,
      master: master || found
    };
  }

  dispose() {
    for (const key in this.instancedMeshes) {
      const m = this.instancedMeshes[key];
      this.scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    }
    if (this.streetlightPools) {
      this.scene.remove(this.streetlightPools);
      this.streetlightPools.geometry.dispose();
      this.streetlightPools.material.dispose();
    }
  }
}
