/**
 * ReportShortcutTileElement.test.ts — tests for the report shortcut tile.
 *
 * Tests:
 *   - Renders tile label
 *   - Emits tile-clicked event on header click
 *   - Expands to show breakdown (chart-widget + data-table) when expanded
 *   - Collapses when expanded is set to false
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReportShortcutTileElement, ReportTileData } from '../../../components/report-shortcut-tile/ReportShortcutTileElement';
import '../../../components/report-shortcut-tile/ReportShortcutTileElement';

const MOCK_TILE_DATA: ReportTileData = {
  label: 'By Day',
  chartData: [{ label: 'Mon', value: 100 }],
  tableRows: [{ label: 'Mon', value: 100 }],
  tableColumns: [{ key: 'label', label: 'Label' }, { key: 'value', label: 'Value' }],
};

describe('ReportShortcutTileElement', () => {
  let el: ReportShortcutTileElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    el = document.createElement('report-shortcut-tile') as ReportShortcutTileElement;
    document.body.appendChild(el);
  });

  it('renders the tile label', () => {
    el.tileData = MOCK_TILE_DATA;
    const label = el.shadowRoot!.querySelector('.tile-label');
    expect(label?.textContent).toBe('By Day');
  });

  it('does not render breakdown when not expanded', () => {
    el.tileData = MOCK_TILE_DATA;
    el.expanded = false;
    const breakdown = el.shadowRoot!.querySelector('.tile-breakdown');
    expect(breakdown).toBeNull();
  });

  it('renders breakdown when expanded', () => {
    el.tileData = MOCK_TILE_DATA;
    el.expanded = true;
    const breakdown = el.shadowRoot!.querySelector('.tile-breakdown');
    expect(breakdown).not.toBeNull();
  });

  it('emits tile-clicked event on header click', () => {
    const handler = vi.fn();
    el.addEventListener('tile-clicked', handler);
    el.tileData = MOCK_TILE_DATA;
    const header = el.shadowRoot!.querySelector('[data-action="toggle-tile"]') as HTMLElement;
    header.click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]![0].detail).toEqual({ label: 'By Day', expanded: true });
  });

  it('collapses when header clicked while expanded', () => {
    el.tileData = MOCK_TILE_DATA;
    el.expanded = true;
    const header = el.shadowRoot!.querySelector('[data-action="toggle-tile"]') as HTMLElement;
    header.click();
    const breakdown = el.shadowRoot!.querySelector('.tile-breakdown');
    expect(breakdown).toBeNull();
  });

  it('renders chart-widget and data-table in breakdown', () => {
    el.tileData = MOCK_TILE_DATA;
    el.expanded = true;
    const chart = el.shadowRoot!.querySelector('chart-widget');
    const table = el.shadowRoot!.querySelector('data-table');
    expect(chart).not.toBeNull();
    expect(table).not.toBeNull();
  });
});