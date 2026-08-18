/**
 * sidebarStyles.ts — layouts/
 *
 * Scoped black-and-white sidebar palette. CSS custom properties here are
 * defined ONLY on `.sidebar` and never touch global theme tokens from
 * styles/theme.ts. Topbar, main content, cards, charts, and buttons keep
 * the platform's premium purple/violet palette.
 */
export const SIDEBAR_STYLES = `
  .sidebar {
    --sidebar-bg: #ffffff;
    --sidebar-fg: #000000;
    --sidebar-fg-muted: #525252;
    --sidebar-border: #e5e5e5;
    --sidebar-hover-bg: #f5f5f5;
    --sidebar-active-bg: #000000;
    --sidebar-active-fg: #ffffff;
    --sidebar-divider: #e5e5e5;

    display: flex;
    flex-direction: column;
    padding: var(--space-4) 0;
    overflow-y: auto;
    flex-shrink: 0;
    background: var(--sidebar-bg);
    border-right: 1px solid var(--sidebar-border);
  }
  :host-context([data-theme="dark"]) .sidebar {
    --sidebar-bg: #000000;
    --sidebar-fg: #ffffff;
    --sidebar-fg-muted: #a3a3a3;
    --sidebar-border: #262626;
    --sidebar-hover-bg: #171717;
    --sidebar-active-bg: #ffffff;
    --sidebar-active-fg: #000000;
    --sidebar-divider: #262626;
  }
  .sidebar-logo {
    padding: 0 var(--space-4) var(--space-4);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--sidebar-fg);
    border-bottom: 1px solid var(--sidebar-divider);
    margin-bottom: var(--space-2);
  }
  .nav-group { margin-bottom: var(--space-3); }
  .nav-group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-1) var(--space-4);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--sidebar-fg-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
    transition: color 0.15s ease;
  }
  .nav-group-header:hover {
    color: var(--sidebar-fg);
  }
  .nav-chevron {
    width: 12px;
    height: 12px;
    fill: currentColor;
    transition: transform 0.2s ease;
  }
  .nav-chevron.expanded {
    transform: rotate(90deg);
  }
  .nav-children {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
  }
  .nav-children.expanded {
    max-height: 800px; /* large enough for all items */
  }
  .nav-item {
    display: block;
    padding: var(--space-2) var(--space-4);
    color: var(--sidebar-fg-muted);
    text-decoration: none;
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
  }
  .nav-item:hover {
    background: var(--sidebar-hover-bg);
    color: var(--sidebar-fg);
    border-radius: var(--radius-sm);
    margin: 0 var(--space-2);
    padding-left: calc(var(--space-4) - var(--space-2));
    padding-right: calc(var(--space-4) - var(--space-2));
  }
  .nav-item.active {
    background: var(--sidebar-active-bg);
    color: var(--sidebar-active-fg);
    border-radius: var(--radius-full);
    margin: 0 var(--space-2);
    padding-left: calc(var(--space-4) - var(--space-2));
    padding-right: calc(var(--space-4) - var(--space-2));
    box-shadow: var(--shadow-sm);
    font-weight: var(--font-weight-medium);
  }
  .nav-item.disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
  
  /* Child items (indented) */
  .nav-child-item {
    display: block;
    padding: var(--space-2) var(--space-4);
    padding-left: calc(var(--space-4) + var(--space-4));
    color: var(--sidebar-fg-muted);
    text-decoration: none;
    font-size: var(--font-size-xs);
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
  }
  .nav-child-item:hover {
    background: var(--sidebar-hover-bg);
    color: var(--sidebar-fg);
    border-radius: var(--radius-sm);
    margin: 0 var(--space-2);
    padding-left: calc(var(--space-4) + var(--space-4) - var(--space-2));
    padding-right: calc(var(--space-4) - var(--space-2));
  }
  .nav-child-item.active {
    background: var(--sidebar-active-bg);
    color: var(--sidebar-active-fg);
    border-radius: var(--radius-full);
    margin: 0 var(--space-2);
    padding-left: calc(var(--space-4) + var(--space-4) - var(--space-2));
    padding-right: calc(var(--space-4) - var(--space-2));
    box-shadow: var(--shadow-sm);
    font-weight: var(--font-weight-medium);
  }
  .nav-child-item.disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
`;
