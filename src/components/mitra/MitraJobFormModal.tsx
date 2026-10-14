import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { JobPosting } from '../../types';
import {
  Briefcase,
  MapPin,
  ShieldCheck,
  Banknote,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

interface MitraJobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialJob?: JobPosting | null;
  onSaveSuccess?: (savedJob: JobPosting) => void;
}

export const MitraJobFormModal: React.FC<MitraJobFormModalProps> = ({
  isOpen,
  onClose,
  initialJob,
  onSaveSuccess
}) => {
  const { saveJobPosting, saveMitraSubmission, lang = 'id' } = useApp();
  const { user } = useAuth();

  const mitraName = user?.namaMitra || user?.displayName || 'LPK Mitra Kerja';
  const defaultKode = `MTR-${Math.floor(100 + Math.random() * 900)}`;

  const getEmptyJobForm = (): JobPosting => ({
    id: `JOB-MITRA-${Date.now()}`,
    kodeJob: defaultKode,
    judulPekerjaan: '',
    perusahaanJepang: '',
    kumiaiRujukan: mitraName,
    tskSumberJob: mitraName,
    lokasiPrefektur: 'Tokyo',
    kategoriTarget: 'SISWA NON IJEF (New Comer)',
    kategoriDomisili: 'Lokal (Indonesia)',
    urgensiJob: 'STANDART',
    jenisKelamin: '男女 (Laki-laki & Perempuan)',
    gajiBulananYen: 210000,
    gajiString: '210.000円/bulan',
    gajiEstimasiIdr: 22000000,
    persyaratanJLPT: 'Sertifikat JLPT N4 / JFT-Basic A2 + SSW',
    kualifikasi: '',
    biayaProses: 'Sesuai Ketentuan',
    keteranganTambahan: '',
    deskripsiPekerjaan: '',
    fasilitasAsrama: 'Disediakan Perusahaan',
    kuotaSiswa: 1,
    statusJob: 'Aktif',
    statusAktif: true
  });

  const [jobForm, setJobForm] = useState<JobPosting>(getEmptyJobForm());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = {
    id: {
      editTitle: 'EDIT DATA LOWONGAN MITRA',
      addTitle: 'TAMBAH LOWONGAN JOB SENDIRI',
      portalBadge: 'PORTAL MITRA',
      subHeader: 'SISTEM KATALOG JOB MATCHING IJEF & MITRA',
      errTitleReq: 'Nama Lowongan / Judul Job wajib diisi.',
      errPrefReq: 'Prefektur / Lokasi pekerjaan wajib diisi.',
      sec1Title: 'INFORMASI DASAR & LOKASI',
      jobCode: 'KODE LOWONGAN',
      jobCodePlaceholder: 'Contoh: INTL015 / IND012 / MTR001',
      jobStatus: 'STATUS LOWONGAN',
      statusOpen: 'Aktif (OPEN)',
      statusClosed: 'Tutup (CLOSED)',
      urgency: 'STATUS URGENSI JOB',
      domicile: 'DOMISILI JOB SISWA',
      domicileJapan: 'Domestik (Jepang)',
      domicileIndo: 'Lokal (Indonesia)',
      location: 'PREFEKTUR / LOKASI',
      locationPlaceholder: 'Contoh: 兵庫県 (Hyogo), Kumamoto, Tokyo',
      jobTitle: 'NAMA LOWONGAN / JUDUL JOB',
      jobTitlePlaceholder: 'Contoh: KAIGO 介護 (Perawat Lansia) / PENGOLAHAN MAKANAN (食品加工)',
      company: 'NAMA PERUSAHAAN',
      companyPlaceholder: 'Contoh: GN / Kaisha Japan Co., Ltd',
      salary: 'GAJI (BULAN/TAHUN)',
      salaryPlaceholder: 'Contoh: 220.000~223.000円/bulan',
      kumiai: 'KUMIAI / TSK PARTNER RUJUKAN',
      kumiaiPlaceholder: 'Contoh: Hibiki / Enlink / Marta Kumiai / Nama Mitra',
      sec2Title: 'KLASIFIKASI & PERSYARATAN KANDIDAT',
      targetCategory: 'KLASIFIKASI TARGET KANDIDAT',
      targetAll: 'Semua Non-IJEF',
      targetNewComer: 'SISWA NON IJEF (New Comer)',
      targetGijinkoku: 'MATCHING JOB - Engineering / Gijinkoku',
      targetExTrainee: 'MATCHING JOB - Ex-Magang / Ex-Trainee',
      gender: 'GENDER / JENIS KELAMIN',
      genderBoth: 'Pria & Wanita (男女)',
      genderMale: 'Pria Saja (男)',
      genderFemale: 'Wanita Saja (女)',
      quota: 'KUOTA / JUMLAH KEBUTUHAN',
      qualifications: 'KUALIFIKASI & SYARAT KHUSUS (JLPT, SSW, USIA, PENGALAMAN)',
      qualificationsPlaceholder: 'Contoh: JLPT N4/JFT A-2 & SSW Kaigo, Usia maks 35 tahun, Berdomisili di Jepang / Indonesia, Pengalaman Kaigo min 1 tahun.',
      sec3Title: 'INFORMASI BIAYA & FASILITAS',
      costs: 'BIAYA JOB / PROSES & TANGGUNGAN',
      costsPlaceholder: 'Contoh: Potong Gaji / Cash / Rp 30.000.000 (Free Tiket, MCU, Visa, EKTKLN)',
      dormitory: 'FASILITAS ASRAMA & BENEFIT',
      dormitoryPlaceholder: 'Contoh: Asrama fully furnished, Transportasi, Lembur, Shakai Hoken',
      description: 'DESKRIPSI PEKERJAAN & TUGAS HARIAN',
      descriptionPlaceholder: 'Contoh: \n• Berdomisili di Jepang / Indonesia\n• Dapat mulai bekerja 1 September 2026\n• Memiliki pengalaman Kaigo minimal 1 tahun\n• Bersedia merawat pengguna layanan dengan disabilitas',
      notes: 'KETERANGAN TAMBAHAN / SYARAT KHUSUS',
      notesPlaceholder: 'Contoh: Penerbangan dari Jakarta / Wawancara 3x via Zoom / Catatan khusus',
      cancelBtn: 'BATAL',
      saveBtn: 'SIMPAN DATA LOWONGAN'
    },
    ja: {
      editTitle: 'パートナー求人情報の編集',
      addTitle: '独自求人票の新規登録',
      portalBadge: 'パートナーポータル',
      subHeader: 'IJEF & パートナー機関 人材マッチングシステム',
      errTitleReq: '求人名・職種名は必須入力項目です。',
      errPrefReq: '勤務地（都道府県）は必須入力項目です。',
      sec1Title: '基本情報 & 勤務地',
      jobCode: '求人管理コード',
      jobCodePlaceholder: '例: INTL015 / IND012 / MTR001',
      jobStatus: '募集ステータス',
      statusOpen: '募集中 (OPEN)',
      statusClosed: '募集終了 (CLOSED)',
      urgency: '採用緊急度',
      domicile: '対象現住所区分',
      domicileJapan: '日本国内在住 (国内転職)',
      domicileIndo: 'インドネシア現地 (海外受入)',
      location: '勤務地（都道府県）',
      locationPlaceholder: '例: 東京都、兵庫県、熊本県、愛知県',
      jobTitle: '求人職種・案件名',
      jobTitlePlaceholder: '例: 介護（施設ケアワーカー）/ 飲食料品製造 / 農業',
      company: '受入企業・施設名',
      companyPlaceholder: '例: 〇〇株式会社 / 医療法人〇〇会',
      salary: '月給 / 予定給与',
      salaryPlaceholder: '例: 220,000〜235,000円/月',
      kumiai: '監理団体 / 登録支援機関 (TSK)',
      kumiaiPlaceholder: '例: 〇〇協同組合 / 登録支援機関〇〇 / 自社管理',
      sec2Title: '応募要件 & 候補生区分',
      targetCategory: '対象候補生区分',
      targetAll: '全候補生対象 (Non-IJEF)',
      targetNewComer: '新規マッチング生 (New Comer)',
      targetGijinkoku: '技人国 / エンジニア案件',
      targetExTrainee: '技能実習修了者 (帰国生・EX)',
      gender: '性別条件',
      genderBoth: '不問 (男女)',
      genderMale: '男性のみ (男)',
      genderFemale: '女性のみ (女)',
      quota: '募集人数 / 採用枠',
      qualifications: '応募資格・スキル要件 (日本語、SSW、年齢、実務経験)',
      qualificationsPlaceholder: '例: JLPT N4 / JFT-Basic以上、特定技能評価試験合格者、年齢35歳以下、介護施設での実務経験1年以上歓迎。',
      sec3Title: '費用負担 & 待遇・福利厚生',
      costs: '受入・渡航費用等の負担区分',
      costsPlaceholder: '例: 企業全額負担 / 給与控除 / 渡航航空券・健康診断・ビザ手配含む',
      dormitory: '社員寮・住居・福利厚生',
      dormitoryPlaceholder: '例: 完全個室寮完備（家賃補助あり）、社会保険完備、残業手当、交通費支給',
      description: '業務内容 & 主な担当職務',
      descriptionPlaceholder: '例: \n• 特別養護老人ホームにおける入居者の介護全般\n• 食事・入浴・排泄介助およびレクリエーション企画\n• 2026年9月勤務開始予定',
      notes: '特記事項・選考プロセス',
      notesPlaceholder: '例: Zoomオンライン面接2回 / 日本語作文あり / 入社前研修実施',
      cancelBtn: 'キャンセル',
      saveBtn: '求人情報を保存・申請する'
    }
  }[lang];

  useEffect(() => {
    if (isOpen) {
      if (initialJob) {
        setJobForm({
          ...initialJob,
          kategoriTarget: initialJob.kategoriTarget || 'SISWA NON IJEF (New Comer)',
          kategoriDomisili: initialJob.kategoriDomisili || (initialJob.statusJob === 'Lokal/Domestik (Jepang)' ? 'Domestik (Jepang)' : 'Lokal (Indonesia)'),
          urgensiJob: initialJob.urgensiJob || 'STANDART',
          statusJob: initialJob.statusJob === 'Tutup' ? 'Tutup' : 'Aktif',
          statusAktif: initialJob.statusJob !== 'Tutup'
        });
      } else {
        setJobForm(getEmptyJobForm());
      }
      setErrorMsg(null);
    }
  }, [isOpen, initialJob]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobForm.judulPekerjaan.trim()) {
      setErrorMsg(t.errTitleReq);
      return;
    }

    if (!jobForm.lokasiPrefektur.trim()) {
      setErrorMsg(t.errPrefReq);
      return;
    }

    // Parse salary numeric if possible
    let cleanSalary = jobForm.gajiBulananYen;
    if (jobForm.gajiString) {
      const parsedDigits = parseInt(jobForm.gajiString.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsedDigits) && parsedDigits > 0) {
        cleanSalary = parsedDigits;
      }
    }

    const payload: JobPosting = {
      ...jobForm,
      id: jobForm.id || `JOB-MITRA-${Date.now()}`,
      kodeJob: (jobForm.kodeJob || defaultKode).trim(),
      judulPekerjaan: jobForm.judulPekerjaan.trim(),
      perusahaanJepang: (jobForm.perusahaanJepang || 'Mitra Perusahaan Jepang').trim(),
      kumiaiRujukan: (jobForm.kumiaiRujukan || mitraName).trim(),
      tskSumberJob: (jobForm.tskSumberJob || mitraName).trim(),
      lokasiPrefektur: jobForm.lokasiPrefektur.trim(),
      kategoriDomisili: jobForm.kategoriDomisili || (jobForm.statusJob === 'Lokal/Domestik (Jepang)' ? 'Domestik (Jepang)' : 'Lokal (Indonesia)'),
      statusJob: jobForm.statusJob === 'Tutup' ? 'Tutup' : 'Aktif',
      gajiBulananYen: cleanSalary || 200000,
      gajiEstimasiIdr: jobForm.gajiEstimasiIdr || Math.round((cleanSalary || 200000) * 105),
      kualifikasi: jobForm.kualifikasi || jobForm.persyaratanJLPT || 'Sertifikat Bahasa & Skill',
      persyaratanJLPT: jobForm.persyaratanJLPT || jobForm.kualifikasi || 'JLPT N4 / JFT-Basic A2',
      kuotaSiswa: Math.max(1, Number(jobForm.kuotaSiswa) || 1),
      statusAktif: jobForm.statusJob !== 'Tutup'
    };

    saveJobPosting(payload);

    // Register into Admin 2 Mitra Approval Queue
    saveMitraSubmission({
      mitraId: user?.mitraId || 'MTR-2026-088',
      mitraName: mitraName,
      submissionType: 'TAMBAH_JOB_MITRA',
      status: 'PENDING',
      targetId: payload.id,
      targetTitle: `${payload.judulPekerjaan} (${payload.perusahaanJepang || 'Perusahaan Jepang'})`,
      description: `Pengajuan lowongan kerja baru [${payload.judulPekerjaan}] di ${payload.lokasiPrefektur} (${payload.gajiString || `${payload.gajiBulananYen.toLocaleString()} Yen`}, Kuota ${payload.kuotaSiswa} org) oleh ${mitraName}.`,
      payload: {
        job: payload,
        mitraId: user?.mitraId || 'MTR-2026-088',
        mitraName
      }
    });

    if (onSaveSuccess) {
      onSaveSuccess(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fade-in">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col text-slate-800 shadow-2xl my-auto overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 px-6 pt-5 shrink-0 bg-slate-50/80 rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <span>{initialJob ? t.editTitle : t.addTitle}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {t.portalBadge}
                </span>
              </h3>
              <p className="text-[10px] sm:text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest mt-0.5">
                {t.subHeader}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800">
          {/* SECTION 1: INFORMASI DASAR & LOKASI */}
          <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-200/80 pb-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>{t.sec1Title}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.jobCode}
                </label>
                <input
                  type="text"
                  value={jobForm.kodeJob || ''}
                  onChange={(e) => setJobForm({ ...jobForm, kodeJob: e.target.value })}
                  placeholder={t.jobCodePlaceholder}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.jobStatus}
                </label>
                <select
                  value={jobForm.statusJob === 'Tutup' ? 'Tutup' : 'Aktif'}
                  onChange={(e) => setJobForm({ ...jobForm, statusJob: e.target.value as any })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer"
                >
                  <option value="Aktif">{t.statusOpen}</option>
                  <option value="Tutup">{t.statusClosed}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.urgency}
                </label>
                <select
                  value={(jobForm.urgensiJob || 'STANDART').toUpperCase()}
                  onChange={(e) => setJobForm({ ...jobForm, urgensiJob: e.target.value as any })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer"
                >
                  <option value="URGENT">🔥 URGENT ({lang === 'ja' ? '至急' : 'Mendesak'})</option>
                  <option value="STANDART">⚡ STANDART ({lang === 'ja' ? '通常' : 'Standar'})</option>
                  <option value="SLOW">⏳ SLOW ({lang === 'ja' ? '随時' : 'Santai'})</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.domicile}
                </label>
                <select
                  value={jobForm.kategoriDomisili || (jobForm.statusJob === 'Lokal/Domestik (Jepang)' ? 'Domestik (Jepang)' : 'Lokal (Indonesia)')}
                  onChange={(e) => setJobForm({ ...jobForm, kategoriDomisili: e.target.value as any })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer"
                >
                  <option value="Domestik (Jepang)">{t.domicileJapan}</option>
                  <option value="Lokal (Indonesia)">{t.domicileIndo}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.location} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={jobForm.lokasiPrefektur}
                  onChange={(e) => setJobForm({ ...jobForm, lokasiPrefektur: e.target.value })}
                  required
                  placeholder={t.locationPlaceholder}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-5">
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.jobTitle} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={jobForm.judulPekerjaan}
                  onChange={(e) => setJobForm({ ...jobForm, judulPekerjaan: e.target.value })}
                  required
                  placeholder={t.jobTitlePlaceholder}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.company}
                </label>
                <input
                  type="text"
                  value={jobForm.perusahaanJepang || ''}
                  onChange={(e) => setJobForm({ ...jobForm, perusahaanJepang: e.target.value })}
                  placeholder={t.companyPlaceholder}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.salary}
                </label>
                <input
                  type="text"
                  value={jobForm.gajiString || ''}
                  onChange={(e) => setJobForm({ ...jobForm, gajiString: e.target.value })}
                  placeholder={t.salaryPlaceholder}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-amber-700 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.kumiai}
                </label>
                <input
                  type="text"
                  value={jobForm.kumiaiRujukan || ''}
                  onChange={(e) => setJobForm({ ...jobForm, kumiaiRujukan: e.target.value })}
                  placeholder={t.kumiaiPlaceholder}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: KLASIFIKASI & DOKUMEN / KANDIDAT */}
          <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-200/80 pb-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>{t.sec2Title}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.targetCategory}
                </label>
                <select
                  value={jobForm.kategoriTarget}
                  onChange={(e) => setJobForm({ ...jobForm, kategoriTarget: e.target.value as any })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none transition cursor-pointer"
                >
                  <option value="Semua Non-IJEF">{t.targetAll}</option>
                  <option value="SISWA NON IJEF (New Comer)">{t.targetNewComer}</option>
                  <option value="MATCHING JOB - Engineering / Gijinkoku">{t.targetGijinkoku}</option>
                  <option value="MATCHING JOB - Ex-Magang / Ex-Trainee">{t.targetExTrainee}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.gender}
                </label>
                <select
                  value={jobForm.jenisKelamin || '男女 (Laki-laki & Perempuan)'}
                  onChange={(e) => setJobForm({ ...jobForm, jenisKelamin: e.target.value as any })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-purple-500 outline-none transition cursor-pointer"
                >
                  <option value="男女 (Laki-laki & Perempuan)">{t.genderBoth}</option>
                  <option value="男 (Laki-laki)">{t.genderMale}</option>
                  <option value="女 (Perempuan)">{t.genderFemale}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.quota}
                </label>
                <input
                  type="number"
                  min={1}
                  value={jobForm.kuotaSiswa}
                  onChange={(e) => setJobForm({ ...jobForm, kuotaSiswa: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-emerald-700 font-extrabold focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.qualifications}
                </label>
                <textarea
                  rows={3}
                  value={jobForm.kualifikasi || jobForm.persyaratanJLPT}
                  onChange={(e) => setJobForm({ ...jobForm, kualifikasi: e.target.value, persyaratanJLPT: e.target.value })}
                  placeholder={t.qualificationsPlaceholder}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none leading-relaxed transition min-h-[90px] whitespace-pre-wrap"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: INFORMASI BIAYA & FASILITAS */}
          <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-200/80 pb-2">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>{t.sec3Title}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.costs}
                </label>
                <textarea
                  rows={2}
                  value={jobForm.biayaProses || ''}
                  onChange={(e) => setJobForm({ ...jobForm, biayaProses: e.target.value })}
                  placeholder={t.costsPlaceholder}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed transition min-h-[70px]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.dormitory}
                </label>
                <textarea
                  rows={2}
                  value={jobForm.fasilitasAsrama || ''}
                  onChange={(e) => setJobForm({ ...jobForm, fasilitasAsrama: e.target.value })}
                  placeholder={t.dormitoryPlaceholder}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed transition min-h-[70px]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.description}
                </label>
                <textarea
                  rows={4}
                  value={jobForm.deskripsiPekerjaan || ''}
                  onChange={(e) => setJobForm({ ...jobForm, deskripsiPekerjaan: e.target.value })}
                  placeholder={t.descriptionPlaceholder}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed transition min-h-[110px] whitespace-pre-wrap"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                  {t.notes}
                </label>
                <textarea
                  rows={3}
                  value={jobForm.keteranganTambahan || ''}
                  onChange={(e) => setJobForm({ ...jobForm, keteranganTambahan: e.target.value })}
                  placeholder={t.notesPlaceholder}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed transition min-h-[85px] whitespace-pre-wrap"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 border-t border-slate-200 px-6 py-4 bg-slate-50 rounded-b-3xl shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {t.cancelBtn}
          </button>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-indigo-600/20 flex items-center space-x-2"
          >
            <Check className="w-4 h-4 text-emerald-300" />
            <span>{t.saveBtn}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
