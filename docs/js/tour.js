// tour.js - Step-Based Guided Tour Click-Through Sequencer & Presenter Notes

import * as THREE from 'three';

export const TOUR_STEPS = [
  // CHAPTER 1: Meet the City
  {
    chapterNumber: 1,
    chapterTitle: "Meet the City",
    stepTitle: "City Overview",
    caption: "Welcome to Clarity City. As Director of Public Works, you oversee critical infrastructure for 100,000 residents across 758 physical assets.",
    presenterNote: "Every city has thousands of assets like these. The first question is: do you even know what you have and what condition it's in?",
    cameraPos: new THREE.Vector3(175, 145, 175),
    cameraTarget: new THREE.Vector3(0, 0, 0),
    strategy: 'reactive',
    startMonth: 0,
    endMonth: 0,
    speed: 1,
    underground: false
  },
  {
    chapterNumber: 1,
    chapterTitle: "Meet the City",
    stepTitle: "Underground Infrastructure",
    caption: "Beneath the streets lie 300 water main segments and 12 pump stations. Aging buried assets are invisible until they fail.",
    presenterNote: "Out of sight, out of mind. Half of water mains in North America are past their design life.",
    cameraPos: new THREE.Vector3(120, 95, 120),
    cameraTarget: new THREE.Vector3(0, 0, 0),
    strategy: 'reactive',
    startMonth: 0,
    endMonth: 0,
    speed: 1,
    underground: true
  },

  // CHAPTER 2: Business as Usual
  {
    chapterNumber: 2,
    chapterTitle: "Business as Usual",
    stepTitle: "Years 0 to 8: Reactive Degradation",
    caption: "Under reactive maintenance, physical assets run to failure. Watch 8 years of operation: emergency repairs multiply and costs accelerate.",
    presenterNote: "This is how most cities operate today. Fix it when it breaks. Notice how emergency repairs don't fully restore asset health.",
    cameraPos: new THREE.Vector3(95, 75, 95),
    cameraTarget: new THREE.Vector3(0, 2, 0),
    strategy: 'reactive',
    startMonth: 0,
    endMonth: 96, // Year 8
    speed: 2.5,
    underground: false
  },
  {
    chapterNumber: 2,
    chapterTitle: "Business as Usual",
    stepTitle: "Critical Bridge Closure",
    caption: "Year 8: Major structural defect on Harbour Bridge forces a 60-day emergency closure affecting 20,000 daily commuters. Emergency repair cost: $850,000.",
    presenterNote: "The problem isn't the repair crews. The problem is nobody saw the joint failure coming until traffic was halted.",
    cameraPos: new THREE.Vector3(45, 30, 25),
    cameraTarget: new THREE.Vector3(0, 2, 0),
    strategy: 'reactive',
    startMonth: 96,
    endMonth: 96,
    speed: 1,
    underground: false
  },

  // CHAPTER 3: You Can't Manage What You Can't See
  {
    chapterNumber: 3,
    chapterTitle: "You Can't Manage What You Can't See",
    stepTitle: "Centralized Asset Registry",
    caption: "Traditional municipal departments lack a unified digital registry. Without condition tracking, 80% of asset lifecycles remain untracked.",
    presenterNote: "Step one is establishing a single source of truth for every asset: identity, location, historical work orders, and live condition.",
    cameraPos: new THREE.Vector3(140, 110, 140),
    cameraTarget: new THREE.Vector3(0, 0, 0),
    strategy: 'predictive',
    startMonth: 0,
    endMonth: 0,
    speed: 1,
    underground: false,
    interactiveType: 'connect-assets'
  },

  // CHAPTER 4: Where's the Risk?
  {
    chapterNumber: 4,
    chapterTitle: "Where's the Risk?",
    stepTitle: "Risk-Based Prioritization",
    caption: "Budgets are finite. Asset Health and Risk Matrix rank interventions by Probability of Failure multiplied by Consequence to Safety and Operations.",
    presenterNote: "You will never have the budget to fix everything. Health scores and consequence matrix direct capital dollars where failure is catastrophic.",
    cameraPos: new THREE.Vector3(130, 120, 130),
    cameraTarget: new THREE.Vector3(0, 0, 0),
    strategy: 'predictive',
    startMonth: 48,
    endMonth: 48,
    speed: 1,
    underground: false,
    interactiveType: 'budget-challenge'
  },

  // CHAPTER 5: See It Coming
  {
    chapterNumber: 5,
    chapterTitle: "See It Coming",
    stepTitle: "IoT Telemetry & Anomaly Detection",
    caption: "IoT vibration telemetry at Pump Station 4 detects microscopic bearing degradation (+380% vs baseline) 6 months before physical failure.",
    presenterNote: "Sensors and anomaly models turn surprises into scheduled work orders. Proactive overhaul costs $35,000 vs $110,000 emergency outage.",
    cameraPos: new THREE.Vector3(25, 18, -35),
    cameraTarget: new THREE.Vector3(6, 2, -14),
    strategy: 'predictive',
    startMonth: 60,
    endMonth: 60,
    speed: 1,
    underground: false,
    interactiveType: 'pump-telemetry'
  },

  // CHAPTER 5 (cont.): Alerts people trust
  {
    chapterNumber: 5,
    chapterTitle: "See It Coming",
    stepTitle: "Alert Thresholds & Prioritization",
    caption: "Not every early warning deserves a truck. Critical assets like trunk water mains and bridges alert earlier and get crews first. A flickering streetlight waits its turn. Fewer false alarms, fewer critical failures.",
    presenterNote: "An alert nobody trusts is just noise with extra steps. Show the Alerts & Priorities panel and flip between 'Weighted by criticality' and 'Same for every asset' to compare critical-asset failures and false alarms.",
    cameraPos: new THREE.Vector3(10, 130, 130),
    cameraTarget: new THREE.Vector3(0, 0, 10),
    strategy: 'predictive',
    startMonth: 96,
    endMonth: 120,
    speed: 2,
    underground: false
  },

  // CHAPTER 6: Right Crew, Right Job, Right Time
  {
    chapterNumber: 6,
    chapterTitle: "Right Crew, Right Job, Right Time",
    stepTitle: "Work Order Execution & Mobile Dispatch",
    caption: "Predictions create value only when maintenance work orders are dispatched efficiently to field crews before failure thresholds are breached.",
    presenterNote: "Closing the loop from prediction to mobile work order completion is where ROI happens.",
    cameraPos: new THREE.Vector3(110, 85, 110),
    cameraTarget: new THREE.Vector3(0, 0, 0),
    strategy: 'predictive',
    startMonth: 120,
    endMonth: 144, // Years 10 to 12
    speed: 2,
    underground: false,
    interactiveType: 'crew-capacity'
  },

  // CHAPTER 7: Stress Test: Cold Snap
  {
    chapterNumber: 7,
    chapterTitle: "Stress Test: Cold Snap",
    stepTitle: "Climate Resilience Stress Test",
    caption: "Extreme freeze event (-15°F polar vortex). Watch how the unmaintained reactive network suffers cascading water main bursts while the predictive network holds.",
    presenterNote: "Extreme weather doesn't create new weaknesses, it exposes the deferred maintenance you already had.",
    cameraPos: new THREE.Vector3(160, 130, 160),
    cameraTarget: new THREE.Vector3(0, 0, 0),
    strategy: 'compare',
    startMonth: 140,
    endMonth: 170, // Play through freeze
    speed: 2,
    underground: false,
    interactiveType: 'cold-snap'
  },

  // CHAPTER 8: Two Futures
  {
    chapterNumber: 8,
    chapterTitle: "Two Futures",
    stepTitle: "20-Year Lifecycle Comparison",
    caption: "Years 14 to 20: The two cities diverge completely. Predictive asset management delivers significant lifecycle cost savings and reduced downtime.",
    presenterNote: "Same city, same budget, same weather. The only difference is visibility and predictive action.",
    cameraPos: new THREE.Vector3(170, 140, 170),
    cameraTarget: new THREE.Vector3(0, 0, 0),
    strategy: 'compare',
    startMonth: 170,
    endMonth: 239,
    speed: 3,
    underground: false
  },
  {
    chapterNumber: 8,
    chapterTitle: "Two Futures",
    stepTitle: "20-Year Executive Audit",
    caption: "Full 20-year operational summary: millions saved in emergency repair costs, hundreds of outages averted, and public infrastructure preserved.",
    presenterNote: "Review the final scorecard and save the LinkedIn-ready summary graphic for your presentation.",
    cameraPos: new THREE.Vector3(160, 135, 160),
    cameraTarget: new THREE.Vector3(0, 0, 0),
    strategy: 'compare',
    startMonth: 239,
    endMonth: 239,
    speed: 1,
    underground: false,
    isFinalSummary: true
  }
];

export class TourManager {
  constructor(app) {
    this.app = app;
    this.currentStepIndex = 0;
    this.inTour = false;
    this.isPlayingStep = false;
    this.presenterNotesVisible = false;
    this.stepPlaybackMonitor = null;

    this.initDOM();
    this.bindControls();
  }

  initDOM() {
    this.startScreen = document.getElementById('tour-start-screen');
    this.btnStartTour = document.getElementById('btn-start-tour');
    this.btnFreePlay = document.getElementById('btn-start-freeplay');

    this.tourTopBar = document.getElementById('tour-top-bar');
    this.stepCounter = document.getElementById('tour-step-counter');
    this.progressSegments = document.getElementById('tour-progress-segments');
    this.btnExitTop = document.getElementById('btn-tour-exit-top');

    this.tourOverlay = document.getElementById('tour-hud-overlay');
    this.chapterTitleCard = document.getElementById('tour-title-card');
    this.chapterCardNumber = document.getElementById('tour-card-number');
    this.chapterCardTitle = document.getElementById('tour-card-title');

    this.captionChapterLabel = document.getElementById('tour-chapter-label');
    this.captionText = document.getElementById('tour-caption-text');
    this.interactiveContainer = document.getElementById('tour-step-interactive-container');

    this.btnNext = document.getElementById('btn-tour-next');
    this.btnPrev = document.getElementById('btn-tour-prev');

    this.presenterNotesPanel = document.getElementById('presenter-notes-panel');
    this.presenterNotesText = document.getElementById('presenter-notes-text');
    this.btnCloseNotes = document.getElementById('btn-close-presenter-notes');

    if (this.btnStartTour) {
      this.btnStartTour.addEventListener('click', () => this.startTour());
    }
    if (this.btnFreePlay) {
      this.btnFreePlay.addEventListener('click', () => this.exitTour());
    }
    if (this.btnNext) {
      this.btnNext.addEventListener('click', () => this.handleNext());
    }
    if (this.btnPrev) {
      this.btnPrev.addEventListener('click', () => this.handlePrev());
    }
    if (this.btnExitTop) {
      this.btnExitTop.addEventListener('click', () => this.exitTour());
    }
    if (this.btnCloseNotes) {
      this.btnCloseNotes.addEventListener('click', () => this.togglePresenterNotes(false));
    }
  }

  bindControls() {
    window.addEventListener('keydown', (e) => {
      // Toggle Presenter Notes with 'N'
      if (e.key === 'n' || e.key === 'N') {
        if (!e.target.matches('input, select, textarea')) {
          this.togglePresenterNotes();
        }
      }

      if (!this.inTour) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.code === 'Space' && !e.target.matches('input, button'))) {
        e.preventDefault();
        this.handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.handlePrev();
      } else if (e.key === 'Escape') {
        this.exitTour();
      }
    });
  }

  togglePresenterNotes(forcedState) {
    this.presenterNotesVisible = forcedState !== undefined ? forcedState : !this.presenterNotesVisible;
    if (this.presenterNotesPanel) {
      this.presenterNotesPanel.classList.toggle('hidden', !this.presenterNotesVisible);
    }
  }

  startTour() {
    this.inTour = true;
    if (this.startScreen) this.startScreen.classList.add('hidden');
    if (this.tourTopBar) this.tourTopBar.classList.remove('hidden');
    if (this.tourOverlay) this.tourOverlay.classList.remove('hidden');
    document.body.classList.add('in-guided-tour');
    this.buildProgressSegments();
    this.loadStep(0);
  }

  exitTour() {
    this.inTour = false;
    this.stopPlaybackMonitor();
    this.app.isPlaying = false;
    this.app.ui.setPlayState(false);
    this.app.ui.closeAssetInspector();

    if (this.startScreen) this.startScreen.classList.add('hidden');
    if (this.tourTopBar) this.tourTopBar.classList.add('hidden');
    if (this.tourOverlay) this.tourOverlay.classList.add('hidden');
    if (this.presenterNotesPanel) this.presenterNotesPanel.classList.add('hidden');
    document.body.classList.remove('in-guided-tour');
    this.app.sceneManager.resetView();
  }

  buildProgressSegments() {
    if (!this.progressSegments) return;
    this.progressSegments.innerHTML = TOUR_STEPS.map((s, idx) => `
      <div class="tour-segment ${idx === 0 ? 'active' : ''}" data-step-idx="${idx}" title="Ch ${s.chapterNumber}: ${s.stepTitle}"></div>
    `).join('');

    const segments = this.progressSegments.querySelectorAll('.tour-segment');
    segments.forEach(seg => {
      seg.addEventListener('click', () => {
        const idx = parseInt(seg.getAttribute('data-step-idx'), 10);
        this.loadStep(idx);
      });
    });
  }

  loadStep(index) {
    if (index < 0 || index >= TOUR_STEPS.length) return;
    this.currentStepIndex = index;
    this.stopPlaybackMonitor();
    this.app.ui.closeAssetInspector();

    const step = TOUR_STEPS[index];

    // Update Segment Progress & Counter
    if (this.stepCounter) {
      this.stepCounter.textContent = `Step ${index + 1} of ${TOUR_STEPS.length}`;
    }
    if (this.progressSegments) {
      const segs = this.progressSegments.querySelectorAll('.tour-segment');
      segs.forEach((seg, idx) => {
        seg.classList.toggle('active', idx === index);
        seg.classList.toggle('completed', idx < index);
      });
    }

    // Update Captions
    if (this.captionChapterLabel) {
      this.captionChapterLabel.textContent = `CHAPTER ${step.chapterNumber}: ${step.chapterTitle.toUpperCase()}`;
    }
    if (this.captionText) {
      this.captionText.textContent = step.caption;
    }
    if (this.btnNext) {
      this.btnNext.textContent = index === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next →";
    }

    // Update Presenter Notes
    if (this.presenterNotesText) {
      this.presenterNotesText.textContent = step.presenterNote;
    }

    // Camera Navigation
    if (step.cameraPos && step.cameraTarget) {
      this.app.sceneManager.flyTo(step.cameraTarget, step.cameraPos.clone().sub(step.cameraTarget), 1.8);
    }

    // Strategy, Underground, and Month Setup
    if (step.strategy) {
      this.app.setStrategy(step.strategy);
    }
    if (step.underground !== undefined) {
      this.app.ui.btnUnderground?.classList.toggle('active', step.underground);
      this.app.setUnderground(step.underground);
    }

    // Render step-specific interactive prompts
    this.renderStepInteractive(step);

    // Timeline range execution
    if (step.startMonth !== undefined && step.endMonth !== undefined && step.endMonth > step.startMonth) {
      this.app.setMonth(step.startMonth);
      this.app.playbackSpeed = step.speed || 2;
      this.app.isPlaying = true;
      this.isPlayingStep = true;
      this.app.ui.setPlayState(true);

      this.stepPlaybackMonitor = setInterval(() => {
        if (!this.inTour || this.currentStepIndex !== index) {
          this.stopPlaybackMonitor();
          return;
        }
        if (this.app.currentMonth >= step.endMonth) {
          this.app.setMonth(step.endMonth);
          this.app.isPlaying = false;
          this.isPlayingStep = false;
          this.app.ui.setPlayState(false);
          this.stopPlaybackMonitor();
        }
      }, 150);
    } else {
      this.app.isPlaying = false;
      this.isPlayingStep = false;
      this.app.ui.setPlayState(false);
      if (step.startMonth !== undefined) {
        this.app.setMonth(step.startMonth);
      }
    }

    if (step.isFinalSummary) {
      this.app.ui.showSummary(this.app.precomputed.reactive.finalTotals, this.app.precomputed.predictive.finalTotals);
    }
  }

  stopPlaybackMonitor() {
    if (this.stepPlaybackMonitor) {
      clearInterval(this.stepPlaybackMonitor);
      this.stepPlaybackMonitor = null;
    }
  }

  renderStepInteractive(step) {
    if (!this.interactiveContainer) return;
    this.interactiveContainer.innerHTML = '';

    if (!step.interactiveType) return;

    if (step.interactiveType === 'connect-assets') {
      this.interactiveContainer.innerHTML = `
        <div class="tour-inline-interactive">
          <button id="btn-tour-connect" class="tour-action-btn">Connect All 758 Physical Assets →</button>
        </div>
      `;
      const btn = document.getElementById('btn-tour-connect');
      btn?.addEventListener('click', () => {
        btn.textContent = 'All 758 Assets Connected (100% Tracked) ✓';
        btn.classList.add('done');
      });
    } else if (step.interactiveType === 'budget-challenge') {
      this.interactiveContainer.innerHTML = `
        <div class="tour-inline-interactive">
          <div style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-color); margin-bottom: 4px;">
            $2,000,000 Risk-Optimized Allocation:
          </div>
          <div style="font-size: 12px; color: var(--text-muted);">
            • Harbour Bridge structural joint rehabilitation ($1,000,000)<br>
            • Critical high-failure water main replacement ($600,000)<br>
            • Pump Station 4 bearing overhaul ($400,000)
          </div>
        </div>
      `;
    } else if (step.interactiveType === 'pump-telemetry') {
      this.interactiveContainer.innerHTML = `
        <div class="tour-inline-interactive">
          <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 11px; margin-bottom: 4px;">
            <span>Vibration: 4.8 mm/s (+380%)</span>
            <span style="color: var(--status-critical);">Anomaly Detected</span>
          </div>
          <button id="btn-tour-overhaul" class="tour-action-btn">Schedule Planned Bearing Overhaul ($40,000) →</button>
        </div>
      `;
      const btn = document.getElementById('btn-tour-overhaul');
      btn?.addEventListener('click', () => {
        btn.textContent = 'Work Order Dispatched to Field Crew ✓';
        btn.classList.add('done');
      });
    } else if (step.interactiveType === 'crew-capacity') {
      this.interactiveContainer.innerHTML = `
        <div class="tour-inline-interactive">
          <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 11px; margin-bottom: 4px;">
            <span>Field Crew Capacity: 25 jobs/month</span>
            <span style="color: var(--status-healthy);">Zero Backlog</span>
          </div>
        </div>
      `;
    } else if (step.interactiveType === 'cold-snap') {
      this.interactiveContainer.innerHTML = `
        <div class="tour-inline-interactive">
          <div style="font-family: var(--font-mono); font-size: 11px; color: #6BA0FF;">
            Severe Cold Snap Active (-15°F Polar Vortex)
          </div>
        </div>
      `;
    }
  }

  handleNext() {
    const step = TOUR_STEPS[this.currentStepIndex];
    // If step is currently playing time, snap immediately to the end month
    if (this.isPlayingStep && step && step.endMonth > this.app.currentMonth) {
      this.stopPlaybackMonitor();
      this.app.setMonth(step.endMonth);
      this.app.isPlaying = false;
      this.isPlayingStep = false;
      this.app.ui.setPlayState(false);
      return;
    }

    if (this.currentStepIndex < TOUR_STEPS.length - 1) {
      this.loadStep(this.currentStepIndex + 1);
    } else {
      this.exitTour();
    }
  }

  handlePrev() {
    if (this.currentStepIndex > 0) {
      this.loadStep(this.currentStepIndex - 1);
    }
  }
}
