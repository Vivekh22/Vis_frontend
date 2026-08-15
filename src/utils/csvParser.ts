/**
 * csvParser.ts — utils/
 *
 * Hand-written, dependency-free CSV parser. Parses CSV text into a 2D
 * array of strings. Handles quoted fields, escaped quotes, embedded
 * newlines, and trailing empty lines.
 *
 * This is intentionally NOT a full RFC 4180 implementation — it covers
 * the common cases needed for audience list uploads (header row + data
 * rows, optional quoting, comma delimiters). Edge cases like BOM markers
 * and alternate delimiters are handled minimally.
 *
 * No external CSV library is used — consistent with the project's
 * zero-runtime-dependency principle for utility logic.
 */

export interface CsvParseResult {
  headers: string[];
  rows: string[][];
  rowCount: number;
}

/**
 * Parses CSV text into headers and data rows.
 *
 * @param text Raw CSV text (from a File or a fetched link)
 * @returns { headers, rows, rowCount } — empty arrays if input is blank
 */
export function parseCsv(text: string): CsvParseResult {
  const trimmed = text.replace(/^\uFEFF/, ''); // strip BOM if present
  if (trimmed.trim() === '') {
    return { headers: [], rows: [], rowCount: 0 };
  }

  const allRows = parseRows(trimmed);
  // Drop trailing empty rows
  while (allRows.length > 0 && allRows[allRows.length - 1]!.every((c) => c.trim() === '')) {
    allRows.pop();
  }

  if (allRows.length === 0) {
    return { headers: [], rows: [], rowCount: 0 };
  }

  const headers = allRows[0]!;
  const dataRows = allRows.slice(1);
  return { headers, rows: dataRows, rowCount: dataRows.length };
}

/**
 * Core row parser — splits CSV text into a 2D string array.
 * Handles quoted fields with embedded commas, newlines, and doubled quotes.
 */
function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i]!;

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote (double quote inside quoted field)
        if (text[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        }
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      }
      currentField += char;
      i++;
      continue;
    }

    // Not in quotes
    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (char === ',') {
      currentRow.push(currentField);
      currentField = '';
      i++;
      continue;
    }

    if (char === '\r') {
      // Handle \r\n or lone \r
      currentRow.push(currentField);
      currentField = '';
      rows.push(currentRow);
      currentRow = [];
      if (text[i + 1] === '\n') {
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    if (char === '\n') {
      currentRow.push(currentField);
      currentField = '';
      rows.push(currentRow);
      currentRow = [];
      i++;
      continue;
    }

    currentField += char;
    i++;
  }

  // Flush the last field/row
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}