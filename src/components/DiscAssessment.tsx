import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DISC_QUESTIONS } from '../data/discQuestions';
import { calculateDiscResult } from '../utils/discCalculator';
import { AsesmenDisc } from '../types';
import {
  Brain,
  Save,
  CheckCircle2,
  BarChart3,
  Sparkles,
  RotateCcw,
  UserCheck,
  Award,
  Briefcase
} from 'lucide-react';

export const DiscAssessment: React.FC = () => {
  const { activeStudent, discRecords, saveDiscRecord } = useApp();

  const [userAnswers, setUserAnswers] = useState<Record<number, { most: string; least: string }>>(() => {
    if (activeStudent && discRecords[activeStudent.id]?.userAnswers) {
      return discRecords[activeStudent.id].userAnswers;
    }
    return {};
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeRecord = activeStudent ? discRecords[activeStudent.id] : null;

  const handleSelectChoice = (setNum: number, choiceId: string, type: 'most' | 'least') => {
    setUserAnswers((prev) => {
      const currentSet = prev[setNum] || { most: '', least: '' };
      let newMost = currentSet.most;
      let newLeast = currentSet.least;

      if (type === 'most') {
        newMost = choiceId;
        if (newLeast === choiceId) newLeast = ''; // Cannot be both most and least
      } else {
        newLeast = choiceId;
        if (newMost === choiceId) newMost = '';
      }

      return {
        ...prev,
        [setNum]: { most: newMost, least: newLeast }
      };
    });
  };

  const answeredSetsCount = Object.keys(userAnswers).filter(
    (key) => userAnswers[Number(key)]?.most && userAnswers[Number(key)]?.least
  ).length;

  const handleCalculateAndSave = () => {
    if (!activeStudent) {
      alert('Silakan pilih calon siswa terlebih dahulu!');
      return;
    }

    if (answeredSetsCount < 24) {
      const confirmIncomplete = window.confirm(
        `Anda baru mengisi ${answeredSetsCount} dari 24 set soalan. Apakah Anda ingin tetap memproses skor sementara?`
      );
      if (!confirmIncomplete) return;
    }

    const calculated = calculateDiscResult(userAnswers);

    const record: AsesmenDisc = {
      id: `DISC-${Math.floor(100 + Math.random() * 900)}`,
      siswaId: activeStudent.id,
      namaSiswa: activeStudent.namaLengkap,
      scoreD: calculated.scoreD,
      scoreI: calculated.scoreI,
      scoreS: calculated.scoreS,
      scoreC: calculated.scoreC,
      dominantType: calculated.dominantType,
      secondaryType: calculated.secondaryType !== 'None' ? calculated.secondaryType : undefined,
      description: calculated.description,
      userAnswers,
      createdAt: new Date().toISOString()
    };

    saveDiscRecord(record);
    setToastMessage('Hasil tes kepribadian DISC berhasil dihitung dan disimpan ke Firestore [asesmen_disc]!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (!activeStudent) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="p-8 bg-white border border-slate-200 rounded-xl max-w-md mx-auto space-y-3">
          <Brain className="w-12 h-12 text-purple-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Pilih Calon Siswa</h3>
          <p className="text-xs text-slate-500">
            Silakan pilih siswa dari dropdown di bilah navigasi atas untuk memulai asesmen tes DISC.
          </p>
        </div>
      </div>
    );
  }

  const calculatedPreview = calculateDiscResult(userAnswers);
  const maxScore = Math.max(
    calculatedPreview.scoreD,
    calculatedPreview.scoreI,
    calculatedPreview.scoreS,
    calculatedPreview.scoreC,
    1
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-600 font-semibold text-xs tracking-wider uppercase">
            <Brain className="w-4 h-4" />
            <span>REQUIREMENT 2: DISC PERSONALITY TEST</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1">
            Asesmen Kepribadian DISC Standard HR Legal (asesmen_disc)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            24 Set Soal Pilihan Most [Paling Menggambarkan] & Least [Paling Tidak Menggambarkan].
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setUserAnswers({})}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center space-x-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Jawaban</span>
          </button>

          <button
            onClick={handleCalculateAndSave}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-md flex items-center space-x-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>Hitung & Simpan Hasil DISC</span>
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

      {/* Progress & Result Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: DISC Score Chart & Profile Result */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm">Profil Grafik DISC Siswa</h3>
              </div>
              <span className="text-[11px] bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded font-mono">
                {answeredSetsCount}/24 Soal
              </span>
            </div>

            {/* BAR CHART GRAPHIC */}
            <div className="grid grid-cols-4 gap-3 text-center pt-2">
              {/* D */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-xs font-bold text-rose-400">{calculatedPreview.scoreD}</span>
                <div className="w-8 bg-slate-800 rounded-t h-32 flex items-end justify-center p-1 relative overflow-hidden">
                  <div
                    style={{ height: `${(calculatedPreview.scoreD / maxScore) * 100}%` }}
                    className="w-full bg-rose-500 rounded-t transition-all duration-500"
                  />
                </div>
                <span className="text-xs font-bold text-slate-300">D</span>
                <span className="text-[9px] text-slate-400">Dominance</span>
              </div>

              {/* I */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-xs font-bold text-amber-400">{calculatedPreview.scoreI}</span>
                <div className="w-8 bg-slate-800 rounded-t h-32 flex items-end justify-center p-1 relative overflow-hidden">
                  <div
                    style={{ height: `${(calculatedPreview.scoreI / maxScore) * 100}%` }}
                    className="w-full bg-amber-500 rounded-t transition-all duration-500"
                  />
                </div>
                <span className="text-xs font-bold text-slate-300">I</span>
                <span className="text-[9px] text-slate-400">Influence</span>
              </div>

              {/* S */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-xs font-bold text-emerald-400">{calculatedPreview.scoreS}</span>
                <div className="w-8 bg-slate-800 rounded-t h-32 flex items-end justify-center p-1 relative overflow-hidden">
                  <div
                    style={{ height: `${(calculatedPreview.scoreS / maxScore) * 100}%` }}
                    className="w-full bg-emerald-500 rounded-t transition-all duration-500"
                  />
                </div>
                <span className="text-xs font-bold text-slate-300">S</span>
                <span className="text-[9px] text-slate-400">Steadiness</span>
              </div>

              {/* C */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-xs font-bold text-blue-400">{calculatedPreview.scoreC}</span>
                <div className="w-8 bg-slate-800 rounded-t h-32 flex items-end justify-center p-1 relative overflow-hidden">
                  <div
                    style={{ height: `${(calculatedPreview.scoreC / maxScore) * 100}%` }}
                    className="w-full bg-blue-500 rounded-t transition-all duration-500"
                  />
                </div>
                <span className="text-xs font-bold text-slate-300">C</span>
                <span className="text-[9px] text-slate-400">Compliance</span>
              </div>
            </div>

            {/* Profile Summary Box */}
            <div className="bg-slate-800/90 rounded-lg p-4 border border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tipe Kepribadian Utama:</span>
                <span className="font-bold text-purple-300 text-sm">
                  {calculatedPreview.dominantType}
                </span>
              </div>

              {calculatedPreview.secondaryType !== 'None' && (
                <div className="flex items-center justify-between border-t border-slate-700/60 pt-2">
                  <span className="text-slate-400">Tipe Sekunder:</span>
                  <span className="font-semibold text-slate-200">
                    {calculatedPreview.secondaryType}
                  </span>
                </div>
              )}

              <p className="text-[11px] text-slate-300 pt-2 leading-relaxed border-t border-slate-700/60">
                {calculatedPreview.description}
              </p>
            </div>

            {/* Recommended Positions */}
            <div className="bg-purple-950/40 p-3.5 rounded-lg border border-purple-800/50 space-y-1 text-xs">
              <div className="flex items-center space-x-1 text-purple-300 font-bold mb-1">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Rekomendasi Penempatan Kerja HR:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-purple-200 space-y-1">
                {calculatedPreview.recommendedRoles.map((role, idx) => (
                  <li key={idx}>{role}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Col: 24 Sets Questionnaire */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Lembar Jawaban 24 Set Soal DISC
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih <strong className="text-purple-700">M (Most)</strong> untuk gambaran yang paling sesuai, dan <strong className="text-rose-700">L (Least)</strong> untuk yang paling tidak sesuai.
                </p>
              </div>

              <div className="text-xs bg-slate-100 text-slate-700 font-semibold px-3 py-1 rounded-full border border-slate-300">
                Terisi: {answeredSetsCount} / 24
              </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
              {DISC_QUESTIONS.map((qSet) => {
                const ans = userAnswers[qSet.setNumber] || { most: '', least: '' };
                return (
                  <div
                    key={qSet.setNumber}
                    className={`p-4 rounded-lg border text-xs space-y-3 transition ${
                      ans.most && ans.least
                        ? 'bg-purple-50/30 border-purple-200'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200/80 pb-2">
                      <span>Set Soal #{qSet.setNumber}</span>
                      {ans.most && ans.least && (
                        <span className="text-emerald-600 text-[10px] bg-emerald-100 px-2 py-0.5 rounded flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Lengkap</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {qSet.choices.map((choice) => {
                        const isMost = ans.most === choice.id;
                        const isLeast = ans.least === choice.id;

                        return (
                          <div
                            key={choice.id}
                            className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-purple-300 transition"
                          >
                            <span className="text-slate-700 font-medium pr-2 flex-1">
                              {choice.text}
                            </span>

                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSelectChoice(qSet.setNumber, choice.id, 'most')}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                                  isMost
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-purple-100'
                                }`}
                              >
                                M (Most)
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSelectChoice(qSet.setNumber, choice.id, 'least')}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                                  isLeast
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-rose-100'
                                }`}
                              >
                                L (Least)
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
