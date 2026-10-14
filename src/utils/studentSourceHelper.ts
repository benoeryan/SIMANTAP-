import { CalonSiswa } from '../types';
import { isIjefCategory } from './candidateUtils';

/**
 * Utility helper to determine if a student record is mock/dummy seed data or real Firebase data.
 */
export function isDummyStudent(student: CalonSiswa | null | undefined): boolean {
  if (!student) return false;

  // 1. Explicit flag checks
  if (student.isDummy === true || student.source === 'dummy') {
    return true;
  }
  if (student.isDummy === false || student.source === 'firebase' || student.isFirestoreDoc === true) {
    return false;
  }

  // 2. ID prefix checks
  const idStr = String(student.id || '').toUpperCase();
  if (
    idStr.startsWith('DEMO-') ||
    idStr.startsWith('DUMMY-') ||
    idStr.startsWith('SAMPLE-') ||
    idStr.startsWith('MOCK-')
  ) {
    return true;
  }

  // 3. Known initial seed IDs
  const seedIds = [
    'DEMO-SISWA-OFFLINE',
    'DEMO-SISWA-ONLINE',
    'DEMO-NEWCOMER',
    'DEMO-EXMAGANG',
    'DEMO-ENGINEERING',
    'SISWA-IJEF-BAGUS-001'
  ];
  if (seedIds.includes(student.id)) {
    return true;
  }

  // If created via form with real timestamp or pulled from Firestore/Drive, it is real
  if (student.isFirestoreDoc || student.firestoreDocId) {
    return false;
  }

  return false;
}

/**
 * Helper to check if a student belongs to IJEF internal training (Offline or Online)
 */
export function isIjefStudent(student: CalonSiswa | null | undefined): boolean {
  if (!student) return false;
  return isIjefCategory(student.kategoriKandidat);
}
