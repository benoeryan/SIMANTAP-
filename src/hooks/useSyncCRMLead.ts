import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, getDocs, updateDoc, addDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { CandidateCategory } from '../types';

export interface CRMLeadData {
  id: string;
  namaLengkap: string;
  email: string;
  whatsapp: string;
  kategoriKandidat: CandidateCategory;
  program?: string;
  statusLead: string;
}

export interface UseSyncCRMLeadReturn {
  leadData: CRMLeadData | null;
  isSynced: boolean;
  loading: boolean;
  error: string | null;
  refetchSync: () => Promise<CRMLeadData | null>;
}

/**
 * Custom React Hook: useSyncCRMLead
 * 
 * Workflow:
 * 1. Reads current authenticated user email from Firebase Auth / AuthContext.
 * 2. Queries 'crm_leads' collection in Firestore where 'email' == authEmail.
 * 3. Reads locked "EMAIL" and "KATEGORI KANDIDAT" from the CRM record.
 * 4. Routes student directly to their respective candidate portal category!
 */
export function useSyncCRMLead(): UseSyncCRMLeadReturn {
  const { user } = useAuth();
  const [leadData, setLeadData] = useState<CRMLeadData | null>(null);
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const userEmail = user?.email;
  const displayName = user?.displayName;

  const syncLeadData = useCallback(async (): Promise<CRMLeadData | null> => {
    if (!userEmail) {
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const normalizedEmail = userEmail.trim().toLowerCase();
      const cleanDisplayName = displayName?.trim() || '';
      const crmRef = collection(db, 'crm_leads');
      
      // 1. Primary Query: Firestore crm_leads collection by exact email match
      let q = query(crmRef, where('email', '==', normalizedEmail));
      let querySnapshot = await getDocs(q);

      // 2. Secondary Query: If not found, try matching name (e.g. Desy Nurlela / Rian Hidayat)
      if (querySnapshot.empty && cleanDisplayName) {
        q = query(crmRef, where('namaLengkap', '==', cleanDisplayName));
        querySnapshot = await getDocs(q);
      }

      // Check default fallback categories based on email or name
      const isRian = normalizedEmail.includes('rian') || normalizedEmail.includes('newcomer') || cleanDisplayName.toLowerCase().includes('rian');
      const isAgus = normalizedEmail.includes('agus') || normalizedEmail.includes('engineering') || normalizedEmail.includes('gijinkoku') || cleanDisplayName.toLowerCase().includes('agus');
      const isTitin = normalizedEmail.includes('titin') || normalizedEmail.includes('exmagang') || normalizedEmail.includes('ex-magang') || cleanDisplayName.toLowerCase().includes('titin');
      const isOnline = normalizedEmail.includes('online') || normalizedEmail.includes('anisa') || cleanDisplayName.toLowerCase().includes('anisa');
      const isDanang = normalizedEmail.includes('danang') || normalizedEmail.includes('mitra') || cleanDisplayName.toLowerCase().includes('danang');

      let defaultCategory: CandidateCategory = 'SISWA IJEF - Offline';
      if (isRian) defaultCategory = 'SISWA NON IJEF (New Comer)';
      else if (isAgus) defaultCategory = 'MATCHING JOB - Engineering / Gijinkoku';
      else if (isTitin) defaultCategory = 'MATCHING JOB - Ex-Magang / Ex-Trainee';
      else if (isOnline) defaultCategory = 'SISWA IJEF - Online';
      else if (isDanang) defaultCategory = 'SISWA MITRA / NON IJEF';

      if (!querySnapshot.empty) {
        const leadDoc = querySnapshot.docs[0];
        const data = leadDoc.data();

        const categoryFromCRM: CandidateCategory = data.kategoriKandidat || data.kategori || defaultCategory;

        const fetchedLead: CRMLeadData = {
          id: leadDoc.id,
          namaLengkap: data.namaLengkap || data.nama || cleanDisplayName || 'Calon Siswa IJEF',
          email: data.email || normalizedEmail,
          whatsapp: data.whatsapp || data.noHp || data.phone || '085712345678',
          kategoriKandidat: categoryFromCRM,
          program: data.program || 'Program Pelatihan & Matching Kerja Jepang',
          statusLead: 'Portal Registered'
        };

        // Update statusLead & kategoriKandidat in 'crm_leads' collection
        try {
          const leadDocRef = doc(db, 'crm_leads', leadDoc.id);
          await updateDoc(leadDocRef, {
            statusLead: 'Portal Registered',
            kategoriKandidat: categoryFromCRM,
            registeredAt: serverTimestamp(),
            updatedAt: new Date().toISOString()
          });
        } catch (updateErr: any) {
          console.warn('[useSyncCRMLead] Note: Firestore statusLead update notice:', updateErr?.message || updateErr);
        }

        setLeadData((prev) => {
          if (
            prev &&
            prev.id === fetchedLead.id &&
            prev.email === fetchedLead.email &&
            prev.kategoriKandidat === fetchedLead.kategoriKandidat
          ) {
            return prev;
          }
          return fetchedLead;
        });
        setIsSynced(true);
        setLoading(false);
        return fetchedLead;
      } else {
        // Auto-seed/sync candidate into 'crm_leads' Firestore collection
        const defaultName = cleanDisplayName || 'Calon Siswa IJEF';
        const defaultPhone = '081234567890';
        const defaultProgram = 'Program Pelatihan & Matching Job Jepang';

        const leadObj: CRMLeadData = {
          id: `lead_${Date.now()}`,
          namaLengkap: defaultName,
          email: normalizedEmail,
          whatsapp: defaultPhone,
          kategoriKandidat: defaultCategory,
          program: defaultProgram,
          statusLead: 'Portal Registered'
        };

        try {
          await addDoc(crmRef, {
            ...leadObj,
            registeredAt: serverTimestamp(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } catch (addErr: any) {
          console.warn('[useSyncCRMLead] Auto-seed CRM lead warning:', addErr?.message || addErr);
        }

        setLeadData((prev) => {
          if (
            prev &&
            prev.email === leadObj.email &&
            prev.kategoriKandidat === leadObj.kategoriKandidat
          ) {
            return prev;
          }
          return leadObj;
        });
        setIsSynced(true);
        setLoading(false);
        return leadObj;
      }
    } catch (err: any) {
      console.warn('[useSyncCRMLead] Firestore lead sync error:', err?.message || err);
      setError(err?.message || 'Gagal menyinkronkan data lead dari koleksi CRM.');
      setLeadData(null);
      setIsSynced(false);
      setLoading(false);
      return null;
    }
  }, [userEmail, displayName]);

  useEffect(() => {
    syncLeadData();
  }, [syncLeadData]);

  return useMemo(
    () => ({
      leadData,
      isSynced,
      loading,
      error,
      refetchSync: syncLeadData
    }),
    [leadData, isSynced, loading, error, syncLeadData]
  );
}

export default useSyncCRMLead;
