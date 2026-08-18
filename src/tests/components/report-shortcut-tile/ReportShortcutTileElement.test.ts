// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReportShortcutTileElement } from '../../../components/report-shortcut-tile/ReportShortcutTileElement';
import '../../../components/report-shortcut-tile/ReportShortcutTileElement';

describe('ReportShortcutTileElement', () => {
  let el: ReportShortcutTileElement;

  beforeEach(() => {
    el = document.createElement('report-shortcut-tile') as ReportShortcutTileElement;
  });

  afterEach(() => {
    if (el.parentNode) document.body.removeChild(el);
  });

  it('renders the tile label', () => {
    document.body.appendChild(el);
    el.label = 'By Day';
    el.expanded = false; 
    const label = el.shadowRoot!.querySelector('.tile-label');
    expect(label?.textContent).toBe('By Day');
  });

  it('toggles expanded state when header is clicked', () => {
    document.body.appendChild(el);
    el.expanded = false;
    let header = el.shadowRoot!.querySelector('.tile-header') as HTMLElement;
    
    header.click();
    expect(el.expanded).toBe(true);
    
    header = el.shadowRoot!.querySelector('.tile-header') as HTMLElement;
    header.click();
    expect(el.expanded).toBe(false);
  });

  it('emits tile-clicked event on header click', () => {
    document.body.appendChild(el);
    el.label = 'By Day';
    el.expanded = false;
    const handler = vi.fn();
    el.addEventListener('tile-clicked', handler);
    
    const header = el.shadowRoot!.querySelector('.tile-header') as HTMLElement;
    header.click();
    
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]![0].detail).toEqual({ label: 'By Day', expanded: true });
  });

  it('conditionally renders the breakdown slot based on expanded state', () => {
    document.body.appendChild(el);
    
    el.expanded = false;
    let slot = el.shadowRoot!.querySelector('.tile-breakdown slot');
    expect(slot).toBeNull();

    el.expanded = true;
    slot = el.shadowRoot!.querySelector('.tile-breakdown slot');
    expect(slot).not.toBeNull();
  });
});