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


# ---- AI writing feedback ------------------------------------------------
# Marks a short free-text answer with Claude and returns an encouraging
# score + feedback. Needs ANTHROPIC_API_KEY in the environment; when the key
# (or the library) is missing, the endpoint reports that clearly and the
# client falls back to self-review. This is why writing tasks need the online
# app — a static/offline page can't run the AI marker.
WRITING_SCHEMA = {
    "type": "object",
    "properties": {
        "score": {"type": "integer", "enum": [0, 1, 2, 3, 4, 5]},
        "feedback": {"type": "string"},
        "strength": {"type": "string"},
        "improve": {"type": "string"},
    },
    "required": ["score", "feedback", "strength", "improve"],
    "additionalProperties": False,
}


@app.route("/api/check-writing", methods=["POST"])
def check_writing():
    body = request.get_json(silent=True) or {}
    prompt = (body.get("prompt") or "").strip()
    guidance = (body.get("guidance") or "").strip()
    answer = (body.get("response") or "").strip()
    lang = "Russian" if body.get("lang") == "ru" else "English"
    if not answer:
        return jsonify({"error": "empty"}), 400

    try:
        import anthropic
    except ImportError:
        return jsonify({"error": "unavailable", "reason": "The anthropic library is not installed."}), 503
    if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        return jsonify({"error": "unavailable", "reason": "AI marking is not configured on this server."}), 503

    system = (
        "You are a warm, encouraging Year 9 teacher marking a young student's short written answer. "
        "Reply in " + lang + ". Be kind and specific. Score out of 5 for how well the answer addresses "
        "the task and shows understanding (5 = excellent, 3 = solid, 1 = needs work). Always name one real "
        "strength, and one concrete, doable improvement. Keep 'feedback' to 2-3 sentences a 14-year-old "
        "will find motivating."
    )
    user = (
        "TASK:\n" + prompt + "\n\n"
        + ("WHAT A GOOD ANSWER INCLUDES:\n" + guidance + "\n\n" if guidance else "")
        + "STUDENT'S ANSWER:\n" + answer
    )
    try:
        client = anthropic.Anthropic()
        msg = client.messages.create(
            model="claude-opus-4-8",
            max_tokens=1024,
            system=system,
            messages=[{"role": "user", "content": user}],
            output_config={"format": {"type": "json_schema", "schema": WRITING_SCHEMA}},
        )
        text = next((b.text for b in msg.content if b.type == "text"), "{}")
        return jsonify({"ok": True, "result": json.loads(text)})
    except Exception as exc:  # network, auth, rate limit, etc.
        return jsonify({"error": "failed", "reason": str(exc)[:200]}), 502


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
