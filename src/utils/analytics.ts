/**
 * @license
 * Sunshine Brigade Worksheet Builder - Analytics Hook
 * Logs privacy-preserving interaction events.
 * NEVER stores or logs typed text, personal names, or child data.
 */

export interface AnalyticsEventMap {
  'block_added': { blockId: string; size?: string; pageIndex?: number };
  'block_removed': { blockId: string };
  'template_opened': { templateId: string; pageCount: number };
  'pdf_downloaded': { pageCount: number; blockIds: string[]; pageSize: string };
  'worksheet_printed': { pageCount: number; blockIds: string[]; pageSize: string };
  'page_added': { pageCount: number };
  'page_deleted': { pageCount: number };
  'page_layout_changed': { layout: string };
}

export function trackEvent<K extends keyof AnalyticsEventMap>(
  name: K,
  data: AnalyticsEventMap[K]
): void {
  // Privacy safe: inspect data and ensure no PII fields
  const safeData = { ...data };

  // Delete any accidental text or title if present
  delete (safeData as any).text;
  delete (safeData as any).name;
  delete (safeData as any).title;
  delete (safeData as any).prompt;

  // Development/Console telemetry
  console.info(`[SunshineBrigade Analytics] ${name}`, safeData);
}
