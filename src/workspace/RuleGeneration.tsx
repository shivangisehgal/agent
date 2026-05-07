import { FileCode2, TableProperties } from 'lucide-react'
import type { ReasonRow } from '../types'

export function RuleGeneration({
  rows,
  overall,
  compilationStatus,
  drl,
  onDrlChange,
  accepted,
  onAcceptContinue,
  busy,
}: {
  rows: ReasonRow[]
  overall?: number
  compilationStatus?: 'success' | 'warnings'
  drl: string
  onDrlChange: (v: string) => void
  accepted: boolean
  onAcceptContinue: () => void
  busy: boolean
}) {
  return (
    <div className="workspace-grid">
      <section className="glass-panel pad-lg">
        <header className="section-head">
          <div className="section-title-row">
            <TableProperties size={22} strokeWidth={2} className="icon-inline accent" aria-hidden />
            <div>
              <div className="eyebrow">Rule workspace</div>
              <h2>DRL generation & reasoning ledger</h2>
              <p className="muted">
                Each chat turn materializes rows in the ledger and refreshes the draft DRL. Refine in the
                editor or reprompt the agent on the right.
              </p>
            </div>
          </div>
          <div className="stack-right">
            {compilationStatus && (
              <span className={`pill ${compilationStatus === 'success' ? 'good' : 'warn'}`}>
                Compilation · {compilationStatus}
              </span>
            )}
            {overall !== undefined && (
              <span className="pill neutral">Overall confidence · {(overall * 100).toFixed(0)}%</span>
            )}
          </div>
        </header>

        <div className="table-wrap">
          <table className="reason-table">
            <thead>
              <tr>
                <th>#</th>
                <th>English condition</th>
                <th>DRL fragment</th>
                <th>Conf.</th>
                <th>Review</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted center">
                    Ledger updates after the first agent pass.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.conditionNo}>
                    <td>{r.conditionNo}</td>
                    <td>{r.englishCondition}</td>
                    <td>
                      <code className="snippet">{r.drlSnippet}</code>
                    </td>
                    <td>{(r.confidence * 100).toFixed(0)}%</td>
                    <td>{r.needsReview ? 'Yes' : '—'}</td>
                    <td className="muted small">{r.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-panel pad-lg grow">
        <header className="section-head tight">
          <div className="section-title-row">
            <FileCode2 size={20} strokeWidth={2} className="icon-inline accent" aria-hidden />
            <div>
              <div className="eyebrow">Editable rule</div>
              <h3>Live DRL</h3>
            </div>
          </div>
          {accepted && <span className="pill good">Accepted</span>}
        </header>
        <textarea
          className="drl-editor"
          spellCheck={false}
          value={drl}
          onChange={(e) => onDrlChange(e.target.value)}
          placeholder="Generated Drools will appear here…"
        />
        <div className="inline-actions">
          <button
            type="button"
            className="primary"
            disabled={!drl || busy || accepted}
            onClick={onAcceptContinue}
          >
            Accept & continue
          </button>
          <p className="muted tiny">
            Accepting locks the draft for PR orchestration. You can still iterate earlier rows by
            conversing with the agent before accepting.
          </p>
        </div>
      </section>
    </div>
  )
}
