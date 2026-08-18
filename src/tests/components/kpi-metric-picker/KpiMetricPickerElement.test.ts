// @ts-nocheck
import { describe, it, expect } from 'vitest';
import '../../../components/kpi-metric-picker/KpiMetricPickerElement';

// Force value import to prevent esbuild import elision (ensures ComponentRegistry.register runs)

describe('KpiMetricPickerElement', () => {
  it('toggling a metric on adds it to the emitted selection', () => {
    const el = document.createElement('kpi-metric-picker') as KpiMetricPickerElement;
    document.body.appendChild(el);
    el.availableMetrics = ['Impressions', 'Clicks', 'Spend'];
    // Open checklist
    (el.shadowRoot!.querySelector('[data-action="toggle-checklist"]') as HTMLButtonElement).click();
    let payload: string[] | null = null;
    el.addEventListener('metrics-changed', (e) => { payload = (e as CustomEvent).detail; });
    // Click on "Clicks" to toggle it on
    const item = el.shadowRoot!.querySelector('[data-metric="Clicks"]') as HTMLElement;
    item.click();
    expect(payload).toEqual(['Clicks']);
    document.body.removeChild(el);
  });

  it('clicking a chip remove control removes it and emits the update', () => {
    const el = document.createElement('kpi-metric-picker') as KpiMetricPickerElement;
    document.body.appendChild(el);
    el.availableMetrics = ['Impressions', 'Clicks'];
    el.selectedMetrics = ['Impressions', 'Clicks'];
    let payload: string[] | null = null;
    el.addEventListener('metrics-changed', (e) => { payload = (e as CustomEvent).detail; });
    const removeBtn = el.shadowRoot!.querySelector('[data-action="remove-chip"][data-metric="Impressions"]') as HTMLButtonElement;
    removeBtn.click();
    expect(payload).toEqual(['Clicks']);
    document.body.removeChild(el);
  });

  it('checklist reflects currently selected metrics (checked state) when reopened', () => {
    const el = document.createElement('kpi-metric-picker') as KpiMetricPickerElement;
    document.body.appendChild(el);
    el.availableMetrics = ['Impressions', 'Clicks'];
    el.selectedMetrics = ['Clicks'];
    // Open checklist
    (el.shadowRoot!.querySelector('[data-action="toggle-checklist"]') as HTMLButtonElement).click();
    const clicksItem = el.shadowRoot!.querySelector('[data-metric="Clicks"] input') as HTMLInputElement;
    const impressionsItem = el.shadowRoot!.querySelector('[data-metric="Impressions"] input') as HTMLInputElement;
    expect(clicksItem.checked).toBe(true);
    expect(impressionsItem.checked).toBe(false);
    document.body.removeChild(el);
  });
});
