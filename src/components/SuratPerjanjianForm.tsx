import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SuratPerjanjian, PasalItem } from '../types';
import { generatePdfFromElement, printDocumentElement } from '../utils/pdfGenerator';
import { CONTRACT_TRANSLATIONS } from '../i18n/financingAndContractI18n';
import JSZip from 'jszip';
import {
  FileText,
  Save,
  CheckCircle2,
  Printer,
  Download,
  Building2,
  ShieldCheck,
  Edit3,
  Plus,
  Trash2,
  ListOrdered,
  FileCheck2,
  Layout,
  Users,
  Eye,
  Check,
  Upload
} from 'lucide-react';

const defaultPasalsId: PasalItem[] = [
  {
    id: 'pasal-1',
    judul: 'PASAL 1: HAK DAN KEWAJIBAN PELATIHAN',
    isi: '1. PIHAK PERTAMA berkewajiban menyediakan materi pelatihan standar kompetensi industri selama durasi yang disepakati.\n2. PIHAK KEDUA wajib mengikuti jadwal pembelajaran dan disiplin kehadiran minimal 90%.'
  },
  {
    id: 'pasal-2',
    judul: 'PASAL 2: GARANSI PROGRAM JOB MATCHING & PENYALURAN KERJA',
    isi: '1. PIHAK PERTAMA memberikan layanan garansi Job Matching dan penyaluran wawancara kerja dengan perusahaan mitra dalam & luar negeri.\n2. PIHAK KEDUA bersedia ditempatkan kerja sesuai kualifikasi hasil evaluasi kompetensi dan tes kesehatan.'
  },
  {
    id: 'pasal-3',
    judul: 'PASAL 3: TATA TERTIB & PERSETUJUAN ORANG TUA / PENJAMIN',
    isi: '1. Penjamin (Orang Tua/Wali) menyatakan memberikan izin penuh dan persetujuan legal atas keikutsertaan PIHAK KEDUA.\n2. Segala bentuk pelanggaran hukum atau pengunduran diri secara sepihak akan diproses sesuai ketentuan biaya operasional LPK.'
  }
];

const defaultPasalsJa: PasalItem[] = [
  {
    id: 'pasal-1',
    judul: '第1条：訓練の権利及び義務',
    isi: '1. 甲（送出機関/LPK）は、合意された期間中、産業界の技能基準を満たす日本語・技能教育カリキュラムを提供する義務を負う。\n2. 乙（受講生）は、訓練スケジュールを遵守し、出席率90%以上を維持する規律義務を負う。'
  },
  {
    id: 'pasal-2',
    judul: '第2条：求人マッチング及び就労面接保証',
    isi: '1. 甲は、日本企業および提携監理団体との求人マッチングおよび公式面接機会を保証・手配する。\n2. 乙は、能力評価および健康診断の結果に基づき、適格と判断された企業への配属に同意する。'
  },
  {
    id: 'pasal-3',
    judul: '第3条：規律及び保証人（保護者）の法的同意',
    isi: '1. 身元保証人（保護者・後見人）は、乙の本プログラム参加および日本渡航に対し、完全な法的同意を与える。\n2. 規律違反、法令違反、または自己都合による一方的な辞退が生じた場合、当機関の規定に基づき精算処理が行われる。'
  }
];

export const SuratPerjanjianForm: React.FC = () => {
  const { activeStudent, contractRecords, saveContractRecord, financingRecords, lang } = useApp();
  const isJa = lang === 'ja';
  const tr = CONTRACT_TRANSLATIONS[isJa ? 'ja' : 'id'];
  const defaultPasals = isJa ? defaultPasalsJa : defaultPasalsId;

  const [activeControlTab, setActiveControlTab] = useState<'parameter' | 'kop' | 'pihak' | 'pasal'>('parameter');
  const [directEditMode, setDirectEditMode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [contractData, setContractData] = useState<SuratPerjanjian>(() => {
    const activeFin = activeStudent ? financingRecords[activeStudent.id] : undefined;
    if (activeStudent && contractRecords[activeStudent.id]) {
      const rec = contractRecords[activeStudent.id];
      return {
        ...rec,
        kopNamaLpk: rec.kopNamaLpk || (isJa ? 'インドネシア送り出し機関 (LPK) IJEF CORP' : 'LEMBAGA PELATIHAN KERJA (LPK) IJEF CORP'),
        kopSubJudul: rec.kopSubJudul || (isJa ? '労働省認可登録番号: Disnaker/LPK/IJEF/2025' : 'Keputusan Kepolisian & Dinas Tenaga Kerja No: Disnaker/LPK/IJEF/2025'),
        kopAlamat: rec.kopAlamat || (isJa ? 'ジャカルタ東区プムダ通り45番地 グラハIJEFビル | Web: www.ijefcorp.co.id' : 'Gedung Graha IJEF, Jl. Pemuda No. 45 Jakarta Timur | Website: www.ijefcorp.co.id'),
        judulSurat: rec.judulSurat || (isJa ? '日本就労・特定技能育成プログラム参加合意契約書' : 'SURAT PERJANJIAN KEIKUTSERTAAN PENDIDIKAN & PELATIHAN KERJA'),
        teksPembuka: rec.teksPembuka || (isJa ? '本日、ジャカルタのLPK IJEF CORPにおいて、以下の署名当事者は次のとおり合意し契約を締結します：' : 'Pada hari ini, bertempat di Kantor LPK IJEF CORP Jakarta, kami yang bertanda tangan di bawah ini:'),
        teksKesepakatan: rec.teksKesepakatan || (isJa ? '当事者双方は、以下の条項に基づき、教育訓練および日本就労プログラムへの参加契約を締結することに合意します：' : 'Para Pihak dengan ini sepakat dan mengikatkan diri dalam Perjanjian Keikutsertaan Pendidikan & Pelatihan Kerja dengan ketentuan klausul sebagai berikut:'),
        pasalList: rec.pasalList && rec.pasalList.length > 0 ? rec.pasalList : defaultPasals
      };
    }
    return {
      id: `KONTRAK-${Math.floor(100 + Math.random() * 900)}`,
      siswaId: activeStudent ? activeStudent.id : '',
      nomorSurat: `088/SPKP/IJEF-CORP/VII/${new Date().getFullYear()}`,
      tanggalSurat: new Date().toISOString().split('T')[0],
      pihakPertamaNama: isJa ? 'バンバン・ウィジャヤ (Drs. Bambang Wijaya)' : 'Drs. Bambang Wijaya, M.M.',
      pihakPertamaJabatan: isJa ? '代表取締役 / 学院長' : 'Direktur Utama LPK IJEF CORP',
      pihakPertamaInstansi: isJa ? 'LPK IJEF CORP インドネシア' : 'LPK IJEF CORP INDONESIA',
      pihakKeduaNama: activeStudent ? activeStudent.namaLengkap : '',
      pihakKeduaKtp: activeStudent ? activeStudent.noKtp : '',
      pihakKeduaAlamat: activeStudent ? activeStudent.alamatDomisili : '',
      pihakKeduaNoHp: activeStudent ? activeStudent.noHp : '',
      pihakKeduaEmail: activeStudent ? activeStudent.email : '',
      penjaminNama: activeStudent ? (activeFin?.namaPenjamin || activeStudent.namaAyah || 'Suharto Sitorus') : 'Suharto Sitorus',
      penjaminKtp: activeStudent ? (activeFin?.ktpPenjamin || activeStudent.ktpNpwpAyah || '3271040101700003') : '3271040101700003',
      programPelatihan: activeFin?.namaPaketPelatihan ? `${isJa ? 'プログラム' : 'Program Pelatihan LPK'}: ${activeFin.namaPaketPelatihan}` : (isJa ? '特定技能・技能実習生 日本語および職業訓練プログラム' : 'Program Pendidikan & Pelatihan Keahlian Bahasa Jepang & Magang/SSW'),
      durasiPelatihanBulan: activeFin?.durasiPelatihanBulan || 6,
      garansiJobMatching: true,
      statusPersetujuan: 'SAH',
      kopNamaLpk: isJa ? 'インドネシア送り出し機関 (LPK) IJEF CORP' : 'LEMBAGA PELATIHAN KERJA (LPK) IJEF CORP',
      kopSubJudul: isJa ? '労働省認可登録番号: Disnaker/LPK/IJEF/2025' : 'Keputusan Kepolisian & Dinas Tenaga Kerja No: Disnaker/LPK/IJEF/2025',
      kopAlamat: isJa ? 'ジャカルタ東区プムダ通り45番地 グラハIJEFビル | Web: www.ijefcorp.co.id' : 'Gedung Graha IJEF, Jl. Pemuda No. 45 Jakarta Timur | Website: www.ijefcorp.co.id',
      judulSurat: isJa ? '日本就労・特定技能育成プログラム参加合意契約書' : 'SURAT PERJANJIAN KEIKUTSERTAAN PENDIDIKAN & PELATIHAN KERJA',
      teksPembuka: isJa ? '本日、ジャカルタのLPK IJEF CORPにおいて、以下の署名当事者は次のとおり合意し契約を締結します：' : 'Pada hari ini, bertempat di Kantor LPK IJEF CORP Jakarta, kami yang bertanda tangan di bawah ini:',
      teksKesepakatan: isJa ? '当事者双方は、以下の条項に基づき、教育訓練および日本就労プログラムへの参加契約を締結することに合意します：' : 'Para Pihak dengan ini sepakat dan mengikatkan diri dalam Perjanjian Keikutsertaan Pendidikan & Pelatihan Kerja dengan ketentuan klausul sebagai berikut:',
      pasalList: defaultPasals
    };
  });

  useEffect(() => {
    if (activeStudent) {
      const activeFin = financingRecords[activeStudent.id];
      if (contractRecords[activeStudent.id]) {
        const rec = contractRecords[activeStudent.id];
        setContractData({
          ...rec,
          kopNamaLpk: rec.kopNamaLpk || (isJa ? 'インドネシア送り出し機関 (LPK) IJEF CORP' : 'LEMBAGA PELATIHAN KERJA (LPK) IJEF CORP'),
          kopSubJudul: rec.kopSubJudul || (isJa ? '労働省認可登録番号: Disnaker/LPK/IJEF/2025' : 'Keputusan Kepolisian & Dinas Tenaga Kerja No: Disnaker/LPK/IJEF/2025'),
          kopAlamat: rec.kopAlamat || (isJa ? 'ジャカルタ東区プムダ通り45番地 グラハIJEFビル | Web: www.ijefcorp.co.id' : 'Gedung Graha IJEF, Jl. Pemuda No. 45 Jakarta Timur | Website: www.ijefcorp.co.id'),
          judulSurat: rec.judulSurat || (isJa ? '日本就労・特定技能育成プログラム参加合意契約書' : 'SURAT PERJANJIAN KEIKUTSERTAAN PENDIDIKAN & PELATIHAN KERJA'),
          teksPembuka: rec.teksPembuka || (isJa ? '本日、ジャカルタのLPK IJEF CORPにおいて、以下の署名当事者は次のとおり合意し契約を締結します：' : 'Pada hari ini, bertempat di Kantor LPK IJEF CORP Jakarta, kami yang bertanda tangan di bawah ini:'),
          teksKesepakatan: rec.teksKesepakatan || (isJa ? '当事者双方は、以下の条項に基づき、教育訓練および日本就労プログラムへの参加契約を締結することに合意します：' : 'Para Pihak dengan ini sepakat dan mengikatkan diri dalam Perjanjian Keikutsertaan Pendidikan & Pelatihan Kerja dengan ketentuan klausul sebagai berikut:'),
          pasalList: rec.pasalList && rec.pasalList.length > 0 ? rec.pasalList : defaultPasals
        });
      } else {
        setContractData({
          id: `KONTRAK-${Math.floor(100 + Math.random() * 900)}`,
          siswaId: activeStudent.id,
          nomorSurat: `088/SPKP/IJEF-CORP/VII/${new Date().getFullYear()}`,
          tanggalSurat: new Date().toISOString().split('T')[0],
          pihakPertamaNama: isJa ? 'バンバン・ウィジャヤ (Drs. Bambang Wijaya)' : 'Drs. Bambang Wijaya, M.M.',
          pihakPertamaJabatan: isJa ? '代表取締役 / 学院長' : 'Direktur Utama LPK IJEF CORP',
          pihakPertamaInstansi: isJa ? 'LPK IJEF CORP インドネシア' : 'LPK IJEF CORP INDONESIA',
          pihakKeduaNama: activeStudent.namaLengkap,
          pihakKeduaKtp: activeStudent.noKtp,
          pihakKeduaAlamat: activeStudent.alamatDomisili,
          pihakKeduaNoHp: activeStudent.noHp,
          pihakKeduaEmail: activeStudent.email,
          penjaminNama: activeFin?.namaPenjamin || activeStudent.namaAyah || 'Suharto Sitorus',
          penjaminKtp: activeFin?.ktpPenjamin || activeStudent.ktpNpwpAyah || '3271040101700003',
          programPelatihan: activeFin?.namaPaketPelatihan ? `${isJa ? 'プログラム' : 'Program Pelatihan LPK'}: ${activeFin.namaPaketPelatihan}` : (isJa ? '特定技能・技能実習生 日本語および職業訓練プログラム' : 'Program Pendidikan & Pelatihan Keahlian Bahasa Jepang & Magang/SSW'),
          durasiPelatihanBulan: activeFin?.durasiPelatihanBulan || 6,
          garansiJobMatching: true,
          statusPersetujuan: 'SAH',
          kopNamaLpk: isJa ? 'インドネシア送り出し機関 (LPK) IJEF CORP' : 'LEMBAGA PELATIHAN KERJA (LPK) IJEF CORP',
          kopSubJudul: isJa ? '労働省認可登録番号: Disnaker/LPK/IJEF/2025' : 'Keputusan Kepolisian & Dinas Tenaga Kerja No: Disnaker/LPK/IJEF/2025',
          kopAlamat: isJa ? 'ジャカルタ東区プムダ通り45番地 グラハIJEFビル | Web: www.ijefcorp.co.id' : 'Gedung Graha IJEF, Jl. Pemuda No. 45 Jakarta Timur | Website: www.ijefcorp.co.id',
          judulSurat: isJa ? '日本就労・特定技能育成プログラム参加合意契約書' : 'SURAT PERJANJIAN KEIKUTSERTAAN PENDIDIKAN & PELATIHAN KERJA',
          teksPembuka: isJa ? '本日、ジャカルタのLPK IJEF CORPにおいて、以下の署名当事者は次のとおり合意し契約を締結します：' : 'Pada hari ini, bertempat di Kantor LPK IJEF CORP Jakarta, kami yang bertanda tangan di bawah ini:',
          teksKesepakatan: isJa ? '当事者双方は、以下の条項に基づき、教育訓練および日本就労プログラムへの参加契約を締結することに合意します：' : 'Para Pihak dengan ini sepakat dan mengikatkan diri dalam Perjanjian Keikutsertaan Pendidikan & Pelatihan Kerja dengan ketentuan klausul sebagai berikut:',
          pasalList: defaultPasals
        });
      }
    }
  }, [
    activeStudent?.id,
    contractRecords[activeStudent?.id || '']?.id,
    financingRecords[activeStudent?.id || '']?.id,
    lang
  ]);

  const handleTitleChange = (newTitle: string) => {
    let newPreamble = contractData.teksPembuka;
    let newPasalList = contractData.pasalList;

    if (newTitle.includes('IKATAN DINAS')) {
      newPreamble = isJa ? '本日、以下の当事者は、日本への就労に関する ikatan dinas について次のとおり合意します：' : 'Berdasarkan kesepakatan penempatan kerja ke luar negeri (Jepang), para pihak sepakat mengadakan Perjanjian Ikatan Dinas & Penempatan Kerja berikut:';
      newPasalList = [
        { id: 'p-1', judul: 'PASAL 1: KETENTUAN IKATAN DINAS & PENEMPATAN', isi: '1. PIHAK KEDUA wajib menyelesaikan seluruh masa pelatihan dan ikatan dinas penempatan di Jepang.\n2. Pengunduran diri sebelum masa kontrak selesai dikenakan sanksi administrasi dan penggantian biaya operasional.' },
        { id: 'p-2', judul: 'PASAL 2: HAK & FASILITAS PENEMPATAN', isi: '1. PIHAK PERTAMA menjamin proses visa kerja (Tokutei Ginou / SSW) atau Magang (Jisshusei).\n2. Gaji dan fasilitas akomodasi sesuai dengan standar perusahaan mitra di Jepang.' },
        { id: 'p-3', judul: 'PASAL 3: KETENTUAN HUKUM & PENYELESAIAN', isi: '1. Segala perselisihan diselesaikan secara musyawarah dan mufakat.\n2. Apabila tidak terselesaikan, tunduk pada hukum dan yurisdiksi ketenagakerjaan yang berlaku.' }
      ];
    } else if (newTitle.includes('ORANG TUA') || newTitle.includes('WALI')) {
      newPreamble = isJa ? '身元保証人（保護者）は、本プログラム参加における責任と費用について合意します：' : 'Kami selaku orang tua / wali dari calon peserta menyatakan memberikan izin dan menyetujui seluruh ketentuan finansial, asrama, dan pelatihan berikut:';
      newPasalList = [
        { id: 'p-1', judul: 'PASAL 1: IZIN & PERSETUJUAN ORANG TUA', isi: '1. Orang tua / wali memberikan izin penuh kepada anak/peserta untuk mengikuti pelatihan dan bekerja di Jepang.\n2. Menanggung kebenaran data diri dan dokumen legalitas yang diserahkan.' },
        { id: 'p-2', judul: 'PASAL 2: TANGGUNG JAWAB KEUANGAN & PEMBIAYAAN', isi: '1. Penjamin ikut bertanggung jawab atas kelancaran administrasi keuangan dan termin pembayaran.\n2. Bersedia mendampingi dan mengawasi kedisiplinan peserta selama program.' },
        { id: 'p-3', judul: 'PASAL 3: KETENTUAN DARURAT & KESEHATAN', isi: '1. Pemberian kuasa kepada LPK untuk mengambil tindakan darurat medis jika diperlukan.\n2. Segala risiko di luar jam operasional dikoordinasikan bersama keluarga.' }
      ];
    } else if (newTitle.includes('KONTRAK KERJASAMA') || newTitle.includes('BAHASA JEPANG')) {
      newPreamble = isJa ? '日本語教育および寮生活の規律保持に関する契約を以下の通り締結します：' : 'Dalam rangka pembinaan kompetensi bahasa dan kedisiplinan di asrama LPK IJEF CORP, disepakati kontrak kerjasama berikut:';
      newPasalList = [
        { id: 'p-1', judul: 'PASAL 1: KURIKULUM & STANDAR KOMPETENSI BAHASA', isi: '1. Peserta wajib mencapai level kemampuan Bahasa Jepang minimal N4 / N3 sesuai target.\n2. Mengikuti seluruh jam pelajaran dan ujian evaluasi berkala.' },
        { id: 'p-2', judul: 'PASAL 2: TATA TERTIB ASRAMA & KEDISIPLINAN', isi: '1. Wajib tinggal di asrama LPK dan mematuhi jam malam serta aturan kebersihan.\n2. Dilarang membawa barang terlarang, minuman keras, atau melakukan tindakan amoral.' },
        { id: 'p-3', judul: 'PASAL 3: SANKSI & EVALUASI', isi: '1. Pelanggaran tata tertib dikenakan sanksi berupa surat peringatan hingga skorsing.\n2. Akumulasi pelanggaran berat dapat berakibat pada pengeluaran dari program LPK.' }
      ];
    } else {
      newPreamble = isJa ? '本日、ジャカルタのLPK IJEF CORPにおいて、以下の署名当事者は次のとおり合意し契約を締結します：' : 'Pada hari ini, bertempat di Kantor LPK IJEF CORP Jakarta, kami yang bertanda tangan di bawah ini:';
      newPasalList = defaultPasals;
    }

    setContractData({
      ...contractData,
      judulSurat: newTitle,
      teksPembuka: newPreamble,
      pasalList: newPasalList
    });
  };

  const handleSave = () => {
    if (!activeStudent) {
      alert(isJa ? '候補生を先に選択してください。' : 'Silakan pilih calon siswa terlebih dahulu!');
      return;
    }

    saveContractRecord(contractData);
    setToastMessage(
      isJa
        ? `契約書ドラフト（番号: ${contractData.nomorSurat}）を正常に保存・更新しました。`
        : `Draft Naskah Surat Perjanjian berhasil diperbarui & disimpan dengan No. ${contractData.nomorSurat}!`
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleFileUploadReference = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileName = file.name;
      const fileExt = fileName.split('.').pop()?.toLowerCase();
      let extractedText = '';

      if (fileExt === 'docx') {
        const zip = new JSZip();
        const zipData = await zip.loadAsync(file);
        const docXml = await zipData.file('word/document.xml')?.async('text');
        if (docXml) {
          const matches = docXml.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
          if (matches) {
            extractedText = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
          } else {
            extractedText = docXml.replace(/<[^>]+>/g, ' ');
          }
        }
      } else {
        extractedText = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => {
            resolve(evt.target?.result as string || '');
          };
          reader.readAsText(file);
        });
      }

      const nomorMatch = extractedText.match(/(?:nomor|no\.?)\s*[:]\s*([^\n\r]+)/i);
      const extractedNomor = nomorMatch ? nomorMatch[1].trim() : contractData.nomorSurat;

      const titleMatch = extractedText.match(/(?:surat perjanjian|perjanjian)[^\n\r]+/i);
      const extractedTitle = titleMatch ? titleMatch[0].trim().toUpperCase() : contractData.judulSurat;

      const pasalRegex = /(?:pasal|第)\s*(\d+)[^\n\r]*/gi;
      let pasalMatches = Array.from(extractedText.matchAll(pasalRegex));
      let newPasalList: PasalItem[] = [...contractData.pasalList];

      if (pasalMatches.length > 0) {
        newPasalList = [];
        for (let i = 0; i < pasalMatches.length; i++) {
          const currentMatch = pasalMatches[i];
          const startIndex = currentMatch.index!;
          const endIndex = i < pasalMatches.length - 1 ? pasalMatches[i + 1].index! : extractedText.length;
          const block = extractedText.substring(startIndex, endIndex).trim();
          const firstNewline = block.indexOf('\n');
          const pasalTitle = firstNewline > 0 ? block.substring(0, firstNewline).trim() : block.substring(0, 50).trim();
          const pasalContent = firstNewline > 0 ? block.substring(firstNewline).trim() : block;

          newPasalList.push({
            id: `pasal-upload-${i}-${Date.now()}`,
            judul: pasalTitle.toUpperCase(),
            isi: pasalContent || '1. Ketentuan sesuai dokumen acuan yang diunggah.'
          });
        }
      }

      setContractData(prev => ({
        ...prev,
        nomorSurat: extractedNomor,
        judulSurat: extractedTitle,
        pasalList: newPasalList.length > 0 ? newPasalList : prev.pasalList
      }));

      setToastMessage(
        isJa
          ? `参照文書 (${fileName}) のアップロードと解析が完了しました。ドラフトが更新されました。`
          : `Dokumen acuan (${fileName}) berhasil diunggah & diuraikan. Draft perjanjian LPK telah diperbarui sebagai acuan edit!`
      );
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      console.error('Error parsing uploaded reference document:', err);
      setToastMessage(isJa ? '文書の読み込みに失敗しました。' : 'Gagal membaca dokumen acuan. Pastikan format file valid (.docx / .pdf / .txt).');
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleAddPasal = () => {
    const nextPasalNum = (contractData.pasalList?.length || 0) + 1;
    const newPasal: PasalItem = {
      id: `pasal-${Date.now()}`,
      judul: isJa ? `第${nextPasalNum}条：追加規約事項` : `PASAL ${nextPasalNum}: KETENTUAN TAMBAHAN`,
      isi: isJa
        ? '1. 双方が協議の上で合意した追加条項・特記事項。\n2. 本契約の変更は、書面による覚書（Addendum）を取り交わすものとする。'
        : '1. Ketentuan tambahan yang disepakati oleh kedua belah pihak secara musyawarah mufakat.\n2. Segala bentuk perubahan naskah wajib dibuat dalam bentuk Addendum tertulis.'
    };
    const updated = [...(contractData.pasalList || []), newPasal];
    setContractData({ ...contractData, pasalList: updated });
  };

  const handleUpdatePasal = (index: number, field: 'judul' | 'isi', value: string) => {
    const list = [...(contractData.pasalList || defaultPasals)];
    list[index] = { ...list[index], [field]: value };
    setContractData({ ...contractData, pasalList: list });
  };

  const handleDeletePasal = (index: number) => {
    const list = [...(contractData.pasalList || defaultPasals)];
    list.splice(index, 1);
    setContractData({ ...contractData, pasalList: list });
  };

  if (!activeStudent) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="p-8 bg-white border border-slate-200 rounded-xl max-w-md mx-auto space-y-3 shadow-sm">
          <FileText className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">{isJa ? '候補生を選択してください' : 'Pilih Calon Siswa'}</h3>
          <p className="text-xs text-slate-500">
            {isJa
              ? '上のナビゲーションバーから候補生を選択すると、契約書ドラフトが表示・編集できます。'
              : 'Silakan pilih siswa dari dropdown di bilah navigasi atas untuk memuat & mengedit draft Dokumen Surat Perjanjian.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs tracking-wider uppercase">
            <FileText className="w-4 h-4" />
            <span>{tr.badge}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mt-1">
            {tr.title}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {tr.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setDirectEditMode(!directEditMode)}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg border shadow-xs transition flex items-center space-x-1.5 cursor-pointer ${
              directEditMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400 ring-2 ring-amber-300'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
            title="Toggle direct edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{directEditMode ? tr.editModeActive : tr.editModeInactive}</span>
          </button>

          <button
            onClick={() => printDocumentElement('pdf-surat-perjanjian')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{tr.printDoc}</span>
          </button>

          <button
            onClick={() =>
              generatePdfFromElement(
                'pdf-surat-perjanjian',
                `Surat_Perjanjian_${activeStudent.namaLengkap}`
              )
            }
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{tr.downloadPdf}</span>
          </button>

          <label
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
            title="Upload dokumen acuan Word (.docx) atau PDF (.pdf)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isJa ? 'Word/PDFアップロード' : 'Upload Word / PDF'}</span>
            <input
              type="file"
              accept=".doc,.docx,.pdf,.txt"
              onChange={handleFileUploadReference}
              className="hidden"
            />
          </label>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{tr.saveDoc}</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between text-xs animate-fade-in shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 cols: Editor Panel Tabs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            {/* Control Panel Tab Buttons */}
            <div className="grid grid-cols-4 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600">
              <button
                onClick={() => setActiveControlTab('parameter')}
                className={`py-2.5 px-1 text-center transition flex flex-col items-center justify-center gap-1 border-r border-slate-200 cursor-pointer ${
                  activeControlTab === 'parameter'
                    ? 'bg-white text-indigo-700 border-b-2 border-b-indigo-600 font-black'
                    : 'hover:bg-slate-200/70'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>{tr.tabParam}</span>
              </button>

              <button
                onClick={() => setActiveControlTab('kop')}
                className={`py-2.5 px-1 text-center transition flex flex-col items-center justify-center gap-1 border-r border-slate-200 cursor-pointer ${
                  activeControlTab === 'kop'
                    ? 'bg-white text-indigo-700 border-b-2 border-b-indigo-600 font-black'
                    : 'hover:bg-slate-200/70'
                }`}
              >
                <Layout className="w-4 h-4" />
                <span>{tr.tabKop}</span>
              </button>

              <button
                onClick={() => setActiveControlTab('pihak')}
                className={`py-2.5 px-1 text-center transition flex flex-col items-center justify-center gap-1 border-r border-slate-200 cursor-pointer ${
                  activeControlTab === 'pihak'
                    ? 'bg-white text-indigo-700 border-b-2 border-b-indigo-600 font-black'
                    : 'hover:bg-slate-200/70'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{tr.tabParties}</span>
              </button>

              <button
                onClick={() => setActiveControlTab('pasal')}
                className={`py-2.5 px-1 text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeControlTab === 'pasal'
                    ? 'bg-white text-indigo-700 border-b-2 border-b-indigo-600 font-black'
                    : 'hover:bg-slate-200/70'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                <span>{tr.tabArticles}</span>
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* TAB 1: PARAMETER */}
              {activeControlTab === 'parameter' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center space-x-1.5">
                    <FileCheck2 className="w-4 h-4 text-indigo-600" />
                    <span>{tr.paramHeader}</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.officialLetterNo}</label>
                    <input
                      type="text"
                      value={contractData.nomorSurat}
                      onChange={(e) =>
                        setContractData({ ...contractData, nomorSurat: e.target.value })
                      }
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-mono font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.contractDate}</label>
                    <input
                      type="date"
                      value={contractData.tanggalSurat}
                      onChange={(e) =>
                        setContractData({ ...contractData, tanggalSurat: e.target.value })
                      }
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.trainingProgram}</label>
                    <input
                      type="text"
                      value={contractData.programPelatihan}
                      onChange={(e) =>
                        setContractData({ ...contractData, programPelatihan: e.target.value })
                      }
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.durationMonth}</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={contractData.durasiPelatihanBulan}
                      onChange={(e) =>
                        setContractData({
                          ...contractData,
                          durasiPelatihanBulan: parseInt(e.target.value) || 6
                        })
                      }
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center space-x-2 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contractData.garansiJobMatching}
                        onChange={(e) =>
                          setContractData({ ...contractData, garansiJobMatching: e.target.checked })
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span className="font-bold text-emerald-950 text-xs">
                        {tr.jobGuarantee}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: KOP & JUDUL */}
              {activeControlTab === 'kop' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center space-x-1.5">
                    <Layout className="w-4 h-4 text-indigo-600" />
                    <span>{tr.kopFormatHeader}</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.lpkNameHeader}</label>
                    <input
                      type="text"
                      value={contractData.kopNamaLpk || ''}
                      onChange={(e) =>
                        setContractData({ ...contractData, kopNamaLpk: e.target.value })
                      }
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.decreeSubHeader}</label>
                    <input
                      type="text"
                      value={contractData.kopSubJudul || ''}
                      onChange={(e) =>
                        setContractData({ ...contractData, kopSubJudul: e.target.value })
                      }
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.addressHeader}</label>
                    <input
                      type="text"
                      value={contractData.kopAlamat || ''}
                      onChange={(e) =>
                        setContractData({ ...contractData, kopAlamat: e.target.value })
                      }
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">{tr.mainContractTitle} (Pilih Template)</label>
                      <button
                        type="button"
                        onClick={() => setContractData({ ...contractData, judulSurat: '' })}
                        className="text-[10px] text-red-600 hover:text-red-700 underline font-medium cursor-pointer"
                      >
                        Hapus Judul
                      </button>
                    </div>
                    <select
                      value={contractData.judulSurat || ''}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-2 rounded border border-slate-300 font-bold focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer mb-2"
                    >
                      <option value="SURAT PERJANJIAN KEIKUTSERTAAN PENDIDIKAN & PELATIHAN KERJA">SURAT PERJANJIAN KEIKUTSERTAAN PENDIDIKAN & PELATIHAN KERJA (Standar)</option>
                      <option value="SURAT PERJANJIAN IKATAN DINAS & PENEMPATAN KERJA LUAR NEGERI">SURAT PERJANJIAN IKATAN DINAS & PENEMPATAN KERJA LUAR NEGERI</option>
                      <option value="SURAT KESEPAKATAN ORANG TUA / WALI & TANGGUNG JAWAB PEMBIAYAAN">SURAT KESEPAKATAN ORANG TUA / WALI & TANGGUNG JAWAB PEMBIAYAAN</option>
                      <option value="KONTRAK KERJASAMA PENDIDIKAN BAHASA JEPANG & KEDISIPLINAN ASRAMA">KONTRAK KERJASAMA PENDIDIKAN BAHASA JEPANG & KEDISIPLINAN ASRAMA</option>
                    </select>

                    <label className="block text-xs font-semibold text-slate-600 mb-1">Atau Edit / Ketik Judul Baru Kustom:</label>
                    <input
                      type="text"
                      value={contractData.judulSurat || ''}
                      onChange={(e) => setContractData({ ...contractData, judulSurat: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-bold text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="Ketik judul baru di sini..."
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.preambleText}</label>
                    <textarea
                      rows={2}
                      value={contractData.teksPembuka || ''}
                      onChange={(e) =>
                        setContractData({ ...contractData, teksPembuka: e.target.value })
                      }
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: PIHAK */}
              {activeControlTab === 'pihak' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>{tr.partiesHeader}</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <div className="font-bold text-indigo-900 text-[11px]">{tr.party1Title}</div>
                    <div>
                      <label className="block text-[10px] text-slate-600">{tr.party1Name}</label>
                      <input
                        type="text"
                        value={contractData.pihakPertamaNama}
                        onChange={(e) =>
                          setContractData({ ...contractData, pihakPertamaNama: e.target.value })
                        }
                        className="w-full bg-white text-slate-800 px-2 py-1 rounded border border-slate-300 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600">{tr.party1Job}</label>
                      <input
                        type="text"
                        value={contractData.pihakPertamaJabatan}
                        onChange={(e) =>
                          setContractData({ ...contractData, pihakPertamaJabatan: e.target.value })
                        }
                        className="w-full bg-white text-slate-800 px-2 py-1 rounded border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600">{tr.party1Org}</label>
                      <input
                        type="text"
                        value={contractData.pihakPertamaInstansi || 'LPK IJEF CORP INDONESIA'}
                        onChange={(e) =>
                          setContractData({ ...contractData, pihakPertamaInstansi: e.target.value })
                        }
                        className="w-full bg-white text-slate-800 px-2 py-1 rounded border border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <div className="font-bold text-emerald-900 text-[11px]">{tr.party2Title}</div>
                    <div>
                      <label className="block text-[10px] text-slate-600">{tr.party2Name}</label>
                      <input
                        type="text"
                        value={contractData.pihakKeduaNama}
                        onChange={(e) =>
                          setContractData({ ...contractData, pihakKeduaNama: e.target.value })
                        }
                        className="w-full bg-white text-slate-800 px-2 py-1 rounded border border-slate-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600">{tr.party2Ktp}</label>
                      <input
                        type="text"
                        value={contractData.pihakKeduaKtp}
                        onChange={(e) =>
                          setContractData({ ...contractData, pihakKeduaKtp: e.target.value })
                        }
                        className="w-full bg-white text-slate-800 px-2 py-1 rounded border border-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600">{tr.party2Address}</label>
                      <textarea
                        rows={1}
                        value={contractData.pihakKeduaAlamat}
                        onChange={(e) =>
                          setContractData({ ...contractData, pihakKeduaAlamat: e.target.value })
                        }
                        className="w-full bg-white text-slate-800 px-2 py-1 rounded border border-slate-300"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-600">{tr.party2Phone}</label>
                        <input
                          type="text"
                          value={contractData.pihakKeduaNoHp}
                          onChange={(e) =>
                            setContractData({ ...contractData, pihakKeduaNoHp: e.target.value })
                          }
                          className="w-full bg-white text-slate-800 px-2 py-1 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600">{tr.party2Email}</label>
                        <input
                          type="text"
                          value={contractData.pihakKeduaEmail}
                          onChange={(e) =>
                            setContractData({ ...contractData, pihakKeduaEmail: e.target.value })
                          }
                          className="w-full bg-white text-slate-800 px-2 py-1 rounded border border-slate-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <div className="font-bold text-purple-900 text-[11px]">{tr.guarantorTitle}</div>
                    <div>
                      <label className="block text-[10px] text-slate-600">{tr.guarantorName}</label>
                      <input
                        type="text"
                        value={contractData.penjaminNama}
                        onChange={(e) =>
                          setContractData({ ...contractData, penjaminNama: e.target.value })
                        }
                        className="w-full bg-white text-slate-800 px-2 py-1 rounded border border-slate-300 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600">{tr.guarantorKtp}</label>
                      <input
                        type="text"
                        value={contractData.penjaminKtp}
                        onChange={(e) =>
                          setContractData({ ...contractData, penjaminKtp: e.target.value })
                        }
                        className="w-full bg-white text-slate-800 px-2 py-1 rounded border border-slate-300 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PASAL DRAF EDITOR */}
              {activeControlTab === 'pasal' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                      <ListOrdered className="w-4 h-4 text-indigo-600" />
                      <span>{tr.articlesHeader}</span>
                    </div>

                    <button
                      onClick={handleAddPasal}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded flex items-center space-x-1 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{tr.addArticle}</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                    {(contractData.pasalList || defaultPasals).map((pasal, idx) => (
                      <div key={pasal.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[10px] text-slate-500 font-mono">
                            {tr.articleNum} {idx + 1}
                          </span>
                          <button
                            onClick={() => handleDeletePasal(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-100 rounded transition cursor-pointer"
                            title={tr.deleteArticleTitle}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">{tr.articleTitle}</label>
                          <input
                            type="text"
                            value={pasal.judul}
                            onChange={(e) => handleUpdatePasal(idx, 'judul', e.target.value)}
                            className="w-full bg-white text-slate-800 px-2 py-1 rounded border border-slate-300 font-bold text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">{tr.articleBody}</label>
                          <textarea
                            rows={3}
                            value={pasal.isi}
                            onChange={(e) => handleUpdatePasal(idx, 'isi', e.target.value)}
                            className="w-full bg-white text-slate-800 px-2 py-1 rounded border border-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 7 cols: Interactive Printable Paper Document Preview */}
        <div className="lg:col-span-7">
          <div className="bg-slate-200 p-3 sm:p-5 rounded-xl border border-slate-300 shadow-inner space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-700 font-semibold px-1">
              <span className="flex items-center space-x-1">
                <Eye className="w-4 h-4 text-slate-600" />
                <span>{tr.previewDocTitle}</span>
              </span>
              {directEditMode && (
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300 text-[10px] font-bold font-mono">
                  {tr.editModeDocActive}
                </span>
              )}
            </div>

            {/* PRINTABLE PAPER CONTAINER */}
            <div
              id="pdf-surat-perjanjian"
              className="bg-white text-slate-900 p-6 sm:p-8 rounded shadow-lg border border-slate-300 max-w-full font-serif text-[12px] leading-relaxed space-y-4"
            >
              {/* Kop Surat Header */}
              <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
                {directEditMode ? (
                  <input
                    type="text"
                    value={contractData.kopNamaLpk || ''}
                    onChange={(e) => setContractData({ ...contractData, kopNamaLpk: e.target.value })}
                    className="w-full text-center font-sans font-bold text-base uppercase tracking-wider text-slate-900 border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded"
                  />
                ) : (
                  <h1 className="font-sans font-bold text-base uppercase tracking-wider text-slate-900">
                    {contractData.kopNamaLpk || (isJa ? 'インドネシア送り出し機関 (LPK) IJEF CORP' : 'LEMBAGA PELATIHAN KERJA (LPK) IJEF CORP')}
                  </h1>
                )}

                {directEditMode ? (
                  <input
                    type="text"
                    value={contractData.kopSubJudul || ''}
                    onChange={(e) => setContractData({ ...contractData, kopSubJudul: e.target.value })}
                    className="w-full text-center font-sans text-[10px] text-slate-600 border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded"
                  />
                ) : (
                  <p className="font-sans text-[10px] text-slate-600">
                    {contractData.kopSubJudul || (isJa ? '労働省認可登録番号: Disnaker/LPK/IJEF/2025' : 'Keputusan Kepolisian & Dinas Tenaga Kerja No: Disnaker/LPK/IJEF/2025')}
                  </p>
                )}

                {directEditMode ? (
                  <input
                    type="text"
                    value={contractData.kopAlamat || ''}
                    onChange={(e) => setContractData({ ...contractData, kopAlamat: e.target.value })}
                    className="w-full text-center font-sans text-[9px] text-slate-500 border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded"
                  />
                ) : (
                  <p className="font-sans text-[9px] text-slate-500">
                    {contractData.kopAlamat || (isJa ? 'ジャカルタ東区プムダ通り45番地 グラハIJEFビル | Web: www.ijefcorp.co.id' : 'Gedung Graha IJEF, Jl. Pemuda No. 45 Jakarta Timur | Website: www.ijefcorp.co.id')}
                  </p>
                )}
              </div>

              {/* Title Surat */}
              <div className="text-center font-sans space-y-1">
                {directEditMode ? (
                  <div className="space-y-1.5">
                    <select
                      value={contractData.judulSurat || ''}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full text-center font-bold text-xs uppercase tracking-wide border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded cursor-pointer"
                    >
                      <option value="SURAT PERJANJIAN KEIKUTSERTAAN PENDIDIKAN & PELATIHAN KERJA">Template: Standar LPK</option>
                      <option value="SURAT PERJANJIAN IKATAN DINAS & PENEMPATAN KERJA LUAR NEGERI">Template: Ikatan Dinas</option>
                      <option value="SURAT KESEPAKATAN ORANG TUA / WALI & TANGGUNG JAWAB PEMBIAYAAN">Template: Pembiayaan</option>
                      <option value="KONTRAK KERJASAMA PENDIDIKAN BAHASA JEPANG & KEDISIPLINAN ASRAMA">Template: Bahasa Jepang</option>
                    </select>
                    <input
                      type="text"
                      value={contractData.judulSurat || ''}
                      onChange={(e) => setContractData({ ...contractData, judulSurat: e.target.value })}
                      className="w-full text-center font-bold text-sm uppercase underline tracking-wide border border-dashed border-amber-400 bg-amber-50/50 p-1.5 rounded"
                      placeholder="Atau ketik judul baru kustom..."
                    />
                  </div>
                ) : (
                  <h2 className="font-bold text-sm uppercase underline tracking-wide">
                    {contractData.judulSurat || (isJa ? '日本就労・特定技能育成プログラム参加合意契約書' : 'SURAT PERJANJIAN KEIKUTSERTAAN PENDIDIKAN & PELATIHAN KERJA')}
                  </h2>
                )}

                <div className="text-[10px] font-mono text-slate-700 flex items-center justify-center space-x-1">
                  <span>{tr.docNo}</span>
                  {directEditMode ? (
                    <input
                      type="text"
                      value={contractData.nomorSurat}
                      onChange={(e) => setContractData({ ...contractData, nomorSurat: e.target.value })}
                      className="font-mono font-bold text-slate-900 border border-dashed border-amber-400 bg-amber-50/50 px-1 rounded"
                    />
                  ) : (
                    <span className="font-bold">{contractData.nomorSurat}</span>
                  )}
                </div>
              </div>

              {/* Mukadimah */}
              {directEditMode ? (
                <textarea
                  rows={2}
                  value={contractData.teksPembuka || ''}
                  onChange={(e) => setContractData({ ...contractData, teksPembuka: e.target.value })}
                  className="w-full text-[11px] font-sans border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded"
                />
              ) : (
                <p className="text-[11px] font-sans">
                  {contractData.teksPembuka || (isJa ? `本日（日付: ${contractData.tanggalSurat}）、ジャカルタのLPK IJEF CORPオフィスにおいて、以下の署名当事者は次のとおり合意します：` : `Pada hari ini, tanggal ${contractData.tanggalSurat}, bertempat di Kantor LPK IJEF CORP Jakarta, kami yang bertanda tangan di bawah ini:`)}
                </p>
              )}

              {/* PIHAK PERTAMA */}
              <div className="font-sans space-y-1 text-[11px] pl-3 border-l-2 border-slate-800">
                <p className="font-bold">{tr.party1Title}</p>
                <table className="w-full pl-2">
                  <tbody>
                    <tr>
                      <td className="w-32 font-semibold">{tr.party1Name}</td>
                      <td>
                        {directEditMode ? (
                          <input
                            type="text"
                            value={contractData.pihakPertamaNama}
                            onChange={(e) => setContractData({ ...contractData, pihakPertamaNama: e.target.value })}
                            className="w-full font-bold border border-dashed border-amber-400 bg-amber-50/50 px-1 rounded"
                          />
                        ) : (
                          <span>: {contractData.pihakPertamaNama}</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold">{tr.party1Job}</td>
                      <td>
                        {directEditMode ? (
                          <input
                            type="text"
                            value={contractData.pihakPertamaJabatan}
                            onChange={(e) => setContractData({ ...contractData, pihakPertamaJabatan: e.target.value })}
                            className="w-full border border-dashed border-amber-400 bg-amber-50/50 px-1 rounded"
                          />
                        ) : (
                          <span>: {contractData.pihakPertamaJabatan}</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold">{tr.party1Org}</td>
                      <td>
                        {directEditMode ? (
                          <input
                            type="text"
                            value={contractData.pihakPertamaInstansi || 'LPK IJEF CORP INDONESIA'}
                            onChange={(e) => setContractData({ ...contractData, pihakPertamaInstansi: e.target.value })}
                            className="w-full border border-dashed border-amber-400 bg-amber-50/50 px-1 rounded"
                          />
                        ) : (
                          <span>: {contractData.pihakPertamaInstansi || 'LPK IJEF CORP INDONESIA'}</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PIHAK KEDUA */}
              <div className="font-sans space-y-1 text-[11px] pl-3 border-l-2 border-slate-800">
                <p className="font-bold">{tr.party2Title}</p>
                <table className="w-full pl-2">
                  <tbody>
                    <tr>
                      <td className="w-32 font-semibold">{tr.party2Name}</td>
                      <td>
                        {directEditMode ? (
                          <input
                            type="text"
                            value={contractData.pihakKeduaNama}
                            onChange={(e) => setContractData({ ...contractData, pihakKeduaNama: e.target.value })}
                            className="w-full font-bold border border-dashed border-amber-400 bg-amber-50/50 px-1 rounded"
                          />
                        ) : (
                          <span>: {contractData.pihakKeduaNama}</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold">{tr.party2Ktp}</td>
                      <td>
                        {directEditMode ? (
                          <input
                            type="text"
                            value={contractData.pihakKeduaKtp}
                            onChange={(e) => setContractData({ ...contractData, pihakKeduaKtp: e.target.value })}
                            className="w-full font-mono border border-dashed border-amber-400 bg-amber-50/50 px-1 rounded"
                          />
                        ) : (
                          <span>: {contractData.pihakKeduaKtp}</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold">{tr.party2Address}</td>
                      <td>
                        {directEditMode ? (
                          <input
                            type="text"
                            value={contractData.pihakKeduaAlamat}
                            onChange={(e) => setContractData({ ...contractData, pihakKeduaAlamat: e.target.value })}
                            className="w-full border border-dashed border-amber-400 bg-amber-50/50 px-1 rounded"
                          />
                        ) : (
                          <span>: {contractData.pihakKeduaAlamat}</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold">{tr.party2Phone} / {tr.party2Email}</td>
                      <td>
                        {directEditMode ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={contractData.pihakKeduaNoHp}
                              onChange={(e) => setContractData({ ...contractData, pihakKeduaNoHp: e.target.value })}
                              className="w-1/2 border border-dashed border-amber-400 bg-amber-50/50 px-1 rounded"
                            />
                            <input
                              type="text"
                              value={contractData.pihakKeduaEmail}
                              onChange={(e) => setContractData({ ...contractData, pihakKeduaEmail: e.target.value })}
                              className="w-1/2 border border-dashed border-amber-400 bg-amber-50/50 px-1 rounded"
                            />
                          </div>
                        ) : (
                          <span>: {contractData.pihakKeduaNoHp} / {contractData.pihakKeduaEmail}</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold">{tr.guarantorTitle}</td>
                      <td>
                        {directEditMode ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={contractData.penjaminNama}
                              onChange={(e) => setContractData({ ...contractData, penjaminNama: e.target.value })}
                              className="w-1/2 font-medium border border-dashed border-amber-400 bg-amber-50/50 px-1 rounded"
                            />
                            <input
                              type="text"
                              value={contractData.penjaminKtp}
                              onChange={(e) => setContractData({ ...contractData, penjaminKtp: e.target.value })}
                              className="w-1/2 font-mono border border-dashed border-amber-400 bg-amber-50/50 px-1 rounded"
                            />
                          </div>
                        ) : (
                          <span>: {contractData.penjaminNama} (NIK: {contractData.penjaminKtp})</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Teks Kesepakatan */}
              {directEditMode ? (
                <textarea
                  rows={2}
                  value={contractData.teksKesepakatan || ''}
                  onChange={(e) => setContractData({ ...contractData, teksKesepakatan: e.target.value })}
                  className="w-full text-[11px] font-sans border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded"
                />
              ) : (
                <p className="text-[11px] font-sans">
                  {contractData.teksKesepakatan || (isJa ? '当事者双方は、以下の条項に基づき、教育訓練および日本就労プログラムへの参加契約を締結することに合意します：' : 'Para Pihak dengan ini sepakat dan mengikatkan diri dalam Perjanjian Keikutsertaan Pendidikan & Pelatihan Kerja dengan ketentuan klausul sebagai berikut:')}
                </p>
              )}

              {/* KLAUSUL PASAL-PASAL */}
              <div className="font-sans text-[11px] space-y-3 pt-1">
                {(contractData.pasalList || defaultPasals).map((pasal, idx) => (
                  <div key={pasal.id || idx} className="space-y-1">
                    {directEditMode ? (
                      <input
                        type="text"
                        value={pasal.judul}
                        onChange={(e) => handleUpdatePasal(idx, 'judul', e.target.value)}
                        className="w-full font-bold text-xs border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded"
                      />
                    ) : (
                      <strong className="block font-bold">{pasal.judul}</strong>
                    )}

                    {directEditMode ? (
                      <textarea
                        rows={3}
                        value={pasal.isi}
                        onChange={(e) => handleUpdatePasal(idx, 'isi', e.target.value)}
                        className="w-full text-[10px] text-slate-800 leading-normal border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded"
                      />
                    ) : (
                      <p className="text-[10px] text-slate-700 leading-normal pl-2 whitespace-pre-line">
                        {pasal.isi}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Tanda Tangan 3 Pihak */}
              <div className="font-sans pt-6 grid grid-cols-3 gap-4 text-[10px] text-center border-t border-slate-200 mt-4">
                <div>
                  <p>{tr.docParty1Sub}</p>
                  <p className="font-bold">{contractData.pihakPertamaInstansi || (isJa ? 'LPK IJEF CORP' : 'LPK IJEF CORP')}</p>
                  <div className="h-14 flex items-center justify-center">
                    <span className="text-[9px] text-slate-400 font-mono italic">{tr.docStamp}</span>
                  </div>
                  {directEditMode ? (
                    <input
                      type="text"
                      value={contractData.pihakPertamaNama}
                      onChange={(e) => setContractData({ ...contractData, pihakPertamaNama: e.target.value })}
                      className="text-center font-bold underline text-xs w-full border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded mb-1"
                    />
                  ) : (
                    <p className="font-bold underline">{contractData.pihakPertamaNama}</p>
                  )}
                  {directEditMode ? (
                    <input
                      type="text"
                      value={contractData.pihakPertamaJabatan}
                      onChange={(e) => setContractData({ ...contractData, pihakPertamaJabatan: e.target.value })}
                      className="text-center text-[9px] w-full border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded"
                    />
                  ) : (
                    <p className="text-[8px] text-slate-500">{contractData.pihakPertamaJabatan}</p>
                  )}
                </div>

                <div>
                  <p>{tr.docGuarantorSub}</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[9px] text-slate-400 font-mono italic">{tr.docGuarantorSign}</span>
                  </div>
                  {directEditMode ? (
                    <input
                      type="text"
                      value={contractData.penjaminNama}
                      onChange={(e) => setContractData({ ...contractData, penjaminNama: e.target.value })}
                      className="text-center font-bold underline text-xs w-full border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded mb-1"
                    />
                  ) : (
                    <p className="font-bold underline">{contractData.penjaminNama}</p>
                  )}
                  <p className="text-[8px] text-slate-500">{tr.docParentGuardian}</p>
                </div>

                <div>
                  <p>{tr.docParty2Sub}</p>
                  <p className="font-bold">{tr.docStudentRegistered}</p>
                  <div className="h-14 flex items-center justify-center">
                    <span className="text-[9px] text-slate-400 font-mono italic">{tr.docStudentSign}</span>
                  </div>
                  {directEditMode ? (
                    <input
                      type="text"
                      value={contractData.pihakKeduaNama}
                      onChange={(e) => setContractData({ ...contractData, pihakKeduaNama: e.target.value })}
                      className="text-center font-bold underline text-xs w-full border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded mb-1"
                    />
                  ) : (
                    <p className="font-bold underline">{contractData.pihakKeduaNama}</p>
                  )}
                  <p className="text-[8px] text-slate-500">{tr.docStudentRegistered}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

