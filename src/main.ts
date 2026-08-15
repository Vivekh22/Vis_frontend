/**
 * main.ts — application entry point.
 *
 * Purpose:
 *   Boots the VispriscaAds SPA. For Part 1 (platform/ core), this wires the
 *   integration demo so the project is reviewable standalone. As later parts
 *   are built (components/, pages/, layouts/), this will be replaced by the
 *   real application bootstrap.
 *
 * Design note:
 *   The app mounts into the `#app-root` element declared in index.html. Theme
 *   and design tokens are initialised before any component renders so CSS custom
 *   properties resolve correctly on first paint.
 */
import { bootstrapIntegrationDemo } from './platform/integration-example';

const root = document.getElementById('app-root');
if (root instanceof HTMLElement) {
  bootstrapIntegrationDemo(root);
}