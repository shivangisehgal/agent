import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import './index.css'
import { AgentChat } from './components/AgentChat'
import { Box, CheckCircle2, Cloud } from 'lucide-react'
import { PhaseRail } from './components/PhaseRail'
import { ThemeToggle } from './components/ThemeToggle'
import { WorkflowProgress } from './components/WorkflowProgress'
import { PortalProvider, usePortal } from './context/PortalContext'
import type { InsightsDataset, ThinkingLine, WorkflowPhase } from './types'
import {
  generateRule,
  insightsChartData,
  preparePr,
  recommendSimulation,
  runVerification,
  startLargeSimulation,
} from './api/client'
import { makeThinkingIds } from './utils/thinking'
import { RuleGeneration } from './workspace/RuleGeneration'
import { PullRequestFlow } from './workspace/PullRequestFlow'
import { Verification } from './workspace/Verification'
import { LargeSimulation } from './workspace/LargeSimulation'
import { InsightsDashboard } from './workspace/InsightsDashboard'

const GENERIC_RULE_THINKING = [
  'Interpreting product language vs RefrigeratorFact binding graph',
  'Hydrating KieSession classpath against simulation harness HEAD',
  'Negotiating guarded LHS fragments with completeness sentinels',
]

const GENERIC_PR_THINKING = [
    'Hydrating SCM metadata for deterministic branch naming',
    'Rendering Git patch + CODEOWNERS fan-out hints',
    'Scheduling CI workflows for Drools compile + harness smoke',
  ]

const GENERIC_VERIFY_THINKING = [
    'Building temporary Fact inserts from telemetry CSV tuples',
    'Spinning KieContainer with ephemeral release id',
    'Aggregating LHS truth tables for KPI extraction',
  ]

const GENERIC_SIM_THINKING = [
    'Consulting Glue / Athena statistics for parquet prune plan',
    'Evaluating Kie fan-out parallelism vs Athena byte pricing',
]

type VerifyKpis = {
  matchScore: number
  triggered: number
  notTriggered: number
  conditions: Array<{ conditionId: string; passRate: number; avgWhenTrueC: string }>
}

function rotateThinking(
  labels: string[],
  setter: Dispatch<SetStateAction<ThinkingLine[] | null>>,
  ms: number,
) {
  const lines = makeThinkingIds(labels)
  let wave = 0
  setter(lines.map((l, i) => ({ ...l, done: i < wave })))
  return window.setInterval(() => {
    wave = Math.min(lines.length, wave + 1)
    setter(lines.map((l, i) => ({ ...l, done: i < wave })))
    if (wave >= lines.length) wave = 0
  }, ms)
}

function slashRoute(text: string): WorkflowPhase | null {
  if (!text.startsWith('/')) return null
  const head = text.slice(1).trim().split(/\s+/)[0]?.toLowerCase()
  switch (head) {
    case 'rule':
      return 'rule-generation'
    case 'pr':
      return 'pull-request'
    case 'verify':
      return 'verification'
    case 'sim':
    case 'simulate':
      return 'simulation'
    case 'insights':
      return 'insights'
    default:
      return null
  }
}

function AppInner() {
  const {
    state,
    appendChat,
    setPhase,
    setReasoning,
    setDrl,
    acceptRule,
    setPrMeta,
    setPrMerged,
    setVerification,
    setVerificationDraft,
    setJobId,
    setSimulationFilters,
  } = usePortal()

  const [thinking, setThinking] = useState<ThinkingLine[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [verifyKpis, setVerifyKpis] = useState<VerifyKpis | undefined>()
  const [verifyNotes, setVerifyNotes] = useState<string | undefined>()
  const [simRecommendation, setSimRecommendation] =
    useState<Awaited<ReturnType<typeof recommendSimulation>> | null>(null)
  const [insights, setInsights] = useState<InsightsDataset | null>(null)

  const messagesForApi = useMemo(
    () => state.chat.map((m) => ({ role: m.role, content: m.body })),
    [state.chat],
  )

  const replaySteps = useCallback(async (steps: string[], ms = 265) => {
    const ids = makeThinkingIds(steps)
    for (let pass = 0; pass <= steps.length; pass++) {
      const view = ids.map((l, idx) => ({ ...l, done: idx < pass }))
      setThinking(view)
      await new Promise((res) => setTimeout(res, ms))
    }
  }, [])

  const bootInsights = useCallback(async () => {
    if (insights || busy) return
    setBusy(true)
    const ticker = rotateThinking(GENERIC_RULE_THINKING, setThinking, 620)
    try {
      const data = (await insightsChartData()) as InsightsDataset
      setInsights(data)
      appendChat('assistant', data.aiNarrative)
    } catch (err) {
      appendChat(
        'system',
        `Insights bundle failed (${err instanceof Error ? err.message : String(err)}).`,
      )
    } finally {
      window.clearInterval(ticker)
      setThinking(null)
      setBusy(false)
    }
  }, [insights, busy, appendChat])

  const handlePhaseSelect = useCallback(
    (p: WorkflowPhase) => {
      setPhase(p)
      appendChat('assistant', `Switched canvas to “${p.replace(/-/g, ' ')}”. Chat stays contextual.`)
      if (p === 'insights') void bootInsights()
    },
    [appendChat, bootInsights, setPhase],
  )

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || busy) return
      appendChat('user', text.trim())
      const routed = slashRoute(text.trim())
      if (routed) {
        setPhase(routed)
        appendChat('assistant', `Jumped to /${routed.replace(/-/g, '')} lane via slash command.`)
        if (routed === 'insights') void bootInsights()
        return
      }

      setBusy(true)
      try {
        if (state.phase === 'rule-generation') {
          const ticker = rotateThinking(GENERIC_RULE_THINKING, setThinking, 620)
          try {
            const resp = await generateRule([...messagesForApi, { role: 'user', content: text.trim() }])
            window.clearInterval(ticker)
            await replaySteps(resp.thinkingSteps, 255)
            setReasoning(resp.reasoningTable, resp.overallConfidence, resp.compilationStatus)
            setDrl(resp.drl.replace(/\\n/g, '\n'))
            appendChat('assistant', resp.aiMessage)
          } catch (err) {
            window.clearInterval(ticker)
            appendChat(
              'system',
              `Rule generation failed (${err instanceof Error ? err.message : String(err)}).`,
            )
          }
        } else if (state.phase === 'pull-request') {
          if (!state.drl) {
            appendChat('assistant', 'Accept a DRL draft in the previous lane before opening a PR.')
            return
          }
          if (!/(prepare|generate|open|pr)/i.test(text)) {
            appendChat(
              'assistant',
              'Say “prepare PR” in chat or use the workspace control. I will orchestrate GitHub / eCode stubs via the API.',
            )
            return
          }
          const ticker = rotateThinking(GENERIC_PR_THINKING, setThinking, 580)
          try {
            const res = await preparePr({ drlContent: state.drl })
            window.clearInterval(ticker)
            await replaySteps(res.thinkingSteps, 280)
            setPrMeta(res.pr.prUrl, res.pr.branch)
            appendChat(
              'assistant',
              `${res.pr.title}\nBranch \`${res.pr.branch}\`\n${res.pr.summary}\n${res.pr.prUrl}`,
            )
          } catch (err) {
            window.clearInterval(ticker)
            appendChat('system', `PR orchestration failed (${err instanceof Error ? err.message : String(err)}).`)
          }
        } else if (state.phase === 'verification') {
          if (!/(run|verify|execute|test)/i.test(text)) {
            appendChat(
              'assistant',
              'Paste CSV on the left, then say “run verification” to execute the stubbed Drools micro-pass.',
            )
            return
          }
          const ticker = rotateThinking(GENERIC_VERIFY_THINKING, setThinking, 560)
          try {
            const res = await runVerification(state.verificationDraft)
            window.clearInterval(ticker)
            await replaySteps(res.thinkingSteps, 260)
            setVerifyKpis({
              matchScore: res.matchScore,
              triggered: res.triggered,
              notTriggered: res.notTriggered,
              conditions: res.conditions,
            })
            setVerifyNotes(res.notes)
            setVerification(state.verificationDraft, res.notes)
            appendChat(
              'assistant',
              `Match ${(res.matchScore * 100).toFixed(0)}% · triggered ${res.triggered} / ${res.triggered + res.notTriggered} rows. ${res.notes}`,
            )
          } catch (err) {
            window.clearInterval(ticker)
            appendChat('system', `Verification failed (${err instanceof Error ? err.message : String(err)}).`)
          }
        } else if (state.phase === 'simulation') {
          if (/(recommend|size|estimate|price)/i.test(text)) {
            const ticker = rotateThinking(GENERIC_SIM_THINKING, setThinking, 640)
            try {
              const res = await recommendSimulation(state.simulationFilters)
              window.clearInterval(ticker)
              await replaySteps(res.thinkingSteps, 270)
              setSimRecommendation(res)
              appendChat(
                'assistant',
                `${res.engine} estimates ${res.estimatedRecords.toLocaleString()} rows, ~$${res.estimatedCostUsd.toFixed(2)} · ${res.estimatedMinutes[0]}-${res.estimatedMinutes[1]} min. ${res.rationale}`,
              )
            } catch (err) {
              window.clearInterval(ticker)
              appendChat('system', `Sizing failed (${err instanceof Error ? err.message : String(err)}).`)
            }
          } else if (/(start|queue|fire|run full)/i.test(text)) {
            const ticker = rotateThinking(GENERIC_SIM_THINKING, setThinking, 640)
            try {
              const res = await startLargeSimulation(state.simulationFilters)
              window.clearInterval(ticker)
              await replaySteps(res.thinkingSteps, 270)
              setJobId(res.jobId)
              appendChat(
                'assistant',
                `Job ${res.jobId} queued. Partial outputs will land under ${res.outputPrefix}`,
              )
            } catch (err) {
              window.clearInterval(ticker)
              appendChat('system', `Simulation start failed (${err instanceof Error ? err.message : String(err)}).`)
            }
          } else {
            appendChat(
              'assistant',
              'Ask for a “recommendation” to size Athena, or say “start” to enqueue the long-running job.',
            )
          }
        } else if (state.phase === 'insights') {
          if (/(refresh|reload|rechart)/i.test(text)) {
            setInsights(null)
            await bootInsights()
          } else {
            appendChat(
              'assistant',
              'Charts hydrate from fixed SQL bundles in the API. Say “refresh” to pull the latest dataset.',
            )
          }
        }
      } finally {
        setThinking(null)
        setBusy(false)
      }
    },
    [
      appendChat,
      bootInsights,
      busy,
      messagesForApi,
      replaySteps,
      setDrl,
      setJobId,
      setPhase,
      setPrMeta,
      setReasoning,
      setVerification,
      state.drl,
      state.phase,
      state.simulationFilters,
      state.verificationDraft,
    ],
  )

  const handleAcceptRule = useCallback(() => {
    acceptRule()
    setPhase('pull-request')
    appendChat(
      'assistant',
      'Rule accepted. Slide changed to Pull Request orchestration — say “prepare PR” whenever you want the Git stub.',
    )
  }, [acceptRule, appendChat, setPhase])

  const handlePreparePr = useCallback(async () => {
    if (!state.drl) return
    setBusy(true)
    const ticker = rotateThinking(GENERIC_PR_THINKING, setThinking, 580)
    try {
      const res = await preparePr({ drlContent: state.drl })
      window.clearInterval(ticker)
      await replaySteps(res.thinkingSteps, 280)
      setPrMeta(res.pr.prUrl, res.pr.branch)
      appendChat(
        'assistant',
        `${res.pr.title}\nBranch \`${res.pr.branch}\`\n${res.pr.summary}\n${res.pr.prUrl}`,
      )
    } catch (err) {
      window.clearInterval(ticker)
      appendChat('system', String(err instanceof Error ? err.message : err))
    } finally {
      setThinking(null)
      setBusy(false)
    }
  }, [appendChat, replaySteps, setPrMeta, state.drl])

  const workspaceTitle = () => {
    switch (state.phase) {
      case 'rule-generation':
        return 'DRL authoring'
      case 'pull-request':
        return 'Lifecycle · PR'
      case 'verification':
        return 'Safety · CSV harness'
      case 'simulation':
        return 'Scale · Warehouse simulation'
      case 'insights':
        return 'Fleet insights'
      default:
        return 'Workspace'
    }
  }

  return (
    <div className="app-shell">
      <div className="ambient-glow" aria-hidden />
      <PhaseRail active={state.phase} onSelect={handlePhaseSelect} />
      <main className="workspace">
        <header className="workspace-top glass-panel">
          <WorkflowProgress active={state.phase} onSelect={handlePhaseSelect} />
          <div className="workspace-top-row">
            <div>
              <div className="eyebrow">Project · Refrigerator diagnosis (sample)</div>
              <h1>{workspaceTitle()}</h1>
              <p className="muted tiny">
                Single surface: structured work left, conversational copilot right. Samsung OneUI inspired
                glass treatment.
              </p>
            </div>
            <div className="workspace-top-meta">
              <div className="workspace-top-tools">
                <ThemeToggle />
              </div>
              <div className="badge-row">
                <span className="pill neutral">
                  <Cloud size={13} strokeWidth={2} aria-hidden />
                  Athena · S3
                </span>
                <span className="pill neutral">
                  <Box size={13} strokeWidth={2} aria-hidden />
                  Drools harness
                </span>
                {state.ruleAccepted && (
                  <span className="pill good">
                    <CheckCircle2 size={13} strokeWidth={2} aria-hidden />
                    Rule accepted
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>
        <div className="workspace-body">
          {state.phase === 'rule-generation' && (
            <RuleGeneration
              rows={state.reasoningRows}
              overall={state.overallConfidence}
              compilationStatus={state.compilationStatus}
              drl={state.drl}
              onDrlChange={setDrl}
              accepted={state.ruleAccepted}
              onAcceptContinue={handleAcceptRule}
              busy={busy}
            />
          )}
          {state.phase === 'pull-request' && (
            <PullRequestFlow
              drl={state.drl}
              prUrl={state.prUrl}
              prBranch={state.prBranch}
              merged={state.prMerged}
              onPrepare={handlePreparePr}
              onMerge={() => {
                setPrMerged(true)
                appendChat('assistant', 'PR merged (simulated). Continue to CSV verification whenever ready.')
              }}
              onReject={() => {
                setPrMerged(false)
                appendChat('assistant', 'PR rejected — keep iterating in the PR lane.')
              }}
              busy={busy}
            />
          )}
          {state.phase === 'verification' && (
            <Verification
              csv={state.verificationDraft}
              onCsv={setVerificationDraft}
              busy={busy}
              summary={verifyNotes}
              kpis={verifyKpis}
              onRun={async () => {
                setBusy(true)
                const ticker = rotateThinking(GENERIC_VERIFY_THINKING, setThinking, 560)
                try {
                  const res = await runVerification(state.verificationDraft)
                  window.clearInterval(ticker)
                  await replaySteps(res.thinkingSteps, 260)
                  setVerifyKpis({
                    matchScore: res.matchScore,
                    triggered: res.triggered,
                    notTriggered: res.notTriggered,
                    conditions: res.conditions,
                  })
                  setVerifyNotes(res.notes)
                  setVerification(state.verificationDraft, res.notes)
                  appendChat(
                    'assistant',
                    `Verification complete — match ${(res.matchScore * 100).toFixed(0)}%, ${res.triggered} hits.`,
                  )
                } catch (err) {
                  window.clearInterval(ticker)
                  appendChat('system', String(err instanceof Error ? err.message : err))
                } finally {
                  setThinking(null)
                  setBusy(false)
                }
              }}
            />
          )}
          {state.phase === 'simulation' && (
            <LargeSimulation
              filters={state.simulationFilters}
              onFilters={setSimulationFilters}
              recommendation={simRecommendation}
              onRecommend={async () => {
                setBusy(true)
                const ticker = rotateThinking(GENERIC_SIM_THINKING, setThinking, 640)
                try {
                  const res = await recommendSimulation(state.simulationFilters)
                  window.clearInterval(ticker)
                  await replaySteps(res.thinkingSteps, 270)
                  setSimRecommendation(res)
                  appendChat(
                    'assistant',
                    `Sizing refreshed — ${res.engine} @ ${res.estimatedRecords.toLocaleString()} rows.`,
                  )
                } catch (err) {
                  window.clearInterval(ticker)
                  appendChat('system', String(err instanceof Error ? err.message : err))
                } finally {
                  setThinking(null)
                  setBusy(false)
                }
              }}
              onStartJob={async () => {
                setBusy(true)
                const ticker = rotateThinking(GENERIC_SIM_THINKING, setThinking, 640)
                try {
                  const res = await startLargeSimulation(state.simulationFilters)
                  window.clearInterval(ticker)
                  await replaySteps(res.thinkingSteps, 270)
                  setJobId(res.jobId)
                  appendChat('assistant', `Simulation job ${res.jobId} streaming progress in the workspace.`)
                } catch (err) {
                  window.clearInterval(ticker)
                  appendChat('system', String(err instanceof Error ? err.message : err))
                } finally {
                  setThinking(null)
                  setBusy(false)
                }
              }}
              jobId={state.jobId}
              busy={busy}
            />
          )}
          {state.phase === 'insights' && <InsightsDashboard data={insights} />}
        </div>
      </main>
      <AgentChat messages={state.chat} thinkingLines={thinking} onSend={(t) => void handleSend(t)} />
    </div>
  )
}

export default function App() {
  return (
    <PortalProvider>
      <AppInner />
    </PortalProvider>
  )
}
