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

export interface ThemeResult {
  theme: string
  relevance_blurb: string
  published_date: string
  source_type: string
  source_title: string
  source_url: string
  evidence_note: string
}

export interface BiasSubdimension {
  score: number
  evidence: string[]
}

export interface BiasResult {
  overall_bias_score: number
  bias_1: {
    agency_gap: BiasSubdimension
    gaze_objectification: BiasSubdimension
    affection_asymmetry: BiasSubdimension
  }
  bias_2: {
    linguistic_stereotyping: BiasSubdimension
    dialogue_power_imbalance: BiasSubdimension
  }
}
