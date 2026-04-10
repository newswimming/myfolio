export interface GraphNode {
  id: string
  display_name?: string
  tags: string[]
  macro_id: number
  character_community_id?: number
  constraint?: number
  content: string
  is_character_node?: boolean
  is_narrative_pivot?: boolean
  character_role?: 'locus' | 'symbiote' | 'mirror' | 'dominant' | 'neutral'
  power_role?: string
  attention_score?: number
  agency_score?: number
  dialogue_weight?: number
}

export interface GraphLink {
  source: string
  target: string
  relation_type?: string
  narrative_act?: string
  confidence?: number
  provenance?: string
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
  characterNames: string[]
}

export interface GenerateArcResponse {
  ki: string
  sho: string
  ten: string
  ketsu: string
  clusters_used: Record<string, number[]>
  characters_per_act?: Record<string, string[]>
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

