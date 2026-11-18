// config.js - Global configuration, default assumptions, and city layout constants

export const CITY_CONFIG = {
  gridSize: 8, // 8x8 blocks
  blockSize: 28, // width/depth of a block
  streetWidth: 8, // width of streets
  riverWidth: 20, // width of river
  riverBlockIndex: 4, // between block 3 and 4
  population: 100000,
  waterNetworkMiles: 300
};

export const COLORS = {
  // Theme Backgrounds
  dark: {
    bg: '#0E1116',
    panelBg: '#151A21',
    panelBgTranslucent: 'rgba(21, 26, 33, 0.92)',
    border: '#262D36',
    borderLight: '#36404D',
    textMain: '#E8E6E1',
    textMuted: '#8A929C',
    accent: '#4C8DFF',
    ground: '#181E26',
    roads: '#12161D',
    river: '#1A2938',
    riverGlow: '#22405C',
    buildings: [
      '#2A323D', '#222933', '#333D4A', '#1E242D', '#3B4654'
    ],
    park: '#1B2C23',
    underground: '#0B0E13'
  },
  light: {
    bg: '#ECEEF1',
    panelBg: '#F8F9FA',
    panelBgTranslucent: 'rgba(248, 249, 250, 0.94)',
    border: '#D0D5DD',
    borderLight: '#B8C0CC',
    textMain: '#1A202C',
    textMuted: '#5F6B7C',
    accent: '#2B6CB0',
    ground: '#DFE3E8',
    roads: '#C9CED6',
    river: '#8CAECA',
    riverGlow: '#A8C7E0',
    buildings: [
      '#D8DCE2', '#CCD2DB', '#E4E8EE', '#BFC7D2', '#D0D6E0'
    ],
    park: '#BED6C2',
    underground: '#BAC0CA'
  },
  // Status Colors (Uniform across themes)
  status: {
    healthy: '#7FB98A',    // 70 to 100
    degrading: '#E0A43A',  // 40 to 69
    critical: '#E8743A',   // 1 to 39
    failed: '#E5484D',     // 0
    maintenance: '#4C8DFF' // Active repair
  }
};

// Sensor quality options shown in the Assumptions panel (reading error in health points)
export const SENSOR_QUALITY = [
  { id: 'basic', label: 'Basic (±10)', noise: 10 },
  { id: 'standard', label: 'Standard (±6)', noise: 6 },
  { id: 'advanced', label: 'Advanced (±3)', noise: 3 }
];

export const CRITICALITY_LABELS = { 1: 'Low', 2: 'Minor', 3: 'Moderate', 4: 'High', 5: 'City-critical' };

export const DEFAULT_ASSUMPTIONS = {
  // Asset assumptions with realistic emergency-to-planned ratios, specific catch rates, and asset-specific replacement costs
  pumpStation: {
    displayName: 'Pump Stations',
    criticality: 5, // 1 (nuisance) to 5 (city-critical): drives alert thresholds and job priority
    count: 12,
    expectedLifeYears: 25,
    plannedCost: 40000,
    emergencyCost: 110000,
    replacementCost: 650000,
    plannedDowntimeHours: 8,
    emergencyDowntimeHours: 72,
    residentsAffected: 5000,
    catchRate: 0.85,
    installAgeMinYears: 3,
    installAgeMaxYears: 24,
    replacementThresholdFailures: 3
  },
  waterMain: {
    displayName: 'Water Mains (300 miles)',
    criticality: 4, // 1 (nuisance) to 5 (city-critical): drives alert thresholds and job priority
    count: 300,
    expectedLifeYears: 60,
    plannedCost: 11000,
    emergencyCost: 24000,
    replacementCost: 180000,
    plannedDowntimeHours: 4,
    emergencyDowntimeHours: 36,
    residentsAffected: 800,
    catchRate: 0.50,
    installAgeMinYears: 5,
    installAgeMaxYears: 75,
    replacementThresholdFailures: 3
  },
  bridge: {
    displayName: 'River Bridges',
    criticality: 5, // 1 (nuisance) to 5 (city-critical): drives alert thresholds and job priority
    count: 6,
    expectedLifeYears: 75,
    plannedCost: 280000,
    emergencyCost: 850000,
    replacementCost: 3500000,
    plannedDowntimeHours: 120, // 5 days
    emergencyDowntimeHours: 1440, // 60 days
    residentsAffected: 20000,
    catchRate: 0.80,
    installAgeMinYears: 10,
    installAgeMaxYears: 70,
    replacementThresholdFailures: 3
  },
  streetlight: {
    displayName: 'Streetlights',
    criticality: 1, // 1 (nuisance) to 5 (city-critical): drives alert thresholds and job priority
    count: 400,
    expectedLifeYears: 20,
    plannedCost: 750,
    emergencyCost: 1800,
    replacementCost: 3500,
    plannedDowntimeHours: 2,
    emergencyDowntimeHours: 168, // 7 days
    residentsAffected: 50,
    catchRate: 0.70,
    installAgeMinYears: 2,
    installAgeMaxYears: 19,
    replacementThresholdFailures: 3
  },
  trafficSignal: {
    displayName: 'Traffic Signals',
    criticality: 3, // 1 (nuisance) to 5 (city-critical): drives alert thresholds and job priority
    count: 40,
    expectedLifeYears: 25,
    plannedCost: 7000,
    emergencyCost: 16000,
    replacementCost: 75000,
    plannedDowntimeHours: 4,
    emergencyDowntimeHours: 24,
    residentsAffected: 3000,
    catchRate: 0.75,
    installAgeMinYears: 2,
    installAgeMaxYears: 24,
    replacementThresholdFailures: 3
  },
  // Capital & Program assumptions
  general: {
    annualReplacementBudget: 2000000 // Shared annual capital budget cap for asset replacements
  },
  // Predictive Program general assumptions
  predictive: {
    healthThreshold: 45, // Proactive maintenance threshold
    annualProgramCost: 350000, // Fixed sensor, software, and staff cost
    crewCapacityPerMonth: 25, // Max planned jobs per month
    // Alerting (v2): how early warnings become work orders
    alertPolicy: 'risk', // 'risk' = thresholds and priority weighted by asset criticality; 'uniform' = one threshold for every asset
    criticalityStep: 8, // Each criticality level above/below 3 moves the alert threshold by this many health points
    sensorNoise: 6, // Typical sensor reading error, in health points (Basic 10, Standard 6, Advanced 3)
    inspectionCostPct: 0.2 // A false alarm still costs a site visit: this share of the planned maintenance cost
  }
};

export const STREET_NAMES = [
  "Harbour St", "Maple Ave", "Main St", "Riverside Dr", "Grand Blvd",
  "Commercial Way", "Oakland Ave", "Pine St", "Industrial Rd", "Central Ave",
  "Beacon St", "Crestview Way", "Mercer St", "Canal St", "Parkside Ave",
  "Foundry Rd", "Liberty St", "Union Blvd", "Highland Ave", "Frontier St"
];

// v4: one street grid everything shares (roads, cars, signals, bridges, lights).
// Blocks sit at -halfSpan + i*(block+street); streets run in the gaps between them and around the edge.
// The river sits in the gap after the street that follows block row (riverBlockIndex - 1).
export function streetGrid() {
  const { gridSize, blockSize, streetWidth, riverWidth, riverBlockIndex } = CITY_CONFIG;
  const pitch = blockSize + streetWidth;
  const totalSpan = gridSize * blockSize + (gridSize - 1) * streetWidth + riverWidth;
  const halfSpan = totalSpan / 2;
  const xs = [], zs = [];
  for (let k = 0; k <= gridSize; k++) {
    xs.push(-halfSpan - streetWidth / 2 + k * pitch);
    zs.push(-halfSpan - streetWidth / 2 + k * pitch + (k > riverBlockIndex ? riverWidth : 0));
  }
  const riverMin = zs[riverBlockIndex] + streetWidth / 2;
  const riverMax = riverMin + riverWidth;
  const riverZ = (riverMin + riverMax) / 2;
  const bridgeKs = [1, 2, 3, 4, 5, 6]; // which north-south streets have a bridge (index into xs)
  return { xs, zs, riverMin, riverMax, riverZ, bridgeKs, halfSpan, totalSpan, extent: halfSpan + 20 };
}
