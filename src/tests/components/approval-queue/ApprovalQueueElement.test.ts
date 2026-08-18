// @ts-nocheck
import { describe, it, expect, afterEach } from 'vitest';
import { ApprovalQueueElement } from '../../../components/approval-queue/ApprovalQueueElement';
import '../../../components/approval-queue/ApprovalQueueElement';

const items: ApprovalQueueItem[] = [
  { id: '1', type: 'campaign', client: 'Acme', submittedBy: 'Alice', submittedAt: new Date(), slaDeadline: new Date(), isOverdue: false, summary: 'Summer Sale 2026' },
  { id: '2', type: 'creative', client: 'Beta', submittedBy: 'Bob', submittedAt: new Date(), slaDeadline: null, isOverdue: true, summary: 'Banner Ad Q3' },
  { id: '3', type: 'campaign', client: null, submittedBy: 'Carol', submittedAt: new Date(), slaDeadline: null, isOverdue: false, summary: 'Holiday Push' },
];

describe('ApprovalQueueElement', () => {
  afterEach(() => {
    const queue = document.querySelector('approval-queue');
    if (queue) queue.remove();
    const dialog = document.querySelector('mandatory-note-dialog');
    if (dialog) dialog.remove();
    document.body.innerHTML = '';
  });

  it('renders correct row-count badges per tab', () => {
    const el = document.createElement('approval-queue') as ApprovalQueueElement;
    document.body.appendChild(el);
    el.items = items;
    const badges = el.shadowRoot!.querySelectorAll('.tab-badge');
    // all, campaigns, creatives, overdue
    expect(badges[0]!.textContent).toBe('3');
    expect(badges[1]!.textContent).toBe('2');
    expect(badges[2]!.textContent).toBe('1');
    expect(badges[3]!.textContent).toBe('1');
  });

  it('tab switching filters displayed items client-side', () => {
    const el = document.createElement('approval-queue') as ApprovalQueueElement;
    document.body.appendChild(el);
    el.items = items;
    // Click "campaigns" tab
    const campaignTab = el.shadowRoot!.querySelector('[data-tab="campaigns"]') as HTMLElement;
    campaignTab.click();
    let queueItems = el.shadowRoot!.querySelectorAll('.queue-item');
    expect(queueItems.length).toBe(2);
    // Click "creatives" tab
    const creativeTab = el.shadowRoot!.querySelector('[data-tab="creatives"]') as HTMLElement;
    creativeTab.click();
    queueItems = el.shadowRoot!.querySelectorAll('.queue-item');
    expect(queueItems.length).toBe(1);
  });

  it('overdue items render with a non-color visual indicator', () => {
    const el = document.createElement('approval-queue') as ApprovalQueueElement;
    document.body.appendChild(el);
    el.items = items;
    const overdueRow = el.shadowRoot!.querySelector('.queue-item--overdue');
    expect(overdueRow).not.toBeNull();
    expect(overdueRow!.textContent).toContain('OVERDUE');
  });

  it('clicking Approve opens the mandatory note dialog with correct action description', () => {
    const el = document.createElement('approval-queue') as ApprovalQueueElement;
    document.body.appendChild(el);
    el.items = items;
    const approveBtn = el.shadowRoot!.querySelector('[data-action="approve"]') as HTMLButtonElement;
    approveBtn.click();
    const dialog = document.querySelector('mandatory-note-dialog') as HTMLElement & { shadowRoot: ShadowRoot };
    expect(dialog).not.toBeNull();
    expect(dialog.shadowRoot?.textContent).toContain('Approve');
    expect(dialog.shadowRoot?.textContent).toContain('Summer Sale 2026');
  });

  it('confirming the note dialog emits approval-action with correct payload', () => {
    const el = document.createElement('approval-queue') as ApprovalQueueElement;
    document.body.appendChild(el);
    el.items = items;
    const approveBtn = el.shadowRoot!.querySelector('[data-action="approve"]') as HTMLButtonElement;
    approveBtn.click();
    const dialog = document.querySelector('mandatory-note-dialog') as HTMLElement & { shadowRoot: ShadowRoot };
    const textarea = dialog.shadowRoot.querySelector('[data-field="note"]') as HTMLTextAreaElement;
    textarea.value = 'Approved with note';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    let payload: { itemId: string; action: string; note: string } | null = null;
    el.addEventListener('approval-action', (e) => { payload = (e as CustomEvent).detail; });
    const confirmBtn = dialog.shadowRoot.querySelector('[data-action="confirm"]') as HTMLButtonElement;
    confirmBtn.click();
    expect(payload).not.toBeNull();
    expect(payload!.itemId).toBe('1');
    expect(payload!.action).toBe('approve');
    expect(payload!.note).toBe('Approved with note');
  });

  it('canceling the note dialog does NOT emit approval-action', () => {
    const el = document.createElement('approval-queue') as ApprovalQueueElement;
    document.body.appendChild(el);
    el.items = items;
    const approveBtn = el.shadowRoot!.querySelector('[data-action="approve"]') as HTMLButtonElement;
    approveBtn.click();
    const dialog = document.querySelector('mandatory-note-dialog') as HTMLElement & { shadowRoot: ShadowRoot };
    let eventFired = false;
    el.addEventListener('approval-action', () => { eventFired = true; });
    const cancelBtn = dialog.shadowRoot.querySelector('[data-action="cancel"]') as HTMLButtonElement;
    cancelBtn.click();
    expect(eventFired).toBe(false);
  });
});