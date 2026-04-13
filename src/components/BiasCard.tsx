import { useState } from "react"

export default function BiasCard({ title, item }: any) {
  const [open, setOpen] = useState(false)

  const levelMap = [
    "None",
    "Minimal",
    "Mild",
    "Moderate",
    "Strong",
    "Pervasive",
  ]

  // 🔥 safer parsing
  const isUnknown = item?.score === "insufficient_evidence"
  const scoreNum = isUnknown ? null : Number(item?.score)

  const level =
    isUnknown || isNaN(scoreNum!)
      ? "Unknown"
      : levelMap[scoreNum!]

  // 🎨 color by severity
  const colorMap = [
    "text-green-500",
    "text-green-400",
    "text-yellow-400",
    "text-orange-400",
    "text-red-400",
    "text-red-600",
  ]

  const levelColor =
    isUnknown || isNaN(scoreNum!)
      ? "text-gray-400"
      : colorMap[scoreNum!]

  return (
    <div className="p-4 border rounded-lg hover:shadow-sm transition">

      {/* header */}
      <div className="flex justify-between items-center">
        <span className="font-medium">{title}</span>

        <div className="flex items-center gap-2">
          <span className={`text-sm ${levelColor}`}>
            {level}
          </span>

          {/* 🔥 confidence */}
          {item?.confidence !== undefined && (
            <span className="text-xs text-gray-400">
              {Math.round(item.confidence * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* preview */}
      <p className="text-sm text-gray-600 mt-2">
        {item?.evidence?.[0] || "No strong signal detected"}
      </p>

      {/* toggle */}
      {item?.evidence?.length > 1 && (
        <button
          onClick={() => setOpen(!open)}
          className="text-xs text-gray-400 mt-2 hover:text-gray-600"
        >
          {open ? "Hide details ↑" : "Show details ↓"}
        </button>
      )}

      {/* details */}
      {open && (
        <ul className="text-xs text-gray-500 mt-2 space-y-1">
          {item.evidence.map((e: string, i: number) => (
            <li key={i}>- {e}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
