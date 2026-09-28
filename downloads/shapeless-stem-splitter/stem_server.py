"""
Stem separation server for freespirit.html.
- POST /separate (multipart 'audio')         -> { job_id }
- GET  /status/<job_id>                      -> { status, progress, stems[] }
- GET  /stems/<path>                         -> serves stem audio files

Pipeline:
  1. demucs htdemucs_6s        -> 6 stems: vocals, drums, bass, guitar, piano, other
  2. (optional) larsnet on drums -> kick, snare, toms, hihat, cymbals  (Phase 2)

Run:
  pip install flask flask-cors demucs
  python tools/stem_server.py
  # listens on http://127.0.0.1:5599

Frontend (freespirit.html) hits this; the page is served from Vite at :5173.
"""
import os, sys, uuid, subprocess, threading, traceback, time
# Force a writable model cache (user env had TORCH_HOME=Z:\\ which doesn't exist on this box)
_TORCH_CACHE = os.path.join(os.path.expanduser("~"), ".cache", "torch")
os.makedirs(_TORCH_CACHE, exist_ok=True)
os.environ["TORCH_HOME"] = _TORCH_CACHE
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(ROOT, "stem_output")
os.makedirs(OUT_DIR, exist_ok=True)

app = Flask(__name__)
CORS(app)
jobs = {}  # job_id -> { status, progress, stems, error }

DEMUCS_MODEL = "htdemucs_6s"   # 6 stems
STEM_NAMES_6 = ["vocals", "drums", "bass", "guitar", "piano", "other"]

def run_demucs(job_id, in_path):
    job = jobs[job_id]
    try:
        job["status"] = "separating"
        job["progress"] = 0.05
        out_subdir = os.path.join(OUT_DIR, job_id)
        os.makedirs(out_subdir, exist_ok=True)

        DEMUCS_RUNNER = os.path.join(ROOT, "demucs_run.py")
        cmd = [
            sys.executable, DEMUCS_RUNNER,
            "-n", DEMUCS_MODEL,
            "-o", out_subdir,
            in_path,
        ]
        # Stream demucs progress via stderr
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        tail = []
        for line in proc.stdout:
            tail.append(line.rstrip())
            if len(tail) > 60: tail.pop(0)
            if "%" in line:
                try:
                    pct = int(line.strip().split("%")[0].split()[-1])
                    job["progress"] = max(0.05, min(0.95, pct / 100.0))
                except Exception:
                    pass
        proc.wait()
        if proc.returncode != 0:
            tail_str = "\n".join(tail[-30:])
            print(f"[stem-server] demucs failed (exit {proc.returncode}):\n{tail_str}", flush=True)
            raise RuntimeError(f"demucs exit {proc.returncode}\n--- last output ---\n{tail_str}")

        base = os.path.splitext(os.path.basename(in_path))[0]
        stem_dir = os.path.join(out_subdir, DEMUCS_MODEL, base)
        if not os.path.isdir(stem_dir):
            raise RuntimeError(f"output dir missing: {stem_dir}")

        stems = []
        for name in STEM_NAMES_6:
            for ext in (".wav", ".mp3"):
                fn = name + ext
                full = os.path.join(stem_dir, fn)
                if os.path.exists(full):
                    rel = os.path.relpath(full, OUT_DIR).replace(os.sep, "/")
                    stems.append({"name": name, "url": f"/stems/{rel}"})
                    break
        job["stems"] = stems
        job["status"] = "done"
        job["progress"] = 1.0
    except Exception as e:
        job["status"] = "error"
        job["error"] = f"{e}\n{traceback.format_exc()}"

@app.post("/separate")
def separate():
    f = request.files.get("audio")
    if not f:
        return jsonify({"error": "no file"}), 400
    job_id = uuid.uuid4().hex[:12]
    in_path = os.path.join(OUT_DIR, f"{job_id}_input{os.path.splitext(f.filename or 'in.wav')[1]}")
    f.save(in_path)
    jobs[job_id] = {"status": "queued", "progress": 0.0, "stems": [], "error": None}
    threading.Thread(target=run_demucs, args=(job_id, in_path), daemon=True).start()
    return jsonify({"job_id": job_id})

@app.get("/status/<job_id>")
def status(job_id):
    j = jobs.get(job_id)
    if not j:
        return jsonify({"status": "unknown"}), 404
    return jsonify(j)

@app.get("/stems/<path:p>")
def stem_file(p):
    return send_from_directory(OUT_DIR, p)

@app.get("/health")
def health():
    return jsonify({"ok": True, "model": DEMUCS_MODEL, "stems": STEM_NAMES_6})

if __name__ == "__main__":
    print(f"[stem-server] listening on http://127.0.0.1:5599  model={DEMUCS_MODEL}")
    app.run(host="127.0.0.1", port=5599, debug=False, threaded=True)
