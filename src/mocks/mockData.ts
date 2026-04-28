import type { GraphData, GenerateArcResponse } from '../types'

// ---------------------------------------------------------------------------
// Mock graph — 20 notes + 3 character nodes across 4 thematic clusters
// Cluster 0: Identity & origins
// Cluster 1: Creative practice
// Cluster 2: Constraints & failures
// Cluster 3: Emergence & resolution
//
// Character nodes (is_character_node: true):
//   ki-woo      — locus,    community 0 (Ki)
//   chung-sook  — mirror,   community 0 (Ki)
//   dong-ik     — agent,    community 1 (Sho)
// ---------------------------------------------------------------------------
export const mockGraphData: GraphData = {
  nodes: [
    // ── Character nodes ─────────────────────────────────────────────────────
    {
      id: 'ki-woo',
      display_name: 'Ki-woo',
      macro_id: 0,
      character_community_id: 0,
      is_character_node: true,
      character_role: 'locus',
      tags: ['aspect/character/ki-woo', 'affect/mu', 'code/ki-2'],
      content: 'Ki-woo is a character introduced in SCENE_003. Relations: ROMANTIC with chung-sook. Interactions: dong-ik (neutral, reactive)',
    },
    {
      id: 'chung-sook',
      display_name: 'Chung-sook',
      macro_id: 0,
      character_community_id: 0,
      is_character_node: true,
      character_role: 'mirror',
      tags: ['aspect/character/chung-sook', 'affect/positive', 'code/ki-2'],
      content: 'Chung-sook is a character introduced in SCENE_005. Relations: FRIEND with ki-woo. Interactions: ki-woo (positive, peer)',
    },
    {
      id: 'dong-ik',
      display_name: 'Dong-ik',
      macro_id: 1,
      character_community_id: 1,
      is_character_node: true,
      character_role: 'agent',
      tags: ['aspect/character/dong-ik', 'affect/negative', 'code/sho-5'],
      content: 'Dong-ik is a character introduced in SCENE_023. Relations: BOSS_OF with ki-woo. Interactions: ki-woo (neutral, driven)',
    },

    // Cluster 0 — Identity & origins
    {
      id: 'note-001',
      macro_id: 0,
      tags: ['identity', 'origins', 'aspect/character/ki-woo'],
      content:
        'Growing up between two cities left me with a fragmented sense of place. Neither fully belonged to me, yet both shaped how I see the world.',
    },
    {
      id: 'note-002',
      macro_id: 0,
      tags: ['identity', 'language'],
      content:
        'Code-switching between languages at home taught me early that context determines meaning — a lesson I carry into every project.',
    },
    {
      id: 'note-003',
      macro_id: 0,
      tags: ['memory', 'family'],
      content:
        'My grandmother kept a logbook of every storm that passed through the valley. I inherited her habit of documentation without inheriting her handwriting.',
    },
    {
      id: 'note-004',
      macro_id: 0,
      tags: ['identity', 'contradiction'],
      content:
        'I distrust narratives that resolve too cleanly. Real lives accumulate loose ends.',
    },
    {
      id: 'note-005',
      macro_id: 0,
      tags: ['origins', 'tools'],
      content:
        'First encountered version control as a metaphor before as a tool. The idea that you could restore any previous state of a thing felt almost spiritual.',
    },

    // Cluster 1 — Creative practice
    {
      id: 'note-006',
      macro_id: 1,
      tags: ['process', 'design'],
      content:
        'The best work I have done started from a constraint I resented. Limitation is not the opposite of creativity — it is the pressure that forces it.',
    },
    {
      id: 'note-007',
      macro_id: 1,
      tags: ['process', 'writing'],
      content:
        'Draft zero is permission to be wrong. The point is to put something on the page that can be argued with.',
    },
    {
      id: 'note-008',
      macro_id: 1,
      tags: ['collaboration', 'process'],
      content:
        'Working with others reveals the edges of your own thinking faster than any amount of solitary reflection.',
    },
    {
      id: 'note-009',
      macro_id: 1,
      tags: ['design', 'systems'],
      content:
        'A system that cannot be understood by the people using it will eventually be gamed or abandoned. Legibility is a form of respect.',
    },
    {
      id: 'note-010',
      macro_id: 1,
      tags: ['research', 'curiosity'],
      content:
        'The most generative question I know: what would have to be true for this to work? It bypasses the instinct to dismiss and forces hypothetical commitment.',
    },

    // Cluster 2 — Constraints & failures
    {
      id: 'note-011',
      macro_id: 2,
      tags: ['failure', 'reflection'],
      content:
        'The project that fell apart taught me more about scope than any success. I had confused ambition with a plan.',
    },
    {
      id: 'note-012',
      macro_id: 2,
      tags: ['constraints', 'time'],
      content:
        'Shipping something imperfect is not a compromise — it is an acknowledgment that improvement requires contact with reality.',
    },
    {
      id: 'note-013',
      macro_id: 2,
      tags: ['failure', 'learning'],
      content:
        'I kept the broken prototype on my desk for a year. Reminders of failure are only useful if they are specific enough to teach something.',
    },
    {
      id: 'note-014',
      macro_id: 2,
      tags: ['constraints', 'clarity'],
      content:
        'Saying no to a feature is harder when you built it yourself. Sunk cost is an emotional fact before it is a logical fallacy.',
    },
    {
      id: 'note-015',
      macro_id: 2,
      tags: ['friction', 'growth'],
      content:
        'The periods of highest friction in my work have also been the periods of most visible change. I do not think this is a coincidence.',
    },

    // Cluster 3 — Emergence & resolution
    {
      id: 'note-016',
      macro_id: 3,
      tags: ['emergence', 'patterns'],
      content:
        'Patterns only become visible in retrospect. You cannot see a theme while you are living inside it.',
    },
    {
      id: 'note-017',
      macro_id: 3,
      tags: ['resolution', 'synthesis'],
      content:
        'The synthesis I had been looking for was already present in the earlier work — I just needed enough distance to see it as a whole.',
    },
    {
      id: 'note-018',
      macro_id: 3,
      tags: ['emergence', 'clarity'],
      content:
        'Clarity is not the absence of complexity. It is the decision about which complexity to surface.',
    },
    {
      id: 'note-019',
      macro_id: 3,
      tags: ['resolution', 'letting-go'],
      content:
        'Finishing something means accepting that it will now exist without you. The work becomes its own thing the moment it leaves your hands.',
    },
    {
      id: 'note-020',
      macro_id: 3,
      tags: ['future', 'intention'],
      content:
        'I want to build things that still make sense to me in ten years — not because they are timeless, but because they were honest.',
    },
  ],

  links: [
    // Character → character relations
    { source: 'ki-woo',     target: 'dong-ik',    relation_type: 'hinders',   narrative_act: 'sho', confidence: 0.85 },
    { source: 'chung-sook', target: 'ki-woo',     relation_type: 'supports',  narrative_act: 'ki',  confidence: 0.90 },
    { source: 'dong-ik',    target: 'ki-woo',     relation_type: 'motivates', narrative_act: 'ten', confidence: 0.78 },
    // Vault note → character (cross-reference edges)
    { source: 'note-001',   target: 'ki-woo',     relation_type: 'related',   narrative_act: 'ki',  confidence: 0.70 },
    { source: 'note-006',   target: 'dong-ik',    relation_type: 'related',   narrative_act: 'sho', confidence: 0.70 },
    // Note → note
    { source: 'note-001', target: 'note-002' },
    { source: 'note-002', target: 'note-004' },
    { source: 'note-003', target: 'note-001' },
    { source: 'note-005', target: 'note-009' },
    { source: 'note-006', target: 'note-007' },
    { source: 'note-007', target: 'note-008' },
    { source: 'note-008', target: 'note-010' },
    { source: 'note-009', target: 'note-012' },
    { source: 'note-011', target: 'note-013' },
    { source: 'note-012', target: 'note-014' },
    { source: 'note-013', target: 'note-015' },
    { source: 'note-015', target: 'note-016' },
    { source: 'note-016', target: 'note-017' },
    { source: 'note-017', target: 'note-018' },
    { source: 'note-018', target: 'note-019' },
    { source: 'note-019', target: 'note-020' },
    { source: 'note-004', target: 'note-011' },
    { source: 'note-010', target: 'note-016' },
    { source: 'note-006', target: 'note-015' },
    { source: 'note-003', target: 'note-017' },
  ],
}

// ---------------------------------------------------------------------------
// Mock arc response — one plausible ki/sho/ten/ketsu for the above graph
// ---------------------------------------------------------------------------
export const mockArcResponse: GenerateArcResponse = {
  ki: "A person shaped by fragmented belonging — two cities, two languages, a grandmother's logbook — arrives at creative work carrying both the habit of documentation and a deep distrust of tidy conclusions. The stage is set not by certainty but by accumulated texture.",
  sho: "Through practice, collaboration, and the slow accumulation of drafts, a working method takes shape. Constraints that first felt like obstacles reveal themselves as the conditions that make the work possible. The process is unglamorous: permission to be wrong, then iteration, then the uncomfortable discovery that other people's thinking has edges your own does not.",
  ten: "A project collapses. The ambition was real but the plan was not. What remains on the desk — a broken prototype, a year of looking at it — forces a reckoning with sunk cost as an emotional reality rather than a logical fallacy. The friction is highest here, and so, it turns out, is the rate of change.",
  ketsu: "Distance makes the pattern visible. The synthesis was always present in the earlier work; it only needed the right vantage point. Finishing the work means accepting that it will exist without you — that it becomes its own thing the moment it leaves your hands. What remains is the intention to keep building things that are honest enough to still make sense in ten years.",
  clusters_used: {
    ki:    [0],
    sho:   [1],
    ten:   [2],
    ketsu: [3],
  },
  characters_per_act: {
    ki:    ['ki-woo', 'chung-sook'],
    sho:   ['dong-ik'],
    ten:   ['ki-woo'],
    ketsu: [],
  },
}
