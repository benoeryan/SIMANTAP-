export type AppLanguage = 'id' | 'ja';

export interface TranslationDictionary {
  // Common / Global
  common: {
    appName: string;
    systemTitle: string;
    indonesia: string;
    japanese: string;
    menu: string;
    logout: string;
    login: string;
    back: string;
    save: string;
    saved: string;
    saving: string;
    cancel: string;
    delete: string;
    edit: string;
    search: string;
    filter: string;
    all: string;
    loading: string;
    status: string;
    action: string;
    close: string;
    submit: string;
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
    candidate: string;
    students: string;
    partner: string;
    admin: string;
    active: string;
    inactive: string;
    verified: string;
    yearsOld: string;
    gender: string;
    male: string;
    female: string;
    age: string;
    phone: string;
    email: string;
    address: string;
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
  };

  // Auth / Login Pages
  auth: {
    candidateLoginTitle: string;
    candidateLoginSubtitle: string;
    adminLoginTitle: string;
    adminLoginSubtitle: string;
    mitraLoginTitle: string;
    mitraLoginSubtitle: string;
    emailLabel: string;
    passwordLabel: string;
    fullNameLabel: string;
    loginBtn: string;
    registerBtn: string;
    haveAccount: string;
    dontHaveAccount: string;
    demoCandidateTitle: string;
    demoAdminTitle: string;
    demoMitraTitle: string;
    googleLogin: string;
    loginSuccess: string;
    loginFailed: string;
    logoutConfirm: string;
    roleSwitchCandidate: string;
    roleSwitchAdmin: string;
    roleSwitchMitra: string;
    securityBadge: string;
    portalSwitcherTitle: string;
  };

  // Student Portal
  studentPortal: {
    headerTitle: string;
    headerSubtitle: string;
    navDashboard: string;
    navDashboardDesc: string;
    navBiodata: string;
    navBiodataDesc: string;
    navGuardian: string;
    navGuardianDesc: string;
    navHealth: string;
    navHealthDesc: string;
    navDocs: string;
    navDocsDesc: string;
    navDisc: string;
    navDiscDesc: string;
    navPsikotes: string;
    navPsikotesDesc: string;
    navStatus: string;
    navStatusDesc: string;
    navRirekisho: string;
    navRirekishoDesc: string;
    navJobs: string;
    navJobsDesc: string;
    welcomeBack: string;
    pipelineStage: string;
    statusFit: string;
    statusUnfit: string;
    statusPending: string;
    registrationForm: string;
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
  };

  // Mitra Portal
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
    statusSubmitted: string;
    statusInterviewing: string;
    statusAccepted: string;
    statusRejected: string;
    filterAll: string;
    noDataFound: string;
  };

  // Admin 1 Portal (LPK IJEF Back-Office)
  admin1: {
    portalBadge: string;
    headerSubtitle: string;
    tabMaster: string;
    tabMasterDesc: string;
    tabPortal: string;
    tabPortalDesc: string;
    tabKesehatan: string;
    tabKesehatanDesc: string;
    tabDisc: string;
    tabDiscDesc: string;
    tabPsikotes: string;
    tabPsikotesDesc: string;
    tabDana: string;
    tabDanaDesc: string;
    tabKontrak: string;
    tabKontrakDesc: string;
    tabSettings: string;
    tabSettingsDesc: string;
    tabPetunjuk: string;
    tabPetunjukDesc: string;
    studentDatabaseTitle: string;
    addNewStudent: string;
    forwardToAdmin2: string;
    forwardSuccess: string;
    forwardAll: string;
    forwardSelected: string;
    printCV: string;
    filterBatch: string;
    filterStatus: string;
    mcuFitCount: string;
    discCompletedCount: string;
    psikotesPassedCount: string;
    contractSignedCount: string;
    financeDisbursedCount: string;
  };

  // Admin 2 Portal (CV Portal & Job Matching)
  admin2: {
    portalBadge: string;
    headerSubtitle: string;
    tabCVPortal: string;
    tabJobMatching: string;
    tabInterviews: string;
    tabDepartureFinancing: string;
    tabUserRoles: string;
    tabPetunjuk: string;
    syncDrive: string;
    importSpreadsheet: string;
    exportExcel: string;
    katakanaConvert: string;
    autoTranslateCV: string;
    jobCode: string;
    companyMatching: string;
    interviewSchedule: string;
    sendNotification: string;
    departureCostBreakdown: string;
    visaFlightPrep: string;
  };
}

export const translations: Record<AppLanguage, TranslationDictionary> = {
  id: {
    common: {
      appName: 'LPK IJEF CORP',
      systemTitle: 'Sistem Informasi Manajemen Pelatihan & Penempatan Kerja Jepang',
      indonesia: 'Indonesia',
      japanese: 'Jepang (日本語)',
      menu: 'Menu Navigasi',
      logout: 'Keluar (Logout)',
      login: 'Masuk (Login)',
      back: 'Kembali',
      save: 'Simpan',
      saved: 'Tersimpan',
      saving: 'Menyimpan...',
      cancel: 'Batal',
      delete: 'Hapus',
      edit: 'Ubah Data',
      search: 'Cari data...',
      filter: 'Filter',
      all: 'Semua',
      loading: 'Memuat data...',
      status: 'Status',
      action: 'Aksi',
      close: 'Tutup',
      submit: 'Kirimkan',
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
      candidate: 'Kandidat',
      students: 'Siswa / Calon Siswa',
      partner: 'Mitra LPK / TSK Jepang',
      admin: 'Administrator',
      active: 'Aktif',
      inactive: 'Nonaktif',
      verified: 'Terverifikasi',
      yearsOld: 'Tahun',
      gender: 'Jenis Kelamin',
      male: 'Laki-laki',
      female: 'Perempuan',
      age: 'Usia',
      phone: 'No. WhatsApp / HP',
      email: 'Alamat Email',
      address: 'Alamat Domisili',
      birthDate: 'Tanggal Lahir',
      birthPlace: 'Tempat Lahir',
      religion: 'Agama',
      maritalStatus: 'Status Pernikahan',
      single: 'Lajang',
      married: 'Menikah',
      jobSector: 'Bidang Pekerjaan',
      category: 'Kategori Kandidat',
      notes: 'Catatan Khusus',
      updatedAt: 'Diperbarui pada',
      createdAt: 'Dibuat pada',
    },
    auth: {
      candidateLoginTitle: 'Portal Siswa & Kandidat',
      candidateLoginSubtitle: 'Masuk untuk mengisi biodata, tes DISC, psikotes, dan pantau status job matching Jepang.',
      adminLoginTitle: 'Portal Administrasi LPK IJEF',
      adminLoginSubtitle: 'Otorisasi back-office, pengelolaan database siswa, verifikasi CV JIS, dan matching partner.',
      mitraLoginTitle: 'Portal Kemitraan & TSK Jepang',
      mitraLoginSubtitle: 'Akses katalog kandidat siap matching, submit lowongan kerja, dan pantau hasil seleksi.',
      emailLabel: 'Alamat Email',
      passwordLabel: 'Kata Sandi',
      fullNameLabel: 'Nama Lengkap (Sesuai KTP)',
      loginBtn: 'Masuk ke Akun',
      registerBtn: 'Daftar Akun Siswa Baru',
      haveAccount: 'Sudah punya akun? Masuk di sini',
      dontHaveAccount: 'Belum punya akun? Daftar sebagai Siswa Baru',
      demoCandidateTitle: 'Akses Demo Cepat Akun Siswa:',
      demoAdminTitle: 'Akses Demo Cepat Administrator:',
      demoMitraTitle: 'Akses Demo Cepat Akun Mitra:',
      googleLogin: 'Masuk Cepat dengan Google',
      loginSuccess: 'Berhasil masuk ke portal.',
      loginFailed: 'Email atau password tidak sesuai.',
      logoutConfirm: 'Apakah Anda yakin ingin keluar dari portal?',
      roleSwitchCandidate: 'Login Siswa',
      roleSwitchAdmin: 'Login Admin',
      roleSwitchMitra: 'Login Mitra',
      securityBadge: 'Sistem Terenkripsi & Terintegrasi Cloud Firestore',
      portalSwitcherTitle: 'Peralihan Portal Cepat (Super Admin)',
    },
    studentPortal: {
      headerTitle: 'Portal Siswa & Kandidat Pelatihan Jepang',
      headerSubtitle: 'Sistem Informasi Pendaftaran, Asesmen & Matching Job Jepang LPK IJEF CORP',
      navDashboard: 'Dashboard Monitoring Siswa',
      navDashboardDesc: 'Status Real-time & Alur SIM',
      navBiodata: '1. Form Pendaftaran',
      navBiodataDesc: 'Biodata Demografi & Pasfoto',
      navGuardian: '2. Data Orang Tua / Penjamin',
      navGuardianDesc: 'Pekerjaan, Alamat & Kontak',
      navHealth: '3. Skrining Kesehatan Mandiri',
      navHealthDesc: 'Riwayat Penyakit & Fit Test',
      navDocs: '4. Unggah Dokumen & Berkas',
      navDocsDesc: 'KTP, KK, Ijazah & Sertifikat',
      navDisc: '5. Asesmen Kepribadian DISC',
      navDiscDesc: '24 Set Soal Evaluasi Diri',
      navPsikotes: '6. Ujian Psikotes 50 Soal',
      navPsikotesDesc: 'Logika, Numerik & Verbal',
      navStatus: '7. Status Berkas & Legalitas',
      navStatusDesc: 'Kualifikasi & Syarat Akad',
      navRirekisho: 'Rirekisho JIS Jepang',
      navRirekishoDesc: 'Formulir CV Standar Resmi Jepang',
      navJobs: 'Katalog Lowongan Kerja Jepang',
      navJobsDesc: 'Daftar Pekerjaan & Lamar Matching',
      welcomeBack: 'Selamat datang kembali',
      pipelineStage: 'Tahapan Saat Ini',
      statusFit: 'FIT (Layak Kesehatan)',
      statusUnfit: 'UNFIT (Tidak Layak)',
      statusPending: 'Proses Evaluasi MCU',
      registrationForm: 'Formulir Pendaftaran Calon Siswa',
      step1Title: 'Langkah 1: Biodata Siswa & Pasfoto',
      step2Title: 'Langkah 2: Data Orang Tua / Wali Penjamin',
      step3Title: 'Langkah 3: Riwayat Medis & Skrining Kesehatan',
      step4Title: 'Langkah 4: Unggah Dokumen Syarat & Sertifikat',
      step5Title: 'Langkah 5: Asesmen Karakter Kerja DISC (24 Soal)',
      step6Title: 'Langkah 6: Ujian Psikotes Kemampuan Kerja (50 Soal)',
      step7Title: 'Langkah 7: Ringkasan Kelayakan & Penandatanganan',
      readyForInterview: 'Siap Interview (Terverifikasi LPK)',
      inTraining: 'Dalam Masa Pelatihan Bahasa & Fisik',
      docsVerified: 'Dokumen Lengkap & Terverifikasi',
      docsPending: 'Ada Dokumen yang Belum Diunggah',
      startDiscTest: 'Mulai Asesmen DISC Sekarang',
      startPsikotesTest: 'Mulai Ujian Psikotes (50 Menit)',
      scoreResult: 'Hasil Skor Evaluasi:',
      uploadPhotoInstruction: 'Unggah Pas Foto Berwarna 3x4 / 2R latar belakang putih/merah.',
      saveChanges: 'Simpan Perubahan Formulir',
    },
    mitraPortal: {
      headerBadge: 'PORTAL MITRA RESMI',
      headerSubtitle: 'Sistem Informasi Kemitraan, Penempatan & Job Matching Jepang',
      tabDashboard: 'Dashboard & Statistik',
      tabJobs: 'Lowongan Kerja (Job Orders)',
      tabStudents: 'Daftar Kandidat Siap Matching',
      tabApplications: 'Pelacakan Lamaran & Interview',
      activeJobsCount: 'Lowongan Aktif',
      readyCandidatesCount: 'Kandidat Siap Interview',
      matchedCount: 'Kandidat Diterima (Matched)',
      partnerInfo: 'Informasi Mitra Kemitraan',
      createJobBtn: '+ Pasang Lowongan Baru',
      applyCandidateBtn: 'Nominasikan Kandidat',
      searchJobsPlaceholder: 'Cari berdasarkan judul loker, perusahaan, prefektur, atau bidang...',
      searchStudentsPlaceholder: 'Cari kandidat berdasarkan nama, bidang, level bahasa, atau sertifikat...',
      jobSectorFilter: 'Filter Bidang Pekerjaan',
      japaneseLevelFilter: 'Filter Level Bahasa Jepang',
      viewStudentCV: 'Buka CV Rirekisho JIS',
      nominateCandidate: 'Pilih & Lamar Job Ini',
      applicationStatus: 'Status Seleksi Lamaran',
      companyName: 'Nama Perusahaan Jepang',
      location: 'Prefektur / Lokasi Kerja',
      salary: 'Gaji Pokok / Est. Take Home Pay',
      quota: 'Kuota Kebutuhan',
      requirements: 'Kualifikasi & Persyaratan',
      interviewDate: 'Jadwal Interview Zoom',
      selectionStage: 'Tahapan Seleksi',
      statusSubmitted: 'Terkirim (Menunggu Review)',
      statusInterviewing: 'Jadwal Wawancara',
      statusAccepted: 'Diterima / Lolos',
      statusRejected: 'Belum Sesuai',
      filterAll: 'Semua Kategori',
      noDataFound: 'Tidak ada data yang cocok dengan kriteria pencarian.',
    },
    admin1: {
      portalBadge: 'ADMIN SISWA • LPK IJEF CORP',
      headerSubtitle: 'Sistem Manajemen Siswa, Asesmen & Back-Office Pelatihan Jepang',
      tabMaster: 'Dashboard Master Siswa',
      tabMasterDesc: 'Database Ringkasan Siswa',
      tabPortal: '1. Portal Pendaftaran',
      tabPortalDesc: 'Registrasi & Dokumen Siswa',
      tabKesehatan: '2. Skrining Kesehatan',
      tabKesehatanDesc: 'Fit To Work & Lab Medis',
      tabDisc: '3. Asesmen DISC',
      tabDiscDesc: 'Profil Kepribadian Kerja',
      tabPsikotes: '4. Psikotes 50 Soal',
      tabPsikotesDesc: 'Logika & Kuantitatif',
      tabDana: '5. Biaya Pelatihan LPK',
      tabDanaDesc: 'Pembiayaan & Pendidikan LPK',
      tabKontrak: '6. Surat Perjanjian',
      tabKontrakDesc: 'Legalitas & Pasal Kerja',
      tabSettings: 'Pengaturan Master',
      tabSettingsDesc: 'Sistem & Tarif Biaya',
      tabPetunjuk: 'Petunjuk & Hirarki Proses',
      tabPetunjukDesc: 'Panduan Penggunaan & Flow SIM',
      studentDatabaseTitle: 'Database & Manajemen Siswa Terpadu',
      addNewStudent: '+ Tambah Siswa Baru',
      forwardToAdmin2: 'Teruskan ke Admin Doc (CV Portal)',
      forwardSuccess: 'Data siswa berhasil diteruskan ke Admin Doc CV Portal.',
      forwardAll: 'Teruskan Semua Siswa Siap',
      forwardSelected: 'Teruskan yang Dipilih',
      printCV: 'Cetak CV Official (A4)',
      filterBatch: 'Filter Gelombang / Angkatan',
      filterStatus: 'Filter Status Pendaftaran',
      mcuFitCount: 'Siswa Fit MCU',
      discCompletedCount: 'Siswa Selesai DISC',
      psikotesPassedCount: 'Siswa Lulus Psikotes',
      contractSignedCount: 'Akad Kontrak Selesai',
      financeDisbursedCount: 'Pembiayaan Terverifikasi',
    },
    admin2: {
      portalBadge: 'ADMIN DOC • CV-PORTAL & JOB MATCHING',
      headerSubtitle: 'Sistem Otorisasi Back-Office Matching Perusahaan Jepang & Verifikasi CV Rirekisho',
      tabCVPortal: 'CV Portal Master & JIS Rirekisho',
      tabJobMatching: 'Job Matching & Lowongan Kerja',
      tabInterviews: 'Jadwal Interview & Seleksi',
      tabDepartureFinancing: 'Biaya Keberangkatan (Matching Job)',
      tabUserRoles: 'Kelola Akun & Hak Akses',
      tabPetunjuk: 'Petunjuk Operasional Matching',
      syncDrive: 'Sinkronkan Google Drive',
      importSpreadsheet: 'Impor Spreadsheet Lowongan',
      exportExcel: 'Ekspor Data (Excel)',
      katakanaConvert: 'Konversi Nama Katakana Otomatis',
      autoTranslateCV: 'Terjemahkan CV ke Bahasa Jepang Standar',
      jobCode: 'Kode Job Lowongan',
      companyMatching: 'Perusahaan Jepang Penerima',
      interviewSchedule: 'Jadwal Wawancara Online',
      sendNotification: 'Kirim Notifikasi ke Siswa',
      departureCostBreakdown: 'Rincian Biaya Keberangkatan & Visa',
      visaFlightPrep: 'Persiapan COE, Visa & Tiket Pesawat',
    }
  },
  ja: {
    common: {
      appName: 'LPK IJEF CORP',
      systemTitle: '日本就労・特定技能・技能実習生 育成・マッチング管理システム',
      indonesia: 'インドネシア語 (ID)',
      japanese: '日本語 (JA)',
      menu: 'メニュー',
      logout: 'ログアウト',
      login: 'ログイン',
      back: '戻る',
      save: '保存する',
      saved: '保存完了',
      saving: '保存中...',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      search: '検索...',
      filter: 'フィルター',
      all: 'すべて',
      loading: '読み込み中...',
      status: 'ステータス',
      action: '操作',
      close: '閉じる',
      submit: '提出する',
      next: '次へ',
      prev: '前へ',
      print: '印刷',
      download: 'ダウンロード',
      export: 'エクスポート',
      import: 'インポート',
      upload: 'アップロード',
      view: '表示',
      details: '詳細情報',
      confirm: '確認',
      success: '成功しました',
      error: 'エラーが発生しました',
      warning: '注意',
      candidate: '候補生・生徒',
      students: '候補生一覧',
      partner: '受入機関・監理団体・登録支援機関',
      admin: '管理者',
      active: '有効・在籍中',
      inactive: '無効・停止中',
      verified: '審査済・認証済',
      yearsOld: '歳',
      gender: '性別',
      male: '男性',
      female: '女性',
      age: '年齢',
      phone: '電話番号 / WhatsApp',
      email: 'メールアドレス',
      address: '現住所',
      birthDate: '生年月日',
      birthPlace: '出身地',
      religion: '宗教',
      maritalStatus: '配偶者の有無',
      single: '未婚',
      married: '既婚',
      jobSector: '希望職種・分野',
      category: '候補生区分',
      notes: '特記事項・備考',
      updatedAt: '最終更新日',
      createdAt: '作成日時',
    },
    auth: {
      candidateLoginTitle: '生徒・候補生ポータル',
      candidateLoginSubtitle: '基本情報登録、DISC適性検査、心理テスト受検、日本就職進捗の確認ができます。',
      adminLoginTitle: 'LPK IJEF 管理者ポータル',
      adminLoginSubtitle: 'バックオフィス認証、生徒データベース管理、JIS履歴書審査、受入企業マッチング。',
      mitraLoginTitle: '受入企業・登録支援機関（TSK）ポータル',
      mitraLoginSubtitle: '推薦可能候補生の閲覧、求人票の登録、オンライン面接・選考状況の管理。',
      emailLabel: 'メールアドレス',
      passwordLabel: 'パスワード',
      fullNameLabel: '氏名（身分証明書通り）',
      loginBtn: 'ログイン',
      registerBtn: '新規生徒登録',
      haveAccount: '既にアカウントをお持ちの方はこちら',
      dontHaveAccount: 'アカウントをお持ちでない方は新規登録',
      demoCandidateTitle: 'クイックデモログイン（生徒用）:',
      demoAdminTitle: 'クイックデモログイン（管理者用）:',
      demoMitraTitle: 'クイックデモログイン（パートナー企業用）:',
      googleLogin: 'Googleでログイン',
      loginSuccess: 'ログインに成功しました。',
      loginFailed: 'メールアドレスまたはパスワードが正しくありません。',
      logoutConfirm: 'ログアウトしますか？',
      roleSwitchCandidate: '生徒ログイン',
      roleSwitchAdmin: '管理者ログイン',
      roleSwitchMitra: 'パートナーログイン',
      securityBadge: '暗号化通信＆Cloud Firestore リアルタイム同期',
      portalSwitcherTitle: 'ポータル切り替え（スーパー管理者専用）',
    },
    studentPortal: {
      headerTitle: '日本就労候補生・生徒専用ポータル',
      headerSubtitle: 'LPK IJEF CORP 日本就労研修・アセスメント・ジョブマッチング総合システム',
      navDashboard: '生徒ダッシュボード',
      navDashboardDesc: 'リアルタイム進捗・選考状況',
      navBiodata: '1. 基本登録フォーム',
      navBiodataDesc: '基本情報・証明写真',
      navGuardian: '2. 保護者・身元保証人情報',
      navGuardianDesc: '職業・住所・緊急連絡先',
      navHealth: '3. 健康診断・問診票',
      navHealthDesc: '既往歴・健康状態チェック',
      navDocs: '4. 書類・資格証アップロード',
      navDocsDesc: '身分証・卒業証書・認定書',
      navDisc: '5. DISC性格適性検査',
      navDiscDesc: '24問自己適性評価',
      navPsikotes: '6. 心理適性テスト（50問）',
      navPsikotesDesc: '論理・計算・言語理解',
      navStatus: '7. 提出書類・契約確認',
      navStatusDesc: '資格基準・誓約事項',
      navRirekisho: 'JIS規格 日本語履歴書',
      navRirekishoDesc: '公式日本式履歴書作成',
      navJobs: '日本求人票一覧・応募',
      navJobsDesc: '募集案件確認＆応募申請',
      welcomeBack: 'おかえりなさい',
      pipelineStage: '現在の進捗段階',
      statusFit: '健康診断：合格（FIT）',
      statusUnfit: '健康診断：不合格（UNFIT）',
      statusPending: '健康診断：審査中',
      registrationForm: '生徒登録申請フォーム',
      step1Title: 'ステップ 1: 基本情報＆証明写真（2R / 3x4）',
      step2Title: 'ステップ 2: 保護者・保証人情報',
      step3Title: 'ステップ 3: 健康状態・自己診断問診',
      step4Title: 'ステップ 4: 必要書類・資格認定証提出',
      step5Title: 'ステップ 5: DISC行動適性検査（24問）',
      step6Title: 'ステップ 6: 心理適性テスト（50問）',
      step7Title: 'ステップ 7: 資格要件確認・誓約書同意',
      readyForInterview: '面接推薦準備完了（LPK審査済）',
      inTraining: '日本語および実務研修受講中',
      docsVerified: '提出書類確認完了',
      docsPending: '未提出の必須書類があります',
      startDiscTest: 'DISC適性診断を開始する',
      startPsikotesTest: '心理適性テストを開始する（制限時間50分）',
      scoreResult: '判定結果スコア:',
      uploadPhotoInstruction: 'カラー証明写真（背景白または赤、縦横比 2:3）を添付してください。',
      saveChanges: '入力内容を保存する',
    },
    mitraPortal: {
      headerBadge: '公式パートナー企業ポータル',
      headerSubtitle: '受入機関・登録支援機関向け 候補者マッチング・進捗管理システム',
      tabDashboard: 'ダッシュボード・統計',
      tabJobs: '求人票一覧（Job Orders）',
      tabStudents: '面接推薦可能候補生一覧',
      tabApplications: '応募管理・選考進捗',
      activeJobsCount: '募集中の求人件数',
      readyCandidatesCount: '面接可能候補生数',
      matchedCount: '内定・採用確定数',
      partnerInfo: '提携パートナー情報',
      createJobBtn: '+ 新規求人票を登録',
      applyCandidateBtn: '候補生を推薦・応募',
      searchJobsPlaceholder: '職種、受入企業名、都道府県、分野で検索...',
      searchStudentsPlaceholder: '候補生名、希望分野、日本語レベル、資格で検索...',
      jobSectorFilter: '職種・分野フィルター',
      japaneseLevelFilter: '日本語能力フィルター',
      viewStudentCV: 'JIS履歴書・自己紹介を見る',
      nominateCandidate: 'この求人に推薦・応募する',
      applicationStatus: '選考進捗ステータス',
      companyName: '受入企業名 / 施設名',
      location: '就業場所（都道府県）',
      salary: '基本給 / 手取り想定額',
      quota: '採用予定人数',
      requirements: '応募要件・必須資格',
      interviewDate: 'オンライン面接予定日時',
      selectionStage: '選考ステージ',
      statusSubmitted: '推薦提出済（書類確認中）',
      statusInterviewing: 'オンライン面接調整中',
      statusAccepted: '採用内定（合格）',
      statusRejected: '不採用・見送り',
      filterAll: 'すべてのカテゴリー',
      noDataFound: '条件に該当するデータは見つかりませんでした。',
    },
    admin1: {
      portalBadge: '生徒管理者 (Admin Siswa) • LPK IJEF CORP',
      headerSubtitle: '生徒総合管理・アセスメント・日本就労教育バックオフィス',
      tabMaster: '生徒マスターダッシュボード',
      tabMasterDesc: '生徒総合データベース',
      tabPortal: '1. 生徒受付・登録',
      tabPortalDesc: '登録情報・提出書類管理',
      tabKesehatan: '2. 健康診断（MCU）',
      tabKesehatanDesc: 'Fit To Work判定・検査所見',
      tabDisc: '3. DISC適性診断',
      tabDiscDesc: '行動特性・職場適性分析',
      tabPsikotes: '4. 心理適性テスト（50問）',
      tabPsikotesDesc: '論理・計算・業務適性',
      tabDana: '5. 研修費用・サポート資金',
      tabDanaDesc: '学費支援・分割計画管理',
      tabKontrak: '6. 契約書・誓約書',
      tabKontrakDesc: '法的合意書・権利義務条項',
      tabSettings: 'マスターシステム設定',
      tabSettingsDesc: '料金体系・運用パラメータ',
      tabPetunjuk: '運用マニュアル・フロー',
      tabPetunjukDesc: '利用ガイドライン・手順',
      studentDatabaseTitle: '生徒総合統合データベース',
      addNewStudent: '+ 新規生徒を登録',
      forwardToAdmin2: '書類・マッチング管理者 (Admin Doc) へ引き継ぐ',
      forwardSuccess: '生徒データを書類管理者 (Admin Doc) CVポータルへ正常に転送しました。',
      forwardAll: '準備完了生徒を一括転送',
      forwardSelected: '選択した生徒を転送',
      printCV: 'JIS公式履歴書を印刷 (A4)',
      filterBatch: '期生・募集期で絞り込み',
      filterStatus: '選考進捗で絞り込み',
      mcuFitCount: 'MCU合格（FIT）人数',
      discCompletedCount: 'DISC受検完了人数',
      psikotesPassedCount: '心理テスト合格人数',
      contractSignedCount: '契約締結完了人数',
      financeDisbursedCount: '研修費承認済人数',
    },
    admin2: {
      portalBadge: '書類管理者 (Admin Doc) • CVポータル＆日本ジョブマッチング',
      headerSubtitle: '日本受入企業マッチング・JIS履歴書審査・渡航管理システム',
      tabCVPortal: 'JIS履歴書・CVポータル管理',
      tabJobMatching: '求人案件・マッチング管理',
      tabInterviews: '企業面接選考スケジュール',
      tabDepartureFinancing: '渡航・出国前費用管理',
      tabUserRoles: 'ユーザーアカウント・権限管理',
      tabPetunjuk: 'マッチング業務マニュアル',
      syncDrive: 'Google Drive 連携同期',
      importSpreadsheet: '求人スプレッドシート取込',
      exportExcel: 'Excelデータ出力',
      katakanaConvert: 'フリガナ自動カタカナ変換',
      autoTranslateCV: '公式日本語（JIS標準）に自動翻訳',
      jobCode: '求人整理番号',
      companyMatching: '日本受入企業・施設',
      interviewSchedule: 'Zoomオンライン面接日時',
      sendNotification: '候補生へ面接案内を送信',
      departureCostBreakdown: '在留資格申請・ビザ・出国費用内訳',
      visaFlightPrep: 'COE交付・ビザ発給・航空券手配',
    }
  }
};
