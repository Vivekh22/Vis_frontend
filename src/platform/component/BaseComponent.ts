/**
 * BaseComponent.ts — platform/component/
 *
 * Purpose:
 *   Abstract base class for EVERY Custom Element in the application — every
 *   shared component in components/, every page in pages/, every layout in
 *   layouts/. Provides a predictable lifecycle, a wired TemplateEngine, typed
 *   shadow-DOM queries, and an upward event-emission helper.
 *
 * Lifecycle:
 *   connectedCallback   → templateEngine.update() → onMount()
 *   disconnectedCallback → onUnmount()
 *
 *   onMount / onUnmount have empty default implementations so subclasses opt
 *   in only when they need setup / teardown (event listeners, subscriptions,
 *   in-flight request cancellation). This is critical for preventing memory
 *   leaks across a 50+ page app where components mount and unmount frequently
 *   as the user navigates.
 *
 * Shadow DOM mode:
 *   Always open, never closed. Closed Shadow DOM would make testing and
 *   debugging harder, and the security benefit of closed mode is minimal for
 *   this app's threat model — the isolation benefit of Shadow DOM comes from
 *   style/DOM encapsulation between components, not from hiding structure from
 *   the page's own JavaScript.
 */
import { TemplateEngine } from '../rendering/TemplateEngine';

export abstract class BaseComponent extends HTMLElement {
  protected readonly shadow: ShadowRoot;
  protected readonly templateEngine: TemplateEngine;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.templateEngine = new TemplateEngine(this.shadow, () => this.renderTemplate());
  }

  /** Each subclass defines its markup here via the `html` tagged template. */
  protected abstract renderTemplate(): string;

  /** Optional setup after the element is in the DOM. Override as needed. */
  protected onMount(): void {
    // empty by default
  }

  /** Optional cleanup after the element is removed. Override as needed. */
  protected onUnmount(): void {
    // empty by default
  }

  /** Re-renders the component's Shadow DOM. Call after internal state changes. */
  protected rerender(): void {
    this.templateEngine.update();
  }

  /**
   * Typed shadow-DOM querySelector. Gives subclasses a clean way to grab
   * elements without verbose querySelector calls with manual type assertions.
   */
  protected query<T extends Element>(selector: string): T | null {
    return this.shadow.querySelector(selector) as T | null;
  }

  /**
   * Dispatches a CustomEvent that bubbles AND is composed (crosses the Shadow
   * DOM boundary) so parent components / pages can hear it.
   *
   * This is the sanctioned upward-communication channel for Custom Elements —
   * there is no built-in prop-callback equivalent. Components emit, parents
   * listen. This pattern is used constantly throughout the component library.
   */
  protected emit<T>(eventName: string, detail: T): void {
    this.dispatchEvent(
      new CustomEvent<T>(eventName, {
        bubbles: true,
        composed: true,
        detail,
      }),
    );
  }

  connectedCallback(): void {
    this.templateEngine.update();
    this.onMount();
  }

  disconnectedCallback(): void {
    this.onUnmount();
  }
}