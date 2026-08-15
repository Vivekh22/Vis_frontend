import { describe, it, expect } from 'vitest';
import type { DataTableElement, ColumnDefinition } from '../../../components/data-table/DataTableElement';
import '../../../components/data-table/DataTableElement';

interface TestRow { name: string; age: number; }

describe('DataTableElement', () => {
  const columns: ColumnDefinition[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'age', label: 'Age', sortable: false },
  ];
  const rows: TestRow[] = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
  ];

  it('renders correct column headers and row cells', () => {
    const el = document.createElement('data-table') as DataTableElement;
    document.body.appendChild(el);
    el.columns = columns;
    el.rows = rows as unknown as Record<string, unknown>[];
    const headers = el.shadowRoot!.querySelectorAll('thead th');
    expect(headers.length).toBe(2);
    expect(headers[0]!.textContent).toContain('Name');
    const bodyCells = el.shadowRoot!.querySelectorAll('tbody td');
    expect(bodyCells.length).toBe(4);
    expect(bodyCells[0]!.textContent).toBe('Alice');
    document.body.removeChild(el);
  });

  it('renders custom cell render function output', () => {
    const el = document.createElement('data-table') as DataTableElement;
    document.body.appendChild(el);
    const cols: ColumnDefinition[] = [
      { key: 'name', label: 'Name', sortable: false, render: (row) => '<b>' + String(row.name) + '</b>' },
    ];
    el.columns = cols;
    el.rows = rows as unknown as Record<string, unknown>[];
    const cell = el.shadowRoot!.querySelector('tbody td');
    expect(cell?.innerHTML).toContain('<b>Alice</b>');
    document.body.removeChild(el);
  });

  it('clicking a sortable header emits sort-changed with toggling direction', () => {
    const el = document.createElement('data-table') as DataTableElement;
    document.body.appendChild(el);
    el.columns = columns;
    el.rows = rows as unknown as Record<string, unknown>[];
    let payload: { column: string; direction: string } | null = null;
    el.addEventListener('sort-changed', (e) => { payload = (e as CustomEvent).detail; });
    const sortBtn = el.shadowRoot!.querySelector('[data-sort-key="name"]') as HTMLButtonElement;
    sortBtn.click();
    expect(payload!.column).toBe('name');
    expect(payload!.direction).toBe('asc');
    // Click again to toggle (re-query: rerender replaced the button)
    const sortBtn2 = el.shadowRoot!.querySelector('[data-sort-key="name"]') as HTMLButtonElement;
    sortBtn2.click();
    expect(payload!.direction).toBe('desc');
    document.body.removeChild(el);
  });

  it('pagination controls emit page-changed at boundaries', () => {
    const el = document.createElement('data-table') as DataTableElement;
    document.body.appendChild(el);
    el.columns = columns;
    el.rows = rows as unknown as Record<string, unknown>[];
    el.totalItems = 50;
    el.pageSize = 10;
    let payload: { page: number } | null = null;
    el.addEventListener('page-changed', (e) => { payload = (e as CustomEvent).detail; });
    // First page — prev should be disabled
    const prevBtn = el.shadowRoot!.querySelector('[data-page="prev"]') as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
    // Click next
    const nextBtn = el.shadowRoot!.querySelector('[data-page="next"]') as HTMLButtonElement;
    nextBtn.click();
    expect(payload!.page).toBe(2);
    document.body.removeChild(el);
  });
});