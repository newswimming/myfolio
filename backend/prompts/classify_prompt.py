def build_classify_prompt(text):
    return f"""
You are a highly reliable text classifier.

Classify the input into ONE type:

- script
- outline
- brainstorm

Return JSON ONLY:
{{"type":"script|outline|brainstorm"}}

---

### CORE IDEA

Do NOT rely only on formatting.

Classify based on:
- how the story is presented
- how characters interact
- how information unfolds

---

### 1. SCRIPT (highest priority)

A text is a script if it shows:

- characters interacting through dialogue
- actions and dialogue unfolding in real time
- scene-like progression (moment-to-moment)
- alternating speech or action beats

STRONG SIGNALS:
- quotation marks ("...")
- back-and-forth dialogue
- verbs like: looks, walks, turns, pauses, says
- visible interaction between characters

IMPORTANT:
- Even WITHOUT INT./EXT. or formatting
- Even if short
- If it FEELS like a scene → SCRIPT

---

### 2. OUTLINE

A text is an outline if it shows:

- summarized storytelling
- events described rather than enacted
- progression across time (not real-time scene)
- structured or logical flow

STRONG SIGNALS:
- "A man discovers..."
- "Then he decides..."
- "Eventually..."
- bullet points or structured acts

---

### 3. BRAINSTORM (default)

A text is brainstorming if it is:

- vague or exploratory
- incomplete ideas
- lacks clear structure or progression

Examples:
- "maybe a story about memory"
- "something with time travel and regret"

---

### DECISION RULES

- If characters are ACTING and SPEAKING in real time → SCRIPT
- If events are SUMMARIZED across time → OUTLINE
- If ideas are FRAGMENTED or unclear → BRAINSTORM

---

### PRIORITY

script > outline > brainstorm

---

### EDGE CASES

- narrative with embedded dialogue → SCRIPT
- descriptive paragraphs with no real-time interaction → OUTLINE
- very short but contains dialogue → SCRIPT
- unclear or minimal input → BRAINSTORM

---

### OUTPUT RULES

- Return ONLY JSON
- No explanation
- Always return exactly one type

---

TEXT:
{text[:1500]}
"""
