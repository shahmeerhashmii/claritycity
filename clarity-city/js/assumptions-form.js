// assumptions-form.js - Expanded assumptions panel with city scale, live break metrics, and per-asset sections

import { DEFAULT_ASSUMPTIONS, CITY_CONFIG } from './config.js';

export function renderAssumptionsForm(container, currentAssumptions, liveMetrics, onSaveCallback) {
  if (!container) return;

  const a = currentAssumptions || DEFAULT_ASSUMPTIONS;
  const breakAvg = liveMetrics?.waterMainBreaksYear1to5Avg || '32.6';

  const assetTypes = [
    { key: 'pumpStation', title: 'Pump Stations', count: 12 },
    { key: 'waterMain', title: 'Water Mains (300 miles)', count: 300 },
    { key: 'bridge', title: 'River Bridges', count: 6 },
    { key: 'streetlight', title: 'Streetlights', count: 400 },
    { key: 'trafficSignal', title: 'Traffic Signals', count: 40 }
  ];

  const sectionsHtml = assetTypes.map(def => {
    const data = a[def.key];
    const catchRatePct = Math.round((data.catchRate !== undefined ? data.catchRate : 0.75) * 100);

    return `
      <div class="form-section">
        <div class="form-section-header">
          <h4 class="form-section-title">${def.title}</h4>
          <span class="badge" style="background: var(--border-color); color: var(--text-muted);">${def.count} Units</span>
        </div>
        <div class="form-grid-3col">
          <div class="form-row-compact">
            <label>Planned Cost ($):</label>
            <input type="number" name="${def.key}_plannedCost" value="${data.plannedCost}" step="100">
          </div>
          <div class="form-row-compact">
            <label>Emergency Cost ($):</label>
            <input type="number" name="${def.key}_emergencyCost" value="${data.emergencyCost}" step="100">
          </div>
          <div class="form-row-compact">
            <label>Replacement Cost ($):</label>
            <input type="number" name="${def.key}_replacementCost" value="${data.replacementCost || (data.emergencyCost * 3)}" step="1000">
          </div>
          <div class="form-row-compact">
            <label>Expected Life (Yrs):</label>
            <input type="number" name="${def.key}_expectedLife" value="${data.expectedLifeYears}" step="1">
          </div>
          <div class="form-row-compact">
            <label>Planned Downtime (Hrs):</label>
            <input type="number" name="${def.key}_plannedDowntime" value="${data.plannedDowntimeHours}" step="1">
          </div>
          <div class="form-row-compact">
            <label>Emergency Downtime (Hrs):</label>
            <input type="number" name="${def.key}_emergencyDowntime" value="${data.emergencyDowntimeHours}" step="1">
          </div>
          <div class="form-row-compact">
            <label>Residents Disrupted:</label>
            <input type="number" name="${def.key}_residents" value="${data.residentsAffected}" step="10">
          </div>
          <div class="form-row-compact">
            <label>Sensor Catch Rate (%):</label>
            <input type="number" name="${def.key}_catchRate" value="${catchRatePct}" min="0" max="100" step="1">
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <!-- Context Header -->
    <div class="assumptions-context-banner">
      <div class="context-item">
        <span class="context-label">Scale:</span>
        <span class="context-val">Population: ~${CITY_CONFIG.population.toLocaleString()}</span>
      </div>
      <div class="context-item">
        <span class="context-label">Infrastructure:</span>
        <span class="context-val">Water network: ${CITY_CONFIG.waterNetworkMiles} miles</span>
      </div>
      <div class="context-item highlight">
        <span class="context-label">Utah State Benchmark:</span>
        <span class="context-val">Reactive water main breaks, Year 1 to 5 average: <strong>${breakAvg} per year</strong> (~${(parseFloat(breakAvg)/3).toFixed(1)} / 100 mi / yr)</span>
      </div>
    </div>

    <form id="assumptions-form" class="assumptions-form-grid">
      <!-- Capital Budget & Predictive Program Global Controls -->
      <div class="form-section highlight-section">
        <h4 class="form-section-title" style="color: var(--accent-color)">Capital Budget & Predictive Program</h4>
        <div class="form-grid-3col">
          <div class="form-row-compact">
            <label>Annual CapEx Replacement Budget ($):</label>
            <input type="number" name="annualReplacementBudget" min="0" max="20000000" step="100000" value="${a.general?.annualReplacementBudget ?? 2000000}">
          </div>
          <div class="form-row-compact">
            <label>Health Threshold (%):</label>
            <input type="number" name="healthThreshold" min="20" max="80" step="1" value="${a.predictive.healthThreshold}">
          </div>
          <div class="form-row-compact">
            <label>Monthly Crew Capacity (Jobs):</label>
            <input type="number" name="crewCapacity" min="1" max="100" step="1" value="${a.predictive.crewCapacityPerMonth}">
          </div>
          <div class="form-row-compact">
            <label>Annual Program Overhead ($):</label>
            <input type="number" name="annualProgramCost" min="0" max="2000000" step="10000" value="${a.predictive.annualProgramCost}">
          </div>
        </div>
      </div>

      <!-- Asset Sections -->
      ${sectionsHtml}

      <!-- Sources and Academic Reference Footer -->
      <div class="assumptions-sources-note">
        <strong>Note:</strong> Illustrative model. Default assumptions are editable. Water main break rate and repair cost based on Utah State University, Water Main Break Rates in the USA and Canada (2023).
      </div>

      <div class="form-actions" style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px;">
        <button type="button" id="btn-reset-defaults" class="control-btn" style="color: var(--status-critical);">Reset to Defaults</button>
        <div style="display: flex; gap: 8px;">
          <button type="button" id="btn-cancel-assumptions" class="control-btn">Cancel</button>
          <button type="submit" class="control-btn" style="background-color: var(--accent-color); color: #fff; font-weight: 600;">Apply and Recompute</button>
        </div>
      </div>
    </form>
  `;

  const form = document.getElementById('assumptions-form');
  const btnReset = document.getElementById('btn-reset-defaults');

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      onSaveCallback(JSON.parse(JSON.stringify(DEFAULT_ASSUMPTIONS)));
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const updated = JSON.parse(JSON.stringify(a));

    if (!updated.general) updated.general = {};
    updated.general.annualReplacementBudget = parseFloat(fd.get('annualReplacementBudget'));

    updated.predictive.healthThreshold = parseFloat(fd.get('healthThreshold'));
    updated.predictive.crewCapacityPerMonth = parseInt(fd.get('crewCapacity'), 10);
    updated.predictive.annualProgramCost = parseFloat(fd.get('annualProgramCost'));

    for (const def of assetTypes) {
      updated[def.key].plannedCost = parseFloat(fd.get(`${def.key}_plannedCost`));
      updated[def.key].emergencyCost = parseFloat(fd.get(`${def.key}_emergencyCost`));
      updated[def.key].replacementCost = parseFloat(fd.get(`${def.key}_replacementCost`));
      updated[def.key].expectedLifeYears = parseFloat(fd.get(`${def.key}_expectedLife`));
      updated[def.key].plannedDowntimeHours = parseFloat(fd.get(`${def.key}_plannedDowntime`));
      updated[def.key].emergencyDowntimeHours = parseFloat(fd.get(`${def.key}_emergencyDowntime`));
      updated[def.key].residentsAffected = parseFloat(fd.get(`${def.key}_residents`));
      updated[def.key].catchRate = parseFloat(fd.get(`${def.key}_catchRate`)) / 100;
    }

    onSaveCallback(updated);
  });
}
