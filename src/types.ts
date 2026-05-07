export type WorkflowPhase =
  | 'rule-generation'
  | 'pull-request'
  | 'verification'
  | 'simulation'
  | 'insights'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  body: string
  createdAt: number
}

export interface ReasonRow {
  conditionNo: string
  englishCondition: string
  drlSnippet: string
  confidence: number
  needsReview: boolean
  notes: string
}

export interface RuleGenerateResponse {
  thinkingSteps: string[]
  reasoningTable: ReasonRow[]
  drl: string
  overallConfidence: number
  compilationStatus: 'success' | 'warnings'
  aiMessage: string
}

export interface ThinkingLine {
  id: string
  label: string
  done: boolean
}

/** Mirrors `/api/insights/chart-data` static bundle for deterministic charts */
export interface InsightsDataset {
  kpis: {
    totalDiagnosed: number
    diagnosisRate: number
    trendPct: number
    dataCompleteness: number
  }
  diagnosisTrend: Array<{ t: string; diagnosed: number }>
  modelOverlap: Array<{ model: string; share: number }>
  topRegions: Array<{ region: string; pct: number }>
  numericConditionStats: Record<
    string,
    { min: number; max: number; median: number; suggestedThresholdDraft: string }
  >
  sqlSourceLabels: Record<string, string>
  aiNarrative: string
}
