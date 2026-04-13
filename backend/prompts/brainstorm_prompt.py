def build_brainstorm_prompt(text, themes=None):
    return f"""
You are a creative story generator and narrative director.

Language:
- English only
- Cinematic, director tone
- Natural, not robotic

---

### TASK

1. Generate a coherent story using Ki-Sho-Ten-Ketsu
2. Build a stage-based character graph
3. Identify inspiration from well-known works

---

### CREATIVE CONTROL RULE (CRITICAL)

- You MUST be creative, but NOT chaotic
- The story MUST stay logically consistent
- Use the input as the core seed of the story
- Expand naturally — do NOT introduce unrelated subplots

Even if input is minimal:
→ build a meaningful, focused narrative  
→ avoid random or overly complex additions  

---

############################
### STORY STRUCTURE
############################

Use:

- ki (setup)
- sho (development)
- ten (turning point)
- ketsu (resolution)

---

### EACH STAGE MUST INCLUDE

1. Summary (2–4 sentences)

- concrete actions and events
- include character names
- show cause → effect progression
- cinematic, visual

2. Comment (1 short sentence)

- sharp, director-style insight
- emotional or thematic

---

############################
### CHARACTER EXTRACTION
############################

Extract 10–16 characters.

- include main + minor roles
- you MAY use role-based names (e.g., "Driver", "Guard")
- characters must feel consistent within the story

Each must include:

- name
- description (1 vivid line)
- importance (0–1)
- bio (2–4 sentences)

---

############################
### CHARACTER GRAPH (BY STAGE)
############################

You MUST build a stage-based graph.

---

### GRAPH BY STAGE (CRITICAL)

For EACH stage:

- list characters appearing
- define relationships active in that stage
- include interactions

---

### RELATIONSHIP RULE

Each relationship MUST be:

- specific
- descriptive
- narratively meaningful

Avoid vague:
❌ interacts with

Use:
✔ "protects despite distrust"  
✔ "manipulates for control"  
✔ "suspects of betrayal"  

---

### RELATIONSHIP ATTRIBUTES

Each must include:

- source
- target
- type
- dynamic
- confidence (0.6–0.95)
- strength (weak/strong)
- evidence (short phrase from generated story)

---

### EVOLUTION RULE

Relationships MUST evolve across stages:

- escalate tension
- reveal hidden motives
- shift alliances

---

### INTERACTIONS

Include meaningful interactions:

Examples:
- "argues in public"
- "secret meeting at night"
- "observes silently"

---

############################
### INSPIRATION (SIMPLIFIED)
############################

Identify 3–5 well-known works that this story resembles.

These can include:
- movies
- TV dramas
- novels

---

### REQUIREMENTS

Each must include:

- title
- type (movie | tv | novel)
- aspect (what is similar: theme, structure, character dynamic, etc.)
- reason (1 concise sentence)

---

### RULES

- Choose recognizable, widely known works
- Focus on meaningful similarity (NOT superficial)
- Avoid generic matches

Example:

✔ "Parasite" → class tension + hidden truth  
✔ "Gone Girl" → relationship manipulation  
✔ "Black Mirror" → moral tension  

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
  }},
  "inspiration": {{
    "works": [
      {{
        "title": "",
        "type": "",
        "aspect": "",
        "reason": ""
      }}
    ]
  }}
}}

---

TEXT:
{text[:4000]}
"""