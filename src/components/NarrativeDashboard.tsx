import { useState } from 'react'
import { Lock, Unlock, Sparkles, Loader2 } from 'lucide-react'
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

export default function NarrativeDashboard() {
  const beats = useStore((s) => s.beats)
  const toggleBeatLock = useStore((s) => s.toggleBeatLock)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
      {/* Beat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {ACT_KEYS.map((act) => {
          const beat = beats[act]
          const { title, subtitle } = ACT_LABELS[act]
          const locked = beat.isLocked

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

              {/* Cluster badge */}
              <span className="self-start text-xs text-gray-600 bg-gray-800 rounded-full px-2 py-0.5">
                cluster {beat.clusterId}
              </span>
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

        <button
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
      </div>
    </div>
  )
}
