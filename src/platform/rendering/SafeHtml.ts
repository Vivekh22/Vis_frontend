/**
 * SafeHtml.ts — platform/rendering/
 *
 * Purpose:
 *   The single, audited chokepoint for ALL dynamic content rendering in the
 *   VispriscaAds frontend. No other file in the entire codebase is permitted
 *   to assign a variable string to element.innerHTML or call
 *   element.insertAdjacentHTML(...) with dynamic content. Every such assignment
 *   must flow through `render()` below, and every markup string passed to it
 *   must have been constructed via the `html` tagged template function.
 *
 * Structure:
 *   - escapeHtml:      explicit, library-free escaping of the 5 HTML-special chars.
 *   - SafeHtmlString:  the ONLY sanctioned "already-safe" marker.
 *   - html:            tagged template literal that auto-escapes interpolations
 *                      unless wrapped in SafeHtmlString.
 *   - render:          the single permitted innerHTML assignment in the codebase.
 *
 * Design decisions:
 *   - Escaping is implemented with a single regex + replacement map so its
 *     behaviour is fully transparent and auditable by reading this one
 *     function — no dependency on a third-party sanitiser whose audit surface
 *     is larger.
 *   - Mirrors JSX's "auto-escape by default, opt out explicitly" model: the
 *     default path is safe; bypassing it requires a deliberately-named
 *     `SafeHtmlString.trusted()` call that a security review can grep for.
 *   - `render()` is the deliberate, audited exception to the "no raw
 *     innerHTML" rule. Its safety depends ENTIRELY on upstream callers using
 *     the `html` tag correctly.
 */

/** Ordered map of the five HTML-special characters to their named entities. */
const HTML_ENTITY_MAP: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escaping regex: matches any one of the five dangerous characters. */
const HTML_ESCAPE_REGEX = /[&<>"']/g;

/**
 * Escapes the five HTML-special characters in a raw string.
 *
 * Implemented as a single regex replace against a fixed entity map so the
 * behaviour is fully transparent and auditable by reading this function alone
 * — no external sanitiser dependency.
 *
 * @param rawString - untrusted text to escape.
 * @returns the input with &, <, >, ", ' replaced by their entities.
 */
export function escapeHtml(rawString: string): string {
  return rawString.replace(HTML_ESCAPE_REGEX, (char) => HTML_ENTITY_MAP[char] ?? char);
}

/**
 * SafeHtmlString — the ONLY sanctioned way to mark a string as pre-approved
 * for raw insertion into markup WITHOUT being escaped.
 *
 * !!! SECURITY WARNING — READ BEFORE USING !!!
 *
 * SafeHtmlString.trusted() must NEVER be called with:
 *   - raw user input (form fields, URL params, search queries),
 *   - raw API response data,
 *   - any string that has not itself already passed through escapeHtml or
 *     the `html` tagged template function.
 *
 * This is the single point in the entire codebase where a mistake would
 * reintroduce an XSS vulnerability. The escaping in `html` is bypassed for
 * SafeHtmlString values by design, so a string wrapped here is inserted
 * verbatim into the DOM.
 *
 * Correct usage (composing already-built markup without double-escaping):
 *   const partial = SafeHtmlString.trusted(html`<b>hi</b>`);
 *   const outer  = html`<div>${partial}</div>`;   // <b> not re-escaped
 *
 * Incorrect usage (XSS):
 *   const evil = SafeHtmlString.trusted(userInput);  // NEVER do this
 */
export class SafeHtmlString {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Creates a SafeHtmlString whose contents will be inserted verbatim.
   * See the class-level security warning before calling this.
   */
  public static trusted(value: string): SafeHtmlString {
    return new SafeHtmlString(value);
  }

  /** Returns the raw trusted string. Used internally by the `html` tag only. */
  public toString(): string {
    return this.value;
  }
}

/**
 * `html` — the tagged template literal used throughout the codebase to build
 * markup strings safely.
 *
 * Every interpolated value is automatically escaped via escapeHtml UNLESS it is
 * an instance of SafeHtmlString (in which case its raw contents are used
 * verbatim, because it has already been verified safe). This mirrors JSX:
 * auto-escape by default, opt out explicitly.
 *
 * @example
 *   const name = '<script>alert(1)</script>';
 *   const markup = html`<p>Hello ${name}</p>`;
 *   // → "<p>Hello &lt;script&gt;alert(1)&lt;/script&gt;</p>"
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      const value = values[i];
      if (value instanceof SafeHtmlString) {
        result += value.toString();
      } else if (value === null || value === undefined) {
        // Render null/undefined as empty — never the literal string "null".
        continue;
      } else {
        result += escapeHtml(String(value));
      }
    }
  }
  return result;
}

/**
 * render — the ONLY location in the entire codebase where a raw innerHTML
 * assignment is permitted.
 *
 * This is the deliberate, audited exception to the "no raw innerHTML" rule.
 * Its safety depends ENTIRELY on every caller having used the `html` tagged
 * template function (and, where composition is needed, SafeHtmlString)
 * correctly upstream. Do not pass user-supplied or API-supplied strings here
 * unless they were built through `html`.
 *
 * @param container - the element (or ShadowRoot) to render into.
 * @param markup    - a markup string built via the `html` tag.
 */
export function render(container: Element | ShadowRoot, markup: string): void {
  container.innerHTML = markup;
}