import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileUp,
  Layers,
  Link as LinkIcon,
  Loader2,
  MessageCircle,
  Trophy,
} from 'lucide-react'

const asArray = (v) => (Array.isArray(v) ? v : [])

const levelColors = [
  'from-lumina-500 to-lumina-700',
  'from-violet-500 to-purple-700',
  'from-sky-500 to-blue-700',
  'from-emerald-500 to-teal-700',
  'from-amber-500 to-orange-600',
]

const RoadmapView = ({
  roadmap,
  roadmapId,
  pdfUploading,
  pdfError,
  pdfReady,
  pdfFilename,
  pdfChunkCount,
  onPdfFile,
  onOpenChatPanel,
}) => {
  const { title, description, levels } = roadmap || {}
  const fileRef = useRef(null)
  const [expanded, setExpanded] = useState(() => new Set([0]))
  const [checked, setChecked] = useState(() => new Set())

  const levelList = asArray(levels)
  const totalTasks = useMemo(
    () => levelList.reduce((n, l) => n + asArray(l?.tasks).length, 0),
    [levelList],
  )
  const doneTasks = checked.size
  const progressPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0

  const toggleLevel = (idx) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const toggleTask = (key) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const onPickPdf = (e) => {
    const f = e.target.files?.[0]
    if (f) onPdfFile(f)
    e.target.value = ''
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mt-10"
    >
      <div className="glass-card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <Trophy className="h-3.5 w-3.5" />
              Your learning path
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">{title || 'Roadmap'}</h2>
            {description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">{description}</p> : null}
          </div>
          <div className="flex shrink-0 flex-col gap-3 lg:items-end">
            <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={onPickPdf} />
            <div className="flex flex-wrap gap-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileRef.current?.click()}
                disabled={pdfUploading || !roadmapId}
                className="btn-secondary"
              >
                {pdfUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                {pdfUploading ? 'Indexing…' : 'Upload study PDF'}
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onOpenChatPanel}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-lumina-500/40 bg-lumina-500/15 px-4 py-2.5 text-sm font-semibold text-lumina-200 transition hover:bg-lumina-500/25 hover:shadow-glow-sm"
              >
                <MessageCircle className="h-4 w-4" />
                Ask your PDF
              </motion.button>
            </div>
            {pdfError ? <p className="text-xs text-red-400">{pdfError}</p> : null}
            {pdfReady ? (
              <p className="text-xs text-emerald-400">
                Ready · {pdfChunkCount} sections indexed{pdfFilename ? ` · ${pdfFilename}` : ''}
              </p>
            ) : null}
          </div>
        </div>

        {totalTasks > 0 ? (
          <div className="mt-8 rounded-2xl border border-surface-border bg-surface/60 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-300">Overall progress</span>
              <span className="text-lumina-400">{doneTasks}/{totalTasks} tasks · {progressPct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-elevated">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-lumina-600 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
          </div>
        ) : null}

        <div className="relative mt-10 space-y-2">
          {levelList.length > 1 ? <div className="timeline-line hidden sm:block" aria-hidden /> : null}
          {levelList.map((level, idx) => {
            const isOpen = expanded.has(idx)
            const tasks = asArray(level?.tasks)
            const levelDone = tasks.filter((_, ti) => checked.has(`${idx}-${ti}`)).length
            const gradient = levelColors[idx % levelColors.length]

            return (
              <motion.div
                key={`${level?.title || 'level'}-${idx}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="relative sm:pl-10"
              >
                <button
                  type="button"
                  onClick={() => toggleLevel(idx)}
                  className="glass-card group w-full overflow-hidden text-left transition hover:border-lumina-500/25"
                >
                  <div className="absolute left-0 top-6 hidden h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-2 border-surface bg-surface-card sm:flex">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-xs font-bold text-white shadow-glow-sm`}>
                      {idx + 1}
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-4 p-5">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} sm:hidden`}>
                        <BookOpen className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Level {idx + 1}</span>
                          {tasks.length ? (
                            <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-xs text-zinc-400">
                              {levelDone}/{tasks.length} done
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-1 text-base font-semibold text-zinc-100">{level?.title || `Level ${idx + 1}`}</h3>
                      </div>
                    </div>
                    <ChevronDown
                      className={`mt-1 h-5 w-5 shrink-0 text-zinc-500 transition group-hover:text-lumina-400 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                  <motion.div
                    initial={false}
                    animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-surface-border/80 px-5 pb-5 pt-4">
                      {tasks.length ? (
                        <ul className="space-y-2">
                          {tasks.map((t, ti) => {
                            const key = `${idx}-${ti}`
                            const isDone = checked.has(key)
                            const label = typeof t === 'string' ? t : t?.title || ''
                            return (
                              <li key={key}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleTask(key)
                                  }}
                                  className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                                    isDone
                                      ? 'border-emerald-500/30 bg-emerald-500/5 text-zinc-500'
                                      : 'border-surface-border/60 bg-surface/40 text-zinc-200 hover:border-lumina-500/30 hover:bg-lumina-500/5'
                                  }`}
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                                  ) : (
                                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
                                  )}
                                  <span className={isDone ? 'line-through' : ''}>{label}</span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      ) : null}
                      {asArray(level?.resources).length ? (
                        <div className="mt-4">
                          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                            <Layers className="h-3.5 w-3.5" />
                            Resources
                          </div>
                          <ul className="space-y-2">
                            {asArray(level?.resources).map((r, ri) => {
                              const label = typeof r === 'string' ? r : r?.title || r?.name || ''
                              const url = typeof r === 'object' ? r?.url : ''
                              return (
                                <li key={`${idx}-r-${ri}`} className="flex items-start gap-2 text-sm">
                                  <LinkIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                                  {url ? (
                                    <a
                                      className="text-sky-300 underline decoration-sky-500/30 underline-offset-4 transition hover:text-sky-200 hover:decoration-sky-400"
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {label || url}
                                    </a>
                                  ) : (
                                    <span className="text-zinc-400">{label}</span>
                                  )}
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

export default RoadmapView
