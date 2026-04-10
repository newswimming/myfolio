import { useEffect, useRef, useState } from 'react'
import { Upload, Loader2, RefreshCw } from 'lucide-react'
import { useStore } from './store'
import type { GraphData } from './types'
import NarrativeDashboard from './components/NarrativeDashboard'
import StoryDashboard from './components/StoryDashboard'
import CharacterGraph from './components/CharacterGraph'
import { mockGraphData } from './mocks/mockData'

export default function App() {
  const setGraphData = useStore((s) => s.setGraphData)
  const fetchGraph = useStore((s) => s.fetchGraph)
  const refreshGraph = useStore((s) => s.refreshGraph)
  const graphData = useStore((s) => s.graphData)
  const isLoadingGraph = useStore((s) => s.isLoadingGraph)
  const isRefreshing = useStore((s) => s.isRefreshing)
  const error = useStore((s) => s.error)
  const inputRef = useRef<HTMLInputElement>(null)
  const [page, setPage] = useState<'arc' | 'story' | 'characters'>('arc')

  const isMockData = graphData === mockGraphData

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
    if (graphData && isMockData) return <span className="text-yellow-600">mock data — backend offline</span>
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

          <button
            onClick={() => refreshGraph()}
            disabled={isRefreshing || isLoadingGraph}
            title="Re-run /analyze then reload graph"
            className="flex items-center gap-1.5 rounded-xl border border-gray-700 px-3 py-1.5 text-xs text-gray-500 hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>

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

      {/* Mock data banner */}
      {isMockData && !isLoadingGraph && (
        <div className="w-full max-w-6xl rounded-lg border border-yellow-800 bg-yellow-950/30 px-4 py-2 text-xs text-yellow-500">
          Using mock data — start the backend at <code className="font-mono">http://127.0.0.1:8000</code> and refresh to load live graph.
        </div>
      )}

      {/* View tabs */}
      {graphData && (
        <div className="w-full max-w-6xl flex items-center gap-1 border-b border-gray-800 pb-0">
          {(['arc', 'characters', 'story'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setPage(v)}
              className={[
                'px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors rounded-t-lg -mb-px',
                page === v
                  ? 'text-indigo-300 border border-b-gray-950 border-gray-700 bg-gray-950'
                  : 'text-gray-600 hover:text-gray-400',
              ].join(' ')}
            >
              {v === 'arc' ? 'Narrative' : v === 'characters' ? 'Characters' : 'Story'}
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      {graphData ? (
        page === 'story'
          ? <StoryDashboard onBack={() => setPage('arc')} />
          : page === 'characters'
          ? <CharacterGraph />
          : <NarrativeDashboard onDevelopStory={() => setPage('story')} />
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
