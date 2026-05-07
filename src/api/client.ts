import type { RuleGenerateResponse } from '../types'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!r.ok) {
    const err = await r.text()
    throw new Error(err || `${r.status}`)
  }
  return r.json() as Promise<T>
}

export function generateRule(messages: Array<{ role: string; content: string }>) {
  return api<RuleGenerateResponse>('/api/rules/generate', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  })
}

export function preparePr(payload: {
  drlContent: string
  branchName?: string
  enterprise?: boolean
}) {
  return api<{
    thinkingSteps: string[]
    pr: { title: string; branch: string; prUrl: string; summary: string }
  }>('/api/github/prepare-pr', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function runVerification(csv: string) {
  return api<{
    matchScore: number
    triggered: number
    notTriggered: number
    conditions: Array<{ conditionId: string; passRate: number; avgWhenTrueC: string }>
    notes: string
    thinkingSteps: string[]
  }>('/api/verify/run', {
    method: 'POST',
    body: JSON.stringify({ csv }),
  })
}

export function recommendSimulation(filters: Record<string, string>) {
  return api<{
    engine: string
    rationale: string
    estimatedRecords: number
    estimatedCostUsd: number
    estimatedMinutes: [number, number]
    thinkingSteps: string[]
  }>('/api/simulation/recommend', {
    method: 'POST',
    body: JSON.stringify({ filters }),
  })
}

export function startLargeSimulation(filters: Record<string, string>) {
  return api<{
    jobId: string
    outputPrefix: string
    thinkingSteps: string[]
  }>('/api/simulation/start', {
    method: 'POST',
    body: JSON.stringify({ filters }),
  })
}

export function pollSimulation(jobId: string) {
  return api<{
    progress: number
    recordsScanned: number
    stages: Array<{ name: string; status: string }>
  }>(`/api/simulation/status/${encodeURIComponent(jobId)}`)
}

export function insightsChartData() {
  return api<{
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
  }>('/api/insights/chart-data')
}
