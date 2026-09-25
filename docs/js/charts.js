// charts.js - Lightweight custom canvas and SVG visualization tools

export class CostTrajectoryChart {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.reactiveData = [];
    this.predictiveData = [];
    this.currentMonth = 0;
  }

  setData(reactiveSnapshots, predictiveSnapshots) {
    this.reactiveData = (reactiveSnapshots || []).map(s => s.cumulativeCost);
    this.predictiveData = (predictiveSnapshots || []).map(s => s.cumulativeCost);
    this.draw();
  }

  setCurrentMonth(month) {
    this.currentMonth = month;
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width = this.canvas.clientWidth * (window.devicePixelRatio || 1);
    const h = this.canvas.height = this.canvas.clientHeight * (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, w, h);

    if (this.reactiveData.length === 0 || this.predictiveData.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const padLeft = 60 * dpr;
    const padRight = 15 * dpr;
    const padTop = 15 * dpr;
    const padBottom = 22 * dpr;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const maxVal = Math.max(
      Math.max(...this.reactiveData),
      Math.max(...this.predictiveData),
      1000000
    ) * 1.08;

    // Draw Grid Lines & Y-axis labels
    ctx.strokeStyle = '#262D36';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#8A929C';
    ctx.font = `${10 * dpr}px 'IBM Plex Mono', monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const y = padTop + plotH - (i / yTicks) * plotH;
      const val = (i / yTicks) * maxVal;
      const millions = Math.round(val / 1000000);
      const label = `$${millions}M`;
      
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      ctx.fillText(label, padLeft - (8 * dpr), y);
    }

    // Draw X-axis ticks (Year 0, 5, 10, 15, 20)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let yr = 0; yr <= 20; yr += 5) {
      const x = padLeft + (yr / 20) * plotW;
      ctx.fillText(`Y${yr}`, x, h - padBottom + 6);
    }

    const getX = (m) => padLeft + (m / (this.reactiveData.length - 1)) * plotW;
    const getY = (v) => padTop + plotH - (v / maxVal) * plotH;

    // 1. Reactive Cost Curve (Amber/Red)
    ctx.beginPath();
    ctx.strokeStyle = '#E5484D';
    ctx.lineWidth = 2.5 * (window.devicePixelRatio || 1);
    for (let m = 0; m < this.reactiveData.length; m++) {
      const x = getX(m);
      const y = getY(this.reactiveData[m]);
      if (m === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 2. Predictive Cost Curve (Blue/Green)
    ctx.beginPath();
    ctx.strokeStyle = '#4C8DFF';
    ctx.lineWidth = 2.5 * (window.devicePixelRatio || 1);
    for (let m = 0; m < this.predictiveData.length; m++) {
      const x = getX(m);
      const y = getY(this.predictiveData[m]);
      if (m === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 3. Current Month Cursor Line
    const curX = getX(this.currentMonth);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(232, 230, 225, 0.6)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.moveTo(curX, padTop);
    ctx.lineTo(curX, padTop + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Markers on curves at current month
    const curReactiveY = getY(this.reactiveData[this.currentMonth] || 0);
    const curPredictiveY = getY(this.predictiveData[this.currentMonth] || 0);

    ctx.fillStyle = '#E5484D';
    ctx.beginPath();
    ctx.arc(curX, curReactiveY, 4 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4C8DFF';
    ctx.beginPath();
    ctx.arc(curX, curPredictiveY, 4 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
    ctx.fill();
  }
}

export function renderSparklineSVG(historyPoints, width = 160, height = 36) {
  if (!historyPoints || historyPoints.length < 2) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"></svg>`;
  }

  const min = 0;
  const max = 100;
  const stepX = width / (historyPoints.length - 1);

  const points = historyPoints.map((val, idx) => {
    const x = idx * stepX;
    const y = height - (val / max) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="sparkline-svg">
      <polyline fill="none" stroke="#4C8DFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
    </svg>
  `;
}
