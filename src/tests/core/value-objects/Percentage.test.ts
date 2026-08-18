// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { Percentage } from '../../../core/value-objects/Percentage';
import { ValidationError } from '../../../core/errors/ValidationError';

describe('Percentage', () => {
  it('constructs with a valid value in default bounds [0, 100]', () => {
    const p = new Percentage(50);
    expect(p.getValue()).toBe(50);
  });

  it('accepts 0 and 100 (boundary values)', () => {
    expect(new Percentage(0).getValue()).toBe(0);
    expect(new Percentage(100).getValue()).toBe(100);
  });

  it('throws ValidationError for negative value', () => {
    expect(() => new Percentage(-1)).toThrow(ValidationError);
  });

  it('throws ValidationError for value > 100', () => {
    expect(() => new Percentage(101)).toThrow(ValidationError);
  });

  it('throws ValidationError for NaN', () => {
    expect(() => new Percentage(NaN)).toThrow(ValidationError);
  });

  it('supports custom bounds', () => {
    const p = new Percentage(150, 100, 200);
    expect(p.getValue()).toBe(150);
    expect(() => new Percentage(50, 100, 200)).toThrow(ValidationError);
  });

  it('equals compares value and bounds', () => {
    const a = new Percentage(50);
    const b = new Percentage(50);
    const c = new Percentage(50, 0, 200);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('toDisplayString formats with percent sign', () => {
    expect(new Percentage(42).toDisplayString()).toBe('42%');
  });
});