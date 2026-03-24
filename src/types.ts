export interface GraphNode {
  id: string
  tags: string[]
  macro_id: number
  content: string
}

export interface GraphLink {
  source: string
  target: string
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export type ActKey = 'ki' | 'sho' | 'ten' | 'ketsu'

export interface ArcBeat {
  act: ActKey
  text: string
  isLocked: boolean
  clusterIds: number[]
}

export interface GenerateArcResponse {
  ki: string
  sho: string
  ten: string
  ketsu: string
  clusters_used: Record<string, number[]>
}
