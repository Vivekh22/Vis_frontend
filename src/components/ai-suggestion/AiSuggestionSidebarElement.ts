/**
 * AiSuggestionSidebarElement.ts — components/ai-suggestion/
 *
 * Purpose:
 *   An inline sidebar displaying AI suggestions as a timeline, mimicking continuous
 *   behavior-based insights. Replaces the modal-based AiSuggestionPopupElement for
 *   the dashboard.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString, escapeHtml } from '../../platform/rendering/SafeHtml';
import { suggestionService } from '../../services';
import type { Suggestion, ChatMessage } from '../../services/SuggestionService';

const STYLES = `
  :host { 
    display: block; 
    height: 100%;
    font-family: 'Inter', system-ui, sans-serif;
  }
  .sidebar {
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 16px;
    padding: var(--space-5);
    height: 100%;
    box-shadow: 0 8px 30px rgba(0,0,0,0.03);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-5);
    border-bottom: 1px solid rgba(0,0,0,0.05);
    padding-bottom: var(--space-3);
  }
  .sidebar-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .close-btn {
    background: transparent;
    border: none;
    font-size: 1.2rem;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 0;
    transition: color 0.2s;
  }
  .close-btn:hover {
    color: var(--color-danger);
  }
  .timeline {
    position: relative;
    padding-left: var(--space-6);
    margin-top: var(--space-4);
  }
  .timeline::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: rgba(168, 85, 247, 0.2);
  }
  .timeline-item {
    position: relative;
    margin-bottom: var(--space-6);
  }
  .timeline-icon {
    position: absolute;
    left: calc(var(--space-6) * -1);
    top: 0;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    background: linear-gradient(135deg, var(--color-primary) 0%, #a855f7 100%);
    color: var(--color-primary-foreground);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    box-shadow: 0 4px 10px rgba(168, 85, 247, 0.2);
    z-index: 1;
  }
  .timeline-content {
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    padding: var(--space-3) var(--space-4);
    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  }
  .suggestion-title {
    font-size: var(--font-size-sm);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-1);
  }
  .suggestion-date {
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
    margin: 0 0 var(--space-2);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .suggestion-desc {
    font-size: var(--font-size-xs);
    color: var(--color-text-primary);
    line-height: 1.5;
    margin: 0 0 var(--space-3);
  }
  .actions {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }
  .btn {
    padding: var(--space-1) var(--space-2);
    border-radius: 6px;
    font-size: var(--font-size-xs);
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
  }
  .btn--accept {
    background: var(--color-primary);
    color: var(--color-primary-foreground);
  }
  .btn--chat {
    background: transparent;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
  }
  .chat-thread {
    margin-top: var(--space-3);
    border-top: 1px solid rgba(0,0,0,0.05);
    padding-top: var(--space-2);
  }
  .chat-messages {
    max-height: 150px;
    overflow-y: auto;
    margin-bottom: var(--space-2);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .chat-msg {
    padding: 6px 10px;
    border-radius: 8px;
    font-size: var(--font-size-xs);
    max-width: 90%;
  }
  .chat-msg--user {
    background: var(--color-primary);
    color: #fff;
    align-self: flex-end;
    border-bottom-right-radius: 0;
  }
  .chat-msg--assistant {
    background: var(--color-surface-2);
    color: var(--color-text-primary);
    align-self: flex-start;
    border-bottom-left-radius: 0;
  }
  .chat-input-row {
    display: flex;
    gap: var(--space-2);
  }
  .chat-input {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: var(--font-size-xs);
    background: rgba(255, 255, 255, 0.8);
  }
  .chat-send {
    padding: 6px 12px;
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: var(--font-size-xs);
    font-weight: 600;
  }

`;

class AiSuggestionSidebarElement extends BaseComponent {
  private suggestion: Suggestion | null = null;
  private isChatOpen = false;
  private chatMessages: ChatMessage[] = [];
  private chatInput = '';
  private isLoading = true;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('input', this.handleInput);
    document.addEventListener('suggestion-checkpoint', this.handleCheckpoint as EventListener);
    
    // Simulate initial loading if no checkpoint is fired immediately
    setTimeout(() => {
      if (this.isLoading && !this.suggestion) {
        this.isLoading = false;
        this.rerender();
      }
    }, 2000);
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

    if (action === 'close-sidebar') {
      this.emit('sidebar-closed', {});
    } else if (action === 'accept' && this.suggestion) {
      this.emit('suggestion-accepted', { suggestionId: this.suggestion.id });
      this.suggestion = null; // Clear suggestion after accepting
      this.rerender();
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
        // Silently fail
      }
    }
  };

  protected renderTemplate(): string {
    return html`
      <div class="sidebar">
        <div class="sidebar-header">
          <p class="sidebar-title">✨ Latest AI Insights</p>
          <button class="close-btn" data-action="close-sidebar" type="button" aria-label="Close sidebar">×</button>
        </div>
        
        <div class="timeline">
          ${this.isLoading 
            ? SafeHtmlString.trusted('<p style="font-size: var(--font-size-sm); color: var(--color-text-muted);">Analyzing real-time data...</p>')
            : !this.suggestion 
              ? SafeHtmlString.trusted('<p style="font-size: var(--font-size-sm); color: var(--color-text-muted);">No new insights at this time.</p>')
              : SafeHtmlString.trusted(this.renderSuggestion(this.suggestion))
          }
        </div>
      </div>
    `;
  }
  
  private renderSuggestion(s: Suggestion): string {
    const chatHtml = this.isChatOpen
      ? html`
          <div class="chat-thread">
            <div class="chat-messages">
              ${SafeHtmlString.trusted(
                this.chatMessages
                  .map((m) => `<div class="chat-msg chat-msg--${m.role}">${escapeHtml(m.content)}</div>`)
                  .join(''),
              )}
            </div>
            <div class="chat-input-row">
              <input class="chat-input" data-field="chat-input" type="text" placeholder="Ask AI..." value="${this.chatInput}" />
              <button class="chat-send" data-action="send-chat" type="button">Send</button>
            </div>
          </div>
        `
      : '';

    return html`
      <div class="timeline-item">
        <div class="timeline-icon">AI</div>
        <div class="timeline-content">
          <p class="suggestion-title">${s.title}</p>
          <p class="suggestion-date">JUST NOW</p>
          <p class="suggestion-desc">${s.description}</p>
          
          <div class="actions">
            ${this.isChatOpen ? '' : SafeHtmlString.trusted('<button class="btn btn--chat" data-action="open-chat" type="button">Ask Question</button>')}
            <button class="btn btn--accept" data-action="accept" type="button" ${s.actionable ? '' : 'disabled'}>Accept Optimization</button>
          </div>
          ${SafeHtmlString.trusted(chatHtml)}
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('ai-suggestion-sidebar', AiSuggestionSidebarElement);
export { AiSuggestionSidebarElement };
