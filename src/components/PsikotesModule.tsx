import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { PSIKOTES_QUESTIONS } from '../data/psikotesQuestions';
import { gradePsikotes } from '../utils/psikotesGrader';
import { AsesmenPsikotes } from '../types';
import {
  FileCheck,
  Save,
  CheckCircle2,
  XCircle,
  Timer,
  Award,
  BarChart,
  RotateCcw,
  BookOpen,
  HelpCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export const PsikotesModule: React.FC = () => {
  const { activeStudent, psikotesRecords, savePsikotesRecord } = useApp();
  const { lang, isJapanese } = useLanguage();
  const isJa = lang === 'ja' || isJapanese;

  const [userAnswers, setUserAnswers] = useState<Record<number, string>>(() => {
    if (activeStudent && psikotesRecords[activeStudent.id]?.userAnswers) {
      return psikotesRecords[activeStudent.id].userAnswers;
    }
    return {};
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeRecord = activeStudent ? psikotesRecords[activeStudent.id] : null;

  const getCategoryLabel = (cat: string) => {
    if (!isJa) return cat;
    switch (cat) {
      case 'Semua':
        return 'すべての分野';
      case 'Analogi Kata':
        return '言葉の類推';
      case 'Logika Matematika':
        return '数学的論理';
      case 'Penalaran Verbal':
        return '言語推論';
      case 'Penalaran Spasial & Abstrak':
      case 'Penalaran Spasial':
        return '空間・抽象推論';
      default:
        return cat;
    }
  };

  const handleSelectAnswer = (qId: number, answerKey: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: answerKey
    }));
  };

  const answeredCount = Object.keys(userAnswers).length;

  const handleGradeAndSave = () => {
    if (!activeStudent) {
      alert(isJa ? 'まず生徒を選択してください。' : 'Silakan pilih calon siswa terlebih dahulu!');
      return;
    }

    if (answeredCount < 50) {
      const confirmIncomplete = window.confirm(
        isJa
          ? `50問中まだ${answeredCount}問しか回答していません。このまま採点を実行しますか？`
          : `Siswa baru menjawab ${answeredCount} dari 50 soal psikotes. Tetap lakukan penilaian?`
      );
      if (!confirmIncomplete) return;
    }

    const graded = gradePsikotes(userAnswers);

    const record: AsesmenPsikotes = {
      id: `PSI-${Math.floor(100 + Math.random() * 900)}`,
      siswaId: activeStudent.id,
      namaSiswa: activeStudent.namaLengkap,
      totalCorrect: graded.totalCorrect,
      totalQuestions: graded.totalQuestions,
      scorePercentage: graded.scorePercentage,
      statusKelulusan: graded.statusKelulusan,
      categoryBreakdown: graded.categoryBreakdown,
      userAnswers,
      createdAt: new Date().toISOString()
    };

    savePsikotesRecord(record);
    setToastMessage(
      isJa
        ? `適性検査の採点が完了しました: 得点 ${graded.totalCorrect}/50 (${graded.scorePercentage}%) - 判定: ${graded.statusKelulusan === 'LULUS' ? '合格' : '不合格'}`
        : `Hasil Psikotes berhasil dihitung: Nilai ${graded.totalCorrect}/50 (${graded.scorePercentage}%) - STATUS: ${graded.statusKelulusan}`
    );
    setTimeout(() => setToastMessage(null), 5000);
  };

  if (!activeStudent) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="p-8 bg-white border border-slate-200 rounded-xl max-w-md mx-auto space-y-3">
          <FileCheck className="w-12 h-12 text-blue-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {isJa ? '候補生・生徒を選択してください' : 'Pilih Calon Siswa'}
          </h3>
          <p className="text-xs text-slate-500">
            {isJa
              ? '上部ナビゲーションバーのドロップダウンから生徒を選択して、適性検査（心理テスト）モジュールを開始してください。'
              : 'Silakan pilih siswa dari dropdown di bilah navigasi atas untuk memulai modul tes Psikotes.'}
          </p>
        </div>
      </div>
    );
  }

  const currentGrade = gradePsikotes(userAnswers);

  const filteredQuestions = PSIKOTES_QUESTIONS.filter((q) => {
    if (selectedCategory === 'Semua') return true;
    return q.category === selectedCategory;
  });

  const currentQ = filteredQuestions[currentQuestionIndex] || PSIKOTES_QUESTIONS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs tracking-wider uppercase">
            <FileCheck className="w-4 h-4" />
            <span>
              {isJa ? '要件 3：論理・認知適性検査（50問）' : 'REQUIREMENT 3: COGNITIVE PSYCHOTEST (50 SOAL)'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1">
            {isJa ? '論理・認知適性検査 50問（asesmen_psikotes）' : 'Asesmen Logika & Kognitif Psikotes 50 Soal (asesmen_psikotes)'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isJa
              ? '言葉の類推、数学的論理、言語的推論、空間・抽象推論の自動採点付き総合適性テスト。'
              : 'Pengujian Analogi Kata, Logika Matematika, Penalaran Verbal & Spasial Abstrak dengan Auto-Grading.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setUserAnswers({})}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center space-x-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isJa ? '回答をリセット' : 'Reset Lembar Jawaban'}</span>
          </button>

          <button
            onClick={handleGradeAndSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-md flex items-center space-x-2 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isJa ? '採点して結果を保存' : 'Nilai & Simpan Psikotes'}</span>
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

      {/* Top Overview Score Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
          <div className="p-3 bg-blue-600/30 text-blue-400 rounded-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">{isJa ? '獲得スコア合計:' : 'Skor Akhir Poin:'}</span>
            <span className="text-xl font-bold text-blue-400">
              {currentGrade.totalCorrect} / 50
            </span>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
          <div className="p-3 bg-purple-600/30 text-purple-400 rounded-lg">
            <BarChart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">{isJa ? '合格・正答率:' : 'Persentase Kelulusan:'}</span>
            <span className="text-xl font-bold text-purple-300">
              {currentGrade.scorePercentage}%
            </span>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
          <div
            className={`p-3 rounded-lg ${
              currentGrade.statusKelulusan === 'LULUS'
                ? 'bg-emerald-600/30 text-emerald-400'
                : 'bg-rose-600/30 text-rose-400'
            }`}
          >
            {currentGrade.statusKelulusan === 'LULUS' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <XCircle className="w-6 h-6" />
            )}
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">{isJa ? '自動判定ステータス:' : 'Status Hasil Auto-Grade:'}</span>
            <span
              className={`text-base font-bold ${
                currentGrade.statusKelulusan === 'LULUS' ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isJa ? (currentGrade.statusKelulusan === 'LULUS' ? '合格 (LULUS)' : '不合格 (TIDAK LULUS)') : currentGrade.statusKelulusan}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
          <div className="p-3 bg-amber-600/30 text-amber-400 rounded-lg">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">{isJa ? '回答進捗状況:' : 'Progres Jawaban Soal:'}</span>
            <span className="text-lg font-bold text-amber-300">
              {isJa ? `${answeredCount}/50 回答済` : `${answeredCount} dari 50 Terisi`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Test Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Question Card */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Filter Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {['Semua', 'Analogi Kata', 'Logika Matematika', 'Penalaran Verbal', 'Penalaran Spasial & Abstrak'].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentQuestionIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {getCategoryLabel(cat)}
                </button>
              )
            )}
          </div>

          {/* Current Question Box */}
          {currentQ && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-600 text-white font-mono font-bold text-xs px-2.5 py-1 rounded">
                    {isJa ? `第${currentQ.id}問` : `Soal #${currentQ.id}`}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded">
                    {isJa ? `分野: ${getCategoryLabel(currentQ.category)}` : `Kategori: ${currentQ.category}`}
                  </span>
                </div>

                <span className="text-xs text-slate-400 font-medium">
                  {isJa ? `${currentQuestionIndex + 1} / ${filteredQuestions.length} 問` : `${currentQuestionIndex + 1} dari ${filteredQuestions.length} Soal`}
                </span>
              </div>

              {/* Question Text */}
              <div className="text-sm font-semibold text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                {currentQ.question}
              </div>

              {/* Options list */}
              <div className="space-y-3">
                {currentQ.options.map((opt) => {
                  const isSelected = userAnswers[currentQ.id] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectAnswer(currentQ.id, opt.key)}
                      className={`w-full text-left p-3.5 rounded-lg border text-xs font-medium flex items-center space-x-3 transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm font-bold'
                          : 'bg-white border-slate-200 hover:border-blue-300 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{isJa ? '前へ' : 'Sebelumnya'}</span>
                </button>

                <button
                  onClick={() =>
                    setCurrentQuestionIndex((prev) =>
                      Math.min(filteredQuestions.length - 1, prev + 1)
                    )
                  }
                  disabled={currentQuestionIndex === filteredQuestions.length - 1}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 transition cursor-pointer"
                >
                  <span>{isJa ? '次へ' : 'Berikutnya'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: 50 Question Grid Answer Sheet */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                {isJa ? '回答用紙一覧（全50問）' : 'Lembar Jawaban (50 Soal)'}
              </h3>
              <span className="text-[11px] text-blue-600 font-bold">
                {isJa ? `${answeredCount}/50 回答済` : `${answeredCount}/50 Terisi`}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
              {PSIKOTES_QUESTIONS.map((q) => {
                const userAns = userAnswers[q.id];
                const isCurrent = currentQ && currentQ.id === q.id;

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      const fIndex = filteredQuestions.findIndex((fq) => fq.id === q.id);
                      if (fIndex >= 0) setCurrentQuestionIndex(fIndex);
                    }}
                    className={`p-2 rounded border text-center font-mono text-xs flex flex-col items-center justify-center transition cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-blue-600 border-blue-600 font-bold'
                        : ''
                    } ${
                      userAns
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] opacity-80">#{q.id}</span>
                    <span className="font-bold text-xs">{userAns || '-'}</span>
                  </button>
                );
              })}
            </div>

            {/* Category Breakdown Box */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 block text-xs">
                {isJa ? '分野別得点内訳:' : 'Rincian Poin per Kategori:'}
              </span>
              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>{isJa ? '言葉の類推:' : 'Analogi Kata:'}</span>
                  <span className="font-bold text-slate-800">
                    {currentGrade.categoryBreakdown.analogiKata} / 15
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isJa ? '数学的論理:' : 'Logika Matematika:'}</span>
                  <span className="font-bold text-slate-800">
                    {currentGrade.categoryBreakdown.logikaMatematika} / 15
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isJa ? '言語推論:' : 'Penalaran Verbal:'}</span>
                  <span className="font-bold text-slate-800">
                    {currentGrade.categoryBreakdown.penalaranVerbal} / 10
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isJa ? '空間・抽象推論:' : 'Penalaran Spasial:'}</span>
                  <span className="font-bold text-slate-800">
                    {currentGrade.categoryBreakdown.penalaranSpasial} / 10
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

