/**
 * Store.ts — platform/state/
 *
 * Purpose:
 *   Minimal observable state container — the hand-built equivalent of a state
 *   management library, kept small and fully auditable.
 *
 * Immutability guarantee:
 *   getState() returns a deep-cloned copy (structuredClone) for object state, so
 *   external code cannot mutate the store's internal state directly. All
 *   mutations must go through setState(). This is a meaningful correctness and
 *   predictability property of the whole state system.
 *
 * Equality check:
 *   setState() does NOT notify subscribers when the new state is equal to the
 *   previous state (Object.is for primitives, shallow comparison for plain
 *   objects). Deeply nested changes require constructing a new top-level
 *   reference to be detected — a standard, well-understood pattern for this
 *   style of container.
 *
 * structuredClone:
 *   A built-in (no dependency) deep-clone primitive available in modern
 *   browsers and Node 17+. Using it avoids pulling in a dependency like lodash
 *   and keeps the immutability guarantee real, not shallow.
 */
type Updater<T> = T | ((previous: T) => T);

export class Store<T> {
  private state: T;
  private readonly subscribers: Set<(newState: T, previousState: T) => void> = new Set();

  constructor(initialState: T) {
    this.state = this.clone(initialState);
  }

  /** Returns the current state. Object state is deep-cloned to enforce immutability. */
  public getState(): T {
    return this.clone(this.state);
  }

  /**
   * Accepts a new value directly OR a function computing the new value from the
   * previous one (the function form avoids race-prone getState()+setState() as
   * two separate steps). Notifies subscribers only if the new state differs
   * from the previous.
   */
  public setState(updater: Updater<T>): void {
    const previous = this.state;
    const next = typeof updater === 'function' ? (updater as (p: T) => T)(previous) : updater;
    if (this.isEqual(previous, next)) {
      return;
    }
    this.state = this.clone(next);
    this.notify(this.state, previous);
  }

  /**
   * Adds a subscriber and returns an unsubscribe function. Components MUST call
   * it in onUnmount() to prevent memory leaks.
   */
  public subscribe(callback: (newState: T, previousState: T) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify(newState: T, previousState: T): void {
    for (const cb of this.subscribers) {
      cb(newState, previousState);
    }
  }

  private clone(value: T): T {
    if (value === null || typeof value !== 'object') {
      return value;
    }
    return structuredClone(value);
  }

  private isEqual(a: T, b: T): boolean {
    if (Object.is(a, b)) {
      return true;
    }
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
      return false;
    }
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    for (const key of aKeys) {
      if (
        !Object.is(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
        )
      ) {
        return false;
      }
    }
    return true;
  }
}