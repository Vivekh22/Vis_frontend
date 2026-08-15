import { describe, it, expect } from 'vitest';
import type { ChartWidgetElement } from '../../../components/chart-widget/ChartWidgetElement';
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