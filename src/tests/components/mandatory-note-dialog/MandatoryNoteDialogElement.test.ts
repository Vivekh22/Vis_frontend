// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { MandatoryNoteDialogElement } from '../../../components/mandatory-note-dialog/MandatoryNoteDialogElement';
import { MIN_NOTE_LENGTH } from '../../../components/mandatory-note-dialog/MandatoryNoteDialogElement';
import '../../../components/mandatory-note-dialog/MandatoryNoteDialogElement';

describe('MandatoryNoteDialogElement', () => {
  it('renders nothing when closed', () => {
    const el = document.createElement('mandatory-note-dialog') as MandatoryNoteDialogElement;
    document.body.appendChild(el);
    expect(el.shadowRoot!.querySelector('vis-modal')).toBeNull();
    document.body.removeChild(el);
  });

  it('open() displays the dialog with actionDescription', () => {
    const el = document.createElement('mandatory-note-dialog') as MandatoryNoteDialogElement;
    document.body.appendChild(el);
    el.open({ actionDescription: 'Approve campaign Summer Sale', onConfirm: () => {}, onCancel: () => {} });
    expect(el.shadowRoot!.textContent).toContain('Approve campaign Summer Sale');
    document.body.removeChild(el);
  });

  it('Confirm button is disabled when note is empty or below minimum', () => {
    const el = document.createElement('mandatory-note-dialog') as MandatoryNoteDialogElement;
    document.body.appendChild(el);
    el.open({ actionDescription: 'Test', onConfirm: () => {}, onCancel: () => {} });
    const confirmBtn = el.shadowRoot!.querySelector('[data-action="confirm"]') as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);
    document.body.removeChild(el);
  });

  it('Confirm becomes enabled once valid note is entered', () => {
    const el = document.createElement('mandatory-note-dialog') as MandatoryNoteDialogElement;
    document.body.appendChild(el);
    el.open({ actionDescription: 'Test', onConfirm: () => {}, onCancel: () => {} });
    const textarea = el.shadowRoot!.querySelector('[data-field="note"]') as HTMLTextAreaElement;
    textarea.value = 'A'.repeat(MIN_NOTE_LENGTH);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    const confirmBtn = el.shadowRoot!.querySelector('[data-action="confirm"]') as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(false);
    document.body.removeChild(el);
  });

  it('clicking Confirm with valid note calls onConfirm and closes', () => {
    const el = document.createElement('mandatory-note-dialog') as MandatoryNoteDialogElement;
    document.body.appendChild(el);
    let confirmedNote: string | null = null;
    el.open({
      actionDescription: 'Test',
      onConfirm: (note) => { confirmedNote = note; },
      onCancel: () => {},
    });
    const textarea = el.shadowRoot!.querySelector('[data-field="note"]') as HTMLTextAreaElement;
    textarea.value = 'This is a valid note';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    const confirmBtn = el.shadowRoot!.querySelector('[data-action="confirm"]') as HTMLButtonElement;
    confirmBtn.click();
    expect(confirmedNote).toBe('This is a valid note');
    expect(el.shadowRoot!.querySelector('vis-modal')).toBeNull();
    document.body.removeChild(el);
  });

  it('clicking Cancel calls onCancel without calling onConfirm', () => {
    const el = document.createElement('mandatory-note-dialog') as MandatoryNoteDialogElement;
    document.body.appendChild(el);
    let onConfirmCalled = false;
    let onCancelCalled = false;
    el.open({
      actionDescription: 'Test',
      onConfirm: () => { onConfirmCalled = true; },
      onCancel: () => { onCancelCalled = true; },
    });
    const cancelBtn = el.shadowRoot!.querySelector('[data-action="cancel"]') as HTMLButtonElement;
    cancelBtn.click();
    expect(onCancelCalled).toBe(true);
    expect(onConfirmCalled).toBe(false);
    document.body.removeChild(el);
  });
});