import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Video,
  Image as ImageIcon,
  ExternalLink,
  Info,
  FolderOpen,
  Plus,
  ShieldCheck,
  FileCheck,
  Link as LinkIcon,
  Paperclip,
  Check
} from 'lucide-react';
import { FilePreviewModal } from './FilePreviewModal';
import { CandidateDocumentsUpload } from '../../types';
import { useEcosystemTranslation } from '../../hooks/useEcosystemTranslation';

export interface CandidateDocumentUploadSectionProps {
  documents: CandidateDocumentsUpload | Record<string, any>;
  onChange: (updatedDocs: CandidateDocumentsUpload | Record<string, any>) => void;
  candidateName?: string;
  readOnly?: boolean;
  className?: string;
  showSaveButton?: boolean;
  onSave?: () => void;
  lang?: 'id' | 'ja';
}

interface DocumentItemConfig {
  key: string;
  label: string;
  labelJa?: string;
  placeholder?: string;
  helperText?: string;
  isSpecialBannerBefore?: boolean;
  aliases: string[];
}

export const CANDIDATE_DOCUMENT_ITEMS: DocumentItemConfig[] = [
  {
    key: 'pasPhoto3x4',
    label: 'Pas Photo 3x4',
    labelJa: '証明写真 3×4cm',
    placeholder: 'Atau paste URL Google Drive di sini...',
    aliases: ['pasPhoto3x4', 'pasFoto', 'pasFotoUrl', 'photoUrl', 'avatarUrl', 'foto', 'photo']
  },
  {
    key: 'sertifikatBahasaJepang',
    label: 'Sertifikat Bahasa Jepang JFT/JLPT',
    labelJa: '日本語能力認定書（JFT / JLPT）',
    placeholder: 'Atau paste URL Google Drive di sini...',
    aliases: ['sertifikatBahasaJepang', 'sertifikatJft', 'sertifikatJlpt', 'jftCertUrl', 'jlptCertUrl', 'sertifikatBahasa', 'jft', 'jlpt']
  },
  {
    key: 'videoScreenRecordingJft',
    label: 'Video Screen Recording JFT',
    labelJa: 'JFTスコア画面録画（動画）',
    placeholder: 'Atau paste URL Google Drive di sini...',
    aliases: ['videoScreenRecordingJft', 'videoJft', 'videoScreenJft', 'screenRecordingJft']
  },
  {
    key: 'sertifikatSsw',
    label: 'Sertifikat SSW',
    labelJa: '特定技能評価試験合格証（SSW）',
    placeholder: 'Atau paste URL Google Drive di sini...',
    aliases: ['sertifikatSsw', 'sertifikatSswKaigoSkill', 'sertifikatSswSkill', 'sswCertUrl', 'sertifikatSSW', 'sertifikatSsw1', 'sertifikatSswOtaff', 'sertifikatSenmonkyuu']
  },
  {
    key: 'videoScreenRecordingSsw',
    label: 'Video Screen Recording SSW',
    labelJa: '特定技能スコア画面録画（動画）',
    placeholder: 'Atau paste URL Google Drive di sini...',
    aliases: ['videoScreenRecordingSsw', 'videoSsw', 'videoScreenSsw', 'screenRecordingSsw']
  },
  {
    key: 'sertifikatSsw2Kaigo',
    label: 'Sertifikat SSW 2 (Khusus KAIGO)',
    labelJa: '介護特定技能評価試験合格証（専門）',
    placeholder: 'Atau paste URL Google Drive di sini...',
    aliases: ['sertifikatSsw2Kaigo', 'sertifikatSswKaigoBahasa', 'sertifikatSsw2', 'sertifikatKaigo']
  },
  {
    key: 'videoScreenRecordingSsw2Kaigo',
    label: 'Video Screen Recording SSW 2 (Khusus KAIGO)',
    labelJa: '介護特定技能スコア画面録画（動画）',
    placeholder: 'Atau paste URL Google Drive di sini...',
    aliases: ['videoScreenRecordingSsw2Kaigo', 'videoSsw2Kaigo', 'videoSsw2']
  },
  {
    key: 'videoJikoshoukai',
    label: 'Video Jikoshoukai (Self Introduction)',
    labelJa: '自己紹介動画（Jikoshoukai Video）',
    placeholder: 'Atau paste URL Google Drive di sini...',
    isSpecialBannerBefore: true,
    aliases: ['videoJikoshoukai', 'videoJikoshoukaiUrl', 'jikoshoukaiVideo', 'videoUrl', 'videoPerkenalan']
  },
  {
    key: 'cvRirekishoDoc',
    label: 'CV/Rirekisho',
    labelJa: '公式履歴書（JIS規格Rirekisho）',
    placeholder: 'Atau paste URL Google Drive di sini...',
    aliases: ['cvRirekishoDoc', 'cv', 'cvUrl', 'rirekishoUrl', 'rirekishoDoc', 'cvFile']
  }
];

export const KNOWN_LEGACY_LABELS: Record<string, string> = {
  ktpSiswa: 'KTP Calon Siswa',
  ktp: 'KTP Calon Siswa',
  ktpOrangTua: 'KTP Orang Tua / Wali',
  kartuKeluarga: 'Kartu Keluarga (KK)',
  kk: 'Kartu Keluarga (KK)',
  ijazah: 'Ijazah Terakhir',
  ijazahPerguruanTinggi: 'Ijazah Perguruan Tinggi (D3/S1/S2)',
  transkripNilai: 'Transkrip Nilai Akademik',
  skck: 'Surat Keterangan Catatan Kepolisian (SKCK)',
  paspor: 'Buku Paspor',
  pasporLama: 'Paspor Lama & Riwayat Visa Jepang',
  sim: 'Surat Izin Mengemudi (SIM)',
  dokumenSim: 'Surat Izin Mengemudi (SIM)',
  sertifikatSelesaiMagang: 'Sertifikat Selesai Magang (JITCO / OTIT)',
  sertifikatSenmonkyuu: 'Sertifikat Senmonkyuu',
  sertifikatJitshusei: 'Sertifikat Jitshusei / Hyouka Chousho',
  hasilMcu: 'Hasil Medical Check Up (MCU)',
  suratIzinOrangTua: 'Surat Izin Orang Tua / Wali',
  paktaIntegritas: 'Pakta Integritas / Surat Pernyataan',
  portofolioProject: 'Portofolio Teknis / Keahlian',
  sertifikatPelatihan: 'Sertifikat Pelatihan Tambahan'
};

export const KNOWN_LEGACY_LABELS_JA: Record<string, string> = {
  ktpSiswa: '本人身分証明書 (KTP)',
  ktp: '本人身分証明書 (KTP)',
  ktpOrangTua: '保護者身分証明書',
  kartuKeluarga: '家族登録証明書 (KK)',
  kk: '家族登録証明書 (KK)',
  ijazah: '最終学歴卒業証明書',
  ijazahPerguruanTinggi: '高等教育卒業証明書 (大卒/短大卒)',
  transkripNilai: '学業成績証明書',
  skck: '無犯罪証明書 (SKCK)',
  paspor: 'パスポート原本',
  pasporLama: '旧パスポート・訪日ビザ履歴',
  sim: '運転免許証 (SIM)',
  dokumenSim: '運転免許証 (SIM)',
  sertifikatSelesaiMagang: '技能実習修了証明書 (JITCO / OTIT)',
  sertifikatSenmonkyuu: '専門級随時試験合格証明書',
  sertifikatJitshusei: '技能実習評価調書',
  hasilMcu: '健康診断結果証明書 (MCU)',
  suratIzinOrangTua: '保護者承諾書',
  paktaIntegritas: '誓約書・宣誓書',
  portofolioProject: '技術ポートフォリオ',
  sertifikatPelatihan: '研修・資格修了証'
};

export const CandidateDocumentUploadSection: React.FC<CandidateDocumentUploadSectionProps> = ({
  documents = {},
  onChange,
  candidateName = '',
  readOnly = false,
  className = '',
  showSaveButton = false,
  onSave,
  lang: propLang
}) => {
  const { lang: globalLang, bilingual } = useEcosystemTranslation();
  const lang = propLang || globalLang;
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    fileUrl: string;
    fileName?: string;
  }>({
    isOpen: false,
    title: '',
    fileUrl: ''
  });

  const [showAddCustomDoc, setShowAddCustomDoc] = useState<boolean>(false);
  const [customDocKey, setCustomDocKey] = useState<string>('ktpSiswa');
  const [customDocLabel, setCustomDocLabel] = useState<string>('');

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Helper to get raw string value from any key or array
  const extractVal = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val) && val.length > 0) return typeof val[0] === 'string' ? val[0] : '';
    return '';
  };

  // Helper to look up active value with fallback aliases
  const getDocValue = (key: string, aliases?: string[]): string => {
    const rawVal = (documents as any)?.[key];
    const extracted = extractVal(rawVal);
    if (extracted) return extracted;

    if (aliases && aliases.length > 0) {
      for (const alias of aliases) {
        const aliasVal = extractVal((documents as any)?.[alias]);
        if (aliasVal) return aliasVal;
      }
    }
    return '';
  };

  // Helper to look up specific link value if stored separately
  const getDocLink = (key: string, aliases?: string[]): string => {
    const directLink = (documents as any)?.[`${key}_link`];
    if (directLink && typeof directLink === 'string') return directLink;

    const directVal = extractVal((documents as any)?.[key]);
    if (directVal && (directVal.startsWith('http://') || directVal.startsWith('https://') || directVal.includes('drive.google.com') || directVal.includes('docs.google.com'))) {
      return directVal;
    }

    if (aliases && aliases.length > 0) {
      for (const alias of aliases) {
        const aliasLink = (documents as any)?.[`${alias}_link`];
        if (aliasLink && typeof aliasLink === 'string') return aliasLink;
        const aliasVal = extractVal((documents as any)?.[alias]);
        if (aliasVal && (aliasVal.startsWith('http://') || aliasVal.startsWith('https://') || aliasVal.includes('drive.google.com') || aliasVal.includes('docs.google.com'))) {
          return aliasVal;
        }
      }
    }
    return '';
  };

  // Helper to look up file name
  const getDocFileName = (key: string, aliases?: string[]): string | undefined => {
    const directName = (documents as any)?.[`${key}_fileName`];
    if (directName) return directName;

    if (aliases) {
      for (const alias of aliases) {
        const aliasName = (documents as any)?.[`${alias}_fileName`];
        if (aliasName) return aliasName;
      }
    }
    return undefined;
  };

  // Helper to look up file size formatted string
  const getDocFileSizeStr = (key: string, aliases?: string[]): string | undefined => {
    const size = (documents as any)?.[`${key}_fileSize`];
    if (typeof size === 'number') {
      if (size > 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
      return `${(size / 1024).toFixed(0)} KB`;
    }
    if (aliases) {
      for (const alias of aliases) {
        const aliasSize = (documents as any)?.[`${alias}_fileSize`];
        if (typeof aliasSize === 'number') {
          if (aliasSize > 1024 * 1024) return `${(aliasSize / (1024 * 1024)).toFixed(1)} MB`;
          return `${(aliasSize / 1024).toFixed(0)} KB`;
        }
      }
    }
    return undefined;
  };

  const handleUrlChange = (key: string, value: string, aliases?: string[]) => {
    const updated = {
      ...documents,
      [key]: value,
      [`${key}_link`]: value
    };

    // If it's a primary key with legacy equivalent, sync both for maximum system compatibility
    if (key === 'pasPhoto3x4') {
      (updated as any).pasFoto = value;
      (updated as any).pasFotoUrl = value;
    } else if (key === 'videoJikoshoukai') {
      (updated as any).videoJikoshoukaiUrl = value;
    } else if (key === 'sertifikatBahasaJepang') {
      if (!(updated as any).sertifikatJft) (updated as any).sertifikatJft = value;
    } else if (key === 'sertifikatSsw') {
      if (!(updated as any).sertifikatSswKaigoSkill) (updated as any).sertifikatSswKaigoSkill = value;
    } else if (key === 'cvRirekishoDoc') {
      if (!(updated as any).cv) (updated as any).cv = value;
    }

    onChange(updated);
  };

  const handleFileUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read file with FileReader to get data URL for universal format support
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result;
      if (typeof result === 'string') {
        const updated = {
          ...documents,
          [key]: result,
          [`${key}_fileName`]: file.name,
          [`${key}_fileType`]: file.type,
          [`${key}_fileSize`]: file.size
        };

        // Sync legacy keys
        if (key === 'pasPhoto3x4') {
          (updated as any).pasFoto = result;
          (updated as any).pasFotoUrl = result;
        } else if (key === 'videoJikoshoukai') {
          (updated as any).videoJikoshoukaiUrl = result;
        } else if (key === 'sertifikatBahasaJepang') {
          (updated as any).sertifikatJft = result;
        } else if (key === 'sertifikatSsw') {
          (updated as any).sertifikatSswKaigoSkill = result;
        } else if (key === 'cvRirekishoDoc') {
          (updated as any).cv = result;
        }

        onChange(updated);
      }
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be chosen again if needed
    e.target.value = '';
  };

  const handleClearDoc = (key: string, aliases?: string[]) => {
    const updated = { ...documents };
    delete (updated as any)[key];
    delete (updated as any)[`${key}_fileName`];
    delete (updated as any)[`${key}_fileType`];
    delete (updated as any)[`${key}_fileSize`];
    delete (updated as any)[`${key}_link`];

    // Clear aliases as well if specified
    if (aliases) {
      aliases.forEach((alias) => {
        delete (updated as any)[alias];
        delete (updated as any)[`${alias}_fileName`];
        delete (updated as any)[`${alias}_fileType`];
        delete (updated as any)[`${alias}_fileSize`];
        delete (updated as any)[`${alias}_link`];
      });
    }

    onChange(updated);
  };

  const handleOpenPreview = (key: string, label: string, aliases?: string[]) => {
    const val = getDocValue(key, aliases);
    if (!val) return;
    const fileName = getDocFileName(key, aliases);
    setPreviewModal({
      isOpen: true,
      title: label,
      fileUrl: val,
      fileName
    });
  };

  // Identify all existing legacy/additional documents that are NOT already consumed by standard items
  const legacyAndExtraDocs = useMemo(() => {
    const primaryStandardKeys = new Set(CANDIDATE_DOCUMENT_ITEMS.map((item) => item.key));
    const consumedValues = new Set<string>();

    // Register values currently used by primary items
    CANDIDATE_DOCUMENT_ITEMS.forEach((item) => {
      const v = getDocValue(item.key, item.aliases);
      if (v) consumedValues.add(v);
    });

    const results: { key: string; label: string; value: string; fileName?: string; link?: string; fileSizeStr?: string }[] = [];

    Object.keys(documents).forEach((rawKey) => {
      // Ignore metadata fields
      if (rawKey.endsWith('_fileName') || rawKey.endsWith('_fileType') || rawKey.endsWith('_fileSize') || rawKey.endsWith('_link')) {
        return;
      }
      // If it's one of the 9 primary keys, it's already rendered in the standard section
      if (primaryStandardKeys.has(rawKey)) {
        return;
      }

      const val = extractVal((documents as any)[rawKey]);
      if (val) {
        // If this is an alias with the exact same value already rendered in a standard item, skip duplicate
        if (consumedValues.has(val) && !KNOWN_LEGACY_LABELS[rawKey]) {
          return;
        }

        const friendlyLabel =
          KNOWN_LEGACY_LABELS[rawKey] ||
          rawKey
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();

        results.push({
          key: rawKey,
          label: friendlyLabel,
          value: val,
          fileName: (documents as any)[`${rawKey}_fileName`],
          link: (documents as any)[`${rawKey}_link`] || (val.startsWith('http') ? val : ''),
          fileSizeStr: typeof (documents as any)[`${rawKey}_fileSize`] === 'number'
            ? `${((documents as any)[`${rawKey}_fileSize`] / 1024).toFixed(0)} KB`
            : undefined
        });
      }
    });

    return results;
  }, [documents]);

  // Compute total counts of attached documents
  const documentStats = useMemo(() => {
    let totalFiles = 0;
    let totalLinks = 0;
    let totalItems = 0;

    CANDIDATE_DOCUMENT_ITEMS.forEach((item) => {
      const val = getDocValue(item.key, item.aliases);
      if (val) {
        totalItems++;
        if (val.startsWith('data:') || (documents as any)[`${item.key}_fileName`]) {
          totalFiles++;
        }
        if (val.startsWith('http://') || val.startsWith('https://') || val.includes('drive.google.com') || (documents as any)[`${item.key}_link`]) {
          totalLinks++;
        }
      }
    });

    legacyAndExtraDocs.forEach((doc) => {
      totalItems++;
      if (doc.value.startsWith('data:') || doc.fileName) {
        totalFiles++;
      }
      if (doc.value.startsWith('http') || doc.link) {
        totalLinks++;
      }
    });

    return { totalItems, totalFiles, totalLinks };
  }, [documents, legacyAndExtraDocs]);

  const handleAddCustomDocument = () => {
    const key = customDocKey.trim() || 'dokumenTambahan';
    const label = customDocLabel.trim() || KNOWN_LEGACY_LABELS[key] || key;
    if (!key) return;

    if (!(documents as any)[key]) {
      const updated = {
        ...documents,
        [key]: ''
      };
      onChange(updated);
    }
    setShowAddCustomDoc(false);
    setCustomDocLabel('');
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden ${className}`}>
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              {bilingual('Upload & Lampiran Dokumen', '提出書類・添付資料一覧')}
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>{bilingual('Data Tersimpan Aman', 'データ保護管理済')}</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {bilingual(
              'Semua data file upload dan tautan Google Drive / Cloud terlampir utuh & dapat ditinjau langsung via tombol View File.',
              'アップロードされたファイルおよびGoogleドライブ/クラウドリンクは全て安全に保管され、プレビュー閲覧が可能です。'
            )}
          </p>
        </div>

        {/* Dynamic Badge Summary */}
        <div className="flex flex-wrap items-center gap-2">
          {documentStats.totalItems > 0 ? (
            <span className="inline-flex items-center space-x-1 text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {bilingual(
                  `${documentStats.totalItems} Dokumen Aktif (${documentStats.totalFiles} File, ${documentStats.totalLinks} Link)`,
                  `${documentStats.totalItems} 件登録済 (${documentStats.totalFiles} ファイル, ${documentStats.totalLinks} リンク)`
                )}
              </span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 italic">
              {bilingual('Belum ada dokumen terunggah', '登録済み書類はありません')}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-6">
        {/* 9 Standard Documents */}
        {CANDIDATE_DOCUMENT_ITEMS.map((item) => {
          const val = getDocValue(item.key, item.aliases);
          const hasContent = !!val;
          const fileName = getDocFileName(item.key, item.aliases);
          const fileSizeStr = getDocFileSizeStr(item.key, item.aliases);
          const storedLink = getDocLink(item.key, item.aliases);
          const isDataUrl = val.startsWith('data:');
          const isWebUrl = val.startsWith('http://') || val.startsWith('https://') || val.includes('drive.google.com') || val.includes('docs.google.com');

          // Determine what to display in the text input
          const inputDisplayValue = isWebUrl ? val : (storedLink || '');
          const displayedLabel = bilingual(item.label, item.labelJa || item.label);

          return (
            <React.Fragment key={item.key}>
              {/* Special Amber Banner before Video Jikoshoukai matching image */}
              {item.isSpecialBannerBefore && (
                <div className="bg-[#FEF9EE] border border-[#FDE68A] rounded-lg px-4 py-3 flex items-center space-x-2.5 my-2 shadow-2xs">
                  <div className="text-[#D97706] shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <p className="text-[#92400E] font-bold text-xs sm:text-[13px] tracking-wide uppercase">
                    {bilingual(
                      'UPLOAD VIDEO JIKOSHOUKAI : BERDURASI 1 MENIT SAMPAI 2 MENIT',
                      '自己紹介動画アップロード : 1分〜2分程度で収録'
                    )}
                  </p>
                </div>
              )}

              {/* Document Row Item */}
              <div className="space-y-1.5 p-3 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-colors bg-white">
                {/* Item Label & Status Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <label className="block text-xs sm:text-[13px] font-bold text-slate-800">
                      {displayedLabel}
                    </label>
                  </div>

                  {/* Status Indicator if content is available */}
                  {hasContent && (
                    <div className="flex items-center space-x-1.5">
                      {isDataUrl || fileName ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{bilingual('File Terunggah', 'ファイル登録済')}</span>
                        </span>
                      ) : null}

                      {isWebUrl || storedLink ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          <LinkIcon className="w-3 h-3 text-sky-600" />
                          <span>{bilingual('Link Terlampir', 'リンク登録済')}</span>
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Upload Button + View File Button + External Link Button Group */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {!readOnly && (
                    <label className="inline-flex items-center justify-center bg-[#1E60F0] hover:bg-[#1850CA] active:bg-[#1342AC] text-white font-semibold text-xs px-3.5 py-1.5 rounded-md shadow-2xs cursor-pointer transition-colors duration-150 select-none">
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      <span>
                        {hasContent && (isDataUrl || fileName)
                          ? bilingual('Ganti File', 'ファイル変更')
                          : bilingual('Upload File', 'ファイル選択')}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="*"
                        onChange={(e) => handleFileUpload(item.key, e)}
                        ref={(el) => { if (el) fileInputRefs.current[item.key] = el; }}
                      />
                    </label>
                  )}

                  {/* View File Button (Interactive in-app preview modal) */}
                  {hasContent && (
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(item.key, displayedLabel, item.aliases)}
                      className="inline-flex items-center space-x-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 font-semibold text-xs px-3 py-1.5 rounded-md transition shadow-2xs cursor-pointer"
                      title={bilingual('Klik untuk melihat isi file dokumen secara langsung', 'ファイル内容をプレビュー表示')}
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-600" />
                      <span>{bilingual('View File', '書類プレビュー')}</span>
                    </button>
                  )}

                  {/* Direct Buka Link Button if URL is available */}
                  {(isWebUrl || storedLink) && (
                    <a
                      href={isWebUrl ? val : storedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium text-xs px-2.5 py-1.5 rounded-md transition cursor-pointer"
                      title={bilingual('Buka tautan link di tab baru', '別タブでリンクを開く')}
                    >
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                      <span className="hidden sm:inline">{bilingual('Buka Link', 'リンクを開く')}</span>
                    </a>
                  )}

                  {/* Clear / Delete Button if hasContent and editable */}
                  {hasContent && !readOnly && (
                    <button
                      type="button"
                      onClick={() => handleClearDoc(item.key, item.aliases)}
                      className="inline-flex items-center text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition ml-auto"
                      title={bilingual('Hapus file / tautan dokumen ini', 'この書類を削除')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Show File Name & Size badge if uploaded file exists */}
                {(fileName || isDataUrl) && (
                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 rounded px-2.5 py-1 text-[11px] text-slate-600">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono font-medium truncate max-w-sm text-slate-800">
                      {fileName || bilingual('Dokumen File Terunggah', '登録済みファイル')}
                    </span>
                    {fileSizeStr && (
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono shrink-0">
                        {fileSizeStr}
                      </span>
                    )}
                  </div>
                )}

                {/* Input Text Box matching image */}
                <div className="pt-0.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={inputDisplayValue}
                      onChange={(e) => handleUrlChange(item.key, e.target.value, item.aliases)}
                      placeholder={
                        bilingual(
                          item.placeholder || 'Atau paste URL Google Drive di sini...',
                          'またはGoogleドライブ/クラウドURLを入力...'
                        )
                      }
                      disabled={readOnly}
                      className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-md px-3 py-1.5 text-xs sm:text-[13px] font-sans focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    {inputDisplayValue && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-100 px-1 rounded pointer-events-none">
                        URL Link
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* SECTION: Dokumen Pendukung Lainnya yang Tersimpan Sebelumnya */}
        {legacyAndExtraDocs.length > 0 && (
          <div className="pt-4 border-t border-slate-200/80 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-start space-x-3">
              <div className="p-1 bg-indigo-100 text-indigo-700 rounded-md mt-0.5">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <span>{bilingual('Dokumen Pendukung Lainnya yang Tersimpan', 'その他保管中の添付書類')}</span>
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {bilingual(`${legacyAndExtraDocs.length} Berkas`, `${legacyAndExtraDocs.length} 件`)}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {bilingual(
                    'Dokumen sebelumnya (KTP, Kartu Keluarga, Ijazah, SKCK, Paspor, SIM, Transkrip, dsb.) tetap tersimpan aman dan dapat ditinjau atau diperbarui kapan saja.',
                    '本人確認書類、家族証明書、卒業証書、無犯罪証明書、パスポート、運転免許証などの追加書類も安全に保管されており、いつでも閲覧・更新できます。'
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {legacyAndExtraDocs.map((doc) => {
                const hasContent = !!doc.value;
                const fileName = doc.fileName;
                const isDataUrl = doc.value.startsWith('data:');
                const isWebUrl = doc.value.startsWith('http://') || doc.value.startsWith('https://') || doc.value.includes('drive.google.com');
                const inputVal = isWebUrl ? doc.value : (doc.link || '');
                const displayedDocLabel = bilingual(doc.label, KNOWN_LEGACY_LABELS_JA[doc.key] || doc.label);

                return (
                  <div key={doc.key} className="space-y-1.5 p-3 rounded-xl border border-slate-200/70 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <label className="block text-xs sm:text-[13px] font-bold text-slate-800">
                          {displayedDocLabel}
                        </label>
                        <span className="text-[10px] font-mono text-slate-400">({doc.key})</span>
                      </div>

                      {hasContent && (
                        <div className="flex items-center space-x-1.5">
                          {isDataUrl || fileName ? (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{bilingual('File Terunggah', 'ファイル登録済')}</span>
                            </span>
                          ) : null}

                          {isWebUrl || doc.link ? (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                              <LinkIcon className="w-3 h-3 text-sky-600" />
                              <span>{bilingual('Link Terlampir', 'リンク登録済')}</span>
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {!readOnly && (
                        <label className="inline-flex items-center justify-center bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white font-semibold text-xs px-3 py-1.5 rounded-md shadow-2xs cursor-pointer transition select-none">
                          <Upload className="w-3 h-3 mr-1" />
                          <span>{bilingual('Ganti File', 'ファイル変更')}</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="*"
                            onChange={(e) => handleFileUpload(doc.key, e)}
                            ref={(el) => { if (el) fileInputRefs.current[doc.key] = el; }}
                          />
                        </label>
                      )}

                      {hasContent && (
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(doc.key, displayedDocLabel)}
                          className="inline-flex items-center space-x-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 font-semibold text-xs px-3 py-1.5 rounded-md transition shadow-2xs cursor-pointer"
                          title={bilingual('Klik untuk melihat isi file dokumen', 'ファイル内容をプレビュー表示')}
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-600" />
                          <span>{bilingual('View File', '書類プレビュー')}</span>
                        </button>
                      )}

                      {(isWebUrl || doc.link) && (
                        <a
                          href={isWebUrl ? doc.value : doc.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium text-xs px-2.5 py-1.5 rounded-md transition cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                          <span className="hidden sm:inline">{bilingual('Buka Link', 'リンクを開く')}</span>
                        </a>
                      )}

                      {hasContent && !readOnly && (
                        <button
                          type="button"
                          onClick={() => handleClearDoc(doc.key)}
                          className="inline-flex items-center text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition ml-auto"
                          title={bilingual('Hapus file / tautan ini', 'この書類を削除')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {(fileName || isDataUrl) && (
                      <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded px-2.5 py-1 text-[11px] text-slate-600">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono font-medium truncate max-w-sm text-slate-800">
                          {fileName || bilingual('Dokumen File Terunggah', '登録済みファイル')}
                        </span>
                        {doc.fileSizeStr && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono shrink-0">
                            {doc.fileSizeStr}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="pt-0.5">
                      <input
                        type="text"
                        value={inputVal}
                        onChange={(e) => handleUrlChange(doc.key, e.target.value)}
                        placeholder={
                          bilingual(
                            'Atau paste URL Google Drive / Link Dokumen di sini...',
                            'またはGoogleドライブ/クラウドURLを入力...'
                          )
                        }
                        disabled={readOnly}
                        className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-md px-3 py-1.5 text-xs sm:text-[13px] font-sans focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Custom Document Button */}
        {!readOnly && (
          <div className="pt-2">
            {!showAddCustomDoc ? (
              <button
                type="button"
                onClick={() => setShowAddCustomDoc(true)}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3.5 py-2 rounded-lg border border-blue-200 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {bilingual(
                    '+ Lampirkan Dokumen Pendukung Lain (KTP, KK, Ijazah, Paspor, SKCK, dll)',
                    '+ 追加書類を添付 (身分証、家族証明書、卒業証明書、パスポート、無犯罪証明書等)'
                  )}
                </span>
              </button>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {bilingual('Pilih Jenis Dokumen Pendukung Tambahan:', '追加する添付書類の種類を選択:')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomDoc(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    {bilingual('Batal', 'キャンセル')}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={customDocKey}
                    onChange={(e) => {
                      setCustomDocKey(e.target.value);
                      if (e.target.value !== 'custom') {
                        setCustomDocLabel(
                          bilingual(
                            KNOWN_LEGACY_LABELS[e.target.value] || '',
                            KNOWN_LEGACY_LABELS_JA[e.target.value] || ''
                          )
                        );
                      }
                    }}
                    className="bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ktpSiswa">{bilingual('KTP Calon Siswa', '本人身分証明書 (KTP)')}</option>
                    <option value="ktpOrangTua">{bilingual('KTP Orang Tua / Wali', '保護者身分証明書')}</option>
                    <option value="kartuKeluarga">{bilingual('Kartu Keluarga (KK)', '家族登録証明書 (KK)')}</option>
                    <option value="ijazah">{bilingual('Ijazah Terakhir', '最終学歴卒業証明書')}</option>
                    <option value="skck">{bilingual('SKCK (Kepolisian)', '無犯罪証明書 (SKCK)')}</option>
                    <option value="paspor">{bilingual('Buku Paspor', 'パスポート原本')}</option>
                    <option value="dokumenSim">{bilingual('SIM (Surat Izin Mengemudi)', '運転免許証 (SIM)')}</option>
                    <option value="sertifikatSelesaiMagang">{bilingual('Sertifikat Selesai Magang (JITCO/OTIT)', '技能実習修了証明書 (JITCO/OTIT)')}</option>
                    <option value="sertifikatSenmonkyuu">{bilingual('Sertifikat Senmonkyuu', '専門級合格証明書')}</option>
                    <option value="transkripNilai">{bilingual('Transkrip Nilai Akademik', '学業成績証明書')}</option>
                    <option value="hasilMcu">{bilingual('Hasil Medical Check Up (MCU)', '健康診断結果 (MCU)')}</option>
                    <option value="custom">{bilingual('Ketik Nama Dokumen Lainnya...', 'その他の書類名を入力...')}</option>
                  </select>

                  {customDocKey === 'custom' && (
                    <input
                      type="text"
                      value={customDocLabel}
                      onChange={(e) => setCustomDocLabel(e.target.value)}
                      placeholder={bilingual('Masukkan nama berkas (contoh: Portofolio)', '書類名を入力 (例: ポートフォリオ)')}
                      className="bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddCustomDocument}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-xs"
                  >
                    {bilingual('Tambahkan Kolom Dokumen', '書類欄を追加')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Optional Save Bar */}
        {showSaveButton && onSave && (
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onSave}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{bilingual('Simpan Dokumen', '書類を保存')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Universal File Viewer Modal */}
      <FilePreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
        title={previewModal.title}
        fileUrl={previewModal.fileUrl}
        fileName={previewModal.fileName}
        candidateName={candidateName}
      />
    </div>
  );
};
