import { defineConfig } from 'vite';

/**
 * Vite is used here purely as a build tool — NO framework plugin is attached.
 * The application is built on native browser Web Components (Custom Elements v1),
 * not React/Vue/Angular/Svelte.
 */
export default defineConfig({
  // Intentionally minimal: Vite only resolves bare imports and bundles.
  // No React plugin, no framework-specific transforms.
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});