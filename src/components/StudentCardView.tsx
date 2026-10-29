import React, { useState } from 'react';
import { CalonSiswa, HasilKesehatan, AsesmenDisc, AsesmenPsikotes, AplikasiDukunganDana, SuratPerjanjian, CVRirekisho, JobApplication } from '../types';
import { getStudentPhotoUrl } from '../utils/studentPhotoHelper';
import { translateCandidateCategory } from '../utils/mitraJobUtils';
import { isDummyStudent } from '../utils/studentSourceHelper';
import { getCandidateGender } from './cvportal/CandidateDashboardStatistics';
import { calculateAgeFromBirthDate } from '../utils/candidateUtils';
import {
  Eye,
  FileText,
  User,
  Edit2,
  Award,
  CheckCircle2,
  ShieldCheck,
  Database,
  Phone,
  Mail,
  Fingerprint
} from 'lucide-react';

interface StudentCardViewProps {
  students: CalonSiswa[];
  activeStudentId: string | null;
  onSelectStudent: (id: string) => void;
  onEditStudent: (student: CalonSiswa) => void;
  onOpenCvModal: (student: CalonSiswa, mode: 'JIKOSHOUKAI' | 'CV' | 'DOKUMEN') => void;
  onForwardStudent: (studentId: string) => void;
  healthRecords: Record<string, HasilKesehatan>;
  discRecords: Record<string, AsesmenDisc>;
  psikotesRecords: Record<string, AsesmenPsikotes>;
  financingRecords: Record<string, AplikasiDukunganDana>;
  contractRecords: Record<string, SuratPerjanjian>;
  rirekishoRecords: Record<string, CVRirekisho>;
  jobApplications?: JobApplication[];
  lang: 'id' | 'ja';
}

const StudentCardItem: React.FC<{
  student: CalonSiswa;
  idx: number;
  isSelected: boolean;
  isDummy: boolean;
  sHealth?: HasilKesehatan;
  sDisc?: AsesmenDisc;
  sPsikotes?: AsesmenPsikotes;
  sDana?: AplikasiDukunganDana;
  sKontrak?: SuratPerjanjian;
  rirekisho?: CVRirekisho;
  isForwarded: boolean;
  isOffline: boolean;
  danaLabel: string;
  danaColor: string;
  lang: 'id' | 'ja';
  onSelect: () => void;
  onEdit: () => void;
  onOpenCvModal: (mode: 'JIKOSHOUKAI' | 'CV' | 'DOKUMEN') => void;
  onForward: () => void;
}> = ({
  student,
  idx,
  isSelected,
  isDummy,
  sHealth,
  sDisc,
  sPsikotes,
  sKontrak,
  rirekisho,
  isForwarded,
  isOffline,
  danaLabel,
  danaColor,
  lang,
  onSelect,
  onEdit,
  onOpenCvModal,
  onForward
}) => {
  const [imgError, setImgError] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const rawPhoto = getStudentPhotoUrl(student, rirekisho);

  React.useEffect(() => {
    setImgError(false);
    setUseProxy(false);
  }, [student?.id, rirekisho?.id, rawPhoto]);

  const photoUrl = !imgError ? rawPhoto : '';
  const currentSrc = useProxy && photoUrl.startsWith('http') && !photoUrl.includes('/api/proxy-image')
    ? `/api/proxy-image?url=${encodeURIComponent(photoUrl)}`
    : photoUrl;
  const gender = getCandidateGender(student);

  return (
    <div
      onClick={onSelect}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer flex flex-col sm:flex-row items-stretch ${
        isSelected
          ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20 bg-gradient-to-br from-emerald-50/15 via-white to-white'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* Top Accent for Selected Student */}
      {isSelected && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 z-20" />
      )}

      {/* 1. Foto Full di Sebelah Kiri */}
      <div className="w-full sm:w-44 md:w-48 lg:w-52 shrink-0 relative bg-gradient-to-b from-slate-100 to-slate-200 flex flex-col items-center justify-center overflow-hidden border-b sm:border-b-0 sm:border-r border-slate-200 min-h-[220px] sm:min-h-full">
        {photoUrl ? (
          <div className="w-full h-full min-h-[220px] sm:min-h-full relative overflow-hidden group/photo">
            <img
              src={currentSrc}
              alt={student.namaLengkap}
              onError={() => {
                if (!useProxy && photoUrl.startsWith('http') && !photoUrl.includes('/api/proxy-image')) {
                  setUseProxy(true);
                } else {
                  setImgError(true);
                }
              }}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 absolute inset-0"
            />
            {/* Vignette Overlay for High Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/20 pointer-events-none" />

            {/* Bottom Metadata Badges on Photo */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-white font-medium z-10">
              <span className="bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] font-mono text-slate-200">
                4×6 JIS
              </span>
              <span className="bg-emerald-600/90 backdrop-blur-xs text-white px-1.5 py-0.5 rounded text-[9px] font-bold shadow-2xs">
                VERIFIED
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full min-h-[220px] sm:min-h-full flex flex-col items-center justify-center p-4 text-center space-y-2 bg-gradient-to-b from-slate-100 to-slate-200 text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-slate-200/90 flex items-center justify-center text-slate-400 border border-slate-300/80 shadow-2xs">
              <User className="w-8 h-8 text-slate-500" />
            </div>
            <div className="text-[11px] font-bold text-slate-600 font-mono">
              {lang === 'ja' ? '写真未登録' : 'Foto Belum Ada'}
            </div>
            <div className="text-[9px] text-slate-400">
              {lang === 'ja' ? '4×6cm JIS規格' : 'Pas Foto 4×6'}
            </div>
          </div>
        )}

        {/* Index Badge #{idx + 1} at top-left */}
        <div className="absolute top-2.5 left-2.5 font-mono text-[10px] font-bold bg-slate-900/90 text-white px-2 py-0.5 rounded-md shadow-xs z-10">
          #{idx + 1}
        </div>
      </div>

      {/* 2. Keterangan di Sebelah Kanan */}
      <div className="flex-1 p-4 flex flex-col justify-between space-y-3 min-w-0">
        <div className="space-y-2.5">
          {/* Header Row: Badges & Selected Indicator */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Data Source Badge */}
              {isDummy ? (
                <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                  <Database className="w-2.5 h-2.5 text-amber-600" />
                  <span>data dumi</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                  <span>{lang === 'ja' ? 'Firebase 本番データ' : 'Data Asli (Firebase)'}</span>
                </span>
              )}

              {/* Category Badge */}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isOffline
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}
              >
                {isOffline
                  ? lang === 'ja' ? 'IJEF 対面・合宿' : 'IJEF Offline'
                  : lang === 'ja' ? 'IJEF オンライン' : 'IJEF Online'}
              </span>

              {/* Gender Badge */}
              {gender === 'Laki-laki' ? (
                <span className="inline-flex items-center space-x-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <span>♂</span>
                  <span>{lang === 'ja' ? '男性' : 'Pria'}</span>
                </span>
              ) : gender === 'Perempuan' ? (
                <span className="inline-flex items-center space-x-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <span>♀</span>
                  <span>{lang === 'ja' ? '女性' : 'Wanita'}</span>
                </span>
              ) : null}
            </div>

            {isSelected && (
              <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 shadow-xs animate-pulse">
                {lang === 'ja' ? '選択中' : 'Siswa Terpilih'}
              </span>
            )}
          </div>

          {/* Student Name & NIK */}
          <div>
            <h3 className="text-base font-bold text-slate-900 truncate leading-snug group-hover:text-emerald-700 transition">
              {student.namaLengkap}
            </h3>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
              <Fingerprint className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">NIK: {student.noKtp || student.id}</span>
              {student.tanggalLahir && (
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-sans font-semibold text-[10px]">
                  {calculateAgeFromBirthDate(student.tanggalLahir, student.umur || 22)} {lang === 'ja' ? '歳' : 'Thn'}
                </span>
              )}
            </div>
          </div>

          {/* Contact Bar */}
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] text-slate-600 font-medium">
            <div className="flex items-center space-x-1.5 truncate">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{student.email || '-'}</span>
            </div>
            <div className="flex items-center space-x-1.5 truncate">
              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{student.noHp || '-'}</span>
            </div>
          </div>

          {/* 6 Modules Progress Mini Bento Grid */}
          <div className="space-y-1.5 pt-0.5">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>{lang === 'ja' ? '6モジュール進捗状況' : 'Progres 6 Modul Internal'}</span>
              {isForwarded ? (
                <span className="text-emerald-700 font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{lang === 'ja' ? 'Admin Doc 同期済' : 'Sync ADMIN 2'}</span>
                </span>
              ) : (
                <span className="text-amber-600 font-semibold">{lang === 'ja' ? '内部研修中' : 'Proses'}</span>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {/* Modul 1: MCU */}
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center space-y-0.5">
                <div className="text-[9px] text-slate-500 font-medium truncate">{lang === 'ja' ? '健診 (MCU)' : 'MCU Medis'}</div>
                <div className="text-[10px] font-bold truncate">
                  {sHealth ? (
                    <span className={sHealth.statusFit === 'FIT' ? 'text-emerald-700' : 'text-amber-700'}>
                      {sHealth.statusFit}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">{lang === 'ja' ? '未受検' : 'Belum'}</span>
                  )}
                </div>
              </div>

              {/* Modul 2: DISC */}
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center space-y-0.5">
                <div className="text-[9px] text-slate-500 font-medium truncate">DISC</div>
                <div className="text-[10px] font-bold text-purple-700 truncate font-mono">
                  {sDisc ? sDisc.dominantType : <span className="text-slate-400 italic">-</span>}
                </div>
              </div>

              {/* Modul 3: Psikotes */}
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center space-y-0.5">
                <div className="text-[9px] text-slate-500 font-medium truncate">{lang === 'ja' ? '適性テスト' : 'Psikotes'}</div>
                <div className="text-[10px] font-bold font-mono truncate">
                  {sPsikotes ? (
                    <span className={sPsikotes.statusKelulusan === 'LULUS' ? 'text-emerald-700' : 'text-rose-700'}>
                      {sPsikotes.scorePercentage}%
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">-</span>
                  )}
                </div>
              </div>

              {/* Modul 4: Dana Talang */}
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center space-y-0.5">
                <div className="text-[9px] text-slate-500 font-medium truncate">{lang === 'ja' ? '学費支援' : 'Dana Talang'}</div>
                <div className="text-[10px] font-bold truncate">
                  <span className={danaColor + ' px-1 py-0.2 rounded'}>{danaLabel}</span>
                </div>
              </div>

              {/* Modul 5: Kontrak SPK */}
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center space-y-0.5">
                <div className="text-[9px] text-slate-500 font-medium truncate">{lang === 'ja' ? '契約書' : 'Perjanjian'}</div>
                <div className="text-[10px] font-bold truncate">
                  {sKontrak ? (
                    <span className="text-emerald-700">SAH</span>
                  ) : (
                    <span className="text-slate-400 italic">{lang === 'ja' ? '下書き' : 'Draft'}</span>
                  )}
                </div>
              </div>

              {/* Modul 6: Admin 2 Status */}
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center space-y-0.5">
                <div className="text-[9px] text-slate-500 font-medium truncate">{lang === 'ja' ? 'Admin 2' : 'Admin Doc'}</div>
                <div className="text-[10px] font-bold truncate">
                  {isForwarded ? (
                    <span className="text-emerald-700">{lang === 'ja' ? '同期済' : 'Sync'}</span>
                  ) : (
                    <span className="text-amber-700">{lang === 'ja' ? '未修了' : 'Internal'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCvModal('CV');
              }}
              className="px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-sky-300 text-[10px] font-bold rounded-lg transition shadow-2xs flex items-center space-x-1 cursor-pointer"
              title={lang === 'ja' ? 'JIS規格履歴書プレビュー' : 'Pratinjau CV JIS'}
            >
              <Eye className="w-3 h-3" />
              <span>CV</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCvModal('DOKUMEN');
              }}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-300 text-[10px] font-bold rounded-lg transition shadow-2xs flex items-center space-x-1 cursor-pointer"
              title={lang === 'ja' ? '提出書類確認' : 'Lihat Dokumen'}
            >
              <FileText className="w-3 h-3" />
              <span>{lang === 'ja' ? '書類' : 'Dokumen'}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCvModal('JIKOSHOUKAI');
              }}
              className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-300 text-[10px] font-bold rounded-lg transition shadow-2xs flex items-center space-x-1 cursor-pointer"
              title={lang === 'ja' ? '自己紹介＆概要' : 'Jikoshoukai & Profile'}
            >
              <User className="w-3 h-3" />
              <span>{lang === 'ja' ? '自己紹介' : 'Jiko'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
                onEdit();
              }}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer shadow-2xs ${
                isSelected
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300'
              }`}
              title={lang === 'ja' ? '生徒データ・進捗編集' : 'Edit Data & Progres Siswa'}
            >
              <Edit2 className="w-3 h-3" />
              <span>{isSelected ? (lang === 'ja' ? '編集中' : 'Edit Data') : (lang === 'ja' ? '選択・編集' : 'Pilih & Edit')}</span>
            </button>

            {!isForwarded && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onForward();
                }}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold rounded-lg transition shadow-2xs flex items-center space-x-1 cursor-pointer"
                title={lang === 'ja' ? '修了認定して Admin Doc に同期' : 'Luluskan siswa & Sync ke Admin Doc'}
              >
                <Award className="w-3 h-3" />
                <span>{lang === 'ja' ? '修了' : 'Lulus'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const StudentCardView: React.FC<StudentCardViewProps> = ({
  students,
  activeStudentId,
  onSelectStudent,
  onEditStudent,
  onOpenCvModal,
  onForwardStudent,
  healthRecords,
  discRecords,
  psikotesRecords,
  financingRecords,
  contractRecords,
  rirekishoRecords,
  lang
}) => {
  if (students.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <Database className="w-12 h-12 text-slate-300 mx-auto" />
        <h4 className="text-sm font-bold text-slate-800">
          {lang === 'ja' ? '該当する生徒データがありません' : 'Tidak Ada Siswa Ditemukan'}
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {lang === 'ja'
            ? '検索条件やフィルターを変更して再度お試しください。'
            : 'Silakan sesuaikan kata kunci pencarian atau filter kategori di atas.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {students.map((student, idx) => {
        const isSelected = student.id === activeStudentId;
        const isDummy = isDummyStudent(student);
        const sHealth = healthRecords[student.id];
        const sDisc = discRecords[student.id];
        const sPsikotes = psikotesRecords[student.id];
        const sDana = financingRecords[student.id];
        const sKontrak = contractRecords[student.id];
        const rirekisho = rirekishoRecords[student.id] || Object.values(rirekishoRecords).find(r =>
          (student.noKtp && r.noKtp && r.noKtp === student.noKtp) ||
          (student.email && r.email && r.email.toLowerCase() === student.email.toLowerCase()) ||
          (student.namaLengkap && r.namaLengkap && r.namaLengkap.trim().toUpperCase() === student.namaLengkap.trim().toUpperCase())
        );
        const isForwarded = student.statusPendaftaran === 'Diterima' || !!rirekisho;

        // Format Financing Label
        let danaLabel = lang === 'ja' ? '未登録' : 'Belum Ada';
        let danaColor = 'bg-slate-50 text-slate-600 border-slate-200';
        if (sDana) {
          if (sDana.statusPersetujuan === 'PENGAJUAN') {
            danaLabel = lang === 'ja' ? '申請中' : 'Diajukan';
            danaColor = 'bg-amber-50 text-amber-800 border-amber-200';
          } else if (sDana.statusPersetujuan === 'VERIFIKASI_ADMIN') {
            danaLabel = lang === 'ja' ? '確認中' : 'Verifikasi';
            danaColor = 'bg-blue-50 text-blue-800 border-blue-200';
          } else if (sDana.statusPersetujuan === 'APPROVAL_MANAGER') {
            danaLabel = lang === 'ja' ? '承認中' : 'Mgr Approval';
            danaColor = 'bg-purple-50 text-purple-800 border-purple-200';
          } else if (sDana.statusPersetujuan === 'DISETUJUI') {
            danaLabel = lang === 'ja' ? '承認済' : 'Disetujui (GM)';
            danaColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
          } else if (sDana.statusPersetujuan === 'DITOLAK') {
            danaLabel = lang === 'ja' ? '却下' : 'Ditolak';
            danaColor = 'bg-rose-50 text-rose-800 border-rose-200';
          }
        }

        const isOffline = (student.kategoriKandidat || '').toString().toUpperCase().includes('OFFLINE');

        return (
          <StudentCardItem
            key={student.id ? `${student.id}-${idx}` : `stu-card-${idx}`}
            student={student}
            idx={idx}
            isSelected={isSelected}
            isDummy={isDummy}
            sHealth={sHealth}
            sDisc={sDisc}
            sPsikotes={sPsikotes}
            sDana={sDana}
            sKontrak={sKontrak}
            rirekisho={rirekishoRecords[student.id]}
            isForwarded={isForwarded}
            isOffline={isOffline}
            danaLabel={danaLabel}
            danaColor={danaColor}
            lang={lang}
            onSelect={() => onSelectStudent(student.id)}
            onEdit={() => onEditStudent(student)}
            onOpenCvModal={(mode) => onOpenCvModal(student, mode)}
            onForward={() => onForwardStudent(student.id)}
          />
        );
      })}
    </div>
  );
};
