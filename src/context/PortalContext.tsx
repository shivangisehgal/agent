/* eslint-disable react-refresh/only-export-components -- hook colocated with provider */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ChatMessage, ReasonRow, WorkflowPhase } from '../types'

export interface PortalState {
  phase: WorkflowPhase
  chat: ChatMessage[]
  reasoningRows: ReasonRow[]
  overallConfidence?: number
  compilationStatus?: 'success' | 'warnings'
  drl: string
  ruleAccepted: boolean
  prUrl?: string
  prBranch?: string
  prMerged: boolean | null
  verificationCsv?: string
  verificationDraft: string
  verificationSummary?: string
  jobId?: string
  simulationFilters: Record<string, string>
}

const initial: PortalState = {
  phase: 'rule-generation',
  chat: [
    {
      id: 'seed',
      role: 'assistant',
      body: 'Describe the diagnosis in plain language. I will emit DRL, a reasoning ledger, and confidence for each structuring pass.',
      createdAt: Date.now(),
    },
  ],
  reasoningRows: [],
  drl: '',
  ruleAccepted: false,
  prMerged: null,
  verificationDraft:
    'device_id,week,freezer_temp_c,data_completeness\n' +
    'abcd-111,W48,11.8,0.91\n' +
    'abcd-112,W49,10.9,0.88\n',
  simulationFilters: {
    timeStart: '2025-01-05',
    timeEnd: '2025-11-01',
    modelCode: 'RF-B',
    country: 'US',
    family: '4-Door Flex',
    fw: '1.42-stable',
  },
}

interface PortalCtx {
  state: PortalState
  setPhase: (p: WorkflowPhase) => void
  appendChat: (role: ChatMessage['role'], body: string) => void
  setReasoning: (rows: ReasonRow[], overall: number, status: PortalState['compilationStatus']) => void
  setDrl: (d: string) => void
  acceptRule: () => void
  setPrMeta: (url: string, branch: string) => void
  setPrMerged: (v: boolean) => void
  setVerification: (csv: string, summary: string) => void
  setVerificationDraft: (csv: string) => void
  setJobId: (id?: string) => void
  setSimulationFilters: (f: Record<string, string>) => void
}

const Ctx = createContext<PortalCtx | null>(null)

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function PortalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortalState>(initial)

  const appendChat = useCallback((role: ChatMessage['role'], body: string) => {
    setState((s) => ({
      ...s,
      chat: [...s.chat, { id: uid(role), role, body, createdAt: Date.now() }],
    }))
  }, [])

  const setPhase = useCallback((phase: WorkflowPhase) => {
    setState((s) => ({ ...s, phase }))
  }, [])

  const setReasoning = useCallback(
    (reasoningRows: ReasonRow[], overallConfidence: number, compilationStatus?: PortalState['compilationStatus']) => {
      setState((s) => ({ ...s, reasoningRows, overallConfidence, compilationStatus }))
    },
    [],
  )

  const setDrl = useCallback((drl: string) => {
    setState((s) => ({ ...s, drl }))
  }, [])

  const acceptRule = useCallback(() => {
    setState((s) => ({ ...s, ruleAccepted: true }))
  }, [])

  const setPrMeta = useCallback((prUrl: string, prBranch: string) => {
    setState((s) => ({ ...s, prUrl, prBranch }))
  }, [])

  const setPrMerged = useCallback((prMerged: boolean) => {
    setState((s) => ({ ...s, prMerged }))
  }, [])

  const setVerification = useCallback((verificationCsv: string, verificationSummary: string) => {
    setState((s) => ({ ...s, verificationCsv, verificationSummary }))
  }, [])

  const setVerificationDraft = useCallback((verificationDraft: string) => {
    setState((s) => ({ ...s, verificationDraft }))
  }, [])

  const setJobId = useCallback((jobId?: string) => {
    setState((s) => ({ ...s, jobId }))
  }, [])

  const setSimulationFilters = useCallback((simulationFilters: Record<string, string>) => {
    setState((s) => ({ ...s, simulationFilters }))
  }, [])

  const value = useMemo(
    () => ({
      state,
      setPhase,
      appendChat,
      setReasoning,
      setDrl,
      acceptRule,
      setPrMeta,
      setPrMerged,
      setVerification,
      setVerificationDraft,
      setJobId,
      setSimulationFilters,
    }),
    [
      state,
      setPhase,
      appendChat,
      setReasoning,
      setDrl,
      acceptRule,
      setPrMeta,
      setPrMerged,
      setVerification,
      setVerificationDraft,
      setJobId,
      setSimulationFilters,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePortal() {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePortal requires provider')
  return v
}
