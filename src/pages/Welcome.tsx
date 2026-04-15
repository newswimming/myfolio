import { useState, useEffect, useRef } from 'react'
import { analyzeStory } from '../services/storyApi'

type WelcomeProps = {
  onStart: (data: any, input: string, mode: string) => void
}

const SENTENCES = [
  "She didn't look back.",
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
  const [logVersion, setLogVersion] = useState(0)

  const [showShare, setShowShare] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const shareRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

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
        size: Math.random() * 5 + 12,
        opacity: Math.random() * 0.12 + 0.08,
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

  useEffect(() => {
    if (!loading) return

    setProgress(0)
    setStage('ANALYZING...')

    const steps = [
      { p: 20, s: 'READING INPUT...' },
      { p: 45, s: 'UNDERSTANDING STORY...' },
      { p: 70, s: 'STRUCTURING NARRATIVE...' },
      { p: 90, s: 'FINALIZING ANALYSIS...' }
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

  const handleDeleteLog = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    if (!window.confirm('Remove this project from history?')) return
    const logs = getLogs()
    logs.splice(index, 1)
    localStorage.setItem('story_logs', JSON.stringify(logs))
    setLogVersion(v => v + 1)
  }

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

  // Read logs reactively so deletes are reflected
  const logs = getLogs()
  void logVersion // consumed to trigger re-render

  return (
    <div className="relative h-screen flex items-center justify-center bg-cinema-bg overflow-hidden">

      {/* SHARE POPUP */}
      {showShare && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div
            ref={shareRef}
            className="bg-cinema-surface border border-cinema-border p-6 w-[360px] flex flex-col gap-4"
          >
            <p className="font-mono text-xs uppercase tracking-cinema text-cinema-muted">
              Share this page
            </p>

            <input
              value={shareLink}
              readOnly
              className="bg-cinema-bg border border-cinema-border px-3 py-2 text-xs font-mono text-cinema-text outline-none w-full"
            />

            <div className="flex justify-between mt-1">
              <button
                onClick={copyLink}
                className="text-xs font-mono uppercase tracking-cinema border border-cinema-accent text-cinema-accent px-4 py-1.5 hover:bg-cinema-accent/10 transition"
              >
                {copied ? 'COPIED' : 'COPY'}
              </button>

              <button
                onClick={() => setShowShare(false)}
                className="text-xs font-mono uppercase tracking-cinema text-cinema-muted hover:text-cinema-text transition"
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
          <div className="flex-1 bg-black/40" onClick={() => setShowPanel(false)} />

          <div
            ref={panelRef}
            className="w-[300px] bg-cinema-surface border-l border-cinema-border h-full p-6 flex flex-col"
          >
            <p className="text-xs font-mono uppercase tracking-cinema text-cinema-muted mb-6">
              My Projects
            </p>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
              {logs.length === 0 ? (
                <p className="text-xs font-mono text-cinema-muted">No history yet.</p>
              ) : (
                logs.map((log: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => handleLoadLog(log)}
                    className="p-3 border border-cinema-border hover:border-cinema-accent cursor-pointer transition group relative"
                  >
                    <p className="font-mono text-sm text-cinema-text pr-6">
                      {log.fileName || log.input.slice(0, 40) || 'Untitled'}
                    </p>
                    <p className="font-mono text-xs text-cinema-muted mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDeleteLog(e, i)}
                      className="absolute top-3 right-3 font-mono text-xs text-cinema-muted opacity-0 group-hover:opacity-100 hover:text-cinema-danger transition"
                      title="Remove from history"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-cinema-border">
              <button
                onClick={handleShare}
                className="w-full text-xs font-mono uppercase tracking-cinema text-cinema-muted hover:text-cinema-accent transition text-left"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BACKGROUND FLOATING TEXT */}
      <div className="absolute inset-0 pointer-events-none">
        {positions.map((p, i) => (
          <div
            key={i}
            className={`absolute font-mono ${
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
              opacity: p.opacity,
              color: '#F0EDE8'
            }}
          >
            {p.text}
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="z-10 flex flex-col items-center gap-6 px-6">

        <h1 className="font-serif text-5xl text-cinema-text tracking-wide">
          myfolio
        </h1>

        <p className="font-mono text-xs uppercase tracking-cinema text-cinema-muted text-center max-w-sm">
          Uncover narrative structure, character agency, and hidden connections
        </p>

        <div className="h-px w-24 bg-cinema-border mt-2" />

        {/* PRIMARY ACTIONS — all three buttons together */}
        <div className="flex gap-4 mt-2 flex-wrap justify-center">

          <label className="px-6 py-2.5 border border-cinema-accent text-cinema-accent font-mono text-xs uppercase tracking-cinema cursor-pointer hover:bg-cinema-accent/10 transition">
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
            className="px-6 py-2.5 border border-cinema-border text-cinema-muted font-mono text-xs uppercase tracking-cinema hover:border-cinema-accent hover:text-cinema-accent transition"
          >
            Start Writing
          </button>

          <button
            onClick={() => setShowPanel(true)}
            className="px-6 py-2.5 border border-cinema-border text-cinema-muted font-mono text-xs uppercase tracking-cinema hover:border-cinema-accent hover:text-cinema-accent transition"
          >
            My Projects
          </button>

        </div>

        {loading && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <p className="font-mono text-xs tracking-cinema text-cinema-accent animate-analyzing">
              {stage}
            </p>
            <div className="w-48 h-px bg-cinema-border">
              <div
                className="bg-cinema-accent h-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

      </div>

      {/* WRITE MODAL */}
      {showWriter && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-20">
          <div
            ref={modalRef}
            className="bg-cinema-surface border border-cinema-border p-6 w-[600px] flex flex-col gap-4"
          >
            <p className="font-mono text-xs uppercase tracking-cinema text-cinema-muted">
              Enter your story
            </p>

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
              className="w-full h-52 bg-cinema-bg border border-cinema-border p-3 font-mono text-sm text-cinema-text placeholder-cinema-muted outline-none resize-none focus:border-cinema-accent transition"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <button
              onClick={handleTextSubmit}
              disabled={loading}
              className={`py-2.5 font-mono text-xs uppercase tracking-cinema transition ${
                loading
                  ? 'border border-cinema-border text-cinema-muted cursor-not-allowed'
                  : 'border border-cinema-accent text-cinema-accent hover:bg-cinema-accent/10'
              }`}
            >
              {loading ? (
                <span className="animate-analyzing">{stage || 'ANALYZING...'}</span>
              ) : (
                'Analyze'
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
