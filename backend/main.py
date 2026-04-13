from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from utils.script_service import (
    analyze_script_full,
    analyze_outline,
    generate_story,
    detect_type
)

from utils.parse_service import parse_input


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- FAST CHECK ----------
def is_short_input(text: str) -> bool:
    return len(text.split()) < 25   # 🔥 slightly reduced


def looks_like_script(text: str) -> bool:
    # 🔥 lightweight override (very important)
    lines = text.split("\n")
    dialogue_lines = [l for l in lines if ":" in l or '"' in l]

    return len(lines) >= 3 and len(dialogue_lines) >= 2


# ---------- ROUTE ----------
@app.post("/analyze-all")
async def analyze_all(
    file: UploadFile = File(None),
    text: str = Form(None)
):

    # ---------- 1. PARSE ----------
    cleaned, err = await parse_input(file, text)
    if err:
        return {"mode": "error", "error": err}

    cleaned = cleaned.strip()

    if not cleaned:
        return {"mode": "error", "error": "empty input"}

    # ---------- DEBUG (safe) ----------
    print(f"[DEBUG] words={len(cleaned.split())}, preview={cleaned[:80]}")

    # ---------- 🚀 2. FAST PATH ----------
    if is_short_input(cleaned) and not looks_like_script(cleaned):
        print("[ROUTE] FAST → brainstorm")
        return generate_story(cleaned[:1000])

    # ---------- 3. TYPE DETECTION ----------
    try:
        typ = detect_type(cleaned)
    except:
        typ = "brainstorm"

    print(f"[ROUTE] DETECTED → {typ}")

    # ---------- 🧠 4. SAFETY OVERRIDE ----------
    # if classifier fails but looks like script → force script
    if typ != "script" and looks_like_script(cleaned):
        print("[OVERRIDE] forcing script mode")
        typ = "script"

    # ---------- 5. ROUTING ----------
    try:
        if typ == "script":
            return analyze_script_full(cleaned[:6000])

        if typ == "outline":
            return analyze_outline(cleaned[:4000])

        return generate_story(cleaned[:3000])

    except Exception as e:
        return {
            "mode": "error",
            "error": str(e)
        }
    