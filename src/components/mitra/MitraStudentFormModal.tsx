import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { CalonSiswa, CVRirekisho } from '../../types';
import {
  UserPlus,
  X,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  User,
  GraduationCap,
  FileBadge2,
  MapPin,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface MitraStudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (studentName: string, email: string, category: string) => void;
}

export const MitraStudentFormModal: React.FC<MitraStudentFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const {
    saveStudentRegistration,
    saveRirekishoRecord,
    saveMitraSubmission,
    lang
  } = useApp();

  const mitraName = user?.namaMitra || user?.displayName || 'LPK Mitra Mandiri Indonesia';
  const mitraId = user?.mitraId || 'MTR-2026-088';

  const [formData, setFormData] = useState({
    namaLengkap: '',
    email: '',
    noHp: '',
    kategoriKandidat: 'SISWA MITRA / NON IJEF',
    jenisKelamin: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    bidangKerja: 'KAIGO',
    levelBahasa: 'N4',
    domisili: 'Bandung, Jawa Barat',
    pendidikanTerakhir: 'SMK / Sederajat',
    pengalaman: 'Pelatihan bahasa Jepang & keahlian bidang teknis.',
    sertifikatSSW: true,
    pasporReady: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaLengkap.trim() || !formData.email.trim() || !formData.noHp.trim()) {
      alert(
        lang === 'ja'
          ? '氏名、メールアドレス、電話番号を入力してください。'
          : 'Mohon lengkapi Nama Lengkap, Email, dan No WhatsApp siswa.'
      );
      return;
    }

    setIsSubmitting(true);

    const chosenCategory = formData.kategoriKandidat || 'SISWA MITRA / NON IJEF';
    const newId = `SISWA-MTR-${Date.now()}`;
    const newCVId = `CV-MTR-${Date.now()}`;
    const cleanEmail = formData.email.toLowerCase().trim();

    const studentObj: CalonSiswa = {
      id: newId,
      namaLengkap: formData.namaLengkap.trim(),
      email: cleanEmail,
      noHp: formData.noHp.trim(),
      kategoriKandidat: chosenCategory as any,
      kewarganegaraan: 'WNI',
      noKtp: `3201${Date.now().toString().slice(-12)}`,
      noKk: `3201${Date.now().toString().slice(-12)}`,
      alamatDomisili: formData.domisili,
      tempatLahir: formData.domisili,
      tanggalLahir: '2003-05-20',
      agama: 'Islam',
      jenisKelamin: formData.jenisKelamin,
      golonganDarah: 'O',
      statusPerkawinan: 'Lajang',
      namaAyah: 'Wali Siswa Binaan',
      pekerjaanAyah: 'Wiraswasta',
      ktpNpwpAyah: '-',
      namaIbu: 'Ibu Siswa Binaan',
      pekerjaanIbu: 'Ibu Rumah Tangga',
      ktpNpwpIbu: '-',
      berkasDokumen: {},
      statusPendaftaran: 'Terdaftar',
      createdAt: new Date().toISOString()
    };

    const cvObj: CVRirekisho = {
      id: newCVId,
      siswaId: newId,
      namaLengkap: formData.namaLengkap.trim(),
      email: cleanEmail,
      noHp: formData.noHp.trim(),
      kategoriKandidat: chosenCategory as any,
      bidangKerja: formData.bidangKerja,
      alamatLengkap: formData.domisili,
      jenisKelamin: formData.jenisKelamin,
      statusPernikahan: 'Lajang',
      levelBahasaJepang: formData.levelBahasa as any,
      statusCV: 'Siap Matching',
      statusProgres: 'Pending Nunggu Job',
      namaTSK: `Mitra: ${mitraName}`,
      detailProgres: `Kandidat terdaftar oleh Mitra ${mitraName}`,
      tanggalSubmit: new Date().toLocaleDateString('id-ID'),
      isBaru: true,
      updatedAt: new Date().toISOString(),
      riwayatPendidikan: [
        {
          jenjang: formData.pendidikanTerakhir || 'SMK / Sederajat',
          namaSekolah: `Binaan ${mitraName}`,
          jurusan: formData.bidangKerja,
          tahunMasuk: '2019',
          tahunLulus: '2022'
        }
      ],
      riwayatPekerjaan: []
    };

    // 1. Save to AppContext & Cloud Firestore
    saveStudentRegistration(studentObj);
    saveRirekishoRecord(cvObj);

    // 2. Register into Admin 2 Mitra Approval Queue
    saveMitraSubmission({
      mitraId: mitraId,
      mitraName: mitraName,
      submissionType: 'REGISTRASI_SISWA',
      status: 'PENDING',
      targetId: newId,
      targetTitle: `${formData.namaLengkap.trim()} (${formData.bidangKerja} • ${chosenCategory})`,
      description: `Registrasi siswa baru bidang ${formData.bidangKerja} (Level ${formData.levelBahasa}) oleh ${mitraName}.`,
      payload: {
        student: studentObj,
        rirekisho: cvObj,
        sector: formData.bidangKerja,
        languageLevel: formData.levelBahasa,
        email: cleanEmail
      }
    });

    // 3. Local cache registration for immediate student portal access
    try {
      const existingAccountsRaw = localStorage.getItem('ijef_mitra_registered_students');
      const accountsList = existingAccountsRaw ? JSON.parse(existingAccountsRaw) : [];
      accountsList.push({
        id: newId,
        namaLengkap: formData.namaLengkap.trim(),
        email: cleanEmail,
        kategoriKandidat: chosenCategory,
        mitraName: mitraName,
        registeredAt: new Date().toISOString()
      });
      localStorage.setItem('ijef_mitra_registered_students', JSON.stringify(accountsList));
    } catch (err) {}

    setIsSubmitting(false);
    onClose();

    if (onSuccess) {
      onSuccess(formData.namaLengkap.trim(), cleanEmail, chosenCategory);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                {lang === 'ja' ? 'パートナー候補生登録' : 'Registrasi Siswa Mitra'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                SIM-SB LPK IJEF
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white mt-1.5 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" />
              <span>{lang === 'ja' ? '新規候補生の登録' : 'Tambah Siswa Binaan Baru'}</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{lang === 'ja' ? '所属パートナー機関:' : 'Lembaga Mitra:'}</span>
              <strong className="text-amber-300 font-semibold">{mitraName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Nama Lengkap */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {lang === 'ja' ? '候補生フルネーム *' : 'Nama Lengkap Siswa *'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.namaLengkap}
                  onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                  placeholder={lang === 'ja' ? '例: Muhammad Danang Suryono' : 'Contoh: Muhammad Danang Suryono'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Kategori Kandidat */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {lang === 'ja' ? '候補生カテゴリー *' : 'Kategori Kandidat *'}
              </label>
              <select
                value={formData.kategoriKandidat}
                onChange={(e) => setFormData({ ...formData, kategoriKandidat: e.target.value })}
                className="w-full px-3 py-2 bg-indigo-50/70 border border-indigo-300 rounded-xl text-xs font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="SISWA MITRA / NON IJEF">{lang === 'ja' ? '提携校・一般候補生 (Siswa Mitra SIM-SB)' : 'SISWA MITRA / NON IJEF (Siswa Mitra SIM-SB)'}</option>
                <option value="SISWA NON IJEF (New Comer)">{lang === 'ja' ? '新規・一般応募者 (Matching Job Standar)' : 'SISWA NON IJEF (New Comer)'}</option>
                <option value="EX-MAGANG/EX-TRAINEER">{lang === 'ja' ? '元技能実習生・帰国者 (Tokutei Ginou Jepang)' : 'EX-MAGANG / EX-TRAINEE (Tokutei Ginou)'}</option>
                <option value="MATCHING JOB - Engineering / Gijinkoku">{lang === 'ja' ? '技術・人文知識・国際業務 (技人国)' : 'MATCHING JOB - Engineering / Gijinkoku'}</option>
                <option value="SISWA IJEF - Offline">{lang === 'ja' ? 'IJEF生・対面研修生 (Asrama Pelatihan)' : 'SISWA IJEF - Offline'}</option>
                <option value="SISWA IJEF - Online">{lang === 'ja' ? 'IJEF生・オンライン生 (Kelas Daring)' : 'SISWA IJEF - Online'}</option>
              </select>
            </div>

            {/* Email Siswa */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {lang === 'ja' ? 'メールアドレス *' : 'Email Siswa (Akun Login) *'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="danang.suryono@gmail.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {lang === 'ja' ? '候補生がログインして書類を登録するメールアドレス' : 'Email untuk akses login portal siswa & isi Rirekisho'}
              </span>
            </div>

            {/* Nomor WhatsApp */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {lang === 'ja' ? '電話番号 / WhatsApp *' : 'No WhatsApp / HP *'}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={formData.noHp}
                  onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                  placeholder="081234567890"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {lang === 'ja' ? '面接日程や通知を受け取る連絡先' : 'Kontak aktif notifikasi jadwal interview & naitei'}
              </span>
            </div>

            {/* Klasifikasi Bidang Kerja */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {lang === 'ja' ? '専門分野' : 'Klasifikasi Bidang Kerja'}
              </label>
              <select
                value={formData.bidangKerja}
                onChange={(e) => setFormData({ ...formData, bidangKerja: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="KAIGO">{lang === 'ja' ? '介護分野（Kaigo）' : 'KAIGO (Caregiver / 介護)'}</option>
                <option value="PM">{lang === 'ja' ? '飲食料品製造業（食品製造）' : 'Pengolahan Makanan (食品製造)'}</option>
                <option value="PERTANIAN">{lang === 'ja' ? '農業分野（農業・畜産）' : 'Pertanian & Hortikultura (農業)'}</option>
                <option value="KIKAI KAKOU">{lang === 'ja' ? '機械加工・製造分野' : 'Pemesinan & Manufaktur (機械製造)'}</option>
                <option value="ENGINEERING">{lang === 'ja' ? '技術・エンジニア（技人国）' : 'Engineering / Gijinkoku (技術)'}</option>
                <option value="KONSTRUKSI">{lang === 'ja' ? '建設分野' : 'Konstruksi & Tekkin (建設)'}</option>
                <option value="PENGELASAN">{lang === 'ja' ? '溶接分野' : 'Pengelasan (溶接)'}</option>
                <option value="RESTORAN">{lang === 'ja' ? '外食業分野' : 'Restoran & Pelayanan Makanan (外食)'}</option>
                <option value="AKOMODASI">{lang === 'ja' ? '宿泊分野' : 'Perhotelan & Akomodasi (宿泊)'}</option>
              </select>
            </div>

            {/* Level Bahasa Jepang */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {lang === 'ja' ? '日本語レベル' : 'Level Bahasa Jepang'}
              </label>
              <select
                value={formData.levelBahasa}
                onChange={(e) => setFormData({ ...formData, levelBahasa: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="N4">{lang === 'ja' ? 'JLPT N4 / JFT-Basic A2（特定技能基準）' : 'JLPT N4 / JFT-Basic A2 (Standar Tokutei)'}</option>
                <option value="N3">{lang === 'ja' ? 'JLPT N3（中級レベル）' : 'JLPT N3 (Menengah / Terampil)'}</option>
                <option value="N2">{lang === 'ja' ? 'JLPT N2（上級レベル）' : 'JLPT N2 (Tinggi / Fasih)'}</option>
                <option value="N5">{lang === 'ja' ? 'JLPT N5（初級学習中）' : 'JLPT N5 (Dasar Pemula)'}</option>
              </select>
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {lang === 'ja' ? '性別' : 'Jenis Kelamin'}
              </label>
              <select
                value={formData.jenisKelamin}
                onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Laki-laki">{lang === 'ja' ? '男性 (Laki-laki)' : 'Laki-laki'}</option>
                <option value="Perempuan">{lang === 'ja' ? '女性 (Perempuan)' : 'Perempuan'}</option>
              </select>
            </div>

            {/* Domisili */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {lang === 'ja' ? '居住地 / 出身地' : 'Domisili Siswa'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.domisili}
                  onChange={(e) => setFormData({ ...formData, domisili: e.target.value })}
                  placeholder="Bandung, Jawa Barat"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Pendidikan Terakhir */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {lang === 'ja' ? '最終学歴' : 'Pendidikan Terakhir'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.pendidikanTerakhir}
                  onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })}
                  placeholder="SMK Negeri 1 (Teknik Pemesinan) / D3 / S1"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Banner Info Integrasi */}
          <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 text-xs text-indigo-900 space-y-1.5 shadow-2xs">
            <div className="font-bold flex items-center gap-1.5 text-indigo-950">
              <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0" />
              <span>
                {lang === 'ja'
                  ? 'アカウント自動発行＆データ直接連携'
                  : 'Akun Calon Siswa Otomatis Dibuat & Terintegrasi'}
              </span>
            </div>
            <p className="text-[11px] text-indigo-800 leading-relaxed">
              {lang === 'ja'
                ? '登録と同時に生徒アカウントが発行されます。候補生は登録されたメールアドレスでポータルにログインし、JIS規格履歴書や提出書類を直接編集・更新できます。'
                : 'Data yang didaftarkan oleh Mitra langsung tersinkronisasi ke Portal Siswa dan antrean Admin 2. Siswa dapat login menggunakan email yang didaftarkan untuk melengkapi biodata, mengunggah dokumen (KTP/Ijazah), dan menyempurnakan Rirekisho Standar JIS.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {lang === 'ja' ? 'キャンセル' : 'Batal'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (lang === 'ja' ? '保存中...' : 'Menyimpan...')
                  : (lang === 'ja' ? '候補生を保存' : 'Simpan & Daftarkan Siswa')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
