import { describe, it, expect } from 'vitest';
import { Client } from '../../../core/entities/Client';

describe('Client entity', () => {
  it('constructs in active status by default', () => {
    const c = new Client('cl1', 'Acme Corp', 'contact@acme.com');
    expect(c.status).toBe('active');
    expect(c.id).toBe('cl1');
    expect(c.name).toBe('Acme Corp');
  });

  it('can be suspended and reactivated', () => {
    const c = new Client('cl1', 'Acme Corp', 'contact@acme.com');
    c.suspend();
    expect(c.status).toBe('suspended');
    c.reactivate();
    expect(c.status).toBe('active');
  });

  it('can be terminated', () => {
    const c = new Client('cl1', 'Acme Corp', 'contact@acme.com');
    c.terminate();
    expect(c.status).toBe('terminated');
  });

  it('cannot suspend a terminated client', () => {
    const c = new Client('cl1', 'Acme Corp', 'contact@acme.com');
    c.terminate();
    expect(() => c.suspend()).toThrow();
  });

  it('cannot reactivate a terminated client', () => {
    const c = new Client('cl1', 'Acme Corp', 'contact@acme.com');
    c.terminate();
    expect(() => c.reactivate()).toThrow();
  });
});