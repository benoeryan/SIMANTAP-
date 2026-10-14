import { CalonSiswa, CVRirekisho } from '../types';
import { isDummyStudent } from './studentSourceHelper';

export type DuplicateField = 'nik' | 'email' | 'phone' | 'name';

export interface UnifiedRecordItem {
  type: 'STUDENT' | 'CANDIDATE_CV';
  id: string;
  studentId: string;
  namaLengkap: string;
  namaKatakana?: string;
  noKtp: string;
  email: string;
  noHp: string;
  kategoriKandidat: string;
  isDummy: boolean;
  statusInfo: string;
  pasFotoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  rawStudent?: CalonSiswa;
  rawCV?: CVRirekisho;
}

export interface DuplicateGroup {
  groupId: string;
  matchType: DuplicateField;
  matchFieldLabel: string;
  matchedValue: string;
  records: UnifiedRecordItem[];
  hasRealAndDummyMix: boolean;
  recommendedKeepId: string; // The record suggested to keep as master/primary
}

/**
 * Normalizes NIK KTP (strips non-digits)
 */
export function normalizeNik(val?: string | null): string {
  if (!val) return '';
  return String(val).replace(/\D/g, '').trim();
}

/**
 * Normalizes Email (lowercase & trim)
 */
export function normalizeEmail(val?: string | null): string {
  if (!val) return '';
  return String(val).toLowerCase().trim();
}

/**
 * Normalizes Phone / WhatsApp number (e.g. converts +62 or 62 to 0, strips non-digits)
 */
export function normalizePhone(val?: string | null): string {
  if (!val) return '';
  let digits = String(val).replace(/\D/g, '');
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2);
  }
  return digits;
}

/**
 * Normalizes Name (lowercase, single spaces, strip punctuation)
 */
export function normalizeName(val?: string | null): string {
  if (!val) return '';
  return String(val)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts CalonSiswa to UnifiedRecordItem
 */
export function studentToUnified(s: CalonSiswa): UnifiedRecordItem {
  return {
    type: 'STUDENT',
    id: s.id,
    studentId: s.id,
    namaLengkap: s.namaLengkap || 'Tanpa Nama',
    namaKatakana: s.namaKatakana,
    noKtp: s.noKtp || '',
    email: s.email || '',
    noHp: s.noHp || '',
    kategoriKandidat: s.kategoriKandidat || 'SISWA IJEF - Offline',
    isDummy: isDummyStudent(s),
    statusInfo: s.statusPendaftaran || 'Terdaftar',
    pasFotoUrl: s.berkasDokumen?.pasFoto || s.berkasDokumen?.pasPhoto3x4 || '',
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    rawStudent: s
  };
}

/**
 * Converts CVRirekisho to UnifiedRecordItem
 */
export function cvToUnified(c: CVRirekisho): UnifiedRecordItem {
  const isDummy =
    (c.id && typeof c.id === 'string' && c.id.startsWith('cv-dummy-')) ||
    (c.siswaId && typeof c.siswaId === 'string' && c.siswaId.startsWith('dummy-')) ||
    (c.siswaId && typeof c.siswaId === 'string' && c.siswaId.startsWith('seed-')) ||
    c.email.includes('dummy') ||
    c.email.includes('example.com') ||
    c.namaLengkap.toLowerCase().includes('dummy');

  return {
    type: 'CANDIDATE_CV',
    id: c.id,
    studentId: c.siswaId || c.id,
    namaLengkap: c.namaLengkap || 'Tanpa Nama',
    namaKatakana: c.namaKatakana,
    noKtp: (c as any).noKtp || '',
    email: c.email || '',
    noHp: c.noHp || '',
    kategoriKandidat: Array.isArray(c.kategoriKandidat)
      ? c.kategoriKandidat.join(', ')
      : String(c.kategoriKandidat || 'SISWA NON IJEF'),
    isDummy,
    statusInfo: c.statusProgres || c.statusCV || 'Siap Matching',
    pasFotoUrl: typeof c.pasFotoUrl === 'string' ? c.pasFotoUrl : (c.dokumenUpload?.pasPhoto3x4 as string) || '',
    createdAt: (c as any).createdAt,
    updatedAt: c.updatedAt,
    rawCV: c
  };
}

/**
 * Analyzes items and groups duplicates by specific criteria:
 * - NIK (Exact match with >= 10 digits)
 * - Email (Exact match)
 * - Phone (Exact match with >= 8 digits)
 * - Name (Exact match with >= 3 chars)
 */
export function detectDuplicates(
  items: UnifiedRecordItem[],
  enabledCriteria: { nik: boolean; email: boolean; phone: boolean; name: boolean } = {
    nik: true,
    email: true,
    phone: true,
    name: true
  }
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];

  const checkMap = (
    field: DuplicateField,
    fieldLabel: string,
    keyExtractor: (item: UnifiedRecordItem) => string,
    minLen: number = 3
  ) => {
    const map = new Map<string, UnifiedRecordItem[]>();
    for (const item of items) {
      const key = keyExtractor(item);
      if (!key || key.length < minLen) continue;
      // Skip obvious placeholders like "0000000000000000" or "-"
      if (/^0+$/.test(key) || key === '-' || key === 'none') continue;

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    }

    map.forEach((recordList, keyVal) => {
      // Must have at least 2 distinct records
      if (recordList.length > 1) {
        // Check if there are distinct items (not exact same id twice)
        const uniqueIds = new Set(recordList.map((r) => `${r.type}-${r.id}`));
        if (uniqueIds.size > 1) {
          const hasRealAndDummyMix =
            recordList.some((r) => !r.isDummy) && recordList.some((r) => r.isDummy);

          // Calculate recommended keep ID:
          // 1. Prefer Real over Dummy
          // 2. Prefer record with more fields / photos
          // 3. Prefer earlier creation or latest update
          let recommended = recordList[0];
          for (let i = 1; i < recordList.length; i++) {
            const cand = recordList[i];
            if (recommended.isDummy && !cand.isDummy) {
              recommended = cand;
            } else if (recommended.isDummy === cand.isDummy) {
              if (!recommended.pasFotoUrl && cand.pasFotoUrl) {
                recommended = cand;
              }
            }
          }

          groups.push({
            groupId: `DUP-${field.toUpperCase()}-${keyVal.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`,
            matchType: field,
            matchFieldLabel: fieldLabel,
            matchedValue: keyVal,
            records: recordList,
            hasRealAndDummyMix,
            recommendedKeepId: recommended.id
          });
        }
      }
    });
  };

  if (enabledCriteria.nik) {
    checkMap('nik', 'Nomor NIK / KTP', (i) => normalizeNik(i.noKtp), 10);
  }
  if (enabledCriteria.email) {
    checkMap('email', 'Alamat Email', (i) => normalizeEmail(i.email), 5);
  }
  if (enabledCriteria.phone) {
    checkMap('phone', 'Nomor HP / WhatsApp', (i) => normalizePhone(i.noHp), 8);
  }
  if (enabledCriteria.name) {
    checkMap('name', 'Nama Lengkap Siswa', (i) => normalizeName(i.namaLengkap), 4);
  }

  return groups;
}
