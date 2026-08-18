import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ConnectivityStore', () => {
  let storeModule: typeof import('../../platform/state/ConnectivityStore');

  beforeEach(async () => {
    // Reset modules to ensure clean state for each test
    vi.resetModules();
    
    // Save original navigator
    vi.stubGlobal('navigator', { ...globalThis.navigator });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to unrestricted (isLowNetwork = false) when navigator.connection is undefined', async () => {
    // Ensure connection is missing (e.g. Safari/Firefox)
    Object.defineProperty(globalThis.navigator, 'connection', {
      value: undefined,
      configurable: true,
    });

    storeModule = await import('../../platform/state/ConnectivityStore');
    const store = storeModule.connectivityStore;
    
    store.init();
    
    const state = store.getState();
    expect(state.isSupported).toBe(false);
    expect(state.isLowNetwork).toBe(false);
    expect(state.effectiveType).toBeNull();
    
    store.destroy();
  });

  it('detects low network when navigator.connection.effectiveType is slow-2g', async () => {
    Object.defineProperty(globalThis.navigator, 'connection', {
      value: {
        effectiveType: 'slow-2g',
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      configurable: true,
    });

    storeModule = await import('../../platform/state/ConnectivityStore');
    const store = storeModule.connectivityStore;
    
    store.init();
    
    const state = store.getState();
    expect(state.isSupported).toBe(true);
    expect(state.isLowNetwork).toBe(true);
    expect(state.effectiveType).toBe('slow-2g');
    
    store.destroy();
  });

  it('detects normal network when navigator.connection.effectiveType is 4g', async () => {
    Object.defineProperty(globalThis.navigator, 'connection', {
      value: {
        effectiveType: '4g',
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      configurable: true,
    });

    storeModule = await import('../../platform/state/ConnectivityStore');
    const store = storeModule.connectivityStore;
    
    store.init();
    
    const state = store.getState();
    expect(state.isSupported).toBe(true);
    expect(state.isLowNetwork).toBe(false);
    expect(state.effectiveType).toBe('4g');
    
    store.destroy();
  });
});
