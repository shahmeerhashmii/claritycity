// scene.js - Three.js WebGLRenderer, Dual-Viewport Scissor Compare Mode, ACESFilmic Tone Mapping, Dusk/Night Visibility

import * as THREE from 'three';
import { OrbitControls } from '../lib/OrbitControls.js';
import { COLORS } from './config.js';

export class CityScene {
  constructor(canvasContainer, options = {}) {
    this.container = canvasContainer;
    this.theme = options.theme || 'dark';
    this.timeOfDay = options.timeOfDay || 'dusk';
    this.nightBrightness = options.nightBrightness || 1.35;
    this.compareMode = false;

    // Main Renderer with ACESFilmic Tone Mapping & High Dynamic Range exposure
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.appendChild(this.renderer.domElement);

    // Two scenes for Compare mode
    this.sceneA = new THREE.Scene();
    this.sceneB = new THREE.Scene();

    // Primary Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 1, 1000);
    this.defaultCameraPos = new THREE.Vector3(160, 140, 160);
    this.defaultTarget = new THREE.Vector3(0, 0, 0);
    this.camera.position.copy(this.defaultCameraPos);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.minDistance = 25;
    this.controls.maxDistance = 450;
    this.controls.target.copy(this.defaultTarget);

    // Synchronized Camera B
    this.cameraB = new THREE.PerspectiveCamera(40, aspect, 1, 1000);
    this.cameraB.position.copy(this.camera.position);

    this.lightsA = {};
    this.lightsB = {};

    this.setupLighting(this.sceneA, this.lightsA);
    this.setupLighting(this.sceneB, this.lightsB);

    this.setTimeOfDay(this.timeOfDay);

    this.flyToTarget = null;
    this.autoRotate = false;

    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting(scene, lightsObj) {
    // 1. Hemisphere Light for Sky / Ground natural bounce
    const hemiLight = new THREE.HemisphereLight(0x7A9CC6, 0x2A3340, 0.7);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);
    lightsObj.hemi = hemiLight;

    // 2. Main Directional Sunlight / Moonlight
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(120, 180, 100);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 500;
    const d = 180;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);
    lightsObj.sun = dirLight;

    // 3. Cool Moonlight Directional Key Light (Active at Dusk & Night)
    const moonLight = new THREE.DirectionalLight(0x6699CC, 0.6);
    moonLight.position.set(-140, 160, -120);
    scene.add(moonLight);
    lightsObj.moon = moonLight;

    // 4. Soft Ambient Fill
    const ambientLight = new THREE.AmbientLight(0x3B485A, 0.6);
    scene.add(ambientLight);
    lightsObj.ambient = ambientLight;
  }

  setNightBrightness(val) {
    this.nightBrightness = Math.max(0.6, Math.min(2.5, val));
    this.setTimeOfDay(this.timeOfDay);
  }

  setTimeOfDay(tod) {
    this.timeOfDay = tod;
    const nb = this.nightBrightness;

    let skyColor, sunIntensity, sunColor, moonIntensity, moonColor, ambientIntensity, ambientColor, hemiIntensity, exposure, fogDensity;

    if (tod === 'day') {
      skyColor = new THREE.Color('#38485C');
      sunColor = new THREE.Color('#FFF8EE');
      sunIntensity = 1.8;
      moonColor = new THREE.Color('#88B0D8');
      moonIntensity = 0.2;
      ambientColor = new THREE.Color('#506075');
      ambientIntensity = 0.8;
      hemiIntensity = 0.8;
      exposure = 1.25;
      fogDensity = 0.0015;
    } else if (tod === 'dusk') {
      // Warm golden dusk with strong ambient visibility
      skyColor = new THREE.Color('#141A22');
      sunColor = new THREE.Color('#FFA65C');
      sunIntensity = 1.35 * nb;
      moonColor = new THREE.Color('#6C8EBF');
      moonIntensity = 0.8 * nb;
      ambientColor = new THREE.Color('#3A485C');
      ambientIntensity = 0.85 * nb;
      hemiIntensity = 0.9 * nb;
      exposure = 1.35 * nb;
      fogDensity = 0.0022;
    } else {
      // Clear evening night with cool moonlight and glowing city features
      skyColor = new THREE.Color('#0C1017');
      sunColor = new THREE.Color('#4E709E');
      sunIntensity = 0.65 * nb;
      moonColor = new THREE.Color('#78A4D8');
      moonIntensity = 1.2 * nb;
      ambientColor = new THREE.Color('#324255');
      ambientIntensity = 0.95 * nb;
      hemiIntensity = 1.0 * nb;
      exposure = 1.45 * nb;
      fogDensity = 0.0024;
    }

    this.renderer.toneMappingExposure = exposure;

    [this.sceneA, this.sceneB].forEach(scene => {
      scene.background = skyColor;
      scene.fog = new THREE.FogExp2(skyColor, fogDensity);
    });

    [this.lightsA, this.lightsB].forEach(lights => {
      if (lights.sun) {
        lights.sun.color.copy(sunColor);
        lights.sun.intensity = sunIntensity;
      }
      if (lights.moon) {
        lights.moon.color.copy(moonColor);
        lights.moon.intensity = moonIntensity;
      }
      if (lights.ambient) {
        lights.ambient.color.copy(ambientColor);
        lights.ambient.intensity = ambientIntensity;
      }
      if (lights.hemi) {
        lights.hemi.intensity = hemiIntensity;
      }
    });
  }

  setCompareMode(enabled) {
    this.compareMode = enabled;
    this.onResize();
  }

  resetView() {
    this.flyToTarget = {
      pos: this.defaultCameraPos.clone(),
      target: this.defaultTarget.clone(),
      duration: 1.0,
      startTime: performance.now(),
      startPos: this.camera.position.clone(),
      startTarget: this.controls.target.clone()
    };
  }

  flyTo(assetPosition, customOffset = null, duration = 1.2) {
    const offset = customOffset || new THREE.Vector3(25, 20, 25);
    const destPos = assetPosition.clone().add(offset);
    this.flyToTarget = {
      pos: destPos,
      target: assetPosition.clone(),
      duration: duration,
      startTime: performance.now(),
      startPos: this.camera.position.clone(),
      startTarget: this.controls.target.clone()
    };
  }

  updateCameraAnimation() {
    if (!this.flyToTarget) return;

    const elapsed = (performance.now() - this.flyToTarget.startTime) / 1000;
    const t = Math.min(1, elapsed / this.flyToTarget.duration);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    if (this.flyToTarget.startPos) {
      this.camera.position.lerpVectors(this.flyToTarget.startPos, this.flyToTarget.pos, ease);
      this.controls.target.lerpVectors(this.flyToTarget.startTarget, this.flyToTarget.target, ease);
    } else {
      this.camera.position.lerp(this.flyToTarget.pos, 0.1);
      this.controls.target.lerp(this.flyToTarget.target, 0.1);
    }

    if (t >= 1) {
      this.flyToTarget = null;
    }
  }

  onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);

    if (this.compareMode) {
      const isMobile = w < 768;
      if (isMobile) {
        this.camera.aspect = w / (h / 2);
        this.cameraB.aspect = w / (h / 2);
      } else {
        this.camera.aspect = (w / 2) / h;
        this.cameraB.aspect = (w / 2) / h;
      }
    } else {
      this.camera.aspect = w / h;
    }

    this.camera.updateProjectionMatrix();
    this.cameraB.updateProjectionMatrix();
  }

  render(timeSec = 0) {
    this.updateCameraAnimation();
    this.controls.update();

    if (this.autoRotate) {
      this.camera.position.x = Math.cos(timeSec * 0.12) * 200;
      this.camera.position.z = Math.sin(timeSec * 0.12) * 200;
      this.camera.lookAt(this.controls.target);
    }

    this.cameraB.position.copy(this.camera.position);
    this.cameraB.quaternion.copy(this.camera.quaternion);

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    if (this.compareMode) {
      this.renderer.setScissorTest(true);
      const isMobile = w < 768;

      if (isMobile) {
        this.renderer.setViewport(0, h / 2, w, h / 2);
        this.renderer.setScissor(0, h / 2, w, h / 2);
        this.renderer.render(this.sceneA, this.camera);

        this.renderer.setViewport(0, 0, w, h / 2);
        this.renderer.setScissor(0, 0, w, h / 2);
        this.renderer.render(this.sceneB, this.cameraB);
      } else {
        this.renderer.setViewport(0, 0, w / 2, h);
        this.renderer.setScissor(0, 0, w / 2, h);
        this.renderer.render(this.sceneA, this.camera);

        this.renderer.setViewport(w / 2, 0, w / 2, h);
        this.renderer.setScissor(w / 2, 0, w / 2, h);
        this.renderer.render(this.sceneB, this.cameraB);
      }
      this.renderer.setScissorTest(false);
    } else {
      this.renderer.setViewport(0, 0, w, h);
      this.renderer.render(this.sceneA, this.camera);
    }
  }
}
