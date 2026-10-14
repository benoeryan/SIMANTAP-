/**
 * Helper utility for sorting and filtering candidates & CRM leads.
 * 
 * Supports:
 * - default
 * - nama (A-Z)
 * - nama (Z-A)
 * - tanggal terbaru
 * - tanggal paling lama (masukkan data yang tidak ada tanggal)
 * - 7 hari terakhir
 * - 30 hari terakhir
 * - bulan ini
 * - bulan lalu
 */

export type SortCriteria =
  | 'DEFAULT'
  | 'NAME_ASC'
  | 'NAME_DESC'
  | 'DATE_NEWEST'
  | 'DATE_OLDEST'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'THIS_MONTH'
  | 'LAST_MONTH';

export interface SortOptionItem {
  id: SortCriteria;
  labelId: string;
  labelJa: string;
}

export const SORT_OPTIONS: SortOptionItem[] = [
  { id: 'DEFAULT', labelId: 'Default', labelJa: 'デフォルト' },
  { id: 'NAME_ASC', labelId: 'Nama (A-Z)', labelJa: '氏名順 (A-Z)' },
  { id: 'NAME_DESC', labelId: 'Nama (Z-A)', labelJa: '氏名順 (Z-A)' },
  { id: 'DATE_NEWEST', labelId: 'Tanggal Terbaru', labelJa: '日付: 新しい順' },
  { id: 'DATE_OLDEST', labelId: 'Tanggal Paling Lama (termasuk tanpa tanggal)', labelJa: '日付: 古い順 (日付なし含む)' },
  { id: 'LAST_7_DAYS', labelId: '7 Hari Terakhir', labelJa: '過去7日間' },
  { id: 'LAST_30_DAYS', labelId: '30 Hari Terakhir', labelJa: '過去30日間' },
  { id: 'THIS_MONTH', labelId: 'Bulan Ini', labelJa: '今月' },
  { id: 'LAST_MONTH', labelId: 'Bulan Lalu', labelJa: '先月' }
];

/**
 * Safely extracts a timestamp number or null from a candidate or lead record.
 */
export function extractRecordDate(item: any): Date | null {
  if (!item) return null;
  const candidates = [
    item.createdAt,
    item.tanggalMasukLead,
    item.tanggalPendaftaran,
    item.updatedAt,
    item.registeredAt,
    item.integratedAt
  ];

  for (const val of candidates) {
    if (typeof val === 'string' && val.trim().length > 0) {
      const parsed = new Date(val.trim());
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } else if (typeof val === 'number') {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  return null;
}

/**
 * Filters and sorts any list of candidates or CRM leads according to the requested criteria.
 */
export function applyCandidateSorting<T extends { namaLengkap?: string; [key: string]: any }>(
  items: T[],
  sortBy: string
): T[] {
  if (!items || items.length === 0) return [];
  const now = new Date();
  const nowTime = now.getTime();

  // Date-window filters
  if (sortBy === 'LAST_7_DAYS') {
    const sevenDaysAgo = nowTime - 7 * 24 * 60 * 60 * 1000;
    const tomorrow = nowTime + 24 * 60 * 60 * 1000;
    const filtered = items.filter((item) => {
      const d = extractRecordDate(item);
      if (!d) return false;
      const t = d.getTime();
      return t >= sevenDaysAgo && t <= tomorrow;
    });
    // Sort newest first
    return filtered.sort((a, b) => {
      const dateA = extractRecordDate(a)?.getTime() || 0;
      const dateB = extractRecordDate(b)?.getTime() || 0;
      return dateB - dateA;
    });
  }

  if (sortBy === 'LAST_30_DAYS') {
    const thirtyDaysAgo = nowTime - 30 * 24 * 60 * 60 * 1000;
    const tomorrow = nowTime + 24 * 60 * 60 * 1000;
    const filtered = items.filter((item) => {
      const d = extractRecordDate(item);
      if (!d) return false;
      const t = d.getTime();
      return t >= thirtyDaysAgo && t <= tomorrow;
    });
    return filtered.sort((a, b) => {
      const dateA = extractRecordDate(a)?.getTime() || 0;
      const dateB = extractRecordDate(b)?.getTime() || 0;
      return dateB - dateA;
    });
  }

  if (sortBy === 'THIS_MONTH') {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const filtered = items.filter((item) => {
      const d = extractRecordDate(item);
      if (!d) return false;
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    return filtered.sort((a, b) => {
      const dateA = extractRecordDate(a)?.getTime() || 0;
      const dateB = extractRecordDate(b)?.getTime() || 0;
      return dateB - dateA;
    });
  }

  if (sortBy === 'LAST_MONTH') {
    const targetMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const filtered = items.filter((item) => {
      const d = extractRecordDate(item);
      if (!d) return false;
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });
    return filtered.sort((a, b) => {
      const dateA = extractRecordDate(a)?.getTime() || 0;
      const dateB = extractRecordDate(b)?.getTime() || 0;
      return dateB - dateA;
    });
  }

  const copy = [...items];

  // Alphabetical
  if (sortBy === 'NAME_ASC') {
    return copy.sort((a, b) => (a.namaLengkap || '').localeCompare(b.namaLengkap || '', undefined, { sensitivity: 'base' }));
  }

  if (sortBy === 'NAME_DESC') {
    return copy.sort((a, b) => (b.namaLengkap || '').localeCompare(a.namaLengkap || '', undefined, { sensitivity: 'base' }));
  }

  // Date Newest
  if (sortBy === 'DATE_NEWEST') {
    return copy.sort((a, b) => {
      const dateA = extractRecordDate(a);
      const dateB = extractRecordDate(b);
      if (dateA && dateB) return dateB.getTime() - dateA.getTime();
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;
      return 0;
    });
  }

  // Date Oldest (Masukan data yang tidak ada tanggal)
  // Per requirement: records with no date MUST be included and placed at the beginning / treated as oldest.
  if (sortBy === 'DATE_OLDEST') {
    return copy.sort((a, b) => {
      const dateA = extractRecordDate(a);
      const dateB = extractRecordDate(b);
      // If both lack date, keep order
      if (!dateA && !dateB) return 0;
      // If a lacks date, it comes first (oldest)
      if (!dateA && dateB) return -1;
      // If b lacks date, it comes first
      if (dateA && !dateB) return 1;
      // Both have dates -> ascending order (oldest first)
      return dateA!.getTime() - dateB!.getTime();
    });
  }

  // DEFAULT
  return copy;
}
