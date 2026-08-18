// @ts-nocheck
/**
 * RichTextFieldElement.test.ts — tests/components/rich-text-field/
 *
 * Tests that a malicious <script> tag in pasted content is neutralized
 * by the InputSanitizer before it enters the field's DOM or stored value.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { sanitizeRichText } from '../../../security/InputSanitizer';

beforeAll(() => {
  // happy-dom's DOMParser executes <script> tags during parsing,
  // which calls alert(). Real browsers don't execute scripts from
  // DOMParser, so this mock is test-environment-only.
  global.alert = vi.fn();
  (global as unknown as { window: typeof global }).window = global;
});

describe('RichTextFieldElement / InputSanitizer', () => {
  it('strips <script> tags from pasted content', () => {
    const malicious = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
    const sanitized = sanitizeRichText(malicious);
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('alert');
    expect(sanitized).toContain('Hello');
    expect(sanitized).toContain('World');
  });

  it('strips event handlers (onclick, onerror) from elements', () => {
    const malicious = '<p onclick="alert(1)">Click me</p><img src="x" onerror="alert(1)" />';
    const sanitized = sanitizeRichText(malicious);
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).toContain('Click me');
  });

  it('strips javascript: URLs from href attributes', () => {
    const malicious = '<a href="javascript:alert(1)">Click</a>';
    const sanitized = sanitizeRichText(malicious);
    expect(sanitized).not.toContain('javascript:');
  });

  it('preserves safe formatting (bold, italic, lists, links)', () => {
    const safe = '<p><b>Bold</b> <i>italic</i> <u>underline</u></p><ul><li>Item 1</li></ul><a href="https://example.com">Link</a>';
    const sanitized = sanitizeRichText(safe);
    expect(sanitized).toContain('<b>Bold</b>');
    expect(sanitized).toContain('<i>italic</i>');
    expect(sanitized).toContain('<u>underline</u>');
    expect(sanitized).toContain('<ul><li>Item 1</li></ul>');
    expect(sanitized).toContain('href="https://example.com"');
  });

  it('strips data: URLs from href attributes', () => {
    const malicious = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
    const sanitized = sanitizeRichText(malicious);
    expect(sanitized).not.toContain('data:');
    expect(sanitized).not.toContain('<script');
  });

  it('preserves text content from non-whitelisted tags', () => {
    const content = '<div>Important text</div><span>More text</span>';
    const sanitized = sanitizeRichText(content);
    expect(sanitized).toContain('Important text');
    expect(sanitized).toContain('More text');
    expect(sanitized).not.toContain('<div');
    expect(sanitized).not.toContain('<span');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeRichText('')).toBe('');
    expect(sanitizeRichText(null as unknown as string)).toBe('');
  });
});