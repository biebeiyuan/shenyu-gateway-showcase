export type NodeStatus = 'idle' | 'active' | 'complete' | 'skipped' | 'error'
export type StepTone = 'rose' | 'sage' | 'amber' | 'violet' | 'error'
export type ViewMode = 'experience' | 'system'

export interface GatewayNodeDetails {
  label: string
  subtitle: string
  zone: string
  icon: string
  accent: StepTone
  experienceQuestion: string
  productDecision: string
  systemInput: string
  systemOutput: string
  boundary: string
  evidence: string
  status?: NodeStatus
  stepNumber?: number
}

export interface ScenarioStep {
  nodeId: string
  title: string
  detail: string
  result: string
  tone: StepTone
}

export interface Scenario {
  id: string
  name: string
  shortName: string
  summary: string
  userMessage: string
  outcome: string
  steps: ScenarioStep[]
  skippedNodeIds: string[]
}
