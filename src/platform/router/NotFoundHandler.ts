/**
 * NotFoundHandler.ts — platform/router/
 *
 * Purpose:
 *   Renders a simple, token-styled "page not found" view. Deliberately simple,
 *   but consistent with the premium UI requirement — it uses design tokens
 *   (var(--color-...), var(--space-...)) rather than a bare unstyled error, so
 *   it matches the rest of the app's visual identity.
 *
 *   Markup is built via the `html` tagged template function — no raw innerHTML
 *   anywhere. The <style> block is scoped to .nf-* classes.
 */
import { html, render } from '../rendering/SafeHtml';

export function renderNotFound(container: Element): void {
  const markup = html`
    <style>
      .nf-root {
        min-height: 60vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-4, 1rem);
        padding: var(--space-8, 2rem);
        font-family: var(--font-body, system-ui, sans-serif);
        color: var(--color-text-primary, #0f172a);
        text-align: center;
      }
      .nf-code {
        font-size: var(--font-size-display, 3rem);
        font-weight: var(--font-weight-bold, 700);
        color: var(--color-primary, #4f46e5);
        letter-spacing: -0.02em;
        line-height: var(--line-height-tight, 1.2);
      }
      .nf-title {
        font-size: var(--font-size-xl, 1.25rem);
        font-weight: var(--font-weight-semibold, 600);
      }
      .nf-text {
        color: var(--color-text-muted, #64748b);
        max-width: 32rem;
      }
      .nf-link {
        color: var(--color-primary, #4f46e5);
        text-decoration: underline;
        cursor: pointer;
        font-weight: var(--font-weight-medium, 500);
      }
    </style>
    <div class="nf-root">
      <div class="nf-code">404</div>
      <div class="nf-title">Page not found</div>
      <div class="nf-text">The page you're looking for doesn't exist or has moved.</div>
      <a class="nf-link" href="/" data-router-link>Back to home</a>
    </div>
  `;
  render(container, markup);
}