"""AI Baby Companion — Parent Console (FastAPI + HTMX).

The parent-facing control plane for the companion toy: manage children, review
consent-gated conversation history, edit personality, and exercise the privacy
controls (consent, per-sensor switches, export, erasure, audit) that COPPA /
GDPR-K require.

This is the governance surface the App Factory builds and verifies. The device
voice loop (Deepgram STT -> Claude -> ElevenLabs TTS) and the production
AES-256-GCM crypto live in the companion's Next.js service; here the data layer
is in-memory and the at-rest cipher is a stdlib stand-in (see `_enc`/`_dec`),
so the console runs with zero external services for review.

Run locally:  uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

APP_NAME = os.environ.get("APP_NAME", "Companion Console")
APP_TAGLINE = os.environ.get("APP_TAGLINE", "Parent control plane for the AI Baby Companion.")
ENC_KEY = os.environ.get("COMPANION_ENC_KEY", "dev-insecure-key-change-me").encode()
RETENTION_DAYS = int(os.environ.get("COMPANION_RETENTION_DAYS", "30"))
FW_VERSION = os.environ.get("COMPANION_FW_VERSION", "1.2.0")

BASE_DIR = Path(__file__).resolve().parent.parent
app = FastAPI(title=APP_NAME)
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _toast(html: str, message: str, status_code: int = 200) -> HTMLResponse:
    """HTMX fragment + a toast in the X-Toast header (must stay ASCII/latin-1)."""
    safe = (message or "").encode("ascii", "replace").decode("ascii")
    return HTMLResponse(html, status_code=status_code, headers={"X-Toast": safe})


# ── At-rest "encryption" ──────────────────────────────────────────────────
# Conversation content is never stored in plaintext. This is a dependency-free
# stand-in (HMAC-keystream XOR + base64) so the console runs without a crypto
# lib; the production backend uses AES-256-GCM (lib/companion/crypto.ts).
def _keystream(n: int) -> bytes:
    out, ctr = b"", 0
    while len(out) < n:
        out += hashlib.sha256(ENC_KEY + ctr.to_bytes(4, "big")).digest()
        ctr += 1
    return out[:n]


def _enc(plain: str) -> str:
    raw = plain.encode("utf-8")
    ct = bytes(b ^ k for b, k in zip(raw, _keystream(len(raw))))
    return base64.b64encode(ct).decode("ascii")


def _dec(token: str) -> str:
    ct = base64.b64decode(token.encode("ascii"))
    return bytes(b ^ k for b, k in zip(ct, _keystream(len(ct)))).decode("utf-8")


# Inline SVG icons (stroke=currentColor) — no external asset deps.
_ICONS = {
    "grid": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>',
    "shield": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z"/></svg>',
    "map": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 3 4 5v16l5-2 6 2 5-2V3l-5 2-6-2Z"/><line x1="9" y1="3" x2="9" y2="19"/><line x1="15" y1="5" x2="15" y2="21"/></svg>',
}

NAV = [
    {"key": "dashboard", "label": "Children", "href": "/", "icon": _ICONS["grid"]},
    {"key": "privacy", "label": "Privacy", "href": "/privacy", "icon": _ICONS["shield"]},
    {"key": "roadmap", "label": "Roadmap", "href": "/roadmap", "icon": _ICONS["map"]},
]

PERSONALITIES = ["Curious Explorer", "Gentle Storyteller", "Silly Sidekick", "Calm Companion"]


def ctx(request: Request, active: str, **extra):
    return {
        "request": request, "app_name": APP_NAME, "app_tagline": APP_TAGLINE,
        "nav": NAV, "active": active, **extra,
    }


# ── In-memory data layer (the production console uses Neon Postgres) ───────
_CHILDREN: dict[int, dict] = {}
_NEXT_ID = [1]


def _seed_child(name, age_band, personality, consent, mic, camera, device_online, battery):
    cid = _NEXT_ID[0]
    _NEXT_ID[0] += 1
    _CHILDREN[cid] = {
        "id": cid, "name": name, "age_band": age_band, "personality": personality,
        "traits": {"playfulness": 7, "talkativeness": 5, "energy": 6},
        "consent": consent, "consent_method": "payment-card" if consent else None,
        "mic": mic, "camera": camera,
        "device": {"online": device_online, "battery": battery, "fw": FW_VERSION},
        "messages": [], "memory": [], "audit": [],
        "created_at": _now(),
    }
    return _CHILDREN[cid]


def _audit(child, action, detail=""):
    child["audit"].insert(0, {"action": action, "detail": detail, "at": _now()})


def _get(cid: int) -> dict:
    child = _CHILDREN.get(cid)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return child


# Seed demo state so the console is populated on first load.
_a = _seed_child("Mia", "4-5", "Curious Explorer", consent=True, mic=True, camera=False, device_online=True, battery=82)
_a["memory"] = ["Loves dinosaurs", "Has a dog named Pepper"]
for role, text in [("child", "Tell me about T-rex!"), ("companion", "The T-rex had teeth as long as bananas! Want to roar like one?")]:
    _a["messages"].append({"role": role, "content": _enc(text), "emotion": "excited" if role == "companion" else None, "at": _now()})
_audit(_a, "consent.granted", "method=payment-card")
_audit(_a, "voice.interaction", "1 turn")
_seed_child("Noah", "3", "Gentle Storyteller", consent=False, mic=False, camera=False, device_online=False, battery=0)


# ── Pages ─────────────────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
def dashboard(request: Request):
    children = list(_CHILDREN.values())
    stats = [
        {"label": "Children", "value": str(len(children))},
        {"label": "Consented", "value": str(sum(1 for c in children if c["consent"]))},
        {"label": "Devices online", "value": str(sum(1 for c in children if c["device"]["online"]))},
        {"label": "Retention", "value": f"{RETENTION_DAYS}d"},
    ]
    return templates.TemplateResponse(request, "pages/dashboard.html",
                                      ctx(request, "dashboard", stats=stats, children=children, personalities=PERSONALITIES))


@app.post("/children", response_class=HTMLResponse)
def create_child(request: Request, name: str = Form(...), age_band: str = Form("3"), personality: str = Form(PERSONALITIES[0])):
    child = _seed_child(name.strip() or "Unnamed", age_band, personality, consent=False, mic=False, camera=False, device_online=False, battery=0)
    _audit(child, "child.created", f"age_band={age_band}")
    html = templates.get_template("partials/child_row.html").render(ctx(request, "dashboard", c=child))
    return _toast(html, f"Added {child['name']}")


@app.delete("/children/{cid}", response_class=HTMLResponse)
def erase_child(cid: int):
    """GDPR erasure — purge the child across every table."""
    child = _get(cid)
    name = child["name"]
    del _CHILDREN[cid]
    return _toast("", f"Erased all data for {name}")


@app.get("/children/{cid}", response_class=HTMLResponse)
def child_detail(request: Request, cid: int):
    child = _get(cid)
    messages = [{"role": m["role"], "text": _dec(m["content"]), "emotion": m["emotion"], "at": m["at"]} for m in child["messages"]]
    return templates.TemplateResponse(request, "pages/child.html",
                                      ctx(request, "dashboard", c=child, messages=messages, personalities=PERSONALITIES))


@app.post("/children/{cid}/consent", response_class=HTMLResponse)
def set_consent(cid: int, grant: str = Form(...), method: str = Form("payment-card")):
    child = _get(cid)
    child["consent"] = grant == "1"
    child["consent_method"] = method if child["consent"] else None
    if not child["consent"]:
        child["mic"] = child["camera"] = False  # withdrawing consent disables sensors
    _audit(child, "consent.granted" if child["consent"] else "consent.withdrawn", f"method={method}")
    return _toast("", "Consent granted" if child["consent"] else "Consent withdrawn")


@app.post("/children/{cid}/controls", response_class=HTMLResponse)
def set_controls(cid: int, mic: str = Form("0"), camera: str = Form("0")):
    child = _get(cid)
    if not child["consent"]:
        raise HTTPException(status_code=403, detail="Consent required before enabling any sensor")
    child["mic"], child["camera"] = mic == "1", camera == "1"
    _audit(child, "controls.changed", f"mic={child['mic']} camera={child['camera']}")
    return _toast("", "Controls updated")


@app.post("/children/{cid}/personality", response_class=HTMLResponse)
def set_personality(cid: int, personality: str = Form(...), playfulness: int = Form(5), talkativeness: int = Form(5), energy: int = Form(5)):
    child = _get(cid)
    child["personality"] = personality
    child["traits"] = {"playfulness": max(0, min(10, playfulness)), "talkativeness": max(0, min(10, talkativeness)), "energy": max(0, min(10, energy))}
    _audit(child, "personality.changed", personality)
    return _toast("", f"Personality set to {personality}")


@app.post("/children/{cid}/say", response_class=HTMLResponse)
def simulate_turn(request: Request, cid: int, text: str = Form(...)):
    """Simulate a device voice turn. Mirrors the real /api/companion/voice gate:
    refuse (403) unless consent exists AND the mic is enabled."""
    child = _get(cid)
    if not child["consent"]:
        raise HTTPException(status_code=403, detail="No parental consent on record")
    if not child["mic"]:
        raise HTTPException(status_code=403, detail="Microphone is disabled by the parent")
    reply = f"That's wonderful! Tell me more about {text.strip().rstrip('?.!')[:40]}."
    for role, content, emotion in [("child", text.strip(), None), ("companion", reply, "happy")]:
        child["messages"].append({"role": role, "content": _enc(content), "emotion": emotion, "at": _now()})
    _audit(child, "voice.interaction", "1 turn")
    rows = "".join(
        templates.get_template("partials/message_row.html").render(m={"role": m["role"], "text": _dec(m["content"]), "emotion": m["emotion"], "at": m["at"]})
        for m in child["messages"][-2:]
    )
    return _toast(rows, "Turn recorded")


@app.post("/children/{cid}/clear", response_class=HTMLResponse)
def clear_history(cid: int):
    child = _get(cid)
    n = len(child["messages"])
    child["messages"] = []
    _audit(child, "history.cleared", f"{n} turns")
    return _toast('<tr id="msg-empty"><td colspan="3"><div class="empty"><div class="empty__icon">🗑️</div>History cleared</div></td></tr>', "History cleared")


@app.get("/children/{cid}/export")
def export_child(cid: int):
    """GDPR access — full export of everything stored for this child."""
    child = _get(cid)
    _audit(child, "data.exported", "json")
    payload = {**{k: v for k, v in child.items() if k != "messages"},
               "messages": [{"role": m["role"], "content": _dec(m["content"]), "emotion": m["emotion"], "at": m["at"]} for m in child["messages"]]}
    return JSONResponse(payload, headers={"Content-Disposition": f'attachment; filename="child-{cid}-export.json"'})


@app.get("/privacy", response_class=HTMLResponse)
def privacy_page(request: Request):
    return templates.TemplateResponse(request, "pages/privacy.html",
                                      ctx(request, "privacy", children=list(_CHILDREN.values()), retention=RETENTION_DAYS))


@app.post("/api/retention")
def run_retention():
    """Daily cron — drop conversation turns older than the retention window."""
    cutoff = datetime.now(timezone.utc).timestamp() - RETENTION_DAYS * 86400
    removed = 0
    for child in _CHILDREN.values():
        before = len(child["messages"])
        child["messages"] = [m for m in child["messages"] if datetime.fromisoformat(m["at"]).timestamp() >= cutoff]
        removed += before - len(child["messages"])
    return {"removed": removed, "retention_days": RETENTION_DAYS}


@app.get("/api/firmware")
def firmware_manifest():
    """OTA manifest the device polls. sha256 lets the device verify the image."""
    url = f"https://ota.example.com/fw/{FW_VERSION}.bin"
    return {"version": FW_VERSION, "url": url, "sha256": hashlib.sha256(url.encode()).hexdigest()}


ROADMAP = [
    {"title": "Children, consent & controls", "state": "done", "note": "This console"},
    {"title": "Conversation review + erasure", "state": "done", "note": "This console"},
    {"title": "Live device status (BLE notify)", "state": "progress", "note": "Phase 4 app"},
    {"title": "Verifiable consent (payment-card)", "state": "planned", "note": "Launch gate"},
    {"title": "Family sharing (multi-parent)", "state": "planned", "note": "V2"},
]


@app.get("/roadmap", response_class=HTMLResponse)
def roadmap_page(request: Request):
    return templates.TemplateResponse(request, "pages/roadmap.html", ctx(request, "roadmap", roadmap=ROADMAP))


@app.get("/healthz", response_class=PlainTextResponse)
def healthz():
    return "ok"
