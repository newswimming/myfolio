import { useStore } from '../store'
import type { ActKey } from '../types'

const OLLAMA_URL = 'http://localhost:11434/api/generate'
const MODEL = 'llama3.2'
const CLUSTER_CHAR_LIMIT = 12_000

const ACT_KEYS: ActKey[] = ['ki', 'sho', 'ten', 'ketsu']

const ACT_INSTRUCTIONS: Record<ActKey, string> = {
  ki:     'Establish the status quo using these ideas. Write exactly 2 sentences.',
  sho:    'Introduce a development or complication using these ideas. Write exactly 2 sentences.',
  ten:    'Deliver a twist or turning point using these ideas. Write exactly 2 sentences.',
  ketsu:  'Resolve and conclude the narrative arc using these ideas. Write exactly 2 sentences.',
}

async function ollamaGenerate(prompt: string): Promise<string> {
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt, stream: false }),
  })

  if (!res.ok) {
    throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json() as { response: string }
  return data.response.trim()
}

export async function generateUnlockedArcs(): Promise<void> {
  const { graphData, beats, updateBeatText } = useStore.getState()

  if (!graphData) {
    throw new Error('No graph data loaded. Upload a vault_graph.json first.')
  }

  // Track completed beat texts so later acts can reference earlier ones for continuity.
  const completedTexts: Partial<Record<ActKey, string>> = {}

  // Pre-populate with already-locked beats so they can serve as context.
  for (const act of ACT_KEYS) {
    if (beats[act].isLocked) {
      completedTexts[act] = beats[act].text
    }
  }

  for (const act of ACT_KEYS) {
    if (beats[act].isLocked) continue

    // --- Gather cluster text ---
    const clusterId = beats[act].clusterId
    const clusterNodes = graphData.nodes.filter((n) => n.macro_id === clusterId)

    let clusterText = clusterNodes.map((n) => n.content).join('\n\n')
    if (clusterText.length > CLUSTER_CHAR_LIMIT) {
      clusterText = clusterText.slice(0, CLUSTER_CHAR_LIMIT)
    }

    if (!clusterText.trim()) {
      // No nodes found for this cluster — skip silently.
      continue
    }

    // --- Step A: Summarize ---
    const summarizePrompt =
      `Summarize these notes into exactly 5 key ideas as a bulleted list. No preamble.\n\n${clusterText}`

    const bullets = await ollamaGenerate(summarizePrompt)

    // --- Step B: Draft the act ---
    const priorContext = buildPriorContext(act, completedTexts)

    const draftPrompt =
      `${priorContext}Act: ${act.charAt(0).toUpperCase() + act.slice(1)}. ` +
      `${ACT_INSTRUCTIONS[act]}\n\nKey ideas:\n${bullets}`

    const draft = await ollamaGenerate(draftPrompt)

    completedTexts[act] = draft
    updateBeatText(act, draft)
  }
}

function buildPriorContext(
  currentAct: ActKey,
  completed: Partial<Record<ActKey, string>>,
): string {
  const preceding = ACT_KEYS.slice(0, ACT_KEYS.indexOf(currentAct))
  const lines = preceding
    .filter((a) => completed[a])
    .map((a) => `${a.charAt(0).toUpperCase() + a.slice(1)}: ${completed[a]}`)

  if (lines.length === 0) return ''
  return `Previous beats for narrative continuity:\n${lines.join('\n')}\n\n`
}
