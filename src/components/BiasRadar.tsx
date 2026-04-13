import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, } from "recharts"

export default function BiasRadar({ bias, size = 320 }: any) {

  if (!bias) return null

  const getValue = (v: any) => {
    if (v === "insufficient_evidence") return null
    const num = Number(v)
    return isNaN(num) ? null : num
  }

  const rawData = [
    { subject: "Agency", value: getValue(bias.agency_gap?.score) },
    { subject: "Gaze", value: getValue(bias.gaze_objectification?.score) },
    { subject: "Emotion", value: getValue(bias.affection_asymmetry?.score) },
    { subject: "Language", value: getValue(bias.linguistic_stereotyping?.score) },
    { subject: "Dialogue", value: getValue(bias.dialogue_power_imbalance?.score) },
  ]

  const data = rawData.map(d => ({
    ...d,
    value: d.value ?? 0
  }))

  return (
    <div className="flex flex-col items-center w-full">

      <RadarChart width={size} height={size + 60} data={data}>
        <PolarGrid stroke="#e5e7eb" />

        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 12, fill: "#6b7280" }}
        />

        <PolarRadiusAxis
          domain={[0, 5]}
          tick={{ fontSize: 10 }}
        />

        <Tooltip />

        <Radar
          dataKey="value"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.3}
        />
      </RadarChart>

      <p className="text-xs text-gray-400 mt-2">
        Values reflect detected bias intensity (0–5). Missing signals shown as 0.
      </p>
    </div>
  )
}