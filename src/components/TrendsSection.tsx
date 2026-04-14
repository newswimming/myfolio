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
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Themes & Real-World Context</h2>
        <p className="text-sm text-gray-500">
          How your story connects to current real-world topics
        </p>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading trends...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && themes.length === 0 && (
        <p className="text-sm text-gray-400">No trends found.</p>
      )}

      <div className="grid gap-4">
        {themes.map((t, i) => (
          <article
            key={`${t.theme}-${i}`}
            className="p-4 border rounded-xl bg-white hover:shadow-sm transition"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-sm font-medium">{t.theme}</h3>
                <p className="text-sm text-gray-600 mt-2">{t.relevance_blurb}</p>
              </div>

              {t.published_date && (
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {t.published_date}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {t.source_type && (
                <span className="text-xs px-2 py-1 rounded-full border bg-gray-50 text-gray-500">
                  {t.source_type}
                </span>
              )}
              {t.source_title && (
                <span className="text-xs px-2 py-1 rounded-full border bg-gray-50 text-gray-500">
                  {t.source_title}
                </span>
              )}
            </div>

            {t.evidence_note && (
              <p className="text-xs text-gray-400 mt-3">{t.evidence_note}</p>
            )}

            {t.source_url && (
              <a
                href={t.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-500 mt-3 inline-block"
              >
                Open source
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}