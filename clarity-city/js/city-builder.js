// city-builder.js - High-end procedural architectural scale model generator with transparent Underground support

import * as THREE from 'three';
import { CITY_CONFIG, COLORS } from './config.js';
import { createPRNG } from './simulation.js';

// Procedural Canvas Texture Generator for Downtown Window Grids & Building Facades (65% lit at night)
function createBuildingTexture(type) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (type === 'downtown') {
    ctx.fillStyle = '#222830';
    ctx.fillRect(0, 0, 128, 256);

    const rows = 16;
    const cols = 8;
    const cellW = 128 / cols;
    const cellH = 256 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isLit = Math.random() > 0.32; // ~68% lit windows
        if (isLit) {
          ctx.fillStyle = Math.random() > 0.25 ? '#FFEAA7' : '#9FD3FF';
        } else {
          ctx.fillStyle = '#14181F';
        }
        ctx.fillRect(c * cellW + 2.5, r * cellH + 2.5, cellW - 5, cellH - 5);
      }
    }
  } else if (type === 'residential') {
    ctx.fillStyle = '#2C343E';
    ctx.fillRect(0, 0, 128, 256);
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 4; c++) {
        ctx.fillStyle = Math.random() > 0.35 ? '#FFDF88' : '#181E25';
        ctx.fillRect(c * 32 + 6, r * 32 + 6, 20, 20);
      }
    }
  } else {
    // Industrial
    ctx.fillStyle = '#1E232B';
    ctx.fillRect(0, 0, 128, 256);
    ctx.fillStyle = '#14181F';
    for (let r = 0; r < 6; r++) {
      ctx.fillRect(10, r * 42 + 10, 108, 22);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createRoadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#181D24';
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = '#E0BE53';
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 16]);
  ctx.beginPath();
  ctx.moveTo(64, 0);
  ctx.lineTo(64, 128);
  ctx.stroke();

  ctx.strokeStyle = '#9AA2AC';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(8, 128);
  ctx.moveTo(120, 0);
  ctx.lineTo(120, 128);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 8);
  return texture;
}

export function createCityModel(scene, seed = 42, theme = 'dark') {
  const rng = createPRNG(seed);
  const themeColors = COLORS[theme];
  const cityGroup = new THREE.Group();
  cityGroup.name = 'city_root';

  const surfaceMaterials = []; // Track surface materials to enable smooth 15% opacity transition in Underground mode

  const { gridSize, blockSize, streetWidth, riverWidth, riverBlockIndex } = CITY_CONFIG;
  const totalSpan = gridSize * blockSize + (gridSize - 1) * streetWidth + riverWidth;
  const halfSpan = totalSpan / 2;

  // 1. Terrain Base
  const groundGeo = new THREE.PlaneGeometry(totalSpan + 80, totalSpan + 80);
  const groundMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(themeColors.ground),
    roughness: 0.9,
    metalness: 0.1,
    transparent: true,
    opacity: 1.0
  });
  surfaceMaterials.push(groundMat);
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -0.15;
  groundMesh.receiveShadow = true;
  cityGroup.add(groundMesh);

  // 2. Animated River Water
  const riverZPos = (riverBlockIndex - gridSize / 2) * (blockSize + streetWidth) + riverWidth / 2;
  const riverGeo = new THREE.PlaneGeometry(totalSpan + 80, riverWidth);
  const riverMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(themeColors.river),
    roughness: 0.15,
    metalness: 0.8,
    transparent: true,
    opacity: 0.92
  });
  surfaceMaterials.push(riverMat);
  const riverMesh = new THREE.Mesh(riverGeo, riverMat);
  riverMesh.rotation.x = -Math.PI / 2;
  riverMesh.position.set(0, 0.02, riverZPos);
  riverMesh.name = 'river_mesh';
  cityGroup.add(riverMesh);

  // Riverbank Curbs
  const bankMat = new THREE.MeshStandardMaterial({ color: 0x333A44, roughness: 0.85, transparent: true, opacity: 1.0 });
  surfaceMaterials.push(bankMat);
  const bankNorth = new THREE.Mesh(new THREE.BoxGeometry(totalSpan + 80, 0.5, 1.2), bankMat);
  bankNorth.position.set(0, 0.1, riverZPos - riverWidth / 2);
  cityGroup.add(bankNorth);

  const bankSouth = new THREE.Mesh(new THREE.BoxGeometry(totalSpan + 80, 0.5, 1.2), bankMat);
  bankSouth.position.set(0, 0.1, riverZPos + riverWidth / 2);
  cityGroup.add(bankSouth);

  // 3. Roads Network
  const roadTex = createRoadTexture();
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.8,
    metalness: 0.2,
    transparent: true,
    opacity: 1.0
  });
  surfaceMaterials.push(roadMat);

  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x48515E, roughness: 0.9, transparent: true, opacity: 1.0 });
  surfaceMaterials.push(sidewalkMat);

  const roadGroup = new THREE.Group();

  for (let gx = 0; gx <= gridSize; gx++) {
    const x = -halfSpan + gx * (blockSize + streetWidth) + streetWidth / 2;
    const roadGeo = new THREE.PlaneGeometry(streetWidth, totalSpan + 40);
    const rMesh = new THREE.Mesh(roadGeo, roadMat);
    rMesh.rotation.x = -Math.PI / 2;
    rMesh.position.set(x - blockSize / 2, 0.05, 0);
    rMesh.receiveShadow = true;
    roadGroup.add(rMesh);
  }

  for (let gz = 0; gz <= gridSize; gz++) {
    let z = -halfSpan + gz * (blockSize + streetWidth) + streetWidth / 2;
    if (gz >= riverBlockIndex) z += riverWidth;
    const roadGeo = new THREE.PlaneGeometry(totalSpan + 40, streetWidth);
    const rMesh = new THREE.Mesh(roadGeo, roadMat);
    rMesh.rotation.x = -Math.PI / 2;
    rMesh.position.set(0, 0.05, z - blockSize / 2);
    rMesh.receiveShadow = true;
    roadGroup.add(rMesh);
  }
  cityGroup.add(roadGroup);

  // 4. District Buildings
  const downtownTex = createBuildingTexture('downtown');
  const residentialTex = createBuildingTexture('residential');
  const industrialTex = createBuildingTexture('industrial');

  const downtownMat = new THREE.MeshStandardMaterial({
    map: downtownTex,
    color: 0xE4EAF0,
    roughness: 0.35,
    metalness: 0.3,
    transparent: true,
    opacity: 1.0
  });
  const residentialMat = new THREE.MeshStandardMaterial({
    map: residentialTex,
    color: 0xD0D8E2,
    roughness: 0.65,
    metalness: 0.1,
    transparent: true,
    opacity: 1.0
  });
  const industrialMat = new THREE.MeshStandardMaterial({
    map: industrialTex,
    color: 0x9AA5B4,
    roughness: 0.85,
    metalness: 0.4,
    transparent: true,
    opacity: 1.0
  });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x1E242C, roughness: 0.9, transparent: true, opacity: 1.0 });
  const parkMat = new THREE.MeshStandardMaterial({ color: 0x27442F, roughness: 0.95, transparent: true, opacity: 1.0 });
  const waterPlantMat = new THREE.MeshStandardMaterial({ color: 0x3E5A74, roughness: 0.6, transparent: true, opacity: 1.0 });

  surfaceMaterials.push(downtownMat, residentialMat, industrialMat, roofMat, parkMat, waterPlantMat);

  // Instanced Trees
  const treeCountMax = 250;
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.4, 5);
  trunkGeo.translate(0, 0.7, 0);
  const foliageGeo = new THREE.ConeGeometry(1.4, 2.8, 5);
  foliageGeo.translate(0, 2.5, 0);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3A281C, roughness: 0.9, transparent: true, opacity: 1.0 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2D5A34, roughness: 0.9, transparent: true, opacity: 1.0 });
  surfaceMaterials.push(trunkMat, foliageMat);

  const instancedTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCountMax);
  const instancedFoliage = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCountMax);
  instancedTrunks.castShadow = true;
  instancedFoliage.castShadow = true;
  let treeIdx = 0;
  const dummy = new THREE.Object3D();

  for (let bx = 0; bx < gridSize; bx++) {
    for (let bz = 0; bz < gridSize; bz++) {
      let x = -halfSpan + bx * (blockSize + streetWidth) + blockSize / 2;
      let z = -halfSpan + bz * (blockSize + streetWidth) + blockSize / 2;
      if (bz >= riverBlockIndex) z += riverWidth;

      const sidewalkGeo = new THREE.BoxGeometry(blockSize - 1, 0.25, blockSize - 1);
      const sMesh = new THREE.Mesh(sidewalkGeo, sidewalkMat);
      sMesh.position.set(x, 0.125, z);
      sMesh.receiveShadow = true;
      cityGroup.add(sMesh);

      const isPark = (bx === 1 && bz === 2) || (bx === 6 && bz === 2);
      const isDowntown = (bx >= 3 && bx <= 4) && (bz >= 1 && bz <= 3);
      const isIndustrial = (bx >= 5) && (bz >= 5);
      const isCityHallPlaza = (bx === 2 && bz === 3);
      const isWaterTreatment = (bx === 0 && bz === 4);

      if (isCityHallPlaza) {
        const plazaGeo = new THREE.BoxGeometry(blockSize - 3, 0.35, blockSize - 3);
        const plazaMat = new THREE.MeshStandardMaterial({ color: 0x5C6675, roughness: 0.6, transparent: true, opacity: 1.0 });
        surfaceMaterials.push(plazaMat);
        const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
        plazaMesh.position.set(x, 0.18, z);
        cityGroup.add(plazaMesh);

        const hallGeo = new THREE.BoxGeometry(blockSize * 0.55, 14, blockSize * 0.45);
        const hallMat = new THREE.MeshStandardMaterial({ color: 0xDCE2E8, roughness: 0.4, transparent: true, opacity: 1.0 });
        surfaceMaterials.push(hallMat);
        const hallMesh = new THREE.Mesh(hallGeo, hallMat);
        hallMesh.position.set(x, 7.2, z - 3);
        hallMesh.castShadow = true;
        hallMesh.receiveShadow = true;
        cityGroup.add(hallMesh);

        const rotundaGeo = new THREE.CylinderGeometry(3.5, 3.5, 4, 12);
        const domeGeo = new THREE.SphereGeometry(3.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const rotundaMesh = new THREE.Mesh(rotundaGeo, hallMat);
        rotundaMesh.position.set(x, 16, z - 3);
        const domeMat = new THREE.MeshStandardMaterial({ color: 0x4A6B5D, roughness: 0.5, metalness: 0.4, transparent: true, opacity: 1.0 });
        surfaceMaterials.push(domeMat);
        const domeMesh = new THREE.Mesh(domeGeo, domeMat);
        domeMesh.position.set(x, 18, z - 3);
        cityGroup.add(rotundaMesh);
        cityGroup.add(domeMesh);
        continue;
      }

      if (isWaterTreatment) {
        const plantBase = new THREE.Mesh(new THREE.BoxGeometry(blockSize - 4, 0.3, blockSize - 4), waterPlantMat);
        plantBase.position.set(x, 0.18, z);
        cityGroup.add(plantBase);

        for (let ti = 0; ti < 2; ti++) {
          const tankX = x - 6 + ti * 12;
          const tankGeo = new THREE.CylinderGeometry(4.5, 4.5, 2.5, 16);
          const tankMat = new THREE.MeshStandardMaterial({ color: 0x2D4559, roughness: 0.6, transparent: true, opacity: 1.0 });
          surfaceMaterials.push(tankMat);
          const tankMesh = new THREE.Mesh(tankGeo, tankMat);
          tankMesh.position.set(tankX, 1.4, z - 4);
          tankMesh.castShadow = true;
          cityGroup.add(tankMesh);
        }

        const pumpBuilding = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 8), industrialMat);
        pumpBuilding.position.set(x, 3.2, z + 6);
        pumpBuilding.castShadow = true;
        cityGroup.add(pumpBuilding);
        continue;
      }

      if (isPark) {
        const parkGeo = new THREE.BoxGeometry(blockSize - 3, 0.35, blockSize - 3);
        const pMesh = new THREE.Mesh(parkGeo, parkMat);
        pMesh.position.set(x, 0.18, z);
        pMesh.receiveShadow = true;
        cityGroup.add(pMesh);

        for (let t = 0; t < 16 && treeIdx < treeCountMax; t++) {
          const tx = x + (rng() - 0.5) * (blockSize - 8);
          const tz = z + (rng() - 0.5) * (blockSize - 8);
          const scale = 0.8 + rng() * 0.5;

          dummy.position.set(tx, 0.3, tz);
          dummy.scale.set(scale, scale, scale);
          dummy.rotation.set(0, rng() * Math.PI * 2, 0);
          dummy.updateMatrix();

          instancedTrunks.setMatrixAt(treeIdx, dummy.matrix);
          instancedFoliage.setMatrixAt(treeIdx, dummy.matrix);
          treeIdx++;
        }
        continue;
      }

      if (isDowntown) {
        const parcelDivs = 2;
        const subSize = (blockSize - 4) / parcelDivs;

        for (let px = 0; px < parcelDivs; px++) {
          for (let pz = 0; pz < parcelDivs; pz++) {
            const cx = x - (blockSize - 4) / 2 + (px + 0.5) * subSize;
            const cz = z - (blockSize - 4) / 2 + (pz + 0.5) * subSize;
            const height = 22 + rng() * 32;
            const bw = subSize * (0.85 + rng() * 0.1);
            const bd = subSize * (0.85 + rng() * 0.1);

            const bGeo = new THREE.BoxGeometry(bw, height, bd);
            const bMesh = new THREE.Mesh(bGeo, downtownMat);
            bMesh.position.set(cx, height / 2 + 0.25, cz);
            bMesh.castShadow = true;
            bMesh.receiveShadow = true;
            cityGroup.add(bMesh);

            const hvacGeo = new THREE.BoxGeometry(bw * 0.5, 2.5, bd * 0.5);
            const hvacMesh = new THREE.Mesh(hvacGeo, roofMat);
            hvacMesh.position.set(cx, height + 1.5, cz);
            cityGroup.add(hvacMesh);

            if (rng() > 0.5) {
              const antGeo = new THREE.CylinderGeometry(0.1, 0.2, 5, 4);
              const antMesh = new THREE.Mesh(antGeo, roofMat);
              antMesh.position.set(cx, height + 5, cz);
              cityGroup.add(antMesh);
            }
          }
        }
        continue;
      }

      if (isIndustrial) {
        const subSize = (blockSize - 4) / 2;
        for (let px = 0; px < 2; px++) {
          for (let pz = 0; pz < 2; pz++) {
            const cx = x - (blockSize - 4) / 2 + (px + 0.5) * subSize;
            const cz = z - (blockSize - 4) / 2 + (pz + 0.5) * subSize;
            const height = 4 + rng() * 5;
            const bw = subSize * 0.9;
            const bd = subSize * 0.85;

            const bGeo = new THREE.BoxGeometry(bw, height, bd);
            const bMesh = new THREE.Mesh(bGeo, industrialMat);
            bMesh.position.set(cx, height / 2 + 0.25, cz);
            bMesh.castShadow = true;
            bMesh.receiveShadow = true;
            cityGroup.add(bMesh);

            if (rng() > 0.4) {
              const siloGeo = new THREE.CylinderGeometry(1.8, 1.8, 7, 12);
              const siloMat = new THREE.MeshStandardMaterial({ color: 0x8894A0, metalness: 0.7, roughness: 0.3, transparent: true, opacity: 1.0 });
              surfaceMaterials.push(siloMat);
              const siloMesh = new THREE.Mesh(siloGeo, siloMat);
              siloMesh.position.set(cx + 3, 3.7, cz + 3);
              siloMesh.castShadow = true;
              cityGroup.add(siloMesh);
            }
          }
        }
        continue;
      }

      const subSize = (blockSize - 4) / 3;
      for (let px = 0; px < 3; px++) {
        for (let pz = 0; pz < 3; pz++) {
          const cx = x - (blockSize - 4) / 2 + (px + 0.5) * subSize;
          const cz = z - (blockSize - 4) / 2 + (pz + 0.5) * subSize;
          const height = 3.5 + rng() * 3.5;
          const bw = subSize * 0.75;
          const bd = subSize * 0.75;

          const bGeo = new THREE.BoxGeometry(bw, height, bd);
          const bMesh = new THREE.Mesh(bGeo, residentialMat);
          bMesh.position.set(cx, height / 2 + 0.25, cz);
          bMesh.castShadow = true;
          bMesh.receiveShadow = true;
          cityGroup.add(bMesh);

          const roofGeo = new THREE.ConeGeometry(bw * 0.8, 2.2, 4);
          roofGeo.rotateY(Math.PI / 4);
          const pitchedMat = new THREE.MeshStandardMaterial({ color: 0x783E2D, roughness: 0.8, transparent: true, opacity: 1.0 });
          surfaceMaterials.push(pitchedMat);
          const rMesh = new THREE.Mesh(roofGeo, pitchedMat);
          rMesh.position.set(cx, height + 1.2, cz);
          rMesh.castShadow = true;
          cityGroup.add(rMesh);

          if (rng() > 0.4 && treeIdx < treeCountMax) {
            dummy.position.set(cx + (rng() - 0.5) * 3, 0.3, cz + (rng() - 0.5) * 3);
            const scale = 0.6 + rng() * 0.3;
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();
            instancedTrunks.setMatrixAt(treeIdx, dummy.matrix);
            instancedFoliage.setMatrixAt(treeIdx, dummy.matrix);
            treeIdx++;
          }
        }
      }
    }
  }

  instancedTrunks.count = treeIdx;
  instancedFoliage.count = treeIdx;
  instancedTrunks.instanceMatrix.needsUpdate = true;
  instancedFoliage.instanceMatrix.needsUpdate = true;
  cityGroup.add(instancedTrunks);
  cityGroup.add(instancedFoliage);

  scene.add(cityGroup);

  return {
    group: cityGroup,
    totalSpan,
    riverZPos,
    riverMesh,
    surfaceMaterials,
    setUndergroundMode: (isUnderground) => {
      const targetOpacity = isUnderground ? 0.15 : 1.0;
      surfaceMaterials.forEach(mat => {
        mat.opacity = targetOpacity;
        mat.transparent = true;
        mat.needsUpdate = true;
      });
    },
    dispose: () => {
      scene.remove(cityGroup);
      surfaceMaterials.forEach(mat => mat.dispose());
    }
  };
}
