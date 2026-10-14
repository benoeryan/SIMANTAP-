/**
 * Centralized Shared Localization Dictionary (Ecosystem i18n)
 * Single Source of Truth for all portal translations across LPK IJEF CORP ecosystem.
 */

export type AppLanguage = 'id' | 'ja';

export interface EcosystemDictionary {
  // 1. Common / Shared Across All Portals
  common: {
    appName: string;
    systemTitle: string;
    indonesia: string;
    japanese: string;
    language: string;
    switchLanguage: string;
    menu: string;
    logout: string;
    login: string;
    back: string;
    save: string;
    saved: string;
    saving: string;
    cancel: string;
    delete: string;
    deleted: string;
    edit: string;
    search: string;
    filter: string;
    all: string;
    loading: string;
    status: string;
    action: string;
    actions: string;
    close: string;
    submit: string;
    submitting: string;
    next: string;
    prev: string;
    print: string;
    download: string;
    export: string;
    import: string;
    upload: string;
    view: string;
    details: string;
    confirm: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    candidate: string;
    candidates: string;
    students: string;
    partner: string;
    partners: string;
    admin: string;
    active: string;
    inactive: string;
    verified: string;
    pending: string;
    approved: string;
    rejected: string;
    revision: string;
    yearsOld: string;
    gender: string;
    male: string;
    female: string;
    age: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    city: string;
    birthDate: string;
    birthPlace: string;
    religion: string;
    maritalStatus: string;
    single: string;
    married: string;
    jobSector: string;
    category: string;
    notes: string;
    updatedAt: string;
    createdAt: string;
    realtimeSync: string;
    totalRecords: string;
    noDataFound: string;
    processing: string;
  };

  // 2. Admin 2 - CV Portal & Job Matching Back-Office
  adminDoc: {
    portalBadge: string;
    portalTitle: string;
    portalSubtitle: string;
    activeVerifier: string;
    // Navigation Tabs
    tabMonitoring: string;
    tabMonitoringDesc: string;
    tabCandidates: string;
    tabCandidatesDesc: string;
    tabJobs: string;
    tabJobsDesc: string;
    tabApplications: string;
    tabApplicationsDesc: string;
    tabDepartureFinancing: string;
    tabDepartureFinancingDesc: string;
    tabMitraApproval: string;
    tabMitraApprovalDesc: string;
    tabRegisteredMitra: string;
    tabRegisteredMitraDesc: string;
    tabAccountsRoles: string;
    tabAccountsRolesDesc: string;
    tabSettings: string;
    tabSettingsDesc: string;
    tabGuide: string;
    tabGuideDesc: string;
    // Actions & Tools
    syncDrive: string;
    syncDriveDesc: string;
    importSpreadsheet: string;
    importSpreadsheetDesc: string;
    exportExcel: string;
    katakanaConverter: string;
    autoTranslateCV: string;
    addCandidate: string;
    addJob: string;
    searchPlaceholder: string;
    filterCategory: string;
    filterSector: string;
    filterPrefecture: string;
    filterStatus: string;
    filterBatch: string;
    resetFilter: string;
    // Metrics
    totalCandidates: string;
    readyForMatching: string;
    activeJobVacancies: string;
    inInterviewProcess: string;
    passedInterview: string;
    mitraPendingApproval: string;
    registeredPartnersCount: string;
    // Table Headers
    thCandidateInfo: string;
    thCategoryOrigin: string;
    thMatchingSector: string;
    thJapaneseLevel: string;
    thSelectionStatus: string;
    thCVRirekisho: string;
    thActions: string;
    // Modals & Banners
    confirmDeleteCandidate: string;
    confirmDeleteJob: string;
    candidateSavedSuccess: string;
    jobSavedSuccess: string;
    rirekishoGeneratedSuccess: string;
    driveSyncComplete: string;
  };

  // 3. Admin 1 - SIM-SB IJEF Back-Office
  adminSiswa: {
    portalBadge: string;
    portalTitle: string;
    portalSubtitle: string;
    tabMaster: string;
    tabMasterDesc: string;
    tabRegistration: string;
    tabRegistrationDesc: string;
    tabHealth: string;
    tabHealthDesc: string;
    tabDisc: string;
    tabDiscDesc: string;
    tabPsikotes: string;
    tabPsikotesDesc: string;
    tabFinancing: string;
    tabFinancingDesc: string;
    tabContracts: string;
    tabContractsDesc: string;
    studentDatabaseTitle: string;
    addNewStudent: string;
    forwardToAdmin2: string;
    forwardSuccess: string;
    forwardAll: string;
    forwardSelected: string;
    printCV: string;
    mcuFitCount: string;
    discCompletedCount: string;
    psikotesPassedCount: string;
    contractSignedCount: string;
    financeDisbursedCount: string;
  };

  // 4. Candidate Self-Service Portal
  candidatePortal: {
    headerTitle: string;
    headerSubtitle: string;
    welcomeBack: string;
    pipelineStage: string;
    step1Title: string;
    step2Title: string;
    step3Title: string;
    step4Title: string;
    step5Title: string;
    step6Title: string;
    step7Title: string;
    readyForInterview: string;
    inTraining: string;
    docsVerified: string;
    docsPending: string;
    startDiscTest: string;
    startPsikotesTest: string;
    scoreResult: string;
    uploadPhotoInstruction: string;
    saveChanges: string;
    ktpNik: string;
    kkNumber: string;
    heightWeight: string;
    bloodType: string;
    japaneseSkillLevel: string;
    targetJobSector: string;
  };

  // 5. Mitra / LPK Partner Portal
  mitraPortal: {
    headerBadge: string;
    headerSubtitle: string;
    tabDashboard: string;
    tabJobs: string;
    tabStudents: string;
    tabApplications: string;
    activeJobsCount: string;
    readyCandidatesCount: string;
    matchedCount: string;
    partnerInfo: string;
    createJobBtn: string;
    applyCandidateBtn: string;
    searchJobsPlaceholder: string;
    searchStudentsPlaceholder: string;
    jobSectorFilter: string;
    japaneseLevelFilter: string;
    viewStudentCV: string;
    nominateCandidate: string;
    applicationStatus: string;
    companyName: string;
    location: string;
    salary: string;
    quota: string;
    requirements: string;
    interviewDate: string;
    selectionStage: string;
  };

  // 6. Role & Super Admin Management
  roleManagement: {
    headerBadge: string;
    headerTitle: string;
    headerSubtitle: string;
    appointSuperAdmin: string;
    addNewAccount: string;
    totalAccounts: string;
    superAdminsCount: string;
    admin2Count: string;
    admin1Count: string;
    marketingCount: string;
    staffCount: string;
    mitraStudentsCount: string;
    tabAccountList: string;
    tabAuditLogs: string;
    tabAccessMatrix: string;
    searchAccountPlaceholder: string;
    filterRole: string;
    filterStatus: string;
    thAccountUser: string;
    thRoleDesignation: string;
    thDepartmentScope: string;
    thAuthStatus: string;
    thLastLogin: string;
    thActionManage: string;
  };

  // 7. Mitra Approval & Submissions
  mitraApproval: {
    headerBadge: string;
    headerTitle: string;
    headerSubtitle: string;
    activeVerifier: string;
    statTotal: string;
    statPending: string;
    statApproved: string;
    statRevision: string;
    statRejected: string;
    filterAllSubmissions: string;
    filterStudentReg: string;
    filterPartnerJobs: string;
    filterNominations: string;
    btnApprove: string;
    btnRequestRevision: string;
    btnReject: string;
    revisionNotesPlaceholder: string;
    statusApprovedAlert: string;
    statusRejectedAlert: string;
  };

  // 8. Job Matching & Catalog
  jobMatching: {
    catalogTitle: string;
    catalogSubtitle: string;
    jobCode: string;
    companyName: string;
    workLocation: string;
    prefecture: string;
    baseSalary: string;
    netEstimate: string;
    jobRequirements: string;
    genderReq: string;
    ageLimit: string;
    japaneseReq: string;
    selectionStatus: string;
    scheduleInterview: string;
    interviewDate: string;
    interviewPlatform: string;
    matchedCandidatesCount: string;
    matchCandidateBtn: string;
  };

  // 9. Biaya Keberangkatan & Departure Preparation
  biayaKeberangkatan: {
    title: string;
    subtitle: string;
    totalEstimatedCost: string;
    loanAssistanceCoverage: string;
    selfFundedCoverage: string;
    salaryDeductionPlan: string;
    visaPassportPrep: string;
    flightTicketPrep: string;
    medicalFinalJepang: string;
    insuranceCoverage: string;
    livingCostFirstMonth: string;
    simulateFinancing: string;
  };
}

export const ECOSYSTEM_DICTIONARY: Record<AppLanguage, EcosystemDictionary> = {
  id: {
    common: {
      appName: 'LPK IJEF CORP',
      systemTitle: 'Sistem Informasi Manajemen Pelatihan & Penempatan Kerja Jepang Terpadu',
      indonesia: 'Indonesia (ID)',
      japanese: 'Jepang (日本語)',
      language: 'Bahasa',
      switchLanguage: 'Ganti Bahasa',
      menu: 'Menu',
      logout: 'Keluar',
      login: 'Masuk',
      back: 'Kembali',
      save: 'Simpan',
      saved: 'Tersimpan',
      saving: 'Menyimpan...',
      cancel: 'Batal',
      delete: 'Hapus',
      deleted: 'Dihapus',
      edit: 'Edit',
      search: 'Cari data...',
      filter: 'Filter',
      all: 'Semua',
      loading: 'Memuat data...',
      status: 'Status',
      action: 'Aksi',
      actions: 'Aksi Kelola',
      close: 'Tutup',
      submit: 'Kirim',
      submitting: 'Mengirim...',
      next: 'Selanjutnya',
      prev: 'Sebelumnya',
      print: 'Cetak',
      download: 'Unduh',
      export: 'Ekspor',
      import: 'Impor',
      upload: 'Unggah',
      view: 'Lihat',
      details: 'Detail',
      confirm: 'Konfirmasi',
      success: 'Berhasil',
      error: 'Terjadi Kesalahan',
      warning: 'Peringatan',
      info: 'Informasi',
      candidate: 'Kandidat',
      candidates: 'Kandidat Siap Kerja',
      students: 'Siswa Binaan',
      partner: 'Mitra',
      partners: 'Lembaga Mitra',
      admin: 'Administrator',
      active: 'Aktif',
      inactive: 'Nonaktif',
      verified: 'Terverifikasi',
      pending: 'Menunggu',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      revision: 'Perlu Revisi',
      yearsOld: 'Tahun',
      gender: 'Jenis Kelamin',
      male: 'Laki-laki',
      female: 'Perempuan',
      age: 'Usia',
      phone: 'No. Telepon',
      whatsapp: 'WhatsApp',
      email: 'Email',
      address: 'Alamat',
      city: 'Kota / Wilayah',
      birthDate: 'Tanggal Lahir',
      birthPlace: 'Tempat Lahir',
      religion: 'Agama',
      maritalStatus: 'Status Nikah',
      single: 'Belum Menikah (Lajang)',
      married: 'Menikah',
      jobSector: 'Sektor Pekerjaan',
      category: 'Kategori',
      notes: 'Catatan',
      updatedAt: 'Terakhir Diperbarui',
      createdAt: 'Dibuat Pada',
      realtimeSync: 'Tersinkron Realtime',
      totalRecords: 'Total Data',
      noDataFound: 'Tidak ada data ditemukan.',
      processing: 'Sedang memproses...'
    },

    adminDoc: {
      portalBadge: 'PORTAL ADMIN DOC (CV PORTAL & JOB MATCHING)',
      portalTitle: 'Pusat Manajemen Kandidat, CV Rirekisho & Matching Job Jepang',
      portalSubtitle: 'Sistem Terpadu Verifikasi Berkas, Otomatisasi Terjemahan Rirekisho Bahasa Jepang, Penjadwalan Interview, dan Pengawasan LPK Mitra.',
      activeVerifier: 'Verifikator Aktif Saat Ini:',
      tabMonitoring: 'Monitoring & Matriks',
      tabMonitoringDesc: 'Statistik & Ringkasan Pipeline',
      tabCandidates: 'Database Kandidat',
      tabCandidatesDesc: 'Kelola Profil & CV Rirekisho',
      tabJobs: 'Katalog Lowongan Job',
      tabJobsDesc: 'Daftar Job Jepang & Kuota',
      tabApplications: 'Matching & Interview',
      tabApplicationsDesc: 'Proses Seleksi & Wawancara',
      tabDepartureFinancing: 'Biaya Keberangkatan',
      tabDepartureFinancingDesc: 'Rincian Visa & Tiket Pesawat',
      tabMitraApproval: 'Pusat Approval Mitra',
      tabMitraApprovalDesc: 'Otorisasi 3 Jalur Pengajuan',
      tabRegisteredMitra: 'Mitra Terdaftar',
      tabRegisteredMitraDesc: 'Manajemen Akun & Lembaga Partner',
      tabAccountsRoles: 'Kelola Role & Akun',
      tabAccountsRolesDesc: 'Penunjukan Super Admin & Wewenang',
      tabSettings: 'Pengaturan Master',
      tabSettingsDesc: 'Konfigurasi Parameter Sistem',
      tabGuide: 'Petunjuk Penggunaan',
      tabGuideDesc: 'Panduan Operasional & Alur',
      syncDrive: 'Sinkronisasi Google Drive',
      syncDriveDesc: 'Tarik berkas lamaran dari folder Drive',
      importSpreadsheet: 'Impor Spreadsheet',
      importSpreadsheetDesc: 'Upload massal data kandidat & job',
      exportExcel: 'Ekspor Excel / CSV',
      katakanaConverter: 'Konversi Katakana',
      autoTranslateCV: 'Auto Terjemah CV Rirekisho',
      addCandidate: 'Tambah Kandidat Baru',
      addJob: 'Tambah Lowongan Baru',
      searchPlaceholder: 'Cari nama kandidat, ID, email, sektor, keahlian, atau kota...',
      filterCategory: 'Kategori Kandidat',
      filterSector: 'Sektor Pekerjaan',
      filterPrefecture: 'Prefektur Jepang',
      filterStatus: 'Status Matching',
      filterBatch: 'Gelombang Batch',
      resetFilter: 'Reset Filter',
      totalCandidates: 'Total Kandidat Terdaftar',
      readyForMatching: 'Siap Matching (Ready)',
      activeJobVacancies: 'Lowongan Job Aktif',
      inInterviewProcess: 'Tahap Wawancara / Interview',
      passedInterview: 'Lulus Seleksi & Terpilih',
      mitraPendingApproval: 'Menunggu Approval Mitra',
      registeredPartnersCount: 'Lembaga Mitra Terdaftar',
      thCandidateInfo: 'Kandidat & Kontak',
      thCategoryOrigin: 'Kategori & Asal Lembaga',
      thMatchingSector: 'Sektor Minat',
      thJapaneseLevel: 'Level Bahasa Jepang',
      thSelectionStatus: 'Status Seleksi',
      thCVRirekisho: 'CV Rirekisho',
      thActions: 'Aksi Kelola',
      confirmDeleteCandidate: 'Apakah Anda yakin ingin menghapus data kandidat ini secara permanen?',
      confirmDeleteJob: 'Apakah Anda yakin ingin menghapus lowongan pekerjaan ini?',
      candidateSavedSuccess: 'Data kandidat berhasil disimpan ke sistem dan database cloud.',
      jobSavedSuccess: 'Lowongan pekerjaan berhasil diperbarui.',
      rirekishoGeneratedSuccess: 'CV Rirekisho format standar Jepang berhasil digenerate otomatis.',
      driveSyncComplete: 'Sinkronisasi Google Drive berhasil diselesaikan.'
    },

    adminSiswa: {
      portalBadge: 'PORTAL ADMIN SISWA (SIM-SB IJEF)',
      portalTitle: 'Sistem Informasi Manajemen Siswa Binaan LPK IJEF',
      portalSubtitle: 'Pusat operasional data calon siswa, verifikasi pendaftaran, skrining kesehatan MCU, asesmen DISC, psikotes, dan kontrak perjanjian.',
      tabMaster: 'Dashboard Master Siswa',
      tabMasterDesc: 'Database Ringkasan Siswa',
      tabRegistration: '1. Portal Pendaftaran',
      tabRegistrationDesc: 'Registrasi & Dokumen Siswa',
      tabHealth: '2. Skrining Kesehatan',
      tabHealthDesc: 'Fit To Work & Lab Medis',
      tabDisc: '3. Asesmen DISC',
      tabDiscDesc: 'Profil Kepribadian Kerja',
      tabPsikotes: '4. Psikotes 50 Soal',
      tabPsikotesDesc: 'Logika & Kuantitatif',
      tabFinancing: '5. Biaya Pelatihan LPK',
      tabFinancingDesc: 'Pembiayaan & Pendidikan LPK',
      tabContracts: '6. Surat Perjanjian',
      tabContractsDesc: 'Legalitas & Pasal Kerja',
      studentDatabaseTitle: 'Database Siswa Binaan IJEF',
      addNewStudent: 'Daftarkan Siswa Baru',
      forwardToAdmin2: 'Teruskan ke Admin Doc (Matching)',
      forwardSuccess: 'Siswa terpilih berhasil diteruskan ke database Matching Job Admin 2.',
      forwardAll: 'Teruskan Semua Siap Matching',
      forwardSelected: 'Teruskan Siswa Terpilih',
      printCV: 'Cetak Biodata Siswa',
      mcuFitCount: 'MCU Sehat (Fit)',
      discCompletedCount: 'DISC Selesai',
      psikotesPassedCount: 'Psikotes Lulus',
      contractSignedCount: 'SPK Ditandatangani',
      financeDisbursedCount: 'Pembiayaan Terverifikasi'
    },

    candidatePortal: {
      headerTitle: 'Portal Mandiri Calon Siswa & Kandidat Jepang',
      headerSubtitle: 'Lengkapi biodata, unggah dokumen persyaratan, ikuti tes asesmen, dan pantau status kelolosan lowongan kerja Jepang Anda.',
      welcomeBack: 'Selamat Datang Kembali',
      pipelineStage: 'Tahapan Saat Ini',
      step1Title: '1. Biodata & Data Diri',
      step2Title: '2. Unggah Dokumen KTP & Ijazah',
      step3Title: '3. Skrining Medis (MCU)',
      step4Title: '4. Asesmen DISC & Kepribadian',
      step5Title: '5. Psikotes Kemampuan Kerja',
      step6Title: '6. Dukungan Dana Talang',
      step7Title: '7. Surat Perjanjian SPK',
      readyForInterview: 'Kandidat Siap Wawancara',
      inTraining: 'Dalam Pelatihan Bahasa',
      docsVerified: 'Dokumen Terverifikasi',
      docsPending: 'Menunggu Verifikasi',
      startDiscTest: 'Mulai Tes DISC',
      startPsikotesTest: 'Mulai Tes Psikotes',
      scoreResult: 'Hasil Nilai:',
      uploadPhotoInstruction: 'Unggah pas foto formal berpakaian rapi dengan latar belakang merah atau biru.',
      saveChanges: 'Simpan Perubahan Data',
      ktpNik: 'Nomor KTP (NIK)',
      kkNumber: 'Nomor Kartu Keluarga',
      heightWeight: 'Tinggi & Berat Badan',
      bloodType: 'Golongan Darah',
      japaneseSkillLevel: 'Kemampuan Bahasa Jepang',
      targetJobSector: 'Sektor Bidang Pekerjaan'
    },

    mitraPortal: {
      headerBadge: 'PORTAL MITRA RESMI / LPK SENDING ORGANIZATION',
      headerSubtitle: 'Kelola pengajuan lowongan kerja mandiri, nominasi siswa binaan siap matching, dan pantau status persetujuan dari Admin Doc IJEF.',
      tabDashboard: 'Dashboard Mitra',
      tabJobs: 'Lowongan Job Mitra',
      tabStudents: 'Siswa Binaan Mitra',
      tabApplications: 'Status Pengajuan & Nominasi',
      activeJobsCount: 'Lowongan Job Dibuka',
      readyCandidatesCount: 'Siswa Siap Matching',
      matchedCount: 'Berhasil Diterima Kerja',
      partnerInfo: 'Informasi Lembaga Mitra',
      createJobBtn: 'Tambah Lowongan Baru',
      applyCandidateBtn: 'Nominasikan Siswa',
      searchJobsPlaceholder: 'Cari lowongan pekerjaan...',
      searchStudentsPlaceholder: 'Cari siswa binaan...',
      jobSectorFilter: 'Semua Sektor',
      japaneseLevelFilter: 'Semua Level Bahasa',
      viewStudentCV: 'Lihat CV Siswa',
      nominateCandidate: 'Daftarkan ke Job',
      applicationStatus: 'Status Nominasi',
      companyName: 'Nama Perusahaan Jepang',
      location: 'Lokasi Penempatan',
      salary: 'Estimasi Gaji Bersih',
      quota: 'Kuota Dibutuhkan',
      requirements: 'Syarat & Kualifikasi',
      interviewDate: 'Jadwal Interview',
      selectionStage: 'Tahap Seleksi'
    },

    roleManagement: {
      headerBadge: 'OTORISASI & MANAJEMEN AKUN TERPUSAT ADMIN DOC',
      headerTitle: 'Pengelolaan Seluruh Akun & Penunjukan Super Admin',
      headerSubtitle: 'Wewenang penuh Admin Doc untuk mengelola akun sistem, menunjuk/mengangkat Super Admin, mengonfigurasi hak akses role, dan memonitor seluruh akun staf, mitra, serta kandidat.',
      appointSuperAdmin: '👑 Tunjuk / Buat Super Admin',
      addNewAccount: 'Tambah Akun Baru',
      totalAccounts: 'Total Seluruh Akun',
      superAdminsCount: 'Super Admin',
      admin2Count: 'Admin Doc (CV Portal)',
      admin1Count: 'Admin Siswa (SIM-SB)',
      marketingCount: 'Tim Marketing',
      staffCount: 'Staf Medis / HR / Fin',
      mitraStudentsCount: 'Akun Siswa / Mitra',
      tabAccountList: 'Daftar Seluruh Akun & Otoritas Role',
      tabAuditLogs: 'Log Audit & Riwayat Penunjukan Role',
      tabAccessMatrix: 'Matriks Hak Akses Per Role',
      searchAccountPlaceholder: 'Cari berdasarkan nama, email, NIK, peran, atau departemen...',
      filterRole: 'Semua Peran (Roles)',
      filterStatus: 'Semua Status',
      thAccountUser: 'Pengguna & Email',
      thRoleDesignation: 'Peran & Tingkat Otoritas',
      thDepartmentScope: 'Departemen / Wilayah',
      thAuthStatus: 'Status Akun',
      thLastLogin: 'Aktivitas Terakhir',
      thActionManage: 'Aksi Kelola'
    },

    mitraApproval: {
      headerBadge: 'Sistem Otorisasi & Verifikasi Back-Office Admin Doc',
      headerTitle: 'Pusat Approval Pengajuan Mitra',
      headerSubtitle: 'Kelola dan validasi 3 jalur pengajuan kemitraan: (1) Registrasi Siswa Binaan Baru, (2) Penambahan Lowongan Pekerjaan Mandiri (Job Mitra), dan (3) Pendaftaran/Nominasi Siswa ke Lowongan Job Jepang.',
      activeVerifier: 'Verifikator Aktif Saat Ini:',
      statTotal: 'Total Masuk',
      statPending: 'Perlu Review',
      statApproved: 'Disetujui',
      statRevision: 'Perlu Revisi',
      statRejected: 'Ditolak',
      filterAllSubmissions: 'Semua Pengajuan',
      filterStudentReg: 'Registrasi Siswa Baru',
      filterPartnerJobs: 'Lowongan Job Mitra',
      filterNominations: 'Lamaran / Nominasi Siswa',
      btnApprove: 'Setujui Pengajuan (Approve)',
      btnRequestRevision: 'Minta Revisi Mitra',
      btnReject: 'Tolak Pengajuan',
      revisionNotesPlaceholder: 'Tuliskan catatan detail revisi yang harus diperbaiki mitra...',
      statusApprovedAlert: 'Pengajuan telah disetujui dan data resmi aktif di sistem.',
      statusRejectedAlert: 'Pengajuan ditolak oleh Admin Doc.'
    },

    jobMatching: {
      catalogTitle: 'Katalog Lowongan Kerja Jepang (SSW & Tokutei Ginou)',
      catalogSubtitle: 'Daftar kebutuhan tenaga kerja dari Kaisha & Kumiai Jepang terverifikasi.',
      jobCode: 'Kode Job',
      companyName: 'Perusahaan Penerima (Kaisha)',
      workLocation: 'Prefektur & Lokasi Kerja',
      prefecture: 'Prefektur',
      baseSalary: 'Gaji Pokok / Bulan',
      netEstimate: 'Estimasi Gaji Bersih (Take Home Pay)',
      jobRequirements: 'Kualifikasi & Persyaratan',
      genderReq: 'Syarat Gender',
      ageLimit: 'Batas Usia',
      japaneseReq: 'Syarat Sertifikat Bahasa',
      selectionStatus: 'Status Seleksi',
      scheduleInterview: 'Jadwalkan Wawancara (Interview)',
      interviewDate: 'Tanggal Wawancara',
      interviewPlatform: 'Media Wawancara (Zoom / Teams)',
      matchedCandidatesCount: 'Kandidat Cocok',
      matchCandidateBtn: 'Pilih & Pasangkan Kandidat'
    },

    biayaKeberangkatan: {
      title: 'Simulasi & Rincian Biaya Keberangkatan Jepang',
      subtitle: 'Transparansi pembiayaan pra-keberangkatan, dana talang LPK, tiket penerbangan, pengurusan visa kerja, dan skema cicilan potong gaji.',
      totalEstimatedCost: 'Total Estimasi Biaya Keberangkatan',
      loanAssistanceCoverage: 'Ditanggung Dana Talang LPK',
      selfFundedCoverage: 'Biaya Mandiri / DP Awal',
      salaryDeductionPlan: 'Skema Cicilan Potong Gaji di Jepang',
      visaPassportPrep: 'Pembuatan Paspor & Visa Tokutei Ginou',
      flightTicketPrep: 'Tiket Pesawat Indonesia - Jepang',
      medicalFinalJepang: 'Medical Checkup Akhir Standar Imigrasi',
      insuranceCoverage: 'Asuransi Perjalanan & Perlindungan Kerja',
      livingCostFirstMonth: 'Uang Saku Hidup Bulan Pertama',
      simulateFinancing: 'Simulasikan Angsuran Bulanan'
    }
  },

  ja: {
    common: {
      appName: 'LPK IJEF CORP',
      systemTitle: '日本就労・特定技能育成・求人マッチング統合管理システム',
      indonesia: 'インドネシア (ID)',
      japanese: '日本語 (JA)',
      language: '言語切替',
      switchLanguage: '言語を変更',
      menu: 'メニュー',
      logout: 'ログアウト',
      login: 'ログイン',
      back: '戻る',
      save: '保存',
      saved: '保存完了',
      saving: '保存中...',
      cancel: 'キャンセル',
      delete: '削除',
      deleted: '削除完了',
      edit: '編集',
      search: '検索...',
      filter: 'フィルター',
      all: 'すべて',
      loading: 'データ読込中...',
      status: 'ステータス',
      action: '操作',
      actions: '管理操作',
      close: '閉じる',
      submit: '送信・申請',
      submitting: '送信中...',
      next: '次へ',
      prev: '前へ',
      print: '印刷',
      download: 'ダウンロード',
      export: 'エクスポート',
      import: 'インポート',
      upload: 'アップロード',
      view: '閲覧',
      details: '詳細情報',
      confirm: '確認・実行',
      success: '処理が完了しました',
      error: 'エラーが発生しました',
      warning: '警告',
      info: '案内',
      candidate: '候補者',
      candidates: '就労可能候補者',
      students: '育成生徒',
      partner: '提携機関',
      partners: '提携機関 (LPK)',
      admin: 'システム管理者',
      active: '有効',
      inactive: '無効・停止',
      verified: '認証済',
      pending: '承認待ち',
      approved: '承認済',
      rejected: '却下',
      revision: '要修正',
      yearsOld: '歳',
      gender: '性別',
      male: '男性',
      female: '女性',
      age: '年齢',
      phone: '電話番号',
      whatsapp: 'WhatsApp連絡先',
      email: 'メールアドレス',
      address: '住所',
      city: '所在地・地域',
      birthDate: '生年月日',
      birthPlace: '出生地',
      religion: '宗教',
      maritalStatus: '配偶者有無',
      single: '独身 (未婚)',
      married: '既婚',
      jobSector: '希望職種・分野',
      category: '区分',
      notes: '備考・特記事項',
      updatedAt: '最終更新日時',
      createdAt: '作成日時',
      realtimeSync: 'リアルタイム同期中',
      totalRecords: 'データ総数',
      noDataFound: '対象データが見つかりません。',
      processing: '処理中...'
    },

    adminDoc: {
      portalBadge: 'ADMIN DOC ポータル（CV作成＆求人マッチング）',
      portalTitle: '候補者台帳・履歴書自動生成・日本求人マッチング統合管理',
      portalSubtitle: '書類審査、日本標準様式履歴書（JIS）の自動日本語翻訳、面接スケジューリング、提携送り出し機関の統合承認システム。',
      activeVerifier: '現在の担当検証者:',
      tabMonitoring: 'モニタリング＆統計',
      tabMonitoringDesc: '進行状況と全体パイプライン',
      tabCandidates: '候補者データベース',
      tabCandidatesDesc: 'プロフィール＆履歴書管理',
      tabJobs: '日本求人台帳',
      tabJobsDesc: '求人票・募集要項・採用枠',
      tabApplications: 'マッチング＆面接管理',
      tabApplicationsDesc: '選考進捗・面接選考日程',
      tabDepartureFinancing: '渡航前費用・資金計画',
      tabDepartureFinancingDesc: 'ビザ申請・航空券・渡航費',
      tabMitraApproval: '提携機関申請承認',
      tabMitraApprovalDesc: '3系統の申請承認・審査',
      tabRegisteredMitra: '提携機関一覧',
      tabRegisteredMitraDesc: '提携校・送り出し機関管理',
      tabAccountsRoles: '権限・アカウント管理',
      tabAccountsRolesDesc: 'スーパー管理者任命＆権限設定',
      tabSettings: 'マスター設定',
      tabSettingsDesc: '運用パラメータ・費用設定',
      tabGuide: '利用ガイド・マニュアル',
      tabGuideDesc: '操作フロー＆利用手順',
      syncDrive: 'Googleドライブ同期',
      syncDriveDesc: '共有ドライブから応募書類を取得',
      importSpreadsheet: 'スプレッドシート一括インポート',
      importSpreadsheetDesc: '候補者＆求人データを一括取込',
      exportExcel: 'Excel/CSVエクスポート',
      katakanaConverter: 'カタカナ変換ツール',
      autoTranslateCV: '履歴書自動日本語翻訳',
      addCandidate: '新規候補者登録',
      addJob: '新規求人票作成',
      searchPlaceholder: '氏名、ID、メール、希望職種、資格、所在地で検索...',
      filterCategory: '候補者区分',
      filterSector: '職種・産業分野',
      filterPrefecture: '配属先都道府県',
      filterStatus: 'マッチング状況',
      filterBatch: '研修期生 (Batch)',
      resetFilter: '条件リセット',
      totalCandidates: '登録候補者総数',
      readyForMatching: 'マッチング可能 (Ready)',
      activeJobVacancies: '募集中求人総数',
      inInterviewProcess: '面接選考中',
      passedInterview: '内定獲得・採用決定',
      mitraPendingApproval: '承認待ち申請件数',
      registeredPartnersCount: '提携送り出し機関数',
      thCandidateInfo: '候補者情報・連絡先',
      thCategoryOrigin: '区分・所属機関',
      thMatchingSector: '希望職種・分野',
      thJapaneseLevel: '日本語能力',
      thSelectionStatus: '選考ステータス',
      thCVRirekisho: '履歴書 (CV)',
      thActions: '管理操作',
      confirmDeleteCandidate: 'この候補者データを完全に削除してもよろしいですか？',
      confirmDeleteJob: 'この求人票を削除してもよろしいですか？',
      candidateSavedSuccess: '候補者データがシステムおよびクラウドDBに正常に保存されました。',
      jobSavedSuccess: '求人票情報が更新されました。',
      rirekishoGeneratedSuccess: '日本標準様式（JIS規格）の履歴書データが自動生成されました。',
      driveSyncComplete: 'Googleドライブの同期が正常に完了しました。'
    },

    adminSiswa: {
      portalBadge: '生徒管理ポータル（SIM-SB IJEF）',
      portalTitle: 'LPK IJEF 生徒管理・育成バックオフィスシステム',
      portalSubtitle: '生徒基本台帳、入学手続き、健康診断（MCU）、DISC適性診断、心理テスト、および教育契約の統合管理。',
      tabMaster: '生徒マスターダッシュボード',
      tabMasterDesc: '生徒総合データベース',
      tabRegistration: '1. 生徒受付・登録',
      tabRegistrationDesc: '登録情報・提出書類管理',
      tabHealth: '2. 健康診断（MCU）',
      tabHealthDesc: 'Fit To Work判定・検査所見',
      tabDisc: '3. DISC適性診断',
      tabDiscDesc: '行動特性・職場適性分析',
      tabPsikotes: '4. 心理適性テスト（50問）',
      tabPsikotesDesc: '論理・計算・業務適性',
      tabFinancing: '5. 研修費用・サポート資金',
      tabFinancingDesc: '学費支援・分割計画管理',
      tabContracts: '6. 契約書・誓約書',
      tabContractsDesc: '法的合意書・権利義務条項',
      studentDatabaseTitle: 'IJEF育成生徒マスターデータベース',
      addNewStudent: '新規生徒を登録',
      forwardToAdmin2: 'Admin Doc (マッチング) へ連携',
      forwardSuccess: '対象生徒がAdmin 2求人マッチング台帳へ引き継がれました。',
      forwardAll: '準備完了生徒を一括連携',
      forwardSelected: '選択した生徒を連携',
      printCV: '生徒台帳印刷',
      mcuFitCount: '健康診断合格 (Fit)',
      discCompletedCount: 'DISC診断完了',
      psikotesPassedCount: '適性テスト合格',
      contractSignedCount: '契約書締結済',
      financeDisbursedCount: '学費支援審査済'
    },

    candidatePortal: {
      headerTitle: '日本就労希望者・研修生 専用ポータル',
      headerSubtitle: '個人情報の登録、必要書類の提出、適性診断の受検、および日本求人の選考状況の確認を行えます。',
      welcomeBack: 'おかえりなさい',
      pipelineStage: '現在の進捗ステージ',
      step1Title: '1. 基本情報・個人データ',
      step2Title: '2. 身分証・卒業証明書アップロード',
      step3Title: '3. 健康診断結果 (MCU)',
      step4Title: '4. DISC行動適性診断',
      step5Title: '5. 基礎業務適性テスト',
      step6Title: '6. 渡航前資金サポート申請',
      step7Title: '7. 研修・就労誓約書 (SPK)',
      readyForInterview: '面接選考可能',
      inTraining: '日本語研修受講中',
      docsVerified: '書類確認完了',
      docsPending: '書類審査中',
      startDiscTest: 'DISC診断を開始',
      startPsikotesTest: '適性テストを開始',
      scoreResult: 'テスト得点:',
      uploadPhotoInstruction: '直近3ヶ月以内に撮影した背景（赤または青）の清潔感のある証明写真をアップロードしてください。',
      saveChanges: '変更内容を保存',
      ktpNik: '身分証明番号 (NIK)',
      kkNumber: '家族カード番号 (KK)',
      heightWeight: '身長・体重',
      bloodType: '血液型',
      japaneseSkillLevel: '日本語能力レベル',
      targetJobSector: '希望職種分野'
    },

    mitraPortal: {
      headerBadge: '提携送り出し機関 (LPK Partner) 専用ポータル',
      headerSubtitle: '独自求人票の登録、育成生徒の推薦・エントリー、およびIJEF Admin Docからの承認状況を管理します。',
      tabDashboard: '提携機関ダッシュボード',
      tabJobs: '登録求人票一覧',
      tabStudents: '所属育成生徒一覧',
      tabApplications: '推薦・選考状況',
      activeJobsCount: '公開中求人件数',
      readyCandidatesCount: '選考可能生徒数',
      matchedCount: '内定・採用決定数',
      partnerInfo: '機関情報・契約状況',
      createJobBtn: '新規求人票を登録',
      applyCandidateBtn: '生徒を求人に推薦',
      searchJobsPlaceholder: '求人を検索...',
      searchStudentsPlaceholder: '生徒を検索...',
      jobSectorFilter: 'すべての業種',
      japaneseLevelFilter: 'すべての日本語レベル',
      viewStudentCV: '生徒履歴書確認',
      nominateCandidate: '求人へエントリー',
      applicationStatus: 'エントリー進捗',
      companyName: '受入企業名 (会社名)',
      location: '就業場所 (都道府県)',
      salary: '手取り給与概算',
      quota: '採用予定人数',
      requirements: '応募要件・資格',
      interviewDate: '面接予定日時',
      selectionStage: '選考ステージ'
    },

    roleManagement: {
      headerBadge: 'ADMIN DOC 集中権限・アカウント管理',
      headerTitle: '全アカウント管理＆スーパー管理者任命',
      headerSubtitle: 'システムアカウントの管理、スーパー管理者の任命、ロール権限の設定、およびスタッフ・提携機関・候補者の全アカウントの監視を行うAdmin Docの総合権限画面です。',
      appointSuperAdmin: '👑 スーパー管理者任命・作成',
      addNewAccount: '新規アカウント追加',
      totalAccounts: '全アカウント総数',
      superAdminsCount: 'スーパー管理者',
      admin2Count: 'Admin Doc (CV/求人)',
      admin1Count: '生徒管理 (SIM-SB)',
      marketingCount: 'マーケティング',
      staffCount: '医療/HR/財務スタッフ',
      mitraStudentsCount: '生徒/提携機関',
      tabAccountList: '全アカウント一覧＆ロール権限',
      tabAuditLogs: '監査ログ＆ロール任命履歴',
      tabAccessMatrix: 'ロール別アクセス権限マトリクス',
      searchAccountPlaceholder: '氏名、メール、ID、役職、部署で検索...',
      filterRole: 'すべての権限 (Roles)',
      filterStatus: 'すべての状態',
      thAccountUser: 'アカウント名・メール',
      thRoleDesignation: 'ロール・権限レベル',
      thDepartmentScope: '担当部署 / 管轄地域',
      thAuthStatus: '認証ステータス',
      thLastLogin: '最終ログイン',
      thActionManage: '管理操作'
    },

    mitraApproval: {
      headerBadge: 'Admin Doc バックオフィス認証・検証システム',
      headerTitle: '提携機関申請承認センター',
      headerSubtitle: '提携機関からの3系統の申請を管理・検証: (1) 新規育成生徒の登録、(2) 独自求人票の追加、(3) 日本求人への応募・候補者推薦。',
      activeVerifier: '現在の担当検証者:',
      statTotal: '申請総数',
      statPending: '要審査',
      statApproved: '承認済',
      statRevision: '要修正',
      statRejected: '却下',
      filterAllSubmissions: 'すべての申請',
      filterStudentReg: '新規生徒登録',
      filterPartnerJobs: '提携機関求人',
      filterNominations: '求人応募・生徒推薦',
      btnApprove: '申請を承認 (Approve)',
      btnRequestRevision: '修正を要請 (Revision)',
      btnReject: '申請を却下 (Reject)',
      revisionNotesPlaceholder: '提携機関への修正指示・確認事項を入力...',
      statusApprovedAlert: '申請が承認され、システム台帳に正式反映されました。',
      statusRejectedAlert: '申請はAdmin Docによって却下されました。'
    },

    jobMatching: {
      catalogTitle: '日本求人カタログ（特定技能・技人国・技能実習）',
      catalogSubtitle: '審査済みの日本受入企業（会社・組合）の求人募集情報一覧。',
      jobCode: '求人コード',
      companyName: '受入企業名（会社名）',
      workLocation: '勤務地（都道府県）',
      prefecture: '都道府県',
      baseSalary: '基本給（月給）',
      netEstimate: '推定手取り額 (Take Home Pay)',
      jobRequirements: '応募要件・資格',
      genderReq: '性別条件',
      ageLimit: '年齢制限',
      japaneseReq: '必要日本語資格',
      selectionStatus: '選考ステータス',
      scheduleInterview: '面接日程を設定',
      interviewDate: '面接実施日',
      interviewPlatform: '面接ツール（Zoom / Teams）',
      matchedCandidatesCount: '適合候補者数',
      matchCandidateBtn: '候補者を選定・割当'
    },

    biayaKeberangkatan: {
      title: '渡航前費用シミュレーション＆明細',
      subtitle: '渡航準備金、LPK立替サポート、航空券、就労ビザ手続き、および給与天引き分割返済計画の明細。',
      totalEstimatedCost: '渡航準備 概算費用総額',
      loanAssistanceCoverage: 'LPKサポート資金対象',
      selfFundedCoverage: '自己負担 / 頭金',
      salaryDeductionPlan: '日本での給与天引き返済計画',
      visaPassportPrep: '特定技能ビザ・パスポート申請費',
      flightTicketPrep: '日本直行便 航空券',
      medicalFinalJepang: '出入国在留管理局指定 最終健康診断',
      insuranceCoverage: '海外旅行・労働者総合保険',
      livingCostFirstMonth: '渡航初月初期生活費・お小遣い',
      simulateFinancing: '月次返済額をシミュレーション'
    }
  }
};

export { useEcosystemTranslation } from '../context/LanguageContext';

