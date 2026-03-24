import { useState, useMemo } from 'react'
import { Lock, Unlock, Sparkles, Loader2, X, BookOpen } from 'lucide-react'
import { useStore } from '../store'
import { generateUnlockedArcs } from '../services/arcGenerator'
import type { ActKey } from '../types'

const ACT_KEYS: ActKey[] = ['ki', 'sho', 'ten', 'ketsu']

const ACT_LABELS: Record<ActKey, { title: string; subtitle: string }> = {
  ki:    { title: 'Ki',    subtitle: 'Establish' },
  sho:   { title: 'Sho',  subtitle: 'Develop' },
  ten:   { title: 'Ten',  subtitle: 'Twist' },
  ketsu: { title: 'Ketsu', subtitle: 'Resolve' },
}

interface Props {
  onDevelopStory: () => void
}

export default function NarrativeDashboard({ onDevelopStory }: Props) {
  const beats = useStore((s) => s.beats)
  const graphData = useStore((s) => s.graphData)
  const toggleBeatLock = useStore((s) => s.toggleBeatLock)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAct, setSelectedAct] = useState<ActKey | null>(null)

  const allLocked = ACT_KEYS.every((act) => beats[act].isLocked)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      await generateUnlockedArcs()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClusterClick = (act: ActKey) => {
    setSelectedAct((prev) => (prev === act ? null : act))
  }

  // Build cluster → nodes map for the selected act, with a derived title per cluster
  const clusterPanelData = useMemo(() => {
    if (!selectedAct || !graphData) return null
    const clusterIds = beats[selectedAct].clusterIds
    if (clusterIds.length === 0) return null

    const idSet = new Set(clusterIds)
    const nodesByCid = new Map<number, typeof graphData.nodes>()
    for (const cid of clusterIds) nodesByCid.set(cid, [])
    for (const node of graphData.nodes) {
      if (idSet.has(node.macro_id)) {
        nodesByCid.get(node.macro_id)?.push(node)
      }
    }

    const groups = nodesByCid

    return { act: selectedAct, groups }
  }, [selectedAct, graphData, beats])

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
      {/* Beat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {ACT_KEYS.map((act) => {
          const beat = beats[act]
          const { title, subtitle } = ACT_LABELS[act]
          const locked = beat.isLocked
          const isSelected = selectedAct === act

          return (
            <div
              key={act}
              className={[
                'flex flex-col rounded-2xl border p-5 gap-4 transition-all duration-200',
                locked
                  ? 'border-gray-700 bg-gray-900/60'
                  : 'border-indigo-500 bg-gray-900 shadow-lg shadow-indigo-950/40',
              ].join(' ')}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className={[
                      'text-xs font-semibold uppercase tracking-widest',
                      locked ? 'text-gray-500' : 'text-indigo-400',
                    ].join(' ')}
                  >
                    {subtitle}
                  </p>
                  <h2
                    className={[
                      'text-xl font-bold leading-none mt-0.5',
                      locked ? 'text-gray-400' : 'text-white',
                    ].join(' ')}
                  >
                    {title}
                  </h2>
                </div>

                <button
                  onClick={() => toggleBeatLock(act)}
                  title={locked ? 'Unlock beat' : 'Lock beat'}
                  className={[
                    'flex-shrink-0 rounded-lg p-1.5 transition-colors',
                    locked
                      ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'
                      : 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-900/50',
                  ].join(' ')}
                >
                  {locked ? <Lock size={16} /> : <Unlock size={16} />}
                </button>
              </div>

              {/* Beat text */}
              <p
                className={[
                  'text-sm leading-relaxed flex-1 min-h-[4rem]',
                  locked ? 'text-gray-500' : 'text-gray-200',
                  !beat.text ? 'italic' : '',
                ].join(' ')}
              >
                {beat.text || 'Not yet generated.'}
              </p>

              {/* Cluster button */}
              <button
                type="button"
                onClick={() => handleClusterClick(act)}
                disabled={beat.clusterIds.length === 0}
                className={[
                  'self-start text-xs rounded-full px-2 py-0.5 transition-colors',
                  beat.clusterIds.length === 0
                    ? 'text-gray-600 bg-gray-800 cursor-default'
                    : isSelected
                    ? 'text-indigo-300 bg-indigo-900 ring-1 ring-indigo-500'
                    : 'text-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-gray-200',
                ].join(' ')}
              >
                {beat.clusterIds.length > 0
                  ? `clusters ${beat.clusterIds.join(', ')}`
                  : 'no clusters'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Generate button + error */}
      <div className="flex flex-col items-center gap-3">
        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed px-8 py-3.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-950/50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Narrative
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onDevelopStory}
            disabled={!allLocked}
            title={allLocked ? undefined : 'Lock all four sections first'}
            className="flex items-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed px-8 py-3.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-emerald-950/50"
          >
            <BookOpen size={16} />
            Develop Story
          </button>
        </div>

        {!allLocked && (
          <p className="text-xs text-gray-600">
            Lock all four sections to develop the story.
          </p>
        )}
      </div>

      {/* Cluster detail panel */}
      {clusterPanelData && (
        <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 flex flex-col gap-6">
          {/* Panel header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">
              {ACT_LABELS[clusterPanelData.act].title} — Source Clusters
            </h3>
            <button
              onClick={() => setSelectedAct(null)}
              className="text-gray-500 hover:text-gray-300 rounded-lg p-1 transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Clusters */}
          <div className="flex flex-col gap-6">
            {Array.from(clusterPanelData.groups.entries()).map(([cid, nodes]) => (
              <div key={cid} className="flex flex-col gap-3">
                <div className="flex items-baseline gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                    Cluster {cid}
                  </h4>
                  <span className="text-xs text-gray-600">
                    {nodes.length} note{nodes.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {nodes.map((node) => (
                    <div
                      key={node.id}
                      className="rounded-xl border border-gray-800 bg-gray-950 p-4 flex flex-col gap-2"
                    >
                      <p className="text-sm font-semibold text-gray-100 leading-snug">
                        {node.id}
                      </p>

                      {(node.tags?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {node.tags!.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs text-indigo-400 bg-indigo-950/60 rounded-full px-2 py-0.5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {node.content && (
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-4">
                          {node.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
