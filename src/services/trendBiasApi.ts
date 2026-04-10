import type { ThemeResult, BiasResult } from '../types'

const TREND_BIAS_BASE = '/trend-bias'

export async function fetchNote(noteId: string): Promise<string> {
  const res = await fetch(`/notes/${encodeURIComponent(noteId)}`)
  if (!res.ok) throw new Error(`Note not found: ${noteId}`)
  return res.text()
}

export async function fetchThemes(notes: string, daysBack: 30 | 50 | 100): Promise<ThemeResult[]> {
  const res = await fetch(`${TREND_BIAS_BASE}/themes-and-trends`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, days_back: daysBack }),
  })
  if (!res.ok) {
    const message = await res.text()
    throw new Error(`Server error ${res.status}: ${message}`)
  }
  const data = await res.json() as { themes: ThemeResult[] }
  return data.themes
}

function parseScore(raw: unknown): number {
  if (typeof raw === 'number') return raw
  const n = parseFloat(String(raw))
  return isNaN(n) ? 0 : n
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeBias(raw: any): BiasResult {
  const normSub = (sub: any) => ({ score: parseScore(sub.score), evidence: sub.evidence ?? [] })
  return {
    overall_bias_score: parseScore(raw.overall_bias_score),
    bias_1: {
      agency_gap: normSub(raw.bias_1.agency_gap),
      gaze_objectification: normSub(raw.bias_1.gaze_objectification),
      affection_asymmetry: normSub(raw.bias_1.affection_asymmetry),
    },
    bias_2: {
      linguistic_stereotyping: normSub(raw.bias_2.linguistic_stereotyping),
      dialogue_power_imbalance: normSub(raw.bias_2.dialogue_power_imbalance),
    },
  }
}

export async function fetchBiasScore(script: string): Promise<BiasResult> {
  const res = await fetch(`${TREND_BIAS_BASE}/bias-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script }),
  })
  if (!res.ok) {
    const message = await res.text()
    throw new Error(`Server error ${res.status}: ${message}`)
  }
  return normalizeBias(await res.json())
}
