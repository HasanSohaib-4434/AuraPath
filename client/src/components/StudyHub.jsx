import { motion } from 'framer-motion'
import { Bot, Loader2, MessageCircle, Send, Sparkles, User } from 'lucide-react'
import { useEffect, useRef } from 'react'
import FlashcardStudy from './FlashcardStudy.jsx'
import MockInterview from './MockInterview.jsx'
import PomodoroTimer from './PomodoroTimer.jsx'
import StudyGroupPanel from './StudyGroupPanel.jsx'
import VoiceButton from './VoiceButton.jsx'
import ListenButton from './ListenButton.jsx'

const QUICK_PROMPTS = [
  'Summarize the key concepts',
  'What should I learn first?',
  'Quiz me on this material',
  'Explain the hardest topic simply',
]

const StudyHub = ({
  roadmap,
  roadmapId,
  pdfReady,
  pdfFilename,
  pdfChunkCount,
  pdfList = [],
  pdfUploading,
  onUploadClick,
  messages,
  input,
  onInputChange,
  onSend,
  onQuickPrompt,
  sending,
  showSources,
  onShowSourcesChange,
  useStreaming,
  onStreamingChange,
}) => {
  const scrollRef = useRef(null)
  const latestSources =
    [...messages].reverse().find((m) => m.role === 'assistant' && Array.isArray(m.sources) && m.sources.length)?.sources ||
    []

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, sending])

  if (!roadmap) {
    return (
      <div className="glass-card py-20 text-center">
        <MessageCircle className="mx-auto mb-3 h-10 w-10 text-ink-secondary" />
        <p className="text-ink-secondary">Open or create a learning path first.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-primary sm:text-3xl">Study Hub</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Chat with your PDFs, flashcards, and focus timer for <span className="text-primary">{roadmap.title}</span>
        </p>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <PomodoroTimer roadmapId={roadmapId} />
        <FlashcardStudy roadmapId={roadmapId} pdfReady={pdfReady} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <MockInterview roadmapId={roadmapId} />
        <StudyGroupPanel roadmapId={roadmapId} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card space-y-4 p-5"
        >
          <h2 className="text-sm font-semibold text-ink-primary">Study material</h2>
          {pdfReady ? (
            <div className="rounded-xl border border-success/30 bg-success-muted p-4 text-sm">
              <div className="font-medium text-success">PDF indexed</div>
              <div className="mt-1 truncate text-xs text-ink-secondary">{pdfFilename}</div>
              <div className="mt-2 text-xs text-ink-secondary">{pdfChunkCount} searchable sections</div>
              {pdfList.length > 1 ? (
                <ul className="mt-2 space-y-1 text-xs text-ink-secondary">
                  {pdfList.map((p) => (
                    <li key={p.pdfId} className="truncate">
                      {p.label || p.filename}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-ink-secondary">Upload PDFs to enable chat and flashcards from material.</p>
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={onUploadClick}
            disabled={pdfUploading}
            className="btn-secondary w-full"
          >
            {pdfUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pdfUploading ? 'Indexing…' : pdfReady ? 'Add another PDF' : 'Upload PDF'}
          </motion.button>
          <div className="flex items-center justify-between border-t border-subtle pt-4">
            <span className="text-xs text-ink-secondary">Show sources</span>
            <button
              type="button"
              role="switch"
              aria-checked={showSources}
              onClick={() => onShowSourcesChange(!showSources)}
              className={`relative h-7 w-12 rounded-full transition ${showSources ? 'bg-primary' : 'bg-surface-raised'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${showSources ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-secondary">Stream responses</span>
            <button
              type="button"
              role="switch"
              aria-checked={useStreaming}
              onClick={() => onStreamingChange?.(!useStreaming)}
              className={`relative h-7 w-12 rounded-full transition ${useStreaming ? 'bg-primary' : 'bg-surface-raised'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${useStreaming ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card flex min-h-[420px] flex-col overflow-hidden"
        >
          <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {!pdfReady ? (
              <div className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-warning/90">
                Upload a PDF to start asking questions.
              </div>
            ) : messages.length === 0 ? (
              <div className="py-6 text-center">
                <Bot className="mx-auto mb-2 h-8 w-8 text-primary" />
                <p className="mb-4 text-sm text-ink-secondary">Try a quick prompt:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS.map((p) => (
                    <motion.button
                      key={p}
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      disabled={sending}
                      onClick={() => onQuickPrompt(p)}
                      className="chip"
                    >
                      {p}
                    </motion.button>
                  ))}
                </div>
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
                    m.role === 'user' ? 'bg-primary-muted text-primary' : 'bg-surface-raised text-primary'
                  }`}
                >
                  {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === 'user'
                      ? 'chat-bubble-user'
                      : 'chat-bubble-assistant'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {typeof m.content === 'string' ? m.content : m.content == null ? '' : String(m.content)}
                  </div>
                  {m.role === 'assistant' && m.content && !m.streaming ? (
                    <ListenButton text={m.content} messageKey={`msg-${i}`} className="text-ink-secondary hover:text-primary" />
                  ) : null}
                </div>
              </motion.div>
            ))}
            {sending ? (
              <div className="flex items-center gap-2 text-ink-secondary">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <Sparkles className="h-3.5 w-3.5" />
                Searching your material…
              </div>
            ) : null}
          </div>
          {showSources && latestSources.length ? (
            <div className="max-h-32 shrink-0 overflow-y-auto border-t border-subtle bg-surface/50 px-4 py-2">
              <div className="mb-1 text-xs font-medium text-ink-secondary">Sources</div>
              {latestSources.map((s, j) => (
                <div key={j} className="mb-2 text-xs text-ink-secondary line-clamp-2">
                  {s.text}
                </div>
              ))}
            </div>
          ) : null}
          <form
            className="border-t border-subtle p-4"
            onSubmit={(e) => {
              e.preventDefault()
              onSend()
            }}
          >
            <div className="flex gap-2">
              <VoiceButton onTranscript={(t) => onInputChange(input ? `${input} ${t}` : t)} disabled={!pdfReady || sending} />
              <input
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Ask AuraPath…"
                disabled={!pdfReady || sending}
                className="input-field min-w-0 flex-1 py-2.5"
              />
              <motion.button
                type="submit"
                disabled={!pdfReady || sending || !input.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-3.5 py-2.5 text-on-primary disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default StudyHub
