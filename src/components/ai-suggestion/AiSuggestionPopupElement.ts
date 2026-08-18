/**
 * AiSuggestionPopupElement.ts — components/ai-suggestion/
 *
 * Purpose:
 *   Platform-wide AI suggestion popup. Triggers at natural checkpoints
 *   (form-step completion, page load with existing data, or an explicit
 *   "Ask AI" affordance) — NOT on every keystroke.
 *
 * Checkpoint-trigger mechanism:
 *   This component does NOT poll or watch arbitrary page state. Instead,
 *   the calling page dispatches a 'suggestion-checkpoint' CustomEvent
 *   with { source, entityType, clientId } detail. This component listens
 *   for that event, fetches a suggestion from SuggestionService, and
 *   renders the popup. This keeps the component decoupled and reusable
 *   across all 50+ pages — a page only needs to dispatch one event.
 *
 * Actions:
 *   - Accept: emits 'suggestion-accepted' with { suggestionId } — this
 *     component NEVER calls a service directly (consistent with every
 *     other component in this codebase — ApprovalQueueElement, etc.).
 *     The parent page handles the event and calls SuggestionService.acceptSuggestion().
 *   - Reject: dismisses the popup, emits 'suggestion-rejected'.
 *   - "Ask a question first": opens a chat thread tied to that specific
 *     suggestion. The chat thread's context is strictly scoped to the
 *     entity/client it concerns (enforced by SuggestionService).
 *
 * Composition:
 *   Composes ModalElement for the overlay/focus-trap, consistent with
 *   the Part 14 refactor of MandatoryNoteDialogElement.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString, escapeHtml } from '../../platform/rendering/SafeHtml';
import { suggestionService } from '../../services';
import type { Suggestion, ChatMessage } from '../../services/SuggestionService';
import '../modal/ModalElement';

const STYLES = `
  :host { display: contents; }
  .suggestion-card { max-width: 480px; width: 90%; }
  .suggestion-header {
    display: flex; align-items: center; gap: var(--space-2);
    margin-bottom: var(--space-3);
  }
  .ai-icon {
    width: 32px; height: 32px; border-radius: var(--radius-full);
    background: var(--color-primary); color: var(--color-primary-foreground);
    display: flex; align-items: center; justify-content: center;
    font-size: var(--font-size-lg); font-weight: var(--font-weight-bold);
    flex-shrink: 0;
  }
  .suggestion-title {
    font-size: var(--font-size-base); font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary); margin: 0;
  }
  .suggestion-category {
    font-size: var(--font-size-xs); color: var(--color-text-muted);
    text-transform: uppercase; letter-spacing: 0.03em;
  }
  .suggestion-desc {
    font-size: var(--font-size-sm); color: var(--color-text-primary);
    line-height: 1.5; margin: 0 0 var(--space-3);
  }
  .confidence-bar {
    height: 4px; background: var(--color-surface-2); border-radius: var(--radius-full);
    margin-bottom: var(--space-3); overflow: hidden;
  }
  .confidence-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); }
  .actions { display: flex; gap: var(--space-2); justify-content: flex-end; }
  .btn {
    padding: var(--space-2) var(--space-4); border-radius: var(--radius-md);
    font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold);
    cursor: pointer; border: 1px solid transparent;
  }
  .btn--reject { background: var(--color-surface); color: var(--color-text-primary); border-color: var(--color-border); }
  .btn--accept { background: var(--color-primary); color: var(--color-primary-foreground); }
  .btn--chat { background: var(--color-bg); color: var(--color-primary); border-color: var(--color-primary); }
  .chat-thread { margin-top: var(--space-4); border-top: 1px solid var(--color-border); padding-top: var(--space-3); }
  .chat-messages { max-height: 200px; overflow-y: auto; margin-bottom: var(--space-2); }
  .chat-msg { padding: var(--space-1) var(--space-2); margin-bottom: var(--space-1); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
  .chat-msg--user { background: var(--color-surface-2); text-align: right; }
  .chat-msg--assistant { background: var(--color-surface); }
  .chat-input-row { display: flex; gap: var(--space-2); }
  .chat-input {
    flex: 1; padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border);
    border-radius: var(--radius-md); font-size: var(--font-size-sm); font-family: var(--font-body);
  }
  .chat-send { padding: var(--space-2) var(--space-3); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); }
`;

interface ModalHost extends HTMLElement {
  open(): void;
  close(): void;
  setBackdropCloseEnabled(value: boolean): void;
}

class AiSuggestionPopupElement extends BaseComponent {
  private suggestion: Suggestion | null = null;
  private isChatOpen = false;
  private chatMessages: ChatMessage[] = [];
  private chatInput = '';
  private isLoading = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('input', this.handleInput);
    // Listen for checkpoint events dispatched by pages
    document.addEventListener('suggestion-checkpoint', this.handleCheckpoint as EventListener);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('input', this.handleInput);
    document.removeEventListener('suggestion-checkpoint', this.handleCheckpoint as EventListener);
  }

  private handleCheckpoint = async (event: Event): Promise<void> => {
    const ce = event as CustomEvent<{ source: string; entityType: string; clientId: string }>;
    if (!ce.detail) return;
    this.isLoading = true;
    this.suggestion = null;
    this.isChatOpen = false;
    this.chatMessages = [];
    this.openModal();
    this.rerender();
    try {
      this.suggestion = await suggestionService.getCheckpointSuggestion({
        source: ce.detail.source,
        entityType: ce.detail.entityType,
        clientId: ce.detail.clientId,
      });
    } catch {
      this.suggestion = null;
    }
    this.isLoading = false;
    if (!this.suggestion) {
      this.closeModal();
      return;
    }
    this.rerender();
  };

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.getAttribute('data-field') === 'chat-input') {
      this.chatInput = (target as HTMLInputElement).value;
    }
  };

  private handleClick = async (event: Event): Promise<void> => {
    const target = event.target as HTMLElement;
    const actionEl = target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.getAttribute('data-action');

    if (action === 'accept' && this.suggestion) {
      this.emit('suggestion-accepted', { suggestionId: this.suggestion.id });
      this.closeModal();
    } else if (action === 'reject') {
      if (this.suggestion) {
        this.emit('suggestion-rejected', { suggestionId: this.suggestion.id });
      }
      this.closeModal();
    } else if (action === 'open-chat' && this.suggestion) {
      this.isChatOpen = true;
      this.rerender();
      try {
        const thread = await suggestionService.getChatThread(this.suggestion.id);
        if (thread) {
          this.chatMessages = thread.messages;
        }
      } catch {
        this.chatMessages = [];
      }
      this.rerender();
    } else if (action === 'send-chat' && this.suggestion) {
      const msg = this.chatInput.trim();
      if (!msg) return;
      this.chatInput = '';
      this.rerender();
      try {
        const response = await suggestionService.sendChatMessage(this.suggestion.id, msg);
        this.chatMessages = [...this.chatMessages, response];
        this.rerender();
      } catch {
        // Silently fail — chat is non-critical
      }
    }
  };

  private openModal(): void {
    const modal = this.shadow.querySelector<ModalHost>('vis-modal[data-id="suggestion-modal"]');
    if (modal) {
      modal.setBackdropCloseEnabled(false);
      modal.open();
    }
  }

  private closeModal(): void {
    const modal = this.shadow.querySelector<ModalHost>('vis-modal[data-id="suggestion-modal"]');
    if (modal) {
      modal.close();
    }
    this.suggestion = null;
    this.isChatOpen = false;
    this.chatMessages = [];
    this.chatInput = '';
    this.isLoading = false;
    this.rerender();
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return html`
        <vis-modal data-id="suggestion-modal">
          <div class="suggestion-card">
            <p style="color: var(--color-text-muted); font-size: var(--font-size-sm);">Analyzing your data...</p>
          </div>
        </vis-modal>
      `;
    }
    if (!this.suggestion) return '';

    const s = this.suggestion;
    const confidencePct = Math.round(s.confidence * 100);

    const chatHtml = this.isChatOpen
      ? html`
          <div class="chat-thread">
            <div class="chat-messages">
              ${SafeHtmlString.trusted(
                this.chatMessages
                  .map(
                    (m) =>
                      `<div class="chat-msg chat-msg--${m.role}">${escapeHtml(m.content)}</div>`,
                  )
                  .join(''),
              )}
            </div>
            <div class="chat-input-row">
              <input class="chat-input" data-field="chat-input" type="text" placeholder="Ask a question..." value="${this.chatInput}" />
              <button class="chat-send" data-action="send-chat" type="button">Send</button>
            </div>
          </div>
        `
      : '';

    return html`
      <vis-modal data-id="suggestion-modal">
        <div class="suggestion-card">
          <div class="suggestion-header">
            <div class="ai-icon" aria-hidden="true">AI</div>
            <div>
              <p class="suggestion-title">${s.title}</p>
              <span class="suggestion-category">${s.category}</span>
            </div>
          </div>
          <p class="suggestion-desc">${s.description}</p>
          <div class="confidence-bar" role="progressbar" aria-valuenow="${confidencePct}" aria-valuemin="0" aria-valuemax="100" aria-label="AI confidence">
            <div class="confidence-fill" style="width: ${confidencePct}%"></div>
          </div>
          ${SafeHtmlString.trusted(chatHtml)}
          <div class="actions">
            ${this.isChatOpen ? '' : '<button class="btn btn--chat" data-action="open-chat" type="button">Ask a question first</button>'}
            <button class="btn btn--reject" data-action="reject" type="button">Reject</button>
            <button class="btn btn--accept" data-action="accept" type="button" ${s.actionable ? '' : 'disabled'}>Accept</button>
          </div>
        </div>
      </vis-modal>
    `;
  }
}

ComponentRegistry.register('ai-suggestion-popup', AiSuggestionPopupElement);
export { AiSuggestionPopupElement };