import React from 'react';
import { JobPosting } from '../../types';
import {
  getSanitizedCompany,
  getSanitizedJobTitle,
  formatPrefecture,
  translateCandidateCategory,
  translateFacilityText,
  translateFeeText,
  translateNotesText,
  formatQualification
} from '../../utils/mitraJobUtils';
import {
  Briefcase,
  Building2,
  MapPin,
  Banknote,
  Users,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Home,
  Info,
  DollarSign,
  Globe,
  FileCheck
} from 'lucide-react';

interface JobDescriptionCategorizedViewProps {
  job: Partial<JobPosting> | null | undefined;
  rawDescription?: string;
  lang?: 'id' | 'ja';
  compact?: boolean;
  isMitraView?: boolean;
  isStudentView?: boolean;
  isAdminView?: boolean;
  hidePosisiJob?: boolean;
}

export const JobDescriptionCategorizedView: React.FC<JobDescriptionCategorizedViewProps> = ({
  job,
  rawDescription,
  lang = 'id',
  compact = false,
  isMitraView = false,
  isStudentView = false,
  isAdminView = false,
  hidePosisiJob = false
}) => {
  const targetLang: 'id' | 'ja' = lang === 'ja' ? 'ja' : 'id';
  const descText = rawDescription || job?.deskripsiPekerjaan || '';

  // Parse structured description text if present
  const parseDescription = (text: string) => {
    if (!text) return null;

    // Clean invisible unicode characters like \u2060
    const cleanText = text.replace(/[\u2060\u200B\uFEFF]/g, '');

    const sections: {
      details: Array<{ label: string; value: string }>;
      kualifikasi: string[];
      fasilitas: string[];
      biaya: string[];
      keterangan: string[];
      otherText: string[];
    } = {
      details: [],
      kualifikasi: [],
      fasilitas: [],
      biaya: [],
      keterangan: [],
      otherText: []
    };

    // Check if contains structured tags
    const hasStructuredTags =
      text.includes('DETAIL LOWONGAN') ||
      text.includes('KUALIFIKASI') ||
      text.includes('FASILITAS') ||
      text.includes('BIAYA PROSES') ||
      text.includes('KETERANGAN');

    if (hasStructuredTags) {
      // Split into lines or chunks
      const lines = cleanText.split('\n');
      let currentSection: 'none' | 'detail' | 'kualifikasi' | 'fasilitas' | 'biaya' | 'keterangan' = 'none';

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.includes('DETAIL LOWONGAN')) {
          currentSection = 'detail';
          // Also check if there are bullet items in the same line
          const parts = trimmed.split('•');
          parts.forEach((p, idx) => {
            if (idx === 0) return;
            const sub = p.trim();
            const colonIdx = sub.indexOf(':');
            if (colonIdx > -1) {
              const lbl = sub.substring(0, colonIdx).trim();
              const val = sub.substring(colonIdx + 1).trim();
              if (lbl && val && val !== '0' && val !== '-') {
                sections.details.push({ label: lbl, value: val });
              }
            }
          });
          return;
        }

        if (trimmed.includes('KUALIFIKASI & PERSYARATAN') || trimmed.includes('KUALIFIKASI:')) {
          currentSection = 'kualifikasi';
          const afterColon = trimmed.split(/KUALIFIKASI.*?:/)[1]?.trim();
          if (afterColon && afterColon !== '-' && afterColon !== '0') {
            sections.kualifikasi.push(afterColon);
          }
          return;
        }

        if (trimmed.includes('BIAYA PROSES & TANGGUNGAN') || trimmed.includes('BIAYA:')) {
          currentSection = 'biaya';
          const afterColon = trimmed.split(/BIAYA.*?:/)[1]?.trim();
          if (afterColon && afterColon !== '-' && afterColon !== '0') {
            sections.biaya.push(afterColon);
          }
          return;
        }

        if (trimmed.includes('FASILITAS & ASRAMA') || trimmed.includes('FASILITAS:')) {
          currentSection = 'fasilitas';
          const afterColon = trimmed.split(/FASILITAS.*?:/)[1]?.trim();
          if (afterColon && afterColon !== '-' && afterColon !== '0') {
            sections.fasilitas.push(afterColon);
          }
          return;
        }

        if (trimmed.includes('KETERANGAN TAMBAHAN') || trimmed.includes('KETERANGAN:')) {
          currentSection = 'keterangan';
          const afterColon = trimmed.split(/KETERANGAN.*?:/)[1]?.trim();
          if (afterColon && afterColon !== '-' && afterColon !== '0') {
            sections.keterangan.push(afterColon);
          }
          return;
        }

        // Parse lines under current section
        if (currentSection === 'detail') {
          if (trimmed.startsWith('•')) {
            const sub = trimmed.replace(/^•\s*/, '');
            const colonIdx = sub.indexOf(':');
            if (colonIdx > -1) {
              const lbl = sub.substring(0, colonIdx).trim();
              const val = sub.substring(colonIdx + 1).trim();
              if (lbl && val && val !== '0' && val !== '-') {
                sections.details.push({ label: lbl, value: val });
              }
            }
          }
        } else if (currentSection === 'kualifikasi') {
          if (trimmed !== '-' && trimmed !== '0') {
            sections.kualifikasi.push(trimmed.replace(/^[•\-\*]\s*/, ''));
          }
        } else if (currentSection === 'fasilitas') {
          if (trimmed !== '-' && trimmed !== '0') {
            sections.fasilitas.push(trimmed.replace(/^[•\-\*]\s*/, ''));
          }
        } else if (currentSection === 'biaya') {
          if (trimmed !== '-' && trimmed !== '0') {
            sections.biaya.push(trimmed.replace(/^[•\-\*]\s*/, ''));
          }
        } else if (currentSection === 'keterangan') {
          if (trimmed !== '-' && trimmed !== '0') {
            sections.keterangan.push(trimmed.replace(/^[•\-\*]\s*/, ''));
          }
        } else {
          sections.otherText.push(trimmed);
        }
      });
    } else if (cleanText.includes('•') || cleanText.includes('Kualifikasi:') || cleanText.includes('Persyaratan :')) {
      // Bulleted list format
      const lines = cleanText.split('\n');
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.startsWith('Posisi ') || trimmed.startsWith('Job ')) {
          sections.details.push({ label: lang === 'ja' ? '職種・ポジション' : 'Posisi Pekerjaan', value: trimmed });
        } else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          sections.kualifikasi.push(trimmed.replace(/^[•\-\*]\s*/, ''));
        } else if (trimmed.includes('Keterangan:')) {
          const notes = trimmed.split('Keterangan:')[1]?.trim();
          if (notes && notes !== '-' && notes !== '0') {
            sections.keterangan.push(notes);
          }
        } else {
          sections.otherText.push(trimmed);
        }
      });
    } else {
      sections.otherText.push(cleanText);
    }

    return sections;
  };

  const parsed = parseDescription(descText);

  // Fallback / merged elements
  const kualifikasiList = [
    ...(parsed?.kualifikasi || []),
    ...(job?.kualifikasi && !descText.includes(job.kualifikasi) ? [job.kualifikasi] : [])
  ].filter(Boolean);

  const fasilitasList = [
    ...(parsed?.fasilitas || []),
    ...(job?.fasilitasAsrama && !descText.includes(job.fasilitasAsrama) ? [job.fasilitasAsrama] : [])
  ].filter(Boolean);

  const biayaList = [
    ...(parsed?.biaya || []),
    ...(job?.biayaProses && !descText.includes(job.biayaProses) && job.biayaProses !== '-' ? [job.biayaProses] : [])
  ].filter(Boolean);

  const keteranganList = [
    ...(parsed?.keterangan || []),
    ...(job?.keteranganTambahan && !descText.includes(job.keteranganTambahan) && job.keteranganTambahan !== '-' ? [job.keteranganTambahan] : [])
  ].filter(Boolean);

  // Sanitize Kode Job (avoid lone "0" or invalid values)
  const displayKodeJob =
    job?.kodeJob && job.kodeJob !== '0' && job.kodeJob !== '-'
      ? job.kodeJob
      : job?.id && job.id !== '0'
      ? `JOB-${job.id}`
      : null;

  // Sanitize Gender (avoid "0" or "-" or missing, format cleanly)
  const rawGender = (job?.jenisKelamin || '').trim();
  const cleanGenderDisplay = (() => {
    if (!rawGender || rawGender === '0' || rawGender === '-' || rawGender.toLowerCase().includes('bebas')) {
      return lang === 'ja' ? '不問（男女問わず）' : 'Laki-laki / Perempuan (Semua Gender)';
    }
    if (rawGender.toLowerCase().includes('laki') || rawGender.includes('男') || rawGender.toLowerCase().includes('pria')) {
      if (rawGender.toLowerCase().includes('perempuan') || rawGender.toLowerCase().includes('wanita') || rawGender.includes('女')) {
        return lang === 'ja' ? '不問（男女問わず）' : 'Laki-laki / Perempuan (Semua Gender)';
      }
      return lang === 'ja' ? '男性' : 'Laki-laki (男)';
    }
    if (rawGender.toLowerCase().includes('perempuan') || rawGender.toLowerCase().includes('wanita') || rawGender.includes('女')) {
      return lang === 'ja' ? '女性' : 'Perempuan (女)';
    }
    return rawGender;
  })();

  // Sanitize Standard Salary
  const cleanSalaryDisplay = (() => {
    const salaryItem = parsed?.details?.find((d) =>
      ['standar gaji', 'gaji', 'salary', '給与'].some((k) => d.label.toLowerCase().includes(k))
    );
    let raw = (salaryItem?.value || job?.gajiString || '').trim();
    // Clean leading single-letter prefixes like "P (± Rp 21.000.000)" or "0 (± Rp ...)"
    raw = raw.replace(/^[A-Za-z0-9]\s*\((±\s*Rp)/i, '$1');
    raw = raw.replace(/^P\s+/i, '');
    if (!raw || raw === '-' || raw === '0') {
      if (job?.gajiBulananYen && Number(job.gajiBulananYen) > 0) {
        const yenFormatted = Number(job.gajiBulananYen).toLocaleString('ja-JP');
        const idrFormatted = (job.gajiEstimasiIdr || Math.round(Number(job.gajiBulananYen) * 105)).toLocaleString('id-ID');
        return lang === 'ja'
          ? `月額 ${yenFormatted} 円 (約 Rp ${idrFormatted})`
          : `${yenFormatted} yen/bulan (± Rp ${idrFormatted})`;
      }
      return lang === 'ja' ? '200,000 円 / 月 (規定による)' : 'Sesuai Standar UMR Jepang (± Rp 21 Juta)';
    }
    if (lang === 'ja') {
      return raw.replace(/yen/gi, '円').replace(/bulan/gi, '月');
    }
    return raw;
  })();

  // Posisi / List Job is shown in Admin view, but hidden in Mitra and Student/Siswa view
  const isExternalPortal = isMitraView || isStudentView || hidePosisiJob;
  const shouldShowPosisi = isAdminView || !isExternalPortal;

  // Posisi / List Job for Admin View
  const cleanPosisiDisplay = (() => {
    // Check if parsed details had explicit 'posisi' or 'list job'
    const detailItem = parsed?.details?.find((d) =>
      ['posisi / list job', 'posisi', 'list job', 'posisi pekerjaan', '職種'].some((ex) =>
        d.label.toLowerCase().includes(ex)
      )
    );
    const detailVal = detailItem?.value?.trim();
    if (detailVal && detailVal !== '0' && detailVal !== '-' && !/^(yurinoki|lpk|onodera|aqnesia|hsi|tsk)/i.test(detailVal)) {
      return detailVal;
    }
    if (job?.posisiPekerjaan && job.posisiPekerjaan.trim() !== '' && job.posisiPekerjaan !== '0' && job.posisiPekerjaan !== '-') {
      return job.posisiPekerjaan;
    }
    if (job?.judulPekerjaan && job.judulPekerjaan.trim() !== '' && job.judulPekerjaan !== '0' && job.judulPekerjaan !== '-') {
      return job.judulPekerjaan;
    }
    if (detailVal && detailVal !== '0' && detailVal !== '-') {
      return detailVal;
    }
    return getSanitizedJobTitle(job || {}, targetLang);
  })();

  // Partner TSK / Sumber for Admin View
  const partnerTskDisplay = (() => {
    const tskItem = parsed?.details?.find((d) =>
      ['partner tsk', 'tsk', 'sumber', 'partner tsk / sumber', 'kumiai'].some((ex) =>
        d.label.toLowerCase().includes(ex)
      )
    );
    const raw = (tskItem?.value || (job as any)?.tskSumberJob || (job as any)?.kumiaiRujukan || '').trim();
    return raw && raw !== '0' && raw !== '-' ? raw : null;
  })();

  return (
    <div className="space-y-3.5 text-xs text-slate-800">
      {/* 1. Detail & Spesifikasi Penempatan */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex items-center space-x-1.5 text-slate-900 font-black text-xs uppercase font-mono tracking-wider">
          <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>{lang === 'ja' ? '求人詳細・配置仕様' : 'Detail & Spesifikasi Penempatan'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {displayKodeJob && (
            <div className="flex items-start justify-between bg-white p-2 rounded-lg border border-slate-200/80">
              <span className="text-slate-500 font-medium">{lang === 'ja' ? '求人コード:' : 'Kode Job:'}</span>
              <span className="font-mono font-black text-slate-900">{displayKodeJob}</span>
            </div>
          )}

          {job?.kategoriTarget && (
            <div className="flex items-start justify-between bg-white p-2 rounded-lg border border-slate-200/80">
              <span className="text-slate-500 font-medium">{lang === 'ja' ? '対象区分:' : 'Kategori Target:'}</span>
              <span className="font-bold text-indigo-700 text-right">{translateCandidateCategory(job.kategoriTarget, targetLang)}</span>
            </div>
          )}

          <div className="flex items-start justify-between bg-white p-2 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 font-medium">{lang === 'ja' ? '勤務地（都道府県）:' : 'Lokasi / Prefektur:'}</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
              <span>{formatPrefecture(job?.lokasiPrefektur, targetLang)}</span>
            </span>
          </div>

          <div className="flex items-start justify-between bg-white p-2 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 font-medium">{lang === 'ja' ? '募集性別:' : 'Target Gender:'}</span>
            <span className="font-bold text-slate-900">{cleanGenderDisplay}</span>
          </div>

          {job?.kuotaSiswa !== undefined && (
            <div className="flex items-start justify-between bg-white p-2 rounded-lg border border-slate-200/80">
              <span className="text-slate-500 font-medium">{lang === 'ja' ? '採用枠 / 募集人数:' : 'Kuota Penerimaan:'}</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {job.kuotaSiswa || 1} {lang === 'ja' ? '名' : 'Kandidat'}
              </span>
            </div>
          )}

          <div className="flex items-start justify-between gap-2 bg-white p-2 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 font-medium shrink-0">{lang === 'ja' ? '受入企業:' : 'Perusahaan Jepang:'}</span>
            <span className="font-bold text-slate-800 text-right break-words leading-tight" title={getSanitizedCompany(job || {}, targetLang)}>
              {getSanitizedCompany(job || {}, targetLang)}
            </span>
          </div>

          {/* Posisi / List Job - Displayed in Admin View, Hidden in Mitra & Student/Siswa Views */}
          {shouldShowPosisi && (
            <div className="flex items-start justify-between gap-2 bg-white p-2 rounded-lg border border-slate-200/80">
              <span className="text-slate-500 font-medium shrink-0">
                {lang === 'ja' ? '職種 / ポジション:' : 'Posisi / List Job:'}
              </span>
              <span className="font-bold text-slate-900 text-right break-words">
                {cleanPosisiDisplay}
              </span>
            </div>
          )}

          {/* Standar Gaji */}
          <div className="flex items-start justify-between gap-2 bg-white p-2 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 font-medium shrink-0">{lang === 'ja' ? '給与・手当水準:' : 'Standar Gaji:'}</span>
            <span className="font-bold text-slate-900 text-right break-words">{cleanSalaryDisplay}</span>
          </div>

          {/* Partner TSK / Sumber - Only in Admin View */}
          {isAdminView && partnerTskDisplay && (
            <div className="flex items-start justify-between gap-2 bg-white p-2 rounded-lg border border-slate-200/80">
              <span className="text-slate-500 font-medium shrink-0">
                {lang === 'ja' ? '取次監理・TSK:' : 'Partner TSK / Sumber:'}
              </span>
              <span className="font-bold text-slate-900 text-right break-words">
                {partnerTskDisplay}
              </span>
            </div>
          )}

          {parsed?.details &&
            parsed.details
              .filter((d) => {
                const lbl = d.label.toLowerCase().trim();
                // 1. Exclude Posisi / List Job (already handled above)
                if (
                  lbl.includes('posisi') ||
                  lbl.includes('list job') ||
                  lbl.includes('judul job') ||
                  lbl.includes('nama job') ||
                  lbl.includes('job title') ||
                  lbl.includes('職種')
                ) {
                  return false;
                }
                // 2. Exclude standard fields already displayed in dedicated grid cards
                if (
                  [
                    'kode job',
                    'kategori target',
                    'lokasi / prefektur',
                    'lokasi',
                    'prefektur',
                    'target gender',
                    'gender',
                    'jenis kelamin',
                    'kuota penerimaan',
                    'kuota',
                    'perusahaan / sumber',
                    'perusahaan',
                    'standar gaji',
                    'gaji',
                    'salary',
                    '給与',
                    'partner tsk',
                    'tsk',
                    'sumber',
                    'kumiai'
                  ].some((ex) => lbl.includes(ex))
                ) {
                  return false;
                }
                // 3. For Mitra view or Student view, also hide internal TSK / partner source fields
                if (isExternalPortal && (lbl.includes('partner') || lbl.includes('tsk') || lbl.includes('sumber') || lbl.includes('kumiai'))) {
                  return false;
                }
                // 4. Exclude empty or "0" or "-"
                if (!d.value || d.value === '0' || d.value === '-') {
                  return false;
                }
                return true;
              })
              .map((d, i) => {
                const cleanValue = d.value
                  .replace(/Mitra Perusahaan Jepang\s*\([^)]*kumiai[^)]*\)/gi, 'Mitra Perusahaan Jepang (TSK Partner)')
                  .replace(/\(kumiai partner\)/gi, '(TSK Partner)')
                  .replace(/kumiai partner/gi, 'TSK Partner');
                return (
                  <div key={i} className="flex items-start justify-between bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-slate-500 font-medium">{d.label}:</span>
                    <span className="font-bold text-slate-900 text-right break-words">{cleanValue}</span>
                  </div>
                );
              })}
        </div>
      </div>

      {/* 2. Kualifikasi & Persyaratan */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
        <div className="flex items-center space-x-1.5 text-slate-900 font-bold text-xs uppercase font-mono tracking-wider">
          <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{lang === 'ja' ? '応募要件・必要資格' : 'Kualifikasi & Persyaratan Teknis'}</span>
        </div>

        {kualifikasiList.length > 0 ? (
          <ul className="space-y-1.5 pl-1">
            {kualifikasiList.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700 leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{formatQualification(item, targetLang)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            {formatQualification(job?.persyaratanJLPT, targetLang)}
          </p>
        )}
      </div>

      {/* 3. Fasilitas & Tunjangan */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
        <div className="flex items-center space-x-1.5 text-slate-900 font-bold text-xs uppercase font-mono tracking-wider">
          <Home className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{lang === 'ja' ? '福利厚生・寮・保険' : 'Fasilitas & Tunjangan Kerja'}</span>
        </div>

        <div className="text-xs text-slate-700 leading-relaxed bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/70">
          {fasilitasList.length > 0 ? (
            <div className="space-y-1">
              {fasilitasList.map((fas, i) => (
                <div key={i} className="flex items-start space-x-1.5">
                  <span className="text-amber-700 font-bold">✓</span>
                  <span>{translateFacilityText(fas, targetLang)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>
              {translateFacilityText('', targetLang)}
            </p>
          )}
        </div>
      </div>

      {/* 4. Biaya Proses & Skema Pembiayaan (Jika Ada) */}
      {biayaList.length > 0 && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center space-x-1.5 text-slate-900 font-bold text-xs uppercase font-mono tracking-wider">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{lang === 'ja' ? '渡航・手続き費用スキーム' : 'Biaya Proses & Tanggungan'}</span>
          </div>

          <div className="text-xs text-emerald-900 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 font-medium space-y-1">
            {biayaList.map((b, i) => (
              <div key={i}>{translateFeeText(b, targetLang)}</div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Keterangan Tambahan (Jika Ada) */}
      {(keteranganList.length > 0 || (parsed?.otherText && parsed.otherText.length > 0)) && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center space-x-1.5 text-slate-900 font-bold text-xs uppercase font-mono tracking-wider">
            <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>{lang === 'ja' ? '特記事項・補足説明' : 'Keterangan Tambahan & Catatan Khusus'}</span>
          </div>

          <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 leading-relaxed">
            {keteranganList.map((k, i) => (
              <p key={i}>• {translateNotesText(k, targetLang)}</p>
            ))}
            {parsed?.otherText &&
              parsed.otherText
                .filter((t) => !keteranganList.includes(t))
                .map((t, i) => (
                  <p key={i}>{translateNotesText(t, targetLang)}</p>
                ))}
          </div>
        </div>
      )}
    </div>
  );
};
