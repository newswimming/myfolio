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
# AGENCY BY BEAT
# =========================

AGENCY_SYSTEM_PROMPT = (
    "You are a narrative analyst. Given the following excerpt from a script or set of story notes, "
    "identify all named characters (people and named entities who act, speak, or are described).\n\n"
    "For each character, return two scores AND two one-sentence explanations:\n\n"
    "- agency_score: a float from 0 to 1. Measures decision-making power — how much this character "
    "drives events, initiates actions, makes choices, or asserts influence in this excerpt. "
    "Base this on BOTH their dialogue AND scene directions. Passive, acted-upon, or absent characters "
    "score low. Characters who command, decide, confront, or lead score high.\n\n"
    "- agency_reason: a single sentence (max 15 words) explaining why this character received this agency score in this beat.\n\n"
    "- representation_score: a float from 0 to 1. Measures narrative attention — how much of the "
    "story's focus lands on this character. Count BOTH spoken lines AND mentions or descriptions in "
    "scene directions. A character frequently described or referenced even when silent scores higher "
    "than one who briefly appears.\n\n"
    "- representation_reason: a single sentence (max 15 words) explaining why this character received this representation score in this beat.\n\n"
    "Normalize scores so the highest-scoring character in each metric within this excerpt = 1.0.\n\n"
    "Characters absent from this beat should still be included with scores of 0.0 and reason: "
    '"Does not appear in this beat."\n\n'
    "Return only a JSON array in this exact format, no explanation, no markdown:\n"
    '[{"character": "Name", "agency_score": 0.0, "agency_reason": "...", "representation_score": 0.0, "representation_reason": "..."}]'
)


def score_beat_agency(beat_text):
    if not beat_text or not beat_text.strip():
        return []
    try:
        r = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[
                {"role": "system", "content": AGENCY_SYSTEM_PROMPT},
                {"role": "user", "content": beat_text[:2000]}
            ],
            temperature=0
        )
        raw = r.choices[0].message.content.strip()
        raw = re.sub(r"```json|```", "", raw).strip()
        return json.loads(raw)
    except:
        return []


def analyze_agency_by_beat(beats):
    """
    Takes beats dict {ki: {summary, comment}, ...}
    Returns {ki: [...], sho: [...], ten: [...], ketsu: [...]}
    with character scores normalized and missing beats filled with 0.0.
    """
    BEAT_KEYS = ['ki', 'sho', 'ten', 'ketsu']

    beat_texts = {}
    for key in BEAT_KEYS:
        beat = beats.get(key, {})
        summary = beat.get('summary', '') if isinstance(beat, dict) else ''
        comment = beat.get('comment', '') if isinstance(beat, dict) else ''
        beat_texts[key] = f"{summary} {comment}".strip()

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {key: executor.submit(score_beat_agency, beat_texts[key]) for key in BEAT_KEYS}
        raw_results = {key: futures[key].result() for key in BEAT_KEYS}

    # Normalize character names and collect all unique names
    all_chars = set()
    normalized_results = {}
    for key in BEAT_KEYS:
        normalized = []
        for entry in raw_results[key]:
            name = entry.get('character', '').strip().title()
            if name:
                all_chars.add(name)
                normalized.append({
                    'character': name,
                    'agency_score': round(float(entry.get('agency_score', 0)), 3),
                    'agency_reason': entry.get('agency_reason', ''),
                    'representation_score': round(float(entry.get('representation_score', 0)), 3),
                    'representation_reason': entry.get('representation_reason', '')
                })
        normalized_results[key] = normalized

    # Fill missing characters with 0.0 for beats they don't appear in
    for key in BEAT_KEYS:
        present = {e['character'] for e in normalized_results[key]}
        for char in all_chars:
            if char not in present:
                normalized_results[key].append({
                    'character': char,
                    'agency_score': 0.0,
                    'agency_reason': 'Does not appear in this beat.',
                    'representation_score': 0.0,
                    'representation_reason': 'Does not appear in this beat.'
                })

    return normalized_results


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

        result = safe_json_parse(r.choices[0].message.content)
        agency_by_beat = analyze_agency_by_beat(result.get('beats', {}))
        return {"mode": "script", **result, "agency_by_beat": agency_by_beat}

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

    result = safe_json_parse(r.choices[0].message.content)
    agency_by_beat = analyze_agency_by_beat(result.get('beats', {}))
    return {"mode": "script", **result, "agency_by_beat": agency_by_beat}


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

        result = safe_json_parse(r.choices[0].message.content)
        agency_by_beat = analyze_agency_by_beat(result.get('beats', {}))
        return {"mode": "outline", **result, "agency_by_beat": agency_by_beat}

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
    