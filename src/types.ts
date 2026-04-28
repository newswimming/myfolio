export interface Character {
  name: string
  description?: string
  importance?: number
  bio?: string
  character_role?: 'locus' | 'symbiote' | 'mirror' | 'agent' | 'neutral'
  agency_score?: number
  attention_score?: number
}

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
  character_role?: 'locus' | 'symbiote' | 'mirror' | 'agent' | 'neutral'
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



export interface TrendsResponse {
  themes: ThemeResult[]
}

export interface Topic {
  title: string
  content: string
  tags: string[]
  note_id?: string
  obsidian_md?: string
}
