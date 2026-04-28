import { useRef, useState, useEffect } from 'react'
import CharacterGraph from '../components/CharacterGraph'
import { analyzeStory } from '../services/storyApi'
import AgencyRepresentationChart from '../components/AgencyRepresentationChart'
import TrendsSection from '../components/TrendsSection'

export default function NarrativeDashboard({
  analysis,
  inputText,
  onBack,
  onUpdate
}: any) {

  const [act, setAct] = useState<'ki' | 'sho' | 'ten' | 'ketsu'>('ki')
  const mode = analysis?.mode
  const [generating, setGenerating] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('FULL ANALYSIS:', analysis)
  }, [analysis])

  const shuffle = async () => {
    if (generating) return
    setGenerating(true)
    try {
      const r = await analyzeStory({ text: inputText })
      onUpdate(r)
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = () => {
    window.print()
  }

  const beats = analysis?.beats || {
    ki: { summary: '', comment: '' },
    sho: { summary: '', comment: '' },
    ten: { summary: '', comment: '' },
    ketsu: { summary: '', comment: '' }
  }

  const concerns = analysis?.concerns || []
  const hasGraph = !!analysis?.graphs_by_stage

  const LABELS: any = {
    ki:    { title: '起', subtitle: 'Story' },
    sho:   { title: '承', subtitle: 'Development' },
    ten:   { title: '轉', subtitle: 'Twist' },
    ketsu: { title: '合', subtitle: 'Resolution' }
  }

  const agencyByBeat = analysis?.agency_by_beat

  const trendText = inputText || [
    beats.ki?.summary,
    beats.sho?.summary,
    beats.ten?.summary,
    beats.ketsu?.summary,
  ].filter(Boolean).join(' ')

  // Beat card — shared between both layout modes
  const BeatCard = ({ a }: { a: 'ki' | 'sho' | 'ten' | 'ketsu' }) => {
    const stage = beats[a]
    const isActive = act === a
    return (
      <div
        onClick={() => setAct(a)}
        className={`p-4 cursor-pointer transition-all border ${
          isActive
            ? 'border-cinema-accent bg-cinema-surface'
            : 'border-cinema-border bg-cinema-surface hover:border-cinema-muted'
        }`}
      >
        <h2 className={`font-serif text-lg ${isActive ? 'text-cinema-accent' : 'text-cinema-text'}`}>
          {LABELS[a].title}
        </h2>
        <p className="font-mono text-xs uppercase tracking-cinema text-cinema-muted mt-0.5">
          {LABELS[a].subtitle}
        </p>
        <p className="font-mono text-xs text-cinema-muted mt-3 leading-relaxed">
          {stage?.summary || 'Generating narrative...'}
        </p>
        {stage?.comment && (
          <p className="font-mono text-xs italic text-cinema-muted/60 mt-2">
            {stage.comment}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cinema-bg text-cinema-text print:bg-white print:text-black">
      <div ref={printRef} className="max-w-[1400px] mx-auto px-8 py-10 flex flex-col gap-12">

        {/* TOP BAR */}
        <div className="flex justify-between items-center no-print">
          <button
            onClick={onBack}
            className="font-mono text-xs uppercase tracking-cinema text-cinema-muted hover:text-cinema-text transition"
          >
            ← Back
          </button>

          <div className="flex items-center gap-6">
            <p className="font-mono text-xs tracking-cinema text-cinema-muted uppercase">
              {mode === 'script'     && 'Screenplay Analysis'}
              {mode === 'outline'    && 'Outline Enhancement'}
              {mode === 'brainstorm' && 'Story Generation'}
            </p>

            <button
              onClick={handleExport}
              className="font-mono text-xs uppercase tracking-cinema border border-cinema-border text-cinema-muted px-4 py-1.5 hover:border-cinema-accent hover:text-cinema-accent transition"
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* TITLE */}
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-4xl text-cinema-text print:text-black">
            Narrative Structure
          </h1>
          <p className="font-mono text-xs text-cinema-muted print:text-gray-500">
            Explore how your story unfolds across key narrative beats
          </p>
        </div>

        <div className="h-px bg-cinema-border print:bg-gray-300" />

        {/* STORY ARC — two-column when graph exists, four-column grid otherwise */}
        <div className="flex flex-col gap-4">
          <p className="font-mono text-xs uppercase tracking-cinema text-cinema-muted print:text-gray-500">
            Story Arc
          </p>

          {hasGraph && mode === 'script' ? (
            /* Two-column: beats list left, graph right */
            <div className="grid grid-cols-[5fr_7fr] gap-6">

              {/* LEFT — beats as vertical list */}
              <div className="flex flex-col gap-3">
                {(['ki', 'sho', 'ten', 'ketsu'] as const).map(a => (
                  <BeatCard key={a} a={a} />
                ))}
              </div>

              {/* RIGHT — character network, stretches to match beats height */}
              <div className="flex flex-col gap-3 h-full">
                <p className="font-mono text-xs uppercase tracking-cinema text-cinema-muted">
                  Character Network —{' '}
                  <span className="text-cinema-accent">{LABELS[act].title}</span>{' '}
                  <span className="text-cinema-muted/50">({LABELS[act].subtitle})</span>
                </p>
                <div className="border border-cinema-border bg-cinema-surface flex-1">
                  {!analysis?.graphs_by_stage?.[act] ? (
                    <p className="font-mono text-xs text-cinema-muted p-4">
                      No interactions detected for this stage.
                    </p>
                  ) : (
                    <CharacterGraph data={analysis} stage={act} />
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* Four-column grid for non-script modes */
            <div className="grid grid-cols-4 gap-4">
              {(['ki', 'sho', 'ten', 'ketsu'] as const).map(a => (
                <BeatCard key={a} a={a} />
              ))}
            </div>
          )}
        </div>

        {/* NARRATIVE CONCERNS */}
        {mode !== 'brainstorm' && concerns.length > 0 && (
          <>
            <div className="h-px bg-cinema-border print:bg-gray-300" />
            <div className="flex flex-col gap-5">
              <p className="font-mono text-xs uppercase tracking-cinema text-cinema-muted print:text-gray-500">
                Narrative Concerns
              </p>
              <div className="flex flex-col gap-3">
                {concerns.map((c: any, i: number) => (
                  <div key={i} className="p-4 border border-cinema-border bg-cinema-surface print:border-gray-300 print:bg-gray-50">
                    <div className="flex justify-between mb-1">
                      <span className="font-mono text-xs text-cinema-text uppercase tracking-cinema print:text-black">
                        {c.type}
                      </span>
                      <span className={`font-mono text-xs uppercase tracking-cinema ${
                        c.severity === 'high'   ? 'text-cinema-danger'
                        : c.severity === 'medium' ? 'text-cinema-accent'
                        : 'text-cinema-muted'
                      }`}>
                        {c.severity}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-cinema-muted mt-2 leading-relaxed print:text-gray-600">
                      {c.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* AGENCY & REPRESENTATION — tabbed, full-width below the two columns */}
        {agencyByBeat && mode !== 'brainstorm' && (
          <>
            <div className="h-px bg-cinema-border print:bg-gray-300" />
            <AgencyRepresentationChart agencyByBeat={agencyByBeat} />
          </>
        )}

        {/* THEMES */}
        {mode !== 'brainstorm' && (
          <>
            <div className="h-px bg-cinema-border print:bg-gray-300" />
            <TrendsSection inputText={trendText} />
          </>
        )}

        {/* BRAINSTORM */}
        {mode === 'brainstorm' && (
          <>
            <div className="h-px bg-cinema-border" />
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <button
                  onClick={shuffle}
                  disabled={generating}
                  className={`self-start px-6 py-2.5 font-mono text-xs uppercase tracking-cinema border transition ${
                    generating
                      ? 'border-cinema-border text-cinema-muted cursor-not-allowed'
                      : 'border-cinema-accent text-cinema-accent hover:bg-cinema-accent/10'
                  } no-print`}
                >
                  {generating
                    ? <span className="animate-analyzing">GENERATING...</span>
                    : 'Generate Another Version'}
                </button>
                <p className="font-mono text-xs text-cinema-muted">
                  Explore alternate narrative directions
                </p>
              </div>

              {!analysis?.inspiration?.works ? (
                <p className="font-mono text-xs text-cinema-muted italic animate-analyzing">
                  GENERATING INSPIRATION...
                </p>
              ) : (
                <div className="flex flex-col gap-5">
                  <p className="font-mono text-xs uppercase tracking-cinema text-cinema-muted">
                    Inspiration & Similar Works
                  </p>
                  <div className="flex flex-col gap-3">
                    {analysis.inspiration.works.map((w: any, i: number) => (
                      <div key={i} className="p-4 border border-cinema-border bg-cinema-surface">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-serif text-sm text-cinema-text">{w.title}</span>
                          <span className="font-mono text-xs uppercase tracking-cinema text-cinema-muted">{w.type}</span>
                        </div>
                        <p className="font-mono text-xs text-cinema-accent mt-1">{w.aspect}</p>
                        <p className="font-mono text-xs text-cinema-muted mt-2 leading-relaxed">{w.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
