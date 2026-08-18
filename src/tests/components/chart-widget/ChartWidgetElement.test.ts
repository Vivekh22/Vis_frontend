// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { ChartWidgetElement } from '../../../components/chart-widget/ChartWidgetElement';
import '../../../components/chart-widget/ChartWidgetElement';

describe('ChartWidgetElement', () => {
  const data = [
    { label: 'Mon', value: 10 },
    { label: 'Tue', value: 20 },
    { label: 'Wed', value: 15 },
  ];

  it('renders correct number of SVG bar elements matching data length', () => {
    const el = document.createElement('chart-widget') as ChartWidgetElement;
    document.body.appendChild(el);
    el.chartType = 'bar';
    el.data = data;
    const bars = el.shadowRoot!.querySelectorAll('rect.bar');
    expect(bars.length).toBe(3);
    document.body.removeChild(el);
  });

  it('renders correct number of SVG line elements matching data length', () => {
    const el = document.createElement('chart-widget') as ChartWidgetElement;
    document.body.appendChild(el);
    el.chartType = 'line';
    el.data = data;
    const paths = el.shadowRoot!.querySelectorAll('path.line');
    expect(paths.length).toBe(1);
    const dots = el.shadowRoot!.querySelectorAll('circle');
    expect(dots.length).toBe(3);
    document.body.removeChild(el);
  });

  it('renders correct number of SVG area elements matching data length', () => {
    const el = document.createElement('chart-widget') as ChartWidgetElement;
    document.body.appendChild(el);
    el.chartType = 'area';
    el.data = data;
    const areaPaths = el.shadowRoot!.querySelectorAll('path.area');
    expect(areaPaths.length).toBe(1);
    const dots = el.shadowRoot!.querySelectorAll('circle');
    expect(dots.length).toBe(3);
    document.body.removeChild(el);
  });

  it('renders Y-axis gridline labels for every chart type', () => {
    const el = document.createElement('chart-widget') as ChartWidgetElement;
    document.body.appendChild(el);
    el.chartType = 'line';
    el.data = data;
    const texts = Array.from(el.shadowRoot!.querySelectorAll('text.axis-label'));
    const labels = texts.map((t) => t.textContent).filter((t) => t !== null && t !== undefined);
    // X labels (Mon/Tue/Wed) plus Y-axis tick labels (0, 5, 10, 15, 20 for max 20)
    expect(labels).toContain('Mon');
    expect(labels).toContain('Tue');
    expect(labels).toContain('Wed');
    const yLabels = labels.filter((t) => !['Mon', 'Tue', 'Wed'].includes(t));
    expect(yLabels.length).toBeGreaterThanOrEqual(4);
    expect(yLabels).toContain('0');
    expect(yLabels).toContain('20');
    document.body.removeChild(el);
  });

  it('renders Y-axis gridlines', () => {
    const el = document.createElement('chart-widget') as ChartWidgetElement;
    document.body.appendChild(el);
    el.chartType = 'line';
    el.data = data;
    const gridlines = el.shadowRoot!.querySelectorAll('line.grid-line');
    expect(gridlines.length).toBeGreaterThanOrEqual(4);
    document.body.removeChild(el);
  });

  it('formats Y-axis labels as compact currency when format is currency', () => {
    const el = document.createElement('chart-widget') as ChartWidgetElement;
    document.body.appendChild(el);
    el.chartType = 'line';
    el.data = [
      { label: 'Mon', value: 100 },
      { label: 'Tue', value: 200 },
      { label: 'Wed', value: 1500 },
    ];
    el.format = 'currency';
    const texts = Array.from(el.shadowRoot!.querySelectorAll('text.axis-label'));
    const labels = texts.map((t) => t.textContent);
    expect(labels.some((t) => t?.startsWith('$'))).toBe(true);
    document.body.removeChild(el);
  });

  it('thins X-axis labels for long series', () => {
    const el = document.createElement('chart-widget') as ChartWidgetElement;
    document.body.appendChild(el);
    el.chartType = 'line';
    const many = Array.from({ length: 30 }, (_, i) => ({ label: `D${i}`, value: i + 1 }));
    el.data = many;
    const texts = Array.from(el.shadowRoot!.querySelectorAll('text.axis-label'));
    const labels = texts.map((t) => t.textContent).filter((t) => t !== null && t !== undefined);
    const xLabels = labels.filter((t) => t.startsWith('D'));
    expect(xLabels.length).toBeLessThan(30);
    expect(xLabels.length).toBeGreaterThan(1);
    document.body.removeChild(el);
  });

  it('loading state renders the skeleton instead of chart content', () => {
    const el = document.createElement('chart-widget') as ChartWidgetElement;
    document.body.appendChild(el);
    el.data = data;
    el.isLoading = true;
    expect(el.shadowRoot!.querySelector('.skeleton')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('svg')).toBeNull();
    document.body.removeChild(el);
  });

  it('empty data array renders an empty state rather than a broken SVG', () => {
    const el = document.createElement('chart-widget') as ChartWidgetElement;
    document.body.appendChild(el);
    el.data = [];
    expect(el.shadowRoot!.querySelector('.empty-state')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('svg')).toBeNull();
    document.body.removeChild(el);
  });
});