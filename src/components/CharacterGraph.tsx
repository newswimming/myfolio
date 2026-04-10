import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { useStore } from '../store'
import type { GraphNode, GraphLink } from '../types'

// ── Role colours ─────────────────────────────────────────────────────────────
const roleStyle: Record<string, { card: string; badge: string; label: string }> = {
  locus:    { card: 'border-violet-700/60 bg-violet-950/30', badge: 'text-violet-300 bg-violet-950/60', label: 'text-violet-300' },
  mirror:   { card: 'border-cyan-700/60    bg-cyan-950/30',  badge: 'text-cyan-300    bg-cyan-950/60',  label: 'text-cyan-300'    },
  symbiote: { card: 'border-amber-700/60  bg-amber-950/30',  badge: 'text-amber-300  bg-amber-950/60',  label: 'text-amber-300'   },
  dominant: { card: 'border-orange-700/60 bg-orange-950/30', badge: 'text-orange-300 bg-orange-950/60', label: 'text-orange-300'  },
  neutral:  { card: 'border-gray-700      bg-gray-900/40',   badge: 'text-gray-400   bg-gray-800',      label: 'text-gray-200'    },
}

const ROLE_HEX: Record<string, string> = {
  locus:    '#a78bfa',
  mirror:   '#67e8f9',
  symbiote: '#fcd34d',
  dominant: '#fb923c',
  neutral:  '#6b7280',
}

const REL_HEX: Record<string, string> = {
  supports:     '#34d399',
  contradicts:  '#f87171',
  motivates:    '#60a5fa',
  hinders:      '#fb923c',
  kinetic_to:   '#c084fc',
  potential_to: '#22d3ee',
  related:      '#4b5563',
}

const relStyle: Record<string, string> = {
  supports:     'text-emerald-400 bg-emerald-950/50',
  contradicts:  'text-red-400     bg-red-950/50',
  motivates:    'text-blue-400    bg-blue-950/50',
  hinders:      'text-orange-400  bg-orange-950/50',
  kinetic_to:   'text-purple-400  bg-purple-950/50',
  potential_to: 'text-cyan-400    bg-cyan-950/50',
  related:      'text-gray-500    bg-gray-800',
}

function roleOf(node: GraphNode) { return node.character_role ?? 'neutral' }
function labelOf(node: GraphNode) { return node.display_name ?? node.id }

// ── Character card ────────────────────────────────────────────────────────────
function CharCard({ node }: { node: GraphNode }) {
  const role  = roleOf(node)
  const style = roleStyle[role] ?? roleStyle.neutral
  const charTags  = node.tags.filter(t => !t.startsWith('aspect/character/') && !t.startsWith('code/') && !t.startsWith('affect/'))
  const affectTag = node.tags.find(t => t.startsWith('affect/'))?.replace('affect/', '')
  const beatTag   = node.tags.find(t => t.startsWith('code/'))?.replace('code/', '')
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 ${style.card}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-sm font-semibold ${style.label}`}>{labelOf(node)}</span>
        <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium leading-none ${style.badge}`}>{role}</span>
        {node.is_narrative_pivot && (
          <span className="text-xs rounded-full px-1.5 py-0.5 font-medium leading-none text-yellow-300 bg-yellow-950/60">pivot</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {beatTag   && <span className="text-xs text-indigo-400 bg-indigo-950/50 rounded-full px-2 py-0.5">{beatTag}</span>}
        {affectTag && <span className="text-xs text-gray-400 bg-gray-800 rounded-full px-2 py-0.5">{affectTag}</span>}
        {node.power_role && node.power_role !== 'unclear' && (
          <span className="text-xs text-gray-500 bg-gray-800 rounded-full px-2 py-0.5">{node.power_role}</span>
        )}
      </div>
      {charTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {charTags.slice(0, 4).map(t => (
            <span key={t} className="text-xs text-gray-500 bg-gray-800 rounded-full px-2 py-0.5">
              {t.replace(/^(topic|aspect)\//, '')}
            </span>
          ))}
        </div>
      )}
      {(node.attention_score !== undefined || node.agency_score !== undefined) && (
        <div className="flex gap-3 pt-1">
          {node.attention_score !== undefined && (
            <span className="text-xs text-gray-600" title="Scene coverage">
              attn {Math.round(node.attention_score * 100)}%
            </span>
          )}
          {node.agency_score !== undefined && (
            <span className="text-xs text-gray-600" title="Dominant interaction ratio">
              agcy {Math.round(node.agency_score * 100)}%
            </span>
          )}
          {node.dialogue_weight !== undefined && (
            <span className="text-xs text-gray-600" title="Outbound / total interactions">
              dial {Math.round(node.dialogue_weight * 100)}%
            </span>
          )}
        </div>
      )}
      {node.content && (
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{node.content}</p>
      )}
    </div>
  )
}

// ── Force-directed relations graph ───────────────────────────────────────────

interface SimNode extends d3.SimulationNodeDatum {
  id: string
  node: GraphNode
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  link: GraphLink
}

const W = 900
const H = 520
const R_MIN = 16
const R_MAX = 30

/** Map attention_score [0,1] → node radius [R_MIN, R_MAX] */
function nodeRadius(node: GraphNode): number {
  const a = node.attention_score ?? 0.5
  return R_MIN + (R_MAX - R_MIN) * Math.min(1, Math.max(0, a))
}

function RelationsGraph({
  links,
  nodeMap,
}: {
  links: GraphLink[]
  nodeMap: Map<string, GraphNode>
}) {
  const svgRef  = useRef<SVGSVGElement>(null)
  const gRef    = useRef<SVGGElement>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered,  setHovered]  = useState<string | null>(null)

  const simNodes: SimNode[] = useMemo(() => {
    const ids = new Set<string>()
    for (const l of links) { ids.add(l.source as string); ids.add(l.target as string) }
    return Array.from(ids).filter(id => nodeMap.has(id)).map(id => ({ id, node: nodeMap.get(id)! }))
  }, [links, nodeMap])

  const simLinks: SimLink[] = useMemo(
    () => links.map(l => ({ source: l.source as string, target: l.target as string, link: l })),
    [links],
  )

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return

    const svg = d3.select(svgRef.current)
    const g   = d3.select(gRef.current)

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 4])
      .on('zoom', ev => g.attr('transform', ev.transform as unknown as string))
    svg.call(zoom).on('dblclick.zoom', null)

    const nodes: SimNode[] = simNodes.map(n => ({ ...n }))
    const lnks:  SimLink[] = simLinks.map(l => ({ ...l }))

    const defs = g.select<SVGDefsElement>('defs')
    defs.selectAll('marker').remove()
    Object.entries(REL_HEX).forEach(([type, color]) => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -4 8 8')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 5)
        .attr('markerHeight', 5)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L8,0L0,4Z')
        .attr('fill', color)
        .attr('opacity', 0.8)
    })

    const linkSel = g.select<SVGGElement>('.links')
      .selectAll<SVGLineElement, SimLink>('line')
      .data(lnks)
      .join('line')
      .attr('stroke-width', 1.5)
      .attr('stroke', d => REL_HEX[d.link.relation_type ?? 'related'] ?? REL_HEX.related)
      .attr('stroke-opacity', 0.55)
      .attr('marker-end', d => `url(#arrow-${d.link.relation_type ?? 'related'})`)

    const nodeSel = g.select<SVGGElement>('.nodes')
      .selectAll<SVGGElement, SimNode>('g.char-node')
      .data(nodes, d => d.id)
      .join('g')
      .attr('class', 'char-node')
      .attr('cursor', 'pointer')
      .on('mouseenter', (_, d) => setHovered(d.id))
      .on('mouseleave',      () => setHovered(null))
      .on('click', (ev, d) => { ev.stopPropagation(); setSelected(prev => prev === d.id ? null : d.id) })

    nodeSel.selectAll('circle.bg').remove()
    nodeSel.append('circle')
      .attr('class', 'bg')
      .attr('r', d => nodeRadius(d.node))
      .attr('fill', d => `${ROLE_HEX[roleOf(d.node)]}1a`)
      .attr('stroke', d => ROLE_HEX[roleOf(d.node)])
      .attr('stroke-width', 2)

    // Agency ring — outer stroke whose width encodes agency_score
    nodeSel.selectAll('circle.agency').remove()
    nodeSel.append('circle')
      .attr('class', 'agency')
      .attr('r', d => nodeRadius(d.node) + 4)
      .attr('fill', 'none')
      .attr('stroke', d => ROLE_HEX[roleOf(d.node)])
      .attr('stroke-width', d => Math.max(0.5, (d.node.agency_score ?? 0) * 5))
      .attr('stroke-opacity', 0.35)
      .attr('pointer-events', 'none')

    nodeSel.selectAll('text.init').remove()
    nodeSel.append('text')
      .attr('class', 'init')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', 10)
      .attr('font-weight', '600')
      .attr('fill', d => ROLE_HEX[roleOf(d.node)])
      .attr('pointer-events', 'none')
      .text(d => labelOf(d.node).split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase())

    nodeSel.selectAll('text.lbl').remove()
    nodeSel.append('text')
      .attr('class', 'lbl')
      .attr('y', d => nodeRadius(d.node) + 13)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9.5)
      .attr('fill', '#9ca3af')
      .attr('pointer-events', 'none')
      .text(d => labelOf(d.node))

    const drag = d3.drag<SVGGElement, SimNode>()
      .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
      .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y })
      .on('end',   (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
    nodeSel.call(drag)

    const sim = d3.forceSimulation<SimNode>(nodes)
      .force('link',      d3.forceLink<SimNode, SimLink>(lnks).id(d => d.id).distance(130).strength(0.35))
      .force('charge',    d3.forceManyBody<SimNode>().strength(-320))
      .force('center',    d3.forceCenter(W / 2, H / 2).strength(0.08))
      .force('collision', d3.forceCollide<SimNode>(d => nodeRadius(d.node) + 12))

    sim.on('tick', () => {
      linkSel
        .attr('x1', d => {
          const s = d.source as SimNode; const t = d.target as SimNode
          const dx = t.x! - s.x!; const dy = t.y! - s.y!; const len = Math.hypot(dx, dy) || 1
          return s.x! + (dx / len) * nodeRadius(s.node)
        })
        .attr('y1', d => {
          const s = d.source as SimNode; const t = d.target as SimNode
          const dx = t.x! - s.x!; const dy = t.y! - s.y!; const len = Math.hypot(dx, dy) || 1
          return s.y! + (dy / len) * nodeRadius(s.node)
        })
        .attr('x2', d => {
          const s = d.source as SimNode; const t = d.target as SimNode
          const dx = t.x! - s.x!; const dy = t.y! - s.y!; const len = Math.hypot(dx, dy) || 1
          return t.x! - (dx / len) * (nodeRadius(t.node) + 6)
        })
        .attr('y2', d => {
          const s = d.source as SimNode; const t = d.target as SimNode
          const dx = t.x! - s.x!; const dy = t.y! - s.y!; const len = Math.hypot(dx, dy) || 1
          return t.y! - (dy / len) * (nodeRadius(t.node) + 6)
        })

      nodeSel.attr('transform', d => `translate(${d.x!},${d.y!})`)
    })

    svg.on('click.deselect', () => setSelected(null))

    return () => { sim.stop(); svg.on('.zoom', null).on('click.deselect', null) }
  }, [simNodes, simLinks])

  useEffect(() => {
    if (!gRef.current) return
    const g = d3.select(gRef.current)
    const active = hovered ?? selected

    if (!active) {
      g.selectAll<SVGGElement, SimNode>('.nodes .char-node').attr('opacity', 1)
      g.selectAll<SVGLineElement, SimLink>('.links line').attr('stroke-opacity', 0.55).attr('stroke-width', 1.5)
      return
    }

    const neighbours = new Set<string>([active])
    g.selectAll<SVGLineElement, SimLink>('.links line').each(d => {
      const s = typeof d.source === 'object' ? (d.source as SimNode).id : d.source as string
      const t = typeof d.target === 'object' ? (d.target as SimNode).id : d.target as string
      if (s === active || t === active) { neighbours.add(s); neighbours.add(t) }
    })

    g.selectAll<SVGGElement, SimNode>('.nodes .char-node')
      .attr('opacity', d => neighbours.has(d.id) ? 1 : 0.12)

    g.selectAll<SVGLineElement, SimLink>('.links line')
      .attr('stroke-opacity', d => {
        const s = typeof d.source === 'object' ? (d.source as SimNode).id : d.source as string
        const t = typeof d.target === 'object' ? (d.target as SimNode).id : d.target as string
        return (s === active || t === active) ? 0.9 : 0.04
      })
      .attr('stroke-width', d => {
        const s = typeof d.source === 'object' ? (d.source as SimNode).id : d.source as string
        const t = typeof d.target === 'object' ? (d.target as SimNode).id : d.target as string
        return (s === active || t === active) ? 2.5 : 1.5
      })
  }, [hovered, selected])

  if (links.length === 0) return null

  const selNode  = selected ? nodeMap.get(selected) : null
  const selLinks = selNode ? links.filter(l => l.source === selNode.id || l.target === selNode.id) : []

  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Character Relations</h3>
        <span className="text-xs text-gray-600">
          {simNodes.length} characters · {links.length} edges
          &nbsp;·&nbsp; scroll to zoom · drag nodes · click to inspect
        </span>
      </div>

      <div className="relative select-none">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H, display: 'block' }}>
          <g ref={gRef}>
            <defs />
            <g className="links" />
            <g className="nodes" />
          </g>
        </svg>

        {selNode && (
          <div className="absolute top-4 right-4 w-64 rounded-xl border border-gray-700 bg-gray-950/95 backdrop-blur-sm p-4 flex flex-col gap-3"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-semibold ${(roleStyle[roleOf(selNode)] ?? roleStyle.neutral).label}`}>{labelOf(selNode)}</span>
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium leading-none ${(roleStyle[roleOf(selNode)] ?? roleStyle.neutral).badge}`}>{roleOf(selNode)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selNode.tags.find(t => t.startsWith('code/')) && (
                <span className="text-xs text-indigo-400 bg-indigo-950/50 rounded-full px-2 py-0.5">
                  {selNode.tags.find(t => t.startsWith('code/'))!.replace('code/', '')}
                </span>
              )}
              {selNode.tags.find(t => t.startsWith('affect/')) && (
                <span className="text-xs text-gray-400 bg-gray-800 rounded-full px-2 py-0.5">
                  {selNode.tags.find(t => t.startsWith('affect/'))!.replace('affect/', '')}
                </span>
              )}
            </div>
            {(selNode.attention_score !== undefined || selNode.agency_score !== undefined || selNode.dialogue_weight !== undefined) && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Metrics</span>
                {([
                  { label: 'Attention',       value: selNode.attention_score,  title: 'Scene coverage (fraction of total scenes)' },
                  { label: 'Agency',          value: selNode.agency_score,     title: 'Dominant interaction ratio' },
                  { label: 'Dialogue weight', value: selNode.dialogue_weight,  title: 'Outbound / total interaction ratio' },
                ] as { label: string; value: number | undefined; title: string }[]).filter(m => m.value !== undefined).map(m => (
                  <div key={m.label} title={m.title} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-28 shrink-0">{m.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${Math.round(m.value! * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums w-8 text-right shrink-0">
                      {Math.round(m.value! * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
            {selLinks.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Relations</span>
                {selLinks.slice(0, 7).map((l, i) => {
                  const otherId = l.source === selNode.id ? l.target : l.source
                  const other   = nodeMap.get(otherId)
                  const rel     = l.relation_type ?? 'related'
                  const dir     = l.source === selNode.id ? '→' : '←'
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <span className="text-gray-600 shrink-0">{dir}</span>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 font-medium leading-none ${relStyle[rel] ?? relStyle.related}`}>
                        {rel.replace('_', ' ')}
                      </span>
                      <span className="text-gray-400 truncate">{other ? labelOf(other) : otherId}</span>
                      {l.confidence !== undefined && (
                        <span className="ml-auto text-gray-600 shrink-0 tabular-nums">{Math.round(l.confidence * 100)}%</span>
                      )}
                    </div>
                  )
                })}
                {selLinks.length > 7 && <span className="text-xs text-gray-600">+{selLinks.length - 7} more</span>}
              </div>
            )}
            {selNode.content && (
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 border-t border-gray-800 pt-2">{selNode.content}</p>
            )}
          </div>
        )}
      </div>

      <div className="px-6 py-3 border-t border-gray-800 flex flex-col gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs text-gray-600 font-medium uppercase tracking-wide w-12 shrink-0">Role</span>
          {Object.entries(ROLE_HEX).map(([role, color]) => (
            <div key={role} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full shrink-0 border-2" style={{ borderColor: color, backgroundColor: color + '20' }} />
              <span className="text-xs text-gray-500">{role}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs text-gray-600 font-medium uppercase tracking-wide w-12 shrink-0">Edge</span>
          {Object.entries(REL_HEX).map(([rel, color]) => (
            <div key={rel} className="flex items-center gap-1.5">
              <span className="w-5 h-0.5 shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-500">{rel.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600">
          <span className="font-medium uppercase tracking-wide w-12 shrink-0">Size</span>
          <span>node radius = attention score (scene coverage)</span>
          <span className="ml-4">outer ring thickness = agency score (dominant interaction ratio)</span>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CharacterGraph() {
  const graphData = useStore(s => s.graphData)

  const charNodes = useMemo(() => graphData?.nodes.filter(n => n.is_character_node) ?? [], [graphData])
  const nodeMap   = useMemo(() => new Map(graphData?.nodes.map(n => [n.id, n]) ?? []), [graphData])
  const charNodeIds = useMemo(() => new Set(charNodes.map(n => n.id)), [charNodes])

  const charLinks = useMemo(
    () => (graphData?.links ?? []).filter(l => charNodeIds.has(l.source) && charNodeIds.has(l.target)),
    [graphData, charNodeIds],
  )

  const communities = useMemo(() => {
    const map = new Map<number, GraphNode[]>()
    for (const node of charNodes) {
      const cid = node.character_community_id ?? node.macro_id
      if (!map.has(cid)) map.set(cid, [])
      map.get(cid)!.push(node)
    }
    const roleOrder: Record<string, number> = { locus: 0, mirror: 1, symbiote: 2, dominant: 3, neutral: 4 }
    for (const nodes of map.values()) {
      nodes.sort((a, b) => (roleOrder[roleOf(a)] ?? 5) - (roleOrder[roleOf(b)] ?? 5))
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b).map(([id, nodes]) => ({ id, nodes }))
  }, [charNodes])

  if (!graphData) return null

  if (charNodes.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto rounded-2xl border border-gray-800 bg-gray-900 p-10 flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-semibold text-gray-400">No character nodes in graph</p>
        <p className="text-xs text-gray-600 max-w-sm">
          Run the CSG pipeline on a screenplay, then call{' '}
          <code className="text-indigo-400">POST /graph/ingest-character-graph</code> to populate character data.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(communities.length, 4)}, minmax(0, 1fr))` }}>
        {communities.map(({ id, nodes }) => (
          <div key={id} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Community {id}</span>
              <div className="flex-1 border-t border-gray-800" />
              <span className="text-xs text-gray-600">{nodes.length}</span>
            </div>
            {nodes.map(node => <CharCard key={node.id} node={node} />)}
          </div>
        ))}
      </div>

      <RelationsGraph links={charLinks} nodeMap={nodeMap} />
    </div>
  )
}
