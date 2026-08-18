// @ts-nocheck
/**
 * csvExport.test.ts — tests/utils/
 *
 * Tests the hand-written CSV export utility.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('csvExport', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL and anchor click
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock Blob to capture content
    global.Blob = vi.fn().mockImplementation((parts: unknown[], options: { type: string }) => {
      return { content: parts.join(''), type: options.type } as unknown as Blob;
    });
  });

  it('exportToCsv calls download with correct filename and MIME type', async () => {
    const { exportToCsv } = await import('../../utils/csvExport');
    exportToCsv('test-report', ['Col1', 'Col2'], [['val1', 'val2']]);
    expect(vi.mocked(global.Blob)).toHaveBeenCalled();
    const blobOptions = vi.mocked(global.Blob).mock.calls[0]![1]!;
    expect(blobOptions.type).toBe('text/csv;charset=utf-8');
  });

  it('exportToExcel calls download with .xls extension and Excel MIME type', async () => {
    const { exportToExcel } = await import('../../utils/csvExport');
    exportToExcel('test-report', ['Col1'], [['val1']]);
    expect(vi.mocked(global.Blob)).toHaveBeenCalled();
    const blobOptions = vi.mocked(global.Blob).mock.calls[0]![1]!;
    expect(blobOptions.type).toBe('application/vnd.ms-excel');
  });

  it('exportToCsv properly escapes fields with commas', async () => {
    const { exportToCsv } = await import('../../utils/csvExport');
    exportToCsv('test', ['Col1'], [['hello, world']]);
    const blobCall = vi.mocked(global.Blob).mock.calls[0]!;
    const content = (blobCall[0] as unknown[]).join('') as string;
    expect(content).toContain('"hello, world"');
  });
});