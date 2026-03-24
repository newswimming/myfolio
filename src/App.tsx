import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { useStore } from './store'
import type { GraphData } from './types'
import NarrativeDashboard from './components/NarrativeDashboard'

export default function App() {
  const setGraphData = useStore((s) => s.setGraphData)
  const graphData = useStore((s) => s.graphData)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as GraphData
        setGraphData(parsed)
      } catch {
        alert('Failed to parse vault_graph.json — make sure it is valid JSON.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center gap-8 p-8">
      {/* Top bar */}
      <header className="w-full max-w-6xl flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">myfolio</h1>

        <label
          className="flex items-center gap-2 cursor-pointer rounded-xl border border-dashed border-gray-600 px-4 py-2 text-sm text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={15} />
          {graphData
            ? `${graphData.nodes.length} nodes loaded`
            : 'Upload vault_graph.json'}
          <input
            ref={inputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </header>

      {/* Main content */}
      {graphData ? (
        <NarrativeDashboard />
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-600">
          <p className="text-sm">Upload a vault_graph.json to get started.</p>
        </div>
      )}
    </div>
  )
}
