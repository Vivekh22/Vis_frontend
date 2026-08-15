/**
 * RichTextFieldElement.ts — components/rich-text-field/
 *
 * A minimal rich text editor using contenteditable with a tightly
 * restricted, sanitized set of allowed formatting.
 *
 * SECURITY MODEL:
 *   1. PASTE SANITIZATION: On paste, the clipboard HTML is sanitized through
 *      InputSanitizer.sanitizeRichText() before insertion. A malicious
 *      <script> tag in pasted content is neutralized.
 *   2. OUTPUT SANITIZATION: getValue() returns the innerHTML after passing
 *      it through InputSanitizer.sanitizeRichText() again. This double-
 *      sanitization ensures that even if a browser quirk allows unsafe
 *      content into the DOM, the stored value is always clean.
 *   3. NO RAW HTML PASTE-THROUGH: There is no code path that allows raw,
 *      unsanitized HTML to enter the field. All input (typing, paste) goes
 *      through the browser's contenteditable, and all output goes through
 *      the sanitizer.
 *
 * ALLOWED FORMATTING: bold, italic, underline, lists, links.
 * STRIPPED: script tags, event handlers (onclick, etc.), javascript: URLs,
 *   data: URLs, and any non-whitelisted tag/attribute.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html } from '../../platform/rendering/SafeHtml';
import { sanitizeRichText } from '../../platform/security/InputSanitizer';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .toolbar {
    display: flex; gap: var(--space-1); padding: var(--space-1) var(--space-2);
    border: 1px solid var(--color-border); border-bottom: none;
    border-radius: var(--radius-md) var(--radius-md) 0 0;
    background: var(--color-surface-2);
  }
  .toolbar-btn {
    padding: var(--space-1) var(--space-2); border: 1px solid var(--color-border);
    border-radius: var(--radius-sm); background: var(--color-bg); cursor: pointer;
    font-size: var(--font-size-sm); font-family: var(--font-body);
    color: var(--color-text-primary);
  }
  .toolbar-btn:hover { background: var(--color-surface); }
  .editor {
    min-height: 120px; padding: var(--space-3); border: 1px solid var(--color-border);
    border-radius: 0 0 var(--radius-md) var(--radius-md); outline: none;
    background: var(--color-bg); color: var(--color-text-primary);
    font-size: var(--font-size-sm); line-height: 1.6;
  }
  .editor:focus { border-color: var(--color-primary); }
  .editor:empty:before { content: attr(data-placeholder); color: var(--color-text-muted); }
`;

class RichTextFieldElement extends BaseComponent {
  private _placeholder = '';
  private _value = '';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set placeholder(value: string) {
    this._placeholder = value;
    this.rerender();
  }

  public get placeholder(): string {
    return this._placeholder;
  }

  /**
   * Returns the sanitized HTML content of the editor.
   * The output is always passed through InputSanitizer before return,
   * ensuring no malicious content can escape even if the browser's
   * contenteditable allowed unsafe DOM.
   */
  public getValue(): string {
    const editor = this.shadow.querySelector<HTMLElement>('.editor');
    if (!editor) return '';
    const raw = editor.innerHTML;
    return sanitizeRichText(raw);
  }

  public setValue(value: string): void {
    this._value = sanitizeRichText(value);
    const editor = this.shadow.querySelector<HTMLElement>('.editor');
    if (editor) editor.innerHTML = this._value;
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('paste', this.handlePaste as EventListener);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('paste', this.handlePaste as EventListener);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const btn = target.closest('[data-command]');
    if (!btn) return;
    const command = btn.getAttribute('data-command') ?? '';
    document.execCommand(command, false);
  };

  /**
   * PASTE SANITIZATION: Intercepts paste events, sanitizes the clipboard
   * HTML through InputSanitizer, and inserts only the safe HTML. A
   * malicious <script> tag in pasted content is neutralized here.
   */
  private handlePaste = (event: ClipboardEvent): void => {
    const editor = event.target as HTMLElement;
    if (!editor) return;
    event.preventDefault();
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;
    const htmlContent = clipboardData.getData('text/html');
    const textContent = clipboardData.getData('text/plain');
    if (htmlContent) {
      const sanitized = sanitizeRichText(htmlContent);
      document.execCommand('insertHTML', false, sanitized);
    } else if (textContent) {
      const sanitized = sanitizeRichText(textContent);
      document.execCommand('insertHTML', false, sanitized);
    }
  };

  protected renderTemplate(): string {
    return html`
      <div class="toolbar">
        <button class="toolbar-btn" data-command="bold" type="button"><b>B</b></button>
        <button class="toolbar-btn" data-command="italic" type="button"><i>I</i></button>
        <button class="toolbar-btn" data-command="underline" type="button"><u>U</u></button>
        <button class="toolbar-btn" data-command="insertUnorderedList" type="button">• List</button>
        <button class="toolbar-btn" data-command="insertOrderedList" type="button">1. List</button>
      </div>
      <div class="editor" contenteditable="true" data-placeholder="${this._placeholder}"></div>
    `;
  }
}

ComponentRegistry.register('rich-text-field', RichTextFieldElement);
export { RichTextFieldElement };