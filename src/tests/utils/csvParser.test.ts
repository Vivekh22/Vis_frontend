/**
 * CsvParser.test.ts — tests for utils/csvParser.
 *
 * Tests the hand-written CSV parser: basic parsing, quoted fields,
 * embedded commas/newlines, escaped quotes, empty input, BOM stripping.
 */
import { describe, it, expect } from 'vitest';
import { parseCsv } from '../../utils/csvParser';

describe('csvParser', () => {
  it('parses basic CSV with header', () => {
    const csv = 'name,email,phone\nJohn,john@test.com,555-1234\nJane,jane@test.com,555-5678';
    const result = parseCsv(csv);
    expect(result.headers).toEqual(['name', 'email', 'phone']);
    expect(result.rows).toHaveLength(2);
    expect(result.rowCount).toBe(2);
    expect(result.rows[0]).toEqual(['John', 'john@test.com', '555-1234']);
  });

  it('parses quoted fields with embedded commas', () => {
    const csv = 'name,desc\n"Smith, John","Hello, World"';
    const result = parseCsv(csv);
    expect(result.rows[0]).toEqual(['Smith, John', 'Hello, World']);
  });

  it('parses quoted fields with embedded newlines', () => {
    const csv = 'name,desc\n"Multi","Line1\nLine2"';
    const result = parseCsv(csv);
    expect(result.rows[0]).toEqual(['Multi', 'Line1\nLine2']);
  });

  it('parses escaped double quotes', () => {
    const csv = 'name,desc\n"Quote","He said ""Hi""';
    const result = parseCsv(csv);
    expect(result.rows[0]).toEqual(['Quote', 'He said "Hi"']);
  });

  it('returns empty arrays for empty input', () => {
    const result = parseCsv('');
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
    expect(result.rowCount).toBe(0);
  });

  it('returns empty arrays for whitespace-only input', () => {
    const result = parseCsv('   \n  \t  ');
    expect(result.headers).toEqual([]);
    expect(result.rowCount).toBe(0);
  });

  it('strips BOM marker', () => {
    const csv = '\uFEFFname,email\nJohn,john@test.com';
    const result = parseCsv(csv);
    expect(result.headers[0]).toBe('name');
  });

  it('handles single row (no data rows)', () => {
    const csv = 'name,email,phone';
    const result = parseCsv(csv);
    expect(result.headers).toEqual(['name', 'email', 'phone']);
    expect(result.rows).toHaveLength(0);
    expect(result.rowCount).toBe(0);
  });

  it('counts data rows correctly', () => {
    const csv = 'id\n1\n2\n3\n4\n5';
    const result = parseCsv(csv);
    expect(result.rowCount).toBe(5);
  });

  it('handles CRLF line endings', () => {
    const csv = 'a,b\r\n1,2\r\n3,4';
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual(['1', '2']);
  });
});