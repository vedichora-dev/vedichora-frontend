import os, json, base64, http.client, sys

token = os.environ.get('GH_TOKEN','')
repo  = os.environ.get('REPO','')

def api_get_sha(path):
    conn = http.client.HTTPSConnection("api.github.com")
    conn.request("GET", f"/repos/{repo}/contents/{path}",
        headers={"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json", "User-Agent": "VH/1"})
    r = conn.getresponse(); d = r.read()
    if r.status == 200:
        return json.loads(d).get("sha")
    return None

def upload(dest, data, msg):
    sha = api_get_sha(dest)
    payload = {"message": msg, "content": base64.b64encode(data).decode()}
    if sha: payload["sha"] = sha
    conn = http.client.HTTPSConnection("api.github.com")
    conn.request("PUT", f"/repos/{repo}/contents/{dest}",
        body=json.dumps(payload).encode(),
        headers={"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json",
                 "Content-Type": "application/json", "User-Agent": "VH/1"})
    r = conn.getresponse(); d = json.loads(r.read())
    ok = r.status in (200,201)
    print(f"{'OK' if ok else 'FAIL'} {dest} -> {r.status}")
    return ok

# Upload screenshots
ss_dir = "screenshots"
if os.path.exists(ss_dir):
    for f in sorted(os.listdir(ss_dir)):
        if f.endswith(".png"):
            fpath = os.path.join(ss_dir, f)
            with open(fpath, "rb") as fh: data = fh.read()
            print(f"Uploading {f} ({len(data)} bytes)")
            upload(f"test-screenshots/{f}", data, f"ci: screenshot {f} [skip ci]")

# Upload output
if os.path.exists("/tmp/ss-output.txt"):
    with open("/tmp/ss-output.txt", "rb") as fh: data = fh.read()
    upload("test-screenshots/output.txt", data, "ci: test output [skip ci]")

print("Done")
sys.exit(0)
