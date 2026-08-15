/**
 * SchedulingGridElement.test.ts — tests for the 7×24 scheduling grid.
 *
 * Tests:
 *   - Renders 7 days × 24 hours grid
 *   - Click toggles a cell
 *   - Emits schedule-changed event
 *   - Drag-select toggles multiple cells
 *   - grid getter returns current state
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { SchedulingGridElement } from '../../../components/scheduling-grid/SchedulingGridElement';
import '../../../components/scheduling-grid/SchedulingGridElement';

describe('SchedulingGridElement', () => {
  let el: SchedulingGridElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    el = document.createElement('scheduling-grid') as SchedulingGridElement;
    document.body.appendChild(el);
  });

  it('renders 7 day rows × 24 hour columns', () => {
    const cells = el.shadowRoot!.querySelectorAll('[data-day][data-hour]');
    expect(cells.length).toBe(7 * 24);
  });

  it('renders day labels Mon–Sun', () => {
    const labels = Array.from(el.shadowRoot!.querySelectorAll('.grid-day-label')).map(
      (n: Element) => n.textContent,
    );
    expect(labels).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('renders hour headers 0–23', () => {
    const headers = Array.from(el.shadowRoot!.querySelectorAll('.grid-header')).slice(1).map(
      (n: Element) => n.textContent,
    );
    expect(headers.length).toBe(24);
    expect(headers[0]).toBe('0');
    expect(headers[23]).toBe('23');
  });

  it('cell starts inactive (not scheduled)', () => {
    const cell = el.shadowRoot!.querySelector('[data-day="0"][data-hour="0"]') as HTMLElement;
    expect(cell.classList.contains('active')).toBe(false);
  });

  it('click toggles a cell to active', () => {
    const cell = el.shadowRoot!.querySelector('[data-day="0"][data-hour="0"]') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
    // Re-query after re-render
    const updatedCell = el.shadowRoot!.querySelector('[data-day="0"][data-hour="0"]') as HTMLElement;
    expect(updatedCell.classList.contains('active')).toBe(true);
    expect(el.grid[0]![0]).toBe(true);
  });

  it('emits schedule-changed event on cell click', () => {
    let received: boolean[][] | null = null;
    el.addEventListener('schedule-changed', (event: Event) => {
      received = (event as CustomEvent<boolean[][]>).detail;
    });
    const cell = el.shadowRoot!.querySelector('[data-day="1"][data-hour="5"]') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
    expect(received).not.toBeNull();
    expect(received![1]![5]).toBe(true);
  });

  it('click again toggles cell back to inactive', () => {
    const cell = el.shadowRoot!.querySelector('[data-day="0"][data-hour="0"]') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
    expect(el.grid[0]![0]).toBe(true);
    const updatedCell = el.shadowRoot!.querySelector('[data-day="0"][data-hour="0"]') as HTMLElement;
    updatedCell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
    expect(el.grid[0]![0]).toBe(false);
  });

  it('grid setter updates the rendered grid', () => {
    const newGrid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => false));
    newGrid[3]![12] = true;
    el.grid = newGrid;
    const cell = el.shadowRoot!.querySelector('[data-day="3"][data-hour="12"]') as HTMLElement;
    expect(cell.classList.contains('active')).toBe(true);
  });
});