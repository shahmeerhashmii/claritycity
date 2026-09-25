// recording.js - Cinematic recording mode, aspect ratio letterboxing, and keyboard shortcuts

export class RecordingController {
  constructor(options = {}) {
    this.scene = options.scene;
    this.uiManager = options.uiManager;
    this.isRecording = false;
    this.currentAspect = 'fullscreen'; // 'fullscreen', '16:9', '1:1', '4:5'

    this.initControls();
    this.bindKeyboardShortcuts();
  }

  initControls() {
    this.aspectSelector = document.getElementById('recording-aspect-select');
    if (this.aspectSelector) {
      this.aspectSelector.addEventListener('change', (e) => {
        this.setAspectRatio(e.target.value);
      });
    }
  }

  setRecording(enabled) {
    this.isRecording = enabled;
    document.body.classList.toggle('recording-mode', enabled);
    if (this.scene) {
      this.scene.autoRotate = enabled;
    }
  }

  setAspectRatio(aspect) {
    this.currentAspect = aspect;
    const viewportContainer = document.getElementById('viewport-wrapper');
    if (!viewportContainer) return;

    viewportContainer.className = 'viewport-wrapper';
    if (aspect !== 'fullscreen') {
      viewportContainer.classList.add(`aspect-${aspect.replace(':', '-')}`);
    }

    if (this.scene) {
      setTimeout(() => this.scene.onResize(), 50);
    }
  }

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't intercept if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        const playing = !this.uiManager.isPlaying;
        this.uiManager.setPlayState(playing);
        this.uiManager.onPlayPause(playing);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        this.uiManager.currentMonth = 0;
        this.uiManager.updateTimelineUI(0);
        this.uiManager.onMonthChange(0);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        const nextStrategy = this.uiManager.currentStrategy === 'compare' ? 'reactive' : 'compare';
        this.uiManager.currentStrategy = nextStrategy;
        this.uiManager.onStrategyChange(nextStrategy);
        const btns = document.querySelectorAll('.strategy-toggle-btn');
        btns.forEach(b => b.classList.toggle('active', b.getAttribute('data-strategy') === nextStrategy));
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        const active = document.body.classList.toggle('hide-ui');
      }
    });
  }
}
