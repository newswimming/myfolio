"""
schema_bridge.py

Translates between myfolio's LLM extraction format and zettlebank's CSG schema.
No business logic — pure data mapping and format conversion.

Responsibilities:
  - myfolio relationship types → CSG rel_type vocabulary
  - character list → CSGCharacter with stage-based scene IDs
  - graphs_by_stage → CSGRelation + CSGInteraction lists
  - topics → validated tags + Obsidian markdown notes
  - zettlebank arc response → myfolio beats format {summary, comment}
  - smart_relation momentum detection (kinetic_to / potential_to)
"""

import re

# ── Affect validation ─────────────────────────────────────────────────────────
# Mirrors zettlebank server.py AFFECT_VALUES (line 328).
AFFECT_VALUES = {
    "positive", "negative", "neutral",
    "ambivalent", "melancholic", "tense", "hopeful",
}

# ── Relationship type mapping ─────────────────────────────────────────────────
# myfolio LLM type → zettlebank CSG rel_type
_REL_TYPE_MAP = {
    "alliance":     "ALLY",
    "conflict":     "RIVAL",
    "authority":    "BOSS_OF",
    "dependency":   "OWES_DEBT",
    "emotional":    "FRIEND",       # bidirectional → ROMANTIC (handled below)
    "communication":"FRIEND",
    "observation":  "UNKNOWN",
    "co_presence":  "UNKNOWN",
}

# ── Scene ID strategy ─────────────────────────────────────────────────────────
# zettlebank _scene_to_act() maps scene_index / total_scenes:
#   0–24%  → ki  |  25–49% → sho  |  50–74% → ten  |  75–100% → ketsu
#
# Characters are assigned the centroid of their first-appearance stage.
TOTAL_SCENES = 100
_STAGE_SCENE = {
    "ki":    12,   # 12% — ki centroid
    "sho":   37,   # 37% — sho centroid
    "ten":   62,   # 62% — ten centroid
    "ketsu": 87,   # 87% — ketsu centroid
}
STAGE_ORDER = ["ki", "sho", "ten", "ketsu"]

# ── Smart relation momentum ───────────────────────────────────────────────────
MOMENTUM_TYPES = {"kinetic_to", "potential_to"}


# =============================================================================
# Utilities
# =============================================================================

def _slug(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"[^a-z0-9\-]", "", s)
    return s or "note"


def _scene_id(n: int) -> str:
    return f"SCENE_{str(n).zfill(3)}"


def _get_first_stage(name: str, graphs_by_stage: dict) -> str:
    """Return the earliest Ki-Sho-Ten-Ketsu stage in which a character appears."""
    for stage in STAGE_ORDER:
        chars = graphs_by_stage.get(stage, {}).get("characters", [])
        if name in chars:
            return stage
    return "sho"


# =============================================================================
# Character mapping
# =============================================================================

def map_characters_to_csg(characters: list, graphs_by_stage: dict) -> list:
    """
    Convert myfolio characters to zettlebank CSGCharacter format.
    first_appearance_scene is the centroid of the character's first LLM stage.
    """
    csg_chars = []
    for char in characters:
        name = (char.get("name") or "").strip()
        if not name:
            continue
        first_stage = _get_first_stage(name, graphs_by_stage)
        scene_num = _STAGE_SCENE.get(first_stage, 37)
        csg_chars.append({
            "canon_name": name,
            "aliases": [],
            "description": (char.get("description") or "").strip(),
            "first_appearance_scene": _scene_id(scene_num),
        })
    return csg_chars


# =============================================================================
# Relation mapping
# =============================================================================

def map_relations_to_csg(graphs_by_stage: dict) -> list:
    """
    Convert myfolio relationships to zettlebank CSGRelation format.
    Emotional relationships become ROMANTIC when both directions exist, FRIEND otherwise.
    """
    seen = set()
    csg_rels = []

    # Build set of bidirectional emotional pairs
    emotional_pairs: set = set()
    for stage, stage_data in graphs_by_stage.items():
        for rel in stage_data.get("relationships", []):
            if rel.get("type") == "emotional":
                pair = frozenset([rel.get("source", ""), rel.get("target", "")])
                emotional_pairs.add(pair)

    for stage, stage_data in graphs_by_stage.items():
        scene_num = _STAGE_SCENE.get(stage, 37)
        scene_id = _scene_id(scene_num)

        for rel in stage_data.get("relationships", []):
            src = (rel.get("source") or "").strip()
            tgt = (rel.get("target") or "").strip()
            if not src or not tgt:
                continue
            key = (src, tgt, stage)
            if key in seen:
                continue
            seen.add(key)

            rel_type_raw = rel.get("type", "co_presence")
            if rel_type_raw == "emotional":
                csg_type = "ROMANTIC" if frozenset([src, tgt]) in emotional_pairs else "FRIEND"
            else:
                csg_type = _REL_TYPE_MAP.get(rel_type_raw, "UNKNOWN")

            csg_rels.append({
                "src": src,
                "dst": tgt,
                "rel_type": csg_type,
                "scene_id": scene_id,
                "evidence": (rel.get("dynamic") or "").strip(),
                "confidence": float(rel.get("confidence", 0.7)),
            })

    return csg_rels


# =============================================================================
# Interaction mapping
# =============================================================================

def map_interactions_to_csg(graphs_by_stage: dict) -> list:
    """Convert myfolio interactions to zettlebank CSGInteraction format."""
    seen = set()
    csg_interactions = []

    for stage, stage_data in graphs_by_stage.items():
        scene_num = _STAGE_SCENE.get(stage, 37)
        scene_id = _scene_id(scene_num)

        for inter in stage_data.get("interactions", []):
            src = (inter.get("source") or "").strip()
            tgt = (inter.get("target") or "").strip()
            if not src or not tgt:
                continue
            key = (src, tgt, stage)
            if key in seen:
                continue
            seen.add(key)

            csg_interactions.append({
                "src": src,
                "dst": tgt,
                "scene_id": scene_id,
                "sentiment": "neutral",
                "power_dynamics": "peer",
                "confidence": 0.7,
            })

    return csg_interactions


# =============================================================================
# Ingest payload
# =============================================================================

def build_ingest_payload(characters: list, graphs_by_stage: dict) -> dict:
    """
    Build the full payload for POST /graph/ingest-character-graph.
    Turning points are omitted on this pass; pivot flagging happens
    post-/analyze via /graph/sync-note.
    """
    return {
        "total_scenes": TOTAL_SCENES,
        "characters": map_characters_to_csg(characters, graphs_by_stage),
        "relations": map_relations_to_csg(graphs_by_stage),
        "interactions": map_interactions_to_csg(graphs_by_stage),
        "turning_points": [],
        "place_time_scene_ids": [],
        "overwrite_existing_files": True,
    }


# =============================================================================
# Topic notes
# =============================================================================

def validate_tags(tags: list) -> list:
    """
    Validate and clean topic tags.
    Permitted prefixes: topic/, affect/
    - affect/ value must be one of AFFECT_VALUES; invalid → affect/neutral
    - aspect/ and all other prefixes are dropped
    """
    cleaned = []
    seen = set()
    for tag in tags:
        tag = (tag or "").strip()
        if tag.startswith("topic/"):
            slug = _slug(tag[6:])
            cleaned_tag = f"topic/{slug}"
            if slug and cleaned_tag not in seen:
                cleaned.append(cleaned_tag)
                seen.add(cleaned_tag)
        elif tag.startswith("affect/"):
            value = tag[7:].strip()
            if value not in AFFECT_VALUES:
                value = "neutral"
            cleaned_tag = f"affect/{value}"
            if cleaned_tag not in seen:
                cleaned.append(cleaned_tag)
                seen.add(cleaned_tag)
        # aspect/ and any other prefix → silently dropped
    return cleaned if cleaned else ["affect/neutral"]


def topic_to_obsidian_md(topic: dict, validated_tags: list) -> str:
    """Build an Obsidian-compatible markdown string for a topic note."""
    tag_lines = "\n".join(f"  - {t}" for t in validated_tags)
    title = (topic.get("title") or "").strip()
    content = (topic.get("content") or "").strip()
    return f"---\ntags:\n{tag_lines}\n---\n\n# {title}\n\n{content}\n"


def build_topic_notes(topics: list) -> list:
    """
    Enrich each LLM-extracted topic with note_id and obsidian_md.
    Returns the enriched list ready for zettlebank ingest and API response.
    """
    enriched = []
    for topic in topics:
        title = (topic.get("title") or "").strip()
        if not title:
            continue
        note_id = f"topic-{_slug(title)}"
        validated = validate_tags(topic.get("tags", []))
        enriched.append({
            "title": title,
            "content": (topic.get("content") or "").strip(),
            "tags": validated,
            "note_id": note_id,
            "obsidian_md": topic_to_obsidian_md(topic, validated),
        })
    return enriched


# =============================================================================
# Arc response → myfolio beats
# =============================================================================

def map_arc_to_beats(arc: dict) -> dict:
    """
    Convert zettlebank generate-arc response to myfolio beats format.
    Zettlebank returns a 2-sentence string per act.
    First sentence → summary; second → comment.
    """
    beats = {}
    for act in STAGE_ORDER:
        text = (arc.get(act) or "").strip()
        if not text:
            beats[act] = {"summary": "", "comment": ""}
            continue
        parts = re.split(r"(?<=\.)\s+", text, maxsplit=1)
        beats[act] = {
            "summary": parts[0].strip() if parts else text,
            "comment": parts[1].strip() if len(parts) > 1 else "",
        }
    return beats


# =============================================================================
# Smart relation momentum
# =============================================================================

def has_momentum(analyze_response: dict) -> bool:
    """
    Return True if /analyze response contains kinetic_to or potential_to
    smart_relations — indicating this character has narrative pivot momentum.
    """
    if not analyze_response:
        return False
    smart_relations = (
        analyze_response.get("metadata", {}) or {}
    ).get("smart_relations", []) or []
    return any(
        (rel.get("relation_type") or "") in MOMENTUM_TYPES
        for rel in smart_relations
    )
