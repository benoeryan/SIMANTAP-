import json, time, base64, subprocess, urllib.request, urllib.parse, os

SA_OLD = '/mnt/chromeos/MyFiles/Downloads/test-kesehatan-ijef-corp-7c278-firebase-adminsdk-fbsvc-7b9eba001a.json'
SA_NEW = '/mnt/chromeos/MyFiles/Downloads/simantap-ijef-firebase-adminsdk-fbsvc-653985958c.json'

def get_access_token(sa_path, key_tmp):
    with open(sa_path) as f:
        sa = json.load(f)
    with open(key_tmp, 'w') as f:
        f.write(sa['private_key'])

    header = {'alg': 'RS256', 'typ': 'JWT'}
    now = int(time.time())
    claim = {
        'iss': sa['client_email'],
        'scope': 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform',
        'aud': sa['token_uri'],
        'exp': now + 3600,
        'iat': now
    }

    def b64url(data):
        return base64.urlsafe_b64encode(json.dumps(data).encode('utf-8')).decode('utf-8').rstrip('=')

    unsigned_token = f"{b64url(header)}.{b64url(claim)}"
    proc = subprocess.run(['openssl', 'dgst', '-sha256', '-sign', key_tmp], input=unsigned_token.encode('utf-8'), capture_output=True)
    signature = base64.urlsafe_b64encode(proc.stdout).decode('utf-8').rstrip('=')
    jwt_token = f"{unsigned_token}.{signature}"

    req_data = urllib.parse.urlencode({'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion': jwt_token}).encode('utf-8')
    req = urllib.request.Request(sa['token_uri'], data=req_data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))['access_token']

def run_migration():
    token_old = get_access_token(SA_OLD, '/tmp/sa_key_old.pem')
    token_new = get_access_token(SA_NEW, '/tmp/sa_key_new.pem')

    collections = [
        'candidates', 'calon_siswa', 'jobs', 'lowongan_kerja',
        'admin_users', 'mitra_organizations', 'marketing_leads',
        'hasil_kesehatan', 'asesmen_disc', 'asesmen_psikotes',
        'surat_perjanjian', 'aplikasi_dukungan_dana', 'pengaturan_master'
    ]

    print("==================================================")
    print("STARTING FIRESTORE MIGRATION TO NEW PROJECT: simantap-ijef")
    print("==================================================")

    migrated_total = 0
    for col in collections:
        read_url = f"https://firestore.googleapis.com/v1/projects/test-kesehatan-ijef-corp-7c278/databases/(default)/documents/{col}?pageSize=1000"
        req_read = urllib.request.Request(read_url, headers={'Authorization': f"Bearer {token_old}"})
        try:
            with urllib.request.urlopen(req_read) as resp_read:
                data_read = json.loads(resp_read.read().decode('utf-8'))
                docs = data_read.get('documents', [])
                print(f"Reading collection [{col}]: {len(docs)} documents retrieved from source.")

                col_migrated = 0
                for doc in docs:
                    doc_name = doc['name'].split('/')[-1]
                    fields = doc.get('fields', {})

                    write_url = f"https://firestore.googleapis.com/v1/projects/simantap-ijef/databases/(default)/documents/{col}?documentId={doc_name}"
                    payload = json.dumps({'fields': fields}).encode('utf-8')

                    req_write = urllib.request.Request(write_url, data=payload, headers={
                        'Authorization': f"Bearer {token_new}",
                        'Content-Type': 'application/json'
                    })
                    try:
                        with urllib.request.urlopen(req_write) as resp_write:
                            col_migrated += 1
                            migrated_total += 1
                    except Exception as w_err:
                        print(f"  Error writing doc {doc_name} in {col}: {w_err}")

                print(f"  [OK] Collection [{col}] migration complete: {col_migrated}/{len(docs)} written.")
        except Exception as r_err:
            print(f"Collection [{col}] read note: {r_err}")

    print("==================================================")
    print(f"MIGRATION SUMMARY: {migrated_total} TOTAL DOCUMENTS TRANSFERRED TO simantap-ijef")
    print("==================================================")

if __name__ == '__main__':
    run_migration()
