// incident-vfx.js - Pure In-Scene 3D Incident Visual Effects (Beacons, 3D Text Sprites, Particles, Pulse Rings, Barriers, Crews)

import * as THREE from 'three';

export class IncidentVFXManager {
  constructor(scene, assetPositions) {
    this.scene = scene;
    this.assetPositions = assetPositions || [];
    this.activeIncidents = new Map(); // assetId -> { id, type, street, position, isEmergency, status }
    this.dummy = new THREE.Object3D();

    // Max pooled capacity
    this.maxBeacons = 30;
    this.maxRings = 40;
    this.maxZones = 20;
    this.maxCrews = 30;
    this.maxSprites = 4; // Top 4 in-scene text labels

    this.textSprites = [];
    this.initPools();
    this.initWaterParticles();
    this.initTextSprites();
  }

  initPools() {
    // 1. Emergency Siren Beacons (Vertical Light Columns & Rotating Beacons)
    const colGeo = new THREE.CylinderGeometry(0.3, 1.2, 50, 8);
    colGeo.translate(0, 25, 0);
    const colMat = new THREE.MeshBasicMaterial({
      color: 0xE5484D,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.beaconColumns = new THREE.InstancedMesh(colGeo, colMat, this.maxBeacons);
    this.beaconColumns.position.y = 0;
    this.scene.add(this.beaconColumns);

    // 2. Ground Expanding Pulse Rings
    const ringGeo = new THREE.RingGeometry(1.5, 3.2, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xE5484D,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.pulseRings = new THREE.InstancedMesh(ringGeo, ringMat, this.maxRings);
    this.pulseRings.position.y = 0.15;
    this.scene.add(this.pulseRings);

    // 3. Translucent Impact Disruption Zones
    const zoneGeo = new THREE.CylinderGeometry(20, 20, 1.5, 16);
    const zoneMat = new THREE.MeshBasicMaterial({
      color: 0xE5484D,
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    });
    this.impactZones = new THREE.InstancedMesh(zoneGeo, zoneMat, this.maxZones);
    this.impactZones.position.y = 0.2;
    this.scene.add(this.impactZones);

    // 4. Predictive Crew Trucks & Service Cones
    const truckGeo = new THREE.BoxGeometry(2.0, 1.6, 4.0);
    truckGeo.translate(0, 0.8, 0);
    const truckMat = new THREE.MeshStandardMaterial({
      color: 0xF0AD4E,
      roughness: 0.4,
      metalness: 0.3
    });
    this.crewTrucks = new THREE.InstancedMesh(truckGeo, truckMat, this.maxCrews);
    this.crewTrucks.name = 'instanced_crews';
    this.scene.add(this.crewTrucks);

    // Reset instance matrices
    const zeroMat = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < this.maxBeacons; i++) this.beaconColumns.setMatrixAt(i, zeroMat);
    for (let i = 0; i < this.maxRings; i++) this.pulseRings.setMatrixAt(i, zeroMat);
    for (let i = 0; i < this.maxZones; i++) this.impactZones.setMatrixAt(i, zeroMat);
    for (let i = 0; i < this.maxCrews; i++) this.crewTrucks.setMatrixAt(i, zeroMat);

    this.beaconColumns.instanceMatrix.needsUpdate = true;
    this.pulseRings.instanceMatrix.needsUpdate = true;
    this.impactZones.instanceMatrix.needsUpdate = true;
    this.crewTrucks.instanceMatrix.needsUpdate = true;
  }

  initWaterParticles() {
    this.particleCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const velocities = [];

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3 + 0] = 0;
      positions[i * 3 + 1] = -100; // Hidden underground
      positions[i * 3 + 2] = 0;
      velocities.push({
        vx: (Math.random() - 0.5) * 4,
        vy: 8 + Math.random() * 8,
        vz: (Math.random() - 0.5) * 4,
        originX: 0,
        originZ: 0,
        life: 0
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x66B2FF,
      size: 1.2,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });

    this.waterParticles = new THREE.Points(geometry, material);
    this.waterParticleVelocities = velocities;
    this.scene.add(this.waterParticles);
  }

  initTextSprites() {
    for (let i = 0; i < this.maxSprites; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 384;
      canvas.height = 96;
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(12, 3, 1);
      sprite.visible = false;
      this.scene.add(sprite);
      this.textSprites.push({ sprite, canvas, texture, activeAssetId: null });
    }
  }

  updateTextSprite(spriteObj, text, isEmergency, position) {
    const { canvas, texture, sprite } = spriteObj;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Rounded background pill in 3D canvas
    ctx.fillStyle = isEmergency ? 'rgba(229, 72, 77, 0.92)' : 'rgba(76, 141, 255, 0.92)';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    
    // Draw pill
    const r = 16;
    const x = 10, y = 10, w = canvas.width - 20, h = canvas.height - 20;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Text inside 3D sprite
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px "IBM Plex Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    texture.needsUpdate = true;
    sprite.position.set(position.x, position.y + 6.5, position.z);
    sprite.visible = true;
  }

  syncActiveIncidents(snapshot, masterAssets) {
    if (!snapshot || !snapshot.assetStates) return;

    this.activeIncidents.clear();

    for (let i = 0; i < snapshot.assetStates.length; i++) {
      const state = snapshot.assetStates[i];
      const master = masterAssets[i];
      if (!master) continue;

      const posObj = this.assetPositions.find(p => p.id === master.id);
      if (!posObj) continue;

      if (state.status === 'failed') {
        this.activeIncidents.set(master.id, {
          id: master.id,
          type: master.type,
          street: master.street,
          position: posObj.position,
          isEmergency: true,
          status: 'failed'
        });
      } else if (state.status === 'maintenance' || (snapshot.events && snapshot.events.some(e => e.assetId === master.id && e.type === 'planned' && e.month === snapshot.month))) {
        this.activeIncidents.set(master.id, {
          id: master.id,
          type: master.type,
          street: master.street,
          position: posObj.position,
          isEmergency: false,
          status: 'planned'
        });
      }
    }
  }

  update(dt, timeSec = 0) {
    const zeroMat = new THREE.Matrix4().makeScale(0, 0, 0);

    let beaconIdx = 0;
    let ringIdx = 0;
    let zoneIdx = 0;
    let crewIdx = 0;

    let waterBreakPos = null;

    const incidents = Array.from(this.activeIncidents.values());

    for (const inc of incidents) {
      const pos = inc.position;

      if (inc.isEmergency) {
        // 1. Emergency Light Pillar
        if (beaconIdx < this.maxBeacons) {
          const pulse = Math.sin(timeSec * 8 + beaconIdx) * 0.2 + 0.9;
          this.dummy.position.set(pos.x, 0, pos.z);
          this.dummy.scale.set(pulse, 1, pulse);
          this.dummy.rotation.set(0, timeSec * 4, 0);
          this.dummy.updateMatrix();
          this.beaconColumns.setMatrixAt(beaconIdx++, this.dummy.matrix);
        }

        // 2. Expanding Pulse Rings
        if (ringIdx < this.maxRings) {
          const wave = ((timeSec * 2.5 + ringIdx * 0.4) % 1.0);
          const ringScale = 1.0 + wave * 8.0;
          this.dummy.position.set(pos.x, 0.15, pos.z);
          this.dummy.scale.set(ringScale, ringScale, 1);
          this.dummy.rotation.set(0, 0, 0);
          this.dummy.updateMatrix();
          this.pulseRings.setMatrixAt(ringIdx++, this.dummy.matrix);
        }

        // 3. Impact Area Zone (for water mains, pump stations, bridges)
        if (zoneIdx < this.maxZones && (inc.type === 'pumpStation' || inc.type === 'bridge' || inc.type === 'waterMain')) {
          const zoneRadius = inc.type === 'pumpStation' ? 32 : inc.type === 'bridge' ? 24 : 14;
          this.dummy.position.set(pos.x, 0.2, pos.z);
          this.dummy.scale.set(zoneRadius / 20, 1, zoneRadius / 20);
          this.dummy.updateMatrix();
          this.impactZones.setMatrixAt(zoneIdx++, this.dummy.matrix);
        }

        if (inc.type === 'waterMain' && !waterBreakPos) {
          waterBreakPos = pos;
        }
      } else {
        // Predictive Planned Maintenance: Utility Crew Truck
        if (crewIdx < this.maxCrews) {
          this.dummy.position.set(pos.x + 2.5, 0.1, pos.z + 1.5);
          this.dummy.scale.set(1, 1, 1);
          this.dummy.rotation.set(0, 0.4, 0);
          this.dummy.updateMatrix();
          this.crewTrucks.setMatrixAt(crewIdx++, this.dummy.matrix);
        }
      }
    }

    // Hide remaining pooled instances
    while (beaconIdx < this.maxBeacons) this.beaconColumns.setMatrixAt(beaconIdx++, zeroMat);
    while (ringIdx < this.maxRings) this.pulseRings.setMatrixAt(ringIdx++, zeroMat);
    while (zoneIdx < this.maxZones) this.impactZones.setMatrixAt(zoneIdx++, zeroMat);
    while (crewIdx < this.maxCrews) this.crewTrucks.setMatrixAt(crewIdx++, zeroMat);

    this.beaconColumns.instanceMatrix.needsUpdate = true;
    this.pulseRings.instanceMatrix.needsUpdate = true;
    this.impactZones.instanceMatrix.needsUpdate = true;
    this.crewTrucks.instanceMatrix.needsUpdate = true;

    // Update In-Scene 3D Text Sprites (Top 4 serious alerts)
    const seriousIncidents = incidents.slice(0, this.maxSprites);
    for (let s = 0; s < this.maxSprites; s++) {
      const spriteObj = this.textSprites[s];
      if (s < seriousIncidents.length) {
        const inc = seriousIncidents[s];
        const labelText = inc.type === 'waterMain' ? `Main break, ${inc.street || 'Harbour St'}` :
                          inc.type === 'bridge' ? `Bridge closure, ${inc.street || 'River Crossing'}` :
                          inc.type === 'pumpStation' ? `Pump outage, ${inc.street || 'Station 4'}` :
                          inc.type === 'trafficSignal' ? `Signal failure, ${inc.street || 'Grid'}` :
                          `Light out, ${inc.street || 'Street'}`;
        this.updateTextSprite(spriteObj, labelText, inc.isEmergency, inc.position);
        spriteObj.activeAssetId = inc.id;
      } else {
        spriteObj.sprite.visible = false;
        spriteObj.activeAssetId = null;
      }
    }

    // Update Water Break Particles
    if (this.waterParticles) {
      const positions = this.waterParticles.geometry.attributes.position.array;
      if (waterBreakPos) {
        for (let i = 0; i < this.particleCount; i++) {
          const v = this.waterParticleVelocities[i];
          v.life -= dt * 2.5;
          if (v.life <= 0) {
            v.life = 0.6 + Math.random() * 0.6;
            positions[i * 3 + 0] = waterBreakPos.x + (Math.random() - 0.5) * 1.5;
            positions[i * 3 + 1] = 0.2;
            positions[i * 3 + 2] = waterBreakPos.z + (Math.random() - 0.5) * 1.5;
            v.vy = 8 + Math.random() * 8;
            v.vx = (Math.random() - 0.5) * 5;
            v.vz = (Math.random() - 0.5) * 5;
          } else {
            positions[i * 3 + 0] += v.vx * dt;
            positions[i * 3 + 1] += v.vy * dt;
            positions[i * 3 + 2] += v.vz * dt;
            v.vy -= 22 * dt; // gravity
            if (positions[i * 3 + 1] < 0.2) positions[i * 3 + 1] = 0.2;
          }
        }
        this.waterParticles.visible = true;
        this.waterParticles.geometry.attributes.position.needsUpdate = true;
      } else {
        this.waterParticles.visible = false;
      }
    }
  }

  getActiveEmergencyBlocks() {
    return Array.from(this.activeIncidents.values())
      .filter(i => i.isEmergency)
      .map(i => ({
        x: i.position.x,
        z: i.position.z,
        stopsTraffic: i.type === 'bridge' || i.type === 'waterMain'
      }));
  }

  dispose() {
    if (this.beaconColumns) {
      this.scene.remove(this.beaconColumns);
      this.beaconColumns.geometry.dispose();
      this.beaconColumns.material.dispose();
    }
    if (this.pulseRings) {
      this.scene.remove(this.pulseRings);
      this.pulseRings.geometry.dispose();
      this.pulseRings.material.dispose();
    }
    if (this.impactZones) {
      this.scene.remove(this.impactZones);
      this.impactZones.geometry.dispose();
      this.impactZones.material.dispose();
    }
    if (this.crewTrucks) {
      this.scene.remove(this.crewTrucks);
      this.crewTrucks.geometry.dispose();
      this.crewTrucks.material.dispose();
    }
    if (this.waterParticles) {
      this.scene.remove(this.waterParticles);
      this.waterParticles.geometry.dispose();
      this.waterParticles.material.dispose();
    }
    for (const item of this.textSprites) {
      this.scene.remove(item.sprite);
      item.sprite.material.dispose();
      item.texture.dispose();
    }
    this.textSprites = [];
  }
}
