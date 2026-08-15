/**
 * InputSanitizer.ts — platform/security/
 *
 * A minimal, auditable HTML sanitizer for user-provided rich text content.
 *
 * Unlike SafeHtml.escapeHtml (which escapes ALL HTML), this sanitizer allows
 * a tightly restricted set of formatting tags while stripping everything
 * dangerous: script tags, event handlers (onclick, onerror, etc.), javascript:
 * URLs, data: URLs, and any tag/attribute not on the whitelist.
 *
 * Used by RichTextFieldElement to sanitize contenteditable output before it
 * is stored or rendered. This is the second layer of defense after the
 * contenteditable's own paste-event sanitization.
 *
 * ALLOWED TAGS (whitelist):
 *   b, strong, i, em, u, ul, ol, li, p, br, a
 *
 * ALLOWED ATTRIBUTES (whitelist):
 *   a[href] (only http/https/mailto)
 *
 * EVERYTHING ELSE IS STRIPPED. The element's text content is preserved, but
 * the tag itself is removed — child nodes are kept.
 */

const ALLOWED_TAGS = new Set([
  'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'p', 'br', 'a',
]);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href']),
};

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

/**
 * Sanitizes an HTML string, returning a safe HTML string with only
 * whitelisted tags and attributes. All script tags, event handlers,
 * javascript: URLs, and non-whitelisted tags are stripped.
 *
 * @param dirtyHtml - untrusted HTML string from contenteditable or paste.
 * @returns safe HTML string with only whitelisted formatting.
 */
export function sanitizeRichText(dirtyHtml: string): string {
  if (typeof dirtyHtml !== 'string' || dirtyHtml.length === 0) return '';

  // Pre-strip <script> tags with a regex BEFORE DOM parsing to prevent
  // any script execution during parseFromString (happy-dom executes
  // inline scripts during parsing; real browsers don't, but this is
  // defense-in-depth regardless).
  const scriptStripped = dirtyHtml.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    '',
  );

  const parser = new DOMParser();
  const doc = parser.parseFromString(scriptStripped, 'text/html');
  const body = doc.body;

  const sanitized = sanitizeNode(body);
  return sanitized.innerHTML;
}

function sanitizeNode(node: Element): Element {
  const children = Array.from(node.childNodes);

  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) {
      continue;
    }
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();

      if (!ALLOWED_TAGS.has(tag)) {
        // Non-whitelisted tag: replace with its children (preserve text content)
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
          }
          parent.removeChild(el);
        }
        continue;
      }

      // Strip all non-whitelisted attributes
      const allowedAttrs = ALLOWED_ATTRIBUTES[tag] ?? new Set<string>();
      const attrsToRemove: Attr[] = [];
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        if (!attr) continue;
        if (!allowedAttrs.has(attr.name.toLowerCase())) {
          attrsToRemove.push(attr);
        } else if (attr.name.toLowerCase() === 'href') {
          // Validate URL protocol — block javascript: and data: URLs
          const href = attr.value.trim().toLowerCase();
          try {
            const url = new URL(el.getAttribute('href') ?? '');
            if (!SAFE_URL_PROTOCOLS.has(url.protocol)) {
              attrsToRemove.push(attr);
            }
          } catch {
            // If it's not a valid URL, check if it's a relative URL (no protocol)
            if (!href.startsWith('/') && !href.startsWith('#') && !href.startsWith('mailto:')) {
              attrsToRemove.push(attr);
            }
          }
        }
      }
      attrsToRemove.forEach((attr) => el.removeAttribute(attr.name));

      // Recursively sanitize children
      sanitizeNode(el);
    } else {
      // Remove comments, processing instructions, etc.
      const parent = child.parentNode;
      if (parent) parent.removeChild(child);
    }
  }

  return node;
}