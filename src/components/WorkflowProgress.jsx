import { Fragment } from 'react'
import { Route } from 'lucide-react'

const PHASE_ORDER = [
  'rule-generation',
  'pull-request',
  'verification',
  'simulation',
  'insights',
]

const LABELS = {
  'rule-generation': { short: 'DRL', full: 'Rule generation' },
  'pull-request': { short: 'PR', full: 'Pull request' },
  verification: { short: 'Verify', full: 'Verification' },
  simulation: { short: 'Scale', full: 'Large-scale simulation' },
  insights: { short: 'Insights', full: 'Insights & charts' },
}

export function WorkflowProgress({ active, onSelect }) {
  const activeIdx = Math.max(0, PHASE_ORDER.indexOf(active))
  const pct =
    PHASE_ORDER.length <= 1 ? 100 : Math.round((activeIdx / (PHASE_ORDER.length - 1)) * 100)

  return (
    <div className="workflow-progress glass-inset" aria-label="End-to-end workflow progress">
      <div className="workflow-progress-head">
        <span className="workflow-progress-head-row">
          <Route size={14} strokeWidth={2} className="icon-inline accent" aria-hidden />
          <span className="eyebrow">End-to-end progress</span>
        </span>
        <span className="workflow-progress-pct" aria-hidden>
          {pct}%
        </span>
      </div>
      <div
        className="workflow-progress-bar"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`Step ${activeIdx + 1} of ${PHASE_ORDER.length}, ${pct}% along pipeline`}
      >
        <span className="workflow-progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="workflow-progress-track">
        {PHASE_ORDER.map((phase, i) => {
          const status = i < activeIdx ? 'done' : i === activeIdx ? 'current' : 'upcoming'
          const label = LABELS[phase]
          const node = (
            <span key={phase} className={`workflow-progress-node-wrap ${status}`}>
              {onSelect ? (
                <button
                  type="button"
                  className="workflow-progress-node"
                  title={label.full}
                  onClick={() => onSelect(phase)}
                  aria-current={status === 'current' ? 'step' : undefined}
                >
                  <span className="workflow-progress-index" aria-hidden>
                    {i < activeIdx ? '✓' : i + 1}
                  </span>
                  <span className="workflow-progress-label">{label.short}</span>
                </button>
              ) : (
                <span className="workflow-progress-node" title={label.full}>
                  <span className="workflow-progress-index" aria-hidden>
                    {i < activeIdx ? '✓' : i + 1}
                  </span>
                  <span className="workflow-progress-label">{label.short}</span>
                </span>
              )}
            </span>
          )
          const dash =
            i > 0 ? (
              <span
                key={`dash-${phase}`}
                className={`workflow-progress-dash ${i <= activeIdx ? 'filled' : ''}`}
                aria-hidden
              />
            ) : null
          return (
            <Fragment key={phase}>
              {dash}
              {node}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
