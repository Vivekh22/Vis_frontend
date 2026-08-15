/**
 * AudienceDataSource.ts — core/enums/
 *
 * The three ways an audience list can be populated.
 */
export const AudienceDataSource = {
  CsvFile: 'csv_file',
  Api: 'api',
  CsvLink: 'csv_link',
} as const;

export type AudienceDataSource = (typeof AudienceDataSource)[keyof typeof AudienceDataSource];