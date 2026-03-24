import { useEffect } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useStore } from '../store'
import type { ActKey, BiasSubdimension } from '../types'

const ACT_KEYS: ActKey[] = ['ki', 'sho', 'ten', 'ketsu']

const ACT_LABELS: Record<ActKey, { title: string; subtitle: string }> = {
  ki:    { title: 'Ki',    subtitle: 'Establish' },
  sho:   { title: 'Sho',  subtitle: 'Develop' },
  ten:   { title: 'Ten',  subtitle: 'Twist' },
  ketsu: { title: 'Ketsu', subtitle: 'Resolve' },
}

const SUBDIMENSION_LABELS: Record<string, string> = {
  agency_gap: 'Agency Gap',
  gaze_objectification: 'Gaze & Objectification',
  affection_asymmetry: 'Affection Asymmetry',
  linguistic_stereotyping: 'Linguistic Stereotyping',
  dialogue_power_imbalance: 'Dialogue Power Imbalance',
}

function scoreColorClass(score: number): string {
  if (score <= 1) return 'text-emerald-400 bg-emerald-950/50 border-emerald-800'
  if (score <= 3) return 'text-amber-400 bg-amber-950/50 border-amber-800'
  return 'text-red-400 bg-red-950/50 border-red-800'
}

function normalizeOverallBias(score: number): number {
  return score > 5 ? score / 20 : score
}

interface SubdimCardProps {
  name: string
  dim: BiasSubdimension
}

function SubdimCard({ name, dim }: SubdimCardProps) {
  const colorClass = scoreColorClass(dim.score)
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
          {SUBDIMENSION_LABELS[name] ?? name}
        </p>
        <span className={`text-xs font-bold rounded-full px-2 py-0.5 border ${colorClass}`}>
          {dim.score.toFixed(1)}
        </span>
      </div>
      {dim.evidence.length > 0 && (
        <ul className="flex flex-col gap-1">
          {dim.evidence.map((e, i) => (
            <li key={i} className="text-xs text-gray-500 leading-relaxed">
              &ldquo;{e}&rdquo;
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface Props {
  onBack: () => void
}

export default function StoryDashboard({ onBack }: Props) {
  const beats = useStore((s) => s.beats)
  const themes = useStore((s) => s.themes)
  const biasResult = useStore((s) => s.biasResult)
  const isAnalyzing = useStore((s) => s.isAnalyzing)
  const analysisError = useStore((s) => s.analysisError)
  const analyzeArc = useStore((s) => s.analyzeArc)

  useEffect(() => {
    if (themes.length === 0 && !isAnalyzing) {
      analyzeArc()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const normalizedOverall = biasResult
    ? normalizeOverallBias(biasResult.overall_bias_score)
    : null

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="self-start flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={15} />
        Back to Arc
      </button>

      {/* Error banner */}
      {analysisError && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-4 py-2">
          {analysisError}
        </p>
      )}

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Left — arc beats stacked */}
        <div className="flex flex-col gap-4 lg:w-1/2 w-full">
          {ACT_KEYS.map((act) => {
            const beat = beats[act]
            const { title, subtitle } = ACT_LABELS[act]

            return (
              <div
                key={act}
                className="rounded-2xl border border-gray-700 bg-gray-900 p-5 flex flex-col gap-2"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                    {subtitle}
                  </p>
                  <h2 className="text-lg font-bold text-white leading-none mt-0.5">
                    {title}
                  </h2>
                </div>
                <p className={['text-sm leading-relaxed', !beat.text ? 'italic text-gray-600' : 'text-gray-200'].join(' ')}>
                  {beat.text || 'Not yet generated.'}
                </p>
              </div>
            )
          })}
        </div>

        {/* Right — analysis panels stacked */}
        <div className="flex flex-col gap-4 lg:w-1/2 w-full">

          {/* Themes & real world context */}
          <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 flex flex-col gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
              Themes &amp; Real World Context
            </h3>

            {isAnalyzing ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                Analyzing…
              </div>
            ) : themes.length === 0 ? (
              <p className="text-sm text-gray-600 italic">No themes found.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {themes.map((t, i) => (
                  <div key={i} className="rounded-xl border border-gray-800 bg-gray-950 p-4 flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-gray-100">{t.theme}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{t.relevance_blurb}</p>
                    {t.evidence_note && (
                      <p className="text-xs text-gray-600 italic leading-relaxed">{t.evidence_note}</p>
                    )}
                    {t.source_url ? (
                      <a
                        href={t.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 truncate"
                      >
                        {t.source_title || t.source_url}
                      </a>
                    ) : t.source_title ? (
                      <p className="text-xs text-gray-500">{t.source_title}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bias dashboard */}
          <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 flex flex-col gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
              Bias Dashboard
            </h3>

            {isAnalyzing ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                Analyzing…
              </div>
            ) : !biasResult ? (
              <p className="text-sm text-gray-600 italic">No bias data found.</p>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Overall score */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Overall</span>
                  <span className={`text-sm font-bold rounded-full px-3 py-0.5 border ${scoreColorClass(normalizedOverall!)}`}>
                    {normalizedOverall!.toFixed(2)} / 5
                  </span>
                </div>

                {/* Bias 1 — Gendered Action */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    Gendered Action
                  </p>
                  <div className="flex flex-col gap-2">
                    {Object.entries(biasResult.bias_1).map(([key, dim]) => (
                      <SubdimCard key={key} name={key} dim={dim} />
                    ))}
                  </div>
                </div>

                {/* Bias 2 — Linguistic */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    Linguistic
                  </p>
                  <div className="flex flex-col gap-2">
                    {Object.entries(biasResult.bias_2).map(([key, dim]) => (
                      <SubdimCard key={key} name={key} dim={dim} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
