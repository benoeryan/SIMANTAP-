import { CandidateCategory } from '../types';

/**
 * Checks whether a given candidate category is strictly an IJEF student requiring
 * routing to Admin Siswa (SIM-SB) with full procedures: Test MCU, Asesmen DISC, and Ujian Psikotes.
 *
 * Rules:
 * ONLY "SISWA IJEF - Offline" (Asrama) and "SISWA IJEF - Online" route to Admin Siswa & have academic learning modules.
 * All other categories (SISWA MITRA, SISWA NON IJEF, NEW COMER, CANDIDATE EX-MAGANG, CANDIDATE GIJINKOKU, MATCHING JOB, etc.)
 * do NOT have academic learning/training stages shown and route directly to Admin Doc (CV-Portal JIS).
 */
export const isIjefCategory = (category?: string | null): boolean => {
  if (!category) return false;
  const normalized = category.trim().toLowerCase();

  // Explicit non-ijef keywords - MUST return false
  if (
    normalized.includes('non ijef') ||
    normalized.includes('non-ijef') ||
    normalized.includes('non_ijef') ||
    normalized.includes('mitra') ||
    normalized.includes('new comer') ||
    normalized.includes('newcomer') ||
    normalized.includes('ex-magang') ||
    normalized.includes('ex magang') ||
    normalized.includes('ex-trainee') ||
    normalized.includes('ex trainee') ||
    normalized.includes('gijinkoku') ||
    normalized.includes('engineering') ||
    normalized.includes('engineer') ||
    normalized.includes('external') ||
    normalized.includes('alumni') ||
    normalized.includes('direct') ||
    normalized.includes('matching')
  ) {
    return false;
  }

  // Check for IJEF presence
  const hasIjef =
    normalized.includes('ijef') ||
    normalized.includes('ijer');

  if (!hasIjef) return false;

  // Has passed non-ijef check and contains IJEF (covers Offline, Online, and general Siswa IJEF)
  return true;
};

/**
 * Checks specifically if candidate is IJEF Online / LMS
 */
export const isIjefOnlineCategory = (category?: string | null): boolean => {
  if (!isIjefCategory(category)) return false;
  const normalized = (category || '').toLowerCase();
  return normalized.includes('online') || normalized.includes('daring') || normalized.includes('lms');
};

/**
 * Checks specifically if candidate is IJEF Offline / Asrama
 */
export const isIjefOfflineCategory = (category?: string | null): boolean => {
  if (!isIjefCategory(category)) return false;
  return !isIjefOnlineCategory(category);
};

/**
 * Returns true if the candidate category belongs to Non-IJEF (Mitra, Non-IJEF, Ex-Magang, Gijinkoku)
 */
export const isNonIjefCategory = (category?: string | null): boolean => {
  return !isIjefCategory(category);
};

/**
 * Returns the direct destination portal based on selected candidate category:
 * - 'ADMIN_SISWA' : for Siswa IJEF Offline (Asrama) & Siswa IJEF Online
 * - 'ADMIN_DOC'   : for all other categories (Matching Job, Engineering, Ex-Magang, Non-IJEF, Mitra)
 */
export const getTargetPortalForCategory = (category?: string | null): 'ADMIN_SISWA' | 'ADMIN_DOC' => {
  return isIjefCategory(category) ? 'ADMIN_SISWA' : 'ADMIN_DOC';
};

export const getTargetPortalLabel = (category?: string | null) => {
  if (isIjefCategory(category)) {
    return {
      portal: 'ADMIN_SISWA' as const,
      portalName: 'Portal Admin Siswa (SIM-SB)',
      badgeName: 'Admin Siswa',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
      description: 'Masuk ke Database Siswa SIM-SB, Skrining MCU, DISC, Psikotes & Akses Asrama/LMS'
    };
  }
  return {
    portal: 'ADMIN_DOC' as const,
    portalName: 'Portal Admin Doc (CV Rirekisho JIS)',
    badgeName: 'Admin Doc',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 font-bold',
    description: 'Masuk langsung ke CV-Portal JIS Admin Doc, Pool Matching Job & Pengajuan Interview Jepang'
  };
};

/**
 * Standard selectable candidate categories for dropdowns
 */
export const CANDIDATE_CATEGORY_OPTIONS = [
  {
    value: 'SISWA MITRA / NON IJEF',
    label: 'SISWA MITRA / NON IJEF (Siswa Mitra - Tanpa Tes MCU & DISC)',
    isIjef: false
  },
  {
    value: 'SISWA NON IJEF (New Comer)',
    label: 'NEW COMER / NON IJEF (Matching Job Tanpa Tes MCU & Psikotes)',
    isIjef: false
  },
  {
    value: 'SISWA NON IJEF',
    label: 'SISWA NON IJEF (Matching Job Tanpa Tes MCU & Psikotes)',
    isIjef: false
  },
  {
    value: 'SISWA IJEF - Offline',
    label: 'SISWA IJEF - Offline (Asrama Tatap Muka LPK)',
    isIjef: true
  },
  {
    value: 'SISWA IJEF - Online',
    label: 'SISWA IJEF - Online (Kelas Daring E-Learning)',
    isIjef: true
  },
  {
    value: 'CANDIDATE EX-MAGANG',
    label: 'CANDIDATE EX-MAGANG (Tokutei Ginou Jepang)',
    isIjef: false
  },
  {
    value: 'CANDIDATE GIJINKOKU',
    label: 'CANDIDATE GIJINKOKU (Tenaga Kerja Ahli/Engineer)',
    isIjef: false
  }
];

/**
 * Calculates exact age in years from a birth date string or year.
 * Supports:
 * - "YYYY-MM-DD", "YYYY/MM/DD"
 * - "DD-MM-YYYY", "DD/MM/YYYY"
 * - "City, YYYY-MM-DD" or similar
 * - "YYYY" (e.g. "2000")
 * Returns number of years (e.g. 26 for birth year 2000 in 2026), or defaultFallback if invalid.
 */
export const calculateAgeFromBirthDate = (
  birthDateStr?: string | null,
  fallback = 22
): number => {
  if (!birthDateStr || typeof birthDateStr !== 'string') return fallback;
  const trimmed = birthDateStr.trim();
  if (!trimmed) return fallback;

  // Case 1: Pure 4-digit year (e.g., "2000")
  if (/^\d{4}$/.test(trimmed)) {
    const year = parseInt(trimmed, 10);
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    return age >= 10 && age <= 100 ? age : fallback;
  }

  // Case 2: Contains comma (e.g., "padasuka, 2000-01-13" or "Bandung, 13-01-2000")
  let cleanStr = trimmed;
  if (cleanStr.includes(',')) {
    const parts = cleanStr.split(',');
    cleanStr = parts[parts.length - 1].trim();
  }

  const today = new Date();

  // Case 3: DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = cleanStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const birth = new Date(year, month, day);
    if (!isNaN(birth.getTime())) {
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age >= 10 && age <= 100 ? age : fallback;
    }
  }

  // Case 4: YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = cleanStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const birth = new Date(year, month, day);
    if (!isNaN(birth.getTime())) {
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age >= 10 && age <= 100 ? age : fallback;
    }
  }

  // Case 5: Standard Date parseable
  const birth = new Date(cleanStr);
  if (!isNaN(birth.getTime()) && birth.getFullYear() > 1920) {
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 10 && age <= 100 ? age : fallback;
  }

  // Case 6: Fallback regex to find any 4-digit year e.g. "lahir tahun 2000"
  const yearMatch = cleanStr.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    const age = today.getFullYear() - year;
    return age >= 10 && age <= 100 ? age : fallback;
  }

  return fallback;
};
