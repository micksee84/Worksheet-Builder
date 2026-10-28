/**
 * @license
 * Sunshine Brigade Worksheet Builder - Account saves
 *
 * Saves worksheets to the signed-in grown-up's account in Supabase. localStorage
 * stays as the instant, offline copy; the account copy lets families find their
 * worksheets again on any device.
 *
 * Contents are private to the account (row-level security). Never log worksheet data.
 */

import { supabase } from '../auth/supabaseClient';
import { Worksheet } from '../types';
import { validateWorksheet, WORKSHEET_SCHEMA_VERSION } from './validateWorksheet';

export interface SavedWorksheetSummary {
  id: string;
  title: string;
  pageCount: number;
  updatedAt: number;
}

interface StoredPayload {
  version: number;
  worksheet: Worksheet;
}

export async function saveWorksheetToAccount(worksheet: Worksheet): Promise<boolean> {
  if (!supabase) return false;
  const { data: auth } = await supabase.auth.getSession();
  const userId = auth.session?.user.id;
  if (!userId) return false;
  const payload: StoredPayload = { version: WORKSHEET_SCHEMA_VERSION, worksheet };
  const { error } = await supabase.from('worksheets').upsert(
    {
      id: worksheet.id,
      user_id: userId,
      title: worksheet.title?.trim() || 'My worksheet',
      data: payload,
      updated_at: new Date(worksheet.updatedAt || Date.now()).toISOString(),
    },
    { onConflict: 'user_id,id' }
  );
  if (error) {
    console.warn('[SunshineBrigade] Could not save to your account:', error.message);
    return false;
  }
  return true;
}

export async function listAccountWorksheets(): Promise<SavedWorksheetSummary[] | null> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('worksheets')
    .select('id, title, updated_at, pages:data->worksheet->pages')
    .order('updated_at', { ascending: false })
    .limit(100);
  if (error) {
    console.warn('[SunshineBrigade] Could not list your worksheets:', error.message);
    return null;
  }
  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    pageCount: Array.isArray(row.pages) ? row.pages.length : 1,
    updatedAt: new Date(row.updated_at).getTime(),
  }));
}

export async function loadAccountWorksheet(id: string): Promise<Worksheet | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('worksheets')
    .select('data')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) {
    if (error) console.warn('[SunshineBrigade] Could not open that worksheet:', error.message);
    return null;
  }
  const raw = (data as any).data;
  const candidate = raw && typeof raw === 'object' && 'worksheet' in raw ? raw.worksheet : raw;
  return validateWorksheet(candidate);
}

export async function deleteAccountWorksheet(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('worksheets').delete().eq('id', id);
  if (error) {
    console.warn('[SunshineBrigade] Could not delete that worksheet:', error.message);
    return false;
  }
  return true;
}
