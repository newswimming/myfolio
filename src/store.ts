import { create } from 'zustand'
import type { GraphData, ArcBeat, ActKey, GenerateArcResponse } from './types'
import { mockGraphData, mockArcResponse } from './mocks/mockData'

const API_BASE = 'http://127.0.0.1:8000'

const ACT_KEYS: ActKey[] = ['ki', 'sho', 'ten', 'ketsu']

interface AppState {
  graphData: GraphData | null
  beats: Record<ActKey, ArcBeat>
  isGenerating: boolean
  isLoadingGraph: boolean
  error: string | null
  setGraphData: (data: GraphData) => void
  toggleBeatLock: (act: ActKey) => void
  fetchGraph: () => Promise<void>
  generateArc: () => Promise<void>
}

const initialBeats: Record<ActKey, ArcBeat> = Object.fromEntries(
  ACT_KEYS.map((act) => [
    act,
    { act, text: '', isLocked: false, clusterIds: [] },
  ])
) as unknown as Record<ActKey, ArcBeat>

export const useStore = create<AppState>((set, get) => ({
  graphData: null,
  beats: initialBeats,
  isGenerating: false,
  isLoadingGraph: false,
  error: null,

  setGraphData: (data) => set({ graphData: data }),

  fetchGraph: async () => {
    set({ isLoadingGraph: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/graph/export-hydrated`)
      if (!res.ok) {
        const message = await res.text()
        throw new Error(`Server error ${res.status}: ${message}`)
      }
      const data = (await res.json()) as GraphData
      set({ graphData: data })
    } catch {
      // Backend unavailable — load mock data so the app works offline
      set({ graphData: mockGraphData })
    } finally {
      set({ isLoadingGraph: false })
    }
  },

  toggleBeatLock: (act) =>
    set((state) => ({
      beats: {
        ...state.beats,
        [act]: { ...state.beats[act], isLocked: !state.beats[act].isLocked },
      },
    })),

  generateArc: async () => {
    const { beats } = get()

    const locked_acts = ACT_KEYS.filter((act) => beats[act].isLocked)

    set({ isGenerating: true, error: null })

    try {
      let payload: GenerateArcResponse

      try {
        const res = await fetch(`${API_BASE}/graph/generate-arc`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locked_acts }),
        })
        if (!res.ok) {
          const message = await res.text()
          throw new Error(`Server error ${res.status}: ${message}`)
        }
        payload = (await res.json()) as GenerateArcResponse
      } catch {
        // Backend unavailable — use mock arc
        payload = mockArcResponse
      }

      set((state) => {
        const updated = { ...state.beats }

        for (const act of ACT_KEYS) {
          if (state.beats[act].isLocked) continue
          updated[act] = {
            ...updated[act],
            text: payload[act],
            clusterIds: payload.clusters_used[act] ?? [],
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
