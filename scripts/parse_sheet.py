import urllib.request
import csv
import io
import json
import re

url = 'https://docs.google.com/spreadsheets/d/1Z9uOz5LqbRlzU8Z6_JBpUpAMFHRGNXWaFSvcBwtvitw/export?format=csv&gid=0'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
content = urllib.request.urlopen(req).read().decode('utf-8')

reader = csv.reader(io.StringIO(content))
headers = [h.strip() for h in next(reader)]
rows = list(reader)

pref_map = {
    '熊本': '熊本 (Kumamoto)', '広島': '広島 (Hiroshima)', '福岡': '福岡 (Fukuoka)',
    '鹿児島': '鹿児島 (Kagoshima)', '群馬': '群馬 (Gunma)', '兵庫県': '兵庫県 (Hyogo)',
    '埼玉県': '埼玉県 (Saitama)', '香川県': '香川県 (Kagawa)', '大阪': '大阪 (Osaka)',
    '静岡県': '静岡県 (Shizuoka)', '福岡県': '福岡県 (Fukuoka)', '群馬県': '群馬県 (Gunma)',
    '広島県': '広島県 (Hiroshima)', '三重県': '三重県 (Mie)', '山口県': '山口県 (Yamaguchi)',
    '千葉県': '千葉県 (Chiba)', '山梨県': '山梨県 (Yamanashi)', '愛知県': '愛知県 (Aichi)',
    '栃木県': '栃木県 (Tochigi)', '東京': '東京 (Tokyo)', '神奈川': '神奈川 (Kanagawa)',
    '神奈川県': '神奈川県 (Kanagawa)', '宮城県': '宮城県 (Miyagi)', '島根県': '島根県 (Shimane)',
    '奈良県': '奈良県 (Nara)', '新潟県': '新潟県 (Niigata)', '岐阜県': '岐阜県 (Gifu)',
    '関東・関西': '関東・関西 (Kanto/Kansai)', '全国': '全国 (Seluruh Jepang / Nationwide)'
}

def clean_biaya(b):
    b = b.strip()
    if not b or b == '-':
        return 'Gratis / Tanggungan Perusahaan (-)'
    if b.isdigit():
        return f'Rp {int(b):,}.000.000'.replace(',', '.')
    if 'Rp' in b:
        clean_num = re.sub(r'[^\d]', '', b)
        if clean_num:
            return f'Rp {int(clean_num):,}'.replace(',', '.')
    return b

ts_code = '''import { JobPosting } from '../types';

export const GOOGLE_SHEET_JOBS: JobPosting[] = [\n'''

count = 0
for idx, r in enumerate(rows[1:]):
    if not any(r): continue
    row = [c.strip() for c in r[:11]]
    status_raw = row[0]
    judul_raw = row[1]
    daerah_raw = row[2]
    kode_raw = row[3]
    gender_raw = row[4]
    gaji_raw = row[5]
    kebutuhan_raw = row[6]
    kualifikasi_raw = row[7]
    biaya_raw = row[8]
    keterangan_raw = row[9]
    sumber_raw = row[10]

    if not judul_raw and not kode_raw:
        continue

    # Status map
    if status_raw == 'クローズ':
        status_job = 'Tutup'
    elif status_raw == '国内':
        status_job = 'Lokal/Domestik (Jepang)'
    else:
        status_job = 'Aktif'

    # Gender map
    if gender_raw == '男':
        gender_str = '男 (Laki-laki)'
    elif gender_raw == '女':
        gender_str = '女 (Perempuan)'
    elif gender_raw == '男女':
        gender_str = '男女 (Laki-laki & Perempuan)'
    else:
        gender_str = gender_raw or 'Bebas (L/P)'

    # Prefectures
    pref_str = pref_map.get(daerah_raw, daerah_raw or 'Berbagai Prefektur di Jepang')

    # Salary
    sal_num = 200000
    if gaji_raw:
        clean_g_num = re.sub(r'[^\d]', '', gaji_raw.replace('Rp', ''))
        if clean_g_num:
            val = int(clean_g_num)
            if val < 1000:
                sal_num = val * 160
            elif val >= 1000 and val <= 50000:
                sal_num = val * 22
            else:
                sal_num = val

    est_idr = int(sal_num * 105)

    # Quota
    quota = 1
    if kebutuhan_raw:
        m_q = re.search(r'\d+', kebutuhan_raw)
        if m_q:
            quota = int(m_q.group(0))

    # Job ID & Code
    job_id = kode_raw.strip() if kode_raw.strip() else f'JOB-GS-{idx+1:03d}'
    
    # Category
    lower_comb = (judul_raw + ' ' + kualifikasi_raw).lower()
    if 'gijinkoku' in lower_comb or 'insinyur' in lower_comb or 'エンジニア' in lower_comb or 'cad' in lower_comb or 'd3/s1' in lower_comb:
        target_cat = 'MATCHING JOB - Engineering / Gijinkoku'
    elif 'ex-magang' in lower_comb or 'ex ' in lower_comb or 'eks' in lower_comb or 'senmonkyu' in lower_comb or 'jitco' in lower_comb or 'tingkat 2' in lower_comb:
        target_cat = 'MATCHING JOB - Ex-Magang / Ex-Trainee'
    elif 'non ijef' in lower_comb:
        target_cat = 'SISWA NON IJEF (New Comer)'
    else:
        target_cat = 'Semua Non-IJEF'

    # JLPT / Requirement summary
    jlpt_req = 'Sertifikat Bahasa & Skill Sesuai Bidang'
    if 'N2' in kualifikasi_raw:
        jlpt_req = 'JLPT N2 Level'
    elif 'N3' in kualifikasi_raw:
        jlpt_req = 'JLPT N3 Level'
    elif 'N4' in kualifikasi_raw or 'JFT' in kualifikasi_raw:
        jlpt_req = 'JLPT N4 / JFT-Basic A2 + SSW'
    elif 'senmonkyu' in kualifikasi_raw.lower() or 'ex-' in kualifikasi_raw.lower() or 'eks' in kualifikasi_raw.lower():
        jlpt_req = 'Sertifikat Senmonkyuu / Ex-Magang Tokutei'

    biaya_formatted = clean_biaya(biaya_raw)
    company_name = f'Mitra Perusahaan ({sumber_raw})' if sumber_raw else 'Kumiai / Perusahaan Mitra Jepang'
    kumiai_name = f'TSK / Sumber: {sumber_raw}' if sumber_raw else 'TSK Partner Japan'

    entry = f'''  {{
    id: {json.dumps(job_id)},
    kodeJob: {json.dumps(kode_raw or job_id)},
    judulPekerjaan: {json.dumps(judul_raw or "Lowongan Kerja Jepang")},
    kategoriTarget: {json.dumps(target_cat)},
    perusahaanJepang: {json.dumps(company_name)},
    kumiaiRujukan: {json.dumps(kumiai_name)},
    lokasiPrefektur: {json.dumps(pref_str)},
    jenisKelamin: {json.dumps(gender_str)},
    gajiBulananYen: {sal_num},
    gajiString: {json.dumps(gaji_raw or f"{sal_num:,} yen/bulan")},
    gajiEstimasiIdr: {est_idr},
    persyaratanJLPT: {json.dumps(jlpt_req)},
    kualifikasi: {json.dumps(kualifikasi_raw or "Memenuhi kualifikasi fisik & keahlian bidang di Jepang.")},
    biayaProses: {json.dumps(biaya_formatted)},
    fasilitasAsrama: "Subsidi tempat tinggal / asrama, Asuransi Kesehatan (Shakai Hoken), Tunjangan Lembur & Bonus.",
    deskripsiPekerjaan: {json.dumps(f"Posisi {judul_raw} di {pref_str}. Kualifikasi: {kualifikasi_raw}. Keterangan: {keterangan_raw}")},
    keteranganTambahan: {json.dumps(keterangan_raw)},
    tskSumberJob: {json.dumps(sumber_raw)},
    kuotaSiswa: {quota},
    statusJob: {json.dumps(status_job)},
    statusAktif: {json.dumps(status_job != "Tutup")}
  }},'''
    ts_code += entry + '\n'
    count += 1

ts_code += '];\n'

with open('src/data/googleSheetJobs.ts', 'w', encoding='utf-8') as f:
    f.write(ts_code)

print(f'Successfully generated src/data/googleSheetJobs.ts with {count} job items!')
