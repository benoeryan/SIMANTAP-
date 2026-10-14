import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useEcosystemTranslation } from '../../i18n/ecosystem-i18n';
import { MarketingLead, FollowUpLogItem, MarketingStaff } from '../../types';
import {
  translateJobSector,
  translatePipelineStage,
  translateMarketingRole
} from '../../utils/marketingTranslations';
import {
  MessageCircle,
  Clock,
  Phone,
  Send,
  Sparkles,
  Calendar,
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  UserPlus
} from 'lucide-react';

interface MarketingFollowUpViewProps {
  leads: MarketingLead[];
  staffList: MarketingStaff[];
  onOpenWhatsApp: (lead: MarketingLead, customMessage?: string) => void;
  onOpenFollowUp: (lead: MarketingLead) => void;
  onOpenDetail: (lead: MarketingLead) => void;
  onAddFollowUpLog: (leadId: string, log: Omit<FollowUpLogItem, 'id'>) => void;
}

export const MarketingFollowUpView: React.FC<MarketingFollowUpViewProps> = ({
  leads,
  staffList,
  onOpenWhatsApp,
  onOpenFollowUp,
  onOpenDetail,
  onAddFollowUpLog
}) => {
  const { lang } = useApp();
  const { bilingual } = useEcosystemTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('ALL');
  const [selectedLeadForComposer, setSelectedLeadForComposer] = useState<MarketingLead | null>(
    leads.length > 0 ? leads[0] : null
  );
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('greeting');
  const [customDraft, setCustomDraft] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // WA Templates
  const templates = [
    {
      key: 'greeting',
      title: bilingual('1. Salam Perkenalan & Info Awal LPK', '1. 挨拶＆IJEF初期プログラム案内'),
      desc: bilingual('Sapaan ramah pengenalan program kerja Jepang IJEF', 'IJEF日本就労プログラムへの親身な導入案内'),
      text: (lead: MarketingLead) =>
        lang === 'ja'
          ? `${lead.namaLengkap} 様、LPK IJEF Corp バンドン校でございます 🇯🇵✨\n\nこの度は、日本就労プログラム（希望分野: ${translateJobSector(lead.bidangMinat, 'ja')}）にご関心をお寄せいただき誠にありがとうございます。現在、次期生向け日本語研修および就労準備クラスの受講生を募集しております。\n\nもし本日少々お時間がございましたら、プログラムの詳細や想定給与シミュレーションについて簡単にご案内させていただければ幸いです。よろしくお願い申し上げます。`
          : `Halo Kak ${lead.namaLengkap}, salam kenal dari LPK IJEF Corp Bandung 🇯🇵✨\n\nTerima kasih telah menunjukkan ketertarikan untuk bekerja di Jepang bidang ${lead.bidangMinat || 'Tokutei Ginou'}. Kami ingin menginformasikan bahwa pendaftaran kelas pelatihan bahasa Jepang dan persiapan kerja batch baru sedang dibuka.\n\nApakah Kak ${lead.namaLengkap} ada waktu luang hari ini untuk konsultasi singkat mengenai rincian program dan simulasi gaji? Terima kasih.`
    },
    {
      key: 'undangan_konseling',
      title: bilingual('2. Undangan Konseling & Visit Kantor LPK', '2. カウンセリング・来校/Zoom案内'),
      desc: bilingual('Undangan tatap muka / zoom meeting konsultasi', '対面面談・オンラインZoom相談への招待'),
      text: (lead: MarketingLead) =>
        lang === 'ja'
          ? `${lead.namaLengkap} 様、お世話になっております。\n\n先ほどお話しさせていただいた日本就労プログラム（${translateJobSector(lead.bidangMinat, 'ja')}分野）の件につきまして、LPK IJEF Corpバンドン校での対面カウンセリング、またはオンラインZoom面談へご案内申し上げます。\n\n全体のプロセス、IJEF費用立替・支援制度、日本受入企業との面接機会について丁寧にご説明いたします。ご都合の良い日時をお知らせくださいませ。`
          : `Selamat siang Kak ${lead.namaLengkap},\n\nMelanjutkan pembicaraan kita mengenai program kerja ke Jepang (Bidang ${lead.bidangMinat}), kami mengundang Kak ${lead.namaLengkap} untuk menghadiri sesi konsultasi tatap muka di Kantor LPK IJEF Corp Bandung atau via Online Zoom Meeting.\n\nKami akan menjelaskan secara transparan: Alur proses, Skema Dana Talangan IJEF, dan peluang interview user Jepang. Silakan konfirmasi hari dan jam yang sesuai ya Kak. Terima kasih!`
    },
    {
      key: 'rincian_biaya',
      title: bilingual('3. Info Biaya & Skema Dana Talangan IJEF', '3. 費用明細＆IJEF立替支援スキーム'),
      desc: bilingual('Penjelasan transparansi biaya dan pembiayaan', '明瞭な費用体系と立替ローン支援の説明'),
      text: (lead: MarketingLead) =>
        lang === 'ja'
          ? `${lead.namaLengkap} 様、LPK IJEF Corpの研修費用およびサポートスキームをご案内します:\n✅ 日本語教育 (N4/JFT-Basic合格保証)\n✅ 希望職種の特定技能評価試験対策＆認証取得\n✅ 日本現地企業への就労マッチング支援\n✅ 渡航前費用立替・前払い支援制度あり（渡航後分割払い可能）\n\nこちらの費用や立替スキームについて、ご不明点等ございますでしょうか？`
          : `Halo Kak ${lead.namaLengkap},\n\nBerikut kami lampirkan ringkasan program dan skema pembiayaan di LPK IJEF Corp:\n✅ Pelatihan Bahasa Jepang N4/JFT-Basic\n✅ Sertifikasi Skill Tokutei Ginou Sesuai Bidang\n✅ Bantuan Penyaluran Kerja ke Perusahaan Jepang\n✅ Tersedia Program Bantuan Dana Talangan (Talangan Biaya hingga Berangkat)\n\nAda yang ingin ditanyakan lebih lanjut mengenai skema pembiayaan ini Kak ${lead.namaLengkap}?`
    },
    {
      key: 'reminder_followup',
      title: bilingual('4. Reminder & Follow-Up Minat Siswa', '4. 残り枠リマインダー＆意向確認'),
      desc: bilingual('Mengingatkan kembali penawaran slot batch', '定員枠の案内と受講意志のフォローアップ'),
      text: (lead: MarketingLead) =>
        lang === 'ja'
          ? `${lead.namaLengkap} 様、こんにちは！\n\n次回開講予定の${translateJobSector(lead.bidangMinat, 'ja')}クラスですが、募集定員が残り5枠となっております。引き続きLPK IJEF Corpへのご入学・日本就労挑戦をご検討いただいておりますでしょうか？もし不安な点やお悩みなどがございましたら何でもお気軽にご相談ください。`
          : `Halo Kak ${lead.namaLengkap}, semoga harinya menyenangkan ya!\n\nKami ingin mengabarkan bahwa kuota kelas pelatihan persiapan kerja Jepang batch ini tersisa 5 slot lagi untuk bidang ${lead.bidangMinat}. Apakah Kak ${lead.namaLengkap} masih berencana untuk bergabung bersama kami di LPK IJEF Corp? Jika ada kendala, kami siap membantu solusinya. Terima kasih.`
    },
    {
      key: 'closing_deal',
      title: bilingual('5. Konfirmasi Registrasi & Berkas Siswa', '5. 正式登録完了＆必要書類のご案内'),
      desc: bilingual('Panduan pembayaran booking / pengumpulan berkas', '生徒登録完了の手続きと書類提出手順'),
      text: (lead: MarketingLead) =>
        lang === 'ja'
          ? `${lead.namaLengkap} 様、この度はご登録おめでとうございます！🎉\n\nLPK IJEF Corpの日本就労派遣研修生として正式に受付が完了いたしました。次のステップとして身分証明書類（身分証、家族カード、卒業証明書等）のご提出および登録確認へとお進みください。\n\n日本渡航まで当校スタッフが万全にサポートいたします。一緒に夢を実現させましょう！`
          : `Selamat Kak ${lead.namaLengkap}! 🎉\n\nSelamat bergabung menjadi calon siswa resmi LPK IJEF Corp untuk penempatan kerja ke Jepang. Langkah selanjutnya adalah pengisian kelengkapan berkas (KTP, KK, Ijazah) dan konfirmasi registrasi.\n\nTim kami siap mendampingi proses dari awal hingga terbang ke Jepang. Semangat sukses bersama IJEF!`
    }
  ];

  const currentTemplate = templates.find((t) => t.key === selectedTemplateKey) || templates[0];
  const renderedMessage = selectedLeadForComposer
    ? customDraft || currentTemplate.text(selectedLeadForComposer)
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(renderedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWA = () => {
    if (!selectedLeadForComposer) return;
    onOpenWhatsApp(selectedLeadForComposer, renderedMessage);
  };

  // Filtered Leads needing follow up
  const activeFollowUpLeads = leads.filter((lead) => {
    const matchSearch =
      searchTerm.trim() === '' ||
      lead.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.noWhatsapp.includes(searchTerm) ||
      (lead.kotaDomisili || '').toLowerCase().includes(searchTerm.toLowerCase());

    const leadPic = (lead.picMarketingStaff || lead.assignedStaff || '').toLowerCase();
    const matchStaff =
      selectedStaffFilter === 'ALL' ||
      leadPic === selectedStaffFilter.toLowerCase() ||
      leadPic.includes(selectedStaffFilter.toLowerCase());

    return matchSearch && matchStaff;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-orange-600 font-extrabold text-xs tracking-wider uppercase mb-1">
            <MessageCircle className="w-4 h-4" />
            <span>{bilingual('WHATSAPP CRM & FOLLOW-UP ENGINE', 'WHATSAPP CRM ＆ フォローアップエンジン')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {bilingual('Manajemen Follow-Up & Template Pesan Resmi LPK', 'フォローアップ管理＆公式メッセージテンプレート')}
          </h2>
          <p className="text-xs text-slate-500">
            {bilingual(
              'Kirim pesan personal otomatis ke calon siswa dan pantau riwayat interaksi setiap prospek.',
              '見込み生徒への自動パーソナライズ連絡および商談・接触履歴のモニタリングを行います。'
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs bg-orange-100 text-orange-800 font-bold px-3 py-1.5 rounded-xl border border-orange-200">
            {leads.length} {bilingual('Total Leads Terhubung WA', '件のWA接続リード')}
          </span>
        </div>
      </div>

      {/* Main 2-Column Workflow: WA Generator & Leads Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Interactive WhatsApp Message Composer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {bilingual('Composer Pesan WhatsApp Dinamis', '動的WhatsAppメッセージ作成')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {bilingual('Variabel nama & program otomatis terisi', '氏名・希望職種などの変数が自動挿入されます')}
                  </p>
                </div>
              </div>

              {selectedLeadForComposer && (
                <span className="text-xs font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-full">
                  {bilingual('Target: ', '対象: ')}
                  {selectedLeadForComposer.namaLengkap}
                </span>
              )}
            </div>

            {/* Step 1: Select Target Lead */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {bilingual('1. Pilih Calon Siswa Penerima Pesan:', '1. 送信先候補生徒を選択:')}
              </label>
              <select
                value={selectedLeadForComposer?.id || ''}
                onChange={(e) => {
                  const found = leads.find((l) => l.id === e.target.value);
                  setSelectedLeadForComposer(found || null);
                  setCustomDraft('');
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-orange-500"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.namaLengkap} ({l.noWhatsapp}) • {translateJobSector(l.bidangMinat, lang)} • {bilingual('Status: ', '状況: ')}{translatePipelineStage(l.statusLead, lang)}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Choose Template */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {bilingual('2. Pilih Template Pesan Standar LPK IJEF:', '2. IJEF標準メッセージテンプレートを選択:')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templates.map((tpl) => (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateKey(tpl.key);
                      setCustomDraft('');
                    }}
                    className={`p-3 rounded-xl text-left transition border cursor-pointer ${
                      selectedTemplateKey === tpl.key
                        ? 'bg-orange-50 border-orange-500 text-orange-950 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{tpl.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{tpl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Message Preview & Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {bilingual('3. Pratinjau Teks Pesan (Dapat Diedit Langsung):', '3. メッセージ本文プレビュー（直接編集可能）:')}
                </label>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? bilingual('Tersalin!', 'コピー完了！') : bilingual('Salin Pesan', '文章をコピー')}</span>
                </button>
              </div>

              <textarea
                rows={6}
                value={renderedMessage}
                onChange={(e) => setCustomDraft(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 leading-relaxed font-sans focus:bg-white focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Action Trigger Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleSendWA}
                disabled={!selectedLeadForComposer}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{bilingual('Buka WhatsApp & Kirim Pesan Sekarang', 'WhatsAppを起動して今すぐ送信')}</span>
              </button>

              {selectedLeadForComposer && (
                <button
                  type="button"
                  onClick={() => onOpenFollowUp(selectedLeadForComposer)}
                  className="py-3 px-4 bg-orange-100 hover:bg-orange-200 text-orange-900 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-orange-700" />
                  <span>{bilingual('Catat Log Follow-Up', '接触履歴を記録')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Lead Queue & Follow-Up Action List (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {bilingual('Daftar Antrean Follow-Up', 'フォローアップ待機キュー')}
                </h3>
                <p className="text-xs text-slate-500">
                  {bilingual('Pilih lead untuk menyiapkan pesan', 'リードを選択してメッセージを準備')}
                </p>
              </div>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
                {activeFollowUpLeads.length} {bilingual('Lead', '件')}
              </span>
            </div>

            {/* Quick Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={bilingual('Cari nama, kota, nomor WA...', '氏名、居住地、WA番号で検索...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <select
                value={selectedStaffFilter}
                onChange={(e) => setSelectedStaffFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700 font-medium"
              >
                <option value="ALL">{bilingual('Semua PIC Marketing', 'すべての担当スタッフ (PIC)')}</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.nama}>
                    {st.nama} ({translateMarketingRole(st.roleMarketing, lang)})
                  </option>
                ))}
              </select>
            </div>

            {/* Lead Queue Scrollable List */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {activeFollowUpLeads.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {bilingual('Tidak ada lead yang cocok.', '該当するリードが見つかりません。')}
                </div>
              ) : (
                activeFollowUpLeads.map((lead) => {
                  const isSelected = selectedLeadForComposer?.id === lead.id;
                  const displaySector = translateJobSector(lead.bidangMinat, lang);
                  const displayStage = translatePipelineStage(lead.statusLead, lang);

                  return (
                    <div
                      key={lead.id}
                      onClick={() => {
                        setSelectedLeadForComposer(lead);
                        setCustomDraft('');
                      }}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-orange-50 border-orange-400 shadow-xs'
                          : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-xs">{lead.namaLengkap}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-800 font-semibold px-2 py-0.5 rounded-full">
                            {displayStage}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{lead.kotaDomisili}</span>
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center justify-between">
                        <span className="truncate max-w-[180px]">{displaySector}</span>
                        <span className="text-orange-700 font-semibold text-[10px]">
                          PIC: {lead.picMarketingStaff || 'Beno Ryan'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                        <span className="text-slate-400">WA: {lead.noWhatsapp}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenWhatsApp(lead);
                            }}
                            className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>{bilingual('Kirim WA', 'WA送信')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

