// @ts-nocheck
/**
 * ComponentRegistry.test.ts — unit tests for platform/component/ComponentRegistry.ts.
 */
import { describe, it, expect, vi } from 'vitest';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';

describe('ComponentRegistry', () => {
  it('does not throw on duplicate registration and only defines once', () => {
    const spy = vi.spyOn(customElements, 'define');
    class DupA extends HTMLElement {}
    ComponentRegistry.register('cr-dup-a', DupA);
    ComponentRegistry.register('cr-dup-a', DupA); // duplicate — must not throw
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('registers distinct tags separately', () => {
    const spy = vi.spyOn(customElements, 'define');
    class DupB extends HTMLElement {}
    class DupC extends HTMLElement {}
    ComponentRegistry.register('cr-dup-b', DupB);
    ComponentRegistry.register('cr-dup-c', DupC);
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});