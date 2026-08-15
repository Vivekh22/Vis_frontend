/**
 * Store.test.ts — unit tests for platform/state/Store.ts.
 */
import { describe, it, expect, vi } from 'vitest';
import { Store } from '../../../platform/state/Store';

describe('Store', () => {
  it('getState() returns the current value', () => {
    const s = new Store<number>(5);
    expect(s.getState()).toBe(5);
  });

  it('setState() with a direct value updates state', () => {
    const s = new Store<number>(1);
    s.setState(2);
    expect(s.getState()).toBe(2);
  });

  it('setState() with an updater function updates state', () => {
    const s = new Store<number>(1);
    s.setState((p) => p + 5);
    expect(s.getState()).toBe(6);
  });

  it('subscribers are notified with new and previous state', () => {
    const s = new Store<number>(1);
    const cb = vi.fn();
    s.subscribe(cb);
    s.setState(2);
    expect(cb).toHaveBeenCalledWith(2, 1);
  });

  it('subscribers are NOT notified when new state equals the previous', () => {
    const s = new Store<number>(1);
    const cb = vi.fn();
    s.subscribe(cb);
    s.setState(1);
    expect(cb).not.toHaveBeenCalled();
  });

  it('unsubscribe stops future notifications', () => {
    const s = new Store<number>(1);
    const cb = vi.fn();
    const unsub = s.subscribe(cb);
    s.setState(2);
    unsub();
    s.setState(3);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('does not allow external mutation of object state via getState()', () => {
    const s = new Store<{ count: number }>({ count: 1 });
    const state = s.getState();
    state.count = 999;
    expect(s.getState().count).toBe(1);
  });

  it('notifies on object state when a new top-level reference is set', () => {
    const s = new Store<{ count: number }>({ count: 1 });
    const cb = vi.fn();
    s.subscribe(cb);
    s.setState({ count: 2 });
    expect(cb).toHaveBeenCalledTimes(1);
  });
});