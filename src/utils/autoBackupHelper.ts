/**
 * Auto-Backup & System Recovery Utility for SIMANTAP IJEF CORP
 * Handles daily automatic local snapshots and 1-click JSON backup export/restore.
 */

export interface SystemBackupPayload {
  version: string;
  exportedAt: string;
  backupDate: string;
  counts: {
    candidates: number;
    students: number;
    jobs: number;
    admins: number;
    leads: number;
  };
  candidates: any[];
  students: any[];
  jobs: any[];
  admins: any[];
  leads: any[];
  masterSettings?: any;
}

const BACKUP_STORAGE_KEY_PREFIX = 'simantap_daily_backup_';
const LAST_AUTO_BACKUP_DATE_KEY = 'simantap_last_auto_backup_date';

/**
 * Returns today's YYYY-MM-DD date string in local timezone
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates a full system backup payload
 */
export function createSystemBackupPayload(data: {
  candidates: any[];
  students: any[];
  jobs: any[];
  admins: any[];
  leads: any[];
  masterSettings?: any;
}): SystemBackupPayload {
  const today = getTodayDateString();
  const nowIso = new Date().toISOString();

  return {
    version: '2.5.0-SIMANTAP-PROD',
    exportedAt: nowIso,
    backupDate: today,
    counts: {
      candidates: data.candidates.length,
      students: data.students.length,
      jobs: data.jobs.length,
      admins: data.admins.length,
      leads: data.leads.length
    },
    candidates: data.candidates,
    students: data.students,
    jobs: data.jobs,
    admins: data.admins,
    leads: data.leads,
    masterSettings: data.masterSettings
  };
}

/**
 * Performs daily automatic local snapshot (runs once per day)
 */
export function performDailyAutoBackup(data: {
  candidates: any[];
  students: any[];
  jobs: any[];
  admins: any[];
  leads: any[];
  masterSettings?: any;
}): boolean {
  try {
    const today = getTodayDateString();
    const lastBackupDate = localStorage.getItem(LAST_AUTO_BACKUP_DATE_KEY);

    // If already backed up today, skip
    if (lastBackupDate === today) {
      return false;
    }

    const payload = createSystemBackupPayload(data);
    const storageKey = `${BACKUP_STORAGE_KEY_PREFIX}${today}`;
    localStorage.setItem(storageKey, JSON.stringify(payload));
    localStorage.setItem(LAST_AUTO_BACKUP_DATE_KEY, today);

    console.log(`[Auto-Backup] Berhasil membuat snapshot harian otomatis: ${storageKey}`);
    return true;
  } catch (err) {
    console.warn('[Auto-Backup] Caution during auto backup creation:', err);
    return false;
  }
}

/**
 * Triggers 1-click browser download of the full JSON backup file
 */
export function downloadSystemBackupFile(data: {
  candidates: any[];
  students: any[];
  jobs: any[];
  admins: any[];
  leads: any[];
  masterSettings?: any;
}) {
  const payload = createSystemBackupPayload(data);
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const today = getTodayDateString();
  const filename = `simantap_backup_master_${today}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates an uploaded backup JSON file
 */
export function parseAndValidateBackupFile(fileContent: string): {
  success: boolean;
  payload?: SystemBackupPayload;
  error?: string;
} {
  try {
    const parsed = JSON.parse(fileContent);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Format file JSON tidak valid' };
    }

    const candidates = Array.isArray(parsed.candidates) ? parsed.candidates : [];
    const students = Array.isArray(parsed.students) || Array.isArray(parsed.calon_siswa) ? (parsed.students || parsed.calon_siswa) : [];
    const jobs = Array.isArray(parsed.jobs) ? parsed.jobs : [];
    const admins = Array.isArray(parsed.admins) || Array.isArray(parsed.admin_users) ? (parsed.admins || parsed.admin_users) : [];
    const leads = Array.isArray(parsed.leads) || Array.isArray(parsed.marketing_leads) ? (parsed.leads || parsed.marketing_leads) : [];

    const payload: SystemBackupPayload = {
      version: parsed.version || 'RESTORED-SNAPSHOT',
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      backupDate: parsed.backupDate || getTodayDateString(),
      counts: {
        candidates: candidates.length,
        students: students.length,
        jobs: jobs.length,
        admins: admins.length,
        leads: leads.length
      },
      candidates,
      students,
      jobs,
      admins,
      leads,
      masterSettings: parsed.masterSettings || undefined
    };

    return { success: true, payload };
  } catch (err: any) {
    return { success: false, error: `Gagal membaca file JSON: ${err?.message || 'Error parsing'}` };
  }
}
