/**
 * TemplateEngine.test.ts — unit tests for platform/rendering/TemplateEngine.ts.
 */
import { describe, it, expect } from 'vitest';
import { TemplateEngine } from '../../../platform/rendering/TemplateEngine';

describe('TemplateEngine', () => {
  it('update() replaces the container content', () => {
    const el = document.createElement('div');
    const engine = new TemplateEngine(el, () => '<p>hello</p>');
    engine.update();
    expect(el.innerHTML).toBe('<p>hello</p>');
  });

  it('updateIfChanged() skips re-render when dependencies are unchanged', () => {
    const el = document.createElement('div');
    let calls = 0;
    const engine = new TemplateEngine(el, () => {
      calls++;
      return '<p>x</p>';
    });
    engine.updateIfChanged([1, 2]);
    engine.updateIfChanged([1, 2]);
    expect(calls).toBe(1);
  });

  it('updateIfChanged() re-renders when dependencies change', () => {
    const el = document.createElement('div');
    let calls = 0;
    const engine = new TemplateEngine(el, () => {
      calls++;
      return '<p>x</p>';
    });
    engine.updateIfChanged([1]);
    engine.updateIfChanged([2]);
    expect(calls).toBe(2);
  });

  it('updateIfChanged() re-renders when dependency length changes', () => {
    const el = document.createElement('div');
    let calls = 0;
    const engine = new TemplateEngine(el, () => {
      calls++;
      return '<p>x</p>';
    });
    engine.updateIfChanged([1]);
    engine.updateIfChanged([1, 2]);
    expect(calls).toBe(2);
  });
});