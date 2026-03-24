import { ArrowLeft } from 'lucide-react'
import { useStore } from '../store'
import type { ActKey } from '../types'

const ACT_KEYS: ActKey[] = ['ki', 'sho', 'ten', 'ketsu']

const ACT_LABELS: Record<ActKey, { title: string; subtitle: string }> = {
  ki:    { title: 'Ki',    subtitle: 'Establish' },
  sho:   { title: 'Sho',  subtitle: 'Develop' },
  ten:   { title: 'Ten',  subtitle: 'Twist' },
  ketsu: { title: 'Ketsu', subtitle: 'Resolve' },
}

interface Props {
  onBack: () => void
}

export default function StoryDashboard({ onBack }: Props) {
  const beats = useStore((s) => s.beats)

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
            <p className="text-sm text-gray-600 italic">
              Analysis will appear here once connected to the backend.
            </p>
          </div>

          {/* Bias dashboard */}
          <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 flex flex-col gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
              Bias Dashboard
            </h3>
            <p className="text-sm text-gray-600 italic">
              Bias analysis will appear here once connected to the backend.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
