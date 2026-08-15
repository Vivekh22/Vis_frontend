/**
 * ChartWidgetElement.ts — components/chart-widget/
 *
 * Purpose:
 *   Chart-rendering component supporting bar/line/area toggle using native
 *   SVG rendered through the html tag. NO charting library dependency —
 *   consistent with the zero-runtime-dependency principle. Hand-building SVG
 *   bar/line/area rendering keeps this component fully auditable.
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

export type ChartType = 'bar' | 'line' | 'area';

interface ChartDataPoint {
  label: string;
  value: number;
}

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .chart-container {
    width: 100%;
    position: relative;
  }
  svg { display: block; width: 100%; height: auto; }
  .skeleton {
    height: 200px;
    background: var(--color-surface);
    border-radius: var(--radius-md);
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .empty-state {
    height: 200px;
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
`;

const CHART_WIDTH = 400;
const CHART_HEIGHT = 200;
const PADDING = 30;

class ChartWidgetElement extends BaseComponent {
  private _data: ChartDataPoint[] = [];
  private _chartType: ChartType = 'bar';
  private _isLoading = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set data(value: ChartDataPoint[]) {
    this._data = value;
    this.rerender();
  }

  public set chartType(value: ChartType) {
    this._chartType = value;
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
    const svg = this.renderChart();
    return html`<div class="chart-container">${SafeHtmlString.trusted(svg)}</div>`;
  }

  private renderChart(): string {
    const max = Math.max(...this._data.map((d) => d.value), 1);
    const innerWidth = CHART_WIDTH - PADDING * 2;
    const innerHeight = CHART_HEIGHT - PADDING * 2;
    const barWidth = innerWidth / this._data.length;

    if (this._chartType === 'bar') {
      return this.renderBarChart(max, innerHeight, barWidth);
    }
    return this.renderLineOrAreaChart(max, innerHeight);
  }

  private renderBarChart(max: number, innerHeight: number, barWidth: number): string {
    const bars = this._data.map((d, i) => {
      const barHeight = (d.value / max) * innerHeight;
      const x = PADDING + i * barWidth + barWidth * 0.1;
      const y = CHART_HEIGHT - PADDING - barHeight;
      const w = barWidth * 0.8;
      const labelX = PADDING + i * barWidth + barWidth / 2;
      return SafeHtmlString.trusted(
        `<rect class="bar" x="${x}" y="${y}" width="${w}" height="${barHeight}" rx="2" />` +
        `<text class="axis-label" x="${labelX}" y="${CHART_HEIGHT - PADDING + 14}" text-anchor="middle">${d.label}</text>`
      );
    }).join('');
    return `<svg viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" preserveAspectRatio="xMidYMid meet">${bars}</svg>`;
  }

  private renderLineOrAreaChart(max: number, innerHeight: number): string {
    const stepX = this._data.length > 1 ? innerWidth / (this._data.length - 1) : 0;
    const points = this._data.map((d, i) => {
      const x = PADDING + i * stepX;
      const y = CHART_HEIGHT - PADDING - (d.value / max) * innerHeight;
      return { x, y, label: d.label };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const labels = points.map((p) =>
      SafeHtmlString.trusted(`<text class="axis-label" x="${p.x}" y="${CHART_HEIGHT - PADDING + 14}" text-anchor="middle">${p.label}</text>`)
    ).join('');

    const cls = 'line';
    const areaPath = this._chartType === 'area'
      ? SafeHtmlString.trusted(`<path class="area" d="${pathD} L${points[points.length - 1]!.x},${CHART_HEIGHT - PADDING} L${points[0]!.x},${CHART_HEIGHT - PADDING} Z" />`)
      : '';
    const linePath = SafeHtmlString.trusted(`<path class="${cls}" d="${pathD}" />`);
    const dots = points.map((p) => SafeHtmlString.trusted(`<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--color-primary)" />`)).join('');

    return `<svg viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" preserveAspectRatio="xMidYMid meet">${areaPath}${linePath}${dots}${labels}</svg>`;
  }
}

ComponentRegistry.register('chart-widget', ChartWidgetElement);
export { ChartWidgetElement };
