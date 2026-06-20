import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Bot, Loader2, MessageCircle, PanelRightClose, Send, Sparkles, User } from 'lucide-react'

const AIChatPanel = ({
  open,
  onClose,
  messages,
  input,
  onInputChange,
  onSend,
  sending,
  pdfReady,
  showSources,
  onShowSourcesChange,
}) => {
  const latestSources =
    [...messages].reverse().find((m) => m.role === 'assistant' && Array.isArray(m.sources) && m.sources.length)?.sources ||
    []

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close overlay"
            className="fixed inset-0 z-[9998] bg-surface/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed top-0 right-0 z-[9999] flex h-full w-full max-w-md flex-col border-l border-surface-border bg-surface shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
          >
            <div className="border-b border-surface-border bg-gradient-to-r from-lumina-500/10 to-emerald-500/5 px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lumina-500 to-lumina-700 shadow-glow-sm">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">Study assistant</div>
                    <div className="text-xs text-zinc-500">Ask anything about your PDF</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 text-zinc-400 transition hover:bg-surface-elevated hover:text-zinc-100"
                  aria-label="Close panel"
                >
                  <PanelRightClose className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-surface-border/80 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Show source passages
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showSources}
                onClick={() => onShowSourcesChange(!showSources)}
                className={`relative h-7 w-12 rounded-full transition ${showSources ? 'bg-lumina-600' : 'bg-surface-elevated'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${showSources ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
              {!pdfReady ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
                  Upload a study PDF on your roadmap first — then you can ask questions here.
                </div>
              ) : messages.length === 0 ? (
                <div className="rounded-xl border border-surface-border bg-surface-card/80 px-4 py-6 text-center">
                  <Bot className="mx-auto mb-2 h-8 w-8 text-lumina-400" />
                  <p className="text-zinc-400">Try: &quot;Summarize chapter 1&quot; or &quot;What should I focus on first?&quot;</p>
                </div>
              ) : null}
              {messages.map((m, i) => (
                <motion.div
                  key={`${i}-${m.role}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      m.role === 'user' ? 'bg-lumina-600/30 text-lumina-300' : 'bg-surface-elevated text-emerald-400'
                    }`}
                  >
                    {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                      m.role === 'user'
                        ? 'bg-gradient-to-br from-lumina-600 to-lumina-700 text-white'
                        : 'border border-surface-border bg-surface-card text-zinc-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  </div>
                </motion.div>
              ))}
              {sending ? (
                <div className="flex items-center gap-2 text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin text-lumina-400" />
                  Finding answers in your PDF…
                </div>
              ) : null}
            </div>
            {showSources && latestSources.length ? (
              <div className="max-h-44 shrink-0 overflow-y-auto border-t border-surface-border bg-surface-card/50 px-4 py-3">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Sources used</div>
                <ul className="space-y-2">
                  {latestSources.map((s, j) => (
                    <li key={`src-${j}`} className="rounded-lg border border-surface-border bg-surface/80 px-3 py-2 text-xs">
                      {typeof s.score === 'number' ? (
                        <span className="font-medium text-lumina-400">Match · {s.score}</span>
                      ) : null}
                      <div className="mt-1 line-clamp-3 text-zinc-400">{s.text || ''}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <form
              className="border-t border-surface-border bg-surface-card/30 p-4"
              onSubmit={(e) => {
                e.preventDefault()
                onSend()
              }}
            >
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  placeholder="Ask a question about your material…"
                  disabled={!pdfReady || sending}
                  className="input-field min-w-0 flex-1 py-2.5 disabled:opacity-50"
                />
                <motion.button
                  type="submit"
                  disabled={!pdfReady || sending || !input.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-lumina-600 to-lumina-500 px-3.5 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              </div>
            </form>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

export default AIChatPanel
