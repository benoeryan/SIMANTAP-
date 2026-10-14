import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { HEALTH_QUESTIONS, HEALTH_PROCEDURE_STAGES } from '../data/healthFormFields';
import { HasilKesehatan, HealthStatus } from '../types';
import { saveHealthToFirestore } from '../lib/firebase';
import {
  Stethoscope,
  Save,
  CheckCircle2,
  AlertOctagon,
  UserCheck,
  Activity,
  ShieldAlert,
  ClipboardList,
  User,
  Dumbbell,
  Eye,
  FlaskConical,
  Award,
  FileText,
  HeartPulse,
  Info,
  Sparkles,
  Check,
  ChevronRight
} from 'lucide-react';

export const MedicalCheckup: React.FC = () => {
  const { activeStudent, healthRecords, saveHealthRecord } = useApp();

  const [activeStepTab, setActiveStepTab] = useState<number>(1);

  const [formData, setFormData] = useState<HasilKesehatan>(() => {
    if (activeStudent && healthRecords[activeStudent.id]) {
      return healthRecords[activeStudent.id];
    }
    return {
      id: `KES-${Math.floor(100 + Math.random() * 900)}`,
      siswaId: activeStudent ? activeStudent.id : '',
      namaSiswa: activeStudent ? activeStudent.namaLengkap : '',
      tinggiBadan: 168,
      beratBadan: 60,
      bmiIndex: 21.2,
      tekananDarah: '120/80',
      denyutNadi: 76,
      butaWarna: 'Normal',
      visusMataKiri: '6/6',
      visusMataKanan: '6/6',
      tesPushUp: 30,
      tesSitUp: 32,
      tesAngkatBeban: 'Lulus (20kg)',
      tesKeseimbangan: 'Normal',
      riwayatPenyakitSerius: 'Tidak Ada',
      pengobatanRutin: 'Tidak Ada',
      riwayatOperasi: 'Belum Pernah',
      riwayatTbc: 'Tidak Ada',
      riwayatHepatitis: 'Bebas Hepatitis',
      penyakitAsma: 'Tidak Ada',
      penyakitOrganDalam: 'Tidak Ada',
      kecelakaanParah: 'Tidak Pernah',
      perokokAktif: 'Bukan Perokok',
      pecanduAlkohol: 'Tidak Pernah',
      obatObatanTerlarang: 'Bebas Narkoba (Sama Sekali Tidak)',
      gangguanJiwaStress: 'Tidak Ada',
      masalahTulangSendi: 'Normal / Sehat',
      kepemilikanTato: 'Tidak Ada Tato',
      hasilRontgenParu: 'Normal / Jernih',
      hasilHbsAg: 'Non-Reaktif (Bebas Hep B)',
      hasilTesUrine: 'Bebas Narkoba (Negatif)',
      metodeProsedurTest: 'MCU Terintegrasi Standar LPK IJEF & Industri Jepang',
      statusFit: 'FIT',
      catatanDokter: 'Pemeriksaan fisik, tanda vital, dan hasil lab radiologi dalam batas normal (Fit To Work).',
      evaluatorName: 'dr. Hendra Kurniawan, Sp.Ok',
      updatedAt: new Date().toISOString()
    };
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeStudent) {
      if (healthRecords[activeStudent.id]) {
        setFormData(healthRecords[activeStudent.id]);
      } else {
        setFormData({
          id: `KES-${Math.floor(100 + Math.random() * 900)}`,
          siswaId: activeStudent.id,
          namaSiswa: activeStudent.namaLengkap,
          tinggiBadan: 168,
          beratBadan: 60,
          bmiIndex: 21.2,
          tekananDarah: '120/80',
          denyutNadi: 76,
          butaWarna: 'Normal',
          visusMataKiri: '6/6',
          visusMataKanan: '6/6',
          tesPushUp: 30,
          tesSitUp: 32,
          tesAngkatBeban: 'Lulus (20kg)',
          tesKeseimbangan: 'Normal',
          riwayatPenyakitSerius: 'Tidak Ada',
          pengobatanRutin: 'Tidak Ada',
          riwayatOperasi: 'Belum Pernah',
          riwayatTbc: 'Tidak Ada',
          riwayatHepatitis: 'Bebas Hepatitis',
          penyakitAsma: 'Tidak Ada',
          penyakitOrganDalam: 'Tidak Ada',
          kecelakaanParah: 'Tidak Pernah',
          perokokAktif: 'Bukan Perokok',
          pecanduAlkohol: 'Tidak Pernah',
          obatObatanTerlarang: 'Bebas Narkoba (Sama Sekali Tidak)',
          gangguanJiwaStress: 'Tidak Ada',
          masalahTulangSendi: 'Normal / Sehat',
          kepemilikanTato: 'Tidak Ada Tato',
          hasilRontgenParu: 'Normal / Jernih',
          hasilHbsAg: 'Non-Reaktif (Bebas Hep B)',
          hasilTesUrine: 'Bebas Narkoba (Negatif)',
          metodeProsedurTest: 'MCU Terintegrasi Standar LPK IJEF & Industri Jepang',
          statusFit: 'FIT',
          catatanDokter: 'Pemeriksaan fisik, tanda vital, dan hasil lab radiologi dalam batas normal (Fit To Work).',
          evaluatorName: 'dr. Hendra Kurniawan, Sp.Ok',
          updatedAt: new Date().toISOString()
        });
      }
    }
  }, [
    activeStudent?.id,
    healthRecords[activeStudent?.id || '']?.id,
    healthRecords[activeStudent?.id || '']?.updatedAt,
    healthRecords[activeStudent?.id || '']?.statusFit
  ]);

  // Recalculate BMI automatically when Height/Weight changes
  const handlePhysicalChange = (field: keyof HasilKesehatan, val: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: val, updatedAt: new Date().toISOString() };
      if (field === 'tinggiBadan' || field === 'beratBadan') {
        const tb = Number(field === 'tinggiBadan' ? val : prev.tinggiBadan || 168) / 100;
        const bb = Number(field === 'beratBadan' ? val : prev.beratBadan || 60);
        if (tb > 0 && bb > 0) {
          updated.bmiIndex = Number((bb / (tb * tb)).toFixed(1));
        }
      }
      return updated;
    });
  };

  const handleOptionChange = (key: keyof HasilKesehatan, val: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: val,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeStudent) {
      alert('Silakan pilih calon siswa terlebih dahulu!');
      return;
    }

    saveHealthRecord(formData);
    await saveHealthToFirestore(formData);
    setToastMessage('Data Rekam Medis & Tes Kesehatan berhasil disimpan ke koleksi Firestore [hasil_kesehatan]!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (!activeStudent) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="p-8 bg-white border border-slate-200 rounded-xl max-w-md mx-auto space-y-3 shadow-sm">
          <Stethoscope className="w-12 h-12 text-rose-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Pilih Calon Siswa</h3>
          <p className="text-xs text-slate-500">
            Silakan pilih siswa dari dropdown di bilah navigasi atas untuk mengelola modul pengujian & pemeriksaan kesehatan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-600 font-semibold text-xs tracking-wider uppercase">
            <Stethoscope className="w-4 h-4" />
            <span>MODUL 2: SKRINING & PROSEDUR TES KESEHATAN MEDIS</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1">
            Sistem Evaluasi 5 Tahapan Tes Kesehatan (hasil_kesehatan)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Standar Prosedur Pengujian Fisik, Sensory, 14 Indikator Medis, Radiologi, & Keputusan Dokter Okupasi LPK IJEF CORP.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleSubmit()}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center space-x-2 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Rekam Medis Ke Firestore</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between text-xs animate-fade-in shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Active Student Summary Bar */}
      <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
            {activeStudent.namaLengkap.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{activeStudent.namaLengkap}</h3>
            <p className="text-xs text-slate-400">
              ID: <span className="font-mono text-emerald-400">{activeStudent.id}</span> | NIK: {activeStudent.noKtp} | Gender: {activeStudent.jenisKelamin}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Tinggi / Berat:</span>
            <span className="font-mono font-bold text-slate-200">
              {formData.tinggiBadan || 168} cm / {formData.beratBadan || 60} kg
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px]">IMT / BMI:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formData.bmiIndex || 21.2}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px]">Keputusan Medis:</span>
            <span
              className={`font-bold px-2.5 py-0.5 rounded text-xs inline-block mt-0.5 ${
                formData.statusFit === 'FIT'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {formData.statusFit === 'FIT' ? '✓ FIT TO WORK' : '✕ UNFIT'}
            </span>
          </div>
        </div>
      </div>

      {/* 5-STAGE PROCEDURE NAVIGATION TABS */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {HEALTH_PROCEDURE_STAGES.map((stg) => {
            const isActive = activeStepTab === stg.stageNumber;
            return (
              <button
                key={stg.stageNumber}
                onClick={() => setActiveStepTab(stg.stageNumber)}
                className={`p-3 rounded-lg text-left transition cursor-pointer border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    Tahap {stg.stageNumber}
                  </span>
                  {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <h4 className="text-xs font-bold truncate">{stg.title}</h4>
              </button>
            );
          })}
        </div>
      </div>

      {/* STAGE CONTENT DISPLAY */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TAHAP 1: ANTROPOMETRI & TANDA VITAL */}
        {activeStepTab === 1 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Tahap 1: Pengukuran Fisik, Dimensi Postur & Tanda Vital
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sesuai petunjuk metode tes kesehatan LPK IJEF Corp (Standar minimal kerja luar negeri).
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">
                  Tinggi Badan (cm) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="168"
                  value={formData.tinggiBadan || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                    handlePhysicalChange('tinggiBadan', val === '' ? '' : Number(val));
                  }}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500">Min. Pria: 158 cm | Min. Wanita: 150 cm</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">
                  Berat Badan (kg) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="60"
                  value={formData.beratBadan || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                    handlePhysicalChange('beratBadan', val === '' ? '' : Number(val));
                  }}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500">Proporsional dengan tinggi badan</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <label className="font-bold text-emerald-900 block">
                  Indeks Massa Tubuh (IMT / BMI)
                </label>
                <div className="text-2xl font-black text-emerald-700 font-mono">
                  {formData.bmiIndex || 21.2}
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 block">
                  {formData.bmiIndex && formData.bmiIndex < 18.5
                    ? 'Underweight (Kurus)'
                    : formData.bmiIndex && formData.bmiIndex > 25
                    ? 'Overweight (Gemuk)'
                    : '✓ Ideal / Normal Range'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Tekanan Darah (mmHg)</label>
                <input
                  type="text"
                  placeholder="120/80"
                  value={formData.tekananDarah || '120/80'}
                  onChange={(e) => handlePhysicalChange('tekananDarah', e.target.value)}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500">Normal: 110-130 / 70-80 mmHg</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Denyut Nadi (bpm)</label>
                <input
                  type="number"
                  value={formData.denyutNadi || 76}
                  onChange={(e) => handlePhysicalChange('denyutNadi', Number(e.target.value))}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500">Istirahat normal: 60 - 90 bpm</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Postur Tulang Belakang</label>
                <select
                  value={formData.masalahTulangSendi}
                  onChange={(e) => handleOptionChange('masalahTulangSendi', e.target.value)}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Normal / Sehat">✓ Normal / Sehat (Tegak)</option>
                  <option value="Nyeri Ringan Kadang Kambuh">Skoliosis / Nyeri Ringan</option>
                  <option value="HNP / Masalah Tulang Belakang">HNP / Bengkok Signifikan</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAHAP 2: TES PENGLIHATAN & KETAHANAN FISIK */}
        {activeStepTab === 2 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Tahap 2: Pengujian Sensory (Mata/Buta Warna) & Ketahanan Fisik
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pengujian stamina otot, kapasitas paru, penglihatan Ishihara, & uji angkat beban 20kg.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block flex items-center space-x-1">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>Tes Buta Warna (Ishihara)</span>
                </label>
                <select
                  value={String(formData.butaWarna || 'Normal')}
                  onChange={(e) => handleOptionChange('butaWarna', e.target.value)}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Normal">✓ Normal (Bebas Buta Warna)</option>
                  <option value="Parsial">Buta Warna Parsial</option>
                  <option value="Total">Buta Warna Total</option>
                </select>
                <p className="text-[10px] text-slate-500">Syarat mutlak manufaktur & keperawatan</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Visus Mata Kiri / Kanan</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Kiri e.g. 6/6"
                    value={formData.visusMataKiri || '6/6'}
                    onChange={(e) => handlePhysicalChange('visusMataKiri', e.target.value)}
                    className="w-full bg-white px-2.5 py-1.5 rounded border border-slate-300 font-mono font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Kanan e.g. 6/6"
                    value={formData.visusMataKanan || '6/6'}
                    onChange={(e) => handlePhysicalChange('visusMataKanan', e.target.value)}
                    className="w-full bg-white px-2.5 py-1.5 rounded border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Tes Push-Up (1 Menit)</label>
                <input
                  type="number"
                  value={formData.tesPushUp || 30}
                  onChange={(e) => handlePhysicalChange('tesPushUp', Number(e.target.value))}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500">Standar Lulus: min. 25 kali / menit</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Tes Sit-Up (1 Menit)</label>
                <input
                  type="number"
                  value={formData.tesSitUp || 32}
                  onChange={(e) => handlePhysicalChange('tesSitUp', Number(e.target.value))}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500">Standar Lulus: min. 25 kali / menit</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Tes Angkat Beban (20 kg)</label>
                <select
                  value={formData.tesAngkatBeban || 'Lulus (20kg)'}
                  onChange={(e) => handleOptionChange('tesAngkatBeban', e.target.value)}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Lulus (20kg)">✓ Lulus (Beban 20kg 30 Detik)</option>
                  <option value="Tidak Lulus">Tidak Lulus / Kurang Kuat</option>
                  <option value="Belum Tes">Belum Tes</option>
                </select>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Tes Keseimbangan & Refleks</label>
                <select
                  value={formData.tesKeseimbangan || 'Normal'}
                  onChange={(e) => handleOptionChange('tesKeseimbangan', e.target.value)}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Normal">✓ Normal & Stabil</option>
                  <option value="Kurang Seimbang">Kurang Seimbang</option>
                  <option value="Belum Tes">Belum Tes</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAHAP 3: 14 INDIKATOR ANAMNESIS MEDIS */}
        {activeStepTab === 3 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Tahap 3: Anamnesis 14 Indikator Medis Wajib
                </h3>
                <p className="text-xs text-slate-500">
                  Formulir 14 poin penyakit kronis, riwayat TBC, Hepatitis, Narkoba, & Bekas Tato.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HEALTH_QUESTIONS.map((item) => {
                const currentValue = (formData as any)[item.key] || item.options[0];
                return (
                  <div
                    key={item.key}
                    className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800">{item.label}</label>
                      <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    </div>

                    <select
                      value={currentValue}
                      onChange={(e) => handleOptionChange(item.key as keyof HasilKesehatan, e.target.value)}
                      className="w-full bg-white text-slate-800 px-3 py-2 rounded border border-slate-300 font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      {item.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAHAP 4: LABORATORIUM & RADIOLOGI */}
        {activeStepTab === 4 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Tahap 4: Pemeriksaan Laboratorium Medis & Radiologi Thorax
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rekam medis hasil pemeriksaan klinik rujukan (Rontgen Paru, HBsAg Hepatitis B, & Urine Narkoba).
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Rontgen Thorax (Paru-Paru)</label>
                <select
                  value={formData.hasilRontgenParu || 'Normal / Jernih'}
                  onChange={(e) => handleOptionChange('hasilRontgenParu', e.target.value)}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="Normal / Jernih">✓ Normal / Jernih (Bebas TBC)</option>
                  <option value="Bercak / Suspek TBC">Bercak / Suspek TBC Paru</option>
                  <option value="Belum Tes">Belum Tes Rontgen</option>
                </select>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Skrining Serologi HBsAg (Hepatitis B)</label>
                <select
                  value={formData.hasilHbsAg || 'Non-Reaktif (Bebas Hep B)'}
                  onChange={(e) => handleOptionChange('hasilHbsAg', e.target.value)}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="Non-Reaktif (Bebas Hep B)">✓ Non-Reaktif (Bebas Hepatitis B)</option>
                  <option value="Reaktif">Reaktif (Positif Hep B)</option>
                  <option value="Belum Tes">Belum Tes Lab</option>
                </select>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Tes Urine Narkoba (5 Parameter)</label>
                <select
                  value={formData.hasilTesUrine || 'Bebas Narkoba (Negatif)'}
                  onChange={(e) => handleOptionChange('hasilTesUrine', e.target.value)}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="Bebas Narkoba (Negatif)">✓ Bebas Narkoba (Negatif 5 Parameter)</option>
                  <option value="Positif">Positif Zat Terlarang</option>
                  <option value="Belum Tes">Belum Tes Urine</option>
                </select>
              </div>

              <div className="md:col-span-3 p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-2">
                <label className="font-bold text-purple-900 block">Metode Prosedur Tes Kesehatan</label>
                <input
                  type="text"
                  value={formData.metodeProsedurTest || 'MCU Terintegrasi Standar LPK IJEF & Industri Jepang'}
                  onChange={(e) => handleOptionChange('metodeProsedurTest', e.target.value)}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-lg border border-purple-300 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAHAP 5: KEPUTUSAN EVALUASI DOKTER */}
        {activeStepTab === 5 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Tahap 5: Keputusan Kelaikan Medis Dokter & Sertifikat Fit-To-Work
                  </h3>
                  <p className="text-xs text-slate-500">
                    Penetapan resmi status kelaikan fisik (FIT TO WORK / UNFIT) beserta sertifikat hasil rekam medis.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">
                  Keputusan Kelaikan Kerja (FIT / UNFIT) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.statusFit}
                  onChange={(e) => handleOptionChange('statusFit', e.target.value as HealthStatus)}
                  className={`w-full font-bold px-3 py-2.5 rounded-lg border focus:outline-none text-xs ${
                    formData.statusFit === 'FIT'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                      : 'bg-rose-50 text-rose-800 border-rose-400'
                  }`}
                >
                  <option value="FIT">✓ FIT TO WORK (Layak Pelatihan & Magang Luar Negeri)</option>
                  <option value="UNFIT">✕ UNFIT (Berisiko Medis / Tidak Layak)</option>
                  <option value="PENDING">? PENDING (Perlu Pemeriksaan / Treatment Ulang)</option>
                </select>
              </div>

              <div className="md:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Nama Dokter Evaluator / Penanggung Jawab</label>
                <input
                  type="text"
                  value={formData.evaluatorName}
                  onChange={(e) => handleOptionChange('evaluatorName', e.target.value)}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-3 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Catatan Diagnosa & Rekomendasi Dokter</label>
                <textarea
                  rows={3}
                  value={formData.catatanDokter}
                  onChange={(e) => handleOptionChange('catatanDokter', e.target.value)}
                  className="w-full bg-white text-slate-800 px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* PREVIEW CERTIFICATE CARD */}
            <div className="p-6 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono font-bold uppercase">
                  <Sparkles className="w-4 h-4" />
                  <span>PREVIEW SERTIFIKAT KELAIKAN MEDIS (FIT-TO-WORK)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">IJEF-HEALTH-CERT-2026</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 text-[10px]">Nama Calon Siswa:</p>
                  <p className="font-bold text-white text-sm">{activeStudent.namaLengkap}</p>
                  <p className="text-slate-400 text-[10px] mt-1">Siswa ID: {activeStudent.id}</p>
                </div>

                <div className="md:text-right">
                  <p className="text-slate-400 text-[10px]">Status Evaluasi Medis:</p>
                  <span
                    className={`inline-block font-black text-sm px-3 py-1 rounded mt-0.5 ${
                      formData.statusFit === 'FIT' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {formData.statusFit === 'FIT' ? 'PASSED / FIT TO WORK' : 'UNFIT FOR WORK'}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-300 border-t border-slate-800 flex justify-between items-center">
                <span>Evaluator: <strong>{formData.evaluatorName}</strong></span>
                <span>Terdaftar di Firestore collection: <strong className="text-emerald-400">hasil_kesehatan</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Satu klik menyimpan seluruh data ke database Firestore & CRM.</span>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center space-x-2 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Seluruh Rekam Medis & Tes Kesehatan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
