export type ChapterId = 'request' | 'tools' | 'debug'
export type Accent = 'coral' | 'mint' | 'gold' | 'violet' | 'error' | 'ink'
export type Actor = 'model' | 'gateway' | 'client' | 'store'
export type ViewMode = 'experience' | 'system'

export interface RequestStep {
  id: string
  flowNode: string
  label: string
  time: string
  title: string
  experience: string
  systemAction: string
  systemResult: string
  evidence: string
  accent: Accent
}

export interface ContextLayerBlock {
  id: string
  label: string
  technical: string
  content: string
  placement: string
  cache: string
  accent: Accent
}

export interface ContextSource {
  name: string
  kind: string
  status: string
  detail: string
  accent: Accent
}

export interface IslandSnapshot {
  label: string
  stars: string
  mem: string
  state: 'previous' | 'proposal' | 'final'
}

export interface RequestVariant {
  id: string
  label: string
  message: string
  summary: string
  result: string
  event: string
  memoryOutcome: 'retained' | 'surfaced'
  fixedLayers: ContextLayerBlock[]
  memorySources: ContextSource[]
  island: IslandSnapshot[]
  finalMessages: ContextLayerBlock[]
  cacheResult: string
  steps: RequestStep[]
}

export interface FlowNode {
  id: string
  label: string
  subtitle: string
  accent: Accent
}

export interface ToolEvent {
  phase?: string
  from: Actor
  to: Actor
  title: string
  experience: string
  detail: string
  result: string
  transcript: ToolTranscriptSnapshot
}

export interface TranscriptItem {
  role: 'system' | 'user' | 'assistant' | 'tool'
  label: string
  content: string
  accent: Accent
}

export interface ToolTranscriptSnapshot {
  round: string
  working: TranscriptItem[]
  pending: TranscriptItem[]
  clientVisible: TranscriptItem[]
}

export interface ToolScenario {
  id: string
  label: string
  shortLabel: string
  message: string
  summary: string
  outcome: string
  metrics: Array<{ label: string; value: string }>
  events: ToolEvent[]
  truth: string
}

export type CollaborationSpeaker = 'owner' | 'agent' | 'shared'

export interface CollaborationExchange {
  speaker: CollaborationSpeaker
  label: string
  text: string
}

export interface CollaborationEvidence {
  label: string
  value: string
}

export interface CollaborationStep {
  id: string
  label: string
  title: string
  summary: string
  exchanges: CollaborationExchange[]
  route: string[]
  evidence: CollaborationEvidence[]
  outcome: string
  accent: Accent
}

export interface CollaborationHandoff {
  label: string
  value: string
}

export interface CollaborationCase {
  eyebrow: string
  title: string
  summary: string
  rootCause: string
  result: string
  definition: string[]
  steps: CollaborationStep[]
  handoff: CollaborationHandoff[]
}
