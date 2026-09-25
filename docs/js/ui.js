// ui.js - HUD elements, animated scoreboard numbers, inspector, modals, timeline controls

import { renderSparklineSVG } from './charts.js';

export class UIManager {
  constructor(options = {}) {
    this.onMonthChange = options.onMonthChange || (() => {});
    this.onPlayPause = options.onPlayPause || (() => {});
    this.onSpeedChange = options.onSpeedChange || (() => {});
    this.onStrategyChange = options.onStrategyChange || (() => {});
    this.onUndergroundToggle = options.onUndergroundToggle || (() => {});
    this.onResetView = options.onResetView || (() => {});
    this.onNewSeed = options.onNewSeed || (() => {});
    this.onRecordingToggle = options.onRecordingToggle || (() => {});
    this.onSaveSummaryImage = options.onSaveSummaryImage || (() => {});
    this.onAssumptionsChange = options.onAssumptionsChange || (() => {});

    this.isPlaying = false;
    this.playbackSpeed = 1;
    this.currentMonth = 0;
    this.currentStrategy = 'reactive'; // 'reactive' | 'predictive' | 'compare'

    this.initDOMElements();
    this.bindEvents();
  }

  initDOMElements() {
    // Top bar & buttons
    this.strategyBtns = document.querySelectorAll('.strategy-toggle-btn');
    this.btnUnderground = document.getElementById('btn-underground');
    this.btnResetView = document.getElementById('btn-reset-view');
    this.btnNewCity = document.getElementById('btn-new-city');
    this.btnRecordingMode = document.getElementById('btn-recording-mode');
    this.btnAssumptions = document.getElementById('btn-assumptions');

    // Scoreboard Metrics
    this.healthIndexVal = document.getElementById('metric-health-index');
    this.healthIndexLabel = document.getElementById('metric-health-label');
    this.totalCostVal = document.getElementById('metric-total-cost');
    this.failuresVal = document.getElementById('metric-failures');
    this.downtimeVal = document.getElementById('metric-downtime');
    this.disruptionVal = document.getElementById('metric-disruption');

    // Work order ratio
    this.ratioPlannedBar = document.getElementById('ratio-bar-planned');
    this.ratioEmergencyBar = document.getElementById('ratio-bar-emergency');
    this.ratioPlannedLabel = document.getElementById('ratio-label-planned');
    this.ratioEmergencyLabel = document.getElementById('ratio-label-emergency');

    // Timeline elements
    this.timelineSlider = document.getElementById('timeline-slider');
    this.timelineProgress = document.getElementById('timeline-progress-fill');
    this.currentYearLabel = document.getElementById('timeline-current-time');
    this.btnPlay = document.getElementById('btn-play');
    this.speedBtns = document.querySelectorAll('.speed-btn');

    // Modals & Panels
    this.assetInspectorCard = document.getElementById('asset-inspector');
    this.inspectorCloseBtn = document.getElementById('inspector-close-btn');
    this.summaryModal = document.getElementById('summary-modal');
    this.summaryCloseBtn = document.getElementById('summary-close-btn');
    this.btnExportSummary = document.getElementById('btn-export-summary');

    this.assumptionsModal = document.getElementById('assumptions-modal');
    this.assumptionsCloseBtn = document.getElementById('assumptions-close-btn');
    this.btnApplyAssumptions = document.getElementById('btn-apply-assumptions');
    this.btnResetAssumptions = document.getElementById('btn-reset-assumptions');

    // Compare scoreboard banner
    this.compareBanner = document.getElementById('compare-scoreboard-banner');
  }

  bindEvents() {
    // Strategy switcher
    this.strategyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.strategyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const strategy = btn.getAttribute('data-strategy');
        this.currentStrategy = strategy;
        this.onStrategyChange(strategy);
      });
    });

    // Underground toggle
    if (this.btnUnderground) {
      this.btnUnderground.addEventListener('click', () => {
        const active = this.btnUnderground.classList.toggle('active');
        this.onUndergroundToggle(active);
      });
    }

    // Reset view
    if (this.btnResetView) {
      this.btnResetView.addEventListener('click', () => this.onResetView());
    }

    // New seed / city
    if (this.btnNewCity) {
      this.btnNewCity.addEventListener('click', () => this.onNewSeed());
    }

    // Recording toggle
    if (this.btnRecordingMode) {
      this.btnRecordingMode.addEventListener('click', () => {
        const active = document.body.classList.toggle('recording-mode');
        this.btnRecordingMode.classList.toggle('active', active);
        this.onRecordingToggle(active);
      });
    }

    // Play/Pause button
    if (this.btnPlay) {
      this.btnPlay.addEventListener('click', () => {
        this.isPlaying = !this.isPlaying;
        this.btnPlay.innerHTML = this.isPlaying ? '❚❚' : '▶';
        this.btnPlay.setAttribute('aria-label', this.isPlaying ? 'Pause' : 'Play');
        this.onPlayPause(this.isPlaying);
      });
    }

    // Speed selector
    this.speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.playbackSpeed = parseFloat(btn.getAttribute('data-speed'));
        this.onSpeedChange(this.playbackSpeed);
      });
    });

    // Timeline slider
    if (this.timelineSlider) {
      this.timelineSlider.addEventListener('input', (e) => {
        const month = parseInt(e.target.value, 10);
        this.currentMonth = month;
        this.updateTimelineUI(month);
        this.onMonthChange(month);
      });
    }

    // Inspector close
    if (this.inspectorCloseBtn) {
      this.inspectorCloseBtn.addEventListener('click', () => {
        this.assetInspectorCard.classList.add('hidden');
      });
    }

    // Summary modal
    if (this.summaryCloseBtn) {
      this.summaryCloseBtn.addEventListener('click', () => {
        this.summaryModal.classList.add('hidden');
      });
    }
    if (this.btnExportSummary) {
      this.btnExportSummary.addEventListener('click', () => {
        this.onSaveSummaryImage();
      });
    }

    // Assumptions modal
    if (this.btnAssumptions) {
      this.btnAssumptions.addEventListener('click', () => {
        this.assumptionsModal.classList.remove('hidden');
      });
    }
    if (this.assumptionsCloseBtn) {
      this.assumptionsCloseBtn.addEventListener('click', () => {
        this.assumptionsModal.classList.add('hidden');
      });
    }
    if (this.btnResetAssumptions) {
      this.btnResetAssumptions.addEventListener('click', () => {
        this.onAssumptionsChange('reset');
        this.assumptionsModal.classList.add('hidden');
      });
    }
  }

  setPlayState(playing) {
    this.isPlaying = playing;
    if (this.btnPlay) {
      this.btnPlay.innerHTML = this.isPlaying ? '❚❚' : '▶';
      this.btnPlay.setAttribute('aria-label', this.isPlaying ? 'Pause' : 'Play');
    }
  }

  updateTimelineUI(month) {
    if (this.timelineSlider) this.timelineSlider.value = month;
    if (this.timelineProgress) {
      const pct = (month / 239) * 100;
      this.timelineProgress.style.width = `${pct}%`;
    }

    const year = Math.floor(month / 12);
    const monthInYear = month % 12;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (this.currentYearLabel) {
      this.currentYearLabel.textContent = `Year ${year + 1}, ${monthNames[monthInYear]}`;
    }
  }

  updateMetrics(snapshot, reactiveSnapshot = null, predictiveSnapshot = null) {
    if (!snapshot) return;

    // City Health Index & Status Label
    const health = snapshot.cityHealthIndex;
    if (this.healthIndexVal) this.healthIndexVal.textContent = Math.round(health);

    let healthDesc = 'Clarity (Optimal)';
    let healthColor = '#7FB98A';
    if (health < 40) {
      healthDesc = 'Chaos (Severe Degradation)';
      healthColor = '#E5484D';
    } else if (health < 60) {
      healthDesc = 'Warning (High Risk)';
      healthColor = '#E8743A';
    } else if (health < 75) {
      healthDesc = 'Degrading (Monitoring)';
      healthColor = '#E0A43A';
    }
    if (this.healthIndexLabel) {
      this.healthIndexLabel.textContent = healthDesc;
      this.healthIndexLabel.style.color = healthColor;
    }

    // Primary Animated Counters
    if (this.totalCostVal) this.totalCostVal.textContent = `$${snapshot.cumulativeCost.toLocaleString()}`;
    if (this.failuresVal) this.failuresVal.textContent = snapshot.cumulativeFailures.toLocaleString();
    if (this.downtimeVal) this.downtimeVal.textContent = `${snapshot.cumulativeDowntimeHours.toLocaleString()} hrs`;
    if (this.disruptionVal) this.disruptionVal.textContent = `${Math.round(snapshot.cumulativeResidentDisruptionHours).toLocaleString()} resident-hrs`;

    // Work order ratio
    const totalWork = (snapshot.plannedWorkCount || 0) + (snapshot.emergencyWorkCount || 0);
    const plannedPct = totalWork > 0 ? Math.round((snapshot.plannedWorkCount / totalWork) * 100) : 0;
    const emergencyPct = totalWork > 0 ? (100 - plannedPct) : 0;

    if (this.ratioPlannedBar) this.ratioPlannedBar.style.width = `${plannedPct}%`;
    if (this.ratioEmergencyBar) this.ratioEmergencyBar.style.width = `${emergencyPct}%`;
    if (this.ratioPlannedLabel) this.ratioPlannedLabel.textContent = `Planned: ${snapshot.plannedWorkCount} (${plannedPct}%)`;
    if (this.ratioEmergencyLabel) this.ratioEmergencyLabel.textContent = `Emergency: ${snapshot.emergencyWorkCount} (${emergencyPct}%)`;

    // Compare Mode Scoreboard Banner
    if (this.compareBanner && reactiveSnapshot && predictiveSnapshot) {
      if (this.currentStrategy === 'compare') {
        this.compareBanner.classList.remove('hidden');
        document.getElementById('compare-reactive-cost').textContent = `$${reactiveSnapshot.cumulativeCost.toLocaleString()}`;
        document.getElementById('compare-reactive-failures').textContent = `${reactiveSnapshot.cumulativeFailures} failures`;
        document.getElementById('compare-reactive-health').textContent = `Health: ${Math.round(reactiveSnapshot.cityHealthIndex)}%`;

        document.getElementById('compare-predictive-cost').textContent = `$${predictiveSnapshot.cumulativeCost.toLocaleString()}`;
        document.getElementById('compare-predictive-failures').textContent = `${predictiveSnapshot.cumulativeFailures} failures`;
        document.getElementById('compare-predictive-health').textContent = `Health: ${Math.round(predictiveSnapshot.cityHealthIndex)}%`;

        const costDiff = reactiveSnapshot.cumulativeCost - predictiveSnapshot.cumulativeCost;
        const diffPercent = reactiveSnapshot.cumulativeCost > 0 ? Math.round((costDiff / reactiveSnapshot.cumulativeCost) * 100) : 0;
        const diffLabel = document.getElementById('compare-diff-badge');
        if (diffLabel) {
          if (costDiff >= 0) {
            diffLabel.textContent = `Predictive saves $${costDiff.toLocaleString()} (${diffPercent}%)`;
            diffLabel.style.background = '#7FB98A';
            diffLabel.style.color = '#0E1116';
          } else {
            diffLabel.textContent = `Predictive program investment -$${Math.abs(costDiff).toLocaleString()}`;
            diffLabel.style.background = '#4C8DFF';
            diffLabel.style.color = '#ffffff';
          }
        }
      } else {
        this.compareBanner.classList.add('hidden');
      }
    }
  }

  showAssetInspector(assetInfo, snapshot, fullSnapshots) {
    if (!assetInfo || !this.assetInspectorCard) return;

    const master = assetInfo.master;
    const currentState = snapshot.assetStates.find(s => s.id === master.id);
    if (!currentState) return;

    const currentAge = (master.installAgeYears || 0) + (snapshot.month / 12);

    document.getElementById('inspector-asset-id').textContent = master.id;
    document.getElementById('inspector-asset-type').textContent = master.type.toUpperCase();
    document.getElementById('inspector-location').textContent = master.street || 'City Grid';
    document.getElementById('inspector-age').textContent = `${currentAge.toFixed(1)} yrs (Initial: ${(master.installAgeYears || 0).toFixed(1)})`;
    document.getElementById('inspector-expected-life').textContent = `${master.expectedLifeYears} yrs`;
    document.getElementById('inspector-current-health').textContent = `${Math.round(currentState.health)}%`;
    document.getElementById('inspector-failures').textContent = master.type === 'bridge' ? `${currentState.failuresToDate} (closures)` : currentState.failuresToDate;
    document.getElementById('inspector-cost').textContent = `$${currentState.costToDate.toLocaleString()}`;

    // Status badge
    const badge = document.getElementById('inspector-status-badge');
    badge.textContent = currentState.status.toUpperCase();
    badge.className = `status-badge status-${currentState.status}`;

    // Sparkline history
    const historyPoints = [];
    const step = Math.max(1, Math.floor(fullSnapshots.length / 24));
    for (let m = 0; m <= snapshot.month; m += step) {
      const snap = fullSnapshots[m];
      const ast = snap?.assetStates.find(s => s.id === master.id);
      if (ast) historyPoints.push(ast.health);
    }
    const sparklineContainer = document.getElementById('inspector-sparkline');
    if (sparklineContainer) {
      sparklineContainer.innerHTML = renderSparklineSVG(historyPoints, 180, 40);
    }

    // Work history list
    const historyList = document.getElementById('inspector-work-history');
    if (historyList) {
      const events = [];
      for (let m = 0; m <= snapshot.month; m++) {
        const snap = fullSnapshots[m];
        if (snap && snap.events) {
          const ev = snap.events.filter(e => e.assetId === master.id);
          events.push(...ev);
        }
      }
      if (events.length === 0) {
        historyList.innerHTML = `<span style="color: var(--text-muted);">No maintenance interventions to date.</span>`;
      } else {
        historyList.innerHTML = events.slice(-4).reverse().map(e => `
          <div style="margin-bottom: 4px; padding-bottom: 2px; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <span style="color: ${e.type === 'emergency' ? 'var(--status-failed)' : 'var(--accent-color)'}; font-weight: 600;">
              [${e.type.toUpperCase()}]
            </span>
            ${e.yearMonth}: $${(e.cost || 0).toLocaleString()} (${e.downtimeHours || 0}h downtime)
          </div>
        `).join('');
      }
    }

    this.assetInspectorCard.classList.remove('hidden');
  }

  showSummary(reactiveFinal, predictiveFinal) {
    if (!this.summaryModal) return;

    const diffDollars = reactiveFinal.totalCost - predictiveFinal.totalCost;
    const diffPct = Math.round((diffDollars / reactiveFinal.totalCost) * 100);
    const failuresAvoided = reactiveFinal.totalFailures - predictiveFinal.totalFailures;
    const downtimeAvoided = reactiveFinal.totalDowntimeHours - predictiveFinal.totalDowntimeHours;
    const disruptionAvoided = Math.round(reactiveFinal.totalResidentDisruptionHours - predictiveFinal.totalResidentDisruptionHours);

    document.getElementById('summary-savings-dollars').textContent = `$${diffDollars.toLocaleString()}`;
    document.getElementById('summary-savings-percent').textContent = `${diffPct}% Net Savings`;

    document.getElementById('summary-reactive-cost').textContent = `$${reactiveFinal.totalCost.toLocaleString()}`;
    document.getElementById('summary-predictive-cost').textContent = `$${predictiveFinal.totalCost.toLocaleString()}`;

    document.getElementById('summary-reactive-failures').textContent = reactiveFinal.totalFailures.toLocaleString();
    document.getElementById('summary-predictive-failures').textContent = predictiveFinal.totalFailures.toLocaleString();

    document.getElementById('summary-reactive-downtime').textContent = `${reactiveFinal.totalDowntimeHours.toLocaleString()} hrs`;
    document.getElementById('summary-predictive-downtime').textContent = `${predictiveFinal.totalDowntimeHours.toLocaleString()} hrs`;

    document.getElementById('summary-failures-avoided').textContent = failuresAvoided.toLocaleString();
    document.getElementById('summary-downtime-avoided').textContent = `${downtimeAvoided.toLocaleString()} hrs`;
    document.getElementById('summary-disruption-avoided').textContent = `${disruptionAvoided.toLocaleString()} resident-hrs`;

    this.summaryModal.classList.remove('hidden');
  }

  closeAssetInspector() {
    if (this.assetInspectorCard) {
      this.assetInspectorCard.classList.add('hidden');
    }
  }

  showChapter3ScannerHUD(onComplete) {
    let modal = document.getElementById('tour-ch3-scanner');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tour-ch3-scanner';
      modal.className = 'tour-modal-backdrop';
      modal.innerHTML = `
        <div class="budget-challenge-card">
          <div style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-color); margin-bottom: 4px;">CENTRALIZED ASSET REPOSITORY</div>
          <h2 style="font-family: var(--font-condensed); font-size: 24px; margin-bottom: 12px;">ASSET VISIBILITY GAP</h2>
          <p style="font-size: 13px; line-height: 1.5; color: var(--text-muted); margin-bottom: 16px;">
            Without a unified enterprise asset registry, 80% of municipal assets operate without condition tracking. Deploy real-time digital registration across all 758 city assets.
          </p>
          <div style="background: var(--bg-main); padding: 14px; border: 1px solid var(--border-color); border-radius: 2px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 12px; margin-bottom: 6px;">
              <span>Assets Connected:</span>
              <span id="ch3-scan-count" style="color: var(--status-healthy); font-weight: 700;">0 / 758</span>
            </div>
            <div style="width: 100%; height: 8px; background: #262D36; border-radius: 2px; overflow: hidden;">
              <div id="ch3-scan-bar" style="width: 0%; height: 100%; background: var(--status-healthy); transition: width 0.8s ease;"></div>
            </div>
          </div>
          <button id="btn-ch3-connect" class="btn-primary-large" style="width: 100%;">Connect All 758 Assets →</button>
        </div>
      `;
      document.body.appendChild(modal);

      const btn = document.getElementById('btn-ch3-connect');
      btn.addEventListener('click', () => {
        document.getElementById('ch3-scan-bar').style.width = '100%';
        document.getElementById('ch3-scan-count').textContent = '758 / 758 (100% Tracked)';
        btn.textContent = 'Assets Connected Successfully ✓';
        btn.style.background = 'var(--status-healthy)';
        setTimeout(() => {
          modal.remove();
          if (onComplete) onComplete();
        }, 1200);
      });
    }
  }

  showBudgetChallengeModal(onComplete) {
    let modal = document.getElementById('tour-ch4-budget');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tour-ch4-budget';
      modal.className = 'tour-modal-backdrop';
      modal.innerHTML = `
        <div class="budget-challenge-card">
          <div style="font-family: var(--font-mono); font-size: 11px; color: var(--status-degrading); margin-bottom: 4px;">PRIORITIZATION CHALLENGE</div>
          <h2 style="font-family: var(--font-condensed); font-size: 24px; margin-bottom: 12px;">WHERE'S THE RISK?</h2>
          <p style="font-size: 13px; line-height: 1.5; color: var(--text-muted); margin-bottom: 16px;">
            You have a fixed $2,000,000 rehabilitation budget, but over $4,500,000 in deferred maintenance requests. Allocate funds by Health and Risk Matrix to minimize failures.
          </p>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
            <label style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-main); padding: 10px 14px; border: 1px solid var(--border-color); border-radius: 2px; font-size: 12px;">
              <span><input type="checkbox" class="ch4-chk" data-cost="1000000" checked> Refurbish Harbour & River Bridges (High Consequence)</span>
              <span style="font-family: var(--font-mono); color: var(--accent-color);">$1,000,000</span>
            </label>
            <label style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-main); padding: 10px 14px; border: 1px solid var(--border-color); border-radius: 2px; font-size: 12px;">
              <span><input type="checkbox" class="ch4-chk" data-cost="600000" checked> Critical Water Mains Replacement (Harbour St Zone)</span>
              <span style="font-family: var(--font-mono); color: var(--accent-color);">$600,000</span>
            </label>
            <label style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-main); padding: 10px 14px; border: 1px solid var(--border-color); border-radius: 2px; font-size: 12px;">
              <span><input type="checkbox" class="ch4-chk" data-cost="400000" checked> Main Water Pump Station 1 & 4 Overhaul</span>
              <span style="font-family: var(--font-mono); color: var(--accent-color);">$400,000</span>
            </label>
          </div>
          <button id="btn-ch4-submit" class="btn-primary-large" style="width: 100%;">Execute Optimized Plan →</button>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('btn-ch4-submit').addEventListener('click', () => {
        modal.remove();
        if (onComplete) onComplete();
      });
    }
  }

  showSensorTelemetryModal(onComplete) {
    let modal = document.getElementById('tour-ch5-telemetry');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tour-ch5-telemetry';
      modal.className = 'tour-modal-backdrop';
      modal.innerHTML = `
        <div class="budget-challenge-card" style="max-width: 640px;">
          <div style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-color); margin-bottom: 4px;">PREDICTIVE ANOMALY DETECTION</div>
          <h2 style="font-family: var(--font-condensed); font-size: 24px; margin-bottom: 12px;">PUMP STATION 4: TELEMETRY ANOMALY</h2>
          <p style="font-size: 13px; line-height: 1.5; color: var(--text-muted); margin-bottom: 16px;">
            Continuous IoT vibration and temperature telemetry detected microscopic bearing degradation (0.42 mm/s vibration baseline rising to 4.8 mm/s threshold).
          </p>
          <div style="background: var(--bg-main); padding: 14px; border: 1px solid var(--border-color); border-radius: 2px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 11px; margin-bottom: 8px;">
              <span>Vibration Telemetry (mm/s RMS)</span>
              <span style="color: var(--status-critical); font-weight: 700;">+380% vs Baseline</span>
            </div>
            <svg width="100%" height="70" viewBox="0 0 500 70" style="overflow: visible;">
              <line x1="0" y1="50" x2="500" y2="50" stroke="#36404D" stroke-dasharray="4,4" />
              <text x="5" y="45" fill="#8A929C" font-family="monospace" font-size="10">Normal Threshold</text>
              <path d="M0,52 Q120,50 240,48 T360,42 T420,25 T480,12" fill="none" stroke="#E8743A" stroke-width="3" />
              <circle cx="480" cy="12" r="5" fill="#E8743A" />
            </svg>
          </div>
          <div style="display: flex; gap: 10px;">
            <button id="btn-ch5-schedule" class="btn-primary-large">Schedule Proactive Bearing Overhaul ($40,000) →</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('btn-ch5-schedule').addEventListener('click', () => {
        modal.remove();
        if (onComplete) onComplete();
      });
    }
  }

  showCrewBacklogHUD(onComplete) {
    let modal = document.getElementById('tour-ch6-crew');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tour-ch6-crew';
      modal.className = 'tour-modal-backdrop';
      modal.innerHTML = `
        <div class="budget-challenge-card">
          <div style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-color); margin-bottom: 4px;">WORK ORDER EXECUTION</div>
          <h2 style="font-family: var(--font-condensed); font-size: 24px; margin-bottom: 12px;">CREW CAPACITY & BACKLOG</h2>
          <p style="font-size: 13px; line-height: 1.5; color: var(--text-muted); margin-bottom: 16px;">
            Predictions only preserve uptime if field crews can complete work orders before failure limits are crossed. Dispatch crews to clear pending preventative jobs.
          </p>
          <div style="background: var(--bg-main); padding: 14px; border: 1px solid var(--border-color); border-radius: 2px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 12px; margin-bottom: 4px;">
              <span>Mobile Crew Capacity:</span>
              <span id="ch6-crew-val" style="color: var(--accent-color); font-weight: 700;">25 Jobs / Month</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">
              <span>Backlog: 0 Days</span>
              <span>Completion Rate: 98.4%</span>
            </div>
          </div>
          <button id="btn-ch6-dispatch" class="btn-primary-large" style="width: 100%;">Optimize Mobile Crew Dispatch →</button>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('btn-ch6-dispatch').addEventListener('click', () => {
        modal.remove();
        if (onComplete) onComplete();
      });
    }
  }

  showColdSnapTriggerHUD(onComplete) {
    let modal = document.getElementById('tour-ch7-coldsnap');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tour-ch7-coldsnap';
      modal.className = 'tour-modal-backdrop';
      modal.innerHTML = `
        <div class="budget-challenge-card" style="text-align: center;">
          <div style="font-family: var(--font-mono); font-size: 11px; color: #6BA0FF; margin-bottom: 4px;">CLIMATE RESILIENCE STRESS TEST</div>
          <h2 style="font-family: var(--font-condensed); font-size: 26px; margin-bottom: 12px;">TRIGGER SEVERE COLD SNAP (-15°F)</h2>
          <p style="font-size: 13px; line-height: 1.5; color: var(--text-muted); margin-bottom: 20px;">
            Simulate a 10-day polar freeze event. Compare how the unmaintained reactive network suffers cascading water main bursts versus the reinforced predictive network.
          </p>
          <button id="btn-ch7-freeze" class="btn-primary-large" style="width: 100%; background: #2B6CB0;">Execute Freeze Simulation →</button>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('btn-ch7-freeze').addEventListener('click', () => {
        modal.remove();
        if (onComplete) onComplete();
      });
    }
  }
}
