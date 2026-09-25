// simulation.js - Deterministic Weibull simulation engine for Reactive & Predictive strategies

import { DEFAULT_ASSUMPTIONS, STREET_NAMES } from './config.js';

// Seeded PRNG: Mulberry32
export function createPRNG(seed = 123456) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2D79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SimulationEngine {
  constructor(seed = 42, customAssumptions = null) {
    this.seed = seed;
    this.assumptions = JSON.parse(JSON.stringify(customAssumptions || DEFAULT_ASSUMPTIONS));
    this.totalMonths = 240; // 20 years
    this.precomputed = {
      reactive: null,
      predictive: null
    };
    this.assets = []; // Master asset definitions
  }

  setAssumptions(newAssumptions) {
    this.assumptions = JSON.parse(JSON.stringify(newAssumptions));
    this.run();
  }

  setSeed(newSeed) {
    this.seed = newSeed;
    this.run();
  }

  // Generate initial static asset list with deterministic locations & install ages
  generateAssets() {
    const rng = createPRNG(this.seed);
    const assets = [];
    let idCounter = 1;

    const types = [
      { type: 'pumpStation', count: this.assumptions.pumpStation.count },
      { type: 'waterMain', count: this.assumptions.waterMain.count },
      { type: 'bridge', count: this.assumptions.bridge.count },
      { type: 'streetlight', count: this.assumptions.streetlight.count },
      { type: 'trafficSignal', count: this.assumptions.trafficSignal.count }
    ];

    for (const group of types) {
      const def = this.assumptions[group.type];
      for (let i = 0; i < group.count; i++) {
        const installAgeYears = def.installAgeMinYears + rng() * (def.installAgeMaxYears - def.installAgeMinYears);
        const street = STREET_NAMES[Math.floor(rng() * STREET_NAMES.length)];
        const prefix = group.type === 'pumpStation' ? 'PUM' :
                       group.type === 'waterMain' ? 'WAT' :
                       group.type === 'bridge' ? 'BRI' :
                       group.type === 'streetlight' ? 'STR' : 'TRA';
        const assetId = `${prefix}-${String(idCounter++).padStart(4, '0')}`;
        
        // Initial health calculation based on install age vs expected life
        const ageRatio = installAgeYears / def.expectedLifeYears;
        let initialHealth = Math.max(10, Math.min(100, 100 * (1 - Math.pow(ageRatio, 2.0)) + (rng() * 10 - 5)));
        
        assets.push({
          id: assetId,
          type: group.type,
          index: assets.length,
          typeIndex: i,
          street: street,
          installAgeYears: installAgeYears,
          expectedLifeYears: def.expectedLifeYears,
          initialHealth: initialHealth,
          degradationRateFactor: 0.90 + rng() * 0.20 // Asset-specific variance
        });
      }
    }

    this.assets = assets;
    return assets;
  }

  // Run and precompute all 240 months for both strategies
  run() {
    if (this.assets.length === 0) {
      this.generateAssets();
    }

    this.precomputed.reactive = this._simulateStrategy('reactive');
    this.precomputed.predictive = this._simulateStrategy('predictive');
    return this.precomputed;
  }

  _simulateStrategy(strategyName) {
    const isPredictive = strategyName === 'predictive';
    const rng = createPRNG(this.seed + (isPredictive ? 1000 : 0));
    // Synchronized environmental shock generator
    const shockRng = createPRNG(this.seed + 9999);

    const assetStates = this.assets.map(a => ({
      id: a.id,
      type: a.type,
      effectiveAgeYears: a.installAgeYears,
      health: a.initialHealth,
      failureCount: 0,
      totalCostToDate: 0,
      totalDowntimeHours: 0,
      totalFailures: 0,
      status: a.initialHealth <= 0 ? 'failed' : (a.initialHealth < 40 ? 'critical' : (a.initialHealth < 70 ? 'degrading' : 'healthy')),
      maintenanceRemainingMonths: 0,
      history: []
    }));

    const monthlySnapshots = [];
    let cumulativeCost = 0;
    let cumulativeFailures = 0;
    let cumulativeDowntimeHours = 0;
    let cumulativeResidentDisruptionHours = 0;
    let cumulativePlannedWork = 0;
    let cumulativeEmergencyWork = 0;
    let cumulativePlannedReplacements = 0;
    let cumulativeEmergencyReplacements = 0;

    let waterMainBreaksYear1to5 = 0;
    let totalWaterMainBreaks = 0;
    let bridgeEmergencyClosures = 0;

    const annualReplacementBudget = this.assumptions.general?.annualReplacementBudget ?? 2000000;
    const monthlyProgramCost = isPredictive ? (this.assumptions.predictive.annualProgramCost / 12) : 0;
    let currentYearRemainingCapEx = annualReplacementBudget;

    for (let month = 0; month < this.totalMonths; month++) {
      const currentYear = Math.floor(month / 12);
      const monthInYear = month % 12;
      const monthEvents = [];

      // Reset annual replacement budget at start of each year
      if (monthInYear === 0) {
        currentYearRemainingCapEx = annualReplacementBudget;
      }

      // Add monthly predictive program fixed overhead
      if (isPredictive) {
        cumulativeCost += monthlyProgramCost;
      }

      // 1. Natural aging & health degradation
      for (let i = 0; i < assetStates.length; i++) {
        const state = assetStates[i];
        const assetDef = this.assets[i];
        const config = this.assumptions[state.type];

        state.effectiveAgeYears += 1 / 12;

        if (state.maintenanceRemainingMonths > 0) {
          state.maintenanceRemainingMonths--;
          if (state.maintenanceRemainingMonths === 0) {
            state.status = state.health >= 70 ? 'healthy' : (state.health >= 40 ? 'degrading' : 'critical');
          }
          continue;
        }

        // Degradation curve
        let monthlyDrop;
        if (state.type === 'bridge') {
          const ageFactor = Math.pow(state.effectiveAgeYears / config.expectedLifeYears, 2.5);
          monthlyDrop = (0.08 + ageFactor * 0.40) * assetDef.degradationRateFactor;
        } else {
          const ageFactor = Math.pow(state.effectiveAgeYears / config.expectedLifeYears, 2.2);
          monthlyDrop = (0.28 + ageFactor * 1.10) * assetDef.degradationRateFactor;
        }
        
        state.health = Math.max(0, state.health - monthlyDrop);

        if (state.health <= 0) {
          state.status = 'failed';
        } else if (state.health < 40) {
          state.status = 'critical';
        } else if (state.health < 70) {
          state.status = 'degrading';
        } else {
          state.status = 'healthy';
        }
      }

      // 2. Annual Capital Planned Replacement Allocation (Applies to both strategies within CapEx budget)
      // Predictive: prioritize worst health among assets past expected life or health < 30
      // Reactive: prioritize oldest chronological age among assets past expected life
      if (currentYearRemainingCapEx > 0) {
        const replacementCandidates = [];
        for (let i = 0; i < assetStates.length; i++) {
          const state = assetStates[i];
          const config = this.assumptions[state.type];
          if (state.status !== 'failed' && state.maintenanceRemainingMonths === 0) {
            const pastLife = state.effectiveAgeYears >= config.expectedLifeYears;
            const poorHealth = state.health < 30;
            if (isPredictive) {
              if (pastLife || poorHealth) {
                replacementCandidates.push({ index: i, score: state.health }); // Lower health = higher priority
              }
            } else {
              if (pastLife) {
                replacementCandidates.push({ index: i, score: -state.effectiveAgeYears }); // Higher age = higher priority
              }
            }
          }
        }

        replacementCandidates.sort((a, b) => a.score - b.score);

        for (const cand of replacementCandidates) {
          const state = assetStates[cand.index];
          const assetDef = this.assets[cand.index];
          const config = this.assumptions[state.type];
          const replCost = config.replacementCost || (config.emergencyCost * 3);

          if (currentYearRemainingCapEx >= replCost) {
            currentYearRemainingCapEx -= replCost;
            cumulativePlannedReplacements++;
            cumulativePlannedWork++;

            const downtime = config.plannedDowntimeHours * 2; // Planned replacement scaled downtime
            const disruption = downtime * (config.residentsAffected * 0.20);

            cumulativeCost += replCost;
            cumulativeDowntimeHours += downtime;
            cumulativeResidentDisruptionHours += disruption;
            state.totalCostToDate += replCost;
            state.totalDowntimeHours += downtime;

            const healthBefore = state.health;
            state.health = 100;
            state.effectiveAgeYears = 0;
            state.failureCount = 0;
            state.status = 'healthy';
            state.maintenanceRemainingMonths = 2;

            const logEntry = {
              month,
              year: currentYear,
              monthInYear,
              type: 'planned',
              assetId: state.id,
              assetType: state.type,
              street: assetDef.street,
              cost: replCost,
              downtimeHours: downtime,
              residentsAffected: config.residentsAffected,
              isPlannedReplacement: true,
              healthBefore: Math.round(healthBefore),
              healthAfter: 100,
              notable: true
            };

            state.history.push(logEntry);
            monthEvents.push(logEntry);
          }
        }
      }

      // 3. Maintenance Allocation (Condition-Based for Predictive, Time-Based Routine PM for Reactive)
      let plannedJobsThisMonth = 0;
      const crewLimit = isPredictive
        ? (this.assumptions.predictive?.crewCapacityPerMonth ?? 25)
        : (this.assumptions.predictive?.crewCapacityPerMonth ?? 25);

      if (isPredictive) {
        // Predictive (Condition-Based): Health threshold trigger
        const threshold = this.assumptions.predictive.healthThreshold;
        const candidates = [];
        for (let i = 0; i < assetStates.length; i++) {
          const state = assetStates[i];
          if (state.status !== 'failed' && state.health <= threshold && state.maintenanceRemainingMonths === 0) {
            candidates.push({ index: i, score: state.health });
          }
        }

        candidates.sort((a, b) => a.score - b.score);

        for (const candidate of candidates) {
          if (plannedJobsThisMonth >= crewLimit) break;

          const state = assetStates[candidate.index];
          const assetDef = this.assets[candidate.index];
          const config = this.assumptions[state.type];
          const catchRate = config.catchRate !== undefined ? config.catchRate : 0.75;

          if (rng() <= catchRate) {
            plannedJobsThisMonth++;
            cumulativePlannedWork++;
            const cost = config.plannedCost;
            const downtime = config.plannedDowntimeHours;
            const disruption = downtime * (config.residentsAffected * 0.15);

            cumulativeCost += cost;
            cumulativeDowntimeHours += downtime;
            cumulativeResidentDisruptionHours += disruption;
            state.totalCostToDate += cost;
            state.totalDowntimeHours += downtime;

            const healthBefore = state.health;
            // Planned maintenance gives partial boost (+25 to +40, capped at 100) and reduces effective age by 15%
            const boost = 25 + rng() * 15;
            state.health = Math.min(100, state.health + boost);
            state.effectiveAgeYears = Math.max(0, state.effectiveAgeYears * 0.85);
            state.status = state.health >= 70 ? 'healthy' : (state.health >= 40 ? 'degrading' : 'critical');
            state.maintenanceRemainingMonths = 1;

            const logEntry = {
              month,
              year: currentYear,
              monthInYear,
              type: 'planned',
              assetId: state.id,
              assetType: state.type,
              street: assetDef.street,
              cost,
              downtimeHours: downtime,
              residentsAffected: config.residentsAffected,
              healthBefore: Math.round(healthBefore),
              healthAfter: Math.round(state.health),
              notable: state.type === 'bridge' || state.type === 'pumpStation' || rng() < 0.08
            };

            state.history.push(logEntry);
            monthEvents.push(logEntry);
          }
        }
      } else {
        // Reactive / Time-Based: Fixed cycle routine PM (every ~1/4 of expected life)
        const pmCandidates = [];
        for (let i = 0; i < assetStates.length; i++) {
          const state = assetStates[i];
          const config = this.assumptions[state.type];
          if (state.status !== 'failed' && state.maintenanceRemainingMonths === 0) {
            const intervalMonths = Math.max(12, Math.floor((config.expectedLifeYears / 4) * 12));
            const assetSeedOffset = (i * 7) % intervalMonths;
            if ((month + assetSeedOffset) % intervalMonths === 0) {
              pmCandidates.push({ index: i, score: state.effectiveAgeYears });
            }
          }
        }

        for (const candidate of pmCandidates) {
          if (plannedJobsThisMonth >= crewLimit) break;

          const state = assetStates[candidate.index];
          const assetDef = this.assets[candidate.index];
          const config = this.assumptions[state.type];

          plannedJobsThisMonth++;
          cumulativePlannedWork++;
          const cost = config.plannedCost;
          const downtime = config.plannedDowntimeHours;
          const disruption = downtime * (config.residentsAffected * 0.15);

          cumulativeCost += cost;
          cumulativeDowntimeHours += downtime;
          cumulativeResidentDisruptionHours += disruption;
          state.totalCostToDate += cost;
          state.totalDowntimeHours += downtime;

          const healthBefore = state.health;
          // Routine PM small boost (+10)
          state.health = Math.min(100, state.health + 10);
          state.status = state.health >= 70 ? 'healthy' : (state.health >= 40 ? 'degrading' : 'critical');
          state.maintenanceRemainingMonths = 1;

          const logEntry = {
            month,
            year: currentYear,
            monthInYear,
            type: 'planned',
            assetId: state.id,
            assetType: state.type,
            street: assetDef.street,
            cost,
            downtimeHours: downtime,
            residentsAffected: config.residentsAffected,
            isRoutinePM: true,
            healthBefore: Math.round(healthBefore),
            healthAfter: Math.round(state.health),
            notable: state.type === 'bridge' || state.type === 'pumpStation' || rng() < 0.05
          };

          state.history.push(logEntry);
          monthEvents.push(logEntry);
        }
      }

      // 4. Failure simulation & Reactive response
      for (let i = 0; i < assetStates.length; i++) {
        const state = assetStates[i];
        const assetDef = this.assets[i];
        const config = this.assumptions[state.type];

        if (state.maintenanceRemainingMonths > 0) continue;

        const ageRatio = state.effectiveAgeYears / config.expectedLifeYears;
        
        // Weibull-style failure hazard rate calibrated for physical municipal assets
        let failProb;
        if (state.type === 'waterMain') {
          // Calibrated for Utah State University study: ~31 to 34 breaks/yr across 300 miles
          failProb = 0.0003 + 0.0035 * Math.pow(ageRatio, 2.8);
          if (state.health < 15) failProb += 0.04;
        } else if (state.type === 'bridge') {
          // Calibrated for ~1 to 2 emergency closures across 6 bridges in 20 yrs in reactive
          failProb = 0.000005 + 0.0002 * Math.pow(ageRatio, 4.0);
          if (state.health < 10) failProb += 0.003;
        } else if (state.type === 'pumpStation') {
          failProb = 0.0008 + 0.015 * Math.pow(ageRatio, 3.0);
          if (state.health < 20) failProb += 0.12;
          else if (state.health < 40) failProb += 0.04;
        } else {
          failProb = 0.001 + 0.022 * Math.pow(ageRatio, 3.2);
          if (state.health < 20) failProb += 0.20;
          else if (state.health < 40) failProb += 0.06;
        }

        const shock = shockRng();
        const hasFailed = state.health <= 0 || shock < failProb;

        if (hasFailed) {
          state.status = 'failed';
          state.health = 0;
          state.failureCount++;
          state.totalFailures++;
          cumulativeFailures++;
          cumulativeEmergencyWork++;

          if (state.type === 'waterMain') {
            totalWaterMainBreaks++;
            if (month < 60) {
              waterMainBreaksYear1to5++;
            }
          } else if (state.type === 'bridge') {
            bridgeEmergencyClosures++;
          }

          let cost = config.emergencyCost;
          let downtime = config.emergencyDowntimeHours;
          let isReplacement = false;

          if (state.failureCount >= config.replacementThresholdFailures) {
            isReplacement = true;
            cumulativeEmergencyReplacements++;
            // Emergency replacement: replacementCost x 1.3
            cost = (config.replacementCost || (config.emergencyCost * 3)) * 1.3;
            downtime = config.emergencyDowntimeHours * 1.5;
            state.effectiveAgeYears = 0;
            state.health = 100;
            state.failureCount = 0;
          } else {
            // Emergency repairs fix the immediate break but the asset remains old and worn (+25 to +40 health, age reduced ~5%)
            state.health = 25 + rng() * 15;
            state.effectiveAgeYears = Math.max(1, state.effectiveAgeYears * 0.95);
          }

          cumulativeCost += cost;
          cumulativeDowntimeHours += downtime;
          const residentDisruption = downtime * config.residentsAffected;
          cumulativeResidentDisruptionHours += residentDisruption;

          state.totalCostToDate += cost;
          state.totalDowntimeHours += downtime;
          state.maintenanceRemainingMonths = isReplacement ? 2 : 1;

          const logEntry = {
            month,
            year: currentYear,
            monthInYear,
            type: isReplacement ? 'replacement' : 'emergency',
            assetId: state.id,
            assetType: state.type,
            street: assetDef.street,
            cost,
            downtimeHours: downtime,
            residentsAffected: config.residentsAffected,
            isReplacement,
            healthBefore: 0,
            healthAfter: Math.round(state.health),
            notable: state.type === 'bridge' || state.type === 'pumpStation' || rng() < 0.15
          };

          state.history.push(logEntry);
          monthEvents.push(logEntry);
        }
      }

      // Criticality-weighted City Health Index: weight each asset's health by replacement cost
      let totalReplacementWeight = 0;
      let weightedHealthSum = 0;
      for (let i = 0; i < assetStates.length; i++) {
        const s = assetStates[i];
        const cfg = this.assumptions[s.type];
        const weight = cfg.replacementCost || (cfg.emergencyCost * 3);
        totalReplacementWeight += weight;
        weightedHealthSum += s.health * weight;
      }
      const weightedCityHealthIndex = totalReplacementWeight > 0 ? (weightedHealthSum / totalReplacementWeight) : 0;

      const assetSnapshots = assetStates.map(a => ({
        id: a.id,
        health: Math.round(a.health * 10) / 10,
        status: a.status,
        costToDate: a.totalCostToDate,
        failuresToDate: a.totalFailures,
        downtimeToDate: a.totalDowntimeHours,
        effectiveAgeYears: Math.round(a.effectiveAgeYears * 10) / 10
      }));

      monthlySnapshots.push({
        month,
        year: currentYear,
        monthInYear,
        cityHealthIndex: Math.round(weightedCityHealthIndex * 10) / 10,
        cumulativeCost: Math.round(cumulativeCost),
        cumulativeFailures,
        cumulativeDowntimeHours: Math.round(cumulativeDowntimeHours),
        cumulativeResidentDisruptionHours: Math.round(cumulativeResidentDisruptionHours),
        plannedWorkCount: cumulativePlannedWork,
        emergencyWorkCount: cumulativeEmergencyWork,
        events: monthEvents,
        assetStates: assetSnapshots
      });
    }

    return {
      strategy: strategyName,
      snapshots: monthlySnapshots,
      finalTotals: {
        totalCost: Math.round(cumulativeCost),
        totalFailures: cumulativeFailures,
        totalDowntimeHours: Math.round(cumulativeDowntimeHours),
        totalResidentDisruptionHours: Math.round(cumulativeResidentDisruptionHours),
        plannedWorkCount: cumulativePlannedWork,
        emergencyWorkCount: cumulativeEmergencyWork,
        finalHealthIndex: monthlySnapshots[this.totalMonths - 1].cityHealthIndex,
        totalWaterMainBreaks,
        waterMainBreaksYear1to5Avg: (waterMainBreaksYear1to5 / 5).toFixed(1),
        annualWaterMainBreaksAvg: (totalWaterMainBreaks / 20).toFixed(1),
        bridgeEmergencyClosures
      }
    };
  }

  getSnapshot(strategy, monthIndex) {
    const clampedMonth = Math.max(0, Math.min(this.totalMonths - 1, monthIndex));
    return this.precomputed[strategy]?.snapshots[clampedMonth] || null;
  }
}
