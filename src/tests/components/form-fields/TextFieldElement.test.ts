// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { TextFieldElement } from '../../../components/form-fields/TextFieldElement';
import '../../../components/form-fields/TextFieldElement';

describe('TextFieldElement', () => {
  it('value get/set works correctly', () => {
    const el = document.createElement('text-field') as TextFieldElement;
    document.body.appendChild(el);
    el.value = 'hello';
    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('hello');
    expect(el.value).toBe('hello');
    document.body.removeChild(el);
  });

  it('error message displays when set and clears when set to null', () => {
    const el = document.createElement('text-field') as TextFieldElement;
    document.body.appendChild(el);
    el.errorMessage = 'Required';
    expect(el.shadowRoot!.querySelector('.error-msg')?.textContent).toBe('Required');
    el.errorMessage = null;
    expect(el.shadowRoot!.querySelector('.error-msg')).toBeNull();
    document.body.removeChild(el);
  });

  it('value-changed emits the correct value on user input', () => {
    const el = document.createElement('text-field') as TextFieldElement;
    document.body.appendChild(el);
    let payload: string | null = null;
    el.addEventListener('value-changed', (e: Event) => { payload = (e as CustomEvent).detail; });
    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;
    input.value = 'typed';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(payload).toBe('typed');
    document.body.removeChild(el);
  });
});