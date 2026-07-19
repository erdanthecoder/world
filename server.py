#!/usr/bin/env python3
"""
ReadWorld — a Kindle-style reading platform for young readers.

Serves the static reading app and provides a tiny progress-sync API so a
reader can pick up where they left off on any device using a short sync code.

Run:   python server.py
Then open http://localhost:5000 in your browser.
"""
from flask import Flask, send_from_directory, request, jsonify
import os
import json
import re
import threading

app = Flask(__name__)
PORT = int(os.environ.get("PORT", 5000))

# ---- Simple file-backed sync store -------------------------------------
# Progress is keyed by a short human-friendly sync code. localStorage on the
# device remains the source of truth; this just lets a code roam between
# devices. Not meant for heavy multi-user load — perfect for a family app.
DATA_DIR = os.environ.get("READWORLD_DATA", os.path.join(os.path.dirname(__file__), "data"))
os.makedirs(DATA_DIR, exist_ok=True)
_lock = threading.Lock()
CODE_RE = re.compile(r"^[A-Z0-9]{4,12}$")


def _path_for(code):
    return os.path.join(DATA_DIR, "sync_%s.json" % code)


@app.route("/")
def index():
    return send_from_directory("docs", "index.html")


@app.route("/api/health")
def health():
    return jsonify({"ok": True, "service": "readworld"})


@app.route("/api/sync/<code>", methods=["GET", "POST"])
def sync(code):
    code = (code or "").strip().upper()
    if not CODE_RE.match(code):
        return jsonify({"error": "invalid code"}), 400
    path = _path_for(code)

    if request.method == "POST":
        payload = request.get_json(silent=True)
        if payload is None:
            return jsonify({"error": "invalid json"}), 400
        with _lock:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False)
        return jsonify({"ok": True})

    # GET
    if not os.path.exists(path):
        return jsonify({"error": "not found"}), 404
    with _lock:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    return jsonify({"ok": True, "data": data})


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory("docs", filename)


if __name__ == "__main__":
    print()
    print("  ReadWorld  —  Read. Think. Grow.")
    print("  ---------------------------------")
    print("  Open http://localhost:%d in your browser" % PORT)
    print("  Progress syncs across devices with a sync code.")
    print("  Press CTRL+C to stop.")
    print()
    app.run(host="0.0.0.0", port=PORT, debug=False)
