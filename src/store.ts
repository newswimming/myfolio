import { create } from 'zustand'
import type { GraphData, ArcBeat, ActKey, GenerateArcResponse, ThemeResult, BiasResult } from './types'
import { mockGraphData, mockArcResponse } from './mocks/mockData'
import { fetchThemes, fetchBiasScore } from './services/trendBiasApi'

const API_BASE = 'http://127.0.0.1:8000'

const ACT_KEYS: ActKey[] = ['ki', 'sho', 'ten', 'ketsu']

interface AppState {
  graphData: GraphData | null
  beats: Record<ActKey, ArcBeat>
  isGenerating: boolean
  isLoadingGraph: boolean
  isRefreshing: boolean
  error: string | null
  themes: ThemeResult[]
  biasResult: BiasResult | null
  isAnalyzing: boolean
  analysisError: string | null
  setGraphData: (data: GraphData) => void
  toggleBeatLock: (act: ActKey) => void
  fetchGraph: () => Promise<void>
  refreshGraph: () => Promise<void>
  generateArc: () => Promise<void>
  analyzeArc: () => Promise<void>
}

const initialBeats: Record<ActKey, ArcBeat> = Object.fromEntries(
  ACT_KEYS.map((act) => [
    act,
    { act, text: '', isLocked: false, clusterIds: [], characterNames: [] },
  ])
) as unknown as Record<ActKey, ArcBeat>

export const useStore = create<AppState>((set, get) => ({
  graphData: null,
  beats: initialBeats,
  isGenerating: false,
  isLoadingGraph: false,
  isRefreshing: false,
  error: null,
  themes: [],
  biasResult: null,
  isAnalyzing: false,
  analysisError: null,

  setGraphData: (data) => set({ graphData: data }),

  fetchGraph: async () => {
    set({ isLoadingGraph: true, error: null })
    try {
      let res: Response
      try {
        res = await fetch(`${API_BASE}/graph/export-hydrated`)
      } catch {
        // fetch() threw — server not running, fall back to mock silently
        set({ graphData: mockGraphData })
        return
      }
      if (!res.ok) {
        const message = await res.text()
        throw new Error(`Server error ${res.status}: ${message}`)
      }
      const data = (await res.json()) as GraphData
      set({ graphData: data })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Graph load failed.' })
    } finally {
      set({ isLoadingGraph: false })
    }
  },

  refreshGraph: async () => {
    set({ isRefreshing: true, error: null })
    try {
      // Re-run Leiden partition before re-fetching the graph
      await fetch(`${API_BASE}/graph/communities/multi`)
    } catch {
      // partition failing is non-fatal — still re-fetch graph
    }
    try {
      const res = await fetch(`${API_BASE}/graph/export-hydrated`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = (await res.json()) as GraphData
      set({ graphData: data })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Refresh failed.' })
    } finally {
      set({ isRefreshing: false })
    }
  },

  toggleBeatLock: (act) =>
    set((state) => ({
      beats: {
        ...state.beats,
        [act]: { ...state.beats[act], isLocked: !state.beats[act].isLocked },
      },
    })),

  analyzeArc: async () => {
    const { beats } = get()
    const text = [beats.ki.text, beats.sho.text, beats.ten.text, beats.ketsu.text]
      .join('\n\n')

    set({ isAnalyzing: true, analysisError: null })
    try {
      const [themes, biasResult] = await Promise.all([
        fetchThemes(text, 30),
        fetchBiasScore(text),
      ])
      set({ themes, biasResult })
    } catch (e) {
      set({ analysisError: e instanceof Error ? e.message : 'Analysis failed.' })
    } finally {
      set({ isAnalyzing: false })
    }
  },

  generateArc: async () => {
    const { beats } = get()

    const locked_acts = ACT_KEYS.filter((act) => beats[act].isLocked)

    set({ isGenerating: true, error: null })

    try {
      // Default to mock so TypeScript's control-flow analysis can prove
      // payload is always initialised before use.  Overwritten with live
      // data when the backend is reachable and returns a valid response.
      let payload: GenerateArcResponse = mockArcResponse

      let networkDown = false
      let res: Response | undefined
      try {
        res = await fetch(`${API_BASE}/graph/generate-arc`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locked_acts }),
        })
      } catch {
        // fetch() threw — server not running, use mock arc silently
        networkDown = true
        payload = mockArcResponse
      }
      if (!networkDown && res) {
        if (!res.ok) {
          const message = await res.text()
          throw new Error(`Server error ${res.status}: ${message}`)
        }
        payload = (await res.json()) as GenerateArcResponse
      }

      set((state) => {
        const updated = { ...state.beats }

        for (const act of ACT_KEYS) {
          if (state.beats[act].isLocked) continue
          updated[act] = {
            ...updated[act],
            text: payload[act],
            clusterIds: payload.clusters_used[act] ?? [],
            characterNames: payload.characters_per_act?.[act] ?? [],
          }
        }

        return { beats: updated }
      })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Generation failed.' })
    } finally {
      set({ isGenerating: false })
    }
  },
}))
