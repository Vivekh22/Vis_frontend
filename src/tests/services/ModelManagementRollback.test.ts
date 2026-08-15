/**
 * ModelManagementRollback.test.ts
 *
 * Proves that model rollback goes through MandatoryNoteDialogElement —
 * rolling back a production model is a consequential action that requires
 * a mandatory note (minimum 10 characters).
 *
 * The service enforces the note requirement; the UI enforces it via
 * MandatoryNoteDialogElement.
 */
import { describe, it, expect } from 'vitest';
import { ModelManagementService } from '../../services/ModelManagementService';
import { MockModelManagementRepository } from '../../repositories/mocks/MockModelManagementRepository';
import { MIN_NOTE_LENGTH } from '../../components/mandatory-note-dialog/MandatoryNoteDialogElement';

describe('Model Management Rollback', () => {
  it('rejects rollback without a note', async () => {
    const repo = new MockModelManagementRepository();
    const service = new ModelManagementService(repo);

    await expect(service.rollbackModel('model-1', 'v3.1.0', '')).rejects.toThrow();
  });

  it('rejects rollback with a note shorter than minimum length', async () => {
    const repo = new MockModelManagementRepository();
    const service = new ModelManagementService(repo);

    // Note shorter than MIN_NOTE_LENGTH (10)
    await expect(service.rollbackModel('model-1', 'v3.1.0', 'short')).rejects.toThrow();
  });

  it('accepts rollback with a valid note (>= minimum length)', async () => {
    const repo = new MockModelManagementRepository();
    const service = new ModelManagementService(repo);

    const note = 'Rolling back due to drift detected in v3.2.1';
    await service.rollbackModel('model-1', 'v3.1.0', note);

    const models = await service.getModels();
    const model = models.find((m) => m.id === 'model-1');
    expect(model!.currentVersion).toBe('v3.1.0');
  });

  it('MandatoryNoteDialogElement enforces minimum note length', () => {
    // The dialog's MIN_NOTE_LENGTH constant must be >= 10
    expect(MIN_NOTE_LENGTH).toBeGreaterThanOrEqual(10);
  });

  it('ModelManagementPageElement uses MandatoryNoteDialogElement for rollback', () => {
    // Code inspection: the page imports and uses MandatoryNoteDialogElement
    // for the rollback flow
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(
      __dirname,
      '../../pages/super-admin/taranga-governance/model-management/ModelManagementPageElement.ts',
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('MandatoryNoteDialogElement');
    expect(content).toContain('openRollbackDialog');
    expect(content).toContain('actionDescription');
  });
});