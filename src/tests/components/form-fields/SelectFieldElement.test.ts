// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { SelectFieldElement } from '../../../components/form-fields/SelectFieldElement';
import '../../../components/form-fields/SelectFieldElement';

describe('SelectFieldElement', () => {
  const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ];

  it('value get/set works correctly', () => {
    const el = document.createElement('select-field') as SelectFieldElement;
    document.body.appendChild(el);
    el.options = options;
    el.value = 'b';
    const select = el.shadowRoot!.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('b');
    expect(el.value).toBe('b');
    document.body.removeChild(el);
  });

  it('error message displays when set and clears when set to null', () => {
    const el = document.createElement('select-field') as SelectFieldElement;
    document.body.appendChild(el);
    el.errorMessage = 'Invalid';
    expect(el.shadowRoot!.querySelector('.error-msg')?.textContent).toBe('Invalid');
    el.errorMessage = null;
    expect(el.shadowRoot!.querySelector('.error-msg')).toBeNull();
    document.body.removeChild(el);
  });

  it('value-changed emits the correct value on user interaction', () => {
    const el = document.createElement('select-field') as SelectFieldElement;
    document.body.appendChild(el);
    el.options = options;
    let payload: string | null = null;
    el.addEventListener('value-changed', (e: Event) => { payload = (e as CustomEvent).detail; });
    const select = el.shadowRoot!.querySelector('select') as HTMLSelectElement;
    select.value = 'b';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(payload).toBe('b');
    document.body.removeChild(el);
  });
});