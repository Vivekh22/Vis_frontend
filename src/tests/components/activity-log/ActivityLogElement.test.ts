import { describe, it, expect } from 'vitest';
import type { ActivityLogElement, ActivityLogEntry } from '../../../components/activity-log/ActivityLogElement';
import '../../../components/activity-log/ActivityLogElement';

const entries: ActivityLogEntry[] = [
  { timestamp: new Date('2026-01-01'), actor: 'Alice', actorRole: 'admin', client: 'Acme', module: 'campaigns', action: 'create', details: 'Created campaign X' },
  { timestamp: new Date('2026-01-02'), actor: 'Bob', actorRole: 'super-admin', client: null, module: 'users', action: 'invite', details: null },
];

describe('ActivityLogElement', () => {
  it('renders a table row per entry with correct content', () => {
    const el = document.createElement('activity-log') as ActivityLogElement;
    document.body.appendChild(el);
    el.entries = entries;
    const rows = el.shadowRoot!.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(el.shadowRoot!.textContent).toContain('Alice');
    expect(el.shadowRoot!.textContent).toContain('Bob');
    document.body.removeChild(el);
  });

  it('Client column is present when at least one entry has a client value', () => {
    const el = document.createElement('activity-log') as ActivityLogElement;
    document.body.appendChild(el);
    el.entries = entries;
    const headers = el.shadowRoot!.querySelectorAll('thead th');
    const headerTexts = Array.from(headers).map((h) => h.textContent);
    expect(headerTexts).toContain('Client');
    document.body.removeChild(el);
  });

  it('Client column is absent when no entries have a client value', () => {
    const el = document.createElement('activity-log') as ActivityLogElement;
    document.body.appendChild(el);
    el.entries = entries.map((e) => ({ ...e, client: null }));
    const headers = el.shadowRoot!.querySelectorAll('thead th');
    const headerTexts = Array.from(headers).map((h) => h.textContent);
    expect(headerTexts).not.toContain('Client');
    document.body.removeChild(el);
  });

  it('empty state renders when entries is empty', () => {
    const el = document.createElement('activity-log') as ActivityLogElement;
    document.body.appendChild(el);
    el.entries = [];
    expect(el.shadowRoot!.textContent).toContain('No activity to show');
    document.body.removeChild(el);
  });

  it('emptyStateMessage override works', () => {
    const el = document.createElement('activity-log') as ActivityLogElement;
    document.body.appendChild(el);
    el.emptyStateMessage = 'No history available';
    el.entries = [];
    expect(el.shadowRoot!.textContent).toContain('No history available');
    document.body.removeChild(el);
  });

  it('changing a filter emits filters-changed without filtering entries internally', () => {
    const el = document.createElement('activity-log') as ActivityLogElement;
    document.body.appendChild(el);
    el.entries = entries;
    // Enable filters
    (el as unknown as { showFilters: boolean }).showFilters = true;
    let filterPayload: unknown = null;
    el.addEventListener('filters-changed', (e) => { filterPayload = (e as CustomEvent).detail; });
    const input = el.shadowRoot!.querySelector('[data-filter="actor"]') as HTMLInputElement;
    input.value = 'Alice';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(filterPayload).toEqual({ actor: 'Alice' });
    // Rows should be unchanged — component didn't filter
    const rows = el.shadowRoot!.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    document.body.removeChild(el);
  });
});