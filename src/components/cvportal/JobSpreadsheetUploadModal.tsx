import React, { useState } from 'react';
import Papa from 'papaparse';
import { JobPosting } from '../../types';
import { sanitizeJobPosting } from '../../utils/jobSanitizer';
import { useApp } from '../../context/AppContext';
import { useEcosystemTranslation } from '../../hooks/useEcosystemTranslation';
import {
  getSanitizedJobTitle,
  formatPrefecture,
  formatGender,
  translateCandidateCategory
} from '../../utils/mitraJobUtils';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Copy,
  Table,
  Check,
  RefreshCw,
  Info,
  Link,
  Layers,
  Globe,
  ExternalLink,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';

interface JobSpreadsheetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (jobs: JobPosting[], replaceAll: boolean) => void;
}

export const SAMPLE_TEMPLATE_CSV = `STATUS,LIST JOB,DAERAH,KODE JOB,JENIS KELAMIN YG DIBUTUHKAN,GAJI,KANDIDAT YANG DIBUTUHKAN,KUALIFIKASI,BIAYA,KETERANGAN,TSK/SUMBER JOB
クローズ,通訳,,IND035,女,,1,Minimal N3. Maksimal 40 tahun.,Rp 25.000.000,Sudah termasuk Visa dan tiket pesawat dari Jakarta.,Ags
クローズ,ライフライン・電気工事 (Mecanical & Electrical),,IND057,男,,1,Senmonkyu/ hyoukachosho yang bisa mendaftar. Usia maksimal 55th,Rp 20.000.000,Sudah termasuk MCU dan Visa. Tiket pesawat ditanggung pribadi.,Ags
クローズ,介護 (Nurses/Keperawatan),,IND063,男女,,1,SSW Kaigo,Berpengalaman dibutuhkan,Bahasa N3 keatas,Rp 5.000.000,Biaya Mandiri,Ags
クローズ,PETERNAKAN SAPI (畜産業),熊本,010 IJEF,男,200.000,1,• Memiliki pengalaman di industri peternakan sapi\n• Memiliki JLPT N4/JFT A-2 dan SSW bidang Peternakan,30 MCU, Visa, Tiket, EKTKLN, Paspor,,Hibiki
クローズ,PENGOLAHAN MAKANAN (飲食業),広島,011 IJEF,男女,151.582,2,• Dapat berkaiwa dengan baik\n• JFT A-2/JLPT N4 dan SSW Pengolahan Makanan,30 MCU, Visa, Tiket, EKTKLN, Paspor,,Hibiki
国内,JIDOUSHA SEIBI (自動車整備),鹿児島,014 IJEF,男,225.000,1,• Memiliki pengalaman dalam perawatan dan pemeliharan mobil\n• Berdomisili di Jepang,2,,Marta
,RESTORAN (外食業),群馬,013 IJEF,女,175.400,7,• Bersedia mencicipi makanan dan minuman non halal\n• JFT A-2/JLPT N4 dan SSW RESTORAN,30 MCU, Visa, Tiket, EKTKLN, Paspor,MCU, Visa, Tiket, EKTKLN, Paspor,Onodera
,PERIKANAN (漁業),鹿児島,IJEF017,男,200.000,2,• Berdomisili di Jepang atau Indonesia\n• Ex-magang Nelayan,30 MCU, Visa, Tiket, EKTKLN, Paspor,MCU, Visa, Tiket, EKTKLN, Paspor,Marta
,PENGEPRESAN (金属プレス）,栃木,IJEF016,男,1068/Jam,1,• Usia max. 40 tahun\n• TB min. 155 cm keatas,30 MCU, Visa, Tiket, EKTKLN, Paspor,MCU, Visa, Tiket, EKTKLN, Paspor,Lilin`;

export function extractGoogleSheetsInfo(url: string): { spreadsheetId: string | null; gid: string | null } {
  if (!url) return { spreadsheetId: null, gid: null };
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = idMatch ? idMatch[1] : null;

  const gidMatch = url.match(/[?&#]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : null;

  return { spreadsheetId, gid };
}

export async function fetchGoogleSheetCsv(
  spreadsheetId: string,
  sheetName?: string,
  gid?: string
): Promise<string> {
  let fetchUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
  if (sheetName && sheetName.trim()) {
    fetchUrl += `&sheet=${encodeURIComponent(sheetName.trim())}`;
  } else if (gid) {
    fetchUrl += `&gid=${gid}`;
  }

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(
      `Gagal mengambil data dari Google Sheets (HTTP ${response.status}). Pastikan spreadsheet diatur ke akses "Siapa saja yang memiliki link dapat melihat" (Public/Anyone with link).`
    );
  }
  const text = await response.text();
  if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
    throw new Error(
      'Spreadsheet mengembalikan halaman Login Google. Harap ubah Akses Umum spreadsheet menjadi "Siapa saja yang memiliki link" (Anyone with the link).'
    );
  }
  return text;
}

export function parseSpreadsheetToJobs(csvOrTsvText: string): JobPosting[] {
  if (!csvOrTsvText || !csvOrTsvText.trim()) return [];

  const result = Papa.parse<Record<string, string>>(csvOrTsvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim()
  });

  const parsedJobs: JobPosting[] = [];
  if (!result.data || result.data.length === 0) return parsedJobs;

  result.data.forEach((row, idx) => {
    const rowValues = Object.values(row).map((v) => (v !== undefined && v !== null ? String(v).trim() : ''));

    const getVal = (...possibleKeys: string[]): string => {
      for (const pk of possibleKeys) {
        for (const [key, val] of Object.entries(row)) {
          if (
            key.toLowerCase().replace(/[^a-z0-9]/g, '') === pk.toLowerCase().replace(/[^a-z0-9]/g, '') &&
            val !== undefined &&
            val !== null
          ) {
            return String(val).trim();
          }
        }
      }
      return '';
    };

    let statusRaw = getVal('STATUS', 'Status', 'status_job', 'Status Job', 'ST', 'STATUS_JOB');
    let judulJob = getVal('LIST JOB', 'List Job', 'JUDUL', 'Judul Pekerjaan', 'LIST_JOB', 'Pekerjaan', 'Job', 'PEKERJAAN', 'POSISI', 'LOWONGAN', 'NAMA JOB', 'LIST');
    let daerah = getVal('DAERAH', 'Daerah', 'Lokasi', 'Prefektur', 'LOCATION', 'LOKASI', 'PREFEKTUR', 'WILAYAH');
    let kodeJobRaw = getVal('KODE JOB', 'Kode Job', 'Kode', 'KODE', 'JOB_CODE', 'ID JOB', 'KODE_JOB', 'NO JOB', 'NO', 'KODE_LOWONGAN', 'ID');
    let genderRaw = getVal('JENIS KELAMIN YG DIBUTUHKAN', 'JENIS KELAMIN', 'Jenis Kelamin', 'Gender', 'SEX', 'JK', 'KELAMIN', 'TARGET GENDER');
    let gajiRaw = getVal('GAJI', 'Gaji', 'SALARY', 'Gaji Per Bulan', 'GAJI YEN', 'HONOR', 'GAJI (YEN)', 'RATE GAJI');
    let kuotaRaw = getVal('KANDIDAT YANG DIBUTUHKAN', 'KANDIDAT', 'KUOTA', 'Kuota', 'JUMLAH', 'NEED', 'JUMLAH ORANG', 'KUOTA SISWA', 'KANDIDAT YG DIBUTUHKAN');
    let kualifikasiRaw = getVal('KUALIFIKASI', 'Kualifikasi', 'PERSYARATAN', 'Syarat', 'QUALIFICATION', 'KRITERIA', 'REQUIREMENT');
    let biayaRaw = getVal('BIAYA', 'Biaya', 'Biaya Proses', 'FEE', 'BIAYA PROSES', 'ESTIMASI BIAYA', 'BIAYA KANDIDAT');
    let keteranganRaw = getVal('KETERANGAN', 'Keterangan', 'Catatan', 'NOTE', 'NOTES', 'CATATAN TAMBAHAN', 'DESKRIPSI');
    let tskRaw = getVal('TSK/SUMBER JOB', 'TSK / SUMBER JOB', 'TSK', 'SUMBER JOB', 'Sumber', 'TSK_SUMBER', 'PARTNER', 'MITRA', 'TSK / SUMBER', 'TSK/SUMBER');

    // Smart index positional fallback matching user spreadsheet column structure:
    // 0: STATUS, 1: LIST JOB, 2: DAERAH, 3: KODE JOB, 4: JENIS KELAMIN, 5: GAJI, 6: KANDIDAT, 7: KUALIFIKASI, 8: BIAYA, 9: KETERANGAN, 10: TSK/SUMBER JOB
    if (!judulJob && rowValues.length >= 2) {
      statusRaw = statusRaw || rowValues[0] || '';
      judulJob = judulJob || rowValues[1] || '';
      daerah = daerah || rowValues[2] || '';
      kodeJobRaw = kodeJobRaw || rowValues[3] || '';
      genderRaw = genderRaw || rowValues[4] || '';
      gajiRaw = gajiRaw || rowValues[5] || '';
      kuotaRaw = kuotaRaw || rowValues[6] || '';
      kualifikasiRaw = kualifikasiRaw || rowValues[7] || '';
      biayaRaw = biayaRaw || rowValues[8] || '';
      keteranganRaw = keteranganRaw || rowValues[9] || '';
      tskRaw = tskRaw || rowValues[10] || '';
    }

    // Skip header row repeats or empty entries
    if (!judulJob && !kodeJobRaw && !kualifikasiRaw) return;
    if (
      (judulJob && (judulJob.toUpperCase() === 'LIST JOB' || judulJob.toUpperCase() === 'JUDUL PEKERJAAN')) ||
      (kodeJobRaw && kodeJobRaw.toUpperCase() === 'KODE JOB') ||
      (statusRaw && statusRaw.toUpperCase() === 'STATUS')
    ) {
      return;
    }

    // SANITIZATION: Reassign values if currency strings were misassigned to Kode / TSK
    const isCurrencyStr = (s: string) => /^rp\s*/i.test(s) || /^\d{1,3}(\.\d{3}){2,}/.test(s);
    if (isCurrencyStr(kodeJobRaw)) {
      if (!biayaRaw) biayaRaw = kodeJobRaw;
      kodeJobRaw = '';
    }
    if (isCurrencyStr(tskRaw)) {
      if (!biayaRaw) biayaRaw = tskRaw;
      tskRaw = 'Internal IJEF';
    }
    if (isCurrencyStr(judulJob)) {
      if (!biayaRaw) biayaRaw = judulJob;
      judulJob = 'Lowongan Kerja Jepang';
    }

    // Status mapping (クローズ = Tutup, default = Aktif)
    let statusJob: 'Aktif' | 'Tutup' = 'Aktif';
    if (/クローズ|closed|tutup|close/i.test(statusRaw)) {
      statusJob = 'Tutup';
    }

    // Kategori Domisili mapping ('Domestik (Jepang)' vs 'Lokal (Indonesia)')
    let kategoriDomisili: 'Domestik (Jepang)' | 'Lokal (Indonesia)' = 'Lokal (Indonesia)';
    if (
      /国内|domestik/i.test(statusRaw) ||
      /berdomisili di jepang|domisili jepang|ex-magang di jepang/i.test(kualifikasiRaw) ||
      /domestik/i.test(daerah) ||
      /berdomisili di jepang/i.test(keteranganRaw)
    ) {
      kategoriDomisili = 'Domestik (Jepang)';
    }

    // Urgensi Job mapping ('URGENT' | 'STANDART' | 'SLOW')
    let urgensiJob: 'URGENT' | 'STANDART' | 'SLOW' = 'STANDART';
    if (/urgent|darurat|急募|mendesak|cepat|segera/i.test(statusRaw) || /urgent|急募|mendesak|segera/i.test(keteranganRaw) || /urgent/i.test(judulJob)) {
      urgensiJob = 'URGENT';
    } else if (/slow|santai|lambat/i.test(statusRaw) || /slow/i.test(keteranganRaw)) {
      urgensiJob = 'SLOW';
    }

    // Gender mapping (男 = Laki-laki, 女 = Perempuan, 男女 = Laki-laki & Perempuan)
    let jenisKelamin = genderRaw;
    if (genderRaw === '男') jenisKelamin = '男 (Laki-laki)';
    else if (genderRaw === '女') jenisKelamin = '女 (Perempuan)';
    else if (genderRaw === '男女') jenisKelamin = '男女 (Laki-laki & Perempuan)';
    else if (/laki/i.test(genderRaw) && !/perempuan/i.test(genderRaw)) jenisKelamin = '男 (Laki-laki)';
    else if (/perempuan/i.test(genderRaw) && !/laki/i.test(genderRaw)) jenisKelamin = '女 (Perempuan)';
    else if (!jenisKelamin) jenisKelamin = '男女 (Laki-laki & Perempuan)';

    // Kuota parsing
    const kuotaNum = parseInt(kuotaRaw, 10);
    const kuotaSiswa = !isNaN(kuotaNum) && kuotaNum > 0 ? kuotaNum : 1;

    // Gaji parsing & formatting
    const cleanSalaryDigits = gajiRaw.replace(/[^0-9]/g, '');
    let gajiBulananYen = parseInt(cleanSalaryDigits, 10);

    let gajiString = gajiRaw;
    if (/jam/i.test(gajiRaw)) {
      if (isNaN(gajiBulananYen) || gajiBulananYen <= 0) gajiBulananYen = 1100;
      gajiString = gajiRaw.includes('Yen') || gajiRaw.includes('yen') ? gajiRaw : `${gajiRaw.replace('円', '')} Yen/Jam`;
      if (gajiBulananYen < 5000) gajiBulananYen = gajiBulananYen * 8 * 21; // Convert hourly to monthly approx
    } else if (/hari/i.test(gajiRaw)) {
      if (isNaN(gajiBulananYen) || gajiBulananYen <= 0) gajiBulananYen = 10000;
      gajiString = gajiRaw.includes('Yen') || gajiRaw.includes('yen') ? gajiRaw : `${gajiRaw.replace('円', '')} Yen/Hari`;
      if (gajiBulananYen < 20000) gajiBulananYen = gajiBulananYen * 21; // Convert daily to monthly approx
    } else {
      if (isNaN(gajiBulananYen) || gajiBulananYen <= 0) {
        gajiBulananYen = 200000;
      }
      if (!gajiString) {
        gajiString = `${gajiBulananYen.toLocaleString()} yen/bulan`;
      } else if (/^\d+$/.test(gajiString) || /^\d+(\.\d+)+$/.test(gajiString)) {
        gajiString = `${gajiBulananYen.toLocaleString('id-ID')} yen/bulan`;
      }
    }

    const gajiEstimasiIdr = Math.round(gajiBulananYen * 105);

    // Formatted Biaya (e.g. '30' -> 'Rp 30.000.000 (30 Juta)')
    let formattedBiaya = biayaRaw;
    if (/^\d+$/.test(biayaRaw)) {
      const bNum = parseInt(biayaRaw, 10);
      if (bNum <= 100) {
        formattedBiaya = `Rp ${bNum}.000.000 (${bNum} Juta)`;
      } else {
        formattedBiaya = `Rp ${bNum.toLocaleString('id-ID')}`;
      }
    } else if (!formattedBiaya) {
      formattedBiaya = 'Sesuai Ketentuan Standard Partner / IJEF';
    }

    // Kategori target mapping
    let kategoriTarget:
      | 'SISWA NON IJEF (New Comer)'
      | 'MATCHING JOB - Engineering / Gijinkoku'
      | 'MATCHING JOB - Ex-Magang / Ex-Trainee'
      | 'Semua Non-IJEF' = 'Semua Non-IJEF';
    const combinedText = `${kualifikasiRaw} ${judulJob}`.toLowerCase();
    if (/ex-magang|ex magang|ex-trainee|senmonkyu|hyoukachosho/i.test(combinedText)) {
      kategoriTarget = 'MATCHING JOB - Ex-Magang / Ex-Trainee';
    } else if (/gijinkoku|engineering|insinyur|gijutsu|d3\/s1/i.test(combinedText)) {
      kategoriTarget = 'MATCHING JOB - Engineering / Gijinkoku';
    }

    const tskSumberJob = tskRaw && tskRaw !== 'Internal IJEF' ? tskRaw : 'Internal IJEF';
    const cleanKodeJob = kodeJobRaw && kodeJobRaw.length > 0 ? kodeJobRaw : `JOB-${String(idx + 1).padStart(3, '0')}`;
    const uniqueId = `${cleanKodeJob}_UP_${Date.now()}_${idx + 1}`;

    // Build comprehensive job description with clear formatting
    const detailParts = [
      `📌 DETAIL LOWONGAN PEKERJAAN`,
      `• Posisi / List Job: ${judulJob || 'Lowongan Kerja Jepang'}`,
      `• Kode Job: ${cleanKodeJob}`,
      `• Kategori Target: ${kategoriTarget}`,
      `• Lokasi / Prefektur: ${daerah || 'Berbagai Prefektur di Jepang'}`,
      `• Target Gender: ${jenisKelamin}`,
      `• Standar Gaji: ${gajiString} (± Rp ${(gajiEstimasiIdr).toLocaleString('id-ID')})`,
      `• Kuota Penerimaan: ${kuotaSiswa} Orang Candidate`,
      `• Partner TSK / Sumber: ${tskSumberJob}`,
      `• Kategori Mitra: Terverifikasi Mitra Resmi Jepang`,
      ``,
      `📋 KUALIFIKASI & PERSYARATAN:`,
      `${kualifikasiRaw || 'Sertifikat Bahasa & Skill Sesuai Bidang yang berlaku'}`,
      ``,
      `💰 BIAYA PROSES & TANGGUNGAN:`,
      `${formattedBiaya}`,
      ``,
      `🏨 FASILITAS & ASRAMA:`,
      `Subsidi tempat tinggal / asrama, Asuransi Kesehatan (Shakai Hoken), Tunjangan Lembur & Bonus Sesuai Peraturan Perusahaan.`,
      ``,
      keteranganRaw ? `ℹ️ KETERANGAN TAMBAHAN:\n${keteranganRaw}` : ''
    ].filter(Boolean);

    parsedJobs.push({
      id: uniqueId,
      kodeJob: cleanKodeJob,
      judulPekerjaan: judulJob || 'Lowongan Kerja Jepang',
      kategoriTarget,
      perusahaanJepang: 'Mitra Perusahaan Jepang',
      kumiaiRujukan: 'Mitra Kumiai / TSK Resmi Jepang',
      lokasiPrefektur: daerah || 'Berbagai Prefektur di Jepang',
      jenisKelamin,
      gajiBulananYen,
      gajiString,
      gajiEstimasiIdr,
      persyaratanJLPT: kualifikasiRaw ? kualifikasiRaw.slice(0, 120) : 'Sertifikat Bahasa & Skill Sesuai Bidang',
      kualifikasi: kualifikasiRaw || 'Sertifikat Bahasa & Skill Sesuai Bidang',
      biayaProses: formattedBiaya,
      keteranganTambahan: keteranganRaw,
      tskSumberJob: tskSumberJob || 'Internal IJEF',
      deskripsiPekerjaan: detailParts.join('\n'),
      fasilitasAsrama: 'Subsidi tempat tinggal / asrama, Asuransi Kesehatan (Shakai Hoken), Tunjangan Lembur & Bonus.',
      kuotaSiswa,
      kategoriDomisili,
      urgensiJob,
      statusJob,
      statusAktif: statusJob === 'Aktif'
    });
  });

  return parsedJobs;
}

export const JobSpreadsheetUploadModal: React.FC<JobSpreadsheetUploadModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const { lang } = useApp();
  const [inputTab, setInputTab] = useState<'url' | 'paste' | 'file'>('url');
  
  // Google Sheets Link State
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const [sheetName, setSheetName] = useState<string>('');
  const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(false);

  // File & Paste States
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [pastedText, setPastedText] = useState<string>('');

  // Results & Mode
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [parsedJobs, setParsedJobs] = useState<JobPosting[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Template_Katalog_Job_Matching.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFetchGoogleSheets = async () => {
    setParseError(null);
    if (!googleSheetUrl.trim()) {
      setParseError(lang === 'ja' ? 'まずGoogleスプレッドシートのURLを入力してください。' : 'Silakan masukkan Link Google Sheets terlebih dahulu.');
      return;
    }

    const { spreadsheetId, gid } = extractGoogleSheetsInfo(googleSheetUrl);
    if (!spreadsheetId) {
      setParseError(
        lang === 'ja'
          ? 'Googleスプレッドシートのリンク形式が無効です。形式を確認してください: https://docs.google.com/spreadsheets/d/ID_SPREADSHEET/edit'
          : 'Format Link Google Sheets tidak valid. Pastikan link berbentuk: https://docs.google.com/spreadsheets/d/ID_SPREADSHEET/edit'
      );
      return;
    }

    setIsLoadingUrl(true);
    try {
      const csvText = await fetchGoogleSheetCsv(spreadsheetId, sheetName, gid || undefined);
      const jobs = parseSpreadsheetToJobs(csvText);

      if (jobs.length === 0) {
        setParseError(
          lang === 'ja'
            ? 'Googleスプレッドシートから求人データを読み取れませんでした。ヘッダー列（STATUS、LIST JOB、KODE JOB等）が含まれていることを確認してください。'
            : 'Gagal membaca baris job dari Google Sheet. Pastikan sheet berisi kolom baris judul (STATUS, LIST JOB, KODE JOB, dll).'
        );
      } else {
        setParsedJobs(jobs);
      }
    } catch (err: any) {
      setParseError(err.message || (lang === 'ja' ? 'Googleスプレッドシートからのデータ取得に失敗しました。' : 'Gagal menarik data dari Google Sheets.'));
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      try {
        const jobs = parseSpreadsheetToJobs(text);
        if (jobs.length === 0) {
          setParseError(lang === 'ja' ? '有効な求人データが見つかりませんでした。列ヘッダー名を確認してください。' : 'Tidak ada data job valid yang ditemukan dalam file. Pastikan nama header kolom sesuai.');
        } else {
          setParsedJobs(jobs);
        }
      } catch (err: any) {
        setParseError(lang === 'ja' ? `CSVファイルの読み込みエラー: ${err.message || err}` : `Gagal membaca file CSV/Spreadsheet: ${err.message || err}`);
      }
    };
    reader.onerror = () => {
      setParseError(lang === 'ja' ? 'ファイルの処理中にエラーが発生しました。' : 'Error saat memproses file.');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleParseText = () => {
    setParseError(null);
    const trimmed = pastedText.trim();
    if (!trimmed) {
      setParseError(lang === 'ja' ? 'まずGoogleスプレッドシートまたはExcelからデータを貼り付けてください。' : 'Silakan tempel (paste) data dari Google Sheet atau Excel terlebih dahulu.');
      return;
    }

    // Auto-detect if user pasted a Google Sheets URL into the text area!
    if (trimmed.includes('docs.google.com/spreadsheets')) {
      setGoogleSheetUrl(trimmed);
      setInputTab('url');
      setTimeout(() => {
        handleFetchGoogleSheetsWithUrl(trimmed);
      }, 100);
      return;
    }

    try {
      const jobs = parseSpreadsheetToJobs(trimmed);
      if (jobs.length === 0) {
        setParseError(lang === 'ja' ? '求人行を読み取れませんでした。列ヘッダーが含まれていることを確認してください。' : 'Tidak dapat membaca baris job. Pastikan menyertakan baris judul kolom (STATUS, LIST JOB, KODE JOB, dll).');
      } else {
        setParsedJobs(jobs);
      }
    } catch (err: any) {
      setParseError(lang === 'ja' ? `テキストデータの処理に失敗しました: ${err.message || err}` : `Gagal memproses data teks: ${err.message || err}`);
    }
  };

  const handleFetchGoogleSheetsWithUrl = async (urlStr: string) => {
    setParseError(null);
    const { spreadsheetId, gid } = extractGoogleSheetsInfo(urlStr);
    if (!spreadsheetId) {
      setParseError(lang === 'ja' ? 'Googleスプレッドシートのリンク形式が無効です。' : 'Format Link Google Sheets tidak valid.');
      return;
    }
    setIsLoadingUrl(true);
    try {
      const csvText = await fetchGoogleSheetCsv(spreadsheetId, sheetName, gid || undefined);
      const jobs = parseSpreadsheetToJobs(csvText);

      if (jobs.length === 0) {
        setParseError(
          lang === 'ja'
            ? 'Googleスプレッドシートから求人データを読み取れませんでした。ヘッダー列を確認してください。'
            : 'Gagal membaca baris job dari Google Sheet. Pastikan sheet berisi kolom baris judul (STATUS, LIST JOB, KODE JOB, dll).'
        );
      } else {
        setParsedJobs(jobs);
      }
    } catch (err: any) {
      setParseError(err.message || (lang === 'ja' ? 'Googleスプレッドシートからのデータ取得に失敗しました。' : 'Gagal menarik data dari Google Sheets.'));
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleConfirmImport = () => {
    if (parsedJobs.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      onImport(parsedJobs, importMode === 'replace');
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col w-screen h-screen overflow-hidden">
      <div className="bg-white text-slate-900 w-full h-full flex flex-col min-h-0 overflow-hidden">
        {/* Modal Header - Full Screen Mode */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4 sm:p-5 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-purple-100 text-purple-700 border border-purple-200 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {lang === 'ja' ? 'スプレッドシート経由で求人案件を一括登録・アップロード' : 'Upload Job Postings via Spreadsheet'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ja'
                  ? 'GoogleスプレッドシートのリンクまたはExcel/CSVファイルから求人案件を一括インポートします。'
                  : 'Import massal data lowongan pekerjaan menggunakan Link Google Sheets atau File Excel.'}
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

        <div className="overflow-y-auto space-y-5 pr-1 flex-1">
          {/* Top Info Header */}
          <div className="bg-purple-50/70 border border-purple-200 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <p className="text-purple-900 font-medium leading-relaxed">
                <span className="font-bold">{lang === 'ja' ? 'スプレッドシート列フォーマット:' : 'Format Kolom Spreadsheet:'}</span> STATUS, LIST JOB, DAERAH, KODE JOB, JENIS KELAMIN YG DIBUTUHKAN, GAJI, KANDIDAT YANG DIBUTUHKAN, KUALIFIKASI, BIAYA, KETERANGAN, TSK/SUMBER JOB
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="bg-white hover:bg-purple-100 text-purple-700 border border-purple-300 px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'ja' ? 'CSVテンプレートDL' : 'Download Template CSV'}</span>
            </button>
          </div>

          {/* Input Source Tabs */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
              <button
                onClick={() => {
                  setInputTab('url');
                  setParseError(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                  inputTab === 'url'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? '1. GoogleスプレッドシートURL貼り付け (自動)' : '1. Tempel Link Google Sheets (Otomatis)'}</span>
              </button>
              <button
                onClick={() => {
                  setInputTab('paste');
                  setParseError(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                  inputTab === 'paste'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? '2. 表セルのコピー＆ペースト' : '2. Copy - Paste Sel Tabel'}</span>
              </button>
              <button
                onClick={() => {
                  setInputTab('file');
                  setParseError(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                  inputTab === 'file'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? '3. CSVファイルアップロード (.csv)' : '3. Upload File (.csv)'}</span>
              </button>
            </div>

            {/* TAB 1: GOOGLE SHEETS LINK URL */}
            {inputTab === 'url' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Globe className="w-4 h-4 text-purple-600" />
                    <span>{lang === 'ja' ? 'Googleスプレッドシートの共有URLを入力:' : 'Masukkan URL Link Google Spreadsheet:'}</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={googleSheetUrl}
                      onChange={(e) => setGoogleSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1Z9uOz5LqbRlzU8Z6_.../edit?usp=sharing"
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                    <button
                      onClick={handleFetchGoogleSheets}
                      disabled={isLoadingUrl}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 cursor-pointer shadow-md shadow-purple-600/30 shrink-0 transition"
                    >
                      {isLoadingUrl ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{lang === 'ja' ? 'データ取得中...' : 'Menarik Data...'}</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>{lang === 'ja' ? '求人データ取得' : 'Tarik Data Job'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Multi-Sheet / Tab Option */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-amber-600" />
                      <span>{lang === 'ja' ? 'スプレッドシートに複数シート/タブがある場合' : 'Bagaimana Jika Spreadsheet Punya Banyak Sheet / Tab?'}</span>
                    </label>
                    <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                      Multi-Tab Support
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                        {lang === 'ja' ? 'オプション A: シート/タブ名を入力（任意）:' : 'Opsi A: Ketik Nama Sheet / Tab (Opsional):'}
                      </span>
                      <input
                        type="text"
                        value={sheetName}
                        onChange={(e) => setSheetName(e.target.value)}
                        placeholder={lang === 'ja' ? '例: Sheet1, 2024求人, 元実習生' : 'Contoh: Sheet1, Lowongan 2024, Ex-Magang'}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        {lang === 'ja' ? '空欄にすると最初のタブ（デフォルト）を取得します。' : 'Biarkan kosong untuk menarik Tab pertama (Default).'}
                      </p>
                    </div>

                    <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60 text-[11px] text-amber-950 space-y-1">
                      <p className="font-bold flex items-center space-x-1 text-amber-900">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                        <span>{lang === 'ja' ? 'オプション B: Googleスプレッドシートで直接タブをクリック' : 'Opsi B: Langsung Klik Tab di Google Sheets'}</span>
                      </p>
                      <p className="leading-normal text-slate-700">
                        {lang === 'ja'
                          ? 'Googleスプレッドシートでインポートしたいタブをクリックし、ブラウザのURLをコピーします。URLにはタブ識別子が含まれます（例: #gid=123456）。'
                          : 'Di Google Sheets, klik tab yang ingin diimpor, lalu salin URL browser. URL akan otomatis menyertakan kode tab (contoh: #gid=123456).'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Important Sharing Permission Note */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-2">
                  <ExternalLink className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div className="leading-relaxed">
                    <span className="font-bold">{lang === 'ja' ? 'Googleスプレッドシートの共有設定を確認してください:' : 'Pastikan Pengaturan Akses Google Sheets:'}</span>
                    <br />
                    {lang === 'ja'
                      ? 'Googleスプレッドシートの「共有」ボタンをクリック → 一般的なアクセス権を「リンクを知っている全員」（閲覧可）に変更してください。'
                      : 'Klik tombol Bagikan (Share) di Google Sheets → Ubah Akses Umum menjadi "Siapa saja yang memiliki link" (Anyone with the link can view) agar sistem dapat mengunduh data secara otomatis.'}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COPY PASTE */}
            {inputTab === 'paste' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                    <Table className="w-3.5 h-3.5 text-purple-600" />
                    <span>{lang === 'ja' ? '表セル / テキスト / GoogleスプレッドシートURLを貼り付け:' : 'Tempel (Paste) Baris Sel / Teks / Link Google Sheets di Bawah:'}</span>
                  </label>
                  <button
                    onClick={() => setPastedText(SAMPLE_TEMPLATE_CSV)}
                    className="text-[11px] text-purple-600 hover:underline font-semibold cursor-pointer"
                  >
                    {lang === 'ja' ? 'デモ用サンプルテキスト' : 'Gunakan Contoh Teks Demo'}
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`STATUS\tLIST JOB\tDAERAH\tKODE JOB\tJENIS KELAMIN YG DIBUTUHKAN\tGAJI\tKANDIDAT YANG DIBUTUHKAN\tKUALIFIKASI\tBIAYA\tKETERANGAN\tTSK/SUMBER JOB
クローズ\t通訳\t\tIND035\t女\t\t1\tMinimal N3. Maksimal 40 tahun.\tRp 25.000.000\tSudah termasuk Visa\tAgs`}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleParseText}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-sm transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{lang === 'ja' ? 'スプレッドシートテキストを解析' : 'Proses Teks Spreadsheet'}</span>
                </button>
              </div>
            )}

            {/* TAB 3: FILE UPLOAD */}
            {inputTab === 'file' && (
              <div className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/30 rounded-2xl p-6 text-center transition space-y-3">
                <Upload className="w-8 h-8 text-purple-500 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {lang === 'ja' ? 'CSV / TSV ファイルを選択またはドラッグ＆ドロップ (.csv, .tsv, .txt)' : 'Pilih atau Drag & Drop file CSV / TSV (.csv, .tsv, .txt)'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {lang === 'ja'
                      ? 'Googleスプレッドシートからのエクスポートファイルに対応 (ファイル → ダウンロード → カンマ区切り形式 .csv)'
                      : 'Mendukung file hasil ekspor dari Google Sheets (File → Download → Comma Separated Values .csv)'}
                  </p>
                </div>
                <div>
                  <label className="inline-flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-purple-600/30 cursor-pointer transition">
                    <FileText className="w-4 h-4" />
                    <span>{lang === 'ja' ? 'CSVファイルを選択' : 'Pilih File CSV/Spreadsheet'}</span>
                    <input
                      type="file"
                      accept=".csv, .tsv, .txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {fileName && (
                  <p className="text-xs text-emerald-700 font-bold bg-emerald-50 py-1.5 px-3 rounded-lg inline-block border border-emerald-200">
                    ✓ {lang === 'ja' ? `選択されたファイル: ${fileName}` : `File terpilih: ${fileName}`}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Parse Error Display */}
          {parseError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">{lang === 'ja' ? 'データ解析エラー:' : 'Gagal Menganalisis Data Spreadsheet:'}</p>
                <p>{parseError}</p>
              </div>
            </div>
          )}

          {/* Parsed Jobs Preview */}
          {parsedJobs.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-black text-slate-900 text-sm flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'ja' ? `インポートプレビュー (${parsedJobs.length} 件の求人を検出)` : `Pratinjau Data Impor (${parsedJobs.length} Job Ditemukan)`}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'ja' ? 'データベースに反映する前に変換結果の概要を確認してください。' : 'Periksa kembali ringkasan data hasil konversi spreadsheet sebelum diproses ke database.'}
                  </p>
                </div>

                {/* Import Mode Selection */}
                <div className="flex items-center space-x-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs font-medium">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-slate-800 font-semibold">{lang === 'ja' ? '追加 / 統合' : 'Gabung / Tambahkan'}</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-rose-700 font-bold">{lang === 'ja' ? '全求人を上書き置換' : 'Gantikan Semua Job'}</span>
                  </label>
                </div>
              </div>

              {/* Stats Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">{lang === 'ja' ? '総求人数' : 'Total Job'}</span>
                  <span className="font-black text-slate-800 text-base">{parsedJobs.length} {lang === 'ja' ? '件' : 'Posisi'}</span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 text-[10px] uppercase font-bold block">{lang === 'ja' ? '有効求人' : 'Job Aktif'}</span>
                  <span className="font-black text-emerald-800 text-base">
                    {parsedJobs.filter((j) => j.statusJob === 'Aktif').length}
                  </span>
                </div>
                <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-200">
                  <span className="text-sky-700 text-[10px] uppercase font-bold block">{lang === 'ja' ? '日本国内在住向け' : 'Domestik Jepang'}</span>
                  <span className="font-black text-sky-800 text-base">
                    {parsedJobs.filter((j) => j.statusJob === 'Lokal/Domestik (Jepang)' || j.kategoriDomisili === 'Domestik (Jepang)').length}
                  </span>
                </div>
                <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <span className="text-rose-700 text-[10px] uppercase font-bold block">{lang === 'ja' ? '募集終了' : 'Job Tutup'}</span>
                  <span className="font-black text-rose-800 text-base">
                    {parsedJobs.filter((j) => j.statusJob === 'Tutup').length}
                  </span>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-56">
                <table className="w-full text-left text-xs text-slate-800 border-collapse">
                  <thead className="bg-slate-100 text-[10px] font-extrabold uppercase text-slate-600 tracking-wider sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">{lang === 'ja' ? 'ステータス' : 'Status'}</th>
                      <th className="py-2 px-3">{lang === 'ja' ? '緊急度' : 'Urgensi'}</th>
                      <th className="py-2 px-3">{lang === 'ja' ? '対象居住地' : 'Domisili Job Siswa'}</th>
                      <th className="py-2 px-3">{lang === 'ja' ? 'コード' : 'Kode'}</th>
                      <th className="py-2 px-3">{lang === 'ja' ? '求人職種' : 'List Job'}</th>
                      <th className="py-2 px-3">{lang === 'ja' ? '勤務地' : 'Daerah'}</th>
                      <th className="py-2 px-3">{lang === 'ja' ? '性別' : 'Gender'}</th>
                      <th className="py-2 px-3">{lang === 'ja' ? '給与' : 'Gaji'}</th>
                      <th className="py-2 px-3">{lang === 'ja' ? '枠数' : 'Kuota'}</th>
                      <th className="py-2 px-3">{lang === 'ja' ? '応募要件' : 'Kualifikasi'}</th>
                      <th className="py-2 px-3">{lang === 'ja' ? '費用' : 'Biaya'}</th>
                      <th className="py-2 px-3">TSK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedJobs.map((j, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              j.statusJob === 'Aktif'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {lang === 'ja' ? (j.statusJob === 'Aktif' ? '募集中' : '募集終了') : j.statusJob}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                              (j.urgensiJob || 'STANDART').toUpperCase() === 'URGENT'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : (j.urgensiJob || 'STANDART').toUpperCase() === 'SLOW'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {(j.urgensiJob || 'STANDART').toUpperCase() === 'URGENT'
                              ? (lang === 'ja' ? '🔥 急募' : '🔥 URGENT')
                              : (j.urgensiJob || 'STANDART').toUpperCase() === 'SLOW'
                              ? (lang === 'ja' ? '⏳ 通常' : '⏳ SLOW')
                              : (lang === 'ja' ? '⚡ 標準' : '⚡ STANDART')}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              j.kategoriDomisili === 'Domestik (Jepang)'
                                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {lang === 'ja'
                              ? (j.kategoriDomisili === 'Domestik (Jepang)' ? '日本国内在住' : 'インドネシア現地')
                              : (j.kategoriDomisili || 'Lokal (Indonesia)')}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-purple-700 whitespace-nowrap">
                          {j.kodeJob}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900 max-w-[160px] truncate">
                          {getSanitizedJobTitle(j, lang)}
                        </td>
                        <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                          {formatPrefecture(j.lokasiPrefektur, lang)}
                        </td>
                        <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                          {formatGender(j.jenisKelamin, lang)}
                        </td>
                        <td className="py-2 px-3 font-bold text-amber-800 whitespace-nowrap">
                          {j.gajiString}
                        </td>
                        <td className="py-2 px-3 font-semibold text-center">{j.kuotaSiswa}</td>
                        <td className="py-2 px-3 text-slate-600 max-w-[200px] truncate" title={j.kualifikasi}>
                          {j.kualifikasi || '-'}
                        </td>
                        <td className="py-2 px-3 text-indigo-700 font-medium max-w-[120px] truncate">
                          {j.biayaProses}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-700 whitespace-nowrap">
                          {j.tskSumberJob}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
          >
            {lang === 'ja' ? 'キャンセル' : 'Batal'}
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={parsedJobs.length === 0 || isProcessing}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer shadow-md transition ${
              parsedJobs.length > 0 && !isProcessing
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{lang === 'ja' ? '求人データを処理中...' : 'Memproses Data Job...'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>
                  {lang === 'ja'
                    ? (parsedJobs.length > 0 ? `${parsedJobs.length} 件の求人をインポート` : 'インポート')
                    : `Import ${parsedJobs.length > 0 ? `${parsedJobs.length} Lowongan Pekerjaan` : 'Data'}`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

