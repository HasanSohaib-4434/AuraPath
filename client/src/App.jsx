import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Brain, Map, Sparkles, Target } from 'lucide-react'
import AIChatPanel from './components/AIChatPanel.jsx'
import GoalInput from './components/GoalInput.jsx'
import RoadmapView from './components/RoadmapView.jsx'

const STEPS = [
  { icon: Target, label: 'Set goal', desc: 'Choose what to learn' },
  { icon: Map, label: 'Get roadmap', desc: 'AI builds your path' },
  { icon: BookOpen, label: 'Study & ask', desc: 'Upload PDFs, chat with AI' },
]

const App = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [roadmap, setRoadmap] = useState(null)
  const [pdfUploading, setPdfUploading] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const [pdfReady, setPdfReady] = useState(false)
  const [pdfFilename, setPdfFilename] = useState('')
  const [pdfChunkCount, setPdfChunkCount] = useState(0)
  const [chatOpen, setChatOpen] = useState(false)
  const [showSources, setShowSources] = useState(false)
  const [askMessages, setAskMessages] = useState([])
  const [askInput, setAskInput] = useState('')
  const [askSending, setAskSending] = useState(false)

  const resetPdfState = () => {
    setPdfUploading(false)
    setPdfError('')
    setPdfReady(false)
    setPdfFilename('')
    setPdfChunkCount(0)
    setChatOpen(false)
    setShowSources(false)
    setAskMessages([])
    setAskInput('')
  }

  const generate = async ({ goal, duration }) => {
    setLoading(true)
    setError('')
    setRoadmap(null)
    resetPdfState()
    try {
      const res = await fetch('/api/roadmaps/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, duration }),
      })
      const raw = await res.text()
      const data = raw ? JSON.parse(raw) : null
      if (!res.ok) throw new Error(data?.error || 'Request failed')
      setRoadmap(data)
    } catch (e) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const roadmapId = roadmap?._id ? String(roadmap._id) : ''

  const handlePdfFile = async (file) => {
    if (!roadmapId || !file) return
    setPdfUploading(true)
    setPdfError('')
    setPdfReady(false)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/roadmaps/${roadmapId}/pdf`, { method: 'POST', body: fd })
      const raw = await res.text()
      const data = raw ? JSON.parse(raw) : null
      if (!res.ok) throw new Error(data?.error || 'Upload failed')
      setPdfReady(true)
      setPdfFilename(data?.filename || file.name)
      setPdfChunkCount(Number(data?.chunkCount) || 0)
    } catch (e) {
      setPdfError(e?.message || 'Upload failed')
      setPdfReady(false)
    } finally {
      setPdfUploading(false)
    }
  }

  const handleChatSend = async () => {
    const q = askInput.trim()
    if (!q || !roadmapId || askSending || !pdfReady) return
    const history = askMessages.slice(-3).map(({ role, content }) => ({ role, content }))
    setAskMessages((m) => [...m, { role: 'user', content: q }])
    setAskInput('')
    setAskSending(true)
    try {
      const res = await fetch(`/api/roadmaps/${roadmapId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, history }),
      })
      const raw = await res.text()
      const data = raw ? JSON.parse(raw) : null
      if (!res.ok) throw new Error(data?.error || 'Chat failed')
      setAskMessages((m) => [
        ...m,
        { role: 'assistant', content: data?.reply || '', sources: Array.isArray(data?.sources) ? data.sources : [] },
      ])
    } catch (e) {
      setAskMessages((m) => [...m, { role: 'assistant', content: e?.message || 'Error', sources: [] }])
    } finally {
      setAskSending(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-surface-border/60 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-lumina-500 to-emerald-500 shadow-glow-sm">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-100">
              Lumina<span className="text-lumina-400">.</span>
            </span>
          </div>
          <div className="hidden items-center gap-1 rounded-full border border-surface-border bg-surface-card/60 px-3 py-1.5 text-xs text-zinc-400 sm:flex">
            <Sparkles className="h-3.5 w-3.5 text-lumina-400" />
            AI-powered learning
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:pt-12">
        {!roadmap ? (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-10 text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-lumina-500/30 bg-lumina-500/10 px-4 py-1.5 text-xs font-medium text-lumina-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Your personal learning architect
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-4xl font-bold tracking-tight sm:text-5xl"
            >
              <span className="text-gradient">Learn smarter,</span>
              <br />
              <span className="text-zinc-100">not harder.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mt-4 max-w-lg text-base text-zinc-400"
            >
              Generate a structured curriculum, track your progress, and ask questions about your study materials — all in one place.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3"
            >
              {STEPS.map(({ icon: Icon, label, desc }, i) => (
                <div
                  key={label}
                  className="glass-card group flex flex-col items-center p-4 text-center transition hover:border-lumina-500/30"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated text-lumina-400 transition group-hover:bg-lumina-500/15 group-hover:text-lumina-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-semibold text-zinc-200">{label}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">{desc}</div>
                  <div className="mt-2 text-xs font-medium text-lumina-500/80">Step {i + 1}</div>
                </div>
              ))}
            </motion.div>
          </motion.section>
        ) : null}

        <GoalInput loading={loading} onSubmit={generate} />

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto mt-8 max-w-md text-center"
          >
            <div className="glass-card p-6">
              <div className="mx-auto mb-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-lumina-600 via-lumina-400 to-emerald-400"
                  initial={{ width: '0%' }}
                  animate={{ width: '85%' }}
                  transition={{ duration: 8, ease: 'easeInOut' }}
                />
              </div>
              <p className="text-sm text-zinc-400">Designing levels, tasks, and resources for you…</p>
            </div>
          </motion.div>
        ) : null}

        {error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
          >
            {error}
          </motion.div>
        ) : null}

        {roadmap ? (
          <RoadmapView
            roadmap={roadmap}
            roadmapId={roadmapId}
            pdfUploading={pdfUploading}
            pdfError={pdfError}
            pdfReady={pdfReady}
            pdfFilename={pdfFilename}
            pdfChunkCount={pdfChunkCount}
            onPdfFile={handlePdfFile}
            onOpenChatPanel={() => setChatOpen(true)}
          />
        ) : null}
      </main>

      {roadmap ? (
        <AIChatPanel
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          messages={askMessages}
          input={askInput}
          onInputChange={setAskInput}
          onSend={handleChatSend}
          sending={askSending}
          pdfReady={pdfReady}
          showSources={showSources}
          onShowSourcesChange={setShowSources}
        />
      ) : null}
    </div>
  )
}

export default App
