import { create } from 'zustand'
import type { GraphData, ArcBeat, ActKey } from './types'

interface AppState {
  graphData: GraphData | null
  beats: Record<ActKey, ArcBeat>
  setGraphData: (data: GraphData) => void
  updateBeatText: (act: ActKey, text: string) => void
  toggleBeatLock: (act: ActKey) => void
}

const ACT_KEYS: ActKey[] = ['ki', 'sho', 'ten', 'ketsu']

const initialBeats: Record<ActKey, ArcBeat> = Object.fromEntries(
  ACT_KEYS.map((act, i) => [
    act,
    { act, text: '', isLocked: false, clusterId: i },
  ])
) as Record<ActKey, ArcBeat>

export const useStore = create<AppState>((set) => ({
  graphData: null,
  beats: initialBeats,

  setGraphData: (data) => set({ graphData: data }),

  updateBeatText: (act, text) =>
    set((state) => ({
      beats: {
        ...state.beats,
        [act]: { ...state.beats[act], text },
      },
    })),

  toggleBeatLock: (act) =>
    set((state) => ({
      beats: {
        ...state.beats,
        [act]: { ...state.beats[act], isLocked: !state.beats[act].isLocked },
      },
    })),
}))
