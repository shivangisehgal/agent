import { useState } from 'react'
import { BarChart3, PlayCircle, ShieldCheck, Upload } from 'lucide-react'

export function Verification({ csv, onCsv, onRun, busy, summary, kpis }) {
  const [drag, setDrag] = useState(false)
  return (
    <div className="workspace-grid">
      <section className="glass-panel pad-lg">
        <header className="section-head">
          <div className="section-title-row">
            <ShieldCheck size={22} strokeWidth={2} className="icon-inline accent" aria-hidden />
            <div>
              <div className="eyebrow">Rule verification</div>
              <h2>CSV micro-simulation</h2>
              <p className="muted">
                Hydrate sample telemetry, execute the integrated Kie session, and surface KPI-style
                diagnostics. Wire `POST /api/verify/run` to embedded Drools for fidelity.
              </p>
            </div>
          </div>
        </header>
        <div
          className={`dropzone ${drag ? 'active' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            const f = e.dataTransfer.files[0]
            if (f) void f.text().then(onCsv)
          }}
        >
          <div className="dropzone-inner">
            <Upload size={24} strokeWidth={1.8} className="icon-inline accent" aria-hidden />
            <p>Drop a CSV or paste rows below</p>
          </div>
        </div>
        <textarea className="csv-editor" value={csv} onChange={(e) => onCsv(e.target.value)} />
        <button type="button" className="primary" disabled={busy || !csv.trim()} onClick={() => void onRun()}>
          <span className="btn-with-icon">
            <PlayCircle size={17} className="btn-icon" aria-hidden />
            Run verification
          </span>
        </button>
      </section>

      <section className="glass-panel pad-lg">
        <header className="section-head tight">
          <div className="section-title-row">
            <BarChart3 size={20} strokeWidth={2} className="icon-inline accent" aria-hidden />
            <div>
              <div className="eyebrow">KPI surface</div>
              <h3>Match & trigger profile</h3>
            </div>
          </div>
        </header>
        {kpis ? (
          <div className="kpi-grid">
            <div className="kpi">
              <div className="kpi-label">Match score</div>
              <div className="kpi-value">{(kpis.matchScore * 100).toFixed(0)}%</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Triggered</div>
              <div className="kpi-value">{kpis.triggered}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Not triggered</div>
              <div className="kpi-value">{kpis.notTriggered}</div>
            </div>
            <div className="glass-inset pad-sm">
              <div className="eyebrow">Condition insight</div>
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Cx</th>
                    <th>Pass rate</th>
                    <th>When true</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.conditions.map((c) => (
                    <tr key={c.conditionId}>
                      <td>{c.conditionId}</td>
                      <td>{(c.passRate * 100).toFixed(0)}%</td>
                      <td>{c.avgWhenTrueC}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="muted">Results render after verification completes.</p>
        )}
        {summary && (
          <div className="glass-inset pad-sm spaced-top">
            <div className="eyebrow">Agent insight</div>
            <p>{summary}</p>
          </div>
        )}
      </section>
    </div>
  )
}
