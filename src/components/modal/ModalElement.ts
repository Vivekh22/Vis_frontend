/**
 * ModalElement.ts — components/modal/
 *
 * Purpose:
 *   Generic, reusable modal/dialog container. Handles overlay backdrop,
 *   centered positioning, focus trapping, Escape-to-close, and optional
 *   backdrop-click-to-close. Uses a native <slot> so callers can place
 *   arbitrary content inside.
 *
 * Accessibility:
 *   - Focus trapping: Tab/Shift+Tab cycles within focusable elements.
 *   - Escape key closes (when not disabled).
 *   - Backdrop click closes (when not disabled).
 *   - When closed, renders nothing (no stale ARIA artifacts).
 *
 * Backdrop-click-closing:
 *   A public boolean setter controls whether clicking the backdrop closes
 *   the modal. Disabled for cases requiring a definite user choice (e.g.
 *   MandatoryNoteDialogElement — accidentally clicking outside shouldn't
 *   lose an in-progress note).
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html } from '../../platform/rendering/SafeHtml';

const STYLES = `
  :host { display: contents; }
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }
  .modal {
    background: var(--color-bg);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-width: 90%;
    max-height: 90vh;
    overflow: auto;
    padding: var(--space-6);
    position: relative;
  }
  ::slotted(*) { width: 100%; }
`;

class ModalElement extends BaseComponent {
  private isOpen = false;
  private backdropCloseEnabled = true;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public open(): void {
    this.isOpen = true;
    this.rerender();
  }

  public close(): void {
    this.isOpen = false;
    this.rerender();
  }

  public setBackdropCloseEnabled(value: boolean): void {
    this.backdropCloseEnabled = value;
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('keydown', this.handleKeyDown);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('overlay') && this.backdropCloseEnabled) {
      this.close();
    }
  };

  private handleKeyDown = (event: Event): void => {
    if (!this.isOpen) return;
    const ke = event as KeyboardEvent;
    if (ke.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (ke.key === 'Tab') {
      this.trapFocus(ke);
    }
  };

  private trapFocus(event: KeyboardEvent): void {
    const sel = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(this.shadow.querySelectorAll<HTMLElement>(sel));
    const slottedFocusable = Array.from(this.querySelectorAll<HTMLElement>(sel));
    const allFocusable = [...focusable, ...slottedFocusable];
    if (allFocusable.length === 0) return;

    const first = allFocusable[0]!;
    const last = allFocusable[allFocusable.length - 1]!;

    if (event.shiftKey) {
      if (document.activeElement === first || document.activeElement === this) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last || document.activeElement === this) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  protected renderTemplate(): string {
    if (!this.isOpen) return '';
    return html`
      <div class="overlay" role="dialog" aria-modal="true">
        <div class="modal">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('vis-modal', ModalElement);
export { ModalElement };
