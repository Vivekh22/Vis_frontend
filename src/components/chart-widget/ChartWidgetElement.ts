/**
 * ChartWidgetElement.ts — components/chart-widget/
 *
 * Purpose:
 *   Chart-rendering component supporting bar/line/area toggle using native
 *   SVG rendered through the html tag. NO charting library dependency —
 *   consistent with the zero-runtime-dependency principle. Hand-building SVG
 *   bar/line/area rendering keeps this component fully auditable.
 *
 * Axes:
 *   - Y-axis: renders 4-5 gridline labels spanning from 0 up to a "nice"
 *     ceiling of the data max, formatted per the `format` property
 *     ('number' for counts, 'currency' for revenue/spend).
 *   - X-axis: renders one label per point, thinned to ~MAX_X_LABELS for long
 *     series (30D / This Month / Custom). Labels themselves are produced
 *     upstream by the data service (hourly for Today/Yesterday, day-of-week
 *     for 7D, MM/DD for longer periods) and passed in as data points.
 *
 * States:
 *   - isLoading === true  → renders a loading skeleton.
 *   - data.length === 0   → renders an empty state.
 *   - otherwise           → renders the chart.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';
import { formatAxisValue, type AxisValueFormat } from '../../utils/formatters';

export type ChartType = 'bar' | 'line' | 'area' | 'horizontal-bar' | 'donut';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string; // Used for donut segments
}

const STYLES = `
  :host { display: block; width: 100%; height: 100%; font-family: var(--font-body); }
  .chart-container {
    width: 100%;
    height: 100%;
    min-height: 160px;
    position: relative;
    overflow: hidden;
  }
  svg { display: block; width: 100%; height: 100%; }
  .skeleton {
    height: 100%;
    background: var(--color-surface);
    border-radius: var(--radius-md);
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .empty-state {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .bar { fill: var(--color-primary); }
  .bar:hover { fill: var(--color-accent); }
  .line { fill: none; stroke: var(--color-primary); stroke-width: 2; }
  .area { fill: rgba(79, 70, 229, 0.15); stroke: var(--color-primary); stroke-width: 2; }
  .axis-label {
    font-size: 10px;
    fill: var(--color-text-muted);
    font-family: var(--font-body);
  }
  .grid-line {
    stroke: var(--color-border);
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }
  .horizontal-bars { display: flex; flex-direction: column; width: 100%; }
  .bar-row { display: flex; align-items: center; margin-bottom: var(--space-2); }
  .bar-label-hz { width: 120px; font-size: var(--font-size-xs); color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: var(--space-2); }
  .bar-track { flex: 1; height: 24px; background: var(--color-surface-2); border-radius: var(--radius-sm); position: relative; overflow: hidden; }
  .bar-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-sm); transition: width 0.3s ease; }
  .bar-value { width: 60px; text-align: right; font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); padding-left: var(--space-2); }
  .donut-container { display: flex; align-items: center; gap: var(--space-4); }
  .svg-wrapper-donut { position: relative; width: 150px; height: 150px; }
  .svg-donut { width: 100%; height: 100%; transform: rotate(-90deg); }
  .donut-hole { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
  .total-label { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; }
  .total-value { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
  .legend { display: flex; flex-direction: column; gap: var(--space-2); }
  .legend-item { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); color: var(--color-text-primary); }
  .legend-color { width: 12px; height: 12px; border-radius: 2px; }
`;

const PAD_LEFT = 56;
const PAD_RIGHT = 28;
const PAD_TOP = 20;
const PAD_BOTTOM = 40;
const MAX_X_LABELS = 8;
const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 200;

function niceTicks(max: number, targetCount = 5): number[] {
  if (!(max > 0)) return [0];
  const rawStep = max / targetCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  let step: number;
  if (residual >= 7.5) step = 10;
  else if (residual >= 3.5) step = 5;
  else if (residual >= 1.5) step = 2;
  else step = 1;
  step *= magnitude;
  const maxTick = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= maxTick + 1e-9; v += step) {
    ticks.push(Number(v.toFixed(6)));
  }
  return ticks;
}

class ChartWidgetElement extends BaseComponent {
  private _data: ChartDataPoint[] = [];
  private _chartType: ChartType = 'bar';
  private _format: AxisValueFormat = 'number';
  private _isLoading = false;
  private _viewWidth = DEFAULT_WIDTH;
  private _viewHeight = DEFAULT_HEIGHT;
  private _resizeObserver: ResizeObserver | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.measureSize();
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this.measureSize());
      this._resizeObserver.observe(this);
    }
  }

  protected onUnmount(): void {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  private measureSize(): void {
    const rect = this.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (width > 0 && height > 0 && (width !== this._viewWidth || height !== this._viewHeight)) {
      this._viewWidth = width;
      this._viewHeight = height;
      this.rerender();
    }
  }

  public set data(value: ChartDataPoint[]) {
    this._data = value;
    this.rerender();
  }

  public set chartType(value: ChartType) {
    this._chartType = value;
    this.rerender();
  }

  public set format(value: AxisValueFormat) {
    this._format = value;
    this.rerender();
  }

  public set isLoading(value: boolean) {
    this._isLoading = value;
    this.rerender();
  }

  protected renderTemplate(): string {
    if (this._isLoading) {
      return html`<div class="chart-container"><div class="skeleton"></div></div>`;
    }
    if (this._data.length === 0) {
      return html`<div class="chart-container"><div class="empty-state">No data to display</div></div>`;
    }
    
    if (this._chartType === 'horizontal-bar') {
      return html`<div class="chart-container">${SafeHtmlString.trusted(this.renderHorizontalBarChart())}</div>`;
    }
    
    if (this._chartType === 'donut') {
      return html`<div class="chart-container">${SafeHtmlString.trusted(this.renderDonutChart())}</div>`;
    }
    
    const svg = this.renderChart();
    return html`<div class="chart-container">${SafeHtmlString.trusted(svg)}</div>`;
  }

  private renderChart(): string {
    const rawMax = Math.max(...this._data.map((d) => d.value), 1);
    const ticks = niceTicks(rawMax);
    const scaleMax = ticks.length > 0 ? (ticks[ticks.length - 1] as number) : 1;
    
    // Dynamic padding calculation based on labels
    const maxLabelLength = Math.max(...ticks.map(t => formatAxisValue(t, this._format).length), 1);
    const dynamicPadLeft = Math.max(PAD_LEFT, maxLabelLength * 8 + 10);
    const dynamicPadBottom = PAD_BOTTOM; // X-axis labels usually constant length, could calculate if needed

    const innerWidth = this._viewWidth - dynamicPadLeft - PAD_RIGHT;
    const innerHeight = this._viewHeight - PAD_TOP - dynamicPadBottom;
    const barWidth = innerWidth / this._data.length;

    const yAxis = this.renderYAxis(ticks, innerHeight, dynamicPadLeft, dynamicPadBottom);
    const xStep = Math.ceil(this._data.length / MAX_X_LABELS);

    if (this._chartType === 'bar') {
      return this.renderBarChart(scaleMax, innerHeight, barWidth, xStep, yAxis, dynamicPadLeft, dynamicPadBottom);
    }
    return this.renderLineOrAreaChart(scaleMax, innerWidth, innerHeight, xStep, yAxis, dynamicPadLeft, dynamicPadBottom);
  }

  private renderYAxis(ticks: number[], innerHeight: number, padLeft: number, padBottom: number): string {
    const baseY = this._viewHeight - padBottom;
    return ticks.map((tick) => {
      const ratio = tick / (ticks[ticks.length - 1] || 1);
      const y = baseY - ratio * innerHeight;
      const label = formatAxisValue(tick, this._format);
      return SafeHtmlString.trusted(
        `<g>` +
        `<line class="grid-line" x1="${padLeft}" y1="${y}" x2="${this._viewWidth - PAD_RIGHT}" y2="${y}" />` +
        `<text class="axis-label" x="${padLeft - 8}" y="${y + 3}" text-anchor="end">${label}</text>` +
        `</g>`
      );
    }).join('');
  }

  private shouldRenderXLabel(index: number, xStep: number): boolean {
    if (xStep <= 1) return true;
    return index % xStep === 0 || index === this._data.length - 1;
  }

  private renderBarChart(max: number, innerHeight: number, barWidth: number, xStep: number, yAxis: string, padLeft: number, padBottom: number): string {
    const bars = this._data.map((d, i) => {
      const barHeight = (d.value / max) * innerHeight;
      const x = padLeft + i * barWidth + barWidth * 0.1;
      const y = this._viewHeight - padBottom - barHeight;
      const w = barWidth * 0.8;
      const labelX = padLeft + i * barWidth + barWidth / 2;
      const xLabel = this.shouldRenderXLabel(i, xStep)
        ? SafeHtmlString.trusted(`<text class="axis-label" x="${labelX}" y="${this._viewHeight - padBottom + 18}" text-anchor="middle">${d.label}</text>`)
        : '';
      return SafeHtmlString.trusted(
        `<g>` +
        `<rect class="bar" x="${x}" y="${y}" width="${w}" height="${barHeight}" rx="2">` +
        `<title>${d.label} - Value: ${formatAxisValue(d.value, this._format)}</title>` +
        `</rect>` +
        xLabel +
        `</g>`
      );
    }).join('');
    return `<svg viewBox="0 0 ${this._viewWidth} ${this._viewHeight}" preserveAspectRatio="none">${yAxis}${bars}</svg>`;
  }

  private renderLineOrAreaChart(max: number, innerWidth: number, innerHeight: number, xStep: number, yAxis: string, padLeft: number, padBottom: number): string {
    const stepX = this._data.length > 1 ? innerWidth / (this._data.length - 1) : 0;
    const points = this._data.map((d, i) => {
      const x = padLeft + i * stepX;
      const y = this._viewHeight - padBottom - (d.value / max) * innerHeight;
      return { x, y, label: d.label, value: d.value };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const labels = points.map((p, i) => {
      if (!this.shouldRenderXLabel(i, xStep)) return '';
      return SafeHtmlString.trusted(`<text class="axis-label" x="${p.x}" y="${this._viewHeight - padBottom + 18}" text-anchor="middle">${p.label}</text>`);
    }).join('');

    const cls = 'line';
    const areaPath = this._chartType === 'area'
      ? SafeHtmlString.trusted(`<path class="area" d="${pathD} L${points[points.length - 1]!.x},${this._viewHeight - padBottom} L${points[0]!.x},${this._viewHeight - padBottom} Z" />`)
      : '';
    const linePath = SafeHtmlString.trusted(`<path class="${cls}" d="${pathD}" />`);
    
    // Add interactive dots with tooltips
    const dots = points.map((p) => SafeHtmlString.trusted(
      `<g>` +
      `<circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--color-primary)">` +
      `<title>${p.label} - Value: ${formatAxisValue(p.value, this._format)}</title>` +
      `</circle>` +
      `</g>`
    )).join('');

    return `<svg viewBox="0 0 ${this._viewWidth} ${this._viewHeight}" preserveAspectRatio="none">${yAxis}${areaPath}${linePath}${dots}${labels}</svg>`;
  }

  private renderHorizontalBarChart(): string {
    const max = Math.max(...this._data.map(d => d.value), 1);
    
    const rows = this._data.map(d => {
      const pct = (d.value / max) * 100;
      return `
        <div class="bar-row" title="${d.label}: ${formatAxisValue(d.value, this._format)}">
          <div class="bar-label-hz">${d.label}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${pct}%;"></div>
          </div>
          <div class="bar-value">${formatAxisValue(d.value, this._format)}</div>
        </div>
      `;
    }).join('');

    return `<div class="horizontal-bars">${rows}</div>`;
  }

  private renderDonutChart(): string {
    const total = this._data.reduce((sum, d) => sum + d.value, 0);
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    
    let currentOffset = 0;
    const segmentsHtml = this._data.map((d, i) => {
      const pct = total > 0 ? (d.value / total) : 0;
      const strokeLength = pct * circumference;
      const strokeDasharray = `${strokeLength} ${circumference}`;
      const strokeDashoffset = -currentOffset;
      currentOffset += strokeLength;
      
      const color = d.color || ['var(--color-primary)', 'var(--color-accent)', 'var(--color-warning-border)'][i % 3];
      
      return `
        <circle 
          cx="75" cy="75" r="${radius}" 
          fill="transparent" 
          stroke="${color}" 
          stroke-width="20" 
          stroke-dasharray="${strokeDasharray}" 
          stroke-dashoffset="${strokeDashoffset}">
          <title>${d.label}: ${formatAxisValue(d.value, this._format)}</title>
        </circle>
      `;
    }).join('');

    const legendHtml = this._data.map((d, i) => {
      const color = d.color || ['var(--color-primary)', 'var(--color-accent)', 'var(--color-warning-border)'][i % 3];
      return `
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${color};"></div>
          <span>${d.label}: <strong>${formatAxisValue(d.value, this._format)}</strong></span>
        </div>
      `;
    }).join('');

    return `
      <div class="donut-container">
        <div class="svg-wrapper-donut">
          <svg class="svg-donut" viewBox="0 0 150 150">
            ${segmentsHtml}
          </svg>
          <div class="donut-hole">
            <div class="total-label">Total</div>
            <div class="total-value">${formatAxisValue(total, this._format)}</div>
          </div>
        </div>
        <div class="legend">
          ${legendHtml}
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('chart-widget', ChartWidgetElement);
export { ChartWidgetElement };