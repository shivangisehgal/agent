import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import OpenAI from 'openai'

const app = express()
app.use(cors())
app.use(express.json({ limit: '4mb' }))

const MOCK_DRL = `package com.samsung.dx.diagnosis.rules;

import com.samsung.dx.facts.RefrigeratorFact;

rule "RD-411_FreezerThermalAbnormal_v1"
when
    $f : RefrigeratorFact(
        deviceType == "REFRIGERATOR",
        dataCompletenessScore >= 0.85,
        freezerTempAvgCelsius > freezeThresholdHighCelsius,
        durationAboveThresholdMinutes >= 120
    )
then
    $f.setDiagnosisCode("RD-411");
    $f.setSeverity("HIGH");
    $f.setSummary("Freezer compartment thermal excursion sustained beyond policy window.");
end
`

function mockReasoning(prompt: string) {
  const p = prompt.toLowerCase()
  const hasTemp =
    p.includes('temp') || p.includes('°') || p.includes('freezer') || p.includes('thermal')
  const rows = [
    {
      conditionNo: 'C1',
      englishCondition: hasTemp
        ? 'Freezer average temperature exceeds model-specific high threshold'
        : 'Primary sensor anomaly window detected from natural language mapping',
      drlSnippet:
        'freezerTempAvgCelsius > freezeThresholdHighCelsius\n        durationAboveThresholdMinutes >= 120',
      confidence: hasTemp ? 0.93 : 0.78,
      needsReview: !hasTemp,
      notes:
        hasTemp
          ? 'Confirm OEM threshold table aligns with SKU family RD-411 targets.'
          : 'Ambiguous wording — recommend door-open heuristic or completeness guard.',
    },
    {
      conditionNo: 'C2',
      englishCondition:
        'Data completeness guardrail to avoid diagnosing on sparse telemetry bursts',
      drlSnippet: 'dataCompletenessScore >= 0.85',
      confidence: 0.87,
      needsReview: false,
      notes: 'Matches platform default; adjust if SKU reports slowly.',
    },
  ]
  return {
    thinkingSteps: [
      'Translating unstructured policy language into guarded LHS fragments',
      'Aligning thresholds with RefrigeratorFact telemetry schema bindings',
      'Simulating Kie compiler output for harness import graph',
      'Scoring calibrated confidence vs historical RD-411 baselines',
    ],
    reasoningTable: rows,
    drl: MOCK_DRL,
    overallConfidence: rows.reduce((a, r) => a + r.confidence, 0) / rows.length,
    compilationStatus: 'success' as const,
    aiMessage:
      rows[0]?.needsReview === true
        ? 'Mapped your statement into draft DRL with two guarding conditions. C1 confidence is conservative until we pin the exact freezer threshold wording.'
        : 'Extracted freezer thermal excursion with dwell time from your wording. Guards include completeness and SKU-aware thresholds referenced as fact fields.',
  }
}

async function generateRuleWithAi(userMessage: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY missing')
  const openai = new OpenAI({ apiKey })
  const sys = `You are a senior Drools (DRL) engineer for connected appliances.
Return ONLY valid JSON with this shape (no markdown):
{
  "reasoningTable": [{"conditionNo":"C1","englishCondition":"string","drlSnippet":"string","confidence":0-1,"needsReview":boolean,"notes":"string"}],
  "drl":"full DRL file string with escaped newlines as \\n",
  "overallConfidence": 0-1,
  "compilationStatus":"success"|"warnings",
  "thinkingSteps":["string"],
  "aiMessage":"short assistant reply"
}
Facts class is RefrigeratorFact with typical fields deviceType freezerTempAvgCelsius durationAboveThresholdMinutes dataCompletenessScore diagnosis fields setters.`

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    temperature: 0.2,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: userMessage },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  }
  const parsed = JSON.parse(text) as {
    reasoningTable: unknown
    drl: string
    overallConfidence: number
    compilationStatus: 'success' | 'warnings'
    thinkingSteps?: string[]
    aiMessage: string
  }
  if (!parsed.thinkingSteps?.length) {
    parsed.thinkingSteps = [
      'Iterating Drools LHS under strict JSON grammar',
      'Cross-checking fact model against latest simulation harness HEAD',
      'Estimating lexical alignment between prompt clauses and predicates',
    ]
  }
  return parsed
}

app.post('/api/rules/generate', async (req, res) => {
  try {
    const lastUser =
      (req.body.messages as Array<{ role: string; content: string }> | undefined)?.filter(
        (m) => m.role === 'user',
      ).pop()?.content ??
      req.body.prompt ??
      ''
    if (!lastUser) {
      res.status(400).json({ error: 'messages or prompt required' })
      return
    }

    if (process.env.OPENAI_API_KEY) {
      const gen = await generateRuleWithAi(lastUser)
      const drlDecoded = gen.drl.replace(/\\n/g, '\n')
      res.json({ ...gen, drl: drlDecoded })
      return
    }

    const mock = mockReasoning(lastUser)
    await new Promise((r) => setTimeout(r, 600))
    res.json(mock)
  } catch (e) {
    console.error(e)
    res.status(500).json({
      error: 'rule_generation_failed',
      detail: e instanceof Error ? e.message : String(e),
    })
  }
})

app.post('/api/github/prepare-pr', async (req, res) => {
  const steps = [
    'Parsing DRL artifact and hashing package namespace',
    'Deriving deterministic branch diag/rule-rd411-' + Math.random().toString(36).slice(2, 8),
    'Generating unified diff against origin/main baseline',
    'Opening GitHub Codespaces preflight (stub integration)',
    'Creating pull request scaffold with reviewers + CI labels',
  ]
  await new Promise((r) => setTimeout(r, 900))
  const branch =
    req.body.branchName ?? `feat/diag-rd411-${Math.random().toString(36).slice(2, 7)}`
  res.json({
    thinkingSteps: steps,
    pr: {
      title: `[diag] Automated rule scaffold — RD-411 series`,
      branch,
      prUrl:
        req.body.enterprise === true
          ? `https://github.example.internal/org/simulation/pull/compare/${branch}`
          : `https://github.com/your-org/diagnosis-simulation/compare/${branch}`,
      summary:
        'Adds RefrigeratorFact bindings, RD-411 rule block, imports for simulation harness. CI: drools-compile + simulation-smoke.',
    },
  })
})

app.post('/api/verify/run', async (req, res) => {
  const csv: string = req.body.csv ?? ''
  const rows = csv
    .split(/\r?\n/)
    .map((line) => line.split(','))
    .filter((c) => c.length > 2)
  const simulated = rows.length ? Math.floor(rows.length * 0.28) : 14
  const total = rows.length || 52
  res.json({
    matchScore: 0.84,
    triggered: simulated,
    notTriggered: Math.max(total - simulated, 0),
    conditions: [
       { conditionId: 'C1', passRate: 0.71, avgWhenTrueC: '-7.8°C median spike' },
       { conditionId: 'C2', passRate: 0.93, avgWhenTrueC: 'n/a' },
     ],
    notes:
      'Heuristic KPIs computed from CSV row density and synthetic firing model (stub). Wire to embedded Drools for production.',
    thinkingSteps: [
      'Tokenizing telemetry CSV rows by device/session keys',
      'Hydrating RefrigeratorFact objects with column mapping',
      'Executing rule session in ephemeral KieContainer',
      'Aggregating aggregates for condition-level KPIs',
    ],
  })
})

app.post('/api/simulation/recommend', async (_req, res) => {
  res.json({
    engine: 'Athena',
    rationale:
      '~2.1M rows for selected window; partitioned by dt=YYYY-MM-DD; projection covers required sensors.',
    estimatedRecords: 2_089_442,
    estimatedCostUsd: 12.42,
    estimatedMinutes: [18, 25],
    thinkingSteps: [
      'Estimating parquet scan cardinality from Glue catalog partitions',
      'Pricing AWS Athena GB-scanned × historical compression ratio',
      'Benchmarking Kie session fan-out feasibility vs batch micro-batches',
    ],
  })
})

const jobs = new Map<
  string,
  { progress: number; stages: { name: string; status: string }[] }
>()

app.post('/api/simulation/start', async (req, res) => {
  const jobId = 'job-' + Math.random().toString(36).slice(2, 11)
  jobs.set(jobId, {
    progress: 12,
    stages: [
      { name: 'Planning', status: 'done' },
      { name: 'Data preparation', status: 'running' },
      { name: 'Rule execution', status: 'queued' },
      { name: 'Post-aggregation', status: 'queued' },
    ],
  })

  let p = 12
  const tick = () => {
    const j = jobs.get(jobId)
    if (!j) return
    p = Math.min(100, p + Math.floor(Math.random() * 8) + 3)
    j.progress = p
    if (p > 42) j.stages[1].status = 'done'
    if (p > 42) j.stages[2].status = 'running'
    if (p > 78) j.stages[2].status = 'done'
    if (p > 78) j.stages[3].status = 'running'
    if (p >= 100) {
      j.stages[3].status = 'done'
      clearInterval(iv)
    }
  }
  const iv = setInterval(tick, 1100)

  res.json({
    jobId,
    outputPrefix: req.body.outputPrefix ?? 's3://dx-sim-results/' + jobId + '/',
    thinkingSteps: [
      'Publishing execution graph to orchestrator',
      'Materializing Athena UNLOAD staging paths',
       'Hydrating KieSession pool for rule fan-out batches',
      'Emitting Prometheus counters for SLA tracking',
    ],
  })
})

app.get('/api/simulation/status/:jobId', (req, res) => {
  const j = jobs.get(req.params.jobId)
  if (!j) {
    res.status(404).json({ error: 'unknown_job' })
    return
  }
  res.json({
    progress: j.progress,
    recordsScanned: 24_687_532 * (j.progress / 100),
    stages: j.stages,
  })
})

app.get('/api/insights/chart-data', (_req, res) => {
  res.json({
    kpis: {
      totalDiagnosed: 184_921,
      diagnosisRate: 0.112,
      trendPct: 12.5,
      dataCompleteness: 0.907,
    },
    diagnosisTrend: [
      { t: 'W45', diagnosed: 12000 },
      { t: 'W46', diagnosed: 12800 },
      { t: 'W47', diagnosed: 13550 },
      { t: 'W48', diagnosed: 14220 },
       { t: 'W49', diagnosed: 15100 },
       { t: 'W50', diagnosed: 16340 },
       { t: 'W51', diagnosed: 16890 },
    ],
    modelOverlap: [
      { model: 'RF-A', share: 0.31 },
       { model: 'RF-B', share: 0.24 },
       { model: 'RF-C', share: 0.19 },
       { model: 'RF-D', share: 0.15 },
       { model: 'Other', share: 0.11 },
     ],
    topRegions: [
      { region: 'US', pct: 0.38 },
       { region: 'CA', pct: 0.12 },
       { region: 'MX', pct: 0.09 },
       { region: 'EU', pct: 0.22 },
       { region: 'APAC', pct: 0.19 },
     ],
    numericConditionStats: {
      freezerTemp_when_C1_true: { min: 4.5, max: 18.2, median: 10.9, suggestedThresholdDraft: '9.8°C adaptive' },
    },
    sqlSourceLabels: {
      diagnosisTrend: 'SELECT week, SUM(diagnosed) ... FROM mart.dx_rule_hits PARTITION (dt)...',
       modelOverlap: 'SELECT model_code, COUNT(*) ... JOIN dim.product ...',
     },
    aiNarrative:
      'Condition C1 dominates northern regions during summer firmware cohorts — consider tightening dwell time before promoting threshold drafts.',
   })
 })

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, () => {
  console.log(`API listening on ${PORT}`)
})
