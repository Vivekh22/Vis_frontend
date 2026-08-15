/**
 * ShadowRenderMixin.ts — platform/component/
 *
 * Purpose:
 *   Style injection for Shadow DOM. Shadow Roots do not inherit page-level CSS
 *   rules (deliberate browser isolation), so each component needs a way to
 *   receive its own styles AND the app's design tokens (CSS custom properties).
 *
 * Two functions:
 *   - injectStyles:       injects component-specific CSS text.
 *   - injectGlobalTokens: injects the app's CSS custom properties (design
 *                         tokens + theme variables) so components can read
 *                         var(--color-primary) etc.
 *
 * Design note — why textContent, not SafeHtml:
 *   injectStyles uses element.textContent (NOT innerHTML) deliberately. CSS
 *   text content does not carry the same XSS risk as HTML content, and this
 *   function only ever accepts CSS authored by the developer at build time
 *   (component .styles.ts files) — never CSS that includes dynamic, external,
 *   or user-provided data. This is the documented, justified exception to the
 *   "everything through SafeHtml.ts" rule.
 *
 * Design note — CSS custom properties inherit through Shadow DOM:
 *   Unlike regular CSS rules, CSS custom properties (variables) DO inherit
 *   through Shadow DOM boundaries by design. This is the mechanism that lets a
 *   theme switch update every Shadow-isolated component instantly: the theme
 *   sets variables at the document root, and every component's Shadow DOM reads
 *   them via var(...). injectGlobalTokens duplicates the token definitions into
 *   the Shadow Root as a fallback so tokens resolve even if the root variables
 *   are not yet set, but the live theme still works because the root values
 *   cascade in.
 */
import { TOKEN_CSS_TEXT } from '../../styles/tokens';
import { THEME_VARIABLE_CSS_TEXT } from '../../styles/theme';

/**
 * Injects a <style> element with the given CSS text into a ShadowRoot.
 *
 * Only accepts build-time-authored CSS — never dynamic / external / user CSS.
 */
export function injectStyles(shadow: ShadowRoot, cssText: string): void {
  const style = document.createElement('style');
  style.textContent = cssText;
  shadow.appendChild(style);
}

/**
 * Injects the app's CSS custom properties (design tokens + current theme
 * variables) into a ShadowRoot so the component can read var(--color-primary)
 * and all other tokens.
 *
 * CSS custom properties inherit through Shadow DOM boundaries by design, so in
 * most cases the :root definitions already cascade in. This injection
 * guarantees resolution even before the root is set, and keeps each component
 * self-contained.
 */
export function injectGlobalTokens(shadow: ShadowRoot): void {
  const style = document.createElement('style');
  style.textContent = TOKEN_CSS_TEXT + '\n' + THEME_VARIABLE_CSS_TEXT;
  shadow.appendChild(style);
}