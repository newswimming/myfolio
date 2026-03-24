import { useStore } from '../store'

/**
 * Triggers arc generation via the Python backend.
 * Heavy LLM chaining and graph math live in the backend;
 * this function is a thin call-site shim kept for backwards compatibility
 * with any existing callers (e.g. NarrativeDashboard).
 */
export async function generateUnlockedArcs(): Promise<void> {
  await useStore.getState().generateArc()
}
