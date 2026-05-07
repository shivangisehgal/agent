/* eslint-disable react-refresh/only-export-components -- hook colocated with provider */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const initial = {
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

const Ctx = createContext(null)

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function PortalProvider({ children }) {
  const [state, setState] = useState(initial)

  const appendChat = useCallback((role, body) => {
    setState((s) => ({
      ...s,
      chat: [...s.chat, { id: uid(role), role, body, createdAt: Date.now() }],
    }))
  }, [])

  const setPhase = useCallback((phase) => {
    setState((s) => ({ ...s, phase }))
  }, [])

  const setReasoning = useCallback((reasoningRows, overallConfidence, compilationStatus) => {
    setState((s) => ({ ...s, reasoningRows, overallConfidence, compilationStatus }))
  }, [])

  const setDrl = useCallback((drl) => {
    setState((s) => ({ ...s, drl }))
  }, [])

  const acceptRule = useCallback(() => {
    setState((s) => ({ ...s, ruleAccepted: true }))
  }, [])

  const setPrMeta = useCallback((prUrl, prBranch) => {
    setState((s) => ({ ...s, prUrl, prBranch }))
  }, [])

  const setPrMerged = useCallback((prMerged) => {
    setState((s) => ({ ...s, prMerged }))
  }, [])

  const setVerification = useCallback((verificationCsv, verificationSummary) => {
    setState((s) => ({ ...s, verificationCsv, verificationSummary }))
  }, [])

  const setVerificationDraft = useCallback((verificationDraft) => {
    setState((s) => ({ ...s, verificationDraft }))
  }, [])

  const setJobId = useCallback((jobId) => {
    setState((s) => ({ ...s, jobId }))
  }, [])

  const setSimulationFilters = useCallback((simulationFilters) => {
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
