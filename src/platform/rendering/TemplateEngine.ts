/**
 * TemplateEngine.ts — platform/rendering/
 *
 * Purpose:
 *   A minimal reactive-update mechanism. When a component's underlying data
 *   changes, call update() and the container's contents are replaced with the
 *   latest markup returned by the component's render function. This is the
 *   hand-built equivalent of a framework's render cycle, kept deliberately
 *   small and fully auditable.
 *
 * Design decision — full re-render, no diffing:
 *   update() performs a full replacement of the container's innerHTML on every
 *   call rather than fine-grained DOM diffing. This is an acceptable tradeoff
 *   at this project's scale because re-renders are component-scoped (each
 *   component re-renders only its own Shadow DOM), not whole-page. The
 *   complexity cost of building real DOM diffing from scratch would introduce
 *   far more custom, unaudited code than the performance gain would justify —
 *   tying back to the project's overriding security-first,
 *   minimal-custom-complexity philosophy. For the rare component where a full
 *   re-render is genuinely expensive, updateIfChanged() guards against wasteful
 *   no-op re-renders.
 */
import { render } from './SafeHtml';

export class TemplateEngine {
  private readonly container: Element | ShadowRoot;
  private readonly renderFn: () => string;
  private lastDependencies: unknown[] = [];
  private hasRendered = false;

  constructor(container: Element | ShadowRoot, renderFn: () => string) {
    this.container = container;
    this.renderFn = renderFn;
  }

  /**
   * Re-renders the container by calling the render function and passing the
   * result to SafeHtml.render(). Full re-render of the container's contents.
   */
  public update(): void {
    const markup = this.renderFn();
    render(this.container, markup);
  }

  /**
   * Calls update() only if `newDependencies` differs (shallow, element-wise)
   * from the dependencies passed on the previous call. Avoids wasteful
   * re-renders when an update is triggered but nothing relevant changed.
   *
   * Shallow comparison: referential equality per element. Deeply nested state
   * changes require a new top-level reference to be detected — the same
   * convention used by the Store's equality check.
   */
  public updateIfChanged(newDependencies: unknown[]): void {
    if (this.hasRendered && this.dependenciesEqual(newDependencies)) {
      return;
    }
    this.lastDependencies = newDependencies;
    this.hasRendered = true;
    this.update();
  }

  private dependenciesEqual(newDependencies: unknown[]): boolean {
    if (newDependencies.length !== this.lastDependencies.length) {
      return false;
    }
    for (let i = 0; i < newDependencies.length; i++) {
      if (!Object.is(newDependencies[i], this.lastDependencies[i])) {
        return false;
      }
    }
    return true;
  }
}