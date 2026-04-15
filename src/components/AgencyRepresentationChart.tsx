import { useState, useMemo, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot
} from 'recharts'

const BEAT_KEYS = ['ki', 'sho', 'ten', 'ketsu'] as const
const BEAT_LABELS: Record<string, string> = {
  ki:    'KI',
  sho:   'SHO',
  ten:   'TEN',
  ketsu: 'KETSU'
}

// Desaturated filmic palette — no neons, no primaries
const CHAR_COLORS = [
  '#C4827A', // dusty rose
  '#7A9E8E', // sage
  '#7A8EA0', // slate blue
  '#C4A882', // warm tan
  '#9A8AB4', // dusty lavender
  '#B4A060', // ochre
  '#608490', // muted teal
  '#A0788C', // dusty mauve
]

interface BeatEntry {
  character: string
  agency_score: number
  agency_reason: string
  representation_score: number
  representation_reason: string
}

interface AgencyByBeat {
  ki: BeatEntry[]
  sho: BeatEntry[]
  ten: BeatEntry[]
  ketsu: BeatEntry[]
}

// ── Custom Tooltip ──────────────────────────────────────────────────────────

function CinemaTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload || !payload.length) return null

  const reasonKey = metric === 'agency' ? '__agency_reason' : '__rep_reason'

  return (
    <div style={{
      background: '#1A1917',
      border: '1px solid #2A2825',
      padding: '12px 16px',
      minWidth: 200,
      maxWidth: 280,
    }}>
      <p style={{
        fontFamily: '"IM Fell English", Georgia, serif',
        color: '#C8B89A',
        fontSize: 13,
        marginBottom: 10,
        marginTop: 0,
      }}>
        {label}
      </p>

      {payload.map((p: any) => {
        if (p.value === undefined || p.value === null) return null
        const reason = p.payload?.[p.dataKey + reasonKey]
        return (
          <div key={p.dataKey} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{
                fontFamily: '"DM Mono", ui-monospace, monospace',
                color: p.color,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                {p.dataKey}
              </span>
              <span style={{
                fontFamily: '"DM Mono", ui-monospace, monospace',
                color: '#F0EDE8',
                fontSize: 11,
              }}>
                {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
              </span>
            </div>
            {reason && reason !== 'Does not appear in this beat.' && (
              <p style={{
                fontFamily: '"DM Mono", ui-monospace, monospace',
                color: '#8A8480',
                fontSize: 10,
                marginTop: 3,
                marginBottom: 0,
                lineHeight: 1.4,
              }}>
                {reason}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Chart Section ────────────────────────────────────────────────────────────

function ChartSection({
  title,
  subtitle,
  yLabel,
  data,
  characters,
  colorMap,
  metric,
}: {
  title: string
  subtitle: string
  yLabel: string
  data: any[]
  characters: string[]
  colorMap: Record<string, string>
  metric: 'agency' | 'representation'
}) {
  return (
    <div style={{ width: '100%' }}>
      {/* Section header */}
      <div style={{ marginBottom: 16 }}>
        <p style={{
          fontFamily: '"IM Fell English", Georgia, serif',
          color: '#C8B89A',
          fontSize: 13,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          margin: 0,
        }}>
          {title}
        </p>
        <p style={{
          fontFamily: '"DM Mono", ui-monospace, monospace',
          color: '#8A8480',
          fontSize: 11,
          marginTop: 4,
          marginBottom: 0,
        }}>
          {subtitle}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="0"
            stroke="#2A2825"
            vertical={false}
          />
          <XAxis
            dataKey="beat"
            tick={{
              fontFamily: '"DM Mono", ui-monospace, monospace',
              fontSize: 11,
              fill: '#8A8480',
              letterSpacing: '0.1em',
            }}
            axisLine={{ stroke: '#2A2825' }}
            tickLine={false}
            label={{
              value: 'STORY BEAT',
              position: 'insideBottom',
              offset: -2,
              style: {
                fontFamily: '"DM Mono", ui-monospace, monospace',
                fontSize: 9,
                fill: '#8A8480',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }
            }}
          />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1.0]}
            tick={{
              fontFamily: '"DM Mono", ui-monospace, monospace',
              fontSize: 10,
              fill: '#8A8480',
            }}
            axisLine={{ stroke: '#2A2825' }}
            tickLine={false}
            label={{
              value: yLabel,
              angle: -90,
              position: 'insideLeft',
              offset: 12,
              style: {
                fontFamily: '"DM Mono", ui-monospace, monospace',
                fontSize: 9,
                fill: '#8A8480',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }
            }}
          />
          <Tooltip
            content={(props) => (
              <CinemaTooltip {...props} metric={metric} />
            )}
            cursor={{ stroke: '#2A2825', strokeWidth: 1 }}
          />
          {characters.map((char) => (
            <Line
              key={char}
              type="monotone"
              dataKey={char}
              stroke={colorMap[char]}
              strokeWidth={1.5}
              dot={(props: any) => {
                const { cx, cy, stroke } = props
                return (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill={stroke}
                    stroke="#0D0C0B"
                    strokeWidth={1}
                  />
                )
              }}
              activeDot={{ r: 4.5, fill: colorMap[char], stroke: '#0D0C0B', strokeWidth: 1.5 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

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

  // Assign colors deterministically
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {}
    allCharacters.forEach((char, i) => {
      map[char] = CHAR_COLORS[i % CHAR_COLORS.length]
    })
    return map
  }, [allCharacters])

  const visibleChars = allCharacters.filter(c => selectedChars.has(c))

  // Build agency chart data: one row per beat, one key per character
  const agencyData = useMemo(() => {
    return BEAT_KEYS.map(key => {
      const row: any = { beat: BEAT_LABELS[key] }
      ;(agencyByBeat[key] || []).forEach(e => {
        if (selectedChars.has(e.character)) {
          row[e.character] = e.agency_score
          row[e.character + '__agency_reason'] = e.agency_reason || ''
        }
      })
      return row
    })
  }, [agencyByBeat, selectedChars])

  // Build representation chart data
  const repData = useMemo(() => {
    return BEAT_KEYS.map(key => {
      const row: any = { beat: BEAT_LABELS[key] }
      ;(agencyByBeat[key] || []).forEach(e => {
        if (selectedChars.has(e.character)) {
          row[e.character] = e.representation_score
          row[e.character + '__rep_reason'] = e.representation_reason || ''
        }
      })
      return row
    })
  }, [agencyByBeat, selectedChars])

  const showFilter = allCharacters.length > 4

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Section label */}
      <p style={{
        fontFamily: '"DM Mono", ui-monospace, monospace',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        color: '#8A8480',
        margin: 0,
      }}>
        Agency &amp; Representation Across Story Beats
      </p>

      {/* SHARED LEGEND */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px' }}>
        {allCharacters.map(char => (
          <span
            key={char}
            style={{
              fontFamily: '"DM Mono", ui-monospace, monospace',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: colorMap[char],
              opacity: selectedChars.has(char) ? 1 : 0.3,
            }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* CHARACTER FILTER (>4 characters) */}
      {showFilter && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
          {allCharacters.map(char => {
            const checked = selectedChars.has(char)
            return (
              <label
                key={char}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {/* Custom checkbox */}
                <span
                  onClick={() => toggleChar(char)}
                  style={{
                    width: 12,
                    height: 12,
                    border: `1px solid ${checked ? colorMap[char] : '#2A2825'}`,
                    background: checked ? colorMap[char] : 'transparent',
                    display: 'inline-block',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                />
                <span
                  onClick={() => toggleChar(char)}
                  style={{
                    fontFamily: '"DM Mono", ui-monospace, monospace',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: checked ? colorMap[char] : '#8A8480',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}
                >
                  {char}
                </span>
              </label>
            )
          })}
        </div>
      )}

      {/* GRAPH 1 — AGENCY */}
      <ChartSection
        title="Agency"
        subtitle="Decision-making power across the narrative arc"
        yLabel="AGENCY SCORE"
        data={agencyData}
        characters={visibleChars}
        colorMap={colorMap}
        metric="agency"
      />

      {/* DIVIDER */}
      <div style={{ height: 1, background: '#2A2825', width: '100%' }} />

      {/* GRAPH 2 — REPRESENTATION */}
      <ChartSection
        title="Representation"
        subtitle="Narrative attention across the story arc"
        yLabel="REPRESENTATION SCORE"
        data={repData}
        characters={visibleChars}
        colorMap={colorMap}
        metric="representation"
      />

    </div>
  )
}
