import { describe, it, expect } from 'vitest';
import { PeriodSelectorElement, computePresetRange } from '../../../components/period-selector/PeriodSelectorElement';

// Force value import to prevent esbuild import elision (ensures ComponentRegistry.register runs)
void PeriodSelectorElement;

describe('PeriodSelectorElement', () => {
  it('selecting a preset period emits the correct computed DateRange', () => {
    const el = document.createElement('period-selector') as PeriodSelectorElement;
    document.body.appendChild(el);
    let payload: { start: Date; end: Date } | null = null;
    el.addEventListener('period-changed', (e) => { payload = (e as CustomEvent).detail; });
    const select = el.shadowRoot!.querySelector('[data-field="period"]') as HTMLSelectElement;
    select.value = 'today';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(payload).not.toBeNull();
    expect(payload!.start.getTime()).toBeLessThanOrEqual(payload!.end.getTime());
    document.body.removeChild(el);
  });

  it('selecting Custom reveals the date input fields', () => {
    const el = document.createElement('period-selector') as PeriodSelectorElement;
    document.body.appendChild(el);
    const select = el.shadowRoot!.querySelector('[data-field="period"]') as HTMLSelectElement;
    select.value = 'custom';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const dateInputs = el.shadowRoot!.querySelectorAll('[data-field="custom-start"], [data-field="custom-end"]');
    expect(dateInputs.length).toBe(2);
    document.body.removeChild(el);
  });

  it('entering a valid custom range emits the correct DateRange', () => {
    const el = document.createElement('period-selector') as PeriodSelectorElement;
    document.body.appendChild(el);
    const select = el.shadowRoot!.querySelector('[data-field="period"]') as HTMLSelectElement;
    select.value = 'custom';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    let payload: { start: Date; end: Date } | null = null;
    el.addEventListener('period-changed', (e) => { payload = (e as CustomEvent).detail; });
    const startInput = el.shadowRoot!.querySelector('[data-field="custom-start"]') as HTMLInputElement;
    const endInput = el.shadowRoot!.querySelector('[data-field="custom-end"]') as HTMLInputElement;
    startInput.value = '2026-01-01';
    startInput.dispatchEvent(new Event('change', { bubbles: true }));
    endInput.value = '2026-01-31';
    endInput.dispatchEvent(new Event('change', { bubbles: true }));
    expect(payload).not.toBeNull();
    expect(payload!.start.getFullYear()).toBe(2026);
    expect(payload!.start.getMonth()).toBe(0);
    expect(payload!.end.getMonth()).toBe(0);
    document.body.removeChild(el);
  });

  it('computePresetRange returns correct range for 7d', () => {
    const range = computePresetRange('7d');
    const diff = range.end.getTime() - range.start.getTime();
    expect(diff).toBeGreaterThan(0);
    // 7 days should span ~6 days (inclusive of today)
    expect(diff).toBeGreaterThanOrEqual(6 * 24 * 60 * 60 * 1000);
  });
});
