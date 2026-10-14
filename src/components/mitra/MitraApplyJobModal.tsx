import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { JobPosting, JobApplication, CVRirekisho, CalonSiswa } from '../../types';
import { StudentPhotoBadge } from '../StudentPhotoBadge';
import { getStudentPhotoUrl, handleStudentImageError } from '../../utils/studentPhotoHelper';
import {
  getSanitizedJobTitle,
  getSanitizedCompany,
  detectJobSector,
  isCandidateReadyForMatching,
  translateSector,
  translateProgressStatus,
  translateCandidateCategory
} from '../../utils/mitraJobUtils';
import {
  Building2,
  MapPin,
  Banknote,
  CheckCircle2,
  Users,
  Search,
  UserCheck,
  Award,
  AlertCircle,
  X,
  Send,
  PlusCircle,
  FileCheck2,
  Check,
  Briefcase,
  ShieldCheck,
  UserPlus
} from 'lucide-react';

interface MitraApplyJobModalProps {
  job: JobPosting;
  onClose: () => void;
  onSuccess: (candidateName: string) => void;
  preSelectedStudentId?: string;
}

export const MitraApplyJobModal: React.FC<MitraApplyJobModalProps> = ({
  job,
  onClose,
  onSuccess,
  preSelectedStudentId
}) => {
  const { user } = useAuth();
  const {
    students,
    rirekishoRecords,
    jobApplications,
    saveJobApplication,
    saveStudentRegistration,
    saveRirekishoRecord,
    saveMitraSubmission,
    lang = 'id'
  } = useApp();

  const mitraName = user?.namaMitra || user?.displayName || 'LPK Mitra Mandiri Indonesia';
  const mitraId = user?.mitraId || 'MTR-2026-088';

  const [nominationMode, setNominationMode] = useState<'EXISTING' | 'NEW'>(
    preSelectedStudentId ? 'EXISTING' : 'EXISTING'
  );

  // Selected student IDs for nomination
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    preSelectedStudentId ? [preSelectedStudentId] : []
  );

  // Search & Filter within candidate selector
  const [candidateSearch, setCandidateSearch] = useState('');
  const [filterOnlyMatchingField, setFilterOnlyMatchingField] = useState(true);

  // Recommendation notes from Mitra
  const [recommendationNotes, setRecommendationNotes] = useState(
    lang === 'ja'
      ? '特定技能／実習生基準を満たす、パートナー機関の優秀な推薦候補生です。'
      : 'Kandidat binaan resmi mitra dengan kesiapan mental, fisik, dan bahasa Jepang sesuai standar Tokutei Ginou / Magang.'
  );

  // Form state for creating a new candidate directly
  const [newCandidate, setNewCandidate] = useState({
    namaLengkap: '',
    email: '',
    noHp: '',
    kategoriKandidat: 'SISWA MITRA / NON IJEF',
    jenisKelamin: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    bidangKerja: 'KAIGO',
    levelBahasa: 'N4',
    domisili: 'Jawa Barat',
    pengalaman: 'Sudah lulus pelatihan intensif 6 bulan dan siap interview.',
    sertifikatSSW: true,
    pasporReady: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cleanJobTitle = useMemo(() => getSanitizedJobTitle(job, lang), [job, lang]);
  const cleanCompanyName = useMemo(() => getSanitizedCompany(job, lang), [job, lang]);
  const jobSector = useMemo(() => detectJobSector(job), [job]);

  // Translation dictionary
  const t = {
    id: {
      badge: 'Portal Mitra Resmi • Pendaftaran Siswa ke Job',
      modalTitle: 'Pilih Job & Daftarkan Siswa Binaan',
      senderMitra: 'Mitra Pengirim:',
      code: 'Kode:',
      perMonth: '/ bln',
      reqLanguage: 'Syarat Bahasa & Skill:',
      quota: 'Kuota:',
      students: 'Siswa',
      activeStatus: 'Aktif',
      tabExisting: (count: number) => `Pilih Siswa dari Database Terklasifikasi (${count})`,
      tabNew: 'Input & Daftarkan Siswa Baru Mitra',
      searchPlaceholder: 'Cari nama, bidang, atau skill...',
      onlyMatchingField: `Hanya Bidang Sesuai (${translateSector(jobSector, 'id')})`,
      selectAll: 'Pilih Semua',
      reset: 'Reset',
      emptyCandidate: 'Tidak ada siswa yang sesuai filter',
      emptyCandidateDesc: 'Coba matikan filter "Hanya Bidang Sesuai" atau tambahkan siswa baru pada tab di atas.',
      matchesBadge: 'Cocok',
      alreadyAppliedBadge: 'Sudah Terdaftar',
      selectedCountNotice: (count: number) => `${count} Siswa Terpilih untuk Didaftarkan ke Job Ini`,
      initialStatusNotice: 'Status awal: Seleksi Berkas Rirekisho',
      formTitle: 'Form Pendaftaran Siswa Baru Binaan Mitra',
      fullNameLabel: 'Nama Lengkap Siswa *',
      fullNamePlaceholder: 'Contoh: Muhammad Rizki Pratama',
      categoryLabel: 'Kategori Kandidat *',
      emailLabel: 'Email Siswa (Akun Login Siswa) *',
      phoneLabel: 'No. WhatsApp / HP Siswa *',
      domicileLabel: 'Kota Domisili Siswa',
      sectorLabel: 'Klasifikasi Bidang Kerja',
      jlptLabel: 'Level Bahasa Jepang',
      hasSSW: 'Memiliki Sertifikat SSW / Skill Bidang',
      hasPassport: 'Paspor Aktif / Siap',
      notesLabel: 'Catatan & Rekomendasi Mitra ke Admin / Perusahaan Jepang:',
      notesPlaceholder: 'Tuliskan catatan keunggulan kandidat, hasil pelatihan di mitra, atau kesiapan interview...',
      cancelBtn: 'Batal',
      submitting: 'Memproses Pendaftaran...',
      submitExisting: (count: number) => `Daftarkan ${count} Siswa Terpilih`,
      submitNew: 'Daftarkan Siswa Baru ke Job Ini',
      selectCandidateWarning: 'Silakan pilih setidaknya 1 kandidat yang akan didaftarkan ke lowongan ini.'
    },
    ja: {
      badge: '公式パートナーポータル • 求人への候補生応募・推薦',
      modalTitle: '求人確認 & 推薦候補生の選考エントリー',
      senderMitra: '推薦元パートナー:',
      code: '求人ID:',
      perMonth: '/ 月',
      reqLanguage: '応募要件（日本語・スキル）:',
      quota: '募集枠:',
      students: '名',
      activeStatus: '募集中',
      tabExisting: (count: number) => `登録済み候補生から選択 (${count}名)`,
      tabNew: '新規候補生を登録して推薦',
      searchPlaceholder: '氏名、職種、スキルで検索...',
      onlyMatchingField: `職種一致のみ表示 (${translateSector(jobSector, 'ja')})`,
      selectAll: '全て選択',
      reset: 'リセット',
      emptyCandidate: '条件に一致する候補生が見つかりません',
      emptyCandidateDesc: '「職種一致のみ表示」のチェックを外すか、新規候補生を登録してください。',
      matchesBadge: '適性一致',
      alreadyAppliedBadge: '応募済み',
      selectedCountNotice: (count: number) => `${count}名の候補生が推薦対象に選択されています`,
      initialStatusNotice: '初期ステータス: 書類選考中（履歴書審査）',
      formTitle: '新規推薦候補生 登録フォーム',
      fullNameLabel: '候補生 氏名（ローマ字/英語表記）*',
      fullNamePlaceholder: '例: Muhammad Rizki Pratama',
      categoryLabel: '候補生区分 *',
      emailLabel: '候補生メールアドレス（ログイン用）*',
      phoneLabel: 'WhatsApp / 電話番号 *',
      domicileLabel: '現住所 / 出身都市',
      sectorLabel: '希望・専門職種',
      jlptLabel: '日本語レベル (JLPT/JFT)',
      hasSSW: '特定技能評価試験 (SSW) 合格証明書あり',
      hasPassport: '有効旅券（パスポート）所持・申請済',
      notesLabel: '日本企業・事務局へのパートナー推薦所見・特記事項:',
      notesPlaceholder: '候補生の強み、学習態度、実習経験、面接への意気込みなどを入力してください...',
      cancelBtn: 'キャンセル',
      submitting: '応募エントリー処理中...',
      submitExisting: (count: number) => `選択した${count}名を推薦・応募する`,
      submitNew: '新規候補生を登録して応募する',
      selectCandidateWarning: '推薦する候補生を最低1名選択してください。'
    }
  }[lang];


  // Combine and prepare student pool
  const candidatePool = useMemo(() => {
    // Collect all candidates from rirekishoRecords and students
    const list: Array<{
      id: string;
      namaLengkap: string;
      email: string;
      noHp: string;
      bidangKerja: string;
      levelBahasa: string;
      statusProgres: string;
      kategoriKandidat: any;
      avatarUrl?: string;
      rawStudent?: CalonSiswa;
      rawCV?: CVRirekisho;
      hasAppliedThisJob: boolean;
      matchesSector: boolean;
    }> = [];

    // Process rirekisho records
    const rirekishoList = Object.values(rirekishoRecords) as CVRirekisho[];
    const registeredEmails = new Set<string>();
    const registeredIds = new Set<string>();

    rirekishoList.forEach((cv) => {
      if (!isCandidateReadyForMatching(cv)) return;

      const candidateId = cv.siswaId || cv.id;
      if (!candidateId || registeredIds.has(candidateId)) return;
      registeredIds.add(candidateId);

      const email = (cv.email || '').toLowerCase().trim();
      if (email) registeredEmails.add(email);

      const candidateSector = (cv.bidangKerja || '').toUpperCase();
      const matches =
        jobSector === 'UMUM' ||
        candidateSector.includes(jobSector) ||
        (jobSector === 'PM' && (candidateSector.includes('PM') || candidateSector.includes('MAKANAN'))) ||
        (jobSector === 'KAIGO' && candidateSector.includes('KAIGO')) ||
        (jobSector === 'PERTANIAN' && candidateSector.includes('TANI')) ||
        (jobSector === 'KIKAI KAKOU' && (candidateSector.includes('KIKAI') || candidateSector.includes('MESIN'))) ||
        (jobSector === 'ENGINEERING' && (candidateSector.includes('ENG') || candidateSector.includes('GIJIN')));

      const hasApplied = jobApplications.some(
        (app) => app.jobId === job.id && (app.siswaId === candidateId || (email && app.emailSiswa.toLowerCase() === email))
      );

      const stuObj = students.find((s) => s.id === candidateId || (email && s.email.toLowerCase() === email));

      list.push({
        id: candidateId,
        namaLengkap: cv.namaLengkap,
        email: cv.email,
        noHp: cv.noHp,
        bidangKerja: cv.bidangKerja || 'Umum',
        levelBahasa: cv.levelBahasaJepang || 'N4',
        statusProgres: cv.statusProgres || 'Siap Matching',
        kategoriKandidat: cv.kategoriKandidat || 'SISWA NON IJEF (New Comer)',
        avatarUrl: getStudentPhotoUrl(stuObj, cv),
        rawStudent: stuObj,
        rawCV: cv,
        hasAppliedThisJob: hasApplied,
        matchesSector: matches
      });
    });

    // Also check students from SIM-SB
    students.forEach((st) => {
      if (!isCandidateReadyForMatching(st)) return;

      if (!st.id || registeredIds.has(st.id)) return;
      const email = (st.email || '').toLowerCase().trim();
      if (email && registeredEmails.has(email)) return;

      registeredIds.add(st.id);
      if (email) registeredEmails.add(email);

      const hasApplied = jobApplications.some(
        (app) => app.jobId === job.id && (app.siswaId === st.id || (email && app.emailSiswa.toLowerCase() === email))
      );

      const rcv = rirekishoRecords[st.id];

      list.push({
        id: st.id,
        namaLengkap: st.namaLengkap,
        email: st.email,
        noHp: st.noHp,
        bidangKerja: 'KAIGO',
        levelBahasa: 'N4',
        statusProgres: 'Siap Matching',
        kategoriKandidat: st.kategoriKandidat,
        avatarUrl: getStudentPhotoUrl(st, rcv),
        rawStudent: st,
        rawCV: rcv,
        hasAppliedThisJob: hasApplied,
        matchesSector: jobSector === 'UMUM' || jobSector === 'KAIGO'
      });
    });

    return list;
  }, [rirekishoRecords, students, jobApplications, job.id, jobSector]);

  // Filter candidates based on search & matching filter
  const filteredCandidates = useMemo(() => {
    return candidatePool.filter((c) => {
      const term = candidateSearch.toLowerCase();
      const matchesSearch =
        c.namaLengkap.toLowerCase().includes(term) ||
        c.bidangKerja.toLowerCase().includes(term) ||
        c.levelBahasa.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term);

      if (filterOnlyMatchingField && !c.matchesSector && jobSector !== 'UMUM') {
        return false;
      }

      return matchesSearch;
    });
  }, [candidatePool, candidateSearch, filterOnlyMatchingField, jobSector]);

  const toggleSelectCandidate = (candidateId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(candidateId) ? prev.filter((id) => id !== candidateId) : [...prev, candidateId]
    );
  };

  const handleSelectAllMatching = () => {
    const unappliedMatching = filteredCandidates
      .filter((c) => !c.hasAppliedThisJob)
      .map((c) => c.id);
    setSelectedStudentIds(unappliedMatching);
  };

  const handleClearSelection = () => {
    setSelectedStudentIds([]);
  };

  const handleSubmitNomination = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (nominationMode === 'EXISTING') {
        if (selectedStudentIds.length === 0) {
          setErrorMessage('Silakan pilih minimal 1 siswa untuk didaftarkan ke lowongan ini.');
          setIsSubmitting(false);
          return;
        }

        // Create applications for each selected student
        const candidatesToNominate = candidatePool.filter((c) =>
          selectedStudentIds.includes(c.id)
        );

        candidatesToNominate.forEach((candidate, idx) => {
          const newAppId = `APP-MTR-${Date.now()}-${idx + 1}`;
          const newApp: JobApplication = {
            id: newAppId,
            jobId: job.id,
            jobJudul: cleanJobTitle,
            perusahaanJepang: cleanCompanyName,
            siswaId: candidate.id,
            namaSiswa: candidate.namaLengkap,
            emailSiswa: candidate.email,
            kategoriKandidat: candidate.kategoriKandidat,
            tanggalLamar: new Date().toISOString().split('T')[0],
            statusLamaran: 'Seleksi Berkas Rirekisho',
            namaMitra: mitraName,
            mitraId: mitraId,
            catatanMitra: recommendationNotes,
            rekomendasiMitra: `Direkomendasikan oleh Mitra ${mitraName}. Kualifikasi & Dokumen lengkap terverifikasi.`,
            catatanPerusahaan: `Pendaftaran diajukan oleh Mitra ${mitraName}. Berkas Rirekisho dan dokumen kandidat siap direview.`
          };

          saveJobApplication(newApp);

          // Register in Admin 2 Mitra Approval Queue
          saveMitraSubmission({
            mitraId: mitraId,
            mitraName: mitraName,
            submissionType: 'LAMAR_JOB_SISWA',
            status: 'PENDING',
            targetId: newAppId,
            targetTitle: `${candidate.namaLengkap} ➔ ${cleanJobTitle} (${cleanCompanyName})`,
            description: `Pendaftaran nominasi siswa [${candidate.namaLengkap}] ke lowongan [${cleanJobTitle}] (${cleanCompanyName}) oleh Mitra ${mitraName}.`,
            payload: {
              application: newApp,
              candidate,
              job
            }
          });
        });

        const names = candidatesToNominate.map((c) => c.namaLengkap).join(', ');
        onSuccess(names);
        onClose();
      } else {
        // Mode NEW: Register new candidate and apply
        if (!newCandidate.namaLengkap || !newCandidate.email || !newCandidate.noHp) {
          setErrorMessage('Mohon lengkapi Nama Lengkap, Email, dan No HP / WhatsApp siswa.');
          setIsSubmitting(false);
          return;
        }

        const newStudentId = `SISWA-MTR-${Date.now()}`;
        const newRirekishoId = `CV-MTR-${Date.now()}`;

        const newCandidateCategory = newCandidate.kategoriKandidat || 'SISWA MITRA / NON IJEF';

        const newStudentObj: CalonSiswa = {
          id: newStudentId,
          namaLengkap: newCandidate.namaLengkap,
          email: newCandidate.email.toLowerCase().trim(),
          noHp: newCandidate.noHp,
          kategoriKandidat: newCandidateCategory as any,
          kewarganegaraan: 'WNI',
          noKtp: `3201${Date.now().toString().slice(-12)}`,
          noKk: `3201${Date.now().toString().slice(-12)}`,
          alamatDomisili: newCandidate.domisili,
          tempatLahir: newCandidate.domisili,
          tanggalLahir: '2002-06-15',
          agama: 'Islam',
          jenisKelamin: newCandidate.jenisKelamin,
          golonganDarah: 'O',
          statusPerkawinan: 'Lajang',
          namaAyah: 'Wali Siswa Binaan',
          pekerjaanAyah: 'Wiraswasta',
          ktpNpwpAyah: '-',
          namaIbu: 'Ibu Siswa Binaan',
          pekerjaanIbu: 'Ibu Rumah Tangga',
          ktpNpwpIbu: '-',
          berkasDokumen: {
            pasFoto: '',
            ktpSiswa: 'KTP_Mitra.pdf'
          },
          statusPendaftaran: 'Terdaftar',
          createdAt: new Date().toISOString()
        };

        const newCVObj: CVRirekisho = {
          id: newRirekishoId,
          siswaId: newStudentId,
          namaLengkap: newCandidate.namaLengkap,
          email: newCandidate.email.toLowerCase().trim(),
          noHp: newCandidate.noHp,
          kategoriKandidat: newCandidateCategory as any,
          pasFotoUrl: '',
          bidangKerja: newCandidate.bidangKerja,
          alamatLengkap: newCandidate.domisili,
          jenisKelamin: newCandidate.jenisKelamin,
          statusPernikahan: 'Lajang',
          levelBahasaJepang: newCandidate.levelBahasa as any,
          statusCV: 'Siap Matching',
          statusProgres: 'Pending Nunggu Job',
          namaTSK: `Mitra: ${mitraName}`,
          detailProgres: `Pendaftaran via Mitra ${mitraName}`,
          tanggalSubmit: new Date().toLocaleDateString('id-ID'),
          isBaru: true,
          dokumenUpload: {
            pasPhoto3x4: ''
          },
          updatedAt: new Date().toISOString(),
          riwayatPendidikan: [
            {
              jenjang: 'SMK / Sederajat',
              namaSekolah: `Binaan ${mitraName}`,
              jurusan: newCandidate.bidangKerja,
              tahunMasuk: '2019',
              tahunLulus: '2022'
            }
          ],
          riwayatPekerjaan: []
        };

        // Save student and CV
        saveStudentRegistration(newStudentObj);
        saveRirekishoRecord(newCVObj);

        // Save application
        const newApp: JobApplication = {
          id: `APP-MTR-${Date.now()}`,
          jobId: job.id,
          jobJudul: cleanJobTitle,
          perusahaanJepang: cleanCompanyName,
          siswaId: newStudentId,
          namaSiswa: newCandidate.namaLengkap,
          emailSiswa: newCandidate.email.toLowerCase().trim(),
          kategoriKandidat: newCandidateCategory as any,
          tanggalLamar: new Date().toISOString().split('T')[0],
          statusLamaran: 'Seleksi Berkas Rirekisho',
          namaMitra: mitraName,
          mitraId: mitraId,
          catatanMitra: recommendationNotes,
          rekomendasiMitra: `Siswa baru diajukan oleh Mitra ${mitraName}. Kualifikasi: Level ${newCandidate.levelBahasa}, Bidang ${newCandidate.bidangKerja}.`,
          catatanPerusahaan: `Pendaftaran langsung dari Mitra ${mitraName}.`
        };

        saveJobApplication(newApp);

        // Register Student into Admin 2 Mitra Approval Queue
        saveMitraSubmission({
          mitraId: mitraId,
          mitraName: mitraName,
          submissionType: 'REGISTRASI_SISWA',
          status: 'PENDING',
          targetId: newStudentId,
          targetTitle: `${newCandidate.namaLengkap} (${newCandidate.bidangKerja} • ${newCandidateCategory})`,
          description: `Registrasi siswa baru bidang ${newCandidate.bidangKerja} (${newCandidate.levelBahasa}) oleh ${mitraName}.`,
          payload: {
            student: newStudentObj,
            rirekisho: newCVObj,
            sector: newCandidate.bidangKerja,
            languageLevel: newCandidate.levelBahasa,
            email: newCandidate.email
          }
        });

        // Register Job Application into Admin 2 Mitra Approval Queue
        saveMitraSubmission({
          mitraId: mitraId,
          mitraName: mitraName,
          submissionType: 'LAMAR_JOB_SISWA',
          status: 'PENDING',
          targetId: newApp.id,
          targetTitle: `${newCandidate.namaLengkap} ➔ ${cleanJobTitle} (${cleanCompanyName})`,
          description: `Pendaftaran siswa baru [${newCandidate.namaLengkap}] ke lowongan [${cleanJobTitle}] (${cleanCompanyName}) oleh Mitra ${mitraName}.`,
          payload: {
            application: newApp,
            candidate: newStudentObj,
            job
          }
        });

        // Register in localStorage map
        try {
          const existingAccountsRaw = localStorage.getItem('ijef_mitra_registered_students');
          const accountsList = existingAccountsRaw ? JSON.parse(existingAccountsRaw) : [];
          accountsList.push({
            id: newStudentId,
            namaLengkap: newCandidate.namaLengkap,
            email: newCandidate.email.toLowerCase().trim(),
            kategoriKandidat: newCandidateCategory,
            mitraName: mitraName,
            registeredAt: new Date().toISOString()
          });
          localStorage.setItem('ijef_mitra_registered_students', JSON.stringify(accountsList));
        } catch (err) {}
        onSuccess(newCandidate.namaLengkap);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan saat mendaftarkan siswa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden my-4 sm:my-6">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-4 sm:p-5 flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.badge}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              {t.modalTitle}
            </h2>
            <p className="text-xs text-slate-300">
              {t.senderMitra} <strong className="text-amber-300">{mitraName}</strong> ({mitraId})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Job Banner Preview */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {translateSector(jobSector, lang)}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {job.statusJob || t.activeStatus}
                </span>
                <span className="text-xs text-slate-500 font-mono">{t.code} {job.kodeJob || job.id}</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                {cleanJobTitle}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-medium text-slate-800">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {cleanCompanyName}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {job.lokasiPrefektur || (lang === 'ja' ? '日本全国' : 'Jepang')}
                </span>
                <span className="flex items-center gap-1 font-bold text-emerald-700">
                  <Banknote className="w-3.5 h-3.5" />
                  ¥{job.gajiBulananYen?.toLocaleString('ja-JP')} {t.perMonth}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right sm:border-l sm:border-slate-100 sm:pl-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="text-[11px] text-slate-500">{t.reqLanguage}</div>
              <div className="text-xs font-bold text-indigo-900 mt-0.5">
                {job.persyaratanJLPT || 'Min. N4 / JFT-Basic'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {t.quota} <strong>{job.kuotaSiswa || 5} {t.students}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Toggle: Pilih Siswa Terdaftar VS Input Siswa Baru */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 p-2 gap-2">
          <button
            type="button"
            onClick={() => setNominationMode('EXISTING')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              nominationMode === 'EXISTING'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t.tabExisting(candidatePool.length)}</span>
          </button>

          <button
            type="button"
            onClick={() => setNominationMode('NEW')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              nominationMode === 'NEW'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.tabNew}</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitNomination} className="p-5 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {nominationMode === 'EXISTING' ? (
            <div className="space-y-3">
              {/* Candidate Search & Filter Tools */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filterOnlyMatchingField}
                      onChange={(e) => setFilterOnlyMatchingField(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="font-medium">{t.onlyMatchingField}</span>
                  </label>

                  <div className="flex gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllMatching}
                      className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-semibold hover:bg-indigo-100 transition cursor-pointer"
                    >
                      {t.selectAll}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="px-2 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-md font-semibold hover:bg-slate-200 transition cursor-pointer"
                    >
                      {t.reset}
                    </button>
                  </div>
                </div>
              </div>

              {/* Candidate Selection List */}
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {filteredCandidates.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs space-y-1">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">{t.emptyCandidate}</p>
                    <p className="text-[11px] text-slate-400">
                      {t.emptyCandidateDesc}
                    </p>
                  </div>
                ) : (
                  filteredCandidates.map((candidate, idx) => {
                    const isSelected = selectedStudentIds.includes(candidate.id);
                    return (
                      <div
                        key={candidate.id ? `${candidate.id}-${idx}` : `apply-cand-${idx}`}
                        onClick={() => {
                          if (!candidate.hasAppliedThisJob) {
                            toggleSelectCandidate(candidate.id);
                          }
                        }}
                        className={`p-3 flex items-center justify-between transition cursor-pointer ${
                          candidate.hasAppliedThisJob
                            ? 'bg-slate-50 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={candidate.hasAppliedThisJob}
                            onChange={() => toggleSelectCandidate(candidate.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />

                          {(() => {
                            const photoSrc = candidate.avatarUrl || getStudentPhotoUrl(candidate.rawStudent, candidate.rawCV);
                            return (
                              <StudentPhotoBadge
                                photoUrl={photoSrc}
                                student={candidate.rawStudent}
                                rirekisho={candidate.rawCV}
                                namaLengkap={candidate.namaLengkap}
                                size="xs"
                                ratioLabel="4×6"
                                theme="indigo"
                              />
                            );
                          })()}

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900">
                                {candidate.namaLengkap}
                              </h4>
                              {candidate.matchesSector && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                  {t.matchesBadge} ({translateSector(candidate.bidangKerja, lang)})
                                </span>
                              )}
                              {candidate.hasAppliedThisJob && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                  {t.alreadyAppliedBadge}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                              <span>JLPT: <strong className="text-indigo-700">{candidate.levelBahasa}</strong></span>
                              <span>•</span>
                              <span>{lang === 'ja' ? '職種:' : 'Bidang:'} <strong className="text-slate-700">{translateSector(candidate.bidangKerja, lang)}</strong></span>
                              <span>•</span>
                              <span className="font-mono text-[10px] text-slate-400">ID: {candidate.id}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              candidate.statusProgres.includes('Lolos') || candidate.statusProgres.includes('Naitei')
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : candidate.statusProgres.includes('Interview')
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {translateProgressStatus(candidate.statusProgres, lang)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {selectedStudentIds.length > 0 && (
                <div className="p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900 font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span>{t.selectedCountNotice(selectedStudentIds.length)}</span>
                  </div>
                  <span className="text-[11px] text-indigo-600 font-normal">
                    {t.initialStatusNotice}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Mode NEW: Direct Candidate Registration */
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>{t.formTitle}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {t.fullNameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCandidate.namaLengkap}
                    onChange={(e) => setNewCandidate({ ...newCandidate, namaLengkap: e.target.value })}
                    placeholder={t.fullNamePlaceholder}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {t.categoryLabel}
                  </label>
                  <select
                    value={newCandidate.kategoriKandidat}
                    onChange={(e) => setNewCandidate({ ...newCandidate, kategoriKandidat: e.target.value })}
                    className="w-full px-3 py-1.5 bg-indigo-50 border border-indigo-300 rounded-lg text-xs font-bold text-indigo-950 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="SISWA MITRA / NON IJEF">{lang === 'ja' ? '提携パートナー生（新規マッチング対象）' : 'SISWA MITRA / NON IJEF (Siswa Mitra SIM-SB)'}</option>
                    <option value="SISWA NON IJEF (New Comer)">{lang === 'ja' ? '一般候補生・ニューカマー (New Comer)' : 'NEW COMER / NON IJEF (Matching Job Standar)'}</option>
                    <option value="EX-MAGANG/EX-TRAINEER">{lang === 'ja' ? '技能実習修了者 (EX-JAPAN / 帰国生)' : 'EX-MAGANG / EX-TRAINEE (Tokutei Ginou Jepang)'}</option>
                    <option value="MATCHING JOB - Engineering / Gijinkoku">{lang === 'ja' ? '技人国 / エンジニア (Gijinkoku)' : 'MATCHING JOB - Engineering / Gijinkoku (Teknik)'}</option>
                    <option value="SISWA IJEF - Offline">{lang === 'ja' ? 'IJEF研修センター生 (対面合宿)' : 'SISWA IJEF - Offline (Asrama Pelatihan LPK)'}</option>
                    <option value="SISWA IJEF - Online">{lang === 'ja' ? 'IJEFオンライン生 (E-Learning)' : 'SISWA IJEF - Online (Kelas Daring E-Learning)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {t.emailLabel}
                  </label>
                  <input
                    type="email"
                    required
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    placeholder="rizki.pratama@gmail.com"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {t.phoneLabel}
                  </label>
                  <input
                    type="tel"
                    required
                    value={newCandidate.noHp}
                    onChange={(e) => setNewCandidate({ ...newCandidate, noHp: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {t.domicileLabel}
                  </label>
                  <input
                    type="text"
                    value={newCandidate.domisili}
                    onChange={(e) => setNewCandidate({ ...newCandidate, domisili: e.target.value })}
                    placeholder={lang === 'ja' ? 'バンドン、西ジャワ州' : 'Bandung, Jawa Barat'}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {t.sectorLabel}
                  </label>
                  <select
                    value={newCandidate.bidangKerja}
                    onChange={(e) => setNewCandidate({ ...newCandidate, bidangKerja: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                  >
                    <option value="KAIGO">{lang === 'ja' ? '介護分野（Kaigo）' : 'KAIGO (Caregiver / Lansia)'}</option>
                    <option value="PM">{lang === 'ja' ? '飲食料品製造業' : 'Pengolahan Makanan (Food Processing)'}</option>
                    <option value="PERTANIAN">{lang === 'ja' ? '農業分野' : 'Pertanian & Peternakan'}</option>
                    <option value="KIKAI KAKOU">{lang === 'ja' ? '製造業・機械加工' : 'Pemesinan & Manufaktur'}</option>
                    <option value="ENGINEERING">{lang === 'ja' ? '技術・人文知識・国際業務' : 'Engineering / Gijinkoku'}</option>
                    <option value="KONSTRUKSI">{lang === 'ja' ? '建設分野' : 'Konstruksi & Tekkin'}</option>
                    <option value="PENGELASAN">{lang === 'ja' ? '溶接・鉄鋼' : 'Pengelasan (Welding)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {t.jlptLabel}
                  </label>
                  <select
                    value={newCandidate.levelBahasa}
                    onChange={(e) => setNewCandidate({ ...newCandidate, levelBahasa: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                  >
                    <option value="N4">JLPT N4 / JFT-Basic A2 ({lang === 'ja' ? '特定技能標準' : 'Standar Tokutei'})</option>
                    <option value="N3">JLPT N3 ({lang === 'ja' ? '中級日常会話' : 'Menengah'})</option>
                    <option value="N2">JLPT N2 ({lang === 'ja' ? '上級・技人国' : 'Lancar / Gijinkoku'})</option>
                    <option value="N5">JLPT N5 ({lang === 'ja' ? '初級' : 'Dasar'})</option>
                    <option value="JFT-Basic">JFT-Basic A2</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCandidate.sertifikatSSW}
                    onChange={(e) => setNewCandidate({ ...newCandidate, sertifikatSSW: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span>{t.hasSSW}</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCandidate.pasporReady}
                    onChange={(e) => setNewCandidate({ ...newCandidate, pasporReady: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span>{t.hasPassport}</span>
                </label>
              </div>
            </div>
          )}

          {/* Recommendation Note */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {t.notesLabel}
            </label>
            <textarea
              rows={2}
              value={recommendationNotes}
              onChange={(e) => setRecommendationNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {t.cancelBtn}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? t.submitting
                  : nominationMode === 'EXISTING'
                  ? t.submitExisting(selectedStudentIds.length)
                  : t.submitNew}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
