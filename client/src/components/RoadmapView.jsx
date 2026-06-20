import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileUp,
  HelpCircle,
  Layers,
  Loader2,
  MessageCircle,
  PartyPopper,
  Trophy,
} from 'lucide-react'
import ExplainTaskModal from './ExplainTaskModal.jsx'
import LevelNotesPanel from './LevelNotesPanel.jsx'
import PathActionsBar from './PathActionsBar.jsx'
import QuizPanel from './QuizPanel.jsx'
import RegenerateLevelButton from './RegenerateLevelButton.jsx'
import ResourceCard from './ResourceCard.jsx'
import SkillTree from './SkillTree.jsx'
import StuckButton from './StuckButton.jsx'
import StudyPlanPanel from './StudyPlanPanel.jsx'
import YouTubeModal from './YouTubeModal.jsx'
import { api } from '../utils/api.js'
import { loadProgress, mergeProgressFromServer, saveProgress } from '../utils/progressStorage.js'
import { resourcesForLevel } from '../utils/resourceLinks.js'

const asArray = (v) => (Array.isArray(v) ? v : [])

const levelColors = [
  'from-primary to-primary-hover',
  'from-primary/90 to-primary-hover',
  'from-primary/80 to-primary',
  'from-primary/70 to-primary-hover',
  'from-primary/60 to-primary',
]

const RoadmapView = ({
  roadmap,
  roadmapId,
  pdfUploading,
  pdfError,
  pdfReady,
  pdfFilename,
  pdfChunkCount,
  pdfList = [],
  onPdfFile,
  onOpenChatPanel,
  onProgressChange,
  onRoadmapUpdate,
  onNewAchievements,
  streakDays = 0,
}) => {
  const { title, description, levels, goal } = roadmap || {}
  const resourceContext = useMemo(() => goal || title || '', [goal, title])
  const fileRef = useRef(null)
  const [expanded, setExpanded] = useState(() => new Set([0]))
  const [checked, setChecked] = useState(() => new Set())
  const [dragOver, setDragOver] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [levelNotes, setLevelNotes] = useState({})
  const [pinnedResources, setPinnedResources] = useState({})
  const [ytModal, setYtModal] = useState(null)
  const [explainTask, setExplainTask] = useState(null)
  const syncRef = useRef(null)

  useEffect(() => {
    if (!roadmapId) return
    api
      .get(`/api/roadmaps/${roadmapId}/progress`)
      .then((data) => {
        setLevelNotes(data.levelNotes || {})
        setPinnedResources(data.pinnedResources || {})
        setChecked(mergeProgressFromServer(roadmapId, data.completedTasks || []))
      })
      .catch(() => setChecked(loadProgress(roadmapId)))
  }, [roadmapId])

  const syncToServer = (nextChecked, notes = levelNotes, pinned = pinnedResources) => {
    if (!roadmapId) return
    clearTimeout(syncRef.current)
    syncRef.current = setTimeout(async () => {
      try {
        const data = await api.put(`/api/roadmaps/${roadmapId}/progress`, {
          completedTasks: [...nextChecked],
          levelNotes: notes,
          pinnedResources: pinned,
          streakDays,
        })
        if (data.newAchievements?.length) onNewAchievements?.(data.newAchievements)
      } catch {}
    }, 600)
  }

  useEffect(() => {
    if (roadmapId) saveProgress(roadmapId, checked)
    syncToServer(checked)
  }, [roadmapId, checked, levelNotes, pinnedResources])

  const levelList = asArray(levels)
  const totalTasks = useMemo(
    () => levelList.reduce((n, l) => n + asArray(l?.tasks).length, 0),
    [levelList],
  )
  const doneTasks = checked.size
  const progressPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0

  useEffect(() => {
    onProgressChange?.({ doneTasks, totalTasks, progressPct })
  }, [doneTasks, totalTasks, progressPct, onProgressChange])

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
      const newDone = next.size
      const pct = totalTasks ? Math.round((newDone / totalTasks) * 100) : 0
      if (pct === 100 && newDone > prev.size) {
        setCelebrate(true)
        setTimeout(() => setCelebrate(false), 4000)
      }
      return next
    })
  }

  const completeLevel = (idx, tasks, e) => {
    e.stopPropagation()
    setChecked((prev) => {
      const next = new Set(prev)
      tasks.forEach((_, ti) => next.add(`${idx}-${ti}`))
      const pct = totalTasks ? Math.round((next.size / totalTasks) * 100) : 0
      if (pct === 100) {
        setCelebrate(true)
        setTimeout(() => setCelebrate(false), 4000)
      }
      return next
    })
  }

  const onPickPdf = (e) => {
    const f = e.target.files?.[0]
    if (f) onPdfFile(f)
    e.target.value = ''
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f?.type === 'application/pdf') onPdfFile(f)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mt-10"
    >
      <PathActionsBar roadmapId={roadmapId} onRoadmapUpdate={onRoadmapUpdate} />

      <div className="glass-card mb-4 p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink-primary">Skill tree</h3>
        <SkillTree levels={levelList} completedTasks={checked} />
      </div>

      <AnimatePresence>
        {celebrate ? (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 flex items-center justify-center gap-2 rounded-2xl border border-accent/40 bg-accent-muted px-4 py-3 text-sm font-medium text-accent"
          >
            <PartyPopper className="h-5 w-5 text-accent" />
            Path complete! You finished every task on your AuraPath.
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="glass-card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-muted px-3 py-1 text-xs font-medium text-primary">
              <Trophy className="h-3.5 w-3.5" />
              Your AuraPath
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-ink-primary sm:text-3xl">{title || 'Roadmap'}</h2>
            {description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-secondary">{description}</p> : null}
          </div>
          <div className="flex shrink-0 flex-col gap-3 lg:min-w-[280px] lg:items-stretch">
            <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={onPickPdf} />
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => !pdfUploading && fileRef.current?.click()}
              className={`drop-zone cursor-pointer ${dragOver ? 'drop-zone-active' : ''} ${pdfReady ? 'border-success/30 bg-success-muted' : ''}`}
            >
              {pdfUploading ? (
                <div className="flex flex-col items-center gap-2 text-ink-secondary">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm">Indexing your PDF…</span>
                </div>
              ) : pdfReady ? (
                <div className="text-sm">
                  <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-success" />
                  <p className="font-medium text-success">{pdfChunkCount} sections ready</p>
                  <p className="mt-1 truncate text-xs text-ink-secondary">{pdfFilename}</p>
                  {pdfList.length > 1 ? (
                    <p className="mt-1 text-xs text-ink-secondary">{pdfList.length} PDFs indexed</p>
                  ) : null}
                  <p className="mt-2 text-xs text-ink-secondary">Drop another PDF to add more</p>
                </div>
              ) : (
                <div className="text-sm text-ink-secondary">
                  <FileUp className="mx-auto mb-2 h-6 w-6 text-primary" />
                  <p className="font-medium text-ink-primary">Drop study PDF here</p>
                  <p className="mt-1 text-xs">or click to browse</p>
                </div>
              )}
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenChatPanel}
              disabled={!pdfReady}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary-muted px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/25 hover:shadow-glow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MessageCircle className="h-4 w-4" />
              {pdfReady ? 'Open study assistant' : 'Upload PDF to chat'}
            </motion.button>
            {pdfError ? <p className="text-xs text-danger">{pdfError}</p> : null}
          </div>
        </div>

        {totalTasks > 0 ? (
          <motion.div layout className="mt-8 rounded-2xl border border-subtle bg-surface/60 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-ink-primary">Path progress</span>
              <motion.span
                key={progressPct}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="font-semibold text-primary"
              >
                {doneTasks}/{totalTasks} · {progressPct}%
              </motion.span>
            </div>
            <div className="progress-track h-3">
              <motion.div
                className="progress-fill relative"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              >
                {progressPct > 8 ? (
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  />
                ) : null}
              </motion.div>
            </div>
          </motion.div>
        ) : null}

        <StudyPlanPanel roadmapId={roadmapId} />

        <div className="relative mt-10 space-y-3 sm:space-y-2">
          {levelList.length > 1 ? <div className="timeline-line hidden sm:block" aria-hidden /> : null}
          {levelList.map((level, idx) => {
            const isOpen = expanded.has(idx)
            const tasks = asArray(level?.tasks)
            const levelDone = tasks.filter((_, ti) => checked.has(`${idx}-${ti}`)).length
            const levelComplete = tasks.length > 0 && levelDone === tasks.length
            const gradient = levelColors[idx % levelColors.length]

            return (
              <motion.div
                key={`${level?.title || 'level'}-${idx}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="relative sm:pl-10"
              >
                <div
                  className="absolute left-[1.125rem] top-6 z-10 hidden h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-2 border-surface bg-surface sm:flex"
                  aria-hidden
                >
                  <motion.div
                    animate={levelComplete ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 0.4 }}
                    className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-xs font-bold text-on-primary shadow-glow-sm`}
                  >
                    {levelComplete ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                  </motion.div>
                </div>
                <motion.button
                  type="button"
                  onClick={() => toggleLevel(idx)}
                  whileHover={{ scale: 1.005 }}
                  className={`glass-card-interactive group w-full text-left ${levelComplete ? 'border-success/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} sm:hidden`}
                      >
                        {levelComplete ? (
                          <CheckCircle2 className="h-4 w-4 text-on-primary" />
                        ) : (
                          <span className="text-sm font-bold text-on-primary">{idx + 1}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium uppercase tracking-wide text-ink-secondary">Level {idx + 1}</span>
                          {tasks.length ? (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${levelComplete ? 'bg-success-muted text-success' : 'bg-surface-raised text-ink-secondary'}`}
                            >
                              {levelDone}/{tasks.length}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-1 text-base font-semibold text-ink-primary">{level?.title || `Level ${idx + 1}`}</h3>
                      </div>
                    </div>
                    <ChevronDown
                      className={`mt-1 h-5 w-5 shrink-0 text-ink-secondary transition duration-300 group-hover:text-primary ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-subtle/80 px-5 pb-5 pt-4">
                          <div className="mb-3 flex flex-wrap gap-2">
                            {tasks.length && !levelComplete ? (
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.98 }}
                                onClick={(e) => completeLevel(idx, tasks, e)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-success/30 bg-success-muted px-3 py-1.5 text-xs font-medium text-success transition hover:bg-success/20"
                              >
                                <CheckCheck className="h-3.5 w-3.5" />
                                Mark level complete
                              </motion.button>
                            ) : null}
                            <RegenerateLevelButton roadmapId={roadmapId} levelIndex={idx} onUpdate={onRoadmapUpdate} />
                          </div>
                          {tasks.length ? (
                            <ul className="space-y-2">
                              {tasks.map((t, ti) => {
                                const key = `${idx}-${ti}`
                                const isDone = checked.has(key)
                                const label = typeof t === 'string' ? t : t?.title || ''
                                return (
                                  <motion.li
                                    key={key}
                                    layout
                                    initial={false}
                                    animate={{ opacity: isDone ? 0.75 : 1 }}
                                  >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                      <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.98 }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleTask(key)
                                        }}
                                        className={`flex flex-1 items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                                          isDone
                                            ? 'border-success/30 bg-success-muted text-ink-secondary'
                                            : 'border-subtle/60 bg-surface/40 text-ink-primary hover:border-primary/30 hover:bg-primary-soft'
                                        }`}
                                      >
                                        <motion.span
                                          animate={isDone ? { scale: [1, 1.3, 1], rotate: [0, 10, 0] } : {}}
                                          transition={{ duration: 0.35 }}
                                        >
                                          {isDone ? (
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                                          ) : (
                                            <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-secondary" />
                                          )}
                                        </motion.span>
                                        <span className={isDone ? 'line-through' : ''}>{label}</span>
                                      </motion.button>
                                      <div className="flex shrink-0 items-center justify-end gap-2 sm:py-1">
                                        <button
                                          type="button"
                                          title="Explain task"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setExplainTask({ levelIndex: idx, taskIndex: ti, label })
                                          }}
                                          className="inline-flex items-center gap-1 rounded-xl border border-subtle px-2.5 py-2 text-xs text-ink-secondary hover:border-primary/40 hover:text-primary"
                                        >
                                          <HelpCircle className="h-4 w-4" />
                                          <span className="sm:hidden">Explain</span>
                                        </button>
                                        <StuckButton roadmapId={roadmapId} levelIndex={idx} taskIndex={ti} taskLabel={label} />
                                      </div>
                                    </div>
                                  </motion.li>
                                )
                              })}
                            </ul>
                          ) : null}
                          <QuizPanel
                            roadmapId={roadmapId}
                            levelIndex={idx}
                            levelTitle={level?.title}
                            onComplete={() => onNewAchievements?.([])}
                          />
                          {resourcesForLevel(level, resourceContext).length ? (
                            <div className="mt-4">
                              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-secondary">
                                <Layers className="h-3.5 w-3.5" />
                                Resources & videos
                              </div>
                              <ul className="grid gap-2 sm:grid-cols-1">
                                {resourcesForLevel(level, resourceContext).map((r, ri) => (
                                    <ResourceCard
                                      key={`${idx}-r-${ri}-${r.url}`}
                                      resource={r}
                                      index={ri}
                                      onYoutubeClick={(res) => setYtModal(res)}
                                    />
                                  ))}
                              </ul>
                            </div>
                          ) : null}
                          <LevelNotesPanel
                            levelIndex={idx}
                            notes={levelNotes[String(idx)] || ''}
                            pinned={pinnedResources[String(idx)] || []}
                            resources={resourcesForLevel(level, resourceContext)}
                            onNotesChange={(li, val) => setLevelNotes((n) => ({ ...n, [String(li)]: val }))}
                            onPinToggle={(li, url) =>
                              setPinnedResources((p) => {
                                const key = String(li)
                                const cur = p[key] || []
                                const next = cur.includes(url) ? cur.filter((u) => u !== url) : [...cur, url]
                                return { ...p, [key]: next }
                              })
                            }
                          />
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            )
          })}
        </div>
      </div>

      <YouTubeModal open={!!ytModal} url={ytModal?.url} title={ytModal?.title} onClose={() => setYtModal(null)} />
      <ExplainTaskModal
        key={explainTask ? `${explainTask.levelIndex}-${explainTask.taskIndex}` : 'closed'}
        open={!!explainTask}
        onClose={() => setExplainTask(null)}
        roadmapId={roadmapId}
        levelIndex={explainTask?.levelIndex}
        taskIndex={explainTask?.taskIndex}
        taskLabel={explainTask?.label}
      />
    </motion.div>
  )
}

export default RoadmapView
