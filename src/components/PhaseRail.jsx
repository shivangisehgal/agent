import { BarChart3, Cloud, Code2, FileCheck, GitBranch } from 'lucide-react'

const STEPS = [
  { id: 'rule-generation', label: 'DRL gen', hint: 'NL → rule + ledger', Icon: Code2 },
  { id: 'pull-request', label: 'PR', hint: 'GitHub / eCode', Icon: GitBranch },
  { id: 'verification', label: 'Verify', hint: 'CSV micro-run', Icon: FileCheck },
  { id: 'simulation', label: 'Scale', hint: 'Athena / S3', Icon: Cloud },
  { id: 'insights', label: 'Insights', hint: 'Fixed SQL charts', Icon: BarChart3 },
]

export function PhaseRail({ active, onSelect }) {
  return (
    <nav className="phase-rail glass-panel" aria-label="Workflow">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden />
        <div>
          <div className="brand-title">Simulation Agent</div>
          <div className="brand-sub">OneUI glass shell</div>
        </div>
      </div>
      <ol>
        {STEPS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={s.id === active ? 'phase-btn active' : 'phase-btn'}
              onClick={() => onSelect(s.id)}
            >
              <span className="idx" aria-hidden>
                <s.Icon size={15} strokeWidth={2} className="phase-btn-icon" />
              </span>
              <span className="txt">
                <span className="lbl">{s.label}</span>
                <span className="hnt">{s.hint}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
