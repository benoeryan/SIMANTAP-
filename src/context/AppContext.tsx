import React, { createContext, useContext, useState } from 'react';
import {
  CalonSiswa,
  HasilKesehatan,
  AsesmenDisc,
  AsesmenPsikotes,
  AplikasiDukunganDana,
  SuratPerjanjian,
  CVRirekisho,
  JobPosting,
  JobApplication,
  MitraApprovalSubmission,
  MarketingLead,
  CampaignItem,
  MarketingStaff,
  MasterSettings,
  AdminUser,
  AdminPortalCategoryMode
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_HEALTH,
  INITIAL_DISC,
  INITIAL_PSIKOTES,
  INITIAL_RIREKISHO,
  INITIAL_JOBS,
  INITIAL_MITRA_SUBMISSIONS,
  INITIAL_MITRA_ORGANIZATIONS
} from '../data/seedData';
import { DRIVE_GRADUATES_LIST } from '../data/googleDriveGraduatesData';
import { parseBackupCandidates, parseCandidateFromFirestore, extractNormalizedGender, extractPhotoUrl } from '../utils/firestoreBackupParser';
import {
  fetchCandidatesFromFirestore,
  fetchStudentsFromFirestore,
  fetchJobPostingsFromFirestore
} from '../lib/firebase';
import { saveSiswaToSupabase } from '../lib/supabase';
import { deduplicateAndMergeCandidates } from '../utils/duplicateDetector';
import {
  INITIAL_LEADS,
  INITIAL_CAMPAIGNS,
  INITIAL_MARKETING_STAFF
} from '../data/crmSeedData';
import { useLanguage } from './LanguageContext';
import { translations, AppLanguage, TranslationDictionary } from '../utils/translations';
import { normalizeLeadData } from '../utils/crmAuthUtils';
import { DEFAULT_INITIAL_ADMIN_USERS } from './AuthContext';

const DEFAULT_MASTER_SETTINGS: any = {
  baseProgramCost: 25000000,
  dt100DpPercent: 0,
  dt50DpPercent: 50,
  dp30DpPercent: 30,
  adminFeePercent: 2.5,
  tenorOptions: [3, 6, 12, 18, 24, 36],
  adminUsers: Array.from(
    new Map(
      [...DEFAULT_INITIAL_ADMIN_USERS, ...INITIAL_MITRA_ORGANIZATIONS].map((u) => [u.id || u.email, u])
    ).values()
  )
};

interface FirebaseSyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string;
  activeDomain: string | null;
  lastMessage?: string | null;
  counts: {
    mitra: number;
    students: number;
    admins: number;
    jobs: number;
    leads?: number;
  };
}

interface AppContextType {
  students: CalonSiswa[];
  setStudents?: React.Dispatch<React.SetStateAction<CalonSiswa[]>>;
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
  activeStudent: CalonSiswa | null;

  adminPortalCategoryMode: AdminPortalCategoryMode;
  setAdminPortalCategoryMode: (mode: AdminPortalCategoryMode) => void;

  leads: MarketingLead[];
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  activeLead: MarketingLead | null;
  marketingActiveTab: 'dashboard' | 'pipeline' | 'form' | 'table' | 'followup' | 'team' | 'campaigns' | 'settings' | 'logs';
  setMarketingActiveTab: (tab: any) => void;
  saveLead: (lead: MarketingLead, skipAutoIntegration?: boolean) => void;
  deleteLead: (leadId: string) => void;
  updateLeadStatus: (leadId: string, status: any, note?: string) => void;
  addFollowUpLog: (leadId: string, log: any) => void;
  registerAndIntegrateLeadToAllPortals: (lead: any) => any;

  campaigns: CampaignItem[];
  saveCampaign: (cmp: CampaignItem) => Promise<any>;
  deleteCampaign: (cmpId: string) => Promise<any>;
  updateCampaignStatus: (cmpId: string, status: any) => Promise<void>;

  marketingStaff: MarketingStaff[];
  saveMarketingStaffMember: (staff: MarketingStaff) => Promise<any>;
  updateStaffTarget: (staffId: string, targetBulanan: number, roleMarketing?: string, status?: 'AKTIF' | 'NONAKTIF') => Promise<void>;
  updateAllMarketingStaff: (staffList: MarketingStaff[]) => Promise<void>;

  healthRecords: Record<string, HasilKesehatan>;
  saveHealthRecord: (record: HasilKesehatan) => void;

  discRecords: Record<string, AsesmenDisc>;
  saveDiscRecord: (record: AsesmenDisc) => void;

  psikotesRecords: Record<string, AsesmenPsikotes>;
  savePsikotesRecord: (record: AsesmenPsikotes) => void;

  saveStudentRegistration: (studentData: CalonSiswa) => void;
  deleteStudent: (studentId: string) => void;
  forwardStudentToAdmin2: (studentId: string) => void;

  financingRecords: Record<string, AplikasiDukunganDana>;
  saveFinancingRecord: (record: AplikasiDukunganDana) => void;

  contractRecords: Record<string, SuratPerjanjian>;
  saveContractRecord: (record: SuratPerjanjian) => void;

  rirekishoRecords: Record<string, CVRirekisho>;
  setRirekishoRecords?: React.Dispatch<React.SetStateAction<Record<string, CVRirekisho>>>;
  saveRirekishoRecord: (record: CVRirekisho) => void;
  deleteRirekishoRecord: (id: string) => void;

  jobPostings: JobPosting[];
  saveJobPosting: (job: JobPosting) => void;
  deleteJobPosting: (jobId: string) => void;
  batchSaveJobPostings: (jobs: JobPosting[], replaceAll?: boolean) => void;
  jobApplications: JobApplication[];
  saveJobApplication: (app: JobApplication) => void;

  mitraSubmissions: MitraApprovalSubmission[];
  saveMitraSubmission: (submission: MitraApprovalSubmission) => void;
  updateMitraSubmissionStatus: (submissionId: string, status: any, reviewerInfo: any) => void;
  deleteMitraSubmission: (submissionId: string) => void;

  masterSettings: MasterSettings;
  updateMasterSettings: (newSettings: Partial<MasterSettings>) => void;

  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  t: TranslationDictionary;

  activeTab: 'portal' | 'kesehatan' | 'disc' | 'psikotes' | 'dana' | 'kontrak' | 'master' | 'settings' | 'petunjuk' | 'cv_portal_master' | 'job_matching' | 'interviews';
  setActiveTab: (tab: any) => void;

  searchTerm: string;
  setSearchTerm: (term: string) => void;

  firebaseSyncStatus: FirebaseSyncStatus;
  syncFirebaseDomain: (domain: any) => Promise<any>;
  refreshFirebaseDomain: (domain: any) => Promise<any>;
  saveMitraOrganization: (mitraData: any) => Promise<any>;
  deleteMitraOrganization: (mitraId: string) => Promise<any>;
  saveAdminAccount: (adminUser: AdminUser) => Promise<any>;
  deleteAdminAccount: (adminId: string) => Promise<any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<CalonSiswa[]>(() => {
    const studentMap = new Map<string, CalonSiswa>();
    const backup = parseBackupCandidates();
    backup.calonSiswaList.forEach(s => {
      if (s && s.id) {
        studentMap.set(s.id, s);
      }
    });
    if (studentMap.size === 0) {
      INITIAL_STUDENTS.forEach(s => studentMap.set(s.id, s));
      DRIVE_GRADUATES_LIST.forEach(g => {
        if (g.student && g.student.id) {
          studentMap.set(g.student.id, g.student);
        }
      });
    }
    const rawList = Array.from(studentMap.values());
    return deduplicateAndMergeCandidates(rawList);
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    return students.length > 0 ? students[0].id : null;
  });

  const activeStudent = React.useMemo(() => {
    if (!selectedStudentId) return students.length > 0 ? students[0] : null;
    return students.find((s) => s.id === selectedStudentId) || students[0] || null;
  }, [students, selectedStudentId]);

  const [adminPortalCategoryMode, setAdminPortalCategoryMode] = useState<AdminPortalCategoryMode>('ADMIN_1_IJEF');

  const [rirekishoRecords, setRirekishoRecords] = useState<Record<string, CVRirekisho>>(() => {
    const defaultMap: Record<string, CVRirekisho> = {};
    const backup = parseBackupCandidates();
    for (const [k, v] of Object.entries(backup.rirekishoMap)) {
      defaultMap[k] = v;
    }
    if (Object.keys(defaultMap).length === 0) {
      INITIAL_RIREKISHO.forEach(cv => {
        defaultMap[cv.siswaId || cv.id] = cv;
      });
      DRIVE_GRADUATES_LIST.forEach(g => {
        if (g.cv && (g.cv.siswaId || g.cv.id)) {
          defaultMap[g.cv.siswaId || g.cv.id] = g.cv;
        }
      });
    }
    const rawList = Object.values(defaultMap) as CVRirekisho[];
    const uniqueList = deduplicateAndMergeCandidates(rawList);
    const cleanMap: Record<string, CVRirekisho> = {};
    uniqueList.forEach(cv => {
      cleanMap[cv.siswaId || cv.id] = cv;
    });
    return cleanMap;
  });

  const [jobPostings, setJobPostings] = useState<JobPosting[]>(() => INITIAL_JOBS);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [mitraSubmissions, setMitraSubmissions] = useState<MitraApprovalSubmission[]>(() => INITIAL_MITRA_SUBMISSIONS);
  const [contractRecords, setContractRecords] = useState<Record<string, SuratPerjanjian>>({});

  const [leads, setLeads] = useState<MarketingLead[]>(() => {
    const leadMap = new Map<string, MarketingLead>();
    INITIAL_LEADS.forEach(l => leadMap.set(l.id, normalizeLeadData(l)));

    INITIAL_STUDENTS.forEach(s => {
      const leadId = `LEAD-STD-${s.id}`;
      if (!leadMap.has(leadId)) {
        leadMap.set(leadId, normalizeLeadData({
          id: leadId,
          namaLengkap: s.namaLengkap,
          noWhatsapp: s.noHp || '-',
          email: s.email || `${s.id.toLowerCase()}@example.com`,
          kotaDomisili: s.alamatDomisili || '-',
          statusLead: 'DEAL_TERDAFTAR',
          programDiminati: s.kategoriKandidat || 'SISWA IJEF - Offline',
          sumberLead: 'Website Resmi IJEF',
          createdAt: s.createdAt || new Date().toISOString()
        } as any));
      }
    });

    DRIVE_GRADUATES_LIST.forEach(g => {
      if (g.student) {
        const s = g.student;
        const leadId = `LEAD-STD-${s.id}`;
        if (!leadMap.has(leadId)) {
          leadMap.set(leadId, normalizeLeadData({
            id: leadId,
            namaLengkap: s.namaLengkap,
            noWhatsapp: s.noHp || '-',
            email: s.email || `${s.id.toLowerCase()}@example.com`,
            kotaDomisili: s.alamatDomisili || '-',
            statusLead: 'DEAL_TERDAFTAR',
            programDiminati: s.kategoriKandidat || 'SISWA IJEF - Offline',
            sumberLead: 'Google Drive / Firebase',
            createdAt: s.createdAt || new Date().toISOString()
          } as any));
        }
      }
    });

    const backup = parseBackupCandidates();
    backup.calonSiswaList.forEach(s => {
      if (s && s.id) {
        const leadId = `LEAD-STD-${s.id}`;
        if (!leadMap.has(leadId)) {
          leadMap.set(leadId, normalizeLeadData({
            id: leadId,
            namaLengkap: s.namaLengkap,
            noWhatsapp: s.noHp || '-',
            email: s.email || `${s.id.toLowerCase()}@example.com`,
            kotaDomisili: s.alamatDomisili || '-',
            statusLead: 'DEAL_TERDAFTAR',
            programDiminati: s.kategoriKandidat || 'SISWA IJEF - Offline',
            sumberLead: 'Firestore Backup',
            createdAt: s.createdAt || new Date().toISOString()
          } as any));
        }
      }
    });

    return Array.from(leadMap.values());
  });
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(() => INITIAL_CAMPAIGNS);
  const [marketingStaff, setMarketingStaff] = useState<MarketingStaff[]>(() => INITIAL_MARKETING_STAFF);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(() => INITIAL_LEADS.length > 0 ? INITIAL_LEADS[0].id : null);
  const activeLead = React.useMemo(() => {
    if (!selectedLeadId) return leads.length > 0 ? leads[0] : null;
    return leads.find(l => l.id === selectedLeadId) || leads[0] || null;
  }, [leads, selectedLeadId]);

  const [healthRecords, setHealthRecords] = useState<Record<string, HasilKesehatan>>(() => {
    const map: Record<string, HasilKesehatan> = {};
    DRIVE_GRADUATES_LIST.forEach(g => {
      if (g.student && g.student.id && g.health) {
        map[g.student.id] = g.health;
      }
    });
    return map;
  });
  const [discRecords, setDiscRecords] = useState<Record<string, AsesmenDisc>>(() => {
    const map: Record<string, AsesmenDisc> = {};
    DRIVE_GRADUATES_LIST.forEach(g => {
      if (g.student && g.student.id && g.disc) {
        map[g.student.id] = g.disc;
      }
    });
    return map;
  });
  const [psikotesRecords, setPsikotesRecords] = useState<Record<string, AsesmenPsikotes>>(() => {
    const map: Record<string, AsesmenPsikotes> = {};
    DRIVE_GRADUATES_LIST.forEach(g => {
      if (g.student && g.student.id && g.psikotes) {
        map[g.student.id] = g.psikotes;
      }
    });
    return map;
  });
  const [financingRecords, setFinancingRecords] = useState<Record<string, AplikasiDukunganDana>>({});

  const [activeTab, setActiveTab] = useState<any>('master');
  const [marketingActiveTab, setMarketingActiveTab] = useState<any>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations.id;

  const [masterSettings, setMasterSettings] = useState<MasterSettings>(() => {
    const rawAdmins = [...(DEFAULT_MASTER_SETTINGS.adminUsers || []), ...INITIAL_MITRA_ORGANIZATIONS];
    const map = new Map<string, any>();
    rawAdmins.forEach(u => {
      if (u && u.id) {
        map.set(u.id, u);
      }
    });
    return {
      ...DEFAULT_MASTER_SETTINGS,
      adminUsers: Array.from(map.values())
    };
  });

  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<FirebaseSyncStatus>({
    isConnected: true,
    isSyncing: false,
    lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
    activeDomain: null,
    counts: {
      mitra: INITIAL_MITRA_ORGANIZATIONS?.length || 5,
      students: students.length,
      admins: DEFAULT_MASTER_SETTINGS?.adminUsers?.length || 3,
      jobs: INITIAL_JOBS?.length || 12,
      leads: INITIAL_LEADS?.length || 15
    },
    lastMessage: null
  });

  const saveLead = (lead: MarketingLead) => {
    setLeads(prev => {
      const idx = prev.findIndex(l => l.id === lead.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = lead;
        return copy;
      }
      return [lead, ...prev];
    });
  };

  const deleteLead = (leadId: string) => {
    setLeads(prev => prev.filter(l => l.id !== leadId));
  };

  const updateLeadStatus = (leadId: string, status: any) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, statusLead: status } : l));
  };

  const addFollowUpLog = (leadId: string, log: any) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, riwayatFollowUp: [...(l.riwayatFollowUp || []), { id: `FL-${Date.now()}`, ...log }] } : l));
  };

  const registerAndIntegrateLeadToAllPortals = (lead: any) => {
    const studentId = `SISWA-${Date.now().toString().slice(-6)}`;
    const newStudent: CalonSiswa = {
      id: studentId,
      namaLengkap: lead.namaLengkap || 'Siswa Baru',
      noHp: lead.noWhatsapp || '',
      email: lead.email || `${studentId}@ijef.com`,
      kategoriKandidat: lead.kategoriKandidat || 'SISWA NON IJEF',
      kewarganegaraan: 'WNI',
      noKtp: lead.nikKtp || '3201000000000000',
      noKk: '3201000000000000',
      alamatDomisili: lead.alamatLengkap || 'Bandung',
      tempatLahir: 'Bandung',
      tanggalLahir: '2001-01-01',
      agama: 'Islam',
      jenisKelamin: 'Laki-laki',
      golonganDarah: 'O',
      statusPerkawinan: 'Lajang',
      namaAyah: '',
      pekerjaanAyah: '',
      ktpNpwpAyah: '',
      namaIbu: '',
      pekerjaanIbu: '',
      ktpNpwpIbu: '',
      berkasDokumen: {},
      statusPendaftaran: 'Terverifikasi',
      createdAt: new Date().toISOString()
    };
    setStudents(prev => [newStudent, ...prev]);
    setSelectedStudentId(studentId);
    return { studentId, success: true };
  };

  const saveCampaign = async (cmp: CampaignItem) => {
    setCampaigns(prev => [cmp, ...prev]);
    return { success: true };
  };

  const deleteCampaign = async (cmpId: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== cmpId));
    return { success: true };
  };

  const updateCampaignStatus = async (cmpId: string, status: any) => {
    setCampaigns(prev => prev.map(c => c.id === cmpId ? { ...c, status } : c));
  };

  const saveMarketingStaffMember = async (staff: MarketingStaff) => {
    setMarketingStaff(prev => [...prev, staff]);
    return { success: true };
  };

  const updateStaffTarget = async (staffId: string, targetBulanan: number) => {
    setMarketingStaff(prev => prev.map(s => s.id === staffId ? { ...s, targetBulanan } : s));
  };

  const updateAllMarketingStaff = async (staffList: MarketingStaff[]) => {
    setMarketingStaff(staffList);
  };

  const saveHealthRecord = (record: HasilKesehatan) => {
    setHealthRecords(prev => ({ ...prev, [record.siswaId]: record }));
  };

  const saveDiscRecord = (record: AsesmenDisc) => {
    setDiscRecords(prev => ({ ...prev, [record.siswaId]: record }));
  };

  const savePsikotesRecord = (record: AsesmenPsikotes) => {
    setPsikotesRecords(prev => ({ ...prev, [record.siswaId]: record }));
  };

  const saveStudentRegistration = (studentData: CalonSiswa) => {
    setStudents(prev => {
      const idx = prev.findIndex(s => s.id === studentData.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = studentData;
        return copy;
      }
      return [studentData, ...prev];
    });
    setSelectedStudentId(studentData.id);
  };

  const deleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const forwardStudentToAdmin2 = (studentId: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, statusPendaftaran: 'Diterima' } : s));
  };

  const saveFinancingRecord = (record: AplikasiDukunganDana) => {
    setFinancingRecords(prev => ({ ...prev, [record.siswaId]: record }));
  };

  const saveContractRecord = (record: SuratPerjanjian) => {
    setContractRecords(prev => ({ ...prev, [record.siswaId]: record }));
  };

  const saveRirekishoRecord = (record: CVRirekisho) => {
    setRirekishoRecords(prev => ({ ...prev, [record.siswaId || record.id]: record }));
    try {
      saveSiswaToSupabase(record).catch((err) => console.error('Supabase save error:', err));
    } catch (e) {}
  };

  const deleteRirekishoRecord = (id: string) => {
    setRirekishoRecords(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const saveJobPosting = (job: JobPosting) => {
    setJobPostings(prev => [job, ...prev]);
  };

  const deleteJobPosting = (jobId: string) => {
    setJobPostings(prev => prev.filter(j => j.id !== jobId));
  };

  const batchSaveJobPostings = (jobs: JobPosting[]) => {
    setJobPostings(jobs);
  };

  const saveJobApplication = (app: JobApplication) => {
    setJobApplications(prev => [app, ...prev]);
  };

  const saveMitraSubmission = (sub: MitraApprovalSubmission) => {
    setMitraSubmissions(prev => [sub, ...prev]);
  };

  const updateMitraSubmissionStatus = (submissionId: string, status: any) => {
    setMitraSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, statusPersetujuan: status } : s));
  };

  const deleteMitraSubmission = (submissionId: string) => {
    setMitraSubmissions(prev => prev.filter(s => s.id !== submissionId));
  };

  const updateMasterSettings = (newSettings: Partial<MasterSettings>) => {
    setMasterSettings(prev => ({ ...prev, ...newSettings }));
  };

  function deduplicateStudents(list: CalonSiswa[]): CalonSiswa[] {
    const map = new Map<string, CalonSiswa>();
    list.forEach(s => {
      if (!s) return;
      const emailKey = (s.email || '').trim().toLowerCase();
      const ktpKey = (s.noKtp || '').trim();
      const nameKey = (s.namaLengkap || '').trim().toLowerCase();
      const idKey = (s.id || '').trim();

      let key = '';
      if (emailKey && emailKey !== '-' && !emailKey.includes('@example.com')) {
        key = `email:${emailKey}`;
      } else if (ktpKey && ktpKey !== '-') {
        key = `ktp:${ktpKey}`;
      } else if (nameKey && nameKey !== '-' && nameKey !== 'kandidat firebase') {
        key = `name:${nameKey}`;
      } else {
        key = `id:${idKey}`;
      }

      if (!map.has(key)) {
        map.set(key, s);
      } else {
        const existing = map.get(key)!;
        map.set(key, {
          ...existing,
          ...s,
          jenisKelamin: s.jenisKelamin || existing.jenisKelamin || s.gender || existing.gender || 'Laki-laki',
          berkasDokumen: {
            ...(existing.berkasDokumen || {}),
            ...(s.berkasDokumen || {})
          }
        });
      }
    });
    return Array.from(map.values());
  }

  const syncFirebaseDomain = async () => {
    try {
      setFirebaseSyncStatus(prev => ({ ...prev, isSyncing: true, lastMessage: 'Menghubungkan & Menarik Data dari Firebase Firestore...' }));
      const [candRes, studRes, jobRes] = await Promise.all([
        fetchCandidatesFromFirestore(),
        fetchStudentsFromFirestore(),
        fetchJobPostingsFromFirestore()
      ]);

      const baseMap = new Map<string, CalonSiswa>();
      students.forEach(s => {
        if (s && s.id) baseMap.set(s.id, s);
      });

      if (studRes.success && studRes.data && studRes.data.length > 0) {
        studRes.data.forEach((s: any) => {
          if (!s || !s.id) return;
          const existing = baseMap.get(s.id);
          const sPhoto = extractPhotoUrl(s) || existing?.pasPhoto || '';
          const sGender = extractNormalizedGender(s) || extractNormalizedGender(existing);
          baseMap.set(s.id, {
            ...(existing || {}),
            ...s,
            jenisKelamin: sGender,
            pasPhoto: sPhoto,
            berkasDokumen: {
              ...(existing?.berkasDokumen || {}),
              ...(s.berkasDokumen || {}),
              ...(sPhoto ? { pasFoto: sPhoto } : {})
            }
          });
        });
      }

      if (candRes.success && candRes.data && candRes.data.length > 0) {
        candRes.data.forEach((c: any) => {
          if (!c) return;
          const sId = c.siswaId || c.id;
          const cEmail = (c.email || '').trim().toLowerCase();
          const cKtp = (c.noKtp || c.nik || '').trim();
          const cName = (c.namaLengkap || '').trim().toLowerCase();
          const cGender = extractNormalizedGender(c);

          let foundKey: string | null = null;
          for (const [k, item] of baseMap.entries()) {
            if (k === sId || k === c.id) { foundKey = k; break; }
            if (cEmail && cEmail !== '-' && !cEmail.includes('@example.com') && item.email && item.email.trim().toLowerCase() === cEmail) { foundKey = k; break; }
            if (cKtp && cKtp !== '-' && item.noKtp && item.noKtp.trim() === cKtp) { foundKey = k; break; }
            if (cName && cName !== '-' && cName !== 'kandidat firebase' && item.namaLengkap && item.namaLengkap.trim().toLowerCase() === cName) { foundKey = k; break; }
          }

          const photoUrl = extractPhotoUrl(c);
          if (foundKey) {
            const existing = baseMap.get(foundKey)!;
            const resolvedPhoto = photoUrl || existing.berkasDokumen?.pasFoto || existing.pasPhoto || '';
            baseMap.set(foundKey, {
              ...existing,
              namaLengkap: c.namaLengkap || existing.namaLengkap,
              jenisKelamin: cGender || existing.jenisKelamin,
              noKtp: c.noKtp || c.nik || existing.noKtp,
              alamatDomisili: c.alamatDomisili || c.alamat || existing.alamatDomisili,
              email: c.email || existing.email,
              noHp: c.noHp || existing.noHp,
              kategoriKandidat: c.kategoriKandidat || existing.kategoriKandidat,
              pasPhoto: resolvedPhoto,
              berkasDokumen: {
                ...(existing.berkasDokumen || {}),
                ...(resolvedPhoto ? { pasFoto: resolvedPhoto } : {})
              }
            });
          } else {
            baseMap.set(sId, {
              id: sId,
              namaLengkap: c.namaLengkap || 'Kandidat Firebase',
              email: c.email || '',
              noHp: c.noHp || '',
              jenisKelamin: cGender,
              noKtp: c.noKtp || c.nik || '',
              alamatDomisili: c.alamatDomisili || c.alamat || '',
              kategoriKandidat: c.kategoriKandidat || 'SISWA NON IJEF (New Comer)',
              berkasDokumen: {
                ...(photoUrl ? { pasFoto: photoUrl } : {})
              },
              pasPhoto: photoUrl,
              statusPendaftaran: 'Terverifikasi',
              createdAt: c.createdAt || c.submittedAt || new Date().toISOString()
            } as any);
          }
        });
      }

      const updatedStudents = Array.from(baseMap.values());
      const cleanStudents = deduplicateStudents(updatedStudents);
      setStudents(cleanStudents);
      if (studRes.success && studRes.data && studRes.data.length > 0) {
        studRes.data.forEach((s: any) => {
          const sPhoto = s.berkasDokumen?.pasFoto || s.berkasDokumen?.pasPhoto || s.pasPhoto || s.pasFoto || s.pasFotoUrl || '';
          const idx = updatedStudents.findIndex(item => item.id === s.id);
          if (idx >= 0) {
            const existing = updatedStudents[idx];
            const finalPhoto = sPhoto || existing.berkasDokumen?.pasFoto || (existing as any).pasPhoto || (existing as any).pasFoto || '';
            updatedStudents[idx] = {
              ...existing,
              ...s,
              berkasDokumen: {
                ...(existing.berkasDokumen || {}),
                ...(s.berkasDokumen || {}),
                ...(finalPhoto ? { pasFoto: finalPhoto } : {})
              },
              pasPhoto: finalPhoto,
              pasFoto: finalPhoto
            };
          } else {
            updatedStudents.push({
              ...s,
              berkasDokumen: {
                ...(s.berkasDokumen || {}),
                ...(sPhoto ? { pasFoto: sPhoto } : {})
              },
              pasPhoto: sPhoto,
              pasFoto: sPhoto
            });
          }
        });
      }
      if (candRes.success && candRes.data && candRes.data.length > 0) {
        candRes.data.forEach((c: any) => {
          const sId = c.siswaId || c.id;
          const photoUrl = c.pasPhoto || c.pasFoto || c.pasFotoUrl || c.fotoUrl || c.photoUrl || c.berkasDokumen?.pasFoto || '';
          const idx = updatedStudents.findIndex(item => item.id === sId);
          if (idx >= 0) {
            const existing = updatedStudents[idx];
            const resolvedPhoto = photoUrl || existing.berkasDokumen?.pasFoto || (existing as any).pasPhoto || (existing as any).pasFoto || '';
            updatedStudents[idx] = {
              ...existing,
              namaLengkap: c.namaLengkap || existing.namaLengkap,
              berkasDokumen: {
                ...(existing.berkasDokumen || {}),
                ...(resolvedPhoto ? { pasFoto: resolvedPhoto } : {})
              },
              pasPhoto: resolvedPhoto,
              pasFoto: resolvedPhoto,
              email: c.email || existing.email,
              noHp: c.noHp || existing.noHp,
              kategoriKandidat: c.kategoriKandidat || existing.kategoriKandidat
            };
          } else {
            updatedStudents.push({
              id: sId,
              namaLengkap: c.namaLengkap || 'Kandidat Firebase',
              email: c.email || '',
              noHp: c.noHp || '',
              kategoriKandidat: c.kategoriKandidat || 'SISWA NON IJEF (New Comer)',
              berkasDokumen: {
                ...(photoUrl ? { pasFoto: photoUrl } : {})
              },
              pasPhoto: photoUrl,
              pasFoto: photoUrl,
              statusPendaftaran: 'Terverifikasi',
              createdAt: c.createdAt || c.submittedAt || new Date().toISOString()
            } as any);
          }
        });
      }

      if (updatedStudents.length > 0) {
        const cleanStudents = deduplicateStudents(updatedStudents);
        setStudents(cleanStudents);
        setLeads(prevLeads => {
          const leadMap = new Map<string, MarketingLead>();
          prevLeads.forEach(l => leadMap.set(l.id, l));
          cleanStudents.forEach(s => {
            const leadId = `LEAD-STD-${s.id}`;
            if (!leadMap.has(leadId)) {
              leadMap.set(leadId, normalizeLeadData({
                id: leadId,
                namaLengkap: s.namaLengkap,
                noWhatsapp: s.noHp || '-',
                email: s.email || `${s.id.toLowerCase()}@example.com`,
                kotaDomisili: s.alamatDomisili || '-',
                statusLead: 'DEAL_TERDAFTAR',
                programDiminati: s.kategoriKandidat || 'SISWA IJEF - Offline',
                sumberLead: 'Firebase Firestore',
                createdAt: s.createdAt || new Date().toISOString()
              } as any));
            } else {
              const existing = leadMap.get(leadId)!;
              leadMap.set(leadId, {
                ...existing,
                namaLengkap: s.namaLengkap || existing.namaLengkap,
                noWhatsapp: s.noHp || existing.noWhatsapp,
                email: s.email || existing.email
              });
            }
          });
          return Array.from(leadMap.values());
        });
      }

      if (jobRes.success && jobRes.data && jobRes.data.length > 0) {
        setJobPostings(jobRes.data);
      }

      if (candRes.success && candRes.data && candRes.data.length > 0) {
        setRirekishoRecords(prev => {
          const cvMap: Record<string, CVRirekisho> = { ...prev };
          candRes.data.forEach((cv: any) => {
            const key = cv.siswaId || cv.id;
            const parsed = parseCandidateFromFirestore(key, cv);
            const photo = cv.pasPhoto || cv.pasFotoUrl || cv.pasFoto || cv.fotoUrl || cv.photoUrl || parsed?.pasFotoUrl || cvMap[key]?.pasFotoUrl || cvMap[key]?.pasPhoto || '';
            cvMap[key] = {
              ...(cvMap[key] || {}),
              ...cv,
              ...(parsed || {}),
              pasPhoto: photo,
              pasFoto: photo,
              pasFotoUrl: photo
            };
          });
          return cvMap;
        });
      }

      setFirebaseSyncStatus(prev => ({
        ...prev,
        isConnected: true,
        isSyncing: false,
        lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
        counts: {
          ...prev.counts,
          students: updatedStudents.length,
          jobs: jobRes.success ? jobRes.data.length : prev.counts.jobs
        },
        lastMessage: 'Sinkronisasi data Firebase Firestore berhasil!'
      }));
      return { success: true, count: updatedStudents.length };
    } catch (err: any) {
      setFirebaseSyncStatus(prev => ({ ...prev, isSyncing: false, lastMessage: 'Gagal sinkronisasi: ' + (err?.message || err) }));
      return { success: false, error: err?.message };
    }
  };

  const refreshFirebaseDomain = async () => {
    return await syncFirebaseDomain();
  };

  React.useEffect(() => {
    syncFirebaseDomain();
  }, []);
  const saveMitraOrganization = async (m: any) => ({ success: true, id: m.id });
  const deleteMitraOrganization = async () => ({ success: true });
  const saveAdminAccount = async (a: any) => ({ success: true, id: a.id });
  const deleteAdminAccount = async () => ({ success: true });

  return (
    <AppContext.Provider
      value={{
        students,
        setStudents,
        selectedStudentId,
        setSelectedStudentId,
        activeStudent,
        adminPortalCategoryMode,
        setAdminPortalCategoryMode,
        leads,
        selectedLeadId,
        setSelectedLeadId,
        activeLead,
        marketingActiveTab,
        setMarketingActiveTab,
        saveLead,
        deleteLead,
        updateLeadStatus,
        addFollowUpLog,
        registerAndIntegrateLeadToAllPortals,
        campaigns,
        saveCampaign,
        deleteCampaign,
        updateCampaignStatus,
        marketingStaff,
        saveMarketingStaffMember,
        updateStaffTarget,
        updateAllMarketingStaff,
        healthRecords,
        saveHealthRecord,
        discRecords,
        saveDiscRecord,
        psikotesRecords,
        savePsikotesRecord,
        saveStudentRegistration,
        deleteStudent,
        forwardStudentToAdmin2,
        financingRecords,
        saveFinancingRecord,
        contractRecords,
        saveContractRecord,
        rirekishoRecords,
        setRirekishoRecords,
        saveRirekishoRecord,
        deleteRirekishoRecord,
        jobPostings,
        saveJobPosting,
        deleteJobPosting,
        batchSaveJobPostings,
        jobApplications,
        saveJobApplication,
        mitraSubmissions,
        saveMitraSubmission,
        updateMitraSubmissionStatus,
        deleteMitraSubmission,
        masterSettings,
        updateMasterSettings,
        lang,
        setLang,
        t,
        activeTab,
        setActiveTab,
        searchTerm,
        setSearchTerm,
        firebaseSyncStatus,
        syncFirebaseDomain,
        refreshFirebaseDomain,
        saveMitraOrganization,
        deleteMitraOrganization,
        saveAdminAccount,
        deleteAdminAccount
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
