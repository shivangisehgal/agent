import { useEffect, useRef, useState } from 'react'
import { Bot, Send, Sparkles, User } from 'lucide-react'
import { ThinkingStream } from './ThinkingStream.jsx'

export function AgentChat({ messages, thinkingLines, onSend }) {
  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinkingLines])

  async function submit() {
    const t = draft.trim()
    if (!t) return
    setDraft('')
    await onSend(t)
  }

  return (
    <aside className="chat-rail glass-panel">
      <header className="chat-header">
        <div className="chat-header-row">
          <span className="icon-inline accent" aria-hidden>
            <Sparkles size={18} strokeWidth={2} />
          </span>
          <div>
            <div className="eyebrow">Copilot lane</div>
            <strong>Unified agent dialogue</strong>
          </div>
        </div>
        <span className="pulse-dot" aria-hidden />
      </header>
      <ThinkingStream lines={thinkingLines} />
      <div className="chat-scroll" ref={scrollRef}>
        {messages.map((m) => (
          <article key={m.id} className={`bubble ${m.role}`}>
            <div className="bubble-meta">
              <span className="bubble-role">
                {m.role === 'user' ? (
                  <>
                    <User size={11} strokeWidth={2} className="bubble-icon" aria-hidden /> You
                  </>
                ) : m.role === 'assistant' ? (
                  <>
                    <Bot size={11} strokeWidth={2} className="bubble-icon" aria-hidden /> Agent
                  </>
                ) : (
                  <>
                    <Sparkles size={11} strokeWidth={2} className="bubble-icon" aria-hidden /> System
                  </>
                )}
              </span>
            </div>
            <p className="bubble-body">{m.body}</p>
          </article>
        ))}
      </div>
      <footer className="chat-composer">
        <textarea
          rows={3}
          placeholder="Steer the workflow in natural language…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void submit()
            }
          }}
        />
        <button type="button" className="primary wide" onClick={() => void submit()}>
          <span className="btn-with-icon">
            <Send size={16} strokeWidth={2} className="btn-icon" aria-hidden />
            Send to agent
          </span>
        </button>
      </footer>
    </aside>
  )
}
