import { useEffect, useState } from 'react'
import { CloudCog, Gauge, Layers, RefreshCw } from 'lucide-react'
import { pollSimulation } from '../api/client'

export function LargeSimulation({
  filters,
  onFilters,
  recommendation,
  onRecommend,
  onStartJob,
  jobId,
  busy,
}: {
  filters: Record<string, string>
  onFilters: (f: Record<string, string>) => void
  recommendation: null | {
    engine: string
    rationale: string
    estimatedRecords: number
    estimatedCostUsd: number
    estimatedMinutes: [number, number]
  }
  onRecommend: () => Promise<void>
  onStartJob: () => Promise<void>
  jobId?: string
  busy: boolean
}) {
  const [status, setStatus] = useState<{
    progress: number
    recordsScanned: number
    stages: Array<{ name: string; status: string }>
  } | null>(null)

  useEffect(() => {
    if (!jobId) return
    const iv = window.setInterval(() => {
      void pollSimulation(jobId)
        .then(setStatus)
        .catch(() => undefined)
    }, 900)
    return () => window.clearInterval(iv)
  }, [jobId])

  function setField(key: string, value: string) {
    onFilters({ ...filters, [key]: value })
  }

  return (
    <div className="workspace-grid stacked">
      <section className="glass-panel pad-lg">
        <header className="section-head">
          <div className="section-title-row">
            <CloudCog size={24} strokeWidth={2} className="icon-inline accent" aria-hidden />
            <div>
              <div className="eyebrow">Simulation config · sample & full align</div>
              <h2>Large-scale Athena / S3 rehearsal</h2>
            <p className="muted">
              Mirrors the multi-step funnel from curated samples to partitioned warehouse scans. Engines,
              costing, and job graph are mediated by `/api/simulation/*`.
            </p>
            </div>
          </div>
          <button type="button" className="ghost" disabled={busy} onClick={() => void onRecommend()}>
            <span className="btn-with-icon">
              <RefreshCw size={15} aria-hidden />
              Refresh sizing
            </span>
          </button>
        </header>
        <div className="form-grid">
          <label className="field">
            Time range start
            <input
              value={filters.timeStart ?? ''}
              onChange={(e) => setField('timeStart', e.target.value)}
              placeholder="2025-01-01"
            />
          </label>
          <label className="field">
            Time range end
            <input
              value={filters.timeEnd ?? ''}
              onChange={(e) => setField('timeEnd', e.target.value)}
               placeholder="2025-11-01"
             />
           </label>
          <label className="field">
            Model code
            <input
              value={filters.modelCode ?? ''}
              onChange={(e) => setField('modelCode', e.target.value)}
               placeholder="RF-B"
             />
           </label>
          <label className="field">
            Country code
            <input
              value={filters.country ?? ''}
              onChange={(e) => setField('country', e.target.value)}
               placeholder="US"
             />
           </label>
          <label className="field">
            Product family
            <input
              value={filters.family ?? ''}
              onChange={(e) => setField('family', e.target.value)}
               placeholder="4-Door Flex"
             />
           </label>
          <label className="field">
            Firmware cohort
            <input
              value={filters.fw ?? ''}
              onChange={(e) => setField('fw', e.target.value)}
               placeholder="1.42.x"
             />
           </label>
        </div>
      </section>

      <section className="split-two">
        <div className="glass-panel pad-lg">
          <div className="kpi-card-head">
            <Gauge size={16} strokeWidth={2} className="icon-inline accent" aria-hidden />
            <div className="eyebrow">Execution recommendation</div>
          </div>
          {recommendation ? (
            <>
              <h3>Suggested engine · {recommendation.engine}</h3>
              <p className="muted">{recommendation.rationale}</p>
              <ul className="stat-list">
                <li>
                  <span className="lbl">Estimated records</span>
                  <span>{recommendation.estimatedRecords.toLocaleString()}</span>
                </li>
                <li>
                  <span className="lbl">Est. Athena cost</span>
                  <span>${recommendation.estimatedCostUsd.toFixed(2)}</span>
                </li>
                <li>
                  <span className="lbl">Wall time band</span>
                  <span>
                    {recommendation.estimatedMinutes[0]}–{recommendation.estimatedMinutes[1]} minutes
                  </span>
                </li>
              </ul>
              <button
                type="button"
                className="primary spaced-top"
                disabled={busy || !recommendation}
                onClick={() => void onStartJob()}
              >
                <span className="btn-with-icon">
                  <Layers size={17} className="btn-icon" aria-hidden />
                  Start large-scale simulation
                </span>
              </button>
            </>
          ) : (
            <p className="muted">Generate a sizing pass to hydrate this card.</p>
          )}
        </div>

        <div className="glass-panel pad-lg">
          <div className="kpi-card-head">
            <RefreshCw size={16} strokeWidth={2} className="icon-inline accent" aria-hidden />
            <div className="eyebrow">Live execution</div>
          </div>
          {jobId && status ? (
            <>
              <div className="progress-wrap">
                <div className="progress-label">
                  Overall progress<span>{Math.round(status.progress)}%</span>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${Math.min(status.progress, 100)}%` }} />
                </div>
              </div>
              <div className="stage-list">
                {status.stages.map((st) => (
                  <div key={st.name} className={`stage ${st.status}`}>
                    <span className="dot" />
                    <div>
                      <div className="name">{st.name}</div>
                      <div className="status muted tiny">{st.status}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="glass-inset pad-sm spaced-top muted tiny">
                Records scanned (partial): ~{Math.floor(status.recordsScanned).toLocaleString()}
              </div>
            </>
          ) : (
            <p className="muted">Start a simulation job — progress streams here.</p>
          )}
        </div>
      </section>
    </div>
  )
}
