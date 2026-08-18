// @ts-nocheck
/**
 * TagInputElement.test.ts — tests for components/tag-input/TagInputElement.
 *
 * Tests multi-paste tag entry, individual tag removal, and tags-changed event.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TagInputElement } from '../../../components/tag-input/TagInputElement';
import '../../../components/tag-input/TagInputElement';

describe('TagInputElement', () => {
  let el: TagInputElement;

  beforeEach(() => {
    el = document.createElement('tag-input') as TagInputElement;
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (el.parentNode) document.body.removeChild(el);
  });

  it('renders with placeholder when empty', () => {
    const input = el.shadowRoot!.querySelector('.tag-input') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.placeholder).not.toBe('');
  });

  it('tags setter renders tag elements', () => {
    el.tags = ['com.app1', 'com.app2', 'com.app3'];
    const tags = el.shadowRoot!.querySelectorAll('.tag');
    expect(tags).toHaveLength(3);
  });

  it('tags getter returns current tags', () => {
    el.tags = ['a', 'b'];
    expect(el.tags).toEqual(['a', 'b']);
  });

  it('removes a tag when × button clicked', () => {
    el.tags = ['alpha', 'beta', 'gamma'];
    const removeBtn = el.shadowRoot!.querySelector('[data-tag-remove="1"]') as HTMLButtonElement;
    removeBtn.click();
    expect(el.tags).toEqual(['alpha', 'gamma']);
  });

  it('adds tags on Enter key', () => {
    const input = el.shadowRoot!.querySelector('.tag-input') as HTMLInputElement;
    input.value = 'new.tag';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(el.tags).toContain('new.tag');
  });

  it('adds multiple tags on paste (comma-separated)', () => {
    const input = el.shadowRoot!.querySelector('.tag-input') as HTMLInputElement;
    input.value = 'tag1,tag2,tag3';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(el.tags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('does not add duplicate tags', () => {
    el.tags = ['existing'];
    const input = el.shadowRoot!.querySelector('.tag-input') as HTMLInputElement;
    input.value = 'existing';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(el.tags).toEqual(['existing']);
  });

  it('removes last tag on Backspace when input is empty', () => {
    el.tags = ['one', 'two'];
    const input = el.shadowRoot!.querySelector('.tag-input') as HTMLInputElement;
    input.value = '';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    expect(el.tags).toEqual(['one']);
  });
});