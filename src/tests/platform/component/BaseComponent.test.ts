// @ts-nocheck
/**
 * BaseComponent.test.ts — unit tests for platform/component/BaseComponent.ts.
 */
import { describe, it, expect } from 'vitest';
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { html } from '../../../platform/rendering/SafeHtml';

class LifecycleComponent extends BaseComponent {
  public mountCount = 0;
  public unmountCount = 0;

  protected renderTemplate(): string {
    return html`<p data-testid="root">test</p>`;
  }

  protected onMount(): void {
    this.mountCount++;
  }

  protected onUnmount(): void {
    this.unmountCount++;
  }

  /** Exposes the protected emit() for testing. */
  public fireEvent(detail: { value: number }): void {
    this.emit('lc-event', detail);
  }
}

class StatefulComponent extends BaseComponent {
  public message = 'first';

  protected renderTemplate(): string {
    return html`<p>${this.message}</p>`;
  }
}

ComponentRegistry.register('lc-test', LifecycleComponent);
ComponentRegistry.register('lc-stateful', StatefulComponent);

describe('BaseComponent', () => {
  it('renders its template on mount', () => {
    const el = document.createElement('lc-test') as LifecycleComponent;
    document.body.appendChild(el);
    const p = el.shadowRoot?.querySelector('p');
    expect(p?.textContent).toBe('test');
    document.body.removeChild(el);
  });

  it('calls onMount exactly once when attached', () => {
    const el = document.createElement('lc-test') as LifecycleComponent;
    document.body.appendChild(el);
    expect(el.mountCount).toBe(1);
    document.body.removeChild(el);
  });

  it('calls onUnmount exactly once when removed', () => {
    const el = document.createElement('lc-test') as LifecycleComponent;
    document.body.appendChild(el);
    document.body.removeChild(el);
    expect(el.unmountCount).toBe(1);
  });

  it('rerender() updates the DOM after a state change', () => {
    const el = document.createElement('lc-stateful') as StatefulComponent;
    document.body.appendChild(el);
    expect(el.shadowRoot?.textContent).toContain('first');
    el.message = 'second';
    (el as unknown as { rerender: () => void }).rerender();
    expect(el.shadowRoot?.textContent).toContain('second');
    document.body.removeChild(el);
  });

  it('emit() dispatches an event a parent can hear with the correct detail', () => {
    const parent = document.createElement('div');
    const el = document.createElement('lc-test') as LifecycleComponent;
    parent.appendChild(el);
    document.body.appendChild(parent);

    let heard: { value: number } | null = null;
    parent.addEventListener('lc-event', (event: Event) => {
      heard = (event as CustomEvent<{ value: number }>).detail;
    });
    el.fireEvent({ value: 42 });
    expect(heard).toEqual({ value: 42 });

    document.body.removeChild(parent);
  });
});