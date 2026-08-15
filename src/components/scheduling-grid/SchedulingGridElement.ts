/**
 * SchedulingGridElement.ts — components/scheduling-grid/
 *
 * Purpose:
 *   Interactive 7×24 click-drag scheduling grid. Days (Mon–Sun) on rows,
 *   hours (0–23) on columns. Each cell is toggleable via click or
 *   click-drag selection.
 *
 *   Emits 'schedule-changed' with a boolean[7][24] grid whenever a cell
 *   is toggled.
 *
 * Drag-select behavior:
 *   - mousedown on a cell starts a drag session, toggling that cell
 *   - mouseenter during an active drag toggles cells to match the drag's
 *     target state (the inverse of the first cell's original state)
 *   - mouseup anywhere ends the session
 *   - Touch is not yet supported; this is a known gap for mobile.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';

export type ScheduleGrid = boolean[][];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .grid-container { overflow-x: auto; }
  .schedule-grid {
    display: grid;
    grid-template-columns: 40px repeat(24, 1fr);
    gap: 1px;
    min-width: 600px;
    user-select: none;
  }
  .grid-header, .grid-day-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-align: center;
    padding: var(--space-1);
  }
  .grid-cell {
    height: 28px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    cursor: pointer;
    transition: background 0.1s;
  }
  .grid-cell.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
  }
  .grid-cell:hover { background: var(--color-surface-2); }
  .grid-cell.active:hover { background: var(--color-primary); opacity: 0.85; }
  .legend {
    margin-top: var(--space-2);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  .legend-swatch {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 1px solid var(--color-border);
    vertical-align: middle;
    margin-right: var(--space-1);
  }
  .legend-swatch.active { background: var(--color-primary); border-color: var(--color-primary); }
`;

function createEmptyGrid(): ScheduleGrid {
  return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => false));
}

class SchedulingGridElement extends BaseComponent {
  private _grid: ScheduleGrid = createEmptyGrid();
  private isDragging = false;
  private dragTargetState = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set grid(value: ScheduleGrid) {
    this._grid = value;
    this.rerender();
  }

  public get grid(): ScheduleGrid {
    return this._grid;
  }

  protected onMount(): void {
    this.shadow.addEventListener('mousedown', this.handleMouseDown);
    this.shadow.addEventListener('mouseenter', this.handleMouseEnter, true);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('mousedown', this.handleMouseDown);
    this.shadow.removeEventListener('mouseenter', this.handleMouseEnter, true);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  private handleMouseDown = (event: Event): void => {
    const cell = (event.target as HTMLElement).closest('[data-day][data-hour]');
    if (!cell) return;
    const day = parseInt(cell.getAttribute('data-day') ?? '-1', 10);
    const hour = parseInt(cell.getAttribute('data-hour') ?? '-1', 10);
    if (day < 0 || hour < 0) return;
    const currentState = this._grid[day]![hour]!;
    this.dragTargetState = !currentState;
    this._grid[day]![hour] = this.dragTargetState;
    this.isDragging = true;
    this.emitScheduleChanged();
    this.rerender();
  };

  private handleMouseEnter = (event: Event): void => {
    if (!this.isDragging) return;
    const cell = (event.target as HTMLElement).closest('[data-day][data-hour]');
    if (!cell) return;
    const day = parseInt(cell.getAttribute('data-day') ?? '-1', 10);
    const hour = parseInt(cell.getAttribute('data-hour') ?? '-1', 10);
    if (day < 0 || hour < 0) return;
    if (this._grid[day]![hour] === this.dragTargetState) return;
    this._grid[day]![hour] = this.dragTargetState;
    this.emitScheduleChanged();
    this.rerender();
  };

  private handleMouseUp = (): void => {
    this.isDragging = false;
  };

  private emitScheduleChanged(): void {
    this.emit('schedule-changed', this._grid.map((row) => [...row]));
  }

  protected renderTemplate(): string {
    const headerCells = HOURS.map(
      (h) => html`<div class="grid-header">${h}</div>`,
    ).join('');

    const rows = DAYS.map((day, dayIdx) => {
      const dayLabel = html`<div class="grid-day-label">${day}</div>`;
      const hourCells = HOURS.map((hour) => {
        const isActive = this._grid[dayIdx]![hour]!;
        const cls = isActive ? 'grid-cell active' : 'grid-cell';
        return html`<div class="${cls}" data-day="${dayIdx}" data-hour="${hour}"></div>`;
      }).join('');
      return dayLabel + hourCells;
    }).join('');

    return html`
      <div class="grid-container">
        <div class="schedule-grid">
          <div class="grid-header"></div>
          ${SafeHtmlString.trusted(headerCells)}
          ${SafeHtmlString.trusted(rows)}
        </div>
      </div>
      <div class="legend">
        <span class="legend-swatch"></span> Not scheduled
        &nbsp;&nbsp;
        <span class="legend-swatch active"></span> Scheduled
      </div>
    `;
  }
}

ComponentRegistry.register('scheduling-grid', SchedulingGridElement);
export { SchedulingGridElement, DAYS, HOURS };