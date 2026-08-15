/**
 * csvExport.ts — utils/
 *
 * Hand-written, dependency-free CSV export utility.
 *
 * CSV EXPORT:
 *   Generates a proper CSV file with RFC 4180 quoting (fields containing
 *   commas, quotes, or newlines are wrapped in double quotes with internal
 *   quotes doubled). Downloads via Blob + anchor click.
 *
 * EXCEL EXPORT — INTERIM APPROACH (DOCUMENTED TRADEOFF):
 *   For "Excel" export, the same CSV content is served with an .xls extension
 *   and the `application/vnd.ms-excel` MIME type. This is a well-known
 *   browser trick: Excel can open CSV files, and the .xls extension + Excel
 *   MIME type makes the browser offer to open the file directly in Excel.
 *
 *   This is an INTERIM approach dictated by the project's no-new-dependency
 *   principle. A real .xlsx file requires an Excel-writing library (e.g.
 *   ExcelJS or SheetJS), which would add a large unaudited dependency.
 *   The tradeoff: the "Excel" export is technically a CSV file with an .xls
 *   extension — Excel opens it correctly, but a strict .xlsx reader would
 *   reject it. When the backend is built, real Excel generation should move
 *   server-side.
 */

function escapeCsvField(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvContent(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(escapeCsvField).join(',');
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(','));
  return [headerLine, ...dataLines].join('\r\n');
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Exports data as a CSV file (.csv, text/csv MIME type).
 */
export function exportToCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const content = buildCsvContent(headers, rows);
  downloadBlob(content, filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv;charset=utf-8');
}

/**
 * Exports data as an Excel-compatible file (.xls, application/vnd.ms-excel MIME type).
 *
 * INTERIM APPROACH: The file content is CSV, not real XLSX. Excel opens it
 * correctly. See the file-level comment for the full tradeoff documentation.
 */
export function exportToExcel(filename: string, headers: string[], rows: unknown[][]): void {
  const content = buildCsvContent(headers, rows);
  downloadBlob(content, filename.endsWith('.xls') ? filename : `${filename}.xls`, 'application/vnd.ms-excel');
}