// demo-assets.js - The assets from the Maximo Manage demo script, placed in Clarity City so the twin and the
// Maximo demo tell the same story: King Parkade (sump pump, motor, electrical panel, entry gate, three exhaust
// fans), a linear sidewalk segment, sanitary mains and manholes, and park assets (playground, washroom,
// benches, park lights, trail). Click any of them for a Maximo-style asset card. The sump pump card plays the
// whole demo storyline in about 25 seconds.

import * as THREE from 'three';
import { CITY_CONFIG } from './config.js';

const { gridSize, blockSize, streetWidth, riverWidth, riverBlockIndex } = CITY_CONFIG;
const totalSpan = gridSize * blockSize + (gridSize - 1) * streetWidth + riverWidth;
const halfSpan = totalSpan / 2;
const blockCenter = (bx, bz) => {
  let x = -halfSpan + bx * (blockSize + streetWidth) + blockSize / 2;
  let z = -halfSpan + bz * (blockSize + streetWidth) + blockSize / 2;
  if (bz >= riverBlockIndex) z += riverWidth;
  return { x, z };
};

// ---------- the records (IDs match the COP demo data in the script) ----------
const KSP = 'PTB-KSP';
export const DEMO_RECORDS = {
  [`${KSP}-BLDG`]: { desc: 'King Parkade', cls: 'Building', loc: 'PTB-KSP', status: 'ACTIVE', path: ['King Parkade'], scene: 'Scene 3, step 4: filter Assets for PTB-KSP', note: 'Four-level downtown parking structure. Every dollar spent on the pump, gate, panel and fans rolls up here.' },
  [`${KSP}-GATE`]: { desc: 'Entry gate', cls: 'Access control', loc: 'PTB-KSP-ENT', status: 'ACTIVE', path: ['King Parkade', 'Entry gate'], scene: 'Scene 3, step 4', note: 'Barrier arm and ticket unit at the Water St entrance.' },
  [`${KSP}-ELEC`]: { desc: 'Main electrical panel', cls: 'Electrical', loc: 'PTB-KSP-MECHR', status: 'ACTIVE', path: ['King Parkade', 'Mechanical room', 'Main electrical panel'], scene: 'Scene 4a, step 7: why it is Priority 1', note: 'Sits a few metres from the sump pit. Standing water here is a safety issue, not just a nuisance.' },
  [`${KSP}-PUMP-001`]: { desc: 'Sump pump 1', cls: 'Pump', loc: 'PTB-KSP-MECHR', status: 'ACTIVE', path: ['King Parkade', 'Mechanical room', 'Sump pump 1'], children: ['PTB-KSP-MOTOR-001 · Sump pump Motor1'], scene: 'The story asset (Scenes 3 to 5)', note: 'Keeps level 1 dry in heavy rain. Fails to start in the demo storyline.', story: true },
  [`${KSP}-MOTOR-001`]: { desc: 'Sump pump Motor1', cls: 'Motor', loc: 'PTB-KSP-MECHR', status: 'ACTIVE', path: ['King Parkade', 'Mechanical room', 'Sump pump 1', 'Motor1'], scene: 'Scene 3, step 7: the hierarchy', note: 'Its own asset under the pump. Swap the motor and the pump keeps its history.' },
  [`${KSP}-FAN-001`]: { desc: 'Parking ventilation exhaust fan 1', cls: 'Fan', loc: 'PTB-KSP-L01-PKAREA1', status: 'ACTIVE', path: ['King Parkade', 'Level 1 parking area', 'Exhaust fan 1'], children: ['PTB-KSP-FAN-MOTOR-001'], scene: 'Backup story asset', note: 'Clears exhaust from level 1. Meter-based PM on run hours is a good fit.' },
  [`${KSP}-FAN-002`]: { desc: 'Parking ventilation exhaust fan 2', cls: 'Fan', loc: 'PTB-KSP-L01-PKAREA1', status: 'ACTIVE', path: ['King Parkade', 'Level 1 parking area', 'Exhaust fan 2'], children: ['PTB-KSP-FAN-MOTOR-002'], scene: 'Scene 3, step 4', note: '' },
  [`${KSP}-FAN-003`]: { desc: 'Parking ventilation exhaust fan 3', cls: 'Fan', loc: 'PTB-KSP-L01-PKAREA1', status: 'ACTIVE', path: ['King Parkade', 'Level 1 parking area', 'Exhaust fan 3'], children: ['PTB-KSP-FAN-MOTOR-003'], scene: 'Scene 3, step 4', note: '' },
  'CITY-SWK-CEN-2001': { desc: 'Sidewalk Segment 2.1', cls: 'Sidewalk (linear)', loc: 'CITY-SWK-CEN', status: 'NOT READY', path: ['Sidewalks', 'Centre', 'Segment 2.1'], scene: 'Scene 3, step 3 (optional): linear assets', note: 'Tracked by distance: 0 to 120 m. A trip hazard is logged at 42 m, so the crew knows exactly where to go.', linear: true },
  'CITY-SAN-MH-0412': { desc: 'Sanitary manhole 412', cls: 'Manhole', loc: 'CITY-SAN-CEN', status: 'NOT READY', path: ['Sanitary', 'Centre', 'MH 412'], scene: 'Scene 3, step 2', note: 'Turn on Underground to see the sanitary main it serves.' },
  'CITY-SAN-MAIN-0118': { desc: 'Sanitary main 118 (300 mm PVC)', cls: 'Sanitary main', loc: 'CITY-SAN-CEN', status: 'NOT READY', path: ['Sanitary', 'Centre', 'Main 118'], scene: 'Scene 3, step 2', note: 'Linear asset between manholes 411 and 412.' },
  'PRK-PLAY-01': { desc: 'Riverside Park playground', cls: 'Playground', loc: 'PRK-RIVERSIDE', status: 'NOT READY', path: ['Parks', 'Riverside Park', 'Playground'], scene: 'Scene 3, step 2', note: 'Monthly safety inspection is a classic time-based PM.' },
  'PRK-WR-01': { desc: 'Riverside Park washroom', cls: 'Washroom', loc: 'PRK-RIVERSIDE', status: 'NOT READY', path: ['Parks', 'Riverside Park', 'Washroom'], scene: 'Scene 3, step 2', note: 'Seasonal open and close-up are PMs too.' },
  'PRK-BENCH-01': { desc: 'Park bench', cls: 'Bench', loc: 'PRK-RIVERSIDE', status: 'NOT READY', path: ['Parks', 'Riverside Park', 'Bench'], scene: 'Scene 3, step 2', note: '' },
  'PRK-LT-01': { desc: 'Park light', cls: 'Park light', loc: 'PRK-RIVERSIDE', status: 'NOT READY', path: ['Parks', 'Riverside Park', 'Park light'], scene: 'Scene 3, step 2', note: '' },
  'TRL-SEC-01': { desc: 'Riverside trail section 1', cls: 'Trail', loc: 'PRK-RIVERSIDE', status: 'NOT READY', path: ['Parks', 'Riverside Park', 'Trail section 1'], scene: 'Scene 3, step 2', note: 'Trails and drainage culverts are linear too.' },
};

const M = (o) => new THREE.MeshStandardMaterial({ roughness: 0.7, ...o });

export class DemoAssets {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group(); this.group.name = 'demo_assets';
    this.under = new THREE.Group(); this.under.visible = false;
    this.clickables = [];
    this.fans = [];
    this.t = 0;
    this.story = null;
    this.build();
    scene.add(this.group); scene.add(this.under);
  }

  tag(mesh, id) { mesh.userData.demoId = id; this.clickables.push(mesh); return mesh; }
  add(geo, mat, x, y, z, parent = this.group) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }

  build() {
    // ===== King Parkade (block 2,2, next to downtown) =====
    const { x, z } = blockCenter(2, 2); this.parkade = { x, z };
    const S = blockSize - 6, conc = M({ color: 0xB9B4AA, roughness: 0.85 }), dark = M({ color: 0x3C4148 });
    const levels = [0.45, 3.45, 6.45, 9.45];
    const bld = new THREE.Group(); this.group.add(bld);
    levels.forEach((y, i) => {
      this.add(new THREE.BoxGeometry(S, 0.45, S), conc, x, y, z, bld);
      if (i > 0) { // spandrel walls with the open deck above them
        for (const [dx, dz, w, d] of [[0, S / 2, S, 0.3], [0, -S / 2, S, 0.3], [S / 2, 0, 0.3, S], [-S / 2, 0, 0.3, S]]) this.add(new THREE.BoxGeometry(w, 1.0, d), conc, x + dx, y + 0.7, z + dz, bld);
      }
    });
    for (let cx = -1; cx <= 1; cx++) for (let cz = -1; cz <= 1; cz++) this.add(new THREE.BoxGeometry(0.6, 9, 0.6), conc, x + cx * (S / 2 - 0.4), 4.95, z + cz * (S / 2 - 0.4), bld);
    this.add(new THREE.BoxGeometry(3.2, 12.5, 3.2), M({ color: 0x6E8FA8, roughness: 0.3, metalness: 0.4 }), x - S / 2 + 1.8, 6.5, z - S / 2 + 1.8, bld); // stair/elevator core
    const sign = this.add(new THREE.BoxGeometry(2.2, 2.2, 0.25), M({ color: 0x2457C5, emissive: 0x1a3d8f, emissiveIntensity: 0.6 }), x + S / 2 - 1.2, 11.6, z + S / 2 - 0.2, bld);
    const pCanvas = document.createElement('canvas'); pCanvas.width = pCanvas.height = 64; const pg = pCanvas.getContext('2d'); pg.fillStyle = '#2457C5'; pg.fillRect(0, 0, 64, 64); pg.fillStyle = '#fff'; pg.font = 'bold 52px sans-serif'; pg.textAlign = 'center'; pg.textBaseline = 'middle'; pg.fillText('P', 32, 35);
    sign.material = M({ map: new THREE.CanvasTexture(pCanvas), emissive: 0x223355, emissiveIntensity: 0.4 });
    this.tag(this.add(new THREE.BoxGeometry(S + 0.5, 12.6, S + 0.5), new THREE.MeshBasicMaterial({ visible: false }), x, 6.3, z, bld), `${KSP}-BLDG`);
    // parked cars on every deck
    const carCols = [0xE8E6E1, 0x1E232A, 0x8A929C, 0x2A4870, 0x8C3337, 0x546274];
    let k = 0;
    levels.forEach((y) => { for (let r = -3; r <= 3; r++) for (const side of [-1, 1]) { if ((r * 7 + k++ * 3) % 5 === 0) continue; this.add(new THREE.BoxGeometry(1.6, 0.9, 3.2), M({ color: carCols[(k + r + 9) % carCols.length], metalness: 0.5, roughness: 0.3 }), x + r * 2.6, y + 0.68, z + side * (S / 2 - 3), bld); } });
    // entry gate (south side)
    const gx = x + 4, gz = z + S / 2 + 0.6;
    this.add(new THREE.BoxGeometry(0.6, 1.2, 0.6), M({ color: 0xF2C14E }), gx, 0.85, gz);
    this.gateArm = this.add(new THREE.BoxGeometry(4.2, 0.14, 0.14), M({ color: 0xF7F7F7 }), gx + 2.1, 1.35, gz);
    this.tag(this.add(new THREE.BoxGeometry(5, 2.2, 1.6), new THREE.MeshBasicMaterial({ visible: false }), gx + 2, 1.2, gz), `${KSP}-GATE`);
    // three exhaust fans on the level-1 wall (east side), blades spin
    for (let f = 0; f < 3; f++) {
      const fz = z - 5 + f * 5, fx = x + S / 2 + 0.25;
      const housing = this.add(new THREE.CylinderGeometry(1.0, 1.0, 0.6, 18), M({ color: 0x8E99A4, metalness: 0.6, roughness: 0.4 }), fx, 2.2, fz); housing.rotation.z = Math.PI / 2;
      const blades = new THREE.Group(); blades.position.set(fx + 0.35, 2.2, fz); this.group.add(blades);
      for (let b = 0; b < 4; b++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.22), M({ color: 0x2B3036 })); bl.position.y = 0.35; const piv = new THREE.Group(); piv.rotation.x = (b * Math.PI) / 2; piv.add(bl); blades.add(piv); }
      this.fans.push(blades);
      this.tag(this.add(new THREE.BoxGeometry(1.6, 2.4, 2.4), new THREE.MeshBasicMaterial({ visible: false }), fx + 0.3, 2.2, fz), `${KSP}-FAN-00${f + 1}`);
    }
    // mechanical room (glass so the pump and panel are visible from the street), south-west corner of level 1
    const mx = x - S / 2 + 3.2, mz = z + S / 2 - 3.2;
    this.add(new THREE.BoxGeometry(5.6, 2.8, 5.6), new THREE.MeshStandardMaterial({ color: 0x9fd3ff, transparent: true, opacity: 0.18, roughness: 0.1, metalness: 0.2, depthWrite: false }), mx, 2.1, mz);
    this.pumpMat = M({ color: 0x3E8E5A, metalness: 0.5, roughness: 0.4, emissive: 0x000000 });
    this.pump = this.tag(this.add(new THREE.CylinderGeometry(0.55, 0.65, 1.3, 18), this.pumpMat, mx - 1, 1.35, mz + 0.8), `${KSP}-PUMP-001`);
    this.tag(this.add(new THREE.CylinderGeometry(0.42, 0.42, 0.8, 16), M({ color: 0x2E5B8F, metalness: 0.6, roughness: 0.35 }), mx - 1, 2.4, mz + 0.8), `${KSP}-MOTOR-001`);
    this.add(new THREE.CylinderGeometry(0.15, 0.15, 3.2, 8), M({ color: 0x777f88, metalness: 0.7 }), mx - 1, 2.0, mz - 0.6).rotation.x = Math.PI / 2;
    this.add(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 20), M({ color: 0x20262c }), mx - 1, 0.72, mz + 0.8); // sump pit cover
    this.tag(this.add(new THREE.BoxGeometry(1.6, 2.2, 0.5), M({ color: 0x9AA3AD, metalness: 0.4 }), mx + 1.4, 1.8, mz - 2.3), `${KSP}-ELEC`);
    // a pulsing marker ring above the pump so it is easy to find during the demo
    this.beacon = this.add(new THREE.TorusGeometry(1.4, 0.08, 8, 40), new THREE.MeshBasicMaterial({ color: 0x4C8DFF, transparent: true, opacity: 0.8 }), mx - 1, 5.5, mz + 0.8); this.beacon.rotation.x = Math.PI / 2;
    // flood water plane on level 1 (hidden until the story runs)
    this.water = this.add(new THREE.BoxGeometry(S - 0.6, 0.02, S - 0.6), new THREE.MeshStandardMaterial({ color: 0x3C7FB0, transparent: true, opacity: 0.0, roughness: 0.05, metalness: 0.6, depthWrite: false }), x, 0.7, z);

    // ===== Sidewalk Segment 2.1: a linear asset along the north edge of downtown block (3,1) =====
    const sw = blockCenter(3, 1); const sz = sw.z - blockSize / 2 + 0.9;
    this.add(new THREE.BoxGeometry(blockSize - 2, 0.06, 1.5), new THREE.MeshBasicMaterial({ color: 0x4C8DFF, transparent: true, opacity: 0.35, depthWrite: false }), sw.x, 0.29, sz);
    for (let m = 0; m <= 4; m++) { const tx = sw.x - (blockSize - 2) / 2 + m * (blockSize - 2) / 4; this.add(new THREE.BoxGeometry(0.12, 0.08, 1.7), M({ color: 0xffffff }), tx, 0.32, sz); }
    const cone = this.add(new THREE.ConeGeometry(0.28, 0.75, 12), M({ color: 0xFF7A1A }), sw.x - (blockSize - 2) / 2 + (42 / 120) * (blockSize - 2), 0.65, sz);
    this.tag(this.add(new THREE.BoxGeometry(blockSize - 2, 1.4, 2.4), new THREE.MeshBasicMaterial({ visible: false }), sw.x, 0.8, sz), 'CITY-SWK-CEN-2001');
    cone.castShadow = true;

    // ===== Sanitary main + manholes (manhole lids on the road, pipe visible in Underground) =====
    const rz = blockCenter(3, 2).z + blockSize / 2 + streetWidth / 2 - 0.5; // street between rows 2 and 3
    const xA = blockCenter(2, 2).x, xB = blockCenter(4, 2).x;
    const main = this.add(new THREE.CylinderGeometry(0.45, 0.45, xB - xA, 12), new THREE.MeshBasicMaterial({ color: 0xB07A3A }), (xA + xB) / 2, -1.6, rz + 1.4, this.under); main.rotation.z = Math.PI / 2;
    this.tag(main, 'CITY-SAN-MAIN-0118');
    [xA, (xA + xB) / 2, xB].forEach((mxh, i) => {
      this.add(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 20), M({ color: 0x2E3237, metalness: 0.6 }), mxh, 0.09, rz + 1.4);
      this.add(new THREE.CylinderGeometry(0.6, 0.6, 1.7, 14), new THREE.MeshBasicMaterial({ color: 0xC99A5B }), mxh, -0.8, rz + 1.4, this.under);
      if (i === 2) this.tag(this.add(new THREE.CylinderGeometry(1.2, 1.2, 0.6, 12), new THREE.MeshBasicMaterial({ visible: false }), mxh, 0.3, rz + 1.4), 'CITY-SAN-MH-0412');
    });

    // ===== Riverside Park (block 1,2): playground, washroom, benches, park lights, trail loop =====
    const pk = blockCenter(1, 2);
    const trailR = 9.5, trail = new THREE.Mesh(new THREE.RingGeometry(trailR - 0.7, trailR, 48), M({ color: 0xC2A77E, roughness: 1 })); trail.rotation.x = -Math.PI / 2; trail.position.set(pk.x, 0.37, pk.z); this.group.add(trail);
    this.tag(this.add(new THREE.TorusGeometry(trailR - 0.35, 0.8, 4, 32), new THREE.MeshBasicMaterial({ visible: false }), pk.x, 0.4, pk.z), 'TRL-SEC-01').rotation.x = Math.PI / 2;
    const pad = this.add(new THREE.CylinderGeometry(4.2, 4.2, 0.1, 28), M({ color: 0x8C6B4A, roughness: 1 }), pk.x, 0.4, pk.z);
    const play = new THREE.Group(); play.position.set(pk.x, 0.45, pk.z); this.group.add(play);
    const red = M({ color: 0xD8452E }), yel = M({ color: 0xF2C14E }), blu = M({ color: 0x2F7BD8 }), steel = M({ color: 0xA9B1BA, metalness: 0.7 });
    for (const [px, pz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) this.add(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 8), steel, px, 1.3, pz, play);
    this.add(new THREE.BoxGeometry(2.6, 0.15, 2.6), yel, 0, 1.4, 0, play);
    this.add(new THREE.ConeGeometry(1.9, 1.2, 4), red, 0, 3.2, 0, play).rotation.y = Math.PI / 4;
    const slide = this.add(new THREE.BoxGeometry(0.9, 0.08, 3.0), blu, 0, 0.75, 2.4, play); slide.rotation.x = 0.5;
    for (const sx of [-3, -2]) { this.add(new THREE.BoxGeometry(0.08, 2.2, 0.08), steel, sx, 1.1, -2.4, play); this.add(new THREE.BoxGeometry(0.08, 2.2, 0.08), steel, sx + 1.6, 1.1, -2.4, play); }
    this.add(new THREE.BoxGeometry(2.6, 0.1, 0.1), steel, -1.7, 2.2, -2.4, play);
    this.tag(this.add(new THREE.CylinderGeometry(4.3, 4.3, 4, 12), new THREE.MeshBasicMaterial({ visible: false }), pk.x, 2, pk.z), 'PRK-PLAY-01');
    pad.receiveShadow = true;
    const wr = this.add(new THREE.BoxGeometry(3.6, 2.6, 2.6), M({ color: 0xD8CBB0 }), pk.x + 8.5, 1.6, pk.z - 8.5);
    this.add(new THREE.BoxGeometry(4.2, 0.25, 3.2), M({ color: 0x4A3A2E }), pk.x + 8.5, 3.0, pk.z - 8.5);
    this.tag(wr, 'PRK-WR-01');
    const benchMat = M({ color: 0x7A5233 });
    [[-6, 4, 0], [6, 4, 0], [4, -6.5, Math.PI / 2], [-4, -6.5, Math.PI / 2]].forEach(([bxo, bzo, ry], i) => { const b = this.add(new THREE.BoxGeometry(1.8, 0.45, 0.55), benchMat, pk.x + bxo, 0.62, pk.z + bzo); b.rotation.y = ry; if (i === 0) this.tag(b, 'PRK-BENCH-01'); });
    this.parkLights = [];
    for (let a = 0; a < 6; a++) {
      const ang = (a / 6) * Math.PI * 2 + 0.3, lx = pk.x + Math.cos(ang) * (trailR + 0.9), lz = pk.z + Math.sin(ang) * (trailR + 0.9);
      this.add(new THREE.CylinderGeometry(0.07, 0.09, 2.8, 8), M({ color: 0x2E3237 }), lx, 1.75, lz);
      const head = this.add(new THREE.SphereGeometry(0.28, 12, 10), new THREE.MeshStandardMaterial({ color: 0xFFF1C4, emissive: 0xFFE19A, emissiveIntensity: 0.9 }), lx, 3.25, lz);
      if (a === 0) this.tag(head, 'PRK-LT-01');
    }
  }

  setUnderground(v) { this.under.visible = v; }
  getClickables() { return this.clickables.filter((m) => m.parent && (m.parent !== this.under || this.under.visible)); }
  // the building's click box surrounds everything inside it, so any specific asset hit beats it
  bestHit(hits) { return hits.find((h) => h.object.userData.demoId !== `${KSP}-BLDG`) || hits[0]; }
  infoFor(mesh) { const id = mesh?.userData?.demoId; return id ? { id, ...DEMO_RECORDS[id] } : null; }

  update(dt) {
    this.t += dt;
    this.fans.forEach((f, i) => { f.rotation.x += dt * (this.story && this.story.t < 16 ? 2 : 9) * (1 + i * 0.1); });
    if (this.beacon) { const p = 0.5 + 0.5 * Math.sin(this.t * 3); this.beacon.scale.setScalar(1 + p * 0.25); this.beacon.material.opacity = 0.35 + 0.5 * (1 - p); }
    if (this.gateArm) { const up = Math.max(0, Math.sin(this.t * 0.6)) > 0.7; this.gateArm.rotation.z = THREE.MathUtils.lerp(this.gateArm.rotation.z, up ? 1.3 : 0, 0.06); this.gateArm.position.x = this.parkade.x + 4 + 2.1 * Math.cos(this.gateArm.rotation.z); this.gateArm.position.y = 1.35 + 2.1 * Math.sin(this.gateArm.rotation.z); }
    const s = this.story;
    if (s) {
      s.t += dt;
      const t = s.t;
      const flood = t < 14 ? Math.min(1, t / 6) : Math.max(0, 1 - (t - 14) / 4);
      this.water.material.opacity = 0.55 * flood; this.water.position.y = 0.7 + flood * 0.35;
      const failing = t < 15; const pulse = failing ? 0.5 + 0.5 * Math.sin(t * 8) : 0;
      this.pumpMat.color.setHex(failing ? 0xD8452E : 0x3E8E5A); this.pumpMat.emissive.setHex(failing ? 0x5a0f0a : 0x0); this.pumpMat.emissiveIntensity = pulse;
      if (t > 26) { this.story = null; this.water.material.opacity = 0; this.pumpMat.color.setHex(0x3E8E5A); this.pumpMat.emissive.setHex(0x0); }
    }
  }
  playStory() { this.story = { t: 0 }; }
  dispose() { this.scene.remove(this.group); this.scene.remove(this.under); }
}

// ---------- the Maximo-style card + story captions (one shared panel for both halves of the screen) ----------
const STEPS = [
  { t: 0, chip: 'Rain', text: 'Heavy rain downtown. Sump pump 1 at King Parkade does not kick on, and level 1 starts taking water.' },
  { t: 5, chip: 'WAPPR', text: 'The attendant calls it in. Work order created against PTB-KSP-PUMP-001: CM, Priority 1, because the main electrical panel is a few metres away.' },
  { t: 9, chip: 'Planned', text: 'Planner adds 2 hours of mechanical labour and a float switch. Cost is estimated before anyone picks up a wrench.' },
  { t: 12, chip: 'APPR · INPRG', text: 'Approved, and the tech starts it from Maximo Mobile on site.' },
  { t: 15, chip: 'COMP', text: 'Actuals: 1.5 hours. Failure code: float switch stuck. Cost rolls up to the pump, the mechanical room and the parkade. Water drains.' },
  { t: 20, chip: 'PM', text: 'A PM now tests the pump every 90 days and before each rainy season, so this does not happen again.' },
];
let panel, caption, captionTimer = null;
function ensureDom() {
  if (panel) return;
  const css = document.createElement('style');
  css.textContent = `#demo-card{position:fixed;left:16px;top:96px;width:340px;z-index:40;background:rgba(21,26,33,.96);border:1px solid #36404D;border-radius:10px;color:#E8E6E1;font:13px/1.45 'IBM Plex Sans',system-ui,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.45);overflow:hidden}
#demo-card .hd{padding:12px 14px 10px;border-bottom:1px solid #262D36;display:flex;gap:10px;align-items:flex-start}
#demo-card .id{font:600 12px 'IBM Plex Mono',monospace;color:#4C8DFF;letter-spacing:.02em}
#demo-card h4{margin:2px 0 0;font-size:16px;font-weight:600}
#demo-card .x{margin-left:auto;background:none;border:0;color:#8A929C;font-size:20px;cursor:pointer;line-height:1}
#demo-card dl{display:grid;grid-template-columns:96px 1fr;gap:6px 10px;margin:0;padding:12px 14px}
#demo-card dt{color:#8A929C}#demo-card dd{margin:0}
#demo-card .st{display:inline-block;padding:1px 8px;border-radius:10px;font:600 11px 'IBM Plex Mono',monospace}
#demo-card .st.a{background:#1f3d2a;color:#7FB98A}#demo-card .st.n{background:#3a3220;color:#E0A43A}
#demo-card .tree{padding:0 14px 10px;font:12px 'IBM Plex Mono',monospace;color:#A9B1BA}
#demo-card .tree div{padding-left:calc(var(--d)*12px)}
#demo-card .sc{margin:0 14px 12px;padding:8px 10px;border-radius:8px;background:#1b2635;color:#9cc3ff;font-size:12px}
#demo-card .nt{padding:0 14px 12px;color:#C6CCD3}
#demo-card .go{margin:0 14px 14px;width:calc(100% - 28px);padding:10px;border:0;border-radius:8px;background:#4C8DFF;color:#fff;font-weight:600;cursor:pointer}
#demo-caption{position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:40;width:min(760px,calc(100% - 32px));background:rgba(14,17,22,.94);border:1px solid #36404D;border-radius:12px;padding:12px 16px;color:#E8E6E1;font:15px/1.45 'IBM Plex Sans',system-ui,sans-serif;display:none}
#demo-caption .chips{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap}
#demo-caption .chips span{font:600 11px 'IBM Plex Mono',monospace;padding:3px 8px;border-radius:6px;background:#262D36;color:#8A929C}
#demo-caption .chips span.on{background:#4C8DFF;color:#fff}#demo-caption .chips span.done{background:#1f3d2a;color:#7FB98A}`;
  document.head.appendChild(css);
  panel = document.createElement('div'); panel.id = 'demo-card'; panel.hidden = true; document.body.appendChild(panel);
  caption = document.createElement('div'); caption.id = 'demo-caption'; document.body.appendChild(caption);
}
export function showDemoCard(info, onStory) {
  ensureDom();
  const st = info.status === 'ACTIVE' ? 'a' : 'n';
  panel.innerHTML = `<div class="hd"><div><div class="id">${info.id}</div><h4>${info.desc}</h4></div><button class="x" aria-label="Close">×</button></div>
  <dl><dt>Class</dt><dd>${info.cls}</dd><dt>Location</dt><dd style="font-family:'IBM Plex Mono',monospace;font-size:12px">${info.loc}</dd><dt>Status</dt><dd><span class="st ${st}">${info.status}</span></dd>${info.children ? `<dt>Children</dt><dd style="font-size:12px">${info.children.join('<br>')}</dd>` : ''}</dl>
  <div class="tree">${info.path.map((p, i) => `<div style="--d:${i}">${i ? '└ ' : ''}${p}</div>`).join('')}</div>
  ${info.note ? `<div class="nt">${info.note}</div>` : ''}
  <div class="sc">In the Maximo demo: ${info.scene}</div>
  ${info.story ? '<button class="go">Play the demo story (25 s)</button>' : ''}`;
  panel.hidden = false;
  panel.querySelector('.x').onclick = () => (panel.hidden = true);
  const go = panel.querySelector('.go'); if (go) go.onclick = () => { panel.hidden = true; onStory && onStory(); runCaptions(); };
}
export function hideDemoCard() { if (panel) panel.hidden = true; }
function runCaptions() {
  ensureDom(); clearInterval(captionTimer); const start = performance.now(); caption.style.display = 'block';
  const draw = () => {
    const t = (performance.now() - start) / 1000; const i = STEPS.findLastIndex((s) => t >= s.t);
    if (t > 26) { caption.style.display = 'none'; clearInterval(captionTimer); return; }
    caption.innerHTML = `<div class="chips">${STEPS.map((s, k) => `<span class="${k < i ? 'done' : k === i ? 'on' : ''}">${s.chip}</span>`).join('')}</div>${STEPS[i].text}`;
  };
  draw(); captionTimer = setInterval(draw, 250);
}
