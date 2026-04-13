import { useState, useEffect, useRef } from 'react'
import { analyzeStory } from '../services/storyApi'

type WelcomeProps = {
  onStart: (data: any, input: string, mode: string) => void
}

const SENTENCES = [
  "She didn’t look back.",
  "INT. ROOM — NIGHT",
  "Something felt wrong.",
  "CUT TO:",
  "He knew this would change everything.",
  "The silence said everything.",
  "A decision had already been made.",
  "No one was supposed to see this.",
  "FADE IN:",
  "They were already too late.",
  "The city kept moving, unaware that something irreversible had begun.",
  "He thought he was in control, until every choice led him somewhere else."
]

export default function Welcome({ onStart }: WelcomeProps) {

  const [positions, setPositions] = useState<any[]>([])
  const [showWriter, setShowWriter] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('')
  const [showPanel, setShowPanel] = useState(false)

  // ✅ share popup
  const [showShare, setShowShare] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const shareRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  // 🎬 Background
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const generated: any[] = []

    const isValid = (x: number, y: number) => {
      const center = x > 30 && x < 70 && y > 30 && y < 70
      const topRight = x > 75 && y < 20
      return !center && !topRight
    }

    SENTENCES.forEach(s => {
      let x, y, tries = 0
      do {
        x = Math.random() * 100
        y = Math.random() * 100
        tries++
      } while (!isValid(x, y) && tries < 50)

      generated.push({
        text: s,
        x,
        y,
        size: Math.random() * 6 + 14,
        opacity: Math.random() * 0.25 + 0.25,
        type:
          Math.random() > 0.75
            ? 'typing'
            : Math.random() > 0.5
              ? 'float'
              : 'fade'
      })
    })

    setPositions(generated)
  }, [])

  // close modal / panel / share
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowWriter(false)
      }
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false)
      }
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShare(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // loading animation
  useEffect(() => {
    if (!loading) return

    setProgress(0)
    setStage('Analyzing...')

    const steps = [
      { p: 20, s: 'Reading input...' },
      { p: 45, s: 'Understanding story...' },
      { p: 70, s: 'Structuring narrative...' },
      { p: 90, s: 'Finalizing Analysis...' }
    ]

    let i = 0
    const interval = setInterval(() => {
      setProgress(steps[i].p)
      setStage(steps[i].s)
      i++
      if (i >= steps.length) clearInterval(interval)
    }, 600)

    return () => clearInterval(interval)
  }, [loading])

  const getLogs = () =>
    JSON.parse(localStorage.getItem('story_logs') || '[]')

  const handleLoadLog = (log: any) => {
    setShowPanel(false)
    onStart(log.result, log.input, log.result.mode)
  }

  // ✅ share popup logic
  const handleShare = () => {
    const url = window.location.href
    setShareLink(url)
    setShowShare(true)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const handleFileUpload = async (file: File) => {
    if (loading) return
    setLoading(true)

    const result = await analyzeStory({ file })

    setProgress(100)
    setTimeout(() => {
      onStart(result, '', result.mode)
      setLoading(false)
    }, 400)
  }

  const handleTextSubmit = async () => {
    if (!text.trim()) return
    setLoading(true)

    const result = await analyzeStory({ text })

    setProgress(100)
    setTimeout(() => {
      onStart(result, text, result.mode)
      setLoading(false)
    }, 400)
  }

  return (
    <div className="relative h-screen flex items-center justify-center bg-white overflow-hidden">

      {/* MENU */}
      <div className="absolute top-6 right-6 z-20">
        <button onClick={() => setShowPanel(!showPanel)} className="text-2xl">
          …
        </button>
      </div>

      {/* SHARE POPUP */}
      {showShare && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div ref={shareRef} className="bg-white p-5 rounded-xl w-[360px] shadow-xl flex flex-col gap-3">

            <h3 className="text-sm font-semibold">Share this page</h3>

            <input
              value={shareLink}
              readOnly
              className="border rounded px-2 py-2 text-xs"
            />

            <div className="flex justify-between mt-2">
              <button
                onClick={copyLink}
                className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>

              <button
                onClick={() => setShowShare(false)}
                className="text-sm px-3 py-1 text-gray-500 hover:text-black"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* HISTORY PANEL */}
      {showPanel && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="flex-1 bg-black/20" onClick={() => setShowPanel(false)} />

          <div ref={panelRef} className="w-[320px] bg-white h-full p-5 shadow-xl flex flex-col">

            <h2 className="text-lg font-semibold mb-4">History</h2>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
              {getLogs().length === 0 ? (
                <p className="text-sm text-gray-400">No history yet</p>
              ) : (
                getLogs().map((log: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => handleLoadLog(log)}
                    className="p-3 border rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <p className="text-sm font-medium">
                      {log.fileName || log.input.slice(0, 40)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 border-t pt-3">
              <button
                onClick={handleShare}
                className="w-full text-sm text-gray-500 hover:text-black"
              >
                Share ⤴︎
              </button>
            </div>

          </div>
        </div>
      )}

      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        {positions.map((p, i) => (
          <div
            key={i}
            className={`absolute ${
              p.type === 'typing'
                ? 'animate-typing'
                : p.type === 'float'
                  ? 'animate-drift'
                  : 'animate-fade'
            }`}
            style={{
              top: `${p.y}%`,
              left: `${p.x}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: `${p.size}px`,
              opacity: p.opacity
            }}
          >
            {p.text}
          </div>
        ))}
      </div>

      {/* MAIN */}
      <div className="z-10 flex flex-col items-center gap-5">

        <h1 className="text-4xl font-bold">myfolio</h1>

        {/* ✅ aesthetic product line */}
        <p className="text-sm text-gray-500 text-center max-w-md">
          Bring your story to life - uncover its structure, characters, and hidden connections.
        </p>

        <div className="flex gap-4 mt-2">

          <label className="px-6 py-3 bg-black text-white rounded-xl cursor-pointer">
            Upload File
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
            />
          </label>

          <button
            onClick={() => setShowWriter(true)}
            className="px-6 py-3 border rounded-xl"
          >
            Start Writing
          </button>

        </div>

        {loading && (
          <div className="mt-4">
            <p>{stage}</p>
            <div className="w-48 h-1 bg-gray-200">
              <div className="bg-black h-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

      </div>

      {/* MODAL */}
      {showWriter && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-20">
          <div ref={modalRef} className="bg-white p-6 rounded-xl w-[600px]">

            <textarea
              placeholder={`Start with a scene, an outline, or just an idea...

Example:

INT. ROOM — NIGHT
A woman sits alone. She hears footsteps.

—or—

A man tries to reconnect with his estranged daughter.

—or—

• Opening: lonely protagonist
• Middle: conflict escalates
• Twist: betrayal`}
              className="w-full h-48 border p-3"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            {/* ✅ FIXED BUTTON */}
            <button
              onClick={handleTextSubmit}
              disabled={loading}
              className={`mt-3 w-full py-2 rounded ${
                loading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {loading ? 'Processing...' : 'Analyze'}
            </button>

          </div>
        </div>
      )}
    </div>
  )
}