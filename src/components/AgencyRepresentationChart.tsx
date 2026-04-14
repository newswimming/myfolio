import { useState, useMemo, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const BEAT_KEYS = ['ki', 'sho', 'ten', 'ketsu'] as const
const BEAT_LABELS: Record<string, string> = {
  ki: 'Ki',
  sho: 'Sho',
  ten: 'Ten',
  ketsu: 'Ketsu'
}

interface BeatEntry {
  character: string
  agency_score: number
  representation_score: number
}

interface AgencyByBeat {
  ki: BeatEntry[]
  sho: BeatEntry[]
  ten: BeatEntry[]
  ketsu: BeatEntry[]
}

export default function AgencyRepresentationChart({ agencyByBeat }: { agencyByBeat: AgencyByBeat }) {
  if (!agencyByBeat) return null

  const allCharacters = useMemo(() => {
    const chars = new Set<string>()
    BEAT_KEYS.forEach(key => {
      ;(agencyByBeat[key] || []).forEach(e => {
        if (e.character) chars.add(e.character)
      })
    })
    return Array.from(chars).sort()
  }, [agencyByBeat])

  const [selectedChars, setSelectedChars] = useState<Set<string>>(new Set(allCharacters))

  useEffect(() => {
    setSelectedChars(new Set(allCharacters))
  }, [allCharacters.join(',')])

  const chartData = useMemo(() => {
    return BEAT_KEYS.map(key => {
      const beatEntries = (agencyByBeat[key] || []).filter(e => selectedChars.has(e.character))
      const n = beatEntries.length

      const avgAgency =
        n > 0
          ? beatEntries.reduce((sum, e) => sum + (e.agency_score ?? 0), 0) / n
          : 0

      const avgRep =
        n > 0
          ? beatEntries.reduce((sum, e) => sum + (e.representation_score ?? 0), 0) / n
          : 0

      return {
        beat: BEAT_LABELS[key],
        Agency: parseFloat(avgAgency.toFixed(2)),
        Representation: parseFloat(avgRep.toFixed(2))
      }
    })
  }, [agencyByBeat, selectedChars])

  const showFilter = allCharacters.length > 3

  const toggleChar = (char: string) => {
    setSelectedChars(prev => {
      const next = new Set(prev)
      if (next.has(char)) {
        if (next.size > 1) next.delete(char)
      } else {
        next.add(char)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Agency & Representation by Story Beat</h2>
        <p className="text-sm text-gray-500">
          How characters drive the story and how present they are across each beat
        </p>
      </div>

      {showFilter && (
        <div className="flex flex-wrap gap-3">
          {allCharacters.map(char => (
            <label
              key={char}
              className="flex items-center gap-1.5 text-sm cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={selectedChars.has(char)}
                onChange={() => toggleChar(char)}
                className="rounded accent-black"
              />
              {char}
            </label>
          ))}
        </div>
      )}

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="beat" tick={{ fontSize: 13 }} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} tickCount={6} />
            <Tooltip formatter={(val: number) => val.toFixed(2)} />
            <Legend />
            <Bar dataKey="Agency" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Representation" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {showFilter && selectedChars.size < allCharacters.length && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            Scores averaged across {selectedChars.size} selected character
            {selectedChars.size !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
