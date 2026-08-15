/**
 * TagInputElement.ts — components/tag-input/
 *
 * Reusable tag input supporting multi-paste. Users type or paste comma/
 * newline-separated values and they become individual tags. Each tag has
 * a remove button. Emits 'tags-changed' with the current string array.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .tag-input-container {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    padding: var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    min-height: 40px;
    background: var(--color-bg);
    align-items: center;
  }
  .tag {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    background: var(--color-surface-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    color: var(--color-text-primary);
  }
  .tag-remove {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    padding: 0;
    line-height: 1;
  }
  .tag-remove:hover { color: var(--color-danger); }
  .tag-input {
    flex: 1;
    min-width: 120px;
    border: none;
    outline: none;
    background: transparent;
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
    color: var(--color-text-primary);
  }
`;

class TagInputElement extends BaseComponent {
  private _tags: string[] = [];
  private _placeholder = 'Type or paste...';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set tags(value: string[]) {
    this._tags = [...value];
    this.rerender();
  }

  public get tags(): string[] {
    return [...this._tags];
  }

  public set placeholder(value: string) {
    this._placeholder = value;
    this.rerender();
  }

  protected onMount(): void {
    this.shadow.addEventListener('keydown', this.handleKeyDown);
    this.shadow.addEventListener('input', this.handleInput);
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('blur', this.handleBlur, true);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('keydown', this.handleKeyDown);
    this.shadow.removeEventListener('input', this.handleInput);
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('blur', this.handleBlur, true);
  }

  private addTagsFromInput(text: string): void {
    const newTags = text
      .split(/[,\n\r\t]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !this._tags.includes(t));
    if (newTags.length > 0) {
      this._tags.push(...newTags);
      this.emit('tags-changed', this._tags);
      this.rerender();
    }
  }

  private removeTag(index: number): void {
    this._tags.splice(index, 1);
    this.emit('tags-changed', this._tags);
    this.rerender();
  }

  private handleKeyDown = (event: Event): void => {
    const ke = event as KeyboardEvent;
    const input = event.target as HTMLInputElement;
    if (!input.classList.contains('tag-input')) return;

    if (ke.key === 'Enter' || ke.key === ',') {
      ke.preventDefault();
      this.addTagsFromInput(input.value);
      input.value = '';
    } else if (ke.key === 'Backspace' && input.value === '' && this._tags.length > 0) {
      this.removeTag(this._tags.length - 1);
    }
  };

  private handleInput = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    if (!input.classList.contains('tag-input')) return;
    // If the user pasted (multiple values), process immediately
    if (input.value.includes(',') || input.value.includes('\n')) {
      this.addTagsFromInput(input.value);
      input.value = '';
    }
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const removeBtn = target.closest('[data-tag-remove]');
    if (removeBtn) {
      const index = parseInt(removeBtn.getAttribute('data-tag-remove') ?? '-1', 10);
      if (index >= 0) this.removeTag(index);
    }
  };

  private handleBlur = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    if (!input.classList.contains('tag-input')) return;
    if (input.value.trim().length > 0) {
      this.addTagsFromInput(input.value);
      input.value = '';
    }
  };

  protected renderTemplate(): string {
    const tagsHtml = this._tags
      .map((tag, i) => `<span class="tag">${tag}<button class="tag-remove" data-tag-remove="${i}" type="button">×</button></span>`)
      .join('');
    return html`
      <div class="tag-input-container">
        ${SafeHtmlString.trusted(tagsHtml)}
        <input type="text" class="tag-input" placeholder="${this._tags.length === 0 ? this._placeholder : ''}">
      </div>
    `;
  }
}

ComponentRegistry.register('tag-input', TagInputElement);
export { TagInputElement };