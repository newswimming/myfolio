import { useEffect, useRef } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { useStore } from './store'
import type { GraphData } from './types'
import NarrativeDashboard from './components/NarrativeDashboard'

export default function App() {
  const setGraphData = useStore((s) => s.setGraphData)
  const fetchGraph = useStore((s) => s.fetchGraph)
  const graphData = useStore((s) => s.graphData)
  const isLoadingGraph = useStore((s) => s.isLoadingGraph)
  const error = useStore((s) => s.error)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchGraph()
  }, [fetchGraph])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as GraphData
        setGraphData(parsed)
      } catch {
        alert('Failed to parse JSON — make sure the file is valid.')
      }
    }
    reader.readAsText(file)
  }

  const graphStatus = () => {
    if (isLoadingGraph) return <><Loader2 size={14} className="animate-spin" /> Loading graph…</>
    if (graphData) return <>{graphData.nodes.length} nodes loaded</>
    return <>Backend unavailable — upload manually</>
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center gap-8 p-8">
      {/* Top bar */}
      <header className="w-full max-w-6xl flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">myfolio</h1>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            {graphStatus()}
          </span>

          <label
            className="flex items-center gap-2 cursor-pointer rounded-xl border border-dashed border-gray-700 px-3 py-1.5 text-xs text-gray-500 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
            onClick={() => inputRef.current?.click()}
            title="Override with a local JSON file"
          >
            <Upload size={13} />
            Override
            <input
              ref={inputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      </header>

      {/* Error banner */}
      {error && !isLoadingGraph && (
        <div className="w-full max-w-6xl rounded-lg border border-red-800 bg-red-950/40 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Main content */}
      {graphData ? (
        <NarrativeDashboard />
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 text-gray-600">
          {isLoadingGraph
            ? <p className="text-sm">Fetching graph from backend…</p>
            : <p className="text-sm">No graph loaded. Start the backend or upload a file manually.</p>
          }
        </div>
      )}
    </div>
  )
}
