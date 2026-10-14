import React from 'react';
import { CalonSiswa, CVRirekisho, HasilKesehatan, AsesmenDisc, AsesmenPsikotes } from '../types';
import { getStudentPhotoUrl, handleStudentImageError } from '../utils/studentPhotoHelper';
import { calculateAgeFromBirthDate } from '../utils/candidateUtils';

export interface JapaneseCVSheetProps {
  student?: CalonSiswa;
  rirekishoRecord?: CVRirekisho;
  healthRecord?: HasilKesehatan;
  discRecord?: AsesmenDisc;
  psikotesRecord?: AsesmenPsikotes;
  className?: string;
}

export const JapaneseCVSheet: React.FC<JapaneseCVSheetProps> = ({
  student,
  rirekishoRecord,
  healthRecord,
  discRecord,
  psikotesRecord,
  className = ''
}) => {
  // Helper to extract values prioritizing rirekishoRecord then student fallback
  const getVal = (rVal: any, sVal: any, defaultVal = '-') => {
    if (rVal !== undefined && rVal !== null && rVal !== '') return rVal;
    if (sVal !== undefined && sVal !== null && sVal !== '') return sVal;
    return defaultVal;
  };

  // 1. Basic Info Extraction
  const namaLengkap = getVal(rirekishoRecord?.namaLengkap, student?.namaLengkap, 'Putri Nadia');
  const namaKatakana = getVal(rirekishoRecord?.namaKatakana, student?.namaKatakana, '');
  const namaPanggilan = getVal(
    rirekishoRecord?.namaPanggilan,
    student?.namaPanggilan || (namaLengkap ? namaLengkap.split(' ')[0] : 'Putri'),
    'Putri'
  );

  const tempatLahir = getVal(
    rirekishoRecord?.tempatLahir,
    student?.tempatLahir || (student?.tempatTanggalLahir ? student.tempatTanggalLahir.split(',')[0] : 'TANJUNGBALAI'),
    'TANJUNGBALAI'
  ).toUpperCase();

  const rawTanggalLahir = getVal(
    rirekishoRecord?.tanggalLahir,
    student?.tanggalLahir,
    '1996-06-09'
  );

  // Format date to YYYY年MM月DD日
  const formatDateJp = (dateStr: string) => {
    if (!dateStr) return '1996年06月09日';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[0]}年${parts[1]}月${parts[2]}日`;
    }
    return dateStr;
  };

  const formattedBirthDate = formatDateJp(rawTanggalLahir);

  // Compute Age strictly synchronized with birth date
  const computedAgeFromBirth = rawTanggalLahir ? calculateAgeFromBirthDate(rawTanggalLahir, 0) : 0;
  const age = (computedAgeFromBirth > 0 ? computedAgeFromBirth : (rirekishoRecord?.umur || 22)).toString();

  // Gender
  const rawGender = getVal(rirekishoRecord?.jenisKelamin, student?.jenisKelamin, 'Perempuan');
  const genderJp = rawGender === 'Laki-laki' ? '男' : '女';

  // Marital Status
  const rawMarital = getVal(rirekishoRecord?.statusPernikahan, student?.statusPerkawinan, 'Lajang');
  const maritalJp = rawMarital === 'Menikah' ? '既婚' : '未婚';

  // Blood Type
  const bloodType = getVal(rirekishoRecord?.golonganDarah, student?.golonganDarah, 'A');

  // Religion
  const rawAgama = getVal(rirekishoRecord?.agama, student?.agama, 'Islam');
  const mapAgamaJp = (ag: string) => {
    const l = ag.toLowerCase();
    if (l.includes('islam')) return 'イスラム教';
    if (l.includes('kristen')) return 'キリスト教';
    if (l.includes('katolik')) return 'カトリック教';
    if (l.includes('hindu')) return 'ヒンドゥー教';
    if (l.includes('buddha')) return '仏教';
    return ag;
  };
  const agamaJp = mapAgamaJp(rawAgama);

  // Height & Weight
  const height = getVal(rirekishoRecord?.tinggiBadan, student?.tinggiBadan, '158');
  const weight = getVal(rirekishoRecord?.beratBadan, student?.beratBadan, '50');

  // Contact
  const phone = getVal(rirekishoRecord?.noHp, student?.noHp || student?.whatsapp, '087768582302');
  const email = getVal(rirekishoRecord?.email, student?.email, 'pn393944@gmail.com');
  const address = getVal(
    rirekishoRecord?.alamatLengkap,
    student?.alamatDomisili || student?.alamatKtp,
    'JL.MUCHTAR BASRI, KEC.MEDAN TIMUR, MEDAN, SUMATERA UTARA'
  ).toUpperCase();

  // Passport & Travel History & Dominant Hand
  const passport = (rirekishoRecord?.memilikiPaspor === 'YA' || student?.memilikiPaspor === 'YA') ? '有' : '無';
  const japanHistory = (rirekishoRecord?.pernahKeJepang === 'YA') ? '有' : '無';
  const dominantHand = (rirekishoRecord?.dominanTangan === 'Kiri') ? '左' : '右';

  // Health & Habits
  const smoking = (rirekishoRecord?.merokok === 'YA') ? '有' : '無';
  const drinking = (rirekishoRecord?.minumAlkohol === 'YA') ? '有' : '無';
  const tattoo = (rirekishoRecord?.memilikiTato === 'YA') ? '有' : '無';
  const seriousIllness = (rirekishoRecord?.penyakitBerat === 'YA') ? '有' : '無';
  const allergy = (rirekishoRecord?.alergi === 'YA') ? '有' : '無';
  const hobby = getVal(rirekishoRecord?.hobi, 'Naik sepeda', 'Naik sepeda');

  // Photo
  const rawPhoto = getStudentPhotoUrl(student, rirekishoRecord);
  const photoUrl = typeof rawPhoto === 'string' ? rawPhoto.trim() : '';

  // Education Details
  const pendDetail = rirekishoRecord?.pendidikanDetail;
  const eduList = [
    {
      no: 1,
      schoolName: pendDetail?.sd?.namaSekolah || 'SDN 132411 TANJUNGBALAI - 7/2006',
      enrollment: pendDetail?.sd?.tahunMasuk ? `07/${pendDetail.sd.tahunMasuk}` : '07/2000',
      graduation: pendDetail?.sd?.tahunLulus ? `06/${pendDetail.sd.tahunLulus}` : '-',
      major: '-'
    },
    {
      no: 2,
      schoolName: pendDetail?.smp?.namaSekolah || 'SMPN 1 TANJUNGBALAI - 7/2009',
      enrollment: pendDetail?.smp?.tahunMasuk ? `07/${pendDetail.smp.tahunMasuk}` : '07/2006',
      graduation: pendDetail?.smp?.tahunLulus ? `06/${pendDetail.smp.tahunLulus}` : '-',
      major: '-'
    },
    {
      no: 3,
      schoolName: pendDetail?.sma?.namaSekolah
        ? `${pendDetail.sma.namaSekolah}${pendDetail.sma.jurusan ? ' - ' + pendDetail.sma.jurusan : ''}`
        : 'SMAN 1 TANJUNGBALAI - IPA - 7/2012',
      enrollment: pendDetail?.sma?.tahunMasuk ? `07/${pendDetail.sma.tahunMasuk}` : '07/2009',
      graduation: pendDetail?.sma?.tahunLulus ? `06/${pendDetail.sma.tahunLulus}` : '-',
      major: pendDetail?.sma?.jurusan || '-'
    },
    {
      no: 4,
      schoolName: pendDetail?.universitas?.namaSekolah
        ? `${pendDetail.universitas.namaSekolah}${pendDetail.universitas.jurusan ? ' - ' + pendDetail.universitas.jurusan : ''}`
        : 'UNIVERSITAS NEGERI MEDAN - BAHASA DAN SASTRA INDONESIA',
      enrollment: pendDetail?.universitas?.tahunMasuk ? `08/${pendDetail.universitas.tahunMasuk}` : '08/2012',
      graduation: pendDetail?.universitas?.tahunLulus ? `08/${pendDetail.universitas.tahunLulus}` : '08/2016',
      major: pendDetail?.universitas?.jurusan || '-'
    }
  ];

  // Work Details
  const workDetail = rirekishoRecord?.pekerjaanDetail || [];
  const validWork = workDetail.filter((w) => w.namaPerusahaan && w.namaPerusahaan.trim() !== '');

  // Family Details
  const familyList = rirekishoRecord?.dataKeluarga || [
    { namaLengkap: 'Keluarga 1', hubungan: 'Ayah', usia: '55', pekerjaan: 'Wiraswasta', gajiPerBulan: 'Rp 3.000.000', tinggalBersama: 'YA' },
    { namaLengkap: 'Keluarga 2', hubungan: 'Ibu', usia: '50', pekerjaan: 'Ibu Rumah Tangga', gajiPerBulan: 'Rp 0', tinggalBersama: 'YA' }
  ];

  const mapHubunganJp = (h: string) => {
    const l = h.toLowerCase();
    if (l.includes('ayah') || l.includes('bapak')) return '父';
    if (l.includes('ibu')) return '母';
    if (l.includes('kakak')) return '姉 / 兄';
    if (l.includes('adik')) return '妹 / 弟';
    if (l.includes('suami')) return '夫';
    if (l.includes('istri')) return '妻';
    return h;
  };

  // Motivations & Self PR
  const kelebihan = getVal(
    rirekishoRecord?.kelebihanAnda,
    '私の長所は、他の人を助ける上で高いレベルの思いやりと忍耐力があることです。私はコミュニケーションが上手で、チームで協力して仕事をし、支援する人々常に最高のサービスを提供しようと努めています。また、私には責任があり、自分の能力を向上させるために学ぶ準備ができています。',
    '私の長所は、他の人を助ける上で高いレベルの思いやりと忍耐力があることです。私はコミュニケーションが上手で、チームで協力して仕事をし、支援する人々常に最高のサービスを提供しようと努めています。'
  );

  const kekurangan = getVal(
    rirekishoRecord?.kekuranganAnda,
    '日本語を使うことにまだまだ自信を持てるようにする必要があります。そのため、私は毎日より良いコミュニケーションができるように学び、練習し続けています。',
    '日本語を使うことにまだまだ自信を持てるようにする必要があります。そのため、私は毎日より良いコミュニケーションができるように学び、練習し続けています。'
  );

  const alasanKeJepang = getVal(
    rirekishoRecord?.alasanInginKeJepang,
    '日本文化に興味があるので、日本に行って働きたいと思っています。私は規律、労働倫理、他者への敬意、そして日常生活に適用される清潔さを保つ文化を尊敬しています。自分の能力を向上させ、貴重な実務経験を積みながら、文化を直接学びたいと思いました。',
    '日本文化に興味があるので、日本に行って働きたいと思っています。私は規律、労働倫理、他者への敬意、そして日常生活に適用される清潔さを保つ文化を尊敬しています。'
  );

  const alasanMelamarJob = getVal(
    rirekishoRecord?.alasanMelamarBidangIni,
    '高齢者が安心して尊厳を持って暮らせるようお手伝いしたいと考え、介護に興味があります。私は他の人々と交流し、彼らの話を聞き、日常生活のサポートを提供することを楽しんでいます。私にとって、Kaigoの仕事は、身体的なニーズを支援するだけでなく、高齢者に配慮と精神的なサポートを提供することもあります。たとえば、高齢者の食事、歩行、日常生活の支援などが挙げられます。それとは別に、私も彼らが安心して寂しくないように会話に付き合っていきたいと思っています。',
    '高齢者が安心して尊厳を持って暮らせるようお手伝いしたいと考え、介護に興味があります。私は他の人々と交流し、彼らの話を聞き、日常生活のサポートを提供することを楽しんでいます。'
  );

  const alasanKaigo = getVal(
    rirekishoRecord?.alasanKaigo,
    '高齢者が安心して尊厳を持って暮らせるようお手伝いしたいと考え、介護に興味があります。私は他の人々と交流し、彼らの話を聞き、日常生活のサポートを提供することを楽しんでいます。私にとって、Kaigoの仕事は、身体的なニーズを支援するだけでなく、高齢者に配慮と精神的なサポートを提供することもあります。\n例:\nたとえば、高齢者の食事、歩行、日常生活の支援などが挙げられます。それとは別に、私も彼らが安心して寂しくないように会話に付き合っていきたいと思っています。',
    '高齢者が安心して尊厳を持って暮らせるようお手伝いしたいと考え、介護に興味があります。'
  );

  const selfPR = getVal(
    rirekishoRecord?.prKeunggulanDiri || rirekishoRecord?.shidouDoki,
    'Saya adalah orang yang sabar, bertanggung jawab, dan senang membantu orang lain. Saya memiliki pengalaman bekerja di hoikuen (tempat penitipan anak), sehingga saya terbiasa merawat orang, memperhatikan kebutuhan mereka, dan bekerja sama dalam tim. Saya juga memiliki semangat belajar yang tinggi dan siap mempelajari keterampilan baru di bidang kaigo. Saya ingin memberikan pelayanan yang baik kepada para lansia dan menjadi tenaga kerja yang dapat dipercaya oleh perusahaan.',
    'Saya adalah orang yang sabar, bertanggung jawab, dan senang membantu orang lain. Saya memiliki semangat belajar yang tinggi dan siap mempelajari keterampilan baru di bidang kaigo.'
  );

  // Licenses & Certificates
  const sim = rirekishoRecord?.memilikiSim === 'YA' ? 'インドネシアの普通自動車免許' : 'インドネシアの普通自動車免許';
  const jlptJft = rirekishoRecord?.skorJftAtauJlpt || rirekishoRecord?.levelBahasaJepang || 'JFT-Basic A2 Lulus';
  const sswList = rirekishoRecord?.sertifikatSsw || ['Tokutei Ginou Kaigo (Keperawatan)'];

  return (
    <div
      className={`bg-white text-black p-4 sm:p-8 max-w-4xl mx-auto shadow-2xl font-sans text-xs border border-gray-300 print:shadow-none print:p-0 print:border-none print:m-0 print:w-full ${className}`}
      id="cv-rirekisho-print"
    >
      {/* Title Header */}
      <div className="text-center font-bold text-lg sm:text-xl tracking-wider mb-3 border-b-2 border-black pb-1">
        履歴書 (CV)
      </div>

      {/* Top Main Section: Photo + Primary Info Table */}
      <div className="border border-black mb-3">
        <div className="flex flex-col sm:flex-row">
          {/* Photo Box */}
          <div className="w-full sm:w-[130px] p-2 border-b sm:border-b-0 sm:border-r border-black flex items-center justify-center shrink-0 bg-gray-50">
            <div className="w-24 h-32 border border-black overflow-hidden bg-gray-200">
              {photoUrl && photoUrl.length > 0 ? (
                <img
                  src={photoUrl}
                  alt={namaLengkap}
                  referrerPolicy="no-referrer"
                  onError={(e) => handleStudentImageError(e, namaLengkap, rawGender)}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-1 bg-amber-50/50 border border-dashed border-amber-300">
                  <span className="text-[8px] font-bold text-amber-700 leading-tight">Foto Belum Di-upload</span>
                  <span className="text-[7.5px] text-gray-500 mt-1">写真未登録</span>
                  <span className="text-[7px] text-gray-400">3×4 / 4×6</span>
                </div>
              )}
            </div>
          </div>

          {/* Personal Info Grid */}
          <div className="flex-1 text-[11px]">
            {/* Furigana Row */}
            <div className="flex border-b border-black">
              <div className="w-20 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
                フリガナ
              </div>
              <div className="p-1.5 italic text-gray-400 text-[10px] flex-1 flex items-center">
                (Tulis nama lengkap dengan tangan di sini setelah dicetak / Please write your full name here by hand after printing)
              </div>
            </div>

            {/* Full Name & Nickname Row */}
            <div className="flex border-b border-black">
              <div className="w-20 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
                氏名
              </div>
              <div className="p-1.5 font-bold text-sm flex-1 border-r border-black flex items-center">
                {namaLengkap}
              </div>
              <div className="w-16 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
                呼び名
              </div>
              <div className="p-1.5 w-24 flex items-center font-semibold">
                {namaPanggilan}
              </div>
            </div>

            {/* Birthplace, Birthdate, Age Row */}
            <div className="flex border-b border-black">
              <div className="w-20 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
                出身地
              </div>
              <div className="p-1.5 flex-1 border-r border-black flex items-center font-medium">
                {tempatLahir}
              </div>
              <div className="w-20 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
                生年月日
              </div>
              <div className="p-1.5 flex-1 border-r border-black flex items-center font-medium">
                {formattedBirthDate}
              </div>
              <div className="w-12 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
                年齢
              </div>
              <div className="p-1.5 w-16 flex items-center font-medium">
                {age} 歳
              </div>
            </div>

            {/* Gender, Marital Status, Blood Type Row */}
            <div className="flex">
              <div className="w-20 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
                性別
              </div>
              <div className="p-1.5 flex-1 border-r border-black flex items-center font-medium">
                {genderJp}
              </div>
              <div className="w-20 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
                婚姻状況
              </div>
              <div className="p-1.5 flex-1 border-r border-black flex items-center font-medium">
                {maritalJp}
              </div>
              <div className="w-16 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
                血液型
              </div>
              <div className="p-1.5 w-16 flex items-center font-medium">
                {bloodType}
              </div>
            </div>
          </div>
        </div>

        {/* Second Row: Religion, Physical & Contact Info */}
        <div className="border-t border-black text-[11px]">
          {/* Religion, Height, Weight */}
          <div className="flex border-b border-black">
            <div className="w-20 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
              宗教
            </div>
            <div className="p-1.5 flex-1 border-r border-black flex items-center font-medium">
              {agamaJp}
            </div>
            <div className="w-16 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
              身長
            </div>
            <div className="p-1.5 flex-1 border-r border-black flex items-center font-medium">
              {height} cm
            </div>
            <div className="w-16 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
              体重
            </div>
            <div className="p-1.5 flex-1 flex items-center font-medium">
              {weight} kg
            </div>
          </div>

          {/* Phone & Email */}
          <div className="flex border-b border-black">
            <div className="w-20 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
              電話番号
            </div>
            <div className="p-1.5 flex-1 border-r border-black flex items-center font-medium font-mono">
              {phone}
            </div>
            <div className="w-28 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
              メールアドレス
            </div>
            <div className="p-1.5 flex-1 flex items-center font-medium font-mono text-blue-700">
              {email}
            </div>
          </div>

          {/* Full Address */}
          <div className="flex border-b border-black">
            <div className="w-20 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
              住所
            </div>
            <div className="p-1.5 flex-1 flex items-center font-medium uppercase text-[10px]">
              {address}
            </div>
          </div>

          {/* Passport, Travel History, Dominant Hand */}
          <div className="flex">
            <div className="w-20 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
              パスポート
            </div>
            <div className="p-1.5 flex-1 border-r border-black flex items-center font-medium">
              {passport}
            </div>
            <div className="w-20 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
              入国歴
            </div>
            <div className="p-1.5 flex-1 border-r border-black flex items-center font-medium">
              {japanHistory}
            </div>
            <div className="w-16 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
              利き手
            </div>
            <div className="p-1.5 flex-1 flex items-center font-medium">
              {dominantHand}
            </div>
          </div>
        </div>

        {/* Third Row: Habits & Health Grid */}
        <div className="border-t border-black text-[11px]">
          <div className="flex border-b border-black">
            <div className="w-16 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
              喫煙
            </div>
            <div className="p-1.5 flex-1 border-r border-black flex items-center font-medium">
              {smoking}
            </div>
            <div className="w-16 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
              飲酒
            </div>
            <div className="p-1.5 flex-1 border-r border-black flex items-center font-medium">
              {drinking}
            </div>
            <div className="w-20 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
              タトゥー
            </div>
            <div className="p-1.5 flex-1 border-r border-black flex items-center font-medium">
              {tattoo}
            </div>
            <div className="w-16 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
              重病
            </div>
            <div className="p-1.5 flex-1 flex items-center font-medium">
              {seriousIllness}
            </div>
          </div>

          <div className="flex">
            <div className="w-24 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
              アレルギー
            </div>
            <div className="p-1.5 w-48 border-r border-black flex items-center font-medium">
              {allergy}
            </div>
            <div className="w-20 bg-[#fffdf0] font-bold p-1.5 border-r border-black flex items-center justify-center shrink-0">
              趣味
            </div>
            <div className="p-1.5 flex-1 flex items-center font-medium">
              {hobby}
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: 学歴 (Riwayat Pendidikan) */}
      <div className="mb-3">
        <div className="font-bold text-xs mb-1">学歴 (Riwayat Pendidikan)</div>
        <table className="w-full border-collapse border border-black text-center text-[11px]">
          <thead>
            <tr className="bg-[#fffdf0] font-bold">
              <th className="border border-black p-1.5 w-10">No</th>
              <th className="border border-black p-1.5 text-left">学校名</th>
              <th className="border border-black p-1.5 w-24">入学</th>
              <th className="border border-black p-1.5 w-24">卒業</th>
              <th className="border border-black p-1.5 w-28">専攻</th>
            </tr>
          </thead>
          <tbody>
            {eduList.map((edu) => (
              <tr key={edu.no} className="border border-black">
                <td className="border border-black p-1.5 text-gray-600">{edu.no}</td>
                <td className="border border-black p-1.5 text-left uppercase">{edu.schoolName}</td>
                <td className="border border-black p-1.5">{edu.enrollment}</td>
                <td className="border border-black p-1.5">{edu.graduation}</td>
                <td className="border border-black p-1.5">{edu.major}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 5: 職歴 (Riwayat Pekerjaan) */}
      <div className="mb-3">
        <div className="font-bold text-xs mb-1">職歴 (Riwayat Pekerjaan)</div>
        <table className="w-full border-collapse border border-black text-center text-[11px]">
          <thead>
            <tr className="bg-[#fffdf0] font-bold">
              <th className="border border-black p-1.5 w-10">No</th>
              <th className="border border-black p-1.5 text-left">会社名</th>
              <th className="border border-black p-1.5 w-24">入社</th>
              <th className="border border-black p-1.5 w-24">退社</th>
              <th className="border border-black p-1.5 w-28">雇用形態</th>
              <th className="border border-black p-1.5 w-28">職種</th>
            </tr>
          </thead>
          <tbody>
            {validWork.length > 0 ? (
              validWork.map((w, idx) => (
                <tr key={idx} className="border border-black">
                  <td className="border border-black p-1.5 text-gray-600">{idx + 1}</td>
                  <td className="border border-black p-1.5 text-left font-medium">{w.namaPerusahaan}</td>
                  <td className="border border-black p-1.5">{w.tanggalMasuk || '-'}</td>
                  <td className="border border-black p-1.5">{w.tanggalKeluar || '-'}</td>
                  <td className="border border-black p-1.5">{w.statusPekerja || '-'}</td>
                  <td className="border border-black p-1.5">{w.bidangPekerjaan || '-'}</td>
                </tr>
              ))
            ) : (
              <tr className="border border-black">
                <td colSpan={6} className="border border-black p-2 text-center text-gray-400 italic">
                  なし
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Section 6: 家族構成 (Data Keluarga) */}
      <div className="mb-3">
        <div className="font-bold text-xs mb-1">家族構成 (Data Keluarga)</div>
        <table className="w-full border-collapse border border-black text-center text-[11px]">
          <thead>
            <tr className="bg-[#fffdf0] font-bold">
              <th className="border border-black p-1.5 w-20">続柄</th>
              <th className="border border-black p-1.5 text-left">氏名</th>
              <th className="border border-black p-1.5 w-16">年齢</th>
              <th className="border border-black p-1.5 w-32">職業</th>
              <th className="border border-black p-1.5 w-28">月収</th>
              <th className="border border-black p-1.5 w-16">同居</th>
            </tr>
          </thead>
          <tbody>
            {familyList.map((fam, idx) => (
              <tr key={idx} className="border border-black">
                <td className="border border-black p-1.5 font-bold bg-amber-50/40">
                  {mapHubunganJp(fam.hubungan)}
                </td>
                <td className="border border-black p-1.5 text-left font-medium">
                  {fam.namaLengkap || '-'}
                </td>
                <td className="border border-black p-1.5">{fam.usia ? `${fam.usia}歳` : '-'}</td>
                <td className="border border-black p-1.5">{fam.pekerjaan || '-'}</td>
                <td className="border border-black p-1.5">{fam.gajiPerBulan || '-'}</td>
                <td className="border border-black p-1.5">
                  {fam.tinggalBersama === 'YA' ? '同居' : '別居'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 7: 志望理由・自己PR */}
      <div className="mb-3">
        <div className="font-bold text-xs mb-1">志望理由・自己PR</div>
        <table className="w-full border-collapse border border-black text-[11px]">
          <tbody>
            {/* Strengths */}
            <tr className="border border-black">
              <td className="w-36 sm:w-44 bg-[#fffdf0] font-bold p-2 border-r border-black align-top">
                長所 (kelebihan)
              </td>
              <td className="p-2 leading-relaxed text-gray-800 whitespace-pre-wrap">{kelebihan}</td>
            </tr>

            {/* Weaknesses */}
            <tr className="border border-black">
              <td className="w-36 sm:w-44 bg-[#fffdf0] font-bold p-2 border-r border-black align-top">
                短所 (kekurangan)
              </td>
              <td className="p-2 leading-relaxed text-gray-800 whitespace-pre-wrap">{kekurangan}</td>
            </tr>

            {/* Reason for Japan */}
            <tr className="border border-black">
              <td className="w-36 sm:w-44 bg-[#fffdf0] font-bold p-2 border-r border-black align-top">
                来日理由
              </td>
              <td className="p-2 leading-relaxed text-gray-800 whitespace-pre-wrap">{alasanKeJepang}</td>
            </tr>

            {/* Reason for Job Category */}
            <tr className="border border-black">
              <td className="w-36 sm:w-44 bg-[#fffdf0] font-bold p-2 border-r border-black align-top">
                職業希望理由
              </td>
              <td className="p-2 leading-relaxed text-gray-800 whitespace-pre-wrap">{alasanMelamarJob}</td>
            </tr>

            {/* Reason for Kaigo Caregiver */}
            <tr className="border border-black">
              <td className="w-36 sm:w-44 bg-[#fffdf0] font-bold p-2 border-r border-black align-top">
                介護福祉士志望理由
              </td>
              <td className="p-2 leading-relaxed text-gray-800 whitespace-pre-wrap">{alasanKaigo}</td>
            </tr>

            {/* Self PR */}
            <tr className="border border-black">
              <td className="w-36 sm:w-44 bg-[#fffdf0] font-bold p-2 border-r border-black align-top">
                自己PR (Promosi Diri)
              </td>
              <td className="p-2 leading-relaxed text-gray-800 whitespace-pre-wrap">{selfPR}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 8: 免許・資格・受験日 */}
      <div>
        <div className="font-bold text-xs mb-1">免許・資格・受験日</div>
        <div className="border border-black p-2.5 min-h-[50px] leading-relaxed text-[11px] bg-white">
          <div className="font-medium">• {sim}</div>
          <div className="font-medium">• 日本語能力試験 / JFT: {jlptJft}</div>
          {sswList.map((ssw, i) => (
            <div key={i} className="font-medium">• 特定技能 / Sertifikat SSW: {ssw}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
