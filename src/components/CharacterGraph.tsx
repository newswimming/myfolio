import { useRef, useState, useEffect } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

type CharacterNode = {
  id: string
  bio?: string
  description?: string
  importance?: number
}

export default function CharacterGraph({ data, stage }: any) {

  const fgRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [selectedChar, setSelectedChar] = useState<CharacterNode | null>(null)
  const [size, setSize] = useState({ w: 700, h: 420 })

  // ---------- AUTO RESIZE ----------
  useEffect(() => {
    if (!containerRef.current) return

    const resize = () => {
      const rect = containerRef.current!.getBoundingClientRect()
      setSize({ w: rect.width, h: 420 })
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // ---------- GET DATA ----------
  const stageData = data?.graphs_by_stage?.[stage] || {}
  const stageLinks = stageData.relationships || []
  const stageInteractions = stageData.interactions || []

  // ---------- BUILD NODE MAP ----------
  const nodeMap = new Map()

  ;(data?.characters || []).forEach((c: any) => {
    if (!c?.name) return
    nodeMap.set(c.name, {
      id: c.name,
      bio: c.bio,
      description: c.description,
      importance: c.importance || 0.5
    })
  })

  // ensure nodes from links exist
  const ensureNode = (name: string) => {
    if (!name) return
    if (!nodeMap.has(name)) {
      nodeMap.set(name, { id: name, importance: 0.3 })
    }
  }

  stageLinks.forEach((l: any) => {
    ensureNode(l.source)
    ensureNode(l.target)
  })

  stageInteractions.forEach((i: any) => {
    ensureNode(i.source)
    ensureNode(i.target)
  })

  // ---------- FILTER ----------
  let nodes = Array.from(nodeMap.values()).filter(
    (n: any) => n.id && n.id !== 'undefined'
  )

  // ---------- MAIN CHARACTER ----------
  const mainChar =
    nodes.length > 0
      ? nodes.reduce((a: any, b: any) =>
          (a.importance || 0) > (b.importance || 0) ? a : b
        )
      : null

  // ---------- NORMALIZE TYPE ----------
  const normalizeType = (t: string) => {
    if (!t) return 'co_presence'
    const lower = t.toLowerCase()

    if (lower.includes('ally')) return 'alliance'
    if (lower.includes('conflict') || lower.includes('enemy')) return 'conflict'
    if (lower.includes('authority')) return 'authority'
    if (lower.includes('depend')) return 'dependency'
    if (lower.includes('love') || lower.includes('emotion')) return 'emotional'
    if (lower.includes('observe')) return 'observation'
    if (lower.includes('talk') || lower.includes('report')) return 'communication'

    return 'co_presence'
  }

  // ---------- BUILD LINKS ----------
  const links = [
    ...stageLinks
      .filter((l: any) => l.source && l.target)
      .map((l: any) => ({
        source: l.source,
        target: l.target,
        type: normalizeType(l.type),
        dynamic: l.dynamic,
        strength: l.strength || 'weak',
        isInteraction: false
      })),

    ...stageInteractions
      .filter((i: any) => i.source && i.target)
      .map((i: any) => ({
        source: i.source,
        target: i.target,
        type: 'communication',
        dynamic: i.dynamic,
        strength: 'weak',
        isInteraction: true
      }))
  ]

  const graphData = { nodes, links }

  // ---------- REHEAT ----------
  useEffect(() => {
    fgRef.current?.d3ReheatSimulation()
    setTimeout(() => fgRef.current?.zoomToFit(400), 200)
  }, [stage, data])

  // ---------- COLOR SYSTEM ----------
  const TYPE_COLORS: Record<string, string> = {    
    alliance: "#22c55e",
    conflict: "#ef4444",
    authority: "#3b82f6",
    dependency: "#f59e0b",
    emotional: "#ec4899",
    observation: "#6b7280",
    communication: "#06b6d4",
    co_presence: "#a78bfa"
  }

  const getColor = (link: any) => {
    const base = TYPE_COLORS[link.type] || "#9ca3af"
    const alpha = link.strength === 'strong' ? 0.9 : 0.4
    return base.replace('rgb', 'rgba').replace(')', `, ${alpha})`)
  }

  return (
    <div ref={containerRef} className="relative w-full h-[420px]">

      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={size.w}
        height={size.h}
        nodeId="id"

        nodeVal={(node: any) => (node.importance || 0.5) * 8}

        // ---------- LINKS ----------
        linkColor={(l: any) => TYPE_COLORS[l.type] || "#9ca3af"}

        linkLineDash={() => null}

        linkWidth={(l: any) => {
  // 🔥 strongest signal first
          if (l.strength === 'strong') return 2.5

  // medium importance (core relationships)
          if (
            ['alliance','conflict','authority','dependency','emotional']
            .includes(l.type)
          ) return 1.5

  // weakest (background presence)
          if (l.type === 'co_presence') return 0.5

  // default
          return 1
        }}


        linkLabel={(l: any) =>
          `${l.type} · ${(l.dynamic || '').split(' ').slice(0,2).join(' ')}`
        }

        // ---------- NODE DRAW ----------
        nodeCanvasObject={(node: any, ctx, scale) => {
          const fontSize = 10 / scale
          ctx.font = `${fontSize}px Inter`
          ctx.textAlign = 'center'

          const isMain = mainChar && node.id === mainChar.id

          ctx.fillStyle = isMain ? '#111' : '#6b7280'
          ctx.fillText(node.id, node.x, node.y + 8)
        }}

        onNodeClick={(node: any) => {
          setSelectedChar(prev =>
            prev?.id === node.id ? null : node
          )
        }}

        onBackgroundClick={() => setSelectedChar(null)}

        cooldownTicks={100}
      />

      {/* ---------- BIO PANEL ---------- */}
      {selectedChar && (
        <div className="absolute top-4 right-4 w-[260px] bg-white border rounded-xl p-4 shadow-lg">
          <div className="font-semibold mb-1">{selectedChar.id}</div>

          {selectedChar.description && (
            <div className="text-xs text-gray-500 mb-2">
              {selectedChar.description}
            </div>
          )}

          <div className="text-xs text-gray-700">
            {selectedChar.bio}
          </div>
        </div>
      )}

      {/* ---------- LEGEND ---------- */}
      <div className="absolute bottom-4 left-4 bg-white border rounded-lg px-3 py-2 shadow text-xs space-y-1">

        <div className="font-medium mb-1">Legend</div>

        {Object.entries(TYPE_COLORS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <div style={{
              width: 16,
              height: 2,
              background: v as string
            }} />
            {k}
          </div>
        ))}

      </div>

    </div>
  )
}