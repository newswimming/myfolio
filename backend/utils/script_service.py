from openai import OpenAI
import json
import re
from concurrent.futures import ThreadPoolExecutor

from prompts.script_prompt import build_script_prompt
from prompts.outline_prompt import build_outline_prompt
from prompts.brainstorm_prompt import build_brainstorm_prompt

client = OpenAI()

# =========================
# CONFIG ⚡
# =========================
MAX_SCENES = 20
SCENE_CHAR_LIMIT = 2000
COMPRESSED_LIMIT = 8000


# =========================
# SAFE JSON
# =========================
def safe_json_parse(s):
    try:
        return json.loads(s)
    except:
        try:
            # attempt minor cleanup
            s = re.sub(r"```json|```", "", s)
            return json.loads(s)
        except:
            return {}


# =========================
# TYPE DETECTION
# =========================
def detect_type(text):

    t = text.strip()
    short_t = t[:1000]

    # ---------- HARD GUARD ----------
    if len(t) < 200:
        return "brainstorm"

    # screenplay signals
    if any(k in short_t for k in ["INT.", "EXT.", "CUT TO", "FADE IN"]):
        return "script"

    lines = short_t.split("\n")
    dialogue_lines = [l for l in lines if ":" in l or '"' in l]

    if len(lines) >= 5 and len(dialogue_lines) >= 2:
        return "script"

    if any(k in short_t for k in ["\n-", "\n•", "Act 1", "Act I", "Act 2"]):
        return "outline"

    # ---------- LLM FALLBACK ----------
    try:
        prompt = f"""
Classify into ONE:
script | outline | brainstorm

PRIORITY:
script > outline > brainstorm

Return JSON:
{{"type":""}}

TEXT:
{short_t}
"""

        r = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            response_format={"type": "json_object"}
        )

        return json.loads(r.choices[0].message.content).get("type", "brainstorm")

    except:
        return "brainstorm"


# =========================
# SCENE SPLITTING (FIXED)
# =========================
def split_into_scenes(text):

    scenes = re.split(r'(?=INT\.|EXT\.)', text)
    scenes = [s.strip() for s in scenes if s.strip()]

    return scenes[:MAX_SCENES]


# =========================
# SCENE SUMMARIZATION
# =========================
def summarize_scene(scene):

    prompt = f"""
Summarize this scene in 3–4 sentences.
Extract character names.

Return JSON:
{{"summary": "", "characters": []}}

Scene:
{scene[:SCENE_CHAR_LIMIT]}
"""

    try:
        r = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            response_format={"type": "json_object"}
        )

        return safe_json_parse(r.choices[0].message.content)

    except:
        return {"summary": "", "characters": []}


# =========================
# PARALLEL PROCESSING
# =========================
def process_scenes(scenes):
    with ThreadPoolExecutor(max_workers=5) as executor:
        return list(executor.map(summarize_scene, scenes))


# =========================
# COMPRESS SCRIPT
# =========================
def build_compressed_script(scene_data):

    text = ""

    for i, s in enumerate(scene_data):
        text += f"\nScene {i+1}:\n{s.get('summary','')}\n"
        text += f"Characters: {', '.join(s.get('characters', []))}\n"

    return text[:COMPRESSED_LIMIT]


# =========================
# SCRIPT ANALYSIS
# =========================
def analyze_script_full(text):

    scenes = split_into_scenes(text)

    # SMALL SCRIPT
    if len(scenes) < 5:

        prompt = build_script_prompt(text[:6000])

        r = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"}
        )

        return {"mode": "script", **safe_json_parse(r.choices[0].message.content)}

    # LARGE SCRIPT
    scene_data = process_scenes(scenes)
    compressed = build_compressed_script(scene_data)

    prompt = build_script_prompt(compressed)

    r = client.chat.completions.create(
        model="gpt-5.4-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"}
    )

    return {"mode": "script", **safe_json_parse(r.choices[0].message.content)}


# =========================
# OUTLINE
# =========================
def analyze_outline(text):

    prompt = build_outline_prompt(text[:6000])

    try:
        r = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"}
        )

        return {"mode": "outline", **safe_json_parse(r.choices[0].message.content)}

    except Exception as e:
        return {"mode": "outline", "error": str(e)}


# =========================
# BRAINSTORM
# =========================
def generate_story(text, themes=None):

    prompt = build_brainstorm_prompt(text[:4000], themes)

    try:
        r = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        return {"mode": "brainstorm", **safe_json_parse(r.choices[0].message.content)}

    except Exception as e:
        return {"mode": "brainstorm", "error": str(e)}
    