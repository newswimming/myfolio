import { useEffect, useState } from 'react'
import { fetchTrends } from '../services/trendsApi'
import type { ThemeResult } from '../types'

type TrendsSectionProps = {
  inputText: string
}

export default function TrendsSection({ inputText }: TrendsSectionProps) {
  const [themes, setThemes] = useState<ThemeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!inputText.trim()) {
      setThemes([])
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchTrends(inputText, 30)
        if (!cancelled) {
          setThemes(data.themes || [])
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load trends.')
          setThemes([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [inputText])

  return (
    <div className="flex flex-col gap-5">

      <div className="flex flex-col gap-1">
        <p className="font-mono text-xs uppercase tracking-cinema text-cinema-muted">
          Themes & Real-World Context
        </p>
        <p className="font-mono text-xs text-cinema-muted">
          How your story connects to current real-world topics
        </p>
      </div>

      {loading && (
        <p className="font-mono text-xs tracking-cinema text-cinema-accent animate-analyzing">
          LOADING TRENDS...
        </p>
      )}

      {error && (
        <p className="font-mono text-xs text-cinema-danger">{error}</p>
      )}

      {!loading && !error && themes.length === 0 && (
        <p className="font-mono text-xs text-cinema-muted">No trends found.</p>
      )}

      <div className="flex flex-col gap-3">
        {themes.map((t, i) => (
          <article
            key={`${t.theme}-${i}`}
            className="p-4 border border-cinema-border bg-cinema-surface"
          >
            <div className="flex justify-between items-start gap-4">
              <h3 className="font-serif text-sm text-cinema-text">
                {t.theme}
              </h3>

              {t.published_date && (
                <span className="font-mono text-xs text-cinema-muted whitespace-nowrap">
                  {t.published_date}
                </span>
              )}
            </div>

            <p className="font-mono text-xs text-cinema-muted mt-2 leading-relaxed">
              {t.relevance_blurb}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              {t.source_type && (
                <span className="font-mono text-xs border border-cinema-border text-cinema-muted px-2 py-0.5 uppercase tracking-cinema">
                  {t.source_type}
                </span>
              )}
              {t.source_title && (
                <span className="font-mono text-xs border border-cinema-border text-cinema-muted px-2 py-0.5">
                  {t.source_title}
                </span>
              )}
            </div>

            {t.evidence_note && (
              <p className="font-mono text-xs text-cinema-muted/60 mt-3 leading-relaxed">
                {t.evidence_note}
              </p>
            )}

            {t.source_url && (
              <a
                href={t.source_url}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-cinema-accent mt-3 inline-block hover:opacity-70 transition"
              >
                Open source →
              </a>
            )}
          </article>
        ))}
      </div>

    </div>
  )
}
