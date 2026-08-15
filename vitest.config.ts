import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration. Tests run in a happy-dom environment, which provides
 * the Custom Elements registry, Shadow DOM, and lifecycle callbacks needed to
 * test Web Components without a real browser. happy-dom is a well-established,
 * small-footprint DOM implementation — preferred over heavier alternatives.
 */
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['src/**/*.test.ts'],
  },
});