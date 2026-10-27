import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useEcosystemTranslation } from '../hooks/useEcosystemTranslation';
import { formatRupiah } from '../utils/financingCalculator';
import { generatePdfFromElement, printDocumentElement } from '../utils/pdfGenerator';
import { StudentCVModal } from './StudentCVModal';
import { StudentEditModal } from './StudentEditModal';
import { GoogleDriveImportModal } from './cvportal/GoogleDriveImportModal';
import { StudentCardView } from './StudentCardView';
import { DuplicateDataCheckerModal } from './common/DuplicateDataCheckerModal';
import { CalonSiswa } from '../types';
import { translateCandidateCategory } from '../utils/mitraJobUtils';
import { SCHEME_TRANSLATIONS } from '../i18n/financingAndContractI18n';
import { getStudentPhotoUrl, handleStudentImageError } from '../utils/studentPhotoHelper';
import { StudentPhotoBadge } from './StudentPhotoBadge';
import { isDummyStudent, isIjefStudent } from '../utils/studentSourceHelper';
import { detectDuplicates, studentToUnified } from '../utils/duplicateDetector';
import { getCandidateGender } from './cvportal/CandidateDashboardStatistics';
import { applyCandidateSorting } from '../utils/sortHelper';
import { calculateAgeFromBirthDate } from '../utils/candidateUtils';
import {
  Building2,
  UserCheck,
  Stethoscope,
  Brain,
  FileCheck,
  Coins,
  FileText,
  CheckCircle2,
  XCircle,
  Printer,
  Download,
  ExternalLink,
  ShieldCheck,
  BarChart2,
  Sparkles,
  ArrowRight,
  Award,
  Eye,
  User,
  Users,
  Edit2,
  HardDrive,
  LayoutGrid,
  List,
  Database,
  ArrowUpDown,
  Filter,
  SlidersHorizontal,
  Layers,
  Search,
  Copy,
  AlertTriangle,
  Shield,
  RotateCcw
} from 'lucide-react';

export const StudentMasterView: React.FC = () => {
  const {
    students,
    selectedStudentId,
    setSelectedStudentId,
    activeStudent: ctxActiveStudent,
    healthRecords,
    discRecords,
    psikotesRecords,
    financingRecords,
    contractRecords,
    rirekishoRecords,
    jobApplications,
    forwardStudentToAdmin2,
    setAdminPortalCategoryMode,
    setActiveTab,
    searchTerm,
    setSearchTerm
  } = useApp();

  const {
    lang,
    isJapanese,
    setLang,
    scoped: tSiswa,
    bilingual
  } = useEcosystemTranslation('adminSiswa');

  // Persistent Filter States ("Lock Filter" across edits and reloads)
  const [isFilterLocked, setIsFilterLocked] = useState<boolean>(() => {
    const saved = localStorage.getItem('ijef_admin1_lock_filter');
    return saved !== null ? saved === 'true' : true;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Restore searchTerm if locked on mount
  useEffect(() => {
    if (isFilterLocked) {
      const savedSearch = localStorage.getItem('ijef_admin1_search');
      if (savedSearch && !searchTerm) {
        setSearchTerm(savedSearch);
      }
    }
  }, []);

  // View Mode: 'list' (Table) vs 'card' (Grid) vs 'pipeline' (Kanban)
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'pipeline'>(() => {
    return (localStorage.getItem('ijef_student_view_mode') as 'list' | 'card' | 'pipeline') || 'list';
  });

  // Kanban Drag & Drop State for Admin Siswa
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  const [dragOverStageSiswa, setDragOverStageSiswa] = useState<string | null>(null);
  const [quickMoveStudent, setQuickMoveStudent] = useState<CalonSiswa | null>(null);

  const handleStudentDragStart = (e: React.DragEvent, id: string) => {
    setDraggedStudentId(id);
    e.dataTransfer.setData('text/plain', id);
  };
  const handleStudentDragEnd = () => {
    setDraggedStudentId(null);
    setDragOverStageSiswa(null);
  };
  const handleStudentDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    if (dragOverStageSiswa !== stage) setDragOverStageSiswa(stage);
  };
  const handleStudentDragEnter = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDragOverStageSiswa(stage);
  };
  const handleStudentDragLeave = (e: React.DragEvent, stage: string) => {
    if (dragOverStageSiswa === stage) setDragOverStageSiswa(null);
  };
  const handleStudentDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedStudentId;
    setDragOverStageSiswa(null);
    setDraggedStudentId(null);
    if (id && setStudents) {
      const student = students.find((s) => s.id === id || s.noKtp === id);
      if (student) {
        const updated = {
          ...student,
          statusPendaftaran: targetStage,
          statusProgres: targetStage
        };
        setStudents(prev => prev.map(st => st.id === student.id ? updated : st));
        setToastMessage(`Status siswa ${student.namaLengkap} dipindah ke ${targetStage}`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    }
  };

  const handleStudentStageMove = (studentId: string, targetStage: string) => {
    const student = students.find((s) => s.id === studentId || s.noKtp === studentId);
    if (student && setStudents) {
      const updated = {
        ...student,
        statusPendaftaran: targetStage,
        statusProgres: targetStage
      };
      setStudents(prev => prev.map(st => st.id === student.id ? updated : st));
      setToastMessage(`Status siswa ${student.namaLengkap} dipindah ke ${targetStage}`);
      setTimeout(() => setToastMessage(null), 3000);
      setQuickMoveStudent(null);
    }
  };

  // Source Filter: 'ALL' | 'REAL_FIREBASE' | 'DUMMY'
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'REAL_FIREBASE' | 'DUMMY'>(() => {
    const isLocked = localStorage.getItem('ijef_admin1_lock_filter') !== 'false';
    const saved = isLocked ? localStorage.getItem('ijef_admin1_source') : null;
    return (saved as 'ALL' | 'REAL_FIREBASE' | 'DUMMY') || 'ALL';
  });

  // Sort By: 'DEFAULT' | 'NAME_ASC' | 'NAME_DESC' | 'SOURCE_REAL_FIRST' | 'SOURCE_DUMMY_FIRST' | 'GRADUATION'
  const [sortBy, setSortBy] = useState<string>(() => {
    const isLocked = localStorage.getItem('ijef_admin1_lock_filter') !== 'false';
    const saved = isLocked ? localStorage.getItem('ijef_admin1_sort') : null;
    return saved || 'DEFAULT';
  });

  // Category Filter: 'ALL' | 'OFFLINE' | 'ONLINE' (Strictly IJEF only in Admin Siswa)
  const [categoryFilter, setCategoryFilter] = useState<string>(() => {
    const isLocked = localStorage.getItem('ijef_admin1_lock_filter') !== 'false';
    const saved = isLocked ? localStorage.getItem('ijef_admin1_category') : null;
    return saved || 'ALL';
  });

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    const isLocked = localStorage.getItem('ijef_admin1_lock_filter') !== 'false';
    const saved = isLocked ? localStorage.getItem('ijef_admin1_status') : null;
    return saved || 'ALL';
  });

  // Gender Filter: 'ALL' | 'Laki-laki' | 'Perempuan'
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'Laki-laki' | 'Perempuan'>(() => {
    const isLocked = localStorage.getItem('ijef_admin1_lock_filter') !== 'false';
    const saved = isLocked ? (localStorage.getItem('ijef_admin1_gender') as any) : null;
    return saved || 'ALL';
  });

  // MCU & Asesmen Filter: 'ALL' (Default - Tampilkan semua siswa tanpa menyembunyikan yang belum MCU) | 'COMPLETE' | 'STRICT' | 'INCOMPLETE'
  const [mcuAssessmentFilter, setMcuAssessmentFilter] = useState<'COMPLETE' | 'STRICT' | 'ALL' | 'INCOMPLETE'>(() => {
    const isLocked = localStorage.getItem('ijef_admin1_lock_filter') !== 'false';
    const saved = isLocked ? (localStorage.getItem('ijef_admin1_mcu_assessment') as any) : null;
    return saved || 'ALL';
  });

  // Sync filter states to localStorage for Lock Filter capability
  useEffect(() => {
    try {
      localStorage.setItem('ijef_admin1_lock_filter', String(isFilterLocked));
      if (isFilterLocked) {
        localStorage.setItem('ijef_admin1_search', searchTerm || '');
        localStorage.setItem('ijef_admin1_source', sourceFilter);
        localStorage.setItem('ijef_admin1_sort', sortBy);
        localStorage.setItem('ijef_admin1_category', categoryFilter);
        localStorage.setItem('ijef_admin1_status', statusFilter);
        localStorage.setItem('ijef_admin1_gender', genderFilter);
        localStorage.setItem('ijef_admin1_mcu_assessment', mcuAssessmentFilter);
      }
    } catch {
      // ignore
    }
  }, [isFilterLocked, searchTerm, sourceFilter, sortBy, categoryFilter, statusFilter, genderFilter, mcuAssessmentFilter]);

  // Check if any non-default filter is currently applied
  const isAnyFilterActive =
    Boolean(searchTerm && searchTerm.trim()) ||
    categoryFilter !== 'ALL' ||
    sourceFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    genderFilter !== 'ALL' ||
    mcuAssessmentFilter !== 'COMPLETE' ||
    sortBy !== 'DEFAULT';

  // Handler to toggle lock filter
  const handleToggleLockFilter = () => {
    const next = !isFilterLocked;
    setIsFilterLocked(next);
    if (!next) {
      try {
        localStorage.removeItem('ijef_admin1_search');
        localStorage.removeItem('ijef_admin1_source');
        localStorage.removeItem('ijef_admin1_sort');
        localStorage.removeItem('ijef_admin1_category');
        localStorage.removeItem('ijef_admin1_status');
        localStorage.removeItem('ijef_admin1_gender');
        localStorage.removeItem('ijef_admin1_mcu_assessment');
      } catch {}
    }
    setToastMessage(
      next
        ? (lang === 'ja' ? '🔒 フィルタ設定を固定保存しました' : '🔒 Pengaturan filter terkunci dan tersimpan!')
        : (lang === 'ja' ? '🔓 フィルタ固定を解除しました' : '🔓 Kunci filter dinonaktifkan')
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handler to reset all filters to default
  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('ALL');
    setSourceFilter('ALL');
    setStatusFilter('ALL');
    setGenderFilter('ALL');
    setMcuAssessmentFilter('COMPLETE');
    setSortBy('DEFAULT');
    if (isFilterLocked) {
      try {
        localStorage.setItem('ijef_admin1_search', '');
        localStorage.setItem('ijef_admin1_source', 'ALL');
        localStorage.setItem('ijef_admin1_sort', 'DEFAULT');
        localStorage.setItem('ijef_admin1_category', 'ALL');
        localStorage.setItem('ijef_admin1_status', 'ALL');
        localStorage.setItem('ijef_admin1_gender', 'ALL');
        localStorage.setItem('ijef_admin1_mcu_assessment', 'COMPLETE');
      } catch {}
    }
    setToastMessage(lang === 'ja' ? '🔄 フィルタを初期化しました' : '🔄 Semua filter berhasil di-reset ke kondisi awal');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [cvModalStudent, setCvModalStudent] = useState<CalonSiswa | null>(null);
  const [cvModalInitialMode, setCvModalInitialMode] = useState<'JIKOSHOUKAI' | 'CV' | 'DOKUMEN'>('JIKOSHOUKAI');
  const [editingStudent, setEditingStudent] = useState<CalonSiswa | null>(null);
  const [showDriveModal, setShowDriveModal] = useState<boolean>(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false);

  const handleSetViewMode = (mode: 'list' | 'card' | 'pipeline') => {
    setViewMode(mode);
    try {
      localStorage.setItem('ijef_student_view_mode', mode);
    } catch (e) {}
  };

  // Strictly filter only IJEF students (Offline & Online) for Admin Siswa
  const ijefStudents = React.useMemo(() => {
    return students.filter((s) => isIjefStudent(s));
  }, [students]);

  // Helper to verify if candidate has completed MCU and assessments (DISC & Psikotes)
  const checkMcuAndAssessment = React.useCallback((s: CalonSiswa) => {
    const sHealth =
      healthRecords[s.id] ||
      (s.noKtp ? healthRecords[s.noKtp] : undefined) ||
      (s.email ? healthRecords[s.email] : undefined);
    const sDisc =
      discRecords[s.id] ||
      (s.noKtp ? discRecords[s.noKtp] : undefined) ||
      (s.email ? discRecords[s.email] : undefined);
    const sPsikotes =
      psikotesRecords[s.id] ||
      (s.noKtp ? psikotesRecords[s.noKtp] : undefined) ||
      (s.email ? psikotesRecords[s.email] : undefined);

    const hasMcu = Boolean(
      sHealth &&
      sHealth.statusFit &&
      sHealth.statusFit !== 'Belum' &&
      sHealth.statusFit !== '未受検' &&
      sHealth.statusFit !== 'Belum MCU' &&
      String(sHealth.statusFit).trim().length > 0
    );

    const hasDisc = Boolean(
      sDisc &&
      (
        (sDisc.dominantType && sDisc.dominantType !== '-' && sDisc.dominantType !== 'Belum Ada') ||
        (sDisc.dominantTrait && sDisc.dominantTrait !== '-') ||
        (sDisc.scoreD !== undefined && Number(sDisc.scoreD) > 0) ||
        (sDisc.skorD !== undefined && Number(sDisc.skorD) > 0)
      )
    );

    const hasPsikotes = Boolean(
      sPsikotes &&
      (
        (sPsikotes.scorePercentage !== undefined && Number(sPsikotes.scorePercentage) > 0) ||
        (sPsikotes.totalCorrect !== undefined && Number(sPsikotes.totalCorrect) > 0) ||
        (sPsikotes.skorTotal !== undefined && Number(sPsikotes.skorTotal) > 0) ||
        (sPsikotes.statusKelulusan && sPsikotes.statusKelulusan !== '-' && sPsikotes.statusKelulusan !== 'Belum Ada')
      )
    );

    const hasAssessment = hasDisc || hasPsikotes;
    const isComplete = hasMcu && hasAssessment;
    const isStrict = hasMcu && hasDisc && hasPsikotes;

    return {
      hasMcu,
      hasDisc,
      hasPsikotes,
      hasAssessment,
      isComplete,
      isStrict
    };
  }, [healthRecords, discRecords, psikotesRecords]);

  // Filtered & Sorted Students List for Admin 1
  const filteredStudents = React.useMemo(() => {
    let result = ijefStudents.filter((s) => {
      // 1. Search term match
      const term = (searchTerm || '').toLowerCase().trim();
      const matchSearch =
        !term ||
        (s.namaLengkap || '').toLowerCase().includes(term) ||
        (s.noKtp || '').includes(term) ||
        (s.email || '').toLowerCase().includes(term) ||
        (s.noHp || '').includes(term);

      // 2. Category match (Only IJEF Offline & Online)
      const cat = (s.kategoriKandidat || '').toString().toUpperCase();
      const isOffline = cat.includes('OFFLINE');
      const isOnline = cat.includes('ONLINE');

      let matchCategory = true;
      if (categoryFilter === 'OFFLINE') {
        matchCategory = isOffline;
      } else if (categoryFilter === 'ONLINE') {
        matchCategory = isOnline;
      }

      // 3. Source match (Firebase Real vs Dummy Mock Data)
      const isDummy = isDummyStudent(s);
      let matchSource = true;
      if (sourceFilter === 'REAL_FIREBASE') {
        matchSource = !isDummy;
      } else if (sourceFilter === 'DUMMY') {
        matchSource = isDummy;
      }

      // 4. Status match
      const isLulus = s.statusPendaftaran === 'Diterima' || !!rirekishoRecords[s.id];
      const rk = rirekishoRecords[s.id];
      const hasInterview =
        jobApplications?.some(
          (app) =>
            (app.siswaId === s.id || app.studentId === s.id) &&
            (app.statusLamaran === 'Interview Terjadwal' || app.statusLamaran === 'Terjadwal Interview')
        ) ||
        rk?.statusProgres === 'Terjadwal Interview' ||
        rk?.statusProgres === 'Penjadwalan Interview';
      const hasNaitei =
        jobApplications?.some(
          (app) =>
            (app.siswaId === s.id || app.studentId === s.id) &&
            (app.statusLamaran === 'Lolos Interview (Naitei)' ||
              app.statusLamaran.includes('Visa') ||
              app.statusLamaran.includes('COE'))
        ) ||
        rk?.statusProgres === 'Lolos Interview (Naitei)' ||
        (rk?.statusProgres && (rk.statusProgres.includes('Visa') || rk.statusProgres.includes('COE')));
      const isReadyForMatching = isLulus && !hasInterview && !hasNaitei;

      let matchStatus = true;
      if (statusFilter === 'ALL') {
        matchStatus = true;
      } else if (statusFilter === 'SIAP_MATCHING') {
        matchStatus = isReadyForMatching;
      } else if (statusFilter === 'INTERVIEW') {
        matchStatus = hasInterview;
      } else if (statusFilter === 'NAITEI_VISA') {
        matchStatus = hasNaitei;
      } else if (statusFilter === 'LULUS') {
        matchStatus = isLulus;
      } else if (statusFilter === 'PROSES') {
        matchStatus = !isLulus;
      }

      // 5. Gender match
      let matchGender = true;
      if (genderFilter === 'Laki-laki') {
        matchGender = getCandidateGender(s) === 'Laki-laki';
      } else if (genderFilter === 'Perempuan') {
        matchGender = getCandidateGender(s) === 'Perempuan';
      }

      // 6. MCU & Assessment Filter (Hiding students who haven't completed tests)
      const testStatus = checkMcuAndAssessment(s);
      let matchTest = true;
      if (mcuAssessmentFilter === 'COMPLETE') {
        matchTest = testStatus.isComplete;
      } else if (mcuAssessmentFilter === 'STRICT') {
        matchTest = testStatus.isStrict;
      } else if (mcuAssessmentFilter === 'INCOMPLETE') {
        matchTest = !testStatus.isComplete;
      }

      return matchSearch && matchCategory && matchSource && matchStatus && matchGender && matchTest;
    });

    // Custom Source & Graduation Priorities if selected
    if (sortBy === 'SOURCE_REAL_FIRST') {
      return [...result].sort((a, b) => (isDummyStudent(a) ? 1 : 0) - (isDummyStudent(b) ? 1 : 0));
    }
    if (sortBy === 'SOURCE_DUMMY_FIRST') {
      return [...result].sort((a, b) => (isDummyStudent(b) ? 1 : 0) - (isDummyStudent(a) ? 1 : 0));
    }
    if (sortBy === 'GRADUATION') {
      return [...result].sort((a, b) => {
        const gradA = a.statusPendaftaran === 'Diterima' || !!rirekishoRecords[a.id] ? 1 : 0;
        const gradB = b.statusPendaftaran === 'Diterima' || !!rirekishoRecords[b.id] ? 1 : 0;
        return gradB - gradA;
      });
    }

    // Apply Standard Sort and Period Criteria (Default, A-Z, Z-A, Tanggal Terbaru, Tanggal Paling Lama, 7 Hari, 30 Hari, Bulan Ini, Bulan Lalu)
    return applyCandidateSorting(result, sortBy);
  }, [
    ijefStudents,
    searchTerm,
    categoryFilter,
    sourceFilter,
    statusFilter,
    genderFilter,
    mcuAssessmentFilter,
    sortBy,
    rirekishoRecords,
    jobApplications,
    checkMcuAndAssessment
  ]);

  // Auto-select active student from filtered list or all students
  const activeStudent = React.useMemo(() => {
    if (selectedStudentId) {
      const found = filteredStudents.find((s) => s.id === selectedStudentId) || students.find((s) => s.id === selectedStudentId);
      if (found) return found;
    }
    if (ctxActiveStudent && filteredStudents.some((s) => s.id === ctxActiveStudent.id)) {
      return ctxActiveStudent;
    }
    return filteredStudents.length > 0 ? filteredStudents[0] : null;
  }, [selectedStudentId, ctxActiveStudent, filteredStudents, students]);

  // Keep selectedStudentId in sync
  useEffect(() => {
    if (activeStudent && selectedStudentId !== activeStudent.id) {
      setSelectedStudentId(activeStudent.id);
    }
  }, [activeStudent, selectedStudentId, setSelectedStudentId]);

  // Stats calculation
  const completeCount = React.useMemo(() => {
    return ijefStudents.filter((s) => checkMcuAndAssessment(s).isComplete).length;
  }, [ijefStudents, checkMcuAndAssessment]);

  const strictCount = React.useMemo(() => {
    return ijefStudents.filter((s) => checkMcuAndAssessment(s).isStrict).length;
  }, [ijefStudents, checkMcuAndAssessment]);

  const incompleteCount = React.useMemo(() => {
    return ijefStudents.filter((s) => !checkMcuAndAssessment(s).isComplete).length;
  }, [ijefStudents, checkMcuAndAssessment]);

  // Calculate IJEF Stats Summary based on current active eligibility
  const eligibleStudents = React.useMemo(() => {
    return ijefStudents.filter((s) => {
      const chk = checkMcuAndAssessment(s);
      if (mcuAssessmentFilter === 'COMPLETE') return chk.isComplete;
      if (mcuAssessmentFilter === 'STRICT') return chk.isStrict;
      if (mcuAssessmentFilter === 'INCOMPLETE') return !chk.isComplete;
      return true;
    });
  }, [ijefStudents, mcuAssessmentFilter, checkMcuAndAssessment]);

  const totalStudents = eligibleStudents.length;
  const priaCount = eligibleStudents.filter((s) => getCandidateGender(s) === 'Laki-laki').length;
  const wanitaCount = eligibleStudents.filter((s) => getCandidateGender(s) === 'Perempuan').length;
  const priaPercentage = totalStudents > 0 ? ((priaCount / totalStudents) * 100).toFixed(1) : '0.0';
  const wanitaPercentage = totalStudents > 0 ? ((wanitaCount / totalStudents) * 100).toFixed(1) : '0.0';

  const priaOfflineCount = eligibleStudents.filter(
    (s) => getCandidateGender(s) === 'Laki-laki' && (s.kategoriKandidat || '').toString().toUpperCase().includes('OFFLINE')
  ).length;
  const priaOnlineCount = eligibleStudents.filter(
    (s) => getCandidateGender(s) === 'Laki-laki' && (s.kategoriKandidat || '').toString().toUpperCase().includes('ONLINE')
  ).length;
  const wanitaOfflineCount = eligibleStudents.filter(
    (s) => getCandidateGender(s) === 'Perempuan' && (s.kategoriKandidat || '').toString().toUpperCase().includes('OFFLINE')
  ).length;
  const wanitaOnlineCount = eligibleStudents.filter(
    (s) => getCandidateGender(s) === 'Perempuan' && (s.kategoriKandidat || '').toString().toUpperCase().includes('ONLINE')
  ).length;

  const ijefOfflineCount = eligibleStudents.filter(
    (s) => (s.kategoriKandidat || '').toString().toUpperCase().includes('OFFLINE')
  ).length;
  const ijefOnlineCount = eligibleStudents.filter(
    (s) => (s.kategoriKandidat || '').toString().toUpperCase().includes('ONLINE')
  ).length;
  const realFirebaseCount = eligibleStudents.filter((s) => !isDummyStudent(s)).length;
  const dummyCount = eligibleStudents.filter((s) => isDummyStudent(s)).length;
  const graduatedCount = eligibleStudents.filter(
    (s) => s.statusPendaftaran === 'Diterima' || !!rirekishoRecords[s.id]
  ).length;

  // Detect duplicate count for IJEF students
  const detectedDuplicateCount = React.useMemo(() => {
    const unified = ijefStudents.map((s) => studentToUnified(s));
    const dupGroups = detectDuplicates(unified);
    return dupGroups.length;
  }, [ijefStudents]);

  const health = activeStudent
    ? healthRecords[activeStudent.id] || (activeStudent.noKtp ? healthRecords[activeStudent.noKtp] : undefined)
    : undefined;
  const disc = activeStudent
    ? discRecords[activeStudent.id] || (activeStudent.noKtp ? discRecords[activeStudent.noKtp] : undefined)
    : undefined;
  const psikotes = activeStudent
    ? psikotesRecords[activeStudent.id] || (activeStudent.noKtp ? psikotesRecords[activeStudent.noKtp] : undefined)
    : undefined;
  const dana = activeStudent
    ? financingRecords[activeStudent.id] || (activeStudent.noKtp ? financingRecords[activeStudent.noKtp] : undefined)
    : undefined;
  const kontrak = activeStudent
    ? contractRecords[activeStudent.id] || (activeStudent.noKtp ? contractRecords[activeStudent.noKtp] : undefined)
    : undefined;

  return (
    <div className="w-full py-2 space-y-8">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900/95 border border-purple-400 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-bounce backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* ======================================================================== */}
      {/* SECTION A: STATS CARDS & MASTER TABLE/CARD LIST DATA SISWA (ADMIN 1)      */}
      {/* ======================================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        {/* Title Banner & View Mode Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
              <Building2 className="w-3 h-3" />
              <span>{lang === 'ja' ? '管理者 1 • IJEF生徒マスターデータベース' : 'ADMIN 1 • DATABASE MASTER SISWA IJEF'}</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {lang === 'ja' ? 'LPK IJEF 生徒マスターデータ台帳 (対面・オンライン専用)' : 'Tabel Master Data Siswa LPK IJEF (Offline & Online)'}
            </h2>
            <p className="text-xs text-slate-500 font-normal leading-relaxed">
              {lang === 'ja'
                ? 'IJEF内部研修生（対面・オンライン）の台帳管理、6モジュールの進捗確認、および管理2（Admin Doc）への修了生引き継ぎを行います。'
                : 'Kelola data siswa IJEF (Offline & Online), pantau progres 6 modul pelatihan internal, dan luluskan siswa untuk di-forward ke ADMIN 2.'}
            </p>
          </div>

          {/* Right Header: Count Info & View Mode Toggle Switch */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Lock Filter Button (Kunci Filter across reloads) */}
            <button
              type="button"
              onClick={handleToggleLockFilter}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-2xs ${
                isFilterLocked
                  ? 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
              title={
                lang === 'ja'
                  ? 'ページ遷移やデータ編集後もフィルタ条件を維持します'
                  : 'Kunci filter (Lock Filter) agar kondisi pencarian tidak reset saat berpindah portal, mengedit siswa, atau memuat ulang'
              }
            >
              <Shield className={`w-3.5 h-3.5 ${isFilterLocked ? 'text-purple-600' : 'text-slate-400'}`} />
              <span>
                {isFilterLocked
                  ? (lang === 'ja' ? '🔒 フィルタ固定中' : '🔒 Filter Terkunci')
                  : (lang === 'ja' ? '🔓 Kunci Filter' : '🔓 Kunci Filter')}
              </span>
            </button>

            {/* Reset Filter Button (Shown when any filter is active) */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition cursor-pointer shadow-2xs"
                title={lang === 'ja' ? '全てのフィルタ条件を初期化' : 'Reset semua filter pencarian ke pengaturan awal'}
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>{lang === 'ja' ? 'リセット' : 'Reset Filter'}</span>
              </button>
            )}

            {/* View Mode Switcher (List vs Card vs Pipeline) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => handleSetViewMode('list')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={lang === 'ja' ? 'テーブル・リスト表示モード' : 'Tampilan Mode List / Tabel'}
              >
                <List className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? 'リスト' : 'Mode List'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetViewMode('card')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={lang === 'ja' ? 'カードグリッド表示モード' : 'Tampilan Mode Kartu / Grid'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? 'カード' : 'Mode Kartu'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetViewMode('pipeline')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'pipeline'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={lang === 'ja' ? 'カンバン・パイプライン表示' : 'Tampilan Kanban Pipeline'}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'ja' ? 'カンバン' : 'Kanban Pipeline'}</span>
              </button>
            </div>

            {/* Total Badge */}
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-700 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shrink-0">
              <span className="text-[11px] font-semibold">{lang === 'ja' ? 'IJEF生徒総数:' : 'Total IJEF:'}</span>
              <strong className="text-emerald-700 font-black text-sm">
                {lang === 'ja' ? `${totalStudents} 名` : `${totalStudents} Siswa`}
              </strong>
              <span className="text-slate-300">|</span>
              <span className="text-blue-700 font-bold text-[11px]" title="Jumlah Siswa Pria">♂ {priaCount} Pria</span>
              <span className="text-rose-600 font-bold text-[11px]" title="Jumlah Siswa Wanita">♀ {wanitaCount} Wanita</span>
            </div>
          </div>
        </div>

        {/* 6 Stats Cards with Gender Classification */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* 1. Total Siswa IJEF */}
          <div
            onClick={() => {
              setGenderFilter('ALL');
              setCategoryFilter('ALL');
              setStatusFilter('ALL');
            }}
            className={`p-3 rounded-xl border transition cursor-pointer space-y-1 ${
              genderFilter === 'ALL' && categoryFilter === 'ALL' && statusFilter === 'ALL'
                ? 'bg-slate-100/90 border-slate-400 ring-2 ring-slate-400 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
            }`}
            title="Tampilkan semua siswa IJEF"
          >
            <div className="text-[10px] text-slate-500 uppercase font-mono font-bold flex items-center justify-between">
              <span>{lang === 'ja' ? 'IJEF生徒総数' : 'Total Siswa IJEF'}</span>
              <Users className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg font-black text-slate-900 font-mono">{totalStudents}</div>
            <div className="text-[10px] text-slate-600 font-medium flex items-center justify-between">
              <span>{lang === 'ja' ? '本番:' : 'Firebase:'} <strong className="text-emerald-700">{realFirebaseCount}</strong></span>
              <span>{lang === 'ja' ? 'ダミー:' : 'Dummy:'} <strong className="text-amber-700">{dummyCount}</strong></span>
            </div>
          </div>

          {/* 2. Siswa Pria (Laki-laki) */}
          <div
            onClick={() => setGenderFilter(genderFilter === 'Laki-laki' ? 'ALL' : 'Laki-laki')}
            className={`p-3 rounded-xl border transition cursor-pointer space-y-1 ${
              genderFilter === 'Laki-laki'
                ? 'bg-blue-100/90 border-blue-400 ring-2 ring-blue-500 shadow-xs'
                : 'bg-blue-50/60 border-blue-200 hover:bg-blue-100/50'
            }`}
            title="Filter daftar: Siswa Pria (Laki-laki)"
          >
            <div className="text-[10px] text-blue-800 uppercase font-mono font-bold flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <span className="text-blue-600 font-black">♂</span>
                <span>{lang === 'ja' ? '男性 (Pria)' : 'Pria (Laki-laki)'}</span>
              </span>
              <span className="text-blue-700 font-mono font-black text-[11px]">{priaPercentage}%</span>
            </div>
            <div className="text-lg font-black text-blue-900 font-mono flex items-baseline justify-between">
              <span>{priaCount} <span className="text-[11px] font-normal text-blue-600">{lang === 'ja' ? '名' : 'Siswa'}</span></span>
              {genderFilter === 'Laki-laki' && (
                <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">AKTIF</span>
              )}
            </div>
            <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${priaPercentage}%` }} />
            </div>
            <div className="text-[10px] text-blue-700 font-medium flex items-center justify-between">
              <span>Offline: <strong>{priaOfflineCount}</strong></span>
              <span>Online: <strong>{priaOnlineCount}</strong></span>
            </div>
          </div>

          {/* 3. Siswa Wanita (Perempuan) */}
          <div
            onClick={() => setGenderFilter(genderFilter === 'Perempuan' ? 'ALL' : 'Perempuan')}
            className={`p-3 rounded-xl border transition cursor-pointer space-y-1 ${
              genderFilter === 'Perempuan'
                ? 'bg-rose-100/90 border-rose-400 ring-2 ring-rose-500 shadow-xs'
                : 'bg-rose-50/60 border-rose-200 hover:bg-rose-100/50'
            }`}
            title="Filter daftar: Siswa Wanita (Perempuan)"
          >
            <div className="text-[10px] text-rose-800 uppercase font-mono font-bold flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <span className="text-rose-600 font-black">♀</span>
                <span>{lang === 'ja' ? '女性 (Wanita)' : 'Wanita (Perempuan)'}</span>
              </span>
              <span className="text-rose-700 font-mono font-black text-[11px]">{wanitaPercentage}%</span>
            </div>
            <div className="text-lg font-black text-rose-900 font-mono flex items-baseline justify-between">
              <span>{wanitaCount} <span className="text-[11px] font-normal text-rose-600">{lang === 'ja' ? '名' : 'Siswa'}</span></span>
              {genderFilter === 'Perempuan' && (
                <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-bold">AKTIF</span>
              )}
            </div>
            <div className="h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full transition-all duration-300" style={{ width: `${wanitaPercentage}%` }} />
            </div>
            <div className="text-[10px] text-rose-700 font-medium flex items-center justify-between">
              <span>Offline: <strong>{wanitaOfflineCount}</strong></span>
              <span>Online: <strong>{wanitaOnlineCount}</strong></span>
            </div>
          </div>

          {/* 4. IJEF Offline */}
          <div
            onClick={() => setCategoryFilter(categoryFilter === 'OFFLINE' ? 'ALL' : 'OFFLINE')}
            className={`p-3 rounded-xl border transition cursor-pointer space-y-1 ${
              categoryFilter === 'OFFLINE'
                ? 'bg-emerald-100/90 border-emerald-400 ring-2 ring-emerald-500 shadow-xs'
                : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100/50'
            }`}
            title="Filter daftar: Siswa IJEF Offline"
          >
            <div className="text-[10px] text-emerald-800 uppercase font-mono font-bold flex items-center justify-between">
              <span>{lang === 'ja' ? 'IJEF 対面・合宿生' : 'IJEF Offline'}</span>
              {categoryFilter === 'OFFLINE' && (
                <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">AKTIF</span>
              )}
            </div>
            <div className="text-lg font-black text-emerald-700 font-mono">{ijefOfflineCount}</div>
            <div className="text-[10px] text-emerald-600 font-medium">
              {lang === 'ja' ? '寮生活＆対面研修' : 'Asrama & Tatap Muka'}
            </div>
          </div>

          {/* 5. IJEF Online */}
          <div
            onClick={() => setCategoryFilter(categoryFilter === 'ONLINE' ? 'ALL' : 'ONLINE')}
            className={`p-3 rounded-xl border transition cursor-pointer space-y-1 ${
              categoryFilter === 'ONLINE'
                ? 'bg-sky-100/90 border-sky-400 ring-2 ring-sky-500 shadow-xs'
                : 'bg-sky-50/60 border-sky-200 hover:bg-sky-100/50'
            }`}
            title="Filter daftar: Siswa IJEF Online"
          >
            <div className="text-[10px] text-sky-800 uppercase font-mono font-bold flex items-center justify-between">
              <span>{lang === 'ja' ? 'IJEF オンライン生' : 'IJEF Online'}</span>
              {categoryFilter === 'ONLINE' && (
                <span className="text-[9px] bg-sky-600 text-white px-1.5 py-0.2 rounded font-bold">AKTIF</span>
              )}
            </div>
            <div className="text-lg font-black text-sky-700 font-mono">{ijefOnlineCount}</div>
            <div className="text-[10px] text-sky-600 font-medium">
              {lang === 'ja' ? 'オンラインクラス / LMS' : 'Kelas Daring / LMS'}
            </div>
          </div>

          {/* 6. Lulus & Sync Admin 2 */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'LULUS' ? 'ALL' : 'LULUS')}
            className={`p-3 rounded-xl border transition cursor-pointer space-y-1 ${
              statusFilter === 'LULUS'
                ? 'bg-purple-100/90 border-purple-400 ring-2 ring-purple-500 shadow-xs'
                : 'bg-purple-50/60 border-purple-200 hover:bg-purple-100/50'
            }`}
            title="Filter daftar: Siswa Lulus & Tersinkron di Admin Doc"
          >
            <div className="text-[10px] text-purple-800 uppercase font-mono font-bold flex items-center justify-between">
              <span>{lang === 'ja' ? '修了・書類管理同期済' : 'Lulus & Sync ADMIN 2'}</span>
              {statusFilter === 'LULUS' && (
                <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.2 rounded font-bold">AKTIF</span>
              )}
            </div>
            <div className="text-lg font-black text-purple-700 font-mono">{graduatedCount}</div>
            <div className="text-[10px] text-purple-600 font-medium">
              {lang === 'ja' ? '日本企業マッチング準備完了' : 'Siap Matching Job Japan'}
            </div>
          </div>
        </div>

        {/* Search & Comprehensive Filter Toolbar */}
        <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          {/* Row 0: Filter Kelengkapan MCU & Asesmen (Sembunyikan yang belum MCU & Asesmen) */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-700 mr-1 flex items-center space-x-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'ja' ? 'MCU & 適性検査状況:' : 'Status MCU & Asesmen:'}</span>
              </span>
              {[
                {
                  id: 'COMPLETE',
                  label: lang === 'ja' ? `✓ 健診・適性受検済 (${completeCount})` : `✓ Sudah Mengisi MCU & Asesmen (${completeCount})`,
                  title: 'Hanya menampilkan siswa yang sudah melengkapi MCU dan Asesmen (DISC/Psikotes)'
                },
                {
                  id: 'STRICT',
                  label: lang === 'ja' ? `✓ 全検査完了 (${strictCount})` : `✓ Lengkap Penuh (MCU + DISC + Psikotes) (${strictCount})`,
                  title: 'Hanya menampilkan siswa yang sudah menyelesaikan MCU, DISC, dan Psikotes sekaligus'
                },
                {
                  id: 'ALL',
                  label: lang === 'ja' ? `全生徒 (${ijefStudents.length})` : `Semua Siswa IJEF (${ijefStudents.length})`,
                  title: 'Tampilkan seluruh siswa IJEF termasuk yang belum mengisi MCU atau asesmen'
                },
                {
                  id: 'INCOMPLETE',
                  label: lang === 'ja' ? `⚠️ 未受検 (${incompleteCount})` : `⚠️ Belum Lengkap MCU / Asesmen (${incompleteCount})`,
                  title: 'Tampilkan siswa yang belum mengisi asesmen atau belum MCU'
                }
              ].map((mcu) => (
                <button
                  key={mcu.id}
                  type="button"
                  onClick={() => setMcuAssessmentFilter(mcu.id as any)}
                  title={mcu.title}
                  className={`px-3 py-1.5 rounded-lg font-bold transition text-xs cursor-pointer flex items-center space-x-1 ${
                    mcuAssessmentFilter === mcu.id
                      ? mcu.id === 'COMPLETE' || mcu.id === 'STRICT'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : mcu.id === 'INCOMPLETE'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <span>{mcu.label}</span>
                </button>
              ))}
            </div>

            {mcuAssessmentFilter === 'COMPLETE' && (
              <span className="text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{lang === 'ja' ? '未受検の生徒は非表示です' : 'Siswa belum mengisi asesmen & MCU disembunyikan otomatis'}</span>
              </span>
            )}
          </div>

          {/* Row 1: Source Filter Tabs, Category Filter & Gender Filter */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Source Filter: Firebase vs Dummy */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-600 mr-1 flex items-center space-x-1">
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span>{lang === 'ja' ? 'データ種別:' : 'Sumber Data:'}</span>
              </span>
              {[
                { id: 'ALL', label: lang === 'ja' ? `全データ (${totalStudents})` : `Semua Data (${totalStudents})` },
                { id: 'REAL_FIREBASE', label: lang === 'ja' ? `Firebase 本番 (${realFirebaseCount})` : `Data Asli (Firebase) (${realFirebaseCount})` },
                { id: 'DUMMY', label: lang === 'ja' ? `data dumi (${dummyCount})` : `data dumi (${dummyCount})` }
              ].map((src) => (
                <button
                  key={src.id}
                  onClick={() => setSourceFilter(src.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition text-xs cursor-pointer ${
                    sourceFilter === src.id
                      ? src.id === 'DUMMY'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : src.id === 'REAL_FIREBASE'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-800 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>

            {/* Category Filter Pills & Gender Classification Pills */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter Pills (Only IJEF Offline & Online) */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-600 mr-1">
                  {lang === 'ja' ? 'IJEF区分:' : 'Kategori IJEF:'}
                </span>
                {[
                  { id: 'ALL', label: lang === 'ja' ? 'Semua IJEF' : 'Semua Siswa IJEF' },
                  { id: 'OFFLINE', label: lang === 'ja' ? 'IJEF 対面' : 'IJEF Offline' },
                  { id: 'ONLINE', label: lang === 'ja' ? 'IJEF オンライン' : 'IJEF Online' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition text-xs cursor-pointer ${
                      categoryFilter === cat.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Gender Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-600 mr-1 flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lang === 'ja' ? '性別:' : 'Jenis Kelamin:'}</span>
                </span>
                {[
                  { id: 'ALL', label: lang === 'ja' ? `全て (${totalStudents})` : `Semua Gender (${totalStudents})` },
                  { id: 'Laki-laki', label: lang === 'ja' ? `♂ 男性 (${priaCount})` : `♂ Pria (${priaCount})` },
                  { id: 'Perempuan', label: lang === 'ja' ? `♀ 女性 (${wanitaCount})` : `♀ Wanita (${wanitaCount})` }
                ].map((gen) => (
                  <button
                    key={gen.id}
                    onClick={() => setGenderFilter(gen.id as any)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition text-xs cursor-pointer ${
                      genderFilter === gen.id
                        ? gen.id === 'Laki-laki'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : gen.id === 'Perempuan'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-800 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {gen.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Search, Status Filter, Sort Selector, and Google Drive Button */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-2 border-t border-slate-200/80">
            {/* Search Input Bar */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'ja' ? '生徒名、身分証番号(NIK)、メール、電話番号で検索...' : 'Cari nama siswa, NIK, email, no HP...'}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Lock Filter Toggle Button */}
              <button
                type="button"
                onClick={handleToggleLockFilter}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer shadow-2xs shrink-0 ${
                  isFilterLocked
                    ? 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
                title={
                  lang === 'ja'
                    ? 'ページ遷移やデータ編集後もフィルタ条件を維持します'
                    : 'Kunci filter (Lock Filter) agar tidak reset saat mengedit data siswa atau memuat ulang portal'
                }
              >
                <Shield className={`w-3.5 h-3.5 ${isFilterLocked ? 'text-purple-600' : 'text-slate-400'}`} />
                <span>
                  {isFilterLocked
                    ? (lang === 'ja' ? '🔒 Filter Terkunci' : '🔒 Filter Terkunci')
                    : (lang === 'ja' ? '🔓 Kunci Filter' : '🔓 Kunci Filter')}
                </span>
              </button>

              {/* Reset Filter Button */}
              {isAnyFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-8.5 flex items-center space-x-1.5 px-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition cursor-pointer shrink-0"
                  title="Reset semua filter ke kondisi awal"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Reset</span>
                </button>
              )}

              {/* Sort Selector with all user requested options */}
              <div className="h-8.5 flex items-center space-x-1.5 bg-white px-2.5 rounded-lg border border-slate-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="DEFAULT">{lang === 'ja' ? '並び替え: デフォルト' : 'Sortir: Default'}</option>
                  <option value="NAME_ASC">{lang === 'ja' ? '氏名順 (A - Z)' : 'Nama (A - Z)'}</option>
                  <option value="NAME_DESC">{lang === 'ja' ? '氏名順 (Z - A)' : 'Nama (Z - A)'}</option>
                  <option value="DATE_NEWEST">{lang === 'ja' ? '日付: 新しい順' : 'Tanggal Terbaru'}</option>
                  <option value="DATE_OLDEST">{lang === 'ja' ? '日付: 古い順 (日付なし含む)' : 'Tanggal Paling Lama (termasuk tanpa tanggal)'}</option>
                  <option value="LAST_7_DAYS">{lang === 'ja' ? '過去7日間' : '7 Hari Terakhir'}</option>
                  <option value="LAST_30_DAYS">{lang === 'ja' ? '過去30日間' : '30 Hari Terakhir'}</option>
                  <option value="THIS_MONTH">{lang === 'ja' ? '今月' : 'Bulan Ini'}</option>
                  <option value="LAST_MONTH">{lang === 'ja' ? '先月' : 'Bulan Lalu'}</option>
                  <option value="SOURCE_REAL_FIRST">{lang === 'ja' ? 'Firebase本番データ優先' : 'Data Asli Terlebih Dahulu'}</option>
                  <option value="SOURCE_DUMMY_FIRST">{lang === 'ja' ? 'data dumi 優先' : 'data dumi Terlebih Dahulu'}</option>
                  <option value="GRADUATION">{lang === 'ja' ? '修了生優先 (Admin Doc)' : 'Lulus / Sync Admin 2 Dulu'}</option>
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8.5 bg-white text-xs text-slate-800 px-3 rounded-lg border border-slate-300 font-bold cursor-pointer"
              >
                <option value="ALL">{lang === 'ja' ? '全てのステータス' : 'Semua Status'}</option>
                <option value="SIAP_MATCHING">{lang === 'ja' ? '🟢 マッチング待機・求人待ち' : '🟢 Siap Matching / Menunggu Job'}</option>
                <option value="INTERVIEW">{lang === 'ja' ? '🟡 面接日程確定・調整中' : '🟡 Terjadwal Interview'}</option>
                <option value="NAITEI_VISA">{lang === 'ja' ? '🟣 内定獲得 / VISA・COE申請中' : '🟣 Lolos Naitei / Proses Visa COE'}</option>
                <option value="LULUS">{lang === 'ja' ? '✓ 修了認定済 (Admin Doc同期)' : '✓ Terverifikasi Lulus (Admin Doc)'}</option>
                <option value="PROSES">{lang === 'ja' ? '内部研修・選考進行中' : 'Proses Pelatihan Internal'}</option>
              </select>

              {/* Google Drive Import Button */}
              <button
                type="button"
                onClick={() => setShowDriveModal(true)}
                className="h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? 'Drive 同期' : 'Tarik Google Drive'}</span>
              </button>

              {/* Cek Duplicate Data Button */}
              <button
                type="button"
                onClick={() => setShowDuplicateModal(true)}
                className={`h-8.5 relative px-3 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                  detectedDuplicateCount > 0
                    ? 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-400'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
                title={lang === 'ja' ? '生徒データの重複チェック (NIK/メール/電話番号/氏名)' : 'Cek duplikasi data siswa (NIK, Email, No. HP, Nama)'}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? '重複データ確認' : 'Cek Duplicate Data'}</span>
                {detectedDuplicateCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-white text-amber-900 rounded-full text-[10px] font-black font-mono">
                    {detectedDuplicateCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* CONDITIONAL RENDERING: PIPELINE VS CARD VS LIST */}
        {viewMode === 'pipeline' ? (
          /* ======================================================================== */
          /* KANBAN PIPELINE VIEW (ADMIN SISWA)                                       */
          /* ======================================================================== */
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-3 text-xs text-slate-800">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900">
                    {lang === 'ja' ? '生徒進捗カンバン・パイプライン:' : 'Kanban Pipeline Tracking Progress Siswa:'}
                  </span>{' '}
                  <span className="text-slate-600">
                    {lang === 'ja'
                      ? 'カードをドラッグ＆ドロップしてステージを移動するか、メニューボタンをご利用ください。'
                      : 'Geser kartu siswa antar kolom tahap pendaftaran/pelatihan, atau gunakan menu cepat di sudut kartu.'}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <div className="text-xs font-bold text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                  ✨ {filteredStudents.length} {lang === 'ja' ? '名の生徒' : 'Siswa Ditampilkan'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
              {[
                { status: 'Draft', label: lang === 'ja' ? '1. ドラフト (新規)' : '1. Draft / Baru', desc: lang === 'ja' ? '仮登録・情報入力段階' : 'Pendaftaran awal & pengisian data' },
                { status: 'Terverifikasi', label: lang === 'ja' ? '2. 管理者確認済' : '2. Terverifikasi Admin', desc: lang === 'ja' ? '書類・資格の承認' : 'Validasi berkas & biodata oleh admin' },
                { status: 'MCU & Asesmen', label: lang === 'ja' ? '3. 健康診断・適性' : '3. MCU & Asesmen', desc: lang === 'ja' ? '健康診断・DISC・適性検査' : 'Pemeriksaan kesehatan & tes psikologi' },
                { status: 'Siap Matching', label: lang === 'ja' ? '4. マッチング準備' : '4. Siap Matching Job', desc: lang === 'ja' ? 'JIS履歴書完成・日本求人応募可' : 'CV Rirekisho siap & siap lamar job' },
                { status: 'Diterima', label: lang === 'ja' ? '5. 採用決定 (渡航)' : '5. Diterima / Berangkat', desc: lang === 'ja' ? '内定獲得・ビザ・日本出発' : 'Lolos seleksi & persiapan keberangkatan' },
                { status: 'Ditolak', label: lang === 'ja' ? '6. 不採用・終了' : '6. Ditolak / Cancel', desc: lang === 'ja' ? '手続き中断または終了' : 'Proses dihentikan atau dibatalkan' }
              ].map((stage) => {
                const stageStudents = filteredStudents.filter((s) => {
                  const p = s.statusPendaftaran || 'Terdaftar';
                  if (stage.status === 'MCU & Asesmen') return checkMcuAndAssessment(s).isComplete && p !== 'Diterima';
                  if (stage.status === 'Ditolak') return p === 'Ditolak' || p === 'Cancel';
                  return p === stage.status || (stage.status === 'Draft' && (p === 'Draft' || p === 'Terdaftar'));
                });
                const isOverThisStage = dragOverStageSiswa === stage.status;

                return (
                  <div
                    key={stage.status}
                    onDragOver={(e) => handleStudentDragOver(e, stage.status)}
                    onDragEnter={(e) => handleStudentDragEnter(e, stage.status)}
                    onDragLeave={(e) => handleStudentDragLeave(e, stage.status)}
                    onDrop={(e) => handleStudentDrop(e, stage.status)}
                    className={`border rounded-2xl p-3 flex flex-col min-h-[520px] transition-all ${
                      isOverThisStage
                        ? 'bg-emerald-100/90 border-emerald-500 ring-4 ring-emerald-500/20 shadow-lg scale-[1.01]'
                        : 'bg-slate-100/90 border-slate-200'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl border shadow-2xs mb-3 ${isOverThisStage ? 'bg-emerald-200 border-emerald-400' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">{stage.label}</span>
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                          {stageStudents.length}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{stage.desc}</p>
                    </div>

                    <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[620px] pr-0.5">
                      {isOverThisStage && draggedStudentId && (
                        <div className="p-3 border-2 border-dashed border-emerald-500 bg-emerald-100/70 rounded-xl text-center text-xs font-bold text-emerald-900 animate-pulse">
                          {lang === 'ja' ? 'ここにドロップ' : 'Lepas untuk pindah'}
                        </div>
                      )}

                      {stageStudents.length === 0 && !isOverThisStage ? (
                        <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-[10px]">
                          {lang === 'ja' ? '生徒なし' : 'Tidak ada siswa'}
                        </div>
                      ) : (
                        stageStudents.map((s) => (
                          <div
                            key={s.id}
                            draggable={true}
                            onDragStart={(e) => handleStudentDragStart(e, s.id)}
                            onDragEnd={handleStudentDragEnd}
                            className={`p-3 rounded-xl border bg-white shadow-2xs hover:shadow-md transition-all space-y-2 cursor-grab active:cursor-grabbing select-none ${
                              draggedStudentId === s.id ? 'opacity-40 scale-95 border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 truncate">
                                {s.kategoriKandidat || (s.kategori || 'IJEF Student')}
                              </span>
                              <button
                                type="button"
                                draggable={false}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickMoveStudent(s);
                                }}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition cursor-pointer"
                                title="Quick Move"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center space-x-2">
                              <StudentPhotoBadge student={s} rirekisho={rirekishoRecords[s.id]} size="sm" />
                              <div className="min-w-0 flex-1">
                                <h4 className="font-extrabold text-slate-900 text-xs leading-snug truncate">
                                  {s.namaLengkap}
                                </h4>
                                <p className="text-[10px] text-slate-500 font-mono truncate">
                                  ID: {s.id}
                                </p>
                              </div>
                            </div>

                            <div className="pt-1 flex items-center justify-between text-[10px] border-t border-slate-100">
                              <button
                                type="button"
                                draggable={false}
                                onClick={() => {
                                  setSelectedStudentId(s.id);
                                  setEditingStudent(s);
                                }}
                                className="text-emerald-700 font-bold hover:underline flex items-center space-x-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>{lang === 'ja' ? '編集' : 'Edit Profil'}</span>
                              </button>
                              <span className="text-slate-400 font-mono text-[9px]">
                                {s.noHp || '-'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Move Modal for Student */}
            {quickMoveStudent && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-900">
                      {lang === 'ja' ? '生徒進捗ステージ変更' : 'Pindah Tahap Progress Siswa'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setQuickMoveStudent(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <p className="text-xs font-bold text-slate-900">{quickMoveStudent.namaLengkap}</p>
                    <p className="text-[10px] text-slate-600 font-mono">ID: {quickMoveStudent.id}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {lang === 'ja' ? '新しいステージを選択:' : 'Pilih Tahapan Pendaftaran/Progres:'}
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {['Draft', 'Terdaftar', 'Terverifikasi', 'MCU & Asesmen', 'Siap Matching', 'Diterima', 'Ditolak'].map((stageKey) => (
                        <button
                          key={stageKey}
                          type="button"
                          onClick={() => handleStudentStageMove(quickMoveStudent.id, stageKey)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                            quickMoveStudent.statusPendaftaran === stageKey
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 hover:bg-emerald-100 text-slate-800'
                          }`}
                        >
                          <span>{stageKey}</span>
                          {quickMoveStudent.statusPendaftaran === stageKey && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : viewMode === 'card' ? (
          /* ======================================================================== */
          /* CARD VIEW (GRID MODE)                                                    */
          /* ======================================================================== */
          <StudentCardView
            students={filteredStudents}
            activeStudentId={activeStudent.id}
            onSelectStudent={(id) => setSelectedStudentId(id)}
            onEditStudent={(stu) => setEditingStudent(stu)}
            onOpenCvModal={(stu, mode) => {
              setCvModalStudent(stu);
              setCvModalInitialMode(mode);
            }}
            onForwardStudent={(id) => forwardStudentToAdmin2(id)}
            healthRecords={healthRecords}
            discRecords={discRecords}
            psikotesRecords={psikotesRecords}
            financingRecords={financingRecords}
            contractRecords={contractRecords}
            rirekishoRecords={rirekishoRecords}
            jobApplications={jobApplications}
            lang={lang}
          />
        ) : (
          /* ======================================================================== */
          /* LIST VIEW (TABLE MODE)                                                   */
          /* ======================================================================== */
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100 text-slate-700 uppercase font-mono text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">{lang === 'ja' ? 'No & 写真' : 'No & Profile'}</th>
                  <th className="p-3">{lang === 'ja' ? '氏名, 性別 & 身分証番号' : 'Nama, NIK, Gender & Data'}</th>
                  <th className="p-3">{lang === 'ja' ? '生徒区分' : 'Kategori Siswa'}</th>
                  <th className="p-3">{lang === 'ja' ? '健康診断 (MCU)' : 'MCU Medis'}</th>
                  <th className="p-3">{lang === 'ja' ? 'DISC適性' : 'DISC'}</th>
                  <th className="p-3">{lang === 'ja' ? '適性テスト' : 'Psikotes'}</th>
                  <th className="p-3">{lang === 'ja' ? '学費支援 (承認ステータス)' : 'Dana Talang (Approval)'}</th>
                  <th className="p-3">{lang === 'ja' ? '連携ステータス (Siswa→Doc)' : 'Status Admin Siswa → Doc'}</th>
                  <th className="p-3 text-right">{lang === 'ja' ? '操作・管理' : 'Aksi Management'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s, idx) => {
                    const sHealth = healthRecords[s.id];
                    const sDisc = discRecords[s.id];
                    const sPsikotes = psikotesRecords[s.id];
                    const isSelected = s.id === activeStudent.id;
                    const isDummy = isDummyStudent(s);
                    const isForwarded =
                      s.statusPendaftaran === 'Diterima' || !!rirekishoRecords[s.id];

                    return (
                      <tr
                        key={s.id ? `${s.id}-${idx}` : `stu-row-${idx}`}
                        className={`hover:bg-slate-50 transition cursor-pointer ${
                          isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-500' : ''
                        }`}
                        onClick={() => setSelectedStudentId(s.id)}
                      >
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-500 font-bold">{idx + 1}.</span>
                            <StudentPhotoBadge
                              student={s}
                              rirekisho={rirekishoRecords[s.id]}
                              size="xs"
                              ratioLabel="4×6"
                              lang={lang}
                              theme="slate"
                            />
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="font-bold text-slate-900">{s.namaLengkap}</span>
                            {/* Gender Badge */}
                            {getCandidateGender(s) === 'Laki-laki' ? (
                              <span className="inline-flex items-center space-x-1 bg-blue-50 text-blue-800 border border-blue-200 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                                <span>♂</span>
                                <span>{lang === 'ja' ? '男性' : 'Pria'}</span>
                              </span>
                            ) : getCandidateGender(s) === 'Perempuan' ? (
                              <span className="inline-flex items-center space-x-1 bg-rose-50 text-rose-800 border border-rose-200 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                                <span>♀</span>
                                <span>{lang === 'ja' ? '女性' : 'Wanita'}</span>
                              </span>
                            ) : null}
                            {/* Data Source Badge: Data Dummy vs Data Asli Firebase */}
                            {isDummy ? (
                              <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-800 border border-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                                <Database className="w-2.5 h-2.5 text-amber-600" />
                                <span>data dumi</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{lang === 'ja' ? 'Firebase 本番データ' : 'Data Asli (Firebase)'}</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {lang === 'ja' ? '身分証番号:' : 'NIK:'} {s.noKtp || s.id}
                            {s.tanggalLahir && (
                              <> | {s.tanggalLahir} ({calculateAgeFromBirthDate(s.tanggalLahir, s.umur || 22)} {lang === 'ja' ? '歳' : 'Thn'})</>
                            )} | {s.email}
                          </div>
                        </td>

                        <td className="p-3">
                          <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold border inline-block ${
                            (s.kategoriKandidat || '').toString().toUpperCase().includes('OFFLINE')
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-sky-50 text-sky-800 border-sky-200'
                          }`}>
                            {translateCandidateCategory(s.kategoriKandidat, lang)}
                          </span>
                        </td>

                        <td className="p-3">
                          {sHealth ? (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                sHealth.statusFit === 'FIT'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {sHealth.statusFit}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">
                              {lang === 'ja' ? '未受検' : 'Belum MCU'}
                            </span>
                          )}
                        </td>

                        <td className="p-3 font-mono text-[11px]">
                          {sDisc ? (
                            <span className="text-purple-700 font-bold">{sDisc.dominantType}</span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">-</span>
                          )}
                        </td>

                        <td className="p-3 font-mono text-[11px]">
                          {sPsikotes ? (
                            <span
                              className={
                                sPsikotes.statusKelulusan === 'LULUS'
                                  ? 'text-emerald-700 font-bold'
                                  : 'text-rose-700 font-bold'
                              }
                            >
                              {sPsikotes.scorePercentage}% ({sPsikotes.statusKelulusan === 'LULUS' ? (lang === 'ja' ? '合格' : 'LULUS') : (lang === 'ja' ? '不合格' : 'TIDAK LULUS')})
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">-</span>
                          )}
                        </td>

                        <td className="p-3">
                          {(() => {
                            const sDana = financingRecords[s.id];
                            if (!sDana) {
                              return <span className="text-slate-400 text-[10px] italic">{lang === 'ja' ? '未登録' : 'Belum Ada'}</span>;
                            }
                            const st = sDana.statusPersetujuan;
                            let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
                            let label = lang === 'ja' ? '下書き' : 'Draft';
                            if (st === 'PENGAJUAN') {
                              badgeBg = 'bg-amber-100 text-amber-900 border-amber-300';
                              label = lang === 'ja' ? '1. 申請中（生徒）' : '1. Siswa / Pemohon';
                            } else if (st === 'VERIFIKASI_ADMIN') {
                              badgeBg = 'bg-blue-100 text-blue-900 border-blue-300';
                              label = lang === 'ja' ? '2. 管理者確認' : '2. Verifikasi Admin';
                            } else if (st === 'APPROVAL_MANAGER') {
                              badgeBg = 'bg-purple-100 text-purple-900 border-purple-300';
                              label = lang === 'ja' ? '3. マネージャー承認' : '3. User Manager';
                            } else if (st === 'DISETUJUI') {
                              badgeBg = 'bg-emerald-100 text-emerald-900 border-emerald-300';
                              label = lang === 'ja' ? '4. GM最終承認' : '4. General Manager (Final)';
                            } else if (st === 'DITOLAK') {
                              badgeBg = 'bg-rose-100 text-rose-900 border-rose-300';
                              label = lang === 'ja' ? '却下' : 'Ditolak';
                            }
                            return (
                              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border inline-block ${badgeBg}`}>
                                {label}
                              </span>
                            );
                          })()}
                        </td>

                        <td className="p-3">
                          {isForwarded ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-1 rounded-full font-bold border border-emerald-200 inline-flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{lang === 'ja' ? '書類管理(Admin 2)同期済' : 'Tersinkron di ADMIN 2'}</span>
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-1 rounded-full font-bold border border-amber-200">
                              {lang === 'ja' ? '内部研修中' : 'Proses Internal'}
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {/* CV Button */}
                            <button
                              onClick={() => {
                                setCvModalStudent(s);
                                setCvModalInitialMode('CV');
                              }}
                              className="h-7 px-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 text-[11px] font-bold rounded-lg transition inline-flex items-center space-x-1 cursor-pointer"
                              title={lang === 'ja' ? 'JIS規格履歴書プレビュー' : 'Pratinjau CV Format Resmi JIS (Standard White Sheet)'}
                            >
                              <Eye className="w-3 h-3" />
                              <span>{lang === 'ja' ? '履歴書' : 'CV'}</span>
                            </button>

                            {/* Dokumen Button */}
                            <button
                              onClick={() => {
                                setCvModalStudent(s);
                                setCvModalInitialMode('DOKUMEN');
                              }}
                              className="h-7 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 text-[11px] font-bold rounded-lg transition inline-flex items-center space-x-1 cursor-pointer"
                              title={lang === 'ja' ? '提出書類確認' : 'Lihat 9 Dokumen Persyaratan & File Upload'}
                            >
                              <FileText className="w-3 h-3" />
                              <span>{lang === 'ja' ? '提出書類' : 'Dokumen'}</span>
                            </button>

                            {/* Jikoshoukai Button */}
                            <button
                              onClick={() => {
                                setCvModalStudent(s);
                                setCvModalInitialMode('JIKOSHOUKAI');
                              }}
                              className="h-7 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 text-[11px] font-bold rounded-lg transition inline-flex items-center space-x-1 cursor-pointer"
                              title={lang === 'ja' ? '自己紹介＆生徒進捗概要' : 'Ringkasan Profile & Status Progres Siswa'}
                            >
                              <User className="w-3 h-3" />
                              <span>{lang === 'ja' ? '自己紹介' : 'Jiko'}</span>
                            </button>

                            {/* Edit / Open Data Student Button */}
                            <button
                              onClick={() => {
                                setSelectedStudentId(s.id);
                                setEditingStudent(s);
                              }}
                              className={`h-7 px-2.5 rounded-lg text-[11px] font-bold transition inline-flex items-center space-x-1 cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300'
                              }`}
                              title={lang === 'ja' ? '生徒データ＆進捗の編集' : 'Edit Data Siswa & Progres Perkembangan'}
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>{isSelected ? (lang === 'ja' ? '編集中' : 'Edit') : (lang === 'ja' ? '編集' : 'Edit')}</span>
                            </button>

                            {!isForwarded && (
                              <button
                                onClick={() => forwardStudentToAdmin2(s.id)}
                                className="h-7 px-2.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg transition shadow-xs inline-flex items-center space-x-1 cursor-pointer"
                                title={lang === 'ja' ? '修了認定して Admin Doc に履歴書を作成' : 'Luluskan siswa & buat Rirekisho di Admin Doc'}
                              >
                                <Award className="w-3 h-3" />
                                <span>{lang === 'ja' ? 'Admin Doc' : 'Luluskan'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                      {lang === 'ja'
                        ? '該当する生徒データが見つかりませんでした。'
                        : 'Tidak ada siswa ditemukan berdasarkan kata kunci/filter.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================================== */}
      {/* SECTION B: REKAP DETAIL MASTER PROFIL SISWA TERPILIH                      */}
      {/* ======================================================================== */}
      {activeStudent ? (
        <>
          {/* Header Banner */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs tracking-wider uppercase">
                <Building2 className="w-4 h-4" />
                <span>{lang === 'ja' ? '生徒マスター統合ダッシュボード（生徒管理）' : 'DASHBOARD MASTER SISWA INTEGRATED (ADMIN SISWA)'}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mt-1">
                {lang === 'ja'
                  ? `健康診断・適性検査・DISC・学費・契約状況: ${activeStudent.namaLengkap}`
                  : `Rekam Medis, Psikotes, DISC, Pembiayaan & Kontrak: ${activeStudent.namaLengkap}`}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'ja'
                  ? 'LPK IJEF CORP 研修管理システム 6大モジュール統合要約'
                  : 'Rangkuman lengkap 6 modul utama sistem informasi manajemen LPK IJEF CORP.'}
              </p>
            </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setEditingStudent(activeStudent)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            <span>{lang === 'ja' ? '生徒情報・進捗編集' : 'Edit Data & Progres Siswa'}</span>
          </button>

          <button
            onClick={() => {
              setCvModalStudent(activeStudent);
              setCvModalInitialMode('CV');
            }}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>{lang === 'ja' ? 'JIS履歴書確認' : 'Lihat CV JIS'}</span>
          </button>

          <button
            onClick={() => {
              setCvModalStudent(activeStudent);
              setCvModalInitialMode('JIKOSHOUKAI');
            }}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>{lang === 'ja' ? '自己紹介＆進捗' : 'Jikoshoukai & Progres'}</span>
          </button>

          <button
            onClick={() => printDocumentElement('master-profile-doc')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'ja' ? '台帳印刷' : 'Cetak Profil Master'}</span>
          </button>

          <button
            onClick={() =>
              generatePdfFromElement(
                'master-profile-doc',
                `Profil_Master_LPK_IJEF_${activeStudent.namaLengkap}`
              )
            }
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{lang === 'ja' ? 'PDF出力' : 'Unduh Ringkasan PDF'}</span>
          </button>
        </div>
      </div>

      {/* ADMIN SISWA -> ADMIN DOC INTEGRATION WORKFLOW BANNER */}
      {(() => {
        const isForwarded =
          activeStudent.statusPendaftaran === 'Diterima' || !!rirekishoRecords[activeStudent.id];

        return (
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-slate-50 text-slate-800 rounded-xl p-5 border border-purple-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
                  {lang === 'ja' ? '生徒管理 → 書類管理（Admin Doc）データ連携ワークフロー' : 'Workflow Integrasi Data ADMIN SISWA → ADMIN DOC'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'ja'
                  ? '研修修了生データのJIS履歴書ポータル＆日本求人マッチングへの引き継ぎ'
                  : 'Penerusan Data Siswa Lulus Pelatihan ke Portal CV-Rirekisho & Job Matching Japan'}
              </h3>
              <p className="text-xs text-slate-600 max-w-2xl">
                {lang === 'ja'
                  ? '生徒管理で【修了認定（合格）】となった生徒は、自動的に書類管理ポータル（Admin Doc）に引き継がれ、JIS規格履歴書の作成および日本企業とのマッチング選考へ進みます。'
                  : 'Siswa yang telah dinyatakan LULUS (Diterima) di Admin Siswa akan secara otomatis diteruskan ke portal Admin Doc untuk proses pembuatan Rirekisho JIS & lamaran job matching perusahaan Jepang.'}
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-2.5">
              {isForwarded ? (
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-3.5 py-2 rounded-xl border border-emerald-300 font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'ja' ? 'ADMIN DOC 同期完了（マッチング可能）' : 'Tersinkron di ADMIN DOC (Siap Matching)'}</span>
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    forwardStudentToAdmin2(activeStudent.id);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>{lang === 'ja' ? '修了認定して ADMIN DOC へ引き継ぐ' : 'Luluskan & Teruskan Data ke ADMIN DOC'}</span>
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* PRINTABLE MASTER PROFILE CONTAINER */}
      <div id="master-profile-doc" className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white text-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <StudentPhotoBadge
              student={activeStudent}
              rirekisho={rirekishoRecords[activeStudent.id]}
              size="md"
              ratioLabel="4×6"
              lang={lang}
              theme="emerald"
              bordered={true}
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900">{activeStudent.namaLengkap}</h3>
                <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded border border-blue-200 font-semibold">
                  {activeStudent.statusPendaftaran}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'ja' ? '生徒ID:' : 'ID Siswa:'} <strong className="text-slate-800 font-mono">{activeStudent.id}</strong> | {lang === 'ja' ? '身分証番号:' : 'NIK KTP:'} <strong className="text-slate-800 font-mono">{activeStudent.noKtp}</strong> | {lang === 'ja' ? '性別:' : 'Jenis Kelamin:'} <strong className="text-slate-800 font-semibold">{getCandidateGender(activeStudent) === 'Laki-laki' ? (lang === 'ja' ? '♂ 男性 (Pria)' : '♂ Laki-laki (Pria)') : (lang === 'ja' ? '♀ 女性 (Wanita)' : '♀ Perempuan (Wanita)')}</strong>
                {(activeStudent.tanggalLahir || activeStudent.tempatLahir) && (
                  <> | {lang === 'ja' ? '生年月日・年齢:' : 'TTL & Usia:'} <strong className="text-slate-800 font-semibold">{activeStudent.tempatLahir ? `${activeStudent.tempatLahir}, ` : ''}{activeStudent.tanggalLahir || '-'} ({calculateAgeFromBirthDate(activeStudent.tanggalLahir, activeStudent.umur || 22)} {lang === 'ja' ? '歳' : 'Tahun'})</strong></>
                )}
              </p>
              <p className="text-xs text-slate-500">
                {lang === 'ja' ? '電話番号:' : 'HP:'} {activeStudent.noHp} | {lang === 'ja' ? 'メール:' : 'Email:'} {activeStudent.email} | {lang === 'ja' ? '現住所:' : 'Domisili:'} {activeStudent.alamatDomisili}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center min-w-[100px]">
              <span className="text-[10px] text-slate-500 block font-medium">
                {lang === 'ja' ? '健康診断' : 'Kesehatan Medis'}
              </span>
              <span
                className={`font-bold text-xs ${
                  health?.statusFit === 'FIT' ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {health ? health.statusFit : (lang === 'ja' ? '未受検' : 'Belum Ada')}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center min-w-[100px]">
              <span className="text-[10px] text-slate-500 block font-medium">
                {lang === 'ja' ? 'DISC適性' : 'Profil DISC'}
              </span>
              <span className="font-bold text-purple-700 text-xs">
                {disc ? disc.dominantType : (lang === 'ja' ? '未受検' : 'Belum Ada')}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center min-w-[100px]">
              <span className="text-[10px] text-slate-500 block font-medium">
                {lang === 'ja' ? '適性スコア' : 'Skor Psikotes'}
              </span>
              <span
                className={`font-bold text-xs ${
                  psikotes?.statusKelulusan === 'LULUS' ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {psikotes ? `${psikotes.scorePercentage}% (${psikotes.statusKelulusan === 'LULUS' ? (lang === 'ja' ? '合格' : 'LULUS') : (lang === 'ja' ? '不合格' : 'TIDAK LULUS')})` : (lang === 'ja' ? '未受験' : 'Belum Ada')}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center min-w-[100px]">
              <span className="text-[10px] text-slate-500 block font-medium">
                {lang === 'ja' ? '研修費用' : 'Biaya Pelatihan'}
              </span>
              <span className="font-bold text-indigo-700 text-xs">
                {dana ? (dana.namaPaketPelatihan ? (lang === 'ja' ? '研修プラン' : dana.namaPaketPelatihan.split(' ')[1] || 'LPK') : dana.programOption) : (lang === 'ja' ? '未設定' : 'Belum Ada')}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center min-w-[100px]">
              <span className="text-[10px] text-slate-500 block font-medium">
                {lang === 'ja' ? '契約合意' : 'Kontrak Perjanjian'}
              </span>
              <span className="font-bold text-emerald-700 text-xs">
                {kontrak ? ((kontrak as any).statusPersetujuan === 'DISETUJUI' ? (lang === 'ja' ? '締結完了' : 'DISETUJUI') : kontrak.statusPersetujuan) : (lang === 'ja' ? '下書き' : 'Draft')}
              </span>
            </div>
          </div>
        </div>

        {/* 6 Grid Cards for 6 Requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Health Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs">
                <Stethoscope className="w-4 h-4" />
                <span>{lang === 'ja' ? '1. 健康診断（MCUスクリーニング）' : '1. SKRINING KESEHATAN MEDIS'}</span>
              </div>
              <button
                onClick={() => setActiveTab('kesehatan')}
                className="text-blue-600 hover:underline text-[11px] font-semibold flex items-center space-x-0.5 cursor-pointer"
              >
                <span>{lang === 'ja' ? '編集' : 'Edit'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {health ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                  <span className="text-slate-600">{lang === 'ja' ? '適格判定:' : 'Status Kelaikan:'}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      health.statusFit === 'FIT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {health.statusFit}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  <strong>{lang === 'ja' ? '医師所見:' : 'Catatan Dokter:'}</strong> {health.catatanDokter}
                </p>
                <span className="text-[10px] text-slate-400 block italic">
                  {lang === 'ja' ? '評価担当:' : 'Evaluator:'} {health.evaluatorName}
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                {lang === 'ja' ? '健康診断データが未登録です。' : 'Belum ada rekam medis diisi.'}
              </p>
            )}
          </div>

          {/* 2. DISC Assessment */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-purple-600 font-bold text-xs">
                <Brain className="w-4 h-4" />
                <span>{lang === 'ja' ? '2. DISC性格行動特性診断' : '2. ASESMEN KEPRIBADIAN DISC'}</span>
              </div>
              <button
                onClick={() => setActiveTab('disc')}
                className="text-blue-600 hover:underline text-[11px] font-semibold flex items-center space-x-0.5 cursor-pointer"
              >
                <span>{lang === 'ja' ? '編集' : 'Edit'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {disc ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-purple-50 p-2 rounded text-purple-900">
                  <span className="font-medium">{lang === 'ja' ? '主要パーソナリティ特性:' : 'Tipe Kepribadian Utama:'}</span>
                  <strong className="font-bold text-purple-700">{disc.dominantType}</strong>
                </div>

                <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px] pt-1">
                  <div className="bg-rose-50 p-1 rounded text-rose-800">D: {disc.scoreD}</div>
                  <div className="bg-amber-50 p-1 rounded text-amber-800">I: {disc.scoreI}</div>
                  <div className="bg-emerald-50 p-1 rounded text-emerald-800">S: {disc.scoreS}</div>
                  <div className="bg-blue-50 p-1 rounded text-blue-800">C: {disc.scoreC}</div>
                </div>

                <p className="text-[10px] text-slate-600 line-clamp-2">{disc.description}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                {lang === 'ja' ? 'DISC診断データが未登録です。' : 'Belum ada tes DISC diisi.'}
              </p>
            )}
          </div>

          {/* 3. Psikotes 50 Soal */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs">
                <FileCheck className="w-4 h-4" />
                <span>{lang === 'ja' ? '3. 心理適性テスト（50問）' : '3. PSIKOTES (50 SOAL)'}</span>
              </div>
              <button
                onClick={() => setActiveTab('psikotes')}
                className="text-blue-600 hover:underline text-[11px] font-semibold flex items-center space-x-0.5 cursor-pointer"
              >
                <span>{lang === 'ja' ? '編集' : 'Edit'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {psikotes ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-blue-50 p-2 rounded text-blue-900">
                  <span>{lang === 'ja' ? '自動採点スコア:' : 'Skor Auto-Grade:'}</span>
                  <strong className="font-bold">
                    {psikotes.totalCorrect}/50 ({psikotes.scorePercentage}%)
                  </strong>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span>{lang === 'ja' ? '合否判定:' : 'Status Kelulusan:'}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      psikotes.statusKelulusan === 'LULUS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {psikotes.statusKelulusan === 'LULUS' ? (lang === 'ja' ? '合格' : 'LULUS') : (lang === 'ja' ? '不合格' : 'TIDAK LULUS')}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                {lang === 'ja' ? '適性テストデータが未受験です。' : 'Belum ada psikotes diisi.'}
              </p>
            )}
          </div>

          {/* 4. Registration & Family */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>{lang === 'ja' ? '4. 基本情報・家族情報' : '4. BIODATA & KELUARGA'}</span>
              </div>
              <button
                onClick={() => setActiveTab('portal')}
                className="text-blue-600 hover:underline text-[11px] font-semibold flex items-center space-x-0.5 cursor-pointer"
              >
                <span>{lang === 'ja' ? '編集' : 'Edit'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-700">
              <div className="flex justify-between">
                <span>{lang === 'ja' ? '実父:' : 'Ayah Kandung:'}</span>
                <strong className="text-slate-900">{activeStudent.namaAyah || '-'}</strong>
              </div>
              <div className="flex justify-between">
                <span>{lang === 'ja' ? '実母:' : 'Ibu Kandung:'}</span>
                <strong className="text-slate-900">{activeStudent.namaIbu || '-'}</strong>
              </div>
              <div className="flex justify-between">
                <span>{lang === 'ja' ? '提出書類:' : 'Dokumen Berkas:'}</span>
                <strong className="text-emerald-600">
                  {lang === 'ja'
                    ? `${Object.keys(activeStudent.berkasDokumen || {}).length} 件アップロード済`
                    : `${Object.keys(activeStudent.berkasDokumen || {}).length} File Terunggah`}
                </strong>
              </div>
            </div>
          </div>

          {/* 5. Biaya Pelatihan LPK */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs">
                <Coins className="w-4 h-4" />
                <span>{lang === 'ja' ? '5. LPK研修費用・学費管理' : '5. BIAYA PELATIHAN & PENDIDIKAN LPK'}</span>
              </div>
              <button
                onClick={() => setActiveTab('dana')}
                className="text-blue-600 hover:underline text-[11px] font-semibold flex items-center space-x-0.5 cursor-pointer"
              >
                <span>{lang === 'ja' ? '編集' : 'Edit'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {dana ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-indigo-50 p-2 rounded text-indigo-950">
                  <span>{lang === 'ja' ? '研修パッケージ:' : 'Paket Diklat:'}</span>
                  <strong className="font-bold text-[11px]">{dana.namaPaketPelatihan || (lang === 'ja' ? 'レギュラー対面研修プログラム' : 'Program Reguler Siswa Offline')}</strong>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span>{lang === 'ja' ? '基本研修費:' : 'Biaya Pokok Pelatihan:'}</span>
                  <strong className="font-mono font-bold text-slate-900">{formatRupiah(dana.biayaTotal || 10000000)}</strong>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span>{lang === 'ja' ? '頭金（前払金）:' : 'Uang Muka (DP):'}</span>
                  <strong className="font-mono text-emerald-700">{formatRupiah(dana.uangMukaDp || 0)}</strong>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span>{lang === 'ja' ? '支払スキーム:' : 'Skema Pembayaran:'}</span>
                  <strong className="font-semibold text-indigo-700">
                    {lang === 'ja'
                      ? (dana.skemaPembayaranPelatihan && SCHEME_TRANSLATIONS[dana.skemaPembayaranPelatihan]?.label) || dana.skemaLabel || (dana.programOption ? (dana.programOption === 'TALANGAN' ? '立替金スキーム' : '一括自己負担') : '一括・通常納入')
                      : (dana.skemaLabel || (dana.skemaPembayaranPelatihan ? dana.skemaPembayaranPelatihan.replace(/_/g, ' ') : dana.programOption))}
                  </strong>
                </div>

                {dana.persentaseBunga !== undefined && (
                  <div className="flex justify-between text-[11px] pt-1 border-t border-slate-100">
                    <span>{lang === 'ja' ? '金利/手数料:' : 'Suku Bunga LPK:'}</span>
                    <strong className={`font-mono ${dana.persentaseBunga > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {dana.persentaseBunga}% {dana.nominalBunga ? `(+ ${formatRupiah(dana.nominalBunga)})` : ''}
                    </strong>
                  </div>
                )}

                {dana.angsuranPerBulan && dana.angsuranPerBulan > 0 ? (
                  <div className="flex justify-between text-[11px]">
                    <span>{lang === 'ja' ? '月額分割払:' : 'Cicilan per Bulan:'}</span>
                    <strong className="font-mono text-indigo-800">
                      {formatRupiah(dana.angsuranPerBulan)}/{lang === 'ja' ? '月' : 'bln'} ({dana.tenorBulan}{lang === 'ja' ? '回' : 'x'})
                    </strong>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                {lang === 'ja' ? '学費スキームが未設定です。' : 'Belum ada skema biaya pelatihan dibuat.'}
              </p>
            )}
          </div>

          {/* 6. Surat Perjanjian */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs">
                <FileText className="w-4 h-4" />
                <span>{lang === 'ja' ? '6. 研修・就業合意誓約書' : '6. SURAT PERJANJIAN'}</span>
              </div>
              <button
                onClick={() => setActiveTab('kontrak')}
                className="text-blue-600 hover:underline text-[11px] font-semibold flex items-center space-x-0.5 cursor-pointer"
              >
                <span>{lang === 'ja' ? '編集' : 'Edit'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {kontrak ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-emerald-50 p-2 rounded text-emerald-900">
                  <span>{lang === 'ja' ? '契約書管理番号:' : 'No. Kontrak Legal:'}</span>
                  <strong className="font-mono text-[10px]">{kontrak.nomorSurat}</strong>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span>{lang === 'ja' ? '合意ステータス:' : 'Status Persetujuan:'}</span>
                  <strong className="text-emerald-700">
                    {lang === 'ja'
                      ? ((kontrak.statusPersetujuan as string) === 'SAH' ? '✓ 有効・締結済 (SAH)' : (kontrak.statusPersetujuan as string) === 'DRAFT' ? '下書き (DRAFT)' : (kontrak.statusPersetujuan as string) === 'DITOLAK' ? '却下 (DITOLAK)' : kontrak.statusPersetujuan)
                      : kontrak.statusPersetujuan}
                  </strong>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span>{lang === 'ja' ? '求人マッチング:' : 'Job Matching:'}</span>
                  <strong className="text-emerald-600">{lang === 'ja' ? '✓ 就業マッチング保証有効' : '✓ Garansi Penyaluran Aktif'}</strong>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                {lang === 'ja' ? '契約書が未作成です。' : 'Belum ada kontrak dibuat.'}
              </p>
            )}
          </div>
        </div>
      </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {lang === 'ja' ? '生徒データが選択されていません' : 'Tidak Ada Siswa Terpilih'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {lang === 'ja'
              ? '上の生徒一覧テーブルまたはカードから生徒を選択すると、6モジュールの詳細が表示されます。'
              : 'Silakan sesuaikan filter atau pilih siswa dari tabel / kartu di atas untuk melihat detail lengkap 6 modul profil master.'}
          </p>
        </div>
      )}

      {/* Student Edit Modal */}
      {editingStudent && (
        <StudentEditModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
        />
      )}

      {/* Student CV Modal Preview */}
      {cvModalStudent && (
        <StudentCVModal
          student={cvModalStudent}
          healthRecord={healthRecords[cvModalStudent.id]}
          discRecord={discRecords[cvModalStudent.id]}
          psikotesRecord={psikotesRecords[cvModalStudent.id]}
          rirekishoRecord={rirekishoRecords[cvModalStudent.id]}
          portalContext="ADMIN_1"
          initialMode={cvModalInitialMode}
          onClose={() => setCvModalStudent(null)}
        />
      )}

      {/* Google Drive Import Modal */}
      <GoogleDriveImportModal
        isOpen={showDriveModal}
        onClose={() => setShowDriveModal(false)}
      />

      {/* Duplicate Data Checker Modal */}
      <DuplicateDataCheckerModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        portalContext="ADMIN_SISWA"
        onSelectStudentToView={(id) => setSelectedStudentId(id)}
      />
    </div>
  );
};
