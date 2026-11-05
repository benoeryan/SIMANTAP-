import json, urllib.request, re, os

PROJECT_ID = 'simantap-ijef'
API_KEY = 'AIzaSyBPL7vthHw3FSMOu_R-b88y4WwbYoJAo3A'
BACKUP_FILE = 'firestore_backup.json'

def to_firestore_value(val):
    if val is None:
        return {'nullValue': None}
    if isinstance(val, bool):
        return {'booleanValue': val}
    if isinstance(val, int):
        return {'integerValue': str(val)}
    if isinstance(val, float):
        return {'doubleValue': val}
    if isinstance(val, str):
        return {'stringValue': val}
    if isinstance(val, list):
        return {'arrayValue': {'values': [to_firestore_value(v) for v in val]}}
    if isinstance(val, dict):
        fields = {}
        for k, v in val.items():
            fields[k] = to_firestore_value(v)
        return {'mapValue': {'fields': fields}}
    return {'stringValue': str(val)}

def to_firestore_fields(doc_dict):
    fields = {}
    for k, v in doc_dict.items():
        if k in ['id', 'siswaId', 'key']: continue
        fields[k] = to_firestore_value(v)
    return fields

def run_sync():
    if not os.path.exists(BACKUP_FILE):
        print(f"Error: {BACKUP_FILE} not found!")
        return

    with open(BACKUP_FILE) as f:
        data = json.load(f)

    candidates = data.get('candidates', [])
    students = data.get('students', [])
    jobs = data.get('jobs', [])
    admins = data.get('admins', [])
    mitras = data.get('mitras', [])

    print("==================================================")
    print(f"SYNCING FIRESTORE BACKUP DATA TO PROJECT: {PROJECT_ID}")
    print("==================================================")

    collections_map = {
        'candidates': candidates,
        'calon_siswa': students,
        'jobs': jobs,
        'admin_users': admins,
        'mitra_organizations': mitras
    }

    total_synced = 0
    for col_name, items in collections_map.items():
        print(f"Processing collection [{col_name}]: {len(items)} items...")
        col_count = 0
        for item in items:
            doc_id = item.get('id') or item.get('siswaId') or item.get('userId')
            if not doc_id or str(doc_id) in ['[object Object]', 'undefined', 'null']:
                continue

            fields = to_firestore_fields(item)
            url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/{col_name}?documentId={doc_id}&key={API_KEY}"
            payload = json.dumps({'fields': fields}).encode('utf-8')

            req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'}, method='POST')
            try:
                with urllib.request.urlopen(req) as resp:
                    col_count += 1
                    total_synced += 1
            except Exception as e:
                # HTTP 409 means document already exists, try PATCH (update)
                patch_url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/{col_name}/{doc_id}?key={API_KEY}"
                req_patch = urllib.request.Request(patch_url, data=payload, headers={'Content-Type': 'application/json'}, method='PATCH')
                try:
                    with urllib.request.urlopen(req_patch) as resp_patch:
                        col_count += 1
                        total_synced += 1
                except Exception as patch_err:
                    pass

        print(f"  [OK] Collection [{col_name}] sync complete: {col_count} documents synced.")

    print("==================================================")
    print(f"SYNC FINISHED: {total_synced} TOTAL DOCUMENTS SYNCED TO {PROJECT_ID}")
    print("==================================================")

if __name__ == '__main__':
    run_sync()
