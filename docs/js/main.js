// main.js - Application bootstrap, animation loop, raycasting, and timeline orchestration

import * as THREE from 'three';
import { SimulationEngine } from './simulation.js';
import { createCityModel } from './city-builder.js';
import { AssetRenderer } from './asset-renderer.js';
import { CityScene } from './scene.js';
import { CostTrajectoryChart } from './charts.js';
import { EventFeed } from './event-feed.js';
import { UIManager } from './ui.js';
import { RecordingController } from './recording.js';
import { exportSummaryImage } from './export-summary.js';
import { renderAssumptionsForm } from './assumptions-form.js';
import { TrafficSystem } from './traffic-system.js';
import { DemoAssets, showDemoCard, hideDemoCard } from './demo-assets.js';
import { IncidentVFXManager } from './incident-vfx.js';
import { soundManager } from './sound.js';
import { TourManager } from './tour.js';

class App {
  constructor() {
    this.seed = 42;
    this.currentMonth = 0;
    this.currentStrategy = 'reactive'; // 'reactive', 'predictive', 'compare'
    this.isPlaying = false;
    this.playbackSpeed = 1;
    this.playAccumulator = 0;

    this.init();
  }

  init() {
    // 1. Initialize Simulation Engine & Precompute both strategies
    this.simulation = new SimulationEngine(this.seed);
    this.precomputed = this.simulation.run();
    this.masterAssets = this.simulation.assets;

    // 2. Initialize Three.js Viewport
    const container = document.getElementById('three-canvas-container');
    this.sceneManager = new CityScene(container, { theme: 'dark' });

    // 3. Build City Models for Scene A & Scene B
    this.cityA = createCityModel(this.sceneManager.sceneA, this.seed, 'dark');
    this.cityB = createCityModel(this.sceneManager.sceneB, this.seed, 'dark');

    // 4. Asset Renderers for Scene A (Left/Reactive) & Scene B (Right/Predictive)
    this.assetRendererA = new AssetRenderer(this.sceneManager.sceneA, this.masterAssets, this.seed);
    this.assetRendererB = new AssetRenderer(this.sceneManager.sceneB, this.masterAssets, this.seed);

    // 4b. Incident VFX Managers for Scene A & B
    this.incidentVFX_A = new IncidentVFXManager(this.sceneManager.sceneA, this.assetRendererA.assetPositions);
    this.incidentVFX_B = new IncidentVFXManager(this.sceneManager.sceneB, this.assetRendererB.assetPositions);

    // 4c. Instanced Moving Traffic
    this.trafficA = new TrafficSystem(this.sceneManager.sceneA, 80, this.seed);
    this.trafficB = new TrafficSystem(this.sceneManager.sceneB, 80, this.seed);
    this.demoA = new DemoAssets(this.sceneManager.sceneA);
    this.demoB = new DemoAssets(this.sceneManager.sceneB);

    // 4d. Sound Toggle Button
    const btnSound = document.getElementById('btn-sound-toggle');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const enabled = !soundManager.enabled;
        soundManager.toggle(enabled);
        btnSound.textContent = enabled ? 'Sound: On' : 'Sound: Off';
        btnSound.classList.toggle('active', enabled);
      });
    }

    const soundVolSlider = document.getElementById('sound-volume-slider');
    if (soundVolSlider) {
      soundVolSlider.addEventListener('input', (e) => {
        soundManager.setVolume(parseFloat(e.target.value));
      });
    }

    // 4e. Time of Day Controls
    const todBtns = document.querySelectorAll('.tod-btn');
    todBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        todBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tod = btn.getAttribute('data-tod');
        this.sceneManager.setTimeOfDay(tod);
      });
    });

    // 5. Initialize Trajectory Chart
    const chartCanvas = document.getElementById('trajectory-canvas');
    this.costChart = new CostTrajectoryChart(chartCanvas);
    this.costChart.setData(this.precomputed.reactive.snapshots, this.precomputed.predictive.snapshots);

    // 6. Initialize Operations Event Feed
    const feedContainer = document.getElementById('event-feed-list');
    this.eventFeed = new EventFeed(feedContainer, (assetId) => {
      this.flyToAsset(assetId);
    });
    this.updateEventFeed();

    // 7. Initialize UI Manager
    this.ui = new UIManager({
      onMonthChange: (m) => this.setMonth(m),
      onPlayPause: (p) => { this.isPlaying = p; },
      onSpeedChange: (s) => { this.playbackSpeed = s; },
      onStrategyChange: (st) => this.setStrategy(st),
      onUndergroundToggle: (v) => {
        this.isUnderground = v;
        if (this.cityA?.setUndergroundMode) this.cityA.setUndergroundMode(v);
        if (this.cityB?.setUndergroundMode) this.cityB.setUndergroundMode(v);
        this.assetRendererA.setUnderground(v);
        this.assetRendererB.setUnderground(v);
        this.demoA?.setUnderground(v); this.demoB?.setUnderground(v);
        if (v) {
          this.sceneManager.flyTo(new THREE.Vector3(0, 0, 0), new THREE.Vector3(120, 95, 120), 1.0);
        } else {
          this.sceneManager.resetView();
        }
      },
      onResetView: () => this.sceneManager.resetView(),
      onNewSeed: () => this.regenerateSeed(),
      onRecordingToggle: (r) => this.recordingController.setRecording(r),
      onSaveSummaryImage: () => this.saveSummaryImage(),
      onAssumptionsChange: (action) => {
        if (action === 'reset') {
          this.simulation = new SimulationEngine(this.seed);
          this.precomputed = this.simulation.run();
          this.costChart.setData(this.precomputed.reactive.snapshots, this.precomputed.predictive.snapshots);
          this.initAssumptionsUI();
          this.updateState();
        }
      }
    });
    this.setupV2Controls();

    this.initAssumptionsUI();

    // 8. Initialize Recording Controller & Shortcuts
    this.recordingController = new RecordingController({
      scene: this.sceneManager,
      uiManager: this.ui
    });

    // 8b. Initialize Guided Tour Manager
    this.tourManager = new TourManager(this);

    // 9. Setup Mouse/Touch Asset Picking Raycaster
    this.setupRaycaster(container);

    // Initial state update
    this.updateState();

    // Start RAF loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.renderLoop(t));
  }

  setMonth(month) {
    this.currentMonth = Math.max(0, Math.min(239, month));
    this.updateState();

    if (this.currentMonth === 239 && !this.isPlaying) {
      this.ui.showSummary(this.precomputed.reactive.finalTotals, this.precomputed.predictive.finalTotals);
    }
  }

  // ---------- v2: alerts panel, alert policy and camera views ----------
  updateAlertsPanel(reactiveSnap, predictiveSnap) {
    const card = document.getElementById('alerts-card');
    if (!card || !predictiveSnap) return;
    const reactiveOnly = this.currentStrategy === 'reactive';
    card.classList.toggle('reactive', reactiveOnly);
    document.getElementById('alerts-reactive-note')?.classList.toggle('hidden', !reactiveOnly);
    const fmt = (n) => (n || 0).toLocaleString();
    const acted = predictiveSnap.alertsActioned || 0;
    const falsePct = acted ? Math.round((predictiveSnap.falseAlarms / acted) * 100) : 0;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('metric-alerts', fmt(predictiveSnap.alertsRaised));
    set('metric-false-alarms', `${fmt(predictiveSnap.falseAlarms)} (${falsePct}%)`);
    set('metric-critical-failures', reactiveSnap
      ? `${fmt(predictiveSnap.criticalFailures)} vs ${fmt(reactiveSnap.criticalFailures)}`
      : fmt(predictiveSnap.criticalFailures));
    set('metric-backlog', fmt(predictiveSnap.alertBacklog));
    const policy = this.simulation.assumptions.predictive.alertPolicy || 'risk';
    set('alert-policy-chip', policy === 'risk' ? 'Weighted by criticality' : 'Same for every asset');
    document.querySelectorAll('.policy-btn').forEach((b) => b.classList.toggle('active', b.dataset.policy === policy));
  }

  setAlertPolicy(policy) {
    const a = JSON.parse(JSON.stringify(this.simulation.assumptions));
    if (a.predictive.alertPolicy === policy) return;
    a.predictive.alertPolicy = policy;
    this.simulation.setAssumptions(a);
    this.precomputed = this.simulation.precomputed;
    this.costChart.setData(this.precomputed.reactive.snapshots, this.precomputed.predictive.snapshots);
    this.updateEventFeed();
    this.updateState();
    this.initAssumptionsUI();
  }

  setCameraView(view) {
    const V = THREE.Vector3;
    const views = {
      overview: () => this.sceneManager.resetView(),
      top: () => this.sceneManager.flyTo(new V(0, 0, 0), new V(0, 300, 1), 1.0),
      river: () => this.sceneManager.flyTo(new V(0, 0, 10), new V(10, 120, 120), 1.0),
      street: () => this.sceneManager.flyTo(new V(-18, 2, -18), new V(-32, 9, -40), 1.2)
    };
    (views[view] || views.overview)();
    document.querySelectorAll('.view-preset-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  }

  setupV2Controls() {
    document.querySelectorAll('.policy-btn').forEach((b) => b.addEventListener('click', () => this.setAlertPolicy(b.dataset.policy)));
    document.querySelectorAll('.view-preset-btn').forEach((b) => b.addEventListener('click', () => this.setCameraView(b.dataset.view)));
    const order = ['overview', 'top', 'river', 'street'];
    window.addEventListener('keydown', (e) => {
      if (e.target.closest && e.target.closest('input, textarea, select')) return;
      if (document.body.classList.contains('in-guided-tour')) return;
      const i = ['1', '2', '3', '4'].indexOf(e.key);
      if (i >= 0) this.setCameraView(order[i]);
    });
  }

  setStrategy(strategy) {
    this.currentStrategy = strategy;
    this.sceneManager.setCompareMode(strategy === 'compare');
    this.updateEventFeed();
    this.updateState();
  }

  updateEventFeed() {
    const activeStrategy = this.currentStrategy === 'predictive' ? 'predictive' : 'reactive';
    const allEvents = [];
    const snapshots = this.precomputed[activeStrategy].snapshots;
    for (const snap of snapshots) {
      if (snap.events && snap.events.length > 0) {
        allEvents.push(...snap.events);
      }
    }
    this.eventFeed.setEvents(allEvents);
    this.eventFeed.setCurrentMonth(this.currentMonth);
  }

  updateState() {
    const reactiveSnap = this.simulation.getSnapshot('reactive', this.currentMonth);
    const predictiveSnap = this.simulation.getSnapshot('predictive', this.currentMonth);
    const activeSnap = this.currentStrategy === 'predictive' ? predictiveSnap : reactiveSnap;

    // Update 3D visual assets & Incidents
    const timeSec = performance.now() / 1000;
    if (this.currentStrategy === 'predictive') {
      this.assetRendererA.updateFromSnapshot(predictiveSnap, timeSec);
      if (this.incidentVFX_A) this.incidentVFX_A.syncActiveIncidents(predictiveSnap, this.masterAssets);
    } else if (this.currentStrategy === 'reactive') {
      this.assetRendererA.updateFromSnapshot(reactiveSnap, timeSec);
      if (this.incidentVFX_A) this.incidentVFX_A.syncActiveIncidents(reactiveSnap, this.masterAssets);
    } else {
      // Compare Mode: Scene A = Reactive, Scene B = Predictive
      this.assetRendererA.updateFromSnapshot(reactiveSnap, timeSec);
      this.assetRendererB.updateFromSnapshot(predictiveSnap, timeSec);
      if (this.incidentVFX_A) this.incidentVFX_A.syncActiveIncidents(reactiveSnap, this.masterAssets);
      if (this.incidentVFX_B) this.incidentVFX_B.syncActiveIncidents(predictiveSnap, this.masterAssets);
    }

    this.updateAlertsPanel(reactiveSnap, predictiveSnap);

    // Active incidents counter
    const activeEmergencies = (activeSnap.assetStates || []).filter(s => s.status === 'failed').length;
    const badge = document.getElementById('active-incidents-badge');
    if (badge) {
      badge.textContent = `${activeEmergencies} Active Incidents`;
      badge.className = 'badge';
    }

    const hasMajorIncident = (activeSnap.events || []).some(e => (e.assetType === 'bridge' || e.assetType === 'pumpStation') && e.type === 'emergency');
    if (hasMajorIncident && this.isPlaying) {
      soundManager.playEmergencyAlarm();
    } else if ((activeSnap.events || []).some(e => e.type === 'planned') && this.isPlaying) {
      soundManager.playPredictivePing();
    }

    // Update UI HUD Metrics
    this.ui.updateTimelineUI(this.currentMonth);
    this.ui.updateMetrics(activeSnap, reactiveSnap, predictiveSnap);
    this.costChart.setCurrentMonth(this.currentMonth);
    this.eventFeed.setCurrentMonth(this.currentMonth);
  }

  regenerateSeed() {
    this.seed = Math.floor(Math.random() * 900000) + 100000;
    this.currentMonth = 0;
    this.isPlaying = false;
    this.ui.setPlayState(false);

    // 1. Properly dispose of previous resources
    if (this.cityA?.dispose) this.cityA.dispose();
    if (this.cityB?.dispose) this.cityB.dispose();
    if (this.assetRendererA?.dispose) this.assetRendererA.dispose();
    if (this.assetRendererB?.dispose) this.assetRendererB.dispose();
    if (this.trafficA?.dispose) this.trafficA.dispose();
    if (this.trafficB?.dispose) this.trafficB.dispose();
    if (this.demoA?.dispose) this.demoA.dispose();
    if (this.demoB?.dispose) this.demoB.dispose();
    if (this.incidentVFX_A?.dispose) this.incidentVFX_A.dispose();
    if (this.incidentVFX_B?.dispose) this.incidentVFX_B.dispose();

    // 2. Clear scene trees cleanly
    while (this.sceneManager.sceneA.children.length > 0) {
      this.sceneManager.sceneA.remove(this.sceneManager.sceneA.children[0]);
    }
    while (this.sceneManager.sceneB.children.length > 0) {
      this.sceneManager.sceneB.remove(this.sceneManager.sceneB.children[0]);
    }

    // 3. Recompute Simulation with new Seed
    this.simulation = new SimulationEngine(this.seed);
    this.precomputed = this.simulation.run();
    this.masterAssets = this.simulation.assets;

    // 4. Re-setup lighting and scene materials
    this.sceneManager.lightsA = {};
    this.sceneManager.lightsB = {};
    this.sceneManager.setupLighting(this.sceneManager.sceneA, this.sceneManager.lightsA);
    this.sceneManager.setupLighting(this.sceneManager.sceneB, this.sceneManager.lightsB);
    this.sceneManager.setTimeOfDay(this.sceneManager.timeOfDay);

    // 5. Rebuild Cities, Assets, Traffic, and VFX
    this.cityA = createCityModel(this.sceneManager.sceneA, this.seed, 'dark');
    this.cityB = createCityModel(this.sceneManager.sceneB, this.seed, 'dark');
    this.assetRendererA = new AssetRenderer(this.sceneManager.sceneA, this.masterAssets, this.seed);
    this.assetRendererB = new AssetRenderer(this.sceneManager.sceneB, this.masterAssets, this.seed);
    this.incidentVFX_A = new IncidentVFXManager(this.sceneManager.sceneA, this.assetRendererA.assetPositions);
    this.incidentVFX_B = new IncidentVFXManager(this.sceneManager.sceneB, this.assetRendererB.assetPositions);
    this.trafficA = new TrafficSystem(this.sceneManager.sceneA, 80, this.seed);
    this.trafficB = new TrafficSystem(this.sceneManager.sceneB, 80, this.seed);
    this.demoA = new DemoAssets(this.sceneManager.sceneA);
    this.demoB = new DemoAssets(this.sceneManager.sceneB);

    // 6. Update Chart and UI state
    this.costChart.setData(this.precomputed.reactive.snapshots, this.precomputed.predictive.snapshots);
    this.initAssumptionsUI();
    this.updateEventFeed();
    this.setMonth(0);
    this.sceneManager.resetView();
  }

  flyToAsset(assetId) {
    const assetPos = this.assetRendererA.assetPositions.find(p => p.id === assetId);
    if (assetPos) {
      this.sceneManager.flyTo(assetPos.position);
      const snapshot = this.simulation.getSnapshot(this.currentStrategy === 'predictive' ? 'predictive' : 'reactive', this.currentMonth);
      const fullSnapshots = this.precomputed[this.currentStrategy === 'predictive' ? 'predictive' : 'reactive'].snapshots;
      this.ui.showAssetInspector(assetPos, snapshot, fullSnapshots);
    }
  }

  setupRaycaster(container) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };

    // Hover tooltip element
    let hoverTooltip = document.getElementById('asset-hover-tooltip');
    if (!hoverTooltip) {
      hoverTooltip = document.createElement('div');
      hoverTooltip.id = 'asset-hover-tooltip';
      hoverTooltip.className = 'asset-hover-tooltip hidden';
      document.body.appendChild(hoverTooltip);
    }

    const getNormalizedCoords = (clientX, clientY) => {
      const rect = container.getBoundingClientRect();
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        return null;
      }
      let normX = ((clientX - rect.left) / rect.width) * 2 - 1;
      let normY = -((clientY - rect.top) / rect.height) * 2 + 1;

      let isRightSide = false;
      if (this.currentStrategy === 'compare') {
        const isMobile = window.innerWidth < 768;
        if (!isMobile) {
          if (normX > 0) {
            normX = (normX - 0.5) * 2;
            isRightSide = true;
          } else {
            normX = (normX + 0.5) * 2;
          }
        } else {
          if (normY < 0) {
            normY = (normY + 0.5) * 2;
            isRightSide = true;
          } else {
            normY = (normY - 0.5) * 2;
          }
        }
      }
      return { normX, normY, isRightSide, clientX, clientY };
    };

    const performPick = (coords) => {
      if (!coords) return null;
      mouse.x = coords.normX;
      mouse.y = coords.normY;
      raycaster.setFromCamera(mouse, this.sceneManager.camera);

      const targetRenderer = (this.currentStrategy === 'compare' && coords.isRightSide)
        ? this.assetRendererB
        : this.assetRendererA;

      const clickable = targetRenderer.getClickableMeshes();
      const intersects = raycaster.intersectObjects(clickable, false);
      // demo-script assets (King Parkade, sidewalk, sanitary, park): nearest hit wins
      const demo = (this.currentStrategy === 'compare' && coords.isRightSide) ? this.demoB : this.demoA;
      const dHits = demo ? raycaster.intersectObjects(demo.getClickables(), false) : [];
      const dBest = dHits.length ? demo.bestHit(dHits) : null;
      if (dBest && (!intersects.length || dBest.distance < intersects[0].distance || dBest.object.userData.demoId !== 'PTB-KSP-BLDG')) {
        return { demoInfo: demo.infoFor(dBest.object), isRightSide: coords.isRightSide };
      }
      if (intersects.length > 0) {
        const hit = intersects[0];
        const assetInfo = targetRenderer.findAssetAt(hit.object, hit.instanceId);
        return { assetInfo, isRightSide: coords.isRightSide };
      }
      return null;
    };

    container.addEventListener('pointerdown', (e) => {
      downPos = { x: e.clientX, y: e.clientY };
    });

    container.addEventListener('pointerup', (e) => {
      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      if (dist < 6) { // True click/tap, not a camera drag
        const coords = getNormalizedCoords(e.clientX, e.clientY);
        const result = performPick(coords);
        if (result && result.demoInfo) {
          this.ui.closeAssetInspector();
          showDemoCard(result.demoInfo, () => { this.demoA?.playStory(); this.demoB?.playStory(); });
        } else if (result && result.assetInfo) {
          hideDemoCard();
          const strategyKey = this.currentStrategy === 'compare'
            ? (result.isRightSide ? 'predictive' : 'reactive')
            : (this.currentStrategy === 'predictive' ? 'predictive' : 'reactive');

          const snapshot = this.simulation.getSnapshot(strategyKey, this.currentMonth);
          const fullSnapshots = this.precomputed[strategyKey].snapshots;
          this.ui.showAssetInspector(result.assetInfo, snapshot, fullSnapshots);
        } else {
          // Clicked empty ground / sky -> Close open inspector
          this.ui.closeAssetInspector();
        }
      }
    });

    // Close inspector on Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.ui.closeAssetInspector();
      }
    });

    container.addEventListener('pointermove', (e) => {
      const coords = getNormalizedCoords(e.clientX, e.clientY);
      const result = coords ? performPick(coords) : null;
      if (result && result.demoInfo) {
        container.style.cursor = 'pointer';
        hoverTooltip.textContent = `${result.demoInfo.id} (${result.demoInfo.desc})`;
        hoverTooltip.style.left = `${e.clientX + 14}px`; hoverTooltip.style.top = `${e.clientY + 14}px`;
        hoverTooltip.classList.remove('hidden');
      } else if (result && result.assetInfo) {
        container.style.cursor = 'pointer';
        const typeLabels = {
          pumpStation: 'PUMP STATION',
          waterMain: 'WATER MAIN',
          bridge: 'BRIDGE',
          trafficSignal: 'TRAFFIC SIGNAL',
          streetlight: 'STREETLIGHT'
        };
        hoverTooltip.textContent = `${result.assetInfo.id} (${typeLabels[result.assetInfo.type] || result.assetInfo.type})`;
        hoverTooltip.style.left = `${e.clientX + 14}px`;
        hoverTooltip.style.top = `${e.clientY + 14}px`;
        hoverTooltip.classList.remove('hidden');
      } else {
        container.style.cursor = 'default';
        hoverTooltip.classList.add('hidden');
      }
    });

    container.addEventListener('pointerleave', () => {
      container.style.cursor = 'default';
      hoverTooltip.classList.add('hidden');
    });
  }

  initAssumptionsUI() {
    const formContainer = document.getElementById('assumptions-form-container');
    if (!formContainer) return;
    const liveMetrics = this.precomputed.reactive.finalTotals;
    renderAssumptionsForm(formContainer, this.simulation.assumptions, liveMetrics, (updatedAssumptions) => {
      this.simulation.setAssumptions(updatedAssumptions);
      this.precomputed = this.simulation.precomputed;
      this.costChart.setData(this.precomputed.reactive.snapshots, this.precomputed.predictive.snapshots);
      this.updateEventFeed();
      this.updateState();
      this.initAssumptionsUI(); // refresh live metrics
      document.getElementById('assumptions-modal').classList.add('hidden');
    });

    const cancelBtn = document.getElementById('btn-cancel-assumptions');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        document.getElementById('assumptions-modal').classList.add('hidden');
      };
    }
  }


  saveSummaryImage() {
    exportSummaryImage(this.precomputed.reactive.finalTotals, this.precomputed.predictive.finalTotals, this.seed);
  }

  renderLoop(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;
    const timeSec = time / 1000;

    // Update Incident VFX
    if (this.incidentVFX_A) this.incidentVFX_A.update(dt, timeSec);
    if (this.incidentVFX_B) this.incidentVFX_B.update(dt, timeSec);

    // Animate moving traffic with incident slowdowns
    const blocksA = this.incidentVFX_A ? this.incidentVFX_A.getActiveEmergencyBlocks() : [];
    const blocksB = this.incidentVFX_B ? this.incidentVFX_B.getActiveEmergencyBlocks() : [];
    if (this.trafficA) this.trafficA.update(dt, blocksA);
    if (this.trafficB) this.trafficB.update(dt, blocksB);
    this.demoA?.update(dt); this.demoB?.update(dt);

    // Timeline playback progress
    if (this.isPlaying) {
      // 1x speed = 240 months in 60s -> 4 months / sec
      const monthsPerSec = 4 * this.playbackSpeed;
      this.playAccumulator += dt * monthsPerSec;

      if (this.playAccumulator >= 1) {
        const advanceMonths = Math.floor(this.playAccumulator);
        this.playAccumulator -= advanceMonths;
        const nextMonth = this.currentMonth + advanceMonths;

        if (nextMonth >= 239) {
          this.setMonth(239);
          this.isPlaying = false;
          this.ui.setPlayState(false);
          this.ui.showSummary(this.precomputed.reactive.finalTotals, this.precomputed.predictive.finalTotals);
        } else {
          this.setMonth(nextMonth);
        }
      }
    }

    // Render Scene
    this.sceneManager.render(time / 1000);

    requestAnimationFrame((t) => this.renderLoop(t));
  }
}

// Bootstrap when DOM is ready
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
  });
} else {
  window.app = new App();
}
