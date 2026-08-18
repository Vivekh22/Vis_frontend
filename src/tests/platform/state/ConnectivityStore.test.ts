// @ts-nocheck
/**
 * ConnectivityStore.test.ts — tests for the connectivity store.
 *
 * Tests:
 *   - Default state: not supported, not low-network
 *   - When navigator.connection is unavailable, stays at default
 *   - When navigator.connection reports 2g, isLowNetwork = true
 *   - When navigator.connection reports 4g, isLowNetwork = false
 *   - destroy() resets state and removes listener
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { connectivityStore } from '../../../platform/state/ConnectivityStore';

describe('ConnectivityStore', () => {
  let originalConnection: unknown;

  beforeEach(() => {
    originalConnection = (navigator as unknown as { connection?: unknown }).connection;
    connectivityStore.destroy();
  });

  afterEach(() => {
    (navigator as unknown as { connection?: unknown }).connection = originalConnection;
    connectivityStore.destroy();
  });

  it('defaults to unsupported and not low-network', () => {
    delete (navigator as unknown as { connection?: unknown }).connection;
    connectivityStore.init();
    const state = connectivityStore.getState();
    expect(state.isSupported).toBe(false);
    expect(state.isLowNetwork).toBe(false);
    expect(state.effectiveType).toBeNull();
  });

  it('stays at default when navigator.connection is unavailable (Firefox/Safari fallback)', () => {
    delete (navigator as unknown as { connection?: unknown }).connection;
    connectivityStore.init();
    const state = connectivityStore.getState();
    expect(state.isLowNetwork).toBe(false);
    expect(state.isSupported).toBe(false);
  });

  it('reports low-network when effectiveType is 2g', () => {
    const fakeConnection = {
      effectiveType: '2g',
      saveData: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    (navigator as unknown as { connection?: unknown }).connection = fakeConnection;
    connectivityStore.init();
    const state = connectivityStore.getState();
    expect(state.isSupported).toBe(true);
    expect(state.isLowNetwork).toBe(true);
    expect(state.effectiveType).toBe('2g');
  });

  it('reports not low-network when effectiveType is 4g', () => {
    const fakeConnection = {
      effectiveType: '4g',
      saveData: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    (navigator as unknown as { connection?: unknown }).connection = fakeConnection;
    connectivityStore.init();
    const state = connectivityStore.getState();
    expect(state.isSupported).toBe(true);
    expect(state.isLowNetwork).toBe(false);
  });

  it('reports low-network when effectiveType is slow-2g', () => {
    const fakeConnection = {
      effectiveType: 'slow-2g',
      saveData: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    (navigator as unknown as { connection?: unknown }).connection = fakeConnection;
    connectivityStore.init();
    const state = connectivityStore.getState();
    expect(state.isLowNetwork).toBe(true);
  });

  it('destroy() resets state and removes listener', () => {
    const removeSpy = vi.fn();
    const fakeConnection = {
      effectiveType: '2g',
      saveData: false,
      addEventListener: vi.fn(),
      removeEventListener: removeSpy,
    };
    (navigator as unknown as { connection?: unknown }).connection = fakeConnection;
    connectivityStore.init();
    connectivityStore.destroy();
    expect(removeSpy).toHaveBeenCalled();
    const state = connectivityStore.getState();
    expect(state.isSupported).toBe(false);
    expect(state.isLowNetwork).toBe(false);
  });

  it('notifies subscribers when connection changes', () => {
    const listeners: (() => void)[] = [];
    const fakeConnection = {
      effectiveType: '4g',
      saveData: false,
      addEventListener: (_type: string, listener: () => void) => { listeners.push(listener); },
      removeEventListener: vi.fn(),
    };
    (navigator as unknown as { connection?: unknown }).connection = fakeConnection;
    connectivityStore.init();

    let receivedState = connectivityStore.getState();
    const unsub = connectivityStore.subscribe((newState) => { receivedState = newState; });

    // Simulate connection change to 2g
    (fakeConnection as { effectiveType: string }).effectiveType = '2g';
    listeners.forEach((fn) => fn());

    expect(receivedState.isLowNetwork).toBe(true);
    unsub();
  });
});