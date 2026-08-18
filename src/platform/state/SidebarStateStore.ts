/**
 * SidebarStateStore.ts — platform/state/
 *
 * Purpose:
 *   Persists the expanded/collapsed state of sidebar navigation groups.
 *   Uses localStorage so state survives page reloads and navigations.
 *
 * Config:
 *   SIDEBAR_CONFIG.accordionMode determines if opening one group closes others
 *   ('single') or if multiple groups can be open at once ('multi').
 */
import { Store } from './Store';

export const SIDEBAR_CONFIG = {
  accordionMode: 'multi' as 'single' | 'multi',
};

export interface SidebarState {
  expandedGroups: Record<string, boolean>;
}

const STORAGE_KEY = 'visp_sidebar_state';

const getInitialState = (): SidebarState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { expandedGroups: JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to parse sidebar state from localStorage', e);
  }
  return { expandedGroups: {} };
};

class SidebarStateStoreImpl {
  private readonly store: Store<SidebarState> = new Store<SidebarState>(getInitialState());

  constructor() {
    this.store.subscribe((newState) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.expandedGroups));
      } catch (e) {
        console.error('Failed to write sidebar state to localStorage', e);
      }
    });
  }

  public getState(): SidebarState {
    return this.store.getState();
  }

  public subscribe(callback: (newState: SidebarState, previousState: SidebarState) => void): () => void {
    return this.store.subscribe(callback);
  }

  public isExpanded(label: string): boolean {
    return !!this.store.getState().expandedGroups[label];
  }

  public expandGroup(label: string): void {
    this.store.setState((prev) => {
      const expandedGroups = SIDEBAR_CONFIG.accordionMode === 'single'
        ? { [label]: true }
        : { ...prev.expandedGroups, [label]: true };
      
      return { ...prev, expandedGroups };
    });
  }

  public collapseGroup(label: string): void {
    this.store.setState((prev) => {
      const expandedGroups = { ...prev.expandedGroups, [label]: false };
      return { ...prev, expandedGroups };
    });
  }

  public toggleGroup(label: string): void {
    const isCurrentlyExpanded = this.isExpanded(label);
    if (isCurrentlyExpanded) {
      this.collapseGroup(label);
    } else {
      this.expandGroup(label);
    }
  }
}

export const sidebarStateStore = new SidebarStateStoreImpl();
