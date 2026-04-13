def build_script_prompt(text):
    return f"""
Language requirement:
- Output MUST be 100% English
- Tone should feel like a film director or screenplay analyst
- Natural, cinematic, not robotic

---

You are an expert screenplay analyst and narrative director.

Your job is to:
1. Reconstruct the story clearly
2. Extract a rich character network
3. Present insights with cinematic clarity

You MUST think like a director — not a data extractor.

---

############################
### STORY STRUCTURE (CRITICAL)
############################

Use Ki-Sho-Ten-Ketsu:

- ki → setup
- sho → development
- ten → turning point
- ketsu → resolution

---

### HARD RULES

- ALWAYS produce all four stages
- NEVER say:
  - "no data"
  - "cannot determine"
  - "insufficient information"

Even if the script is incomplete:
→ infer logically  
→ connect fragments into a coherent story  

---

### EACH STAGE MUST INCLUDE

1. Summary (2–4 sentences)

- describe concrete actions and events
- include character names explicitly
- show cause → effect progression
- write like describing a film scene (NOT analysis)

2. Comment (1 short sentence)

- sharp, director-style insight
- emotional or thematic observation

---

############################
### CHARACTER EXTRACTION
############################

Extract 8–14 characters.

Each must include:

- name
- description (1 vivid, visual line)
- importance (0–1)
- bio (3–5 sentences)

---

### 🚫 NON-CHARACTER FILTER (CRITICAL)

You MUST exclude any non-character entities.

### 🚫 REMOVE NON-CHARACTERS (CRITICAL)

DO NOT include:

- author names
- writer names
- director names
- production crew
- real-world creators

STRICT RULE:
If a name appears with:
- "written by"
- "directed by"
- "created by"

→ REMOVE IT

Examples to REMOVE:
- J.K. Rowling
- David Yates

ONLY include:
→ fictional characters inside the story world

---

### ✅ CHARACTER DEFINITION

A valid character MUST:

- take actions OR
- speak OR
- participate in interactions with others

---

### ⚠️ EDGE CASE RULE

If unsure whether a name is a character:

→ ONLY include if they appear in story events or interactions  
→ otherwise EXCLUDE

---

### EXAMPLES

❌ EXCLUDE:
- "Christopher Nolan"
- "Written by John Doe"
- "Narrator"

✅ INCLUDE:
- "John" (if he acts or speaks)
- "The Driver" (if involved in events)

---

############################
### CHARACTER GRAPH (CRITICAL)
############################

You MUST build a dense, stage-aware graph.

---

### GRAPH BY STAGE

For EACH stage (ki / sho / ten / ketsu):

- list ALL characters appearing
- include relationships
- include interactions

---

### 🔥 GRAPH CONSISTENCY RULES (NEW)

1. Interaction Promotion
If two characters interact repeatedly or meaningfully in a stage,
→ a relationship MUST be created.

2. Strength Assignment
- strong: repeated interaction OR emotional intensity OR central conflict
- weak: brief or background interaction

3. Connectivity (CRITICAL)
Every character in a stage MUST have at least ONE connection.
No isolated nodes allowed.

4. Specificity (VERY IMPORTANT)
Avoid vague relationships:
❌ "INTERACTS", "KNOWS"

Use:
✔ "pressures to confess"
✔ "depends on emotionally"
✔ "hides truth from"
✔ "suspects of betrayal"

5. Evolution (VERY IMPORTANT)
Relationships MUST evolve across stages:
- strengthen
- weaken
- reverse
- reveal hidden tension

6. Fallback Rule
If relationship is unclear:
→ include interaction
→ assign:
  type: "UNKNOWN" or "STRANGER"

7. Node Completeness (CRITICAL)
ALL characters appearing in:
- relationships
- interactions

MUST be included in the character list.

---

### RELATIONSHIP TYPE NORMALIZATION (CRITICAL)

You MUST classify every relationship into ONE of the following types.

---

CORE TYPES:
- alliance      (cooperate, help, support)
- conflict      (argue, oppose, attack)
- authority     (commands, supervises, controls)
- dependency    (relies on, needs, follows)
- emotional     (love, care, fear, resentment)

---

WEAK / CONTEXT TYPES:
- observation   (watches, notices, monitors)
- communication (talks, reports, informs)
- co_presence   (appears in same scene/event)

---

STRICT RULES:

- DO NOT invent new types
- DO NOT output free-form labels
- DO NOT use previous categories like:
  FAMILY, FRIEND, ENEMY, etc.

- If unsure → use "co_presence"

---

OUTPUT REQUIREMENT:

"type" MUST be EXACTLY one of the above strings. 

---

### EDGE ATTRIBUTES

Each relationship MUST include:

- source
- target
- type
- dynamic (specific phrase, NOT generic)
- stage (ki/sho/ten/ketsu)
- confidence (0.6–0.95)
- strength (weak or strong)

---

### INTERACTIONS

Each must include:

- source
- target
- stage
- dynamic (2-4 words short phrase like "brief exchange", "observes silently")

---

### GRAPH DENSITY RULE

You MUST return:

- at least 8 characters  
- at least 10 relationships  
- at least 12 interactions  

---

############################
### OUTPUT FORMAT (STRICT JSON)
############################

{{
  "beats": {{
    "ki": {{ "summary": "", "comment": "" }},
    "sho": {{ "summary": "", "comment": "" }},
    "ten": {{ "summary": "", "comment": "" }},
    "ketsu": {{ "summary": "", "comment": "" }}
  }},
  "characters": [
    {{
      "name": "",
      "description": "",
      "importance": 0.8,
      "bio": ""
    }}
  ],
  "graphs_by_stage": {{
    "ki": {{
      "characters": [],
      "relationships": [],
      "interactions": []
    }},
    "sho": {{
      "characters": [],
      "relationships": [],
      "interactions": []
    }},
    "ten": {{
      "characters": [],
      "relationships": [],
      "interactions": []
    }},
    "ketsu": {{
      "characters": [],
      "relationships": [],
      "interactions": []
    }}
  }}
}}

---

TEXT:
{text[:10000]}
"""
