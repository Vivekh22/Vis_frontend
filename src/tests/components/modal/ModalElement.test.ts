// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { ModalElement } from '../../../components/modal/ModalElement';
import '../../../components/modal/ModalElement';

describe('ModalElement', () => {
  it('open/close toggle visibility', () => {
    const el = document.createElement('vis-modal') as ModalElement;
    document.body.appendChild(el);
    expect(el.shadowRoot!.querySelector('.overlay')).toBeNull();
    el.open();
    expect(el.shadowRoot!.querySelector('.overlay')).not.toBeNull();
    el.close();
    expect(el.shadowRoot!.querySelector('.overlay')).toBeNull();
    document.body.removeChild(el);
  });

  it('Escape key closes the modal', () => {
    const el = document.createElement('vis-modal') as ModalElement;
    document.body.appendChild(el);
    el.open();
    const overlay = el.shadowRoot!.querySelector('.overlay') as HTMLElement;
    overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(el.shadowRoot!.querySelector('.overlay')).toBeNull();
    document.body.removeChild(el);
  });

  it('backdrop click closes when enabled', () => {
    const el = document.createElement('vis-modal') as ModalElement;
    document.body.appendChild(el);
    el.open();
    const overlay = el.shadowRoot!.querySelector('.overlay') as HTMLElement;
    overlay.click();
    expect(el.shadowRoot!.querySelector('.overlay')).toBeNull();
    document.body.removeChild(el);
  });

  it('backdrop click does NOT close when disabled', () => {
    const el = document.createElement('vis-modal') as ModalElement;
    document.body.appendChild(el);
    el.setBackdropCloseEnabled(false);
    el.open();
    const overlay = el.shadowRoot!.querySelector('.overlay') as HTMLElement;
    overlay.click();
    expect(el.shadowRoot!.querySelector('.overlay')).not.toBeNull();
    document.body.removeChild(el);
  });
});