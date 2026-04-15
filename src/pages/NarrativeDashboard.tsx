import { useState, useEffect } from 'react'
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

  const beats = analysis?.beats || {
    ki: { summary: '', comment: '' },
    sho: { summary: '', comment: '' },
    ten: { summary: '', comment: '' },
    ketsu: { summary: '', comment: '' }
  }

  const concerns = analysis?.concerns || []

  const hasGraph = !!analysis?.graphs_by_stage

  const LABELS: any = {
    ki:    { title: 'Ki',    subtitle: 'Setup' },
    sho:   { title: 'Sho',   subtitle: 'Development' },
    ten:   { title: 'Ten',   subtitle: 'Turning Point' },
    ketsu: { title: 'Ketsu', subtitle: 'Resolution' }
  }

  const agencyByBeat = analysis?.agency_by_beat

  return (
    <div className="min-h-screen bg-cinema-bg text-cinema-text">

      {/* CENTERED COLUMN */}
      <div className="max-w-[900px] mx-auto px-8 py-10 flex flex-col gap-12">

        {/* TOP BAR */}
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="font-mono text-xs uppercase tracking-cinema text-cinema-muted hover:text-cinema-text transition"
          >
            ← Back
          </button>

          <p className="font-mono text-xs tracking-cinema text-cinema-muted uppercase">
            {mode === 'script'     && 'Screenplay Analysis'}
            {mode === 'outline'    && 'Outline Enhancement'}
            {mode === 'brainstorm' && 'Story Generation'}
          </p>
        </div>

        {/* TITLE */}
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-4xl text-cinema-text">
            Narrative Structure
          </h1>
          <p className="font-mono text-xs text-cinema-muted">
            Explore how your story unfolds across key narrative beats
          </p>
        </div>

        <div className="h-px bg-cinema-border" />

        {/* STORY ARC */}
        <div className="flex flex-col gap-4">
          <p className="font-mono text-xs uppercase tracking-cinema text-cinema-muted">
            Story Arc
          </p>

          <div className="grid grid-cols-4 gap-4">
            {(['ki', 'sho', 'ten', 'ketsu'] as const).map((a) => {
              const stage = beats[a]
              const isActive = act === a

              return (
                <div
                  key={a}
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
            })}
          </div>
        </div>

        {/* NARRATIVE CONCERNS */}
        {mode !== 'brainstorm' && concerns.length > 0 && (
          <>
            <div className="h-px bg-cinema-border" />

            <div className="flex flex-col gap-5">
              <p className="font-mono text-xs uppercase tracking-cinema text-cinema-muted">
                Narrative Concerns
              </p>

              <div className="flex flex-col gap-3">
                {concerns.map((c: any, i: number) => (
                  <div
                    key={i}
                    className="p-4 border border-cinema-border bg-cinema-surface"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-mono text-xs text-cinema-text uppercase tracking-cinema">
                        {c.type}
                      </span>

                      <span className={`font-mono text-xs uppercase tracking-cinema ${
                        c.severity === 'high'
                          ? 'text-cinema-danger'
                          : c.severity === 'medium'
                          ? 'text-cinema-accent'
                          : 'text-cinema-muted'
                      }`}>
                        {c.severity}
                      </span>
                    </div>

                    <p className="font-mono text-xs text-cinema-muted mt-2 leading-relaxed">
                      {c.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* CHARACTER GRAPH */}
        {hasGraph && mode === 'script' && (
          <>
            <div className="h-px bg-cinema-border" />

            <div className="flex flex-col gap-5">
              <p className="font-mono text-xs uppercase tracking-cinema text-cinema-muted">
                Character Network — {LABELS[act].title}{' '}
                <span className="text-cinema-muted/50">({LABELS[act].subtitle})</span>
              </p>

              <div className="border border-cinema-border bg-cinema-surface h-[420px]">
                {!analysis?.graphs_by_stage?.[act] ? (
                  <p className="font-mono text-xs text-cinema-muted p-4">
                    No interactions detected for this stage.
                  </p>
                ) : (
                  <CharacterGraph
                    data={analysis}
                    stage={act}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* AGENCY & REPRESENTATION */}
        {agencyByBeat && mode !== 'brainstorm' && (
          <>
            <div className="h-px bg-cinema-border" />
            <AgencyRepresentationChart agencyByBeat={agencyByBeat} />
          </>
        )}

        {/* THEMES & REAL-WORLD CONTEXT */}
        {mode !== 'brainstorm' && inputText && (
          <>
            <div className="h-px bg-cinema-border" />
            <TrendsSection inputText={inputText} />
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
                  }`}
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
                      <div
                        key={i}
                        className="p-4 border border-cinema-border bg-cinema-surface"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-serif text-sm text-cinema-text">
                            {w.title}
                          </span>
                          <span className="font-mono text-xs uppercase tracking-cinema text-cinema-muted">
                            {w.type}
                          </span>
                        </div>

                        <p className="font-mono text-xs text-cinema-accent mt-1">
                          {w.aspect}
                        </p>

                        <p className="font-mono text-xs text-cinema-muted mt-2 leading-relaxed">
                          {w.reason}
                        </p>
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
