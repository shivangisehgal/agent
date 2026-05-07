import { Brain, Check } from 'lucide-react'

export function ThinkingStream({ lines }) {
  if (!lines?.length) return null
  return (
    <div className="thinking-stream glass-inset fade-in">
      <div className="thinking-heading-row">
        <Brain size={14} strokeWidth={2} className="icon-inline accent" aria-hidden />
        <div className="thinking-heading">Thinking process</div>
      </div>
      <ul>
        {lines.map((ln) => (
          <li key={ln.id} className={ln.done ? 'done' : ''}>
            <span className="glyph">
              {ln.done ? (
                <Check size={13} strokeWidth={2.5} aria-hidden />
              ) : (
                <span aria-hidden className="thinking-pending">
                  ⋯
                </span>
              )}
            </span>
            <span>{ln.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
