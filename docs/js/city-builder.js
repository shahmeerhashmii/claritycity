// city-builder.js - High-end procedural architectural scale model generator with transparent Underground support

import * as THREE from 'three';
import { CITY_CONFIG, COLORS, streetGrid } from './config.js';
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


// v3 facades: one canvas per material, drawn as a grid of bays (2 m) by floors (3 m) with random lit windows.
function makeFacadeTextures() {
  const make = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
  const rnd = (() => { let s = 1234567; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const lit = () => (rnd() > 0.45 ? (rnd() > 0.3 ? '#F7E3A6' : '#BFE3FF') : null);
  const glass = (frame, pane, paneAlt) => (g, w, h) => {
    g.fillStyle = frame; g.fillRect(0, 0, w, h); const cols = 8, rows = 16, cw = w / cols, ch = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const l = lit(); g.fillStyle = l || (rnd() > 0.5 ? pane : paneAlt); g.fillRect(c * cw + 1.5, r * ch + 2, cw - 3, ch - 4); if (!l) { g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(c * cw + 1.5, r * ch + 2, cw * 0.35, ch - 4); } }
  };
  return {
    glass: make(128, 256, glass('#1B2633', '#2D4A63', '#355874')),
    glass2: make(128, 256, glass('#2A2E33', '#3A4650', '#45525C')),
    office: make(128, 256, (g, w, h) => { g.fillStyle = '#7C7468'; g.fillRect(0, 0, w, h); const cols = 8, rows = 16, cw = w / cols, ch = h / rows; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { g.fillStyle = lit() || '#2A2F36'; g.fillRect(c * cw + 3, r * ch + 4, cw - 6, ch - 8); } }),
    brick: make(128, 256, (g, w, h) => { g.fillStyle = '#7A3E2C'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1); const cols = 8, rows = 16, cw = w / cols, ch = h / rows; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (c % 2 && rnd() > 0.3) continue; g.fillStyle = '#D9D2C5'; g.fillRect(c * cw + 3, r * ch + 3, cw - 6, ch - 6); g.fillStyle = lit() || '#2B2F35'; g.fillRect(c * cw + 4, r * ch + 4, cw - 8, ch - 8); } }),
    house: make(64, 64, (g, w, h) => { g.fillStyle = '#E6E1D8'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.07)'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1); g.fillStyle = '#FFFFFF'; g.fillRect(8, 10, 16, 14); g.fillRect(40, 10, 16, 14); g.fillStyle = rnd() > 0.4 ? '#F2D58E' : '#2E3A46'; g.fillRect(10, 12, 12, 10); g.fillStyle = '#2E3A46'; g.fillRect(42, 12, 12, 10); g.fillStyle = '#5B4636'; g.fillRect(27, 38, 10, 26); g.fillStyle = '#FFFFFF'; g.fillRect(8, 40, 14, 12); g.fillStyle = '#2E3A46'; g.fillRect(10, 42, 10, 8); }),
    industrial: make(64, 128, (g, w, h) => { g.fillStyle = '#8E979F'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 0; x < w; x += 4) g.fillRect(x, 0, 1.5, h); g.fillStyle = '#3B424A'; g.fillRect(8, h - 40, 22, 40); g.fillStyle = '#F5C542'; g.fillRect(8, h - 42, 22, 2); g.fillStyle = '#C9D6E0'; g.fillRect(36, 20, 20, 8); }),
  };
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
  const SG = streetGrid();
  const riverZPos = SG.riverZ;
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

  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x7E848C, roughness: 0.9, transparent: true, opacity: 1.0 });
  surfaceMaterials.push(sidewalkMat);

  const roadGroup = new THREE.Group();

  // v4: roads run in the real gaps between blocks. North-south roads stop at the river banks;
  // only the streets with a bridge carry on across (the bridge deck is the road there).
  const roadStrip = (x, z0, z1) => {
    const g = new THREE.PlaneGeometry(streetWidth, z1 - z0);
    const m = new THREE.Mesh(g, roadMat); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.05, (z0 + z1) / 2); m.receiveShadow = true; roadGroup.add(m);
  };
  for (const x of SG.xs) { roadStrip(x, -SG.extent, SG.riverMin); roadStrip(x, SG.riverMax, SG.extent); }
  for (const z of SG.zs) {
    const g = new THREE.PlaneGeometry(SG.extent * 2, streetWidth);
    const m = new THREE.Mesh(g, roadMat); m.rotation.x = -Math.PI / 2; m.position.set(-10, 0.05, z); m.receiveShadow = true; roadGroup.add(m);
  }
  cityGroup.add(roadGroup);

  // 4. District Buildings (v3: textured to real-world scale, mixed building types, lawns, street trees, crosswalks)
  const T = makeFacadeTextures();
  const mk = (opts) => { const m = new THREE.MeshStandardMaterial({ transparent: true, opacity: 1.0, ...opts }); surfaceMaterials.push(m); return m; };
  const glassMat = mk({ map: T.glass, color: 0xD8E6F0, roughness: 0.18, metalness: 0.55 });
  const glassMat2 = mk({ map: T.glass2, color: 0xE3E0D6, roughness: 0.22, metalness: 0.5 });
  const officeMat = mk({ map: T.office, color: 0xE9E3D6, roughness: 0.6, metalness: 0.1 });
  const brickMat = mk({ map: T.brick, color: 0xFFFFFF, roughness: 0.8, metalness: 0.05 });
  const houseMats = [0xEDE3CC, 0xB9C6B0, 0x9FB2C6, 0xF2F0EA, 0xD6C2A4, 0xC9A99A].map((c) => mk({ map: T.house, color: c, roughness: 0.85 }));
  const roofMats = [0x3A3E44, 0x55402F, 0x2E3238, 0x6B4A3A].map((c) => mk({ color: c, roughness: 0.9 }));
  const industrialMat = mk({ map: T.industrial, color: 0xB4BCC6, roughness: 0.75, metalness: 0.35 });
  const roofMat = mk({ color: 0x2A2F36, roughness: 0.9 });
  const parkMat = mk({ color: 0x2F5A36, roughness: 0.95 });
  const lawnMat = mk({ color: 0x3B6A3F, roughness: 1.0 });
  const waterPlantMat = mk({ color: 0x3E5A74, roughness: 0.6 });
  const concreteMat = mk({ color: 0x8A9098, roughness: 0.92 });
  const driveMat = mk({ color: 0x4A4F57, roughness: 0.95 });

  // box with UVs in world units, so window grids keep a real floor height (3 m) and bay width on any size of building
  function scaledBox(w, h, d, tileW = 16, tileH = 48) {
    const g = new THREE.BoxGeometry(w, h, d);
    const uv = g.attributes.uv;
    const dims = [[d, h], [d, h], [0, 0], [0, 0], [w, h], [w, h]]; // +x -x +y -y +z -z
    for (let f = 0; f < 6; f++) {
      const [fw, fh] = dims[f];
      for (let k = 0; k < 4; k++) {
        const i = f * 4 + k;
        if (!fw) { uv.setXY(i, 0.002, 0.002); continue; } // roofs and floors: plain roof colour from the texture corner
        uv.setXY(i, uv.getX(i) * fw / tileW, uv.getY(i) * fh / tileH);
      }
    }
    uv.needsUpdate = true;
    return g;
  }
  function addBox(mat, w, h, d, x, y, z, ry = 0, tileW, tileH) {
    const m = new THREE.Mesh(scaledBox(w, h, d, tileW, tileH), mat);
    m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; cityGroup.add(m); return m;
  }
  // gable roof as a triangular prism
  function gable(w, d, h, mat, x, y, z, ry) {
    const shape = new THREE.Shape(); shape.moveTo(-w / 2 - 0.3, 0); shape.lineTo(w / 2 + 0.3, 0); shape.lineTo(0, h); shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: d + 0.6, bevelEnabled: false }); g.translate(0, 0, -(d + 0.6) / 2);
    const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; cityGroup.add(m);
  }

  // Instanced trees (parks + street trees), two foliage tones
  const treeCountMax = 900;
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 1.6, 5); trunkGeo.translate(0, 0.8, 0);
  const foliageGeo = new THREE.IcosahedronGeometry(1.35, 0); foliageGeo.scale(1, 1.15, 1); foliageGeo.translate(0, 2.6, 0);
  const trunkMat = mk({ color: 0x4A3424, roughness: 0.9 });
  const foliageMat = mk({ color: 0xFFFFFF, roughness: 0.9, flatShading: true });
  const instancedTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCountMax);
  const instancedFoliage = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCountMax);
  instancedTrunks.castShadow = true; instancedFoliage.castShadow = true;
  const leafTones = [0x2F6B3A, 0x3E7D3F, 0x285A33, 0x4F8545, 0x6C8F3E];
  const leafColor = new THREE.Color();
  let treeIdx = 0;
  const dummy = new THREE.Object3D();
  const addTree = (tx, tz, s) => {
    if (treeIdx >= treeCountMax) return;
    dummy.position.set(tx, 0.3, tz); dummy.scale.set(s, s * (0.9 + rng() * 0.3), s); dummy.rotation.set(0, rng() * Math.PI * 2, 0); dummy.updateMatrix();
    instancedTrunks.setMatrixAt(treeIdx, dummy.matrix); instancedFoliage.setMatrixAt(treeIdx, dummy.matrix);
    instancedFoliage.setColorAt(treeIdx, leafColor.setHex(leafTones[Math.floor(rng() * leafTones.length)]));
    treeIdx++;
  };

  // Zebra crosswalks at every intersection
  const stripeGeo = new THREE.PlaneGeometry(0.55, 2.4); stripeGeo.rotateX(-Math.PI / 2);
  const stripeMat = mk({ color: 0xD9DCE0, roughness: 0.7 });
  const stripes = new THREE.InstancedMesh(stripeGeo, stripeMat, 2600);
  let sIdx = 0;
  const xLines = [], zLines = [];
  xLines.push(...SG.xs); zLines.push(...SG.zs);
  for (const ix of xLines) for (const iz of zLines) {
    const off = streetWidth / 2 + 1.4;
    for (const [dx, dz, rot] of [[0, off, 0], [0, -off, 0], [off, 0, Math.PI / 2], [-off, 0, Math.PI / 2]]) {
      for (let k = -3; k <= 3; k++) {
        if (sIdx >= 2600) break;
        const along = k * 1.05;
        dummy.position.set(ix + dx + (rot ? 0 : along), 0.07, iz + dz + (rot ? along : 0));
        dummy.rotation.set(0, rot, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); stripes.setMatrixAt(sIdx++, dummy.matrix);
      }
    }
  }
  stripes.count = sIdx; stripes.instanceMatrix.needsUpdate = true; cityGroup.add(stripes);

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
      const isParkade = (bx === 2 && bz === 2); // King Parkade (built in demo-assets.js)

      // street trees around the curb of every non-industrial block
      if (!isIndustrial && !isWaterTreatment) {
        const e = blockSize / 2 - 1.6;
        for (let k = -2; k <= 2; k++) {
          if (rng() < 0.25) continue;
          const t = k * (blockSize / 5.2);
          addTree(x + t, z - e, 0.55); addTree(x + t, z + e, 0.55); addTree(x - e, z + t, 0.55); addTree(x + e, z + t, 0.55);
        }
      }

      if (isParkade) {
        const pad = new THREE.Mesh(new THREE.BoxGeometry(blockSize - 3, 0.3, blockSize - 3), concreteMat);
        pad.position.set(x, 0.2, z); pad.receiveShadow = true; cityGroup.add(pad);
        continue;
      }

      if (isCityHallPlaza) {
        const plazaGeo = new THREE.BoxGeometry(blockSize - 3, 0.35, blockSize - 3);
        const plazaMat = mk({ color: 0x8C939C, roughness: 0.6 });
        const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
        plazaMesh.position.set(x, 0.18, z);
        cityGroup.add(plazaMesh);
        const hallMat = mk({ map: T.office, color: 0xF2EEE6, roughness: 0.5 });
        addBox(hallMat, blockSize * 0.6, 12, blockSize * 0.42, x, 6.3, z - 3);
        for (let c = -3; c <= 3; c++) { const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 8, 8), hallMat); col.position.set(x + c * 2.1, 4.3, z - 3 + blockSize * 0.21 + 0.8); col.castShadow = true; cityGroup.add(col); }
        const rotundaMesh = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 4, 20), hallMat);
        rotundaMesh.position.set(x, 14.3, z - 3); cityGroup.add(rotundaMesh);
        const domeMat = mk({ color: 0x5E8C78, roughness: 0.45, metalness: 0.5 });
        const domeMesh = new THREE.Mesh(new THREE.SphereGeometry(3.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
        domeMesh.position.set(x, 16.3, z - 3); cityGroup.add(domeMesh);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6, 6), concreteMat); pole.position.set(x + 7, 3.3, z + 8); cityGroup.add(pole);
        const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), mk({ color: 0xD52B1E, side: THREE.DoubleSide, roughness: 0.8 })); flag.position.set(x + 8.1, 5.6, z + 8); cityGroup.add(flag);
        continue;
      }

      if (isWaterTreatment) {
        const plantBase = new THREE.Mesh(new THREE.BoxGeometry(blockSize - 4, 0.3, blockSize - 4), waterPlantMat);
        plantBase.position.set(x, 0.18, z);
        cityGroup.add(plantBase);
        for (let ti = 0; ti < 2; ti++) {
          const tankX = x - 6 + ti * 12;
          const tankMat = mk({ color: 0x9FB3C2, roughness: 0.5, metalness: 0.3 });
          const tankMesh = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 2.5, 28), tankMat);
          tankMesh.position.set(tankX, 1.4, z - 4); tankMesh.castShadow = true; cityGroup.add(tankMesh);
          const water = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 4.1, 0.1, 28), mk({ color: 0x3C6E8F, roughness: 0.1, metalness: 0.6 }));
          water.position.set(tankX, 2.62, z - 4); cityGroup.add(water);
        }
        addBox(industrialMat, 10, 6, 8, x, 3.2, z + 6);
        continue;
      }

      if (isPark) {
        const pMesh = new THREE.Mesh(new THREE.BoxGeometry(blockSize - 3, 0.35, blockSize - 3), parkMat);
        pMesh.position.set(x, 0.18, z); pMesh.receiveShadow = true; cityGroup.add(pMesh);
        for (let t = 0; t < 22; t++) {
          const tx = x + (rng() - 0.5) * (blockSize - 7), tz = z + (rng() - 0.5) * (blockSize - 7);
          if (bx === 1 && Math.abs(tx - x) < 7 && Math.abs(tz - z) < 7) continue; // keep the middle clear for the playground
          addTree(tx, tz, 0.8 + rng() * 0.6);
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
            const kind = rng();
            if (kind < 0.6) {
              // glass tower: podium, setback shaft, crown
              const mat = rng() > 0.5 ? glassMat : glassMat2;
              const podH = 6 + rng() * 3, towerH = 24 + rng() * 34;
              addBox(officeMat, subSize * 0.94, podH, subSize * 0.94, cx, podH / 2 + 0.25, cz);
              const tw = subSize * (0.62 + rng() * 0.12), td = subSize * (0.62 + rng() * 0.12);
              addBox(mat, tw, towerH, td, cx, podH + towerH / 2 + 0.25, cz);
              const top = podH + towerH + 0.25;
              if (rng() > 0.45) addBox(mat, tw * 0.7, 5 + rng() * 6, td * 0.7, cx, top + 3, cz);
              else { const h = new THREE.Mesh(new THREE.BoxGeometry(tw * 0.5, 2.2, td * 0.5), roofMat); h.position.set(cx, top + 1.1, cz); cityGroup.add(h); }
              if (rng() > 0.6) { const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 7, 4), roofMat); ant.position.set(cx, top + 9, cz); cityGroup.add(ant); }
            } else {
              const h = 14 + rng() * 14;
              addBox(rng() > 0.5 ? officeMat : brickMat, subSize * 0.9, h, subSize * 0.9, cx, h / 2 + 0.25, cz);
              const hv = new THREE.Mesh(new THREE.BoxGeometry(subSize * 0.35, 1.8, subSize * 0.3), roofMat); hv.position.set(cx + 1, h + 1.1, cz - 1); cityGroup.add(hv);
            }
          }
        }
        continue;
      }

      if (isIndustrial) {
        const subSize = (blockSize - 4) / 2;
        const yard = new THREE.Mesh(new THREE.BoxGeometry(blockSize - 3, 0.3, blockSize - 3), driveMat); yard.position.set(x, 0.2, z); cityGroup.add(yard);
        for (let px = 0; px < 2; px++) {
          for (let pz = 0; pz < 2; pz++) {
            const cx = x - (blockSize - 4) / 2 + (px + 0.5) * subSize;
            const cz = z - (blockSize - 4) / 2 + (pz + 0.5) * subSize;
            const height = 5 + rng() * 5;
            addBox(industrialMat, subSize * 0.9, height, subSize * 0.8, cx, height / 2 + 0.3, cz, 0, 12, 24);
            for (let s = -1; s <= 1; s++) { const r = new THREE.Mesh(new THREE.BoxGeometry(subSize * 0.9, 0.5, 1.2), roofMat); r.position.set(cx, height + 0.55, cz + s * subSize * 0.25); cityGroup.add(r); }
            if (rng() > 0.4) {
              const siloMat = mk({ color: 0xA8B2BC, metalness: 0.7, roughness: 0.3 });
              const siloMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 8, 18), siloMat);
              siloMesh.position.set(cx + 3, 4.3, cz + 3); siloMesh.castShadow = true; cityGroup.add(siloMesh);
            }
          }
        }
        continue;
      }

      // Residential: lawns, detached houses with gable roofs and driveways, or a low-rise apartment block
      const lawn = new THREE.Mesh(new THREE.BoxGeometry(blockSize - 3.4, 0.28, blockSize - 3.4), lawnMat);
      lawn.position.set(x, 0.2, z); lawn.receiveShadow = true; cityGroup.add(lawn);
      if (rng() < 0.28) {
        for (let k = -1; k <= 1; k += 2) {
          const h = 9 + rng() * 6;
          addBox(brickMat, blockSize * 0.32, h, blockSize * 0.62, x + k * blockSize * 0.22, h / 2 + 0.3, z);
          const rf = new THREE.Mesh(new THREE.BoxGeometry(blockSize * 0.32, 0.5, blockSize * 0.62), roofMat); rf.position.set(x + k * blockSize * 0.22, h + 0.55, z); cityGroup.add(rf);
        }
        continue;
      }
      const subSize = (blockSize - 4) / 3;
      for (let px = 0; px < 3; px++) {
        for (let pz = 0; pz < 3; pz++) {
          if (px === 1 && pz === 1) { addTree(x + (rng() - 0.5) * 3, z + (rng() - 0.5) * 3, 0.9); continue; } // shared backyard
          const cx = x - (blockSize - 4) / 2 + (px + 0.5) * subSize;
          const cz = z - (blockSize - 4) / 2 + (pz + 0.5) * subSize;
          const ry = pz === 0 ? Math.PI : pz === 2 ? 0 : px === 0 ? -Math.PI / 2 : Math.PI / 2; // face the street
          const bw = subSize * 0.62, bd = subSize * 0.55, h = 4.2 + rng() * 2.2;
          addBox(houseMats[Math.floor(rng() * houseMats.length)], bw, h, bd, cx, h / 2 + 0.3, cz, ry, 8, 6);
          gable(bw, bd, 1.8 + rng() * 0.8, roofMats[Math.floor(rng() * roofMats.length)], cx, h + 0.3, cz, ry);
          const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
          const side = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
          const dw = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, subSize * 0.35), driveMat);
          dw.position.set(cx + fwd.x * subSize * 0.38 + side.x * bw * 0.32, 0.36, cz + fwd.z * subSize * 0.38 + side.z * bw * 0.32); dw.rotation.y = ry; cityGroup.add(dw);
          if (rng() > 0.5) addTree(cx - fwd.x * subSize * 0.38 - side.x * 1.5, cz - fwd.z * subSize * 0.38 - side.z * 1.5, 0.6 + rng() * 0.3);
        }
      }
    }
  }

  if (instancedFoliage.instanceColor) instancedFoliage.instanceColor.needsUpdate = true;

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
