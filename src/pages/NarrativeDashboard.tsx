import { useState, useEffect } from 'react'
import CharacterGraph from '../components/CharacterGraph'
import { analyzeStory } from '../services/storyApi'
import BiasRadar from '../components/BiasRadar'
import BiasCard from '../components/BiasCard'

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

  // ---------- DATA ----------
  const beats = analysis?.beats || {
    ki: { summary: '', comment: '' },
    sho: { summary: '', comment: '' },
    ten: { summary: '', comment: '' },
    ketsu: { summary: '', comment: '' }
  }

  const concerns = analysis?.concerns || []

  // 🔥 FIX: use new schema
  const hasGraph = !!analysis?.graphs_by_stage

  const LABELS: any = {
    ki: { title: 'Ki', subtitle: 'Setup' },
    sho: { title: 'Sho', subtitle: 'Development' },
    ten: { title: 'Ten', subtitle: 'Turning Point' },
    ketsu: { title: 'Ketsu', subtitle: 'Resolution' }
  }

  const bias = analysis?.bias

  return (
    <div className="min-h-screen bg-white px-8 py-6 flex flex-col gap-8">

      {/* ---------- TOP BAR ---------- */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-black transition"
        >
          ← Back
        </button>

        <p className="text-xs text-gray-400 tracking-wide">
          {mode === 'script' && 'SCREENPLAY ANALYSIS'}
          {mode === 'outline' && 'OUTLINE ENHANCEMENT'}
          {mode === 'brainstorm' && 'STORY GENERATION'}
        </p>
      </div>

      {/* ---------- TITLE ---------- */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Narrative Structure
        </h1>
        <p className="text-sm text-gray-500">
          Explore how your story unfolds across key narrative beats
        </p>
      </div>

      {/* ---------- STORY ARC ---------- */}
      <div className="grid grid-cols-4 gap-5">
        {(['ki', 'sho', 'ten', 'ketsu'] as const).map((a) => {
          const stage = beats[a]

          return (
            <div
              key={a}
              onClick={() => setAct(a)}
              className={`p-5 rounded-xl cursor-pointer transition-all duration-300
                ${act === a
                  ? 'bg-black text-white shadow-lg scale-[1.02]'
                  : 'bg-gray-50 hover:bg-gray-100 text-black'}
              `}
            >
              <h2 className="text-lg font-semibold">
                {LABELS[a].title}
              </h2>

              <p className="text-xs uppercase tracking-widest opacity-60">
                {LABELS[a].subtitle}
              </p>

              <p className={`mt-3 text-[14px] leading-relaxed ${
                act === a ? 'text-gray-200' : 'text-gray-600'
              }`}>
                {stage?.summary || 'Generating narrative...'}
              </p>

              {stage?.comment && (
                <p className="mt-2 text-xs italic opacity-70">
                  {stage.comment}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* ---------- CONCERNS ---------- */}
      {mode !== 'brainstorm' && concerns.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Narrative Concerns</h2>

          <div className="grid gap-3">
            {concerns.map((c: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-lg border bg-white hover:shadow-sm transition"
              >
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">
                    {c.type}
                  </span>

                  <span className={`text-xs ${
                    c.severity === 'high'
                      ? 'text-red-500'
                      : c.severity === 'medium'
                      ? 'text-yellow-500'
                      : 'text-gray-400'
                  }`}>
                    {c.severity}
                  </span>
                </div>

                <p className="text-sm text-gray-600">
                  {c.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- CHARACTER GRAPH (UPDATED) ---------- */}
      {hasGraph && mode == 'script' && (
        <div className="flex flex-col gap-4">

          <h2 className="text-lg font-semibold">
            Character Network — {LABELS[act].title}
            <span className="text-xs text-gray-400 ml-2">
              ({LABELS[act].subtitle})
            </span>
          </h2>

          <div className="bg-white rounded-xl border p-4 shadow-sm h-[420px]">

            {!analysis?.graphs_by_stage?.[act] ? (
              <p className="text-sm text-gray-400">
                No interactions detected for this stage
              </p>
            ) : (
              <CharacterGraph
                data={analysis}
                stage={act}
              />
            )}

          </div>
        </div>
      )}

      {/* ---------- BIAS DASHBOARD ---------- */}
      {mode === 'outline' && bias && (
        <div className="flex flex-col gap-6">

          <div>
            <h2 className="text-lg font-semibold">
              Bias & Narrative Framing
            </h2>

            <p className="text-sm text-gray-500">
              How power, agency, and perspective are distributed
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 items-start">

            <div className="bg-white border rounded-xl p-6 shadow-sm flex justify-center">
              <BiasRadar bias={bias} size={500} />
            </div>

            <div className="flex flex-col gap-4 w-full">
              <BiasCard title="Agency Gap" item={bias.agency_gap} />
              <BiasCard title="Gaze Objectification" item={bias.gaze_objectification} />
              <BiasCard title="Affection Asymmetry" item={bias.affection_asymmetry} />
              <BiasCard title="Linguistic Stereotyping" item={bias.linguistic_stereotyping} />
              <BiasCard title="Dialogue Power" item={bias.dialogue_power_imbalance} />
            </div>

          </div>
        </div>
      )}

      {/* ---------- BRAINSTORM (UPDATED ONLY WHERE NEEDED) ---------- */}
      {mode === 'brainstorm' && (
        <div className="flex flex-col gap-6">

          <div className="flex flex-col items-start gap-2">
            <button
              onClick={shuffle}
              disabled={generating}
              className={`px-5 py-2 rounded-full flex items-center gap-2
                ${generating
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                 : 'bg-black text-white hover:bg-gray-800'}
              `}
            >
              {generating && (
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}

              {generating ? 'Generating...' : 'Generate Another Version'}
            </button>

            <p className="text-xs text-gray-400">
              Explore alternate narrative directions
            </p>
          </div>

          {/* 🔥 NEW: works-based inspiration */}
          {!analysis?.inspiration?.works ? (
            <p className="text-sm text-gray-400 italic">
              Generating inspiration...
            </p>
          ) : (
            <div className="flex flex-col gap-4">

              <div>
                <h2 className="text-lg font-semibold">
                  Inspiration & Similar Works
                </h2>
              </div>

              <div className="grid gap-4">
                {analysis.inspiration.works.map((w: any, i: number) => (
                  <div
                    key={i}
                    className="p-4 border rounded-xl bg-white hover:shadow-sm transition"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">
                        {w.title}
                      </span>
                      <span className="text-xs text-gray-400 uppercase">
                        {w.type}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 mb-1">
                      {w.aspect}
                    </div>

                    <p className="text-xs text-gray-600">
                      {w.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
