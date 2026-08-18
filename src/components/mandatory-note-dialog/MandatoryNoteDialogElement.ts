/**
 * MandatoryNoteDialogElement.ts — components/mandatory-note-dialog/
 *
 * Purpose:
 *   Every Admin/Super Admin write action against a client's data requires a
 *   note. This is the ONE shared dialog enforcing that — rather than each
 *   page implementing its own note-collection UI inconsistently.
 *
 * API:
 *   open({ actionDescription, onConfirm, onCancel }) — shows the dialog.
 *   close() — hides the dialog.
 *
 * Validation:
 *   The note must be non-empty AND meet a minimum length (10 characters) to
 *   prevent a meaningless one-character note from satisfying the mandatory-
 *   note requirement in spirit, not just in the letter of validation.
 *   Validation happens HERE, not left to the caller — this component exists
 *   specifically to enforce the mandatory-note requirement consistently.
 *
 * Part 14 refactor — composes ModalElement:
 *   Previously implemented its own overlay/positioning/focus-trap logic.
 *   Now delegates overlay, backdrop, focus trapping, and Escape-to-close
 *   to ModalElement (components/modal/). Backdrop-click-close is disabled
 *   (setBackdropCloseEnabled(false)) so accidentally clicking outside
 *   doesn't lose an in-progress note. The dialog content (action description,
 *   textarea, char count, buttons) is placed as light DOM children of
 *   <vis-modal>, rendered in ModalElement's <slot>.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html } from '../../platform/rendering/SafeHtml';
import '../modal/ModalElement';

const MIN_NOTE_LENGTH = 10;

const STYLES = `
  :host { display: contents; }
  .dialog {
    max-width: 480px;
    width: 90%;
    font-family: var(--font-body);
  }
  .action-desc {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-4);
  }
  .note-textarea {
    width: 100%;
    min-height: 80px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-family: var(--font-body);
    font-size: var(--font-size-sm);
    box-sizing: border-box;
    resize: vertical;
  }
  .note-textarea:focus {
    outline: none;
    border-color: var(--color-primary);
  }
  .char-count {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-top: var(--space-1);
  }
  .char-count--invalid { color: var(--color-danger); }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }
  .btn {
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    border: 1px solid transparent;
  }
  .btn--cancel {
    background: var(--color-surface);
    color: var(--color-text-primary);
    border-color: var(--color-border);
  }
  .btn--confirm {
    background: var(--color-primary);
    color: var(--color-primary-foreground);
  }
  .btn--confirm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface NoteDialogContext {
  actionDescription: string;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

interface ModalHost extends HTMLElement {
  open(): void;
  close(): void;
  setBackdropCloseEnabled(value: boolean): void;
}

class MandatoryNoteDialogElement extends BaseComponent {
  private context: NoteDialogContext | null = null;
  private isOpen = false;
  private currentNote = '';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public open(context: NoteDialogContext): void {
    this.context = context;
    this.currentNote = '';
    this.isOpen = true;
    this.rerender();
    // Open the composed ModalElement and disable backdrop-close
    const modal = this.shadow.querySelector<ModalHost>('vis-modal[data-id="note-modal"]');
    if (modal) {
      modal.setBackdropCloseEnabled(false);
      modal.open();
    }
  }

  public close(): void {
    this.isOpen = false;
    const modal = this.shadow.querySelector<ModalHost>('vis-modal[data-id="note-modal"]');
    if (modal) {
      modal.close();
    }
    this.context = null;
    this.currentNote = '';
    this.rerender();
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('input', this.handleInput);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('input', this.handleInput);
  }

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.getAttribute('data-field') === 'note') {
      this.currentNote = (target as HTMLTextAreaElement).value;
      this.updateCharCountAndButton();
    }
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const actionEl = target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.getAttribute('data-action');

    if (action === 'confirm') {
      if (this.currentNote.length >= MIN_NOTE_LENGTH && this.context) {
        this.context.onConfirm(this.currentNote);
        this.close();
      }
    } else if (action === 'cancel') {
      if (this.context) {
        this.context.onCancel();
      }
      this.close();
    }
  };

  private updateCharCountAndButton(): void {
    const countEl = this.query<HTMLElement>('[data-field="char-count"]');
    const confirmBtn = this.query<HTMLButtonElement>('[data-action="confirm"]');
    const len = this.currentNote.length;
    const valid = len >= MIN_NOTE_LENGTH;
    if (countEl) {
      countEl.textContent = `${len} / ${MIN_NOTE_LENGTH} minimum`;
      countEl.className = valid ? 'char-count' : 'char-count char-count--invalid';
    }
    if (confirmBtn) {
      confirmBtn.disabled = !valid;
    }
  }

  protected renderTemplate(): string {
    if (!this.isOpen || !this.context) return '';
    const len = this.currentNote.length;
    const valid = len >= MIN_NOTE_LENGTH;
    const countClass = valid ? 'char-count' : 'char-count char-count--invalid';
    return html`
      <vis-modal data-id="note-modal">
        <div class="dialog">
          <p class="action-desc">${this.context.actionDescription}</p>
          <textarea class="note-textarea" data-field="note" placeholder="Enter a note (minimum ${MIN_NOTE_LENGTH} characters)..."></textarea>
          <div class="${countClass}" data-field="char-count">${len} / ${MIN_NOTE_LENGTH} minimum</div>
          <div class="actions">
            <button class="btn btn--cancel" data-action="cancel" type="button">Cancel</button>
            <button class="btn btn--confirm" data-action="confirm" type="button" ${valid ? '' : 'disabled'}>Confirm</button>
          </div>
        </div>
      </vis-modal>
    `;
  }
}

ComponentRegistry.register('mandatory-note-dialog', MandatoryNoteDialogElement);
export { MandatoryNoteDialogElement, MIN_NOTE_LENGTH };