import { describe, it, expect } from 'vitest';
import { DateRangeFieldElement } from '../../../components/form-fields/DateRangeFieldElement';
import { DateRange } from '../../../core/value-objects/DateRange';

// Force value import to prevent esbuild import elision (ensures ComponentRegistry.register runs)
void DateRangeFieldElement;

describe('DateRangeFieldElement', () => {
  it('value get/set works correctly', () => {
    const el = document.createElement('date-range-field') as DateRangeFieldElement;
    document.body.appendChild(el);
    const range = new DateRange(new Date('2026-01-01'), new Date('2026-01-31'));
    el.value = range;
    const inputs = el.shadowRoot!.querySelectorAll('input');
    expect((inputs[0] as HTMLInputElement).value).toBe('2026-01-01');
    expect((inputs[1] as HTMLInputElement).value).toBe('2026-01-31');
    expect(el.value).toEqual(range);
    document.body.removeChild(el);
  });

  it('error message displays when set and clears when set to null', () => {
    const el = document.createElement('date-range-field') as DateRangeFieldElement;
    document.body.appendChild(el);
    el.errorMessage = 'Invalid range';
    expect(el.shadowRoot!.querySelector('.error-msg')?.textContent).toBe('Invalid range');
    el.errorMessage = null;
    expect(el.shadowRoot!.querySelector('.error-msg')).toBeNull();
    document.body.removeChild(el);
  });

  it('value-changed emits the correct value on user interaction', () => {
    const el = document.createElement('date-range-field') as DateRangeFieldElement;
    document.body.appendChild(el);
    let payload: { start: Date; end: Date } | null = null;
    el.addEventListener('value-changed', (e: Event) => { payload = (e as CustomEvent).detail; });
    const startInput = el.shadowRoot!.querySelector('[data-field="start"]') as HTMLInputElement;
    startInput.value = '2026-03-15';
    startInput.dispatchEvent(new Event('change', { bubbles: true }));
    expect(payload).not.toBeNull();
    expect(payload!.start.getFullYear()).toBe(2026);
    expect(payload!.start.getMonth()).toBe(2);
    document.body.removeChild(el);
  });
});