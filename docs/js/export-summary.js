// export-summary.js - High-resolution 1200x1200 PNG LinkedIn infographic exporter

export function exportSummaryImage(reactiveFinal, predictiveFinal, seed = 42) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0E1116';
  ctx.fillRect(0, 0, 1200, 1200);

  // Subtle Header Glow / Banner Card
  ctx.fillStyle = '#151A21';
  ctx.strokeStyle = '#262D36';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, 1080, 1080);
  ctx.fillRect(60, 60, 1080, 1080);

  // Title & Header
  ctx.fillStyle = '#8A929C';
  ctx.font = "bold 20px 'IBM Plex Mono', monospace";
  ctx.fillText("ENTERPRISE ASSET MANAGEMENT & MUNICIPAL INFRASTRUCTURE", 100, 130);

  ctx.fillStyle = '#E8E6E1';
  ctx.font = "bold 44px 'IBM Plex Sans Condensed', sans-serif";
  ctx.fillText("CLARITY CITY: 20-YEAR LIFECYCLE AUDIT", 100, 185);

  ctx.fillStyle = '#8A929C';
  ctx.font = "18px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Comparing 758 Physical Municipal Assets Under Reactive vs. Predictive Maintenance", 100, 220);

  // Top Key Savings Metric Box
  const diffDollars = reactiveFinal.totalCost - predictiveFinal.totalCost;
  const diffPct = Math.round((diffDollars / reactiveFinal.totalCost) * 100);

  ctx.fillStyle = '#1A2330';
  ctx.strokeStyle = '#4C8DFF';
  ctx.lineWidth = 3;
  ctx.fillRect(100, 260, 1000, 160);
  ctx.strokeRect(100, 260, 1000, 160);

  ctx.fillStyle = '#4C8DFF';
  ctx.font = "bold 18px 'IBM Plex Mono', monospace";
  ctx.fillText("TOTAL 20-YEAR NET FINANCIAL IMPACT", 140, 305);

  ctx.fillStyle = '#7FB98A';
  ctx.font = "bold 64px 'IBM Plex Mono', monospace";
  ctx.fillText(`$${diffDollars.toLocaleString()}`, 140, 375);

  ctx.fillStyle = '#E8E6E1';
  ctx.font = "bold 32px 'IBM Plex Sans Condensed', sans-serif";
  ctx.fillText(`(${diffPct}% Cost Reduction)`, 640, 370);

  // Strategy Comparison Columns
  const colY = 460;
  const colW = 480;

  // Reactive Column
  ctx.fillStyle = '#181E26';
  ctx.strokeStyle = '#E5484D';
  ctx.lineWidth = 2;
  ctx.fillRect(100, colY, colW, 440);
  ctx.strokeRect(100, colY, colW, 440);

  ctx.fillStyle = '#E5484D';
  ctx.font = "bold 24px 'IBM Plex Sans Condensed', sans-serif";
  ctx.fillText("REACTIVE / TIME-BASED STRATEGY", 130, colY + 50);

  ctx.fillStyle = '#8A929C';
  ctx.font = "16px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Emergency repairs only after total physical failure", 130, colY + 80);

  ctx.fillStyle = '#E8E6E1';
  ctx.font = "18px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Total 20-Year Cost:", 130, colY + 140);
  ctx.font = "bold 32px 'IBM Plex Mono', monospace";
  ctx.fillStyle = '#E5484D';
  ctx.fillText(`$${reactiveFinal.totalCost.toLocaleString()}`, 130, colY + 180);

  ctx.fillStyle = '#E8E6E1';
  ctx.font = "18px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Critical Failures Incurred:", 130, colY + 240);
  ctx.font = "bold 28px 'IBM Plex Mono', monospace";
  ctx.fillText(`${reactiveFinal.totalFailures} failures`, 130, colY + 275);

  ctx.font = "18px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Service Downtime:", 130, colY + 330);
  ctx.font = "bold 28px 'IBM Plex Mono', monospace";
  ctx.fillText(`${reactiveFinal.totalDowntimeHours.toLocaleString()} hrs`, 130, colY + 365);

  // Predictive Column
  ctx.fillStyle = '#181E26';
  ctx.strokeStyle = '#7FB98A';
  ctx.lineWidth = 2;
  ctx.fillRect(620, colY, colW, 440);
  ctx.strokeRect(620, colY, colW, 440);

  ctx.fillStyle = '#7FB98A';
  ctx.font = "bold 24px 'IBM Plex Sans Condensed', sans-serif";
  ctx.fillText("PREDICTIVE / CONDITION-BASED STRATEGY", 650, colY + 50);

  ctx.fillStyle = '#8A929C';
  ctx.font = "16px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Continuous monitoring, sensor alerts & planned overhauls", 650, colY + 80);

  ctx.fillStyle = '#E8E6E1';
  ctx.font = "18px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Total 20-Year Cost (incl. Program):", 650, colY + 140);
  ctx.font = "bold 32px 'IBM Plex Mono', monospace";
  ctx.fillStyle = '#7FB98A';
  ctx.fillText(`$${predictiveFinal.totalCost.toLocaleString()}`, 650, colY + 180);

  ctx.fillStyle = '#E8E6E1';
  ctx.font = "18px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Critical Failures Incurred:", 650, colY + 240);
  ctx.font = "bold 28px 'IBM Plex Mono', monospace";
  ctx.fillText(`${predictiveFinal.totalFailures} failures`, 650, colY + 275);

  ctx.font = "18px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Service Downtime:", 650, colY + 330);
  ctx.font = "bold 28px 'IBM Plex Mono', monospace";
  ctx.fillText(`${predictiveFinal.totalDowntimeHours.toLocaleString()} hrs`, 650, colY + 365);

  // Avoided Disruption Banner
  const failuresAvoided = reactiveFinal.totalFailures - predictiveFinal.totalFailures;
  const downtimeAvoided = reactiveFinal.totalDowntimeHours - predictiveFinal.totalDowntimeHours;
  const disruptionAvoided = Math.round(reactiveFinal.totalResidentDisruptionHours - predictiveFinal.totalResidentDisruptionHours);

  ctx.fillStyle = '#222B38';
  ctx.fillRect(100, 930, 1000, 80);

  ctx.fillStyle = '#E8E6E1';
  ctx.font = "bold 18px 'IBM Plex Sans Condensed', sans-serif";
  ctx.fillText(`AVOIDED DISRUPTIONS: ${failuresAvoided} FAILURES PREVENTED  •  ${downtimeAvoided.toLocaleString()} HRS DOWNTIME AVERTED  •  ${disruptionAvoided.toLocaleString()} RESIDENT-HOURS SAVED`, 125, 978);

  // Footer Disclaimers
  ctx.fillStyle = '#5F6B7C';
  ctx.font = "14px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Illustrative model. Default assumptions are editable. Fictional city and data.", 100, 1060);

  ctx.font = "14px 'IBM Plex Mono', monospace";
  ctx.textAlign = 'right';
  ctx.fillText("Built by Shahmeer Hashmi | Clarity City", 1100, 1060);

  // Trigger download
  const link = document.createElement('a');
  link.download = `clarity-city-20yr-summary-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
