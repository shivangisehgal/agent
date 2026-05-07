import { useState } from 'react'
import { GitMerge, GitPullRequest, XCircle } from 'lucide-react'

export function PullRequestFlow({
  drl: _drl,
  prUrl,
  prBranch,
  merged,
  onPrepare,
  onMerge,
  onReject,
  busy,
}) {
  const [localBusy, setLocalBusy] = useState(false)
  async function clickPrepare() {
    setLocalBusy(true)
    try {
      await onPrepare()
    } finally {
      setLocalBusy(false)
    }
  }
  const spin = busy || localBusy
  return (
    <div className="workspace-grid single">
      <section className="glass-panel pad-lg">
        <header className="section-head">
          <div className="section-title-row">
            <GitPullRequest size={22} strokeWidth={2} className="icon-inline accent" aria-hidden />
            <div>
              <div className="eyebrow">GitHub / eCode</div>
              <h2>Generated pull request</h2>
              <p className="muted">
                Backend issues real PR calls when `GITHUB_TOKEN` and repository metadata are configured.
                Today the API returns a high-fidelity stub you can wire to your org.
              </p>
            </div>
          </div>
        </header>

        {!prUrl ? (
          <div className="cta-card">
            <p className="muted">
              The agent will diff your accepted DRL into `diagnosis-simulation`, assign reviewers, and
              attach CI labels for Drools compile + smoke simulation.
            </p>
            <button type="button" className="primary" disabled={!_drl || spin} onClick={() => void clickPrepare()}>
              <span className="btn-with-icon">
                <GitPullRequest size={16} className="btn-icon" aria-hidden />
                Generate pull request
              </span>
            </button>
          </div>
        ) : (
          <div className="pr-card">
            <div className="pr-row">
              <span className="pill neutral">{prBranch}</span>
              {merged === true && <span className="pill good">Merged</span>}
              {merged === false && <span className="pill warn">Rejected</span>}
            </div>
            <h3>Automated rule scaffold</h3>
            <p className="muted">
              Adds rule block, fact imports, and harness registration. Link opens the compare view for
              your enterprise Git host.
            </p>
            <a className="linkish" href={prUrl} target="_blank" rel="noreferrer">
              {prUrl}
            </a>
            <div className="inline-actions">
              <button type="button" className="primary" disabled={merged !== null} onClick={onMerge}>
                <span className="btn-with-icon">
                  <GitMerge size={16} className="btn-icon" aria-hidden />
                  Accept & merge
                </span>
              </button>
              <button type="button" className="ghost" disabled={merged !== null} onClick={onReject}>
                <span className="btn-with-icon">
                  <XCircle size={16} aria-hidden />
                  Reject
                </span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
