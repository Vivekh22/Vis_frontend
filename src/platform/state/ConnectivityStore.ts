/**
 * ConnectivityStore.ts — platform/state/
 *
 * Purpose:
 *   Lightweight observable store tracking the user's network connection
 *   quality. Used by ClientLayoutElement to restrict nav to Dashboard +
 *   Campaigns when on a slow connection (saveType 'slow-2g' / '2g' or
 *   effectiveType '2g'), with a notice that Creatives may load slowly.
 *
 * navigator.connection availability:
 *   Only Chrome/Edge support the Network Information API. Firefox and
 *   Safari do NOT have navigator.connection. When unavailable, the store
 *   simply reports isLowNetwork = false and never restricts navigation —
 *   we do NOT guess or assume slow network. This fallback is intentional
 *   and tested.
 *
 *   The store reads connection.effectiveType and connection.saveType.
 *   'slow-2g' and '2g' are considered low-network. '3g' and '4g' are not.
 */
import { Store } from './Store';

export interface ConnectivityState {
  isLowNetwork: boolean;
  isSupported: boolean;
  effectiveType: string | null;
}

const INITIAL_STATE: ConnectivityState = {
  isLowNetwork: false,
  isSupported: false,
  effectiveType: null,
};

// navigator.connection typing — not in standard lib.d.ts for all browsers.
interface NetworkInformation extends EventTarget {
  effectiveType: string;
  saveData: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

function getNavigatorConnection(): NetworkInformation | undefined {
  const nav = navigator as Navigator & { connection?: NetworkInformation };
  return nav.connection;
}

function isLowNetworkType(effectiveType: string): boolean {
  return effectiveType === 'slow-2g' || effectiveType === '2g';
}

class ConnectivityStoreImpl {
  private readonly store: Store<ConnectivityState> = new Store<ConnectivityState>(INITIAL_STATE);
  private connection: NetworkInformation | undefined;
  private boundChangeHandler: (() => void) | null = null;

  /**
   * Initializes the store by reading navigator.connection. Safe to call
   * in any browser — if the API is unavailable, the store stays at its
   * default (not low-network, not supported).
   */
  public init(): void {
    this.connection = getNavigatorConnection();
    if (!this.connection) {
      return;
    }
    this.boundChangeHandler = () => this.updateFromConnection();
    this.updateFromConnection();
    this.connection.addEventListener('change', this.boundChangeHandler);
  }

  /**
   * Cleans up the event listener. Called on layout unmount.
   */
  public destroy(): void {
    if (this.connection && this.boundChangeHandler) {
      this.connection.removeEventListener('change', this.boundChangeHandler);
    }
    this.boundChangeHandler = null;
    this.store.setState(INITIAL_STATE);
  }

  public getState(): ConnectivityState {
    return this.store.getState();
  }

  public subscribe(callback: (newState: ConnectivityState, previousState: ConnectivityState) => void): () => void {
    return this.store.subscribe(callback);
  }

  private updateFromConnection(): void {
    if (!this.connection) return;
    const effectiveType = this.connection.effectiveType;
    this.store.setState({
      isSupported: true,
      isLowNetwork: isLowNetworkType(effectiveType),
      effectiveType,
    });
  }
}

export const connectivityStore = new ConnectivityStoreImpl();