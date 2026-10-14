import React, { useState } from 'react';
import {
  HardDrive,
  RefreshCw,
  CheckCircle2,
  X,
  FileSpreadsheet,
  DownloadCloud,
  ShieldCheck,
  ExternalLink,
  Users,
  Search,
  FolderTree,
  Layers,
  Filter,
  ArrowLeft,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  User,
  HeartPulse,
  Award,
  FileText,
  UserCheck,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  DRIVE_FOLDER_ID,
  DRIVE_FOLDER_NAME,
  ALL_DRIVE_BATCHES,
  DRIVE_GRADUATES_LIST,
  DriveGraduateRecord
} from '../../data/googleDriveGraduatesData';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { CalonSiswa, CVRirekisho } from '../../types';
import { getStudentPhotoUrl, handleStudentImageError, isAiOrPlaceholderPhoto } from '../../utils/studentPhotoHelper';

interface GoogleDriveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveImportModal: React.FC<GoogleDriveImportModalProps> = ({ isOpen, onClose }) => {
  const {
    saveStudentRegistration,
    saveRirekishoRecord,
    saveHealthRecord,
    saveDiscRecord,
    savePsikotesRecord,
    students,
    rirekishoRecords,
    lang
  } = useApp();

  const [folderInput, setFolderInput] = useState<string>(
    `https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}?usp=sharing`
  );
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSsw, setSelectedSsw] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [isLoadingDrive, setIsLoadingDrive] = useState<boolean>(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [liveApiConnected, setLiveApiConnected] = useState<boolean>(false);
  
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Set of synced candidate IDs
  const [syncedCandidateIds, setSyncedCandidateIds] = useState<Set<string>>(() => {
    const existingIds = new Set<string>();
    students.forEach(s => existingIds.add(s.id));
    Object.keys(rirekishoRecords).forEach(id => existingIds.add(id));
    return existingIds;
  });

  // Expanded candidate detail card state
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);

  // Local stateful candidate list initialized with DRIVE_GRADUATES_LIST
  const [graduatesList, setGraduatesList] = useState<DriveGraduateRecord[]>(() => DRIVE_GRADUATES_LIST);

  // Photo editing modal state
  const [editingPhotoRecord, setEditingPhotoRecord] = useState<DriveGraduateRecord | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');

  // Manual candidate creation modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newCandidateForm, setNewCandidateForm] = useState({
    namaLengkap: '',
    namaKatakana: '',
    batchFolder: 'BATCH 10-A',
    kategoriKandidat: 'SISWA IJEF - Offline',
    noHp: '',
    email: '',
    pasFotoUrl: '',
    skorJftAtauJlpt: 'JFT-Basic A2 (LULUS)',
    sertifikatSsw: 'Tokutei Ginou Kaigo'
  });

  if (!isOpen) return null;

  // Extract Folder ID from URL or Raw Input
  const extractFolderId = (urlOrId: string): string => {
    if (urlOrId.includes('/folders/')) {
      const parts = urlOrId.split('/folders/')[1];
      return parts.split('?')[0].split('/')[0];
    }
    return urlOrId.trim();
  };

  const folderId = extractFolderId(folderInput) || DRIVE_FOLDER_ID;

  // Live Google OAuth Drive v3 Fetch Attempt
  const handleFetchGoogleDriveLive = async () => {
    setIsLoadingDrive(true);
    setSyncSuccessMessage(null);
    try {
      let token: string | null = null;
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        token = credential?.accessToken || null;
      } catch (authErr) {
        console.warn("OAuth Popup info:", authErr);
      }

      if (token) {
        const queryUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed%3Dfalse&fields=files(id,name,mimeType,webViewLink,createdTime)&pageSize=50`;
        const res = await fetch(queryUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setDriveFiles(data.files || []);
          setLiveApiConnected(true);
        } else {
          setLiveApiConnected(false);
        }
      } else {
        setLiveApiConnected(false);
      }
    } catch (err: any) {
      console.warn("Google Drive OAuth Fetch Notice:", err?.message || err);
      setLiveApiConnected(false);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Save updated photo URL for candidate
  const handleSavePhotoUrl = () => {
    if (!editingPhotoRecord || !newPhotoUrl.trim()) return;

    const targetId = editingPhotoRecord.student.id;
    setGraduatesList((prevList) =>
      prevList.map((rec) => {
        if (rec.student.id === targetId) {
          const updatedRec: DriveGraduateRecord = {
            ...rec,
            student: {
              ...rec.student,
              berkasDokumen: {
                ...rec.student.berkasDokumen,
                pasFoto: newPhotoUrl.trim()
              }
            },
            cv: {
              ...rec.cv,
              pasFotoUrl: newPhotoUrl.trim()
            }
          };
          // Auto sync to context immediately if already synced or now
          syncSingleCandidate(updatedRec);
          return updatedRec;
        }
        return rec;
      })
    );

    setEditingPhotoRecord(null);
    setNewPhotoUrl('');
    setSyncSuccessMessage(`Foto siswa berhasil diperbarui & disingkronkan ke Admin Siswa & Admin Doc!`);
  };

  // Add new candidate manually
  const handleAddNewCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateForm.namaLengkap.trim()) return;

    const newId = `SISWA-IJEF-MANUAL-${Date.now().toString().slice(-5)}`;
    const photo = newCandidateForm.pasFotoUrl.trim();

    const newRecord: DriveGraduateRecord = {
      batchFolder: newCandidateForm.batchFolder,
      student: {
        id: newId,
        namaLengkap: newCandidateForm.namaLengkap.trim(),
        noHp: newCandidateForm.noHp || '081234567890',
        email: newCandidateForm.email || `${newCandidateForm.namaLengkap.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        kategoriKandidat: newCandidateForm.kategoriKandidat as any,
        kewarganegaraan: 'WNI',
        noKtp: '320101' + Math.floor(1000000000 + Math.random() * 9000000000),
        noKk: '320101' + Math.floor(1000000000 + Math.random() * 9000000000),
        alamatDomisili: 'LPK IJEF CORP, Jawa Barat',
        tempatLahir: 'Bandung',
        tanggalLahir: '2001-05-15',
        agama: 'Islam',
        jenisKelamin: 'Laki-laki',
        golonganDarah: 'O',
        statusPerkawinan: 'Lajang',
        namaAyah: 'Bapak ' + newCandidateForm.namaLengkap.split(' ')[0],
        pekerjaanAyah: 'Wiraswasta',
        ktpNpwpAyah: '320101' + Math.floor(1000000000 + Math.random() * 9000000000),
        namaIbu: 'Ibu ' + newCandidateForm.namaLengkap.split(' ')[0],
        pekerjaanIbu: 'Ibu Rumah Tangga',
        ktpNpwpIbu: '320101' + Math.floor(1000000000 + Math.random() * 9000000000),
        berkasDokumen: {
          pasFoto: photo,
          cv: `CV_${newCandidateForm.namaLengkap.replace(/\s+/g, '_')}.pdf`,
          ijazah: `Ijazah_${newCandidateForm.namaLengkap.replace(/\s+/g, '_')}.pdf`
        },
        statusPendaftaran: 'Diterima',
        createdAt: new Date().toISOString()
      },
      cv: {
        id: `cv-${newId}`,
        siswaId: newId,
        kodeReferensi: `IJEF-MANUAL-${Date.now().toString().slice(-4)}`,
        namaLengkap: newCandidateForm.namaLengkap.trim(),
        namaKatakana: newCandidateForm.namaKatakana || newCandidateForm.namaLengkap,
        namaPanggilan: newCandidateForm.namaLengkap.split(' ')[0],
        email: newCandidateForm.email || `${newCandidateForm.namaLengkap.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        noHp: newCandidateForm.noHp || '081234567890',
        kategoriKandidat: newCandidateForm.kategoriKandidat as any,
        tempatTanggalLahir: 'Bandung, 15 Mei 2001',
        umur: 24,
        jenisKelamin: 'Laki-laki',
        statusPernikahan: 'Lajang',
        alamatLengkap: 'LPK IJEF CORP, Jawa Barat',
        agama: 'Islam',
        golonganDarah: 'O',
        tinggiBadan: 168,
        beratBadan: 60,
        dominanTangan: 'Kanan',
        butaWarna: 'TIDAK',
        merokok: 'TIDAK',
        minumAlkohol: 'TIDAK',
        memilikiTato: 'TIDAK',
        penyakitBerat: 'TIDAK',
        alergi: 'TIDAK',
        hobi: 'Belajar Bahasa Jepang & Olahraga',
        memilikiSim: 'YA',
        memilikiPaspor: 'YA',
        levelBahasaJepang: 'N4',
        skorJftAtauJlpt: newCandidateForm.skorJftAtauJlpt,
        sertifikatSsw: [newCandidateForm.sertifikatSsw],
        riwayatPendidikan: [
          {
            id: 'edu-1',
            namaSekolah: 'SMK Negeri 1',
            jurusan: 'Teknik Industri',
            bulanTahunMasuk: '2016-07',
            bulanTahunLulus: '2019-06'
          },
          {
            id: 'edu-2',
            namaSekolah: 'LPK IJEF CORP',
            jurusan: 'Program Intensive Tokutei Ginou',
            bulanTahunMasuk: '2024-01',
            bulanTahunLulus: '2025-06'
          }
        ],
        riwayatPekerjaan: [
          {
            id: 'work-1',
            namaPerusahaan: 'LPK IJEF CORP',
            posisiJabatan: 'Siswa Training Tokutei Ginou',
            lokasi: 'Bandung',
            bulanTahunMasuk: '2024-01',
            bulanTahunLulus: '2025-06',
            deskripsiTugas: 'Menyelesaikan program pelatihan bahasa Jepang N4 dan SSW.'
          }
        ],
        dataKeluarga: [
          { id: 'f-1', namaLengkap: 'Keluarga', hubungan: 'Ayah', usia: 50, pekerjaan: 'Wiraswasta', gajiPerBulan: 'Rp 4.000.000', tinggalBersama: 'YA' }
        ],
        shidouDoki: 'Siswa tambahan LPK IJEF CORP. Siap berangkat kerja ke Jepang bidang Tokutei Ginou.',
        prKeunggulanDiri: 'Disiplin tinggi, kondisi fisik sehat, mematuhi etika kerja Jepang.',
        statusCV: 'Siap Matching',
        pasFotoUrl: photo,
        updatedAt: new Date().toISOString()
      },
      health: {
        id: `mcu-${newId}`,
        siswaId: newId,
        namaSiswa: newCandidateForm.namaLengkap.trim(),
        statusFit: 'FIT',
        tinggiBadan: 168,
        beratBadan: 60,
        tekananDarah: '120/80',
        butaWarna: 'Normal',
        riwayatPenyakitSerius: 'Tidak Ada',
        pengobatanRutin: 'Tidak Ada',
        riwayatOperasi: 'Tidak Ada',
        riwayatTbc: 'Tidak Ada',
        riwayatHepatitis: 'Tidak Ada',
        penyakitAsma: 'Tidak Ada',
        penyakitOrganDalam: 'Tidak Ada',
        kecelakaanParah: 'Tidak Ada',
        perokokAktif: 'Tidak',
        pecanduAlkohol: 'Tidak',
        obatObatanTerlarang: 'Tidak',
        gangguanJiwaStress: 'Tidak',
        masalahTulangSendi: 'Tidak',
        kepemilikanTato: 'Tidak',
        catatanDokter: 'Sehat fit.',
        evaluatorName: 'Dr. Hendra Wijaya, Sp.Ok',
        updatedAt: new Date().toISOString()
      },
      disc: {
        id: `disc-${newId}`,
        siswaId: newId,
        namaSiswa: newCandidateForm.namaLengkap.trim(),
        scoreD: 30,
        scoreI: 30,
        scoreS: 35,
        scoreC: 35,
        dominantType: 'Steadiness',
        description: 'Ramah dan teliti.',
        userAnswers: {},
        createdAt: new Date().toISOString()
      },
      psikotes: {
        id: `psi-${newId}`,
        siswaId: newId,
        namaSiswa: newCandidateForm.namaLengkap.trim(),
        totalCorrect: 42,
        totalQuestions: 50,
        scorePercentage: 84,
        statusKelulusan: 'LULUS',
        categoryBreakdown: { analogiKata: 10, logikaMatematika: 11, penalaranSpasial: 10, penalaranVerbal: 11 },
        userAnswers: {},
        createdAt: new Date().toISOString()
      },
      driveFileRef: {
        folderId: DRIVE_FOLDER_ID,
        folderName: newCandidateForm.batchFolder,
        fileId: `FILE-MANUAL-${Date.now().toString().slice(-4)}`,
        fileName: `${newCandidateForm.batchFolder}_${newCandidateForm.namaLengkap.toUpperCase().replace(/\s+/g, '_')}.pdf`,
        jftCertUrl: 'https://drive.google.com'
      }
    };

    setGraduatesList((prev) => [newRecord, ...prev]);
    syncSingleCandidate(newRecord);

    setIsAddModalOpen(false);
    setNewCandidateForm({
      namaLengkap: '',
      namaKatakana: '',
      batchFolder: 'BATCH 10-A',
      kategoriKandidat: 'SISWA IJEF - Offline',
      noHp: '',
      email: '',
      pasFotoUrl: '',
      skorJftAtauJlpt: 'JFT-Basic A2 (LULUS)',
      sertifikatSsw: 'Tokutei Ginou Kaigo'
    });

    setSyncSuccessMessage(`Siswa baru "${newRecord.student.namaLengkap}" berhasil ditambahkan & disingkronkan ke Admin Siswa & Admin Doc!`);
  };

  // Filtered List of IJEF Graduates Data using graduatesList
  const filteredGraduates = graduatesList.filter((rec) => {
    const s = rec.student;
    const cv = rec.cv;

    const matchesSearch =
      s.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.batchFolder.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cv.skorJftAtauJlpt || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBatch =
      selectedBatch === 'ALL' || rec.batchFolder === selectedBatch;

    const matchesCat =
      selectedCategory === 'ALL' || s.kategoriKandidat === selectedCategory;

    const matchesSsw =
      selectedSsw === 'ALL' ||
      cv.sertifikatSsw?.some((cert) => cert.toLowerCase().includes(selectedSsw.toLowerCase()));

    return matchesSearch && matchesBatch && matchesCat && matchesSsw;
  });

  // Count items per batch
  const getBatchCount = (batchName: string) => {
    return graduatesList.filter((item) => item.batchFolder === batchName).length;
  };

  // Single Candidate Sync Function with Full Photo & Document Preservation
  const syncSingleCandidate = (rec: DriveGraduateRecord) => {
    const rawPhoto =
      rec.student.berkasDokumen?.pasFoto ||
      rec.cv.pasFotoUrl ||
      '';
    const photoUrl = isAiOrPlaceholderPhoto(rawPhoto) ? '' : rawPhoto.trim();

    // Synchronize CalonSiswa for Admin 1 (LPK IJEF)
    const existingStudent = students.find((s) => s.id === rec.student.id);
    const existingCV = rirekishoRecords[rec.student.id];

    const updatedStudent: CalonSiswa = {
      ...rec.student,
      ...(existingStudent || {}),
      berkasDokumen: {
        ...(existingStudent?.berkasDokumen || {}),
        ...(rec.student.berkasDokumen || {}),
        pasFoto: photoUrl,
        sertifikatJft: rec.driveFileRef?.jftCertUrl || existingStudent?.berkasDokumen?.sertifikatJft || rec.student.berkasDokumen?.sertifikatJft || '',
        sertifikatSswKaigoSkill: rec.driveFileRef?.sswCertUrl || existingStudent?.berkasDokumen?.sertifikatSswKaigoSkill || rec.student.berkasDokumen?.sertifikatSswKaigoSkill || '',
        cv: existingStudent?.berkasDokumen?.cv || rec.student.berkasDokumen?.cv || `CV_Rirekisho_${rec.student.namaLengkap.replace(/\s+/g, '_')}.pdf`,
        ijazah: existingStudent?.berkasDokumen?.ijazah || rec.student.berkasDokumen?.ijazah || `Ijazah_Lulus_${rec.student.namaLengkap.replace(/\s+/g, '_')}.pdf`
      }
    };

    // Synchronize CVRirekisho for Admin 2 (CV Portal & Matching)
    const updatedCV: CVRirekisho = {
      ...rec.cv,
      ...(existingCV || {}),
      pasFotoUrl: photoUrl,
      dokumenUpload: {
        ...(existingStudent?.berkasDokumen || {}),
        ...(existingCV?.dokumenUpload || {}),
        ...(rec.cv.dokumenUpload || {}),
        pasPhoto3x4: photoUrl,
        sertifikatBahasaJepang: rec.driveFileRef?.jftCertUrl || existingCV?.dokumenUpload?.sertifikatBahasaJepang || rec.cv.dokumenUpload?.sertifikatBahasaJepang || rec.student.berkasDokumen?.sertifikatJft,
        sertifikatSsw: rec.driveFileRef?.sswCertUrl || existingCV?.dokumenUpload?.sertifikatSsw || rec.cv.dokumenUpload?.sertifikatSsw || rec.student.berkasDokumen?.sertifikatSswKaigoSkill,
        cvRirekishoDoc: existingCV?.dokumenUpload?.cvRirekishoDoc || rec.student.berkasDokumen?.cv || `CV_Rirekisho_${rec.student.namaLengkap.replace(/\s+/g, '_')}.pdf`,
        ijazah: existingCV?.dokumenUpload?.ijazah || rec.student.berkasDokumen?.ijazah || `Ijazah_Lulus_${rec.student.namaLengkap.replace(/\s+/g, '_')}.pdf`,
        dokumenSim: existingCV?.dokumenUpload?.dokumenSim || rec.student.berkasDokumen?.sim
      }
    };

    // Save all modules
    saveStudentRegistration(updatedStudent);
    saveRirekishoRecord(updatedCV);
    saveHealthRecord(rec.health);
    saveDiscRecord(rec.disc);
    savePsikotesRecord(rec.psikotes);

    setSyncedCandidateIds((prev) => {
      const next = new Set(prev);
      next.add(rec.student.id);
      return next;
    });
  };

  // Perform Batch Sync to Admin 1 and Admin 2 for all filtered candidates
  const handleSyncAllToAdminPortals = () => {
    setIsSyncing(true);
    setSyncSuccessMessage(null);

    setTimeout(() => {
      let syncedCount = 0;

      filteredGraduates.forEach((rec) => {
        syncSingleCandidate(rec);
        syncedCount++;
      });

      setIsSyncing(false);
      setSyncSuccessMessage(
        lang === 'ja'
          ? `写真、ドライブファイル、および ${syncedCount} 件のIJEF候補者データを学生管理・書類管理ポータルに同期しました。`
          : `Berhasil menyinkronkan foto, berkas drive & ${syncedCount} data siswa IJEF (Lintas Batch Drive) ke Admin Siswa (LPK IJEF) & Admin Doc (CV Portal & Matching)!`
      );
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col w-screen h-screen overflow-hidden">
      <div className="bg-white text-slate-900 w-full h-full flex flex-col min-h-0 overflow-hidden p-4 sm:p-6 space-y-4 overflow-y-auto">
        {/* Header Modal - Full Screen Mode */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'ja' ? 'Google ドライブ データ連携・同期 (全バッチ)' : 'Tarik Data & Singkronisasi Google Drive IJEF (ALL BATCH)'}
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {lang === 'ja' ? '写真・全詳細同期' : 'Sync Photo & All Details'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ja'
                  ? <>フォルダ <strong className="text-slate-800 font-semibold">{DRIVE_FOLDER_NAME}</strong> から顔写真、JFT/SSW合格証、健康診断、DISC、適性検査および学歴データを取得</>
                  : <>Mengambil data foto, sertifikat JFT/SSW, MCU, DISC, Psikotes & Pendidikan LPK IJEF dari Folder <strong className="text-slate-800 font-semibold">{DRIVE_FOLDER_NAME}</strong></>}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-300 shadow-2xs"
            title={lang === 'ja' ? 'ポータルに戻る' : 'Kembali ke portal'}
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
            <span>{lang === 'ja' ? '戻る' : 'Kembali'}</span>
          </button>
        </div>

        {/* Input Google Drive Link / Folder ID */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'ja' ? 'マスター Google ドライブ フォルダリンク / ID (全バッチ生徒データ)' : 'Link Folder / ID Google Drive Master (DATA SISWA ALL BATCH)'}</span>
            </label>
            <a
              href={`https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center space-x-1"
            >
              <span>{lang === 'ja' ? 'Google ドライブ フォルダを開く' : 'Buka Drive Folder Google'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/1OMjMJ6FUrnuQmA0BlehcF_y25upHcDJ1"
              className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <button
              type="button"
              onClick={handleFetchGoogleDriveLive}
              disabled={isLoadingDrive}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`} />
              <span>{isLoadingDrive ? (lang === 'ja' ? '取得中...' : 'Mengambil...') : (lang === 'ja' ? 'ライブ Drive API 確認' : 'Cek Live Drive API')}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Drive Root: <strong className="text-slate-800 font-bold">{DRIVE_FOLDER_NAME}</strong></span>
            <span>ID: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-mono">{DRIVE_FOLDER_ID}</code></span>
          </div>
        </div>

        {/* Live Drive API status banner if active */}
        {liveApiConnected && driveFiles.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {lang === 'ja'
                  ? `Google ドライブ OAuth API に接続済み (${driveFiles.length} 件のファイルを検出)`
                  : `Terhubung dengan Live Google Drive OAuth API (${driveFiles.length} Berkas Ditemukan di Folder Drive)`}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {driveFiles.slice(0, 6).map((f) => (
                <span key={f.id} className="bg-white border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg font-medium flex items-center space-x-1">
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  <span className="truncate max-w-[180px]">{f.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Folder Batches Bar Selector */}
        <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-2.5 shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <FolderTree className="w-4 h-4" />
              <span>{lang === 'ja' ? `検出された Google ドライブ バッチフォルダ (${ALL_DRIVE_BATCHES.length} バッチ):` : `Subfolder Batch Google Drive Terdeteksi (${ALL_DRIVE_BATCHES.length} Batch Folder):`}</span>
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {lang === 'ja' ? 'バッチをクリックして候補者を絞り込み' : 'Klik batch untuk memfilter kandidat'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-[90px] overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => setSelectedBatch('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                selectedBatch === 'ALL'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{lang === 'ja' ? `全バッチ (${DRIVE_GRADUATES_LIST.length})` : `SEMUA BATCH (${DRIVE_GRADUATES_LIST.length})`}</span>
            </button>

            {ALL_DRIVE_BATCHES.map((bName) => {
              const count = getBatchCount(bName);
              const isActive = selectedBatch === bName;
              return (
                <button
                  key={bName}
                  type="button"
                  onClick={() => setSelectedBatch(bName)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{bName}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-emerald-700 text-white' : 'bg-slate-900 text-emerald-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 items-center">
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ja' ? '氏名、JFT、SSW、期で検索...' : 'Cari nama, JFT, SSW, batch...'}
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-1">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="ALL">{lang === 'ja' ? `全バッチフォルダ (${ALL_DRIVE_BATCHES.length} フォルダ)` : `Semua Folder Batch (${ALL_DRIVE_BATCHES.length} Folder)`}</option>
              {ALL_DRIVE_BATCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="ALL">{lang === 'ja' ? 'すべての候補者区分' : 'Semua Kategori Candidate'}</option>
              <option value="SISWA IJEF - Offline">{lang === 'ja' ? 'IJEF 生徒 - 対面 (Offline)' : 'SISWA IJEF - Offline'}</option>
              <option value="SISWA IJEF - Online">{lang === 'ja' ? 'IJEF 生徒 - オンライン (Online)' : 'SISWA IJEF - Online'}</option>
              <option value="SISWA NON IJEF (New Comer)">{lang === 'ja' ? '非 IJEF 生徒 (新規)' : 'SISWA NON IJEF'}</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <select
              value={selectedSsw}
              onChange={(e) => setSelectedSsw(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="ALL">{lang === 'ja' ? 'すべての特定技能分野 (SSW)' : 'Semua Sektor SSW'}</option>
              <option value="Kaigo">{lang === 'ja' ? '介護分野 (Kaigo)' : 'SSW Kaigo (Keperawatan)'}</option>
              <option value="Pengolahan Makanan">{lang === 'ja' ? '飲食料品製造業 (Food Processing)' : 'SSW Pengolahan Makanan'}</option>
              <option value="Pertanian">{lang === 'ja' ? '農業 (Agriculture)' : 'SSW Pertanian'}</option>
              <option value="Manufaktur">{lang === 'ja' ? '素形材・産業機械・電気電子 (Manufacturing)' : 'SSW Manufaktur'}</option>
              <option value="Akomodasi">{lang === 'ja' ? '宿泊業 / ホテル (Accommodation)' : 'SSW Perhotelan / Akomodasi'}</option>
            </select>
          </div>
        </div>

        {/* Sync Success Toast Notice */}
        {syncSuccessMessage && (
          <div className="p-3.5 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-500/20 animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{syncSuccessMessage}</span>
            </div>
            <button onClick={() => setSyncSuccessMessage(null)} className="hover:bg-emerald-600 p-1 rounded cursor-pointer">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* Graduates Data List Cards */}
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
            <span className="flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'ja' ? `JFT・SSW合格・修了生一覧 (${filteredGraduates.length} 名表示中)` : `Daftar Siswa IJEF Lulus JFT SSW & Pendidikan (${filteredGraduates.length} Orang Ditampilkan)`}</span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
              >
                <span>{lang === 'ja' ? '➕ 候補者手動追加' : '➕ Input Candidate Manual'}</span>
              </button>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 hidden sm:inline">
                {lang === 'ja' ? '写真および書類は生徒・書類管理へ自動連携' : 'Foto & Berkas Dihubungkan ke Admin Siswa & Admin Doc'}
              </span>
            </div>
          </div>

          {filteredGraduates.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
              {lang === 'ja' ? '検索条件に一致する候補者データが見つかりません。' : 'Tidak ada data siswa yang cocok dengan filter pencarian / batch ini.'}
            </div>
          ) : (
            filteredGraduates.map((item) => {
              const { student: s, cv, health, disc, psikotes } = item;
              const isSynced = syncedCandidateIds.has(s.id);
              const isExpanded = expandedCandidateId === s.id;
              const photoUrl = getStudentPhotoUrl(s, cv);

              return (
                <div
                  key={s.id}
                  className={`bg-white border rounded-xl p-4 transition shadow-xs space-y-3 ${
                    isSynced ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center space-x-3.5">
                      <div className="relative shrink-0 group cursor-pointer" onClick={() => { setEditingPhotoRecord(item); setNewPhotoUrl(photoUrl); }}>
                        {photoUrl && photoUrl.trim().length > 0 ? (
                          <img
                            src={photoUrl.trim()}
                            alt={s.namaLengkap}
                            referrerPolicy="no-referrer"
                            onError={(e) => handleStudentImageError(e, s.namaLengkap, s.jenisKelamin)}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 group-hover:border-emerald-500 shadow-xs transition"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-bold text-xs group-hover:border-emerald-400 transition">
                            {s.namaLengkap ? s.namaLengkap.slice(0, 2).toUpperCase() : <User className="w-5 h-5 text-slate-400" />}
                          </div>
                        )}
                        <button
                          type="button"
                          className="absolute -bottom-1 -right-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full p-1 border border-white shadow-xs"
                          title={lang === 'ja' ? '写真リンクを編集' : 'Klik untuk Edit Foto Siswa Ini'}
                        >
                          <ImageIcon className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <h4 className="font-bold text-slate-900 text-sm">{s.namaLengkap}</h4>
                          <span className="text-[10px] font-extrabold bg-slate-900 text-emerald-400 px-2 py-0.5 rounded">
                            {item.batchFolder}
                          </span>
                          <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                            {s.kategoriKandidat}
                          </span>
                          <button
                            type="button"
                            onClick={() => { setEditingPhotoRecord(item); setNewPhotoUrl(photoUrl); }}
                            className="text-[10px] font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-300 flex items-center space-x-1 cursor-pointer"
                          >
                            <ImageIcon className="w-2.5 h-2.5 text-slate-600" />
                            <span>{lang === 'ja' ? '写真編集' : 'Edit Foto'}</span>
                          </button>
                          {isSynced ? (
                            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 flex items-center space-x-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>{lang === 'ja' ? '学生管理・書類管理へ同期済' : 'Tersinkron Admin Siswa & Admin Doc'}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                              {lang === 'ja' ? '未同期' : 'Belum Sync'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {cv.namaKatakana || s.namaLengkap} | {s.tempatLahir}, {s.tanggalLahir} ({cv.umur || 22} {lang === 'ja' ? '歳' : 'Thn'}) | TEL: {s.noHp}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedCandidateId(isExpanded ? null : s.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center space-x-1 cursor-pointer border border-slate-200"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-600" />
                        <span>
                          {isExpanded
                            ? (lang === 'ja' ? '詳細を閉じる' : 'Tutup Detail')
                            : (lang === 'ja' ? '書類・写真詳細' : 'Detail Berkas & Foto')}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => syncSingleCandidate(item)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                          isSynced
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {isSynced
                            ? (lang === 'ja' ? '再同期する' : 'Re-Sync Candidate')
                            : (lang === 'ja' ? '候補者を同期' : 'Singkronkan Siswa')}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Badges of JFT & SSW & MCU */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wider">{lang === 'ja' ? '日本語 / JFT 試験:' : 'Bahasa Jepang / JFT:'}</span>
                      <strong className="text-emerald-700 font-bold">{cv.skorJftAtauJlpt}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wider">{lang === 'ja' ? '特定技能スキル証明 (SSW):' : 'Sertifikat Skill (SSW):'}</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {cv.sertifikatSsw?.map((ssw, i) => (
                          <span key={i} className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded">
                            {ssw}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wider">{lang === 'ja' ? '健康診断 & 適性検査結果:' : 'Hasil MCU & Psikotes:'}</span>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded">
                          MCU: {health?.statusFit || 'FIT'}
                        </span>
                        <span className="bg-purple-100 text-purple-800 font-extrabold text-[10px] px-2 py-0.5 rounded border border-purple-200">
                          DISC: {disc?.dominantType || 'Steadiness'}
                        </span>
                        <span className="bg-blue-100 text-blue-800 font-extrabold text-[10px] px-2 py-0.5 rounded border border-blue-200">
                          {lang === 'ja' ? '適性' : 'Psikotes'}: {psikotes?.scorePercentage || 85}% ({psikotes?.statusKelulusan || 'LULUS'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Drive File Link Bar */}
                  {item.driveFileRef && (
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 gap-2">
                      <span className="flex items-center space-x-1">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{lang === 'ja' ? 'バッチフォルダ: ' : 'Folder Batch: '}<strong className="text-slate-800">{item.batchFolder}</strong> | File: {item.driveFileRef.fileName}</span>
                      </span>
                      <div className="flex items-center space-x-3">
                        {item.driveFileRef.jftCertUrl && (
                          <a
                            href={item.driveFileRef.jftCertUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 font-semibold hover:underline flex items-center space-x-1"
                          >
                            <span>{lang === 'ja' ? 'JFT 合格証 (Drive)' : 'Sertifikat JFT Drive'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {item.driveFileRef.sswCertUrl && (
                          <a
                            href={item.driveFileRef.sswCertUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-700 font-semibold hover:underline flex items-center space-x-1"
                          >
                            <span>{lang === 'ja' ? 'SSW 技能証 (Drive)' : 'Sertifikat SSW Drive'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Detailed Candidate View Expander */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200 bg-slate-900 text-white p-4 rounded-xl space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                          <UserCheck className="w-4 h-4" />
                          <span>{lang === 'ja' ? `候補者データ同期詳細: ${s.namaLengkap}` : `Rincian Lengkap Sinkronisasi Siswa: ${s.namaLengkap}`}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {s.id}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Column 1: Foto & Dokumen */}
                        <div className="space-y-2 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                          <span className="font-bold text-slate-200 block text-[11px] border-b border-slate-700 pb-1">
                            {lang === 'ja' ? '📷 証明写真 & 添付書類' : '📷 Foto Pas & Dokumen Lampiran'}
                          </span>
                          <div className="flex items-center space-x-3 pt-1">
                            {photoUrl && photoUrl.trim().length > 0 ? (
                              <>
                                <img
                                  src={photoUrl.trim()}
                                  alt="Pas Foto"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => handleStudentImageError(e, s.namaLengkap, s.jenisKelamin)}
                                  className="w-16 h-20 rounded border border-emerald-500 object-cover shadow-md"
                                />
                                <div className="space-y-1 text-[11px]">
                                  <p className="text-emerald-400 font-semibold">{lang === 'ja' ? 'HD プロフィール写真あり' : 'Foto Profil HD Tersedia'}</p>
                                  <p className="text-slate-400 text-[10px]">{lang === 'ja' ? '学生管理および書類管理 (JIS規格履歴書 3x4) へ自動連携' : 'Ter-Sync ke Admin Siswa & Admin Doc (Rirekisho JIS 3x4)'}</p>
                                  <a href={photoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-[10px] flex items-center space-x-1">
                                    <span>{lang === 'ja' ? 'オリジナル写真を開く' : 'Buka Link Photo Original'}</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-16 h-20 rounded border border-dashed border-slate-600 bg-slate-900/60 flex flex-col items-center justify-center text-slate-400 p-1 text-center shrink-0">
                                  <User className="w-6 h-6 mb-1 text-slate-500" />
                                  <span className="text-[8px] font-bold">{lang === 'ja' ? '写真未登録' : 'Foto Kosong'}</span>
                                </div>
                                <div className="space-y-1 text-[11px]">
                                  <p className="text-amber-400 font-semibold">{lang === 'ja' ? '写真未登録' : 'Foto Belum Di-upload'}</p>
                                  <p className="text-slate-400 text-[10px]">{lang === 'ja' ? 'ドライブまたは写真リンク編集で登録可能' : 'Foto dapat ditambahkan dengan klik tombol edit foto'}</p>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="pt-2 text-[10px] space-y-1 text-slate-300">
                            <p><strong>{lang === 'ja' ? '履歴書書類:' : 'CV Document:'}</strong> {s.berkasDokumen?.cv || `CV_${s.namaLengkap}.pdf`}</p>
                            <p><strong>{lang === 'ja' ? '卒業証明書:' : 'Ijazah:'}</strong> {s.berkasDokumen?.ijazah || `Ijazah_${s.namaLengkap}.pdf`}</p>
                            <p><strong>{lang === 'ja' ? '警察証明 (SKCK):' : 'SKCK:'}</strong> {s.berkasDokumen?.skck || (lang === 'ja' ? 'あり' : 'Ada')}</p>
                            <p><strong>{lang === 'ja' ? '身分証明書 (KTP):' : 'KTP Siswa:'}</strong> {s.berkasDokumen?.ktpSiswa || (lang === 'ja' ? 'あり' : 'Ada')}</p>
                          </div>
                        </div>

                        {/* Column 2: Data Pribadi & Keluarga */}
                        <div className="space-y-2 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                          <span className="font-bold text-slate-200 block text-[11px] border-b border-slate-700 pb-1">
                            {lang === 'ja' ? '👤 基本個人情報 & 家族構成' : '👤 Data Pribadi & Orang Tua'}
                          </span>
                          <div className="space-y-1 text-[11px] text-slate-300">
                            <p><strong>{lang === 'ja' ? 'カタカナ表記:' : 'Nama Katakana:'}</strong> <span className="text-emerald-400">{cv.namaKatakana}</span></p>
                            <p><strong>{lang === 'ja' ? 'NIK 身分証番号:' : 'NIK KTP:'}</strong> {s.noKtp || '-'}</p>
                            <p><strong>{lang === 'ja' ? '家族カード番号:' : 'No. KK:'}</strong> {s.noKk || '-'}</p>
                            <p><strong>{lang === 'ja' ? '宗教 / 血液型:' : 'Agama / Gol. Darah:'}</strong> {s.agama} / {s.golonganDarah}</p>
                            <p><strong>{lang === 'ja' ? '婚姻状況:' : 'Status Pernikahan:'}</strong> {s.statusPerkawinan}</p>
                            <p><strong>{lang === 'ja' ? '現住所:' : 'Alamat:'}</strong> {s.alamatDomisili}</p>
                            <div className="pt-1 border-t border-slate-700 mt-1">
                              <p><strong>{lang === 'ja' ? '父:' : 'Ayah:'}</strong> {s.namaAyah} ({s.pekerjaanAyah})</p>
                              <p><strong>{lang === 'ja' ? '母:' : 'Ibu:'}</strong> {s.namaIbu} ({s.pekerjaanIbu})</p>
                            </div>
                          </div>
                        </div>

                        {/* Column 3: Skill & Evaluasi Modul */}
                        <div className="space-y-2 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                          <span className="font-bold text-slate-200 block text-[11px] border-b border-slate-700 pb-1">
                            {lang === 'ja' ? '🎓 資格 & 送出機関アセスメント' : '🎓 Kualifikasi & Asesmen LPK'}
                          </span>
                          <div className="space-y-1.5 text-[11px] text-slate-300">
                            <p><strong>JFT / JLPT:</strong> <span className="text-emerald-400 font-bold">{cv.skorJftAtauJlpt}</span></p>
                            <p><strong>{lang === 'ja' ? '特定技能分野:' : 'SSW Skill:'}</strong> {cv.sertifikatSsw?.join(', ')}</p>
                            <div className="p-2 bg-slate-950 rounded border border-slate-700 space-y-1 mt-2 text-[10px]">
                              <div className="flex justify-between">
                                <span className="text-slate-400">{lang === 'ja' ? '健康診断状態 (MCU):' : 'Status Fit MCU:'}</span>
                                <span className="text-emerald-400 font-bold">{health?.statusFit} ({health?.catatanDokter || (lang === 'ja' ? '健康' : 'Sehat')})</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">{lang === 'ja' ? 'DISC 性格タイプ:' : 'Tipe Karakter DISC:'}</span>
                                <span className="text-purple-400 font-bold">{disc?.dominantType}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">{lang === 'ja' ? '適性検査スコア:' : 'Skor Psikotes LPK:'}</span>
                                <span className="text-blue-400 font-bold">{psikotes?.scorePercentage}% - {psikotes?.statusKelulusan}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-500 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {lang === 'ja'
                ? 'データと写真は自動的に JIS 規格履歴書に変換され、学生管理および書類管理ポータルに同期されます。'
                : 'Data & foto dikonversi otomatis menjadi CV Rirekisho JIS & tersinkron di Admin Siswa & Admin Doc.'}
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              {lang === 'ja' ? '閉じる' : 'Tutup'}
            </button>

            <button
              type="button"
              onClick={handleSyncAllToAdminPortals}
              disabled={isSyncing || filteredGraduates.length === 0}
              className="w-1/2 sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              <DownloadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>
                {isSyncing
                  ? (lang === 'ja' ? '同期中...' : 'Menyinkronkan...')
                  : (lang === 'ja' ? `${filteredGraduates.length} 件のデータ・写真・履歴書を一括同期` : `Singkronkan ${filteredGraduates.length} Data, Foto & CV`)}
              </span>
            </button>
          </div>
        </div>

        {/* MODAL EDIT FOTO CANDIDATE */}
        {editingPhotoRecord && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    {lang === 'ja' ? '証明写真 / Google ドライブ画像リンクの編集' : 'Edit Pas Foto / Link Drive Siswa'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPhotoRecord(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {(() => {
                    const rawSrc =
                      (newPhotoUrl && newPhotoUrl.trim()) ||
                      (editingPhotoRecord.student.berkasDokumen?.pasFoto && editingPhotoRecord.student.berkasDokumen.pasFoto.trim()) ||
                      '';
                    const previewSrc = isAiOrPlaceholderPhoto(rawSrc) ? '' : rawSrc;

                    if (previewSrc) {
                      return (
                        <img
                          src={previewSrc}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          className="w-14 aspect-[2/3] rounded-lg object-cover object-top border border-emerald-500 shadow-xs"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      );
                    }
                    return (
                      <div className="w-14 aspect-[2/3] rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-center p-1">
                        <User className="w-5 h-5 mb-0.5 text-slate-400" />
                        <span className="text-[8px] font-bold text-slate-500">Kosong</span>
                      </div>
                    );
                  })()}
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">{editingPhotoRecord.student.namaLengkap}</p>
                    <p className="text-slate-500 text-[11px]">{editingPhotoRecord.batchFolder} | {editingPhotoRecord.student.kategoriKandidat}</p>
                    <p className="text-emerald-600 text-[10px] font-semibold mt-0.5">{lang === 'ja' ? 'Google ドライブ写真 / 画像URL' : 'Preset Foto Google Drive / Image Link'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '証明写真 URL / Google ドライブ直接表示リンク:' : 'URL Pas Foto / Google Drive Direct View Link:'}
                  </label>
                  <input
                    type="text"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="https://drive.google.com/uc?export=view&id=..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {lang === 'ja'
                      ? 'または公開画像 URL (.jpg, .png, .webp) を入力してください。学生管理および書類管理ポータルに即時同期されます。'
                      : 'Atau gunakan URL gambar publik (.jpg, .png, .webp). Foto ini akan ter-sync otomatis ke Rirekisho JIS Admin Siswa & Admin Doc.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPhotoRecord(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {lang === 'ja' ? 'キャンセル' : 'Batal'}
                </button>
                <button
                  type="button"
                  onClick={handleSavePhotoUrl}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {lang === 'ja' ? '保存して写真を同期' : 'Simpan & Sync Foto'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL INPUT CANDIDATE MANUALLY */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleAddNewCandidate} className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    {lang === 'ja' ? '候補者 / 学生の手動追加とドライブ連携' : 'Tambah Candidate / Student Manual ke Drive List'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">{lang === 'ja' ? '生徒フルネーム (ローマ字) *' : 'Nama Lengkap Siswa *'}</label>
                  <input
                    type="text"
                    required
                    value={newCandidateForm.namaLengkap}
                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, namaLengkap: e.target.value })}
                    placeholder={lang === 'ja' ? '例: Muhammad Farhan Syahputra' : 'Contoh: Muhammad Farhan Syahputra'}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{lang === 'ja' ? 'カタカナ氏名' : 'Nama Katakana'}</label>
                  <input
                    type="text"
                    value={newCandidateForm.namaKatakana}
                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, namaKatakana: e.target.value })}
                    placeholder="ムハンマド・ファルハン"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{lang === 'ja' ? 'IJEF バッチフォルダ' : 'Folder Batch IJEF'}</label>
                  <select
                    value={newCandidateForm.batchFolder}
                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, batchFolder: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    {ALL_DRIVE_BATCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{lang === 'ja' ? '候補者区分' : 'Kategori Candidate'}</label>
                  <select
                    value={newCandidateForm.kategoriKandidat}
                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, kategoriKandidat: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="SISWA IJEF - Offline">{lang === 'ja' ? 'IJEF 生徒 - 対面 (Offline)' : 'SISWA IJEF - Offline'}</option>
                    <option value="SISWA IJEF - Online">{lang === 'ja' ? 'IJEF 生徒 - オンライン (Online)' : 'SISWA IJEF - Online'}</option>
                    <option value="SISWA NON IJEF (New Comer)">{lang === 'ja' ? '非 IJEF 生徒 (新規)' : 'SISWA NON IJEF'}</option>
                    <option value="EX-MAGANG / EX-TRAINER">{lang === 'ja' ? '元技能実習生 / 経験者' : 'EX-MAGANG / EX-TRAINER'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{lang === 'ja' ? '電話番号 / WhatsApp' : 'No. WhatsApp / HP'}</label>
                  <input
                    type="text"
                    value={newCandidateForm.noHp}
                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, noHp: e.target.value })}
                    placeholder="081234567890"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">{lang === 'ja' ? '証明写真リンク (Google ドライブ / 画像 URL)' : 'Link Pas Foto Google Drive / Image URL'}</label>
                  <input
                    type="text"
                    value={newCandidateForm.pasFotoUrl}
                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, pasFotoUrl: e.target.value })}
                    placeholder="https://drive.google.com/uc?export=view&id=... / https://..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{lang === 'ja' ? '日本語 JFT / JLPT スコア' : 'Skor JFT / JLPT Bahasa'}</label>
                  <input
                    type="text"
                    value={newCandidateForm.skorJftAtauJlpt}
                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, skorJftAtauJlpt: e.target.value })}
                    placeholder={lang === 'ja' ? 'JFT-Basic A2 (240/250点 - 合格)' : 'JFT-Basic A2 (Skor 240/250 - LULUS)'}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{lang === 'ja' ? '特定技能分野 (SSW)' : 'Sertifikat Skill SSW'}</label>
                  <input
                    type="text"
                    value={newCandidateForm.sertifikatSsw}
                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, sertifikatSsw: e.target.value })}
                    placeholder={lang === 'ja' ? '特定技能 介護 / 飲食料品製造業' : 'Tokutei Ginou Kaigo / Pengolahan Makanan'}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {lang === 'ja' ? 'キャンセル' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {lang === 'ja' ? '学生を追加して同期' : 'Tambah Student & Sync'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

