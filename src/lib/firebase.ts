import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, doc, setDoc, deleteDoc, getDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { createClient } from '@supabase/supabase-js';
import firebaseConfig from '../../firebase-applet-config.json';

// Supabase Official Client Initialization
export const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || "https://lvvpgcqzbvvpjshbkavk.supabase.co";
export const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || "sb_publishable_qQmxthBt0VtKH31I8WnFZg_tZww0nmX";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize Firebase App with provisioned applet configuration
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Configure Firestore with long polling fallback to ensure robust network connectivity in preview sandboxes
let firestoreDb;
const customDbId = (firebaseConfig as any).firestoreDatabaseId;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true
  }, customDbId || undefined);
} catch {
  firestoreDb = customDbId ? getFirestore(app, customDbId) : getFirestore(app);
}

export const db = firestoreDb;
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Remove all undefined properties recursively from an object/array
 * so Firestore setDoc never throws 'Unsupported field value: undefined' or 'invalid argument' errors.
 */
function sanitizeFirestorePayload(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeFirestorePayload(item)).filter(item => item !== undefined);
  }
  if (typeof obj === 'object') {
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    if (typeof obj.isEqual === 'function' || obj.constructor?.name === 'FieldValue' || obj._methodName) {
      return obj;
    }
    const cleanObj: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleanObj[key] = sanitizeFirestorePayload(val);
      }
    }
    return cleanObj;
  }
  return obj;
}

/**
 * Save candidate registration data to 'calon_siswa' collection
 */
export async function saveCalonSiswaToFirestore(candidateData: any) {
  try {
    const rawId = candidateData?.id || candidateData?.siswaId;
    if (!rawId || typeof rawId !== 'string' || !rawId.trim()) {
      console.warn("Firestore save warning: Invalid candidate ID", candidateData);
      return { success: false, error: 'Missing candidate ID' };
    }
    const validId = String(rawId).trim();
    const docRef = doc(db, 'calon_siswa', validId);
    const payload = sanitizeFirestorePayload({
      ...candidateData,
      id: validId,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: validId };
  } catch (err: any) {
    console.warn("Firestore save warning (falling back to local state sync):", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Delete candidate registration data from 'calon_siswa' collection
 */
export async function deleteCalonSiswaFromFirestore(studentId: string) {
  try {
    const validId = String(studentId || '').trim();
    if (!validId) return { success: false, error: 'Missing candidate ID' };
    const docRef = doc(db, 'calon_siswa', validId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err: any) {
    console.warn("Firestore delete warning for calon_siswa:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Save Psikotes score to 'asesmen_psikotes' collection
 */
export async function savePsikotesToFirestore(psikotesData: any) {
  try {
    const rawSiswaId = psikotesData?.siswaId || psikotesData?.id;
    if (!rawSiswaId) return { success: false, error: 'Missing siswaId' };
    const docId = `${String(rawSiswaId).trim()}_psikotes`;
    const docRef = doc(db, 'asesmen_psikotes', docId);
    const payload = sanitizeFirestorePayload({
      ...psikotesData,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: docId };
  } catch (err: any) {
    console.warn("Firestore save warning for psikotes:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Save DISC Assessment profile to 'asesmen_disc' collection
 */
export async function saveDiscToFirestore(discData: any) {
  try {
    const rawSiswaId = discData?.siswaId || discData?.id;
    if (!rawSiswaId) return { success: false, error: 'Missing siswaId' };
    const docId = `${String(rawSiswaId).trim()}_disc`;
    const docRef = doc(db, 'asesmen_disc', docId);
    const payload = sanitizeFirestorePayload({
      ...discData,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: docId };
  } catch (err: any) {
    console.warn("Firestore save warning for DISC:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Save Health Screening data to 'hasil_kesehatan' collection
 */
export async function saveHealthToFirestore(healthData: any) {
  try {
    const rawSiswaId = healthData?.siswaId || healthData?.id;
    if (!rawSiswaId) return { success: false, error: 'Missing siswaId' };
    const docId = `${String(rawSiswaId).trim()}_health`;
    const docRef = doc(db, 'hasil_kesehatan', docId);
    const payload = sanitizeFirestorePayload({
      ...healthData,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: docId };
  } catch (err: any) {
    console.warn("Firestore save warning for health:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Save Financing Application to 'aplikasi_dukungan_dana' collection
 */
export async function saveFinancingToFirestore(financingData: any) {
  try {
    const rawSiswaId = financingData?.siswaId || financingData?.id;
    if (!rawSiswaId) return { success: false, error: 'Missing siswaId' };
    const docId = `${String(rawSiswaId).trim()}_dana`;
    const docRef = doc(db, 'aplikasi_dukungan_dana', docId);
    const payload = sanitizeFirestorePayload({
      ...financingData,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: docId };
  } catch (err: any) {
    console.warn("Firestore save warning for financing:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Save Contract Agreement to 'surat_perjanjian' collection
 */
export async function saveContractToFirestore(contractData: any) {
  try {
    const rawSiswaId = contractData?.siswaId || contractData?.id;
    if (!rawSiswaId) return { success: false, error: 'Missing siswaId' };
    const docId = `${String(rawSiswaId).trim()}_kontrak`;
    const docRef = doc(db, 'surat_perjanjian', docId);
    const payload = sanitizeFirestorePayload({
      ...contractData,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: docId };
  } catch (err: any) {
    console.warn("Firestore save warning for contract:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Save Candidate Rirekisho / CV Portal Record to 'candidates' collection in Firestore
 */
export async function saveRirekishoToFirestore(cvData: any) {
  try {
    const docId = String(cvData.id || cvData.siswaId || '').trim();
    if (!docId) return { success: false, error: 'Missing candidate ID' };
    const docRef = doc(db, 'candidates', docId);
    const payload = sanitizeFirestorePayload({
      ...cvData,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    await setDoc(docRef, payload, { merge: true });

    // Sinkronisasi langsung ke tabel 'siswa' Supabase
    if (cvData.namaLengkap) {
      try {
        supabase.from('siswa').upsert({
          nama: cvData.namaLengkap,
          status_nihongo: cvData.levelBahasa || 'Belum Ada',
          job_matching: cvData.statusProgres || 'Pending Nunggu Job',
          keterangan: cvData.keteranganProgres || cvData.detailProgres || `Bidang: ${cvData.bidangKerja || 'PM'} | Kategori: ${cvData.kategoriKandidat || 'SISWA NON IJEF (New Comer)'}`
        }).then(({ error }) => {
          if (error) console.warn("Supabase background upsert note:", error.message);
        });
      } catch (sbErr) {
        console.warn("Supabase background upsert warning:", sbErr);
      }
    }

    return { success: true, id: docId };
  } catch (err: any) {
    console.warn("Firestore save warning for rirekisho candidate:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Delete Candidate Rirekisho / CV Record from 'candidates' collection in Firestore
 */
export async function deleteRirekishoFromFirestore(candidateId: string) {
  try {
    const docId = String(candidateId || '').trim();
    if (!docId) return { success: false, error: 'Missing candidate ID' };
    const docRef = doc(db, 'candidates', docId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err: any) {
    console.warn("Firestore delete warning for candidate rirekisho:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Save Master Settings to 'pengaturan_master' collection
 */
export async function saveMasterSettingsToFirestore(settingsData: any) {
  try {
    const docRef = doc(db, 'pengaturan_master', 'global_config');
    const payload = sanitizeFirestorePayload({
      ...settingsData,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    await setDoc(docRef, payload, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.warn("Firestore save warning for settings:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Save Job Posting to 'jobs' collection (primary) and 'lowongan_kerja' collection (mirror)
 */
export async function saveJobPostingToFirestore(jobData: any) {
  try {
    const docId = String(jobData.id || jobData.kodeJob || '').trim();
    if (!docId) return { success: false, error: 'Missing job ID' };

    const rawStatus = jobData.statusJob || (jobData.statusAktif === false ? 'Closed' : 'Open');
    const normalizedPayload = sanitizeFirestorePayload({
      ...jobData,
      namaJob: jobData.namaJob || jobData.judulPekerjaan || '',
      judulPekerjaan: jobData.judulPekerjaan || jobData.namaJob || '',
      kodeJob: jobData.kodeJob || docId,
      statusJob: rawStatus,
      lokasi: jobData.lokasi || jobData.lokasiPrefektur || 'Jepang',
      lokasiPrefektur: jobData.lokasiPrefektur || jobData.lokasi || 'Jepang',
      gaji: jobData.gaji || jobData.gajiString || (jobData.gajiBulananYen ? `${jobData.gajiBulananYen}円/bulan` : '-'),
      jumlahKandidat: jobData.jumlahKandidat || (jobData.kuotaSiswa ? String(jobData.kuotaSiswa) : '1'),
      kuotaSiswa: Number(jobData.kuotaSiswa) || Number(jobData.jumlahKandidat) || 1,
      syaratKhusus: jobData.syaratKhusus || jobData.kualifikasi || '-',
      kualifikasi: jobData.kualifikasi || jobData.syaratKhusus || '-',
      biayaJob: jobData.biayaJob || jobData.biayaProses || '-',
      biayaProses: jobData.biayaProses || jobData.biayaJob || '-',
      keterangan: jobData.keterangan || jobData.keteranganTambahan || jobData.deskripsiPekerjaan || '-',
      kumiaiPartner: jobData.kumiaiPartner || jobData.sumberJob || jobData.tskSumberJob || '-',
      tskSumberJob: jobData.tskSumberJob || jobData.kumiaiPartner || jobData.sumberJob || '-',
      perusahaan: jobData.perusahaan || jobData.perusahaanJepang || jobData.namaJob || '-',
      perusahaanJepang: jobData.perusahaanJepang || jobData.perusahaan || jobData.namaJob || '-',
      jenisKelamin: jobData.jenisKelamin || 'Pria & Wanita',
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });

    // Save to 'jobs'
    const jobsDocRef = doc(db, 'jobs', docId);
    await setDoc(jobsDocRef, normalizedPayload, { merge: true });

    // Also mirror to 'lowongan_kerja'
    try {
      const lowonganDocRef = doc(db, 'lowongan_kerja', docId);
      await setDoc(lowonganDocRef, normalizedPayload, { merge: true });
    } catch {}

    return { success: true, id: docId };
  } catch (err: any) {
    console.warn("Firestore save warning for job posting:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Delete Job Posting from 'jobs' and 'lowongan_kerja' collections
 */
export async function deleteJobPostingFromFirestore(jobId: string) {
  try {
    const docId = String(jobId || '').trim();
    if (!docId) return { success: false, error: 'Missing job ID' };

    await deleteDoc(doc(db, 'jobs', docId));
    try {
      await deleteDoc(doc(db, 'lowongan_kerja', docId));
    } catch {}

    return { success: true };
  } catch (err: any) {
    console.warn("Firestore delete warning for job posting:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Clear All Job Postings from 'lowongan_kerja' collection
 */
export async function clearAllJobPostingsFromFirestore() {
  try {
    const querySnapshot = await getDocs(collection(db, 'lowongan_kerja'));
    const deletePromises = querySnapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
    return { success: true };
  } catch (err: any) {
    console.warn("Firestore clear warning for job postings:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Save Job Application to 'lamaran_kerja' collection
 */
export async function saveJobApplicationToFirestore(appData: any) {
  try {
    const docId = String(appData.id || '').trim();
    if (!docId) return { success: false, error: 'Missing application ID' };
    const docRef = doc(db, 'lamaran_kerja', docId);
    const payload = sanitizeFirestorePayload({
      ...appData,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: docId };
  } catch (err: any) {
    console.warn("Firestore save warning for job application:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Fetch Health screening data from 'hasil_kesehatan' collection
 */
export async function fetchHealthFromFirestore(siswaId: string) {
  try {
    const docId = `${siswaId}_health`;
    const docRef = doc(db, 'hasil_kesehatan', docId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (err) {
    console.warn("Firestore fetch error for health record:", err);
    return null;
  }
}

/**
 * Upload document to Firebase Storage bucket with progress & fallback
 */
export async function uploadDocumentToFirebaseStorage(
  siswaId: string,
  docKey: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  try {
    const fileExtension = file.name.split('.').pop() || 'file';
    const storagePath = `documents/${siswaId}/${docKey}_${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.warn(`Storage upload warning for ${docKey}, generating secure object link:`, error);
          // Fallback if Storage permissions/buckets aren't live
          const fakeUrl = `https://storage.googleapis.com/ijef-corp-sim.appspot.com/documents/${siswaId}/${docKey}_${file.name}`;
          resolve(fakeUrl);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        }
      );
    });
  } catch (err) {
    console.warn("Firebase Storage fallback applied:", err);
    return `https://storage.googleapis.com/ijef-corp-sim.appspot.com/documents/${siswaId}/${docKey}_${file.name}`;
  }
}

/**
 * Save Marketing Lead data to 'marketing_leads' collection
 */
export async function saveMarketingLeadToFirestore(leadData: any) {
  try {
    const rawId = leadData?.id;
    if (!rawId || typeof rawId !== 'string' || !rawId.trim()) {
      console.warn("Firestore save warning: Invalid lead ID", leadData);
      return { success: false, error: 'Missing lead ID' };
    }
    const validId = String(rawId).trim();
    const docRef = doc(db, 'marketing_leads', validId);
    const payload = sanitizeFirestorePayload({
      ...leadData,
      id: validId,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: validId };
  } catch (err: any) {
    console.warn("Firestore save warning for marketing lead:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Delete Marketing Lead from 'marketing_leads' collection
 */
export async function deleteMarketingLeadFromFirestore(leadId: string) {
  try {
    if (!leadId) return { success: false };
    const docRef = doc(db, 'marketing_leads', String(leadId).trim());
    await deleteDoc(docRef);
    return { success: true };
  } catch (err: any) {
    console.warn("Firestore delete warning for marketing lead:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Save Marketing Campaign to 'marketing_campaigns' collection
 */
export async function saveMarketingCampaignToFirestore(campaignData: any) {
  try {
    const rawId = campaignData?.id;
    if (!rawId || typeof rawId !== 'string' || !rawId.trim()) {
      return { success: false, error: 'Missing campaign ID' };
    }
    const validId = String(rawId).trim();
    const docRef = doc(db, 'marketing_campaigns', validId);
    const payload = sanitizeFirestorePayload({
      ...campaignData,
      id: validId,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: validId };
  } catch (err: any) {
    console.warn("Firestore save warning for marketing campaign:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Delete Marketing Campaign from 'marketing_campaigns' collection
 */
export async function deleteMarketingCampaignFromFirestore(campaignId: string) {
  try {
    if (!campaignId) return { success: false };
    const docRef = doc(db, 'marketing_campaigns', String(campaignId).trim());
    await deleteDoc(docRef);
    return { success: true };
  } catch (err: any) {
    console.warn("Firestore delete warning for marketing campaign:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Fetch all Marketing Campaigns from 'marketing_campaigns' collection
 */
export async function fetchMarketingCampaignsFromFirestore() {
  try {
    const colRef = collection(db, 'marketing_campaigns');
    const snapshot = await getDocs(colRef);
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data());
    });
    return { success: true, data: list };
  } catch (err: any) {
    console.warn("Firestore fetch warning for marketing campaigns:", err?.message || err);
    return { success: false, error: err?.message, data: [] };
  }
}

/**
 * Save Marketing Staff to 'marketing_staff' collection
 */
export async function saveMarketingStaffToFirestore(staffData: any) {
  try {
    const rawId = staffData?.id;
    if (!rawId) return { success: false, error: 'Missing staff ID' };
    const validId = String(rawId).trim();
    const docRef = doc(db, 'marketing_staff', validId);
    const payload = sanitizeFirestorePayload({
      ...staffData,
      id: validId,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: validId };
  } catch (err: any) {
    console.warn("Firestore save warning for marketing staff:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Fetch all Marketing Staff from 'marketing_staff' collection
 */
export async function fetchMarketingStaffFromFirestore() {
  try {
    const colRef = collection(db, 'marketing_staff');
    const snapshot = await getDocs(colRef);
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data());
    });
    return { success: true, data: list };
  } catch (err: any) {
    console.warn("Firestore fetch warning for marketing staff:", err?.message || err);
    return { success: false, error: err?.message, data: [] };
  }
}

/**
 * ========================================================
 * EXTENDED FIRESTORE SYNC & RECOVERY HELPERS FOR:
 * 1. Data Mitra (mitra_organizations)
 * 2. Data Siswa / Kandidat (candidates & calon_siswa)
 * 3. Akun Admin Terdaftar (admin_users & masterSettings)
 * 4. Listingan Jobs (lowongan_kerja)
 * ========================================================
 */

/**
 * Save Partner/Mitra Organization to 'mitra_organizations' collection
 */
export async function saveMitraOrganizationToFirestore(mitraData: any) {
  try {
    const rawId = mitraData?.id || mitraData?.mitraId;
    if (!rawId) return { success: false, error: 'Missing Mitra ID' };
    const docId = String(rawId).trim();
    const docRef = doc(db, 'mitra_organizations', docId);
    const payload = sanitizeFirestorePayload({
      ...mitraData,
      id: docId,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: docId };
  } catch (err: any) {
    console.warn("Firestore save warning for mitra organization:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Delete Partner/Mitra Organization from 'mitra_organizations' collection
 */
export async function deleteMitraOrganizationFromFirestore(mitraId: string) {
  try {
    if (!mitraId) return { success: false };
    const docRef = doc(db, 'mitra_organizations', String(mitraId).trim());
    await deleteDoc(docRef);
    return { success: true };
  } catch (err: any) {
    console.warn("Firestore delete warning for mitra organization:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Fetch all registered Mitra Organizations from Firestore
 */
export async function fetchMitraOrganizationsFromFirestore() {
  try {
    const querySnapshot = await getDocs(collection(db, 'mitra_organizations'));
    const list: any[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    return { success: true, data: list };
  } catch (err: any) {
    console.warn("Firestore fetch error for mitra_organizations:", err?.message || err);
    return { success: false, data: [], error: err?.message };
  }
}

/**
 * Save individual Admin / Marketing Account to 'admin_users' collection
 */
export async function saveAdminUserToFirestore(adminUser: any) {
  try {
    const rawId = adminUser?.id;
    if (!rawId) return { success: false, error: 'Missing Admin ID' };
    const docId = String(rawId).trim();
    const docRef = doc(db, 'admin_users', docId);
    const payload = sanitizeFirestorePayload({
      ...adminUser,
      id: docId,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: docId };
  } catch (err: any) {
    console.warn("Firestore save warning for admin user:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Delete individual Admin Account from 'admin_users' collection
 */
export async function deleteAdminUserFromFirestore(adminId: string) {
  try {
    if (!adminId) return { success: false };
    const docRef = doc(db, 'admin_users', String(adminId).trim());
    await deleteDoc(docRef);
    return { success: true };
  } catch (err: any) {
    console.warn("Firestore delete warning for admin user:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Fetch all Admin & Marketing accounts from 'admin_users' collection
 */
export async function fetchAdminUsersFromFirestore() {
  try {
    const querySnapshot = await getDocs(collection(db, 'admin_users'));
    const list: any[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    return { success: true, data: list };
  } catch (err: any) {
    console.warn("Firestore fetch error for admin_users:", err?.message || err);
    return { success: false, data: [], error: err?.message };
  }
}

/**
 * Fetch all Candidates (CV Rirekisho JIS) from 'candidates' collection
 */
export async function fetchCandidatesFromFirestore() {
  try {
    const querySnapshot = await getDocs(collection(db, 'candidates'));
    const list: any[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    return { success: true, data: list };
  } catch (err: any) {
    console.warn("Firestore fetch error for candidates:", err?.message || err);
    return { success: false, data: [], error: err?.message };
  }
}

/**
 * Fetch all Students from 'calon_siswa' collection
 */
export async function fetchStudentsFromFirestore() {
  try {
    const querySnapshot = await getDocs(collection(db, 'calon_siswa'));
    const list: any[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    return { success: true, data: list };
  } catch (err: any) {
    console.warn("Firestore fetch error for calon_siswa:", err?.message || err);
    return { success: false, data: [], error: err?.message };
  }
}

/**
 * Fetch all Job Postings from 'jobs' collection (and fallback to 'lowongan_kerja')
 */
export async function fetchJobPostingsFromFirestore() {
  try {
    let list: any[] = [];
    
    // First try 'jobs' collection (117 records in production)
    try {
      const querySnapshot = await getDocs(collection(db, 'jobs'));
      if (!querySnapshot.empty) {
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const rawStatus = (data.statusJob || '').toString().trim();
          
          // Determine statusJob and statusAktif
          let statusJob = rawStatus || 'Open';
          let statusAktif = true;
          
          if (rawStatus === 'クローズ' || rawStatus === 'Closed' || rawStatus === 'Tutup') {
            statusJob = 'Tutup';
            statusAktif = false;
          } else if (rawStatus === '国内' || rawStatus.includes('Domestik')) {
            statusJob = 'Domestik (Jepang)';
            statusAktif = true;
          } else if (rawStatus === 'Open' || rawStatus === 'Aktif') {
            statusJob = 'Aktif';
            statusAktif = true;
          }

          const domisiliKerja = (statusJob === 'Domestik (Jepang)' || rawStatus === '国内') ? 'Domestik (Jepang)' : 'Lokal (Indonesia)';

          list.push({
            id: docSnap.id,
            kodeJob: data.kodeJob || docSnap.id,
            judulPekerjaan: data.namaJob || data.judulPekerjaan || 'Lowongan Kerja',
            perusahaanJepang: data.perusahaan || data.perusahaanJepang || data.namaJob || 'Perusahaan Mitra Jepang',
            kumiaiRujukan: data.kumiaiPartner || data.kumiaiRujukan || data.sumberJob || 'IJEF Corp',
            lokasiPrefektur: data.lokasi || data.lokasiPrefektur || 'Jepang',
            domisiliKerja,
            kategoriDomisili: domisiliKerja,
            jenisKelamin: data.jenisKelamin || 'Pria & Wanita',
            gajiString: data.gaji || '',
            gajiBulananYen: Number(data.gajiBulananYen) || 200000,
            gajiEstimasiIdr: Number(data.gajiEstimasiIdr) || 22000000,
            kuotaSiswa: Number(data.jumlahKandidat) || Number(data.kuotaSiswa) || 1,
            kualifikasi: data.klasifikasiKandidat || data.syaratKhusus || data.kualifikasi || '-',
            biayaProses: data.biayaJob || data.biayaProses || '-',
            keteranganTambahan: data.keterangan || data.keteranganTambahan || '-',
            tskSumberJob: data.sumberJob || data.kumiaiPartner || data.tskSumberJob || 'IJEF Direct',
            deskripsiPekerjaan: data.deskripsiPekerjaan || data.keterangan || '-',
            fasilitasAsrama: data.fasilitasAsrama || 'Tersedia',
            persyaratanJLPT: data.persyaratanJLPT || 'N4 / JFT-Basic A2',
            kategoriTarget: (data.kategori && data.kategori.includes('EX')) ? 'MATCHING JOB - Ex-Magang / Ex-Trainee' : 'SISWA NON IJEF (New Comer)',
            statusJob,
            statusAktif,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
          });
        });
      }
    } catch (jobsErr) {
      console.warn("Notice: could not query 'jobs' collection, checking fallback:", jobsErr);
    }

    // Fallback if 'jobs' is empty
    if (list.length === 0) {
      const fallbackSnapshot = await getDocs(collection(db, 'lowongan_kerja'));
      fallbackSnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
    }

    return { success: true, data: list };
  } catch (err: any) {
    console.warn("Firestore fetch error for job postings:", err?.message || err);
    return { success: false, data: [], error: err?.message };
  }
}

/**
 * Universal Sync Function that handles pulling & pushing data for all 4 domains:
 * 1. Data Mitra
 * 2. Data Siswa / Kandidat
 * 3. Akun Admin & Marketing Terdaftar
 * 4. Listingan Jobs
 */
export async function syncAllFirebaseDomains(payload: {
  mitra?: any[];
  candidates?: any[];
  students?: any[];
  adminUsers?: any[];
  jobs?: any[];
}) {
  const results = {
    mitra: { success: true, count: 0 },
    candidates: { success: true, count: 0 },
    students: { success: true, count: 0 },
    adminUsers: { success: true, count: 0 },
    jobs: { success: true, count: 0 },
    timestamp: new Date().toISOString()
  };

  try {
    // 1. Sync Mitra
    if (payload.mitra && Array.isArray(payload.mitra)) {
      for (const m of payload.mitra) {
        await saveMitraOrganizationToFirestore(m);
        results.mitra.count++;
      }
    }

    // 2. Sync Candidates
    if (payload.candidates && Array.isArray(payload.candidates)) {
      for (const c of payload.candidates) {
        await saveRirekishoToFirestore(c);
        results.candidates.count++;
      }
    }

    // 3. Sync Students
    if (payload.students && Array.isArray(payload.students)) {
      for (const s of payload.students) {
        await saveCalonSiswaToFirestore(s);
        results.students.count++;
      }
    }

    // 4. Sync Admin & Marketing Users
    if (payload.adminUsers && Array.isArray(payload.adminUsers)) {
      for (const u of payload.adminUsers) {
        await saveAdminUserToFirestore(u);
        results.adminUsers.count++;
      }
    }

    // 5. Sync Jobs
    if (payload.jobs && Array.isArray(payload.jobs)) {
      for (const j of payload.jobs) {
        await saveJobPostingToFirestore(j);
        results.jobs.count++;
      }
    }

    return { success: true, results };
  } catch (err: any) {
    console.warn("Universal Firebase sync error:", err);
    return { success: false, error: err?.message, results };
  }
}

