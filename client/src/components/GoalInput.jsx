import { motion } from 'framer-motion'
import { Calendar, GitCompare, GraduationCap, Loader2, Sparkles, Target, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'

const SUGGESTIONS = [
  'Master React & TypeScript',
  'Learn Python for Data Science',
  'Prepare for System Design interviews',
  'Become a UI/UX designer',
  'Build full-stack with Node.js',
]

const DURATIONS = [
  { value: '2 weeks', label: '2w', hint: 'Sprint' },
  { value: '4 weeks', label: '4w', hint: 'Focused' },
  { value: '8 weeks', label: '8w', hint: 'Standard' },
  { value: '12 weeks', label: '12w', hint: 'Deep' },
  { value: '3 months', label: '3mo', hint: 'Full' },
  { value: '6 months', label: '6mo', hint: 'Mastery' },
]

const VARIANT_META = {
  fast: { label: 'Fast track', icon: Zap, desc: 'Fewer levels, quicker wins — best when time is tight.' },
  deep: { label: 'Deep dive', icon: Target, desc: 'More depth and practice — best for long-term mastery.' },
  standard: { label: 'Standard', icon: Sparkles, desc: 'Balanced path for steady progress.' },
}

const GoalInput = ({
  loading,
  compareLoading = false,
  compareVariants = null,
  onSubmit,
  onCompare,
  onPickVariant,
  compact = false,
  initialGoal = '',
  initialDuration = '',
}) => {
  const [goal, setGoal] = useState(initialGoal)
  const [duration, setDuration] = useState(initialDuration || '8 weeks')
  const [examDate, setExamDate] = useState('')
  const [language, setLanguage] = useState('en')
  const [focused, setFocused] = useState(false)

  const goalOk = goal.trim().length > 2
  const busy = loading || compareLoading
  const canSubmit = goalOk && !busy
  const canCompare = goalOk && !busy && !!onCompare
  const goalLen = goal.trim().length

  const payload = () => ({
    goal: goal.trim(),
    duration,
    examDate: examDate || undefined,
    language,
  })

  const submit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit(payload())
  }

  const handleCompare = () => {
    if (!canCompare) return
    onCompare(payload())
  }

  const variants = Array.isArray(compareVariants) ? compareVariants : []

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={`glass-card mx-auto max-w-2xl ${compact ? 'mt-6' : ''}`}
    >
      {!compact ? (
        <div className="mb-6 flex items-center gap-3">
          <motion.div
            animate={focused ? { scale: 1.05 } : { scale: 1 }}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-glow-sm"
          >
            <Target className="h-5 w-5 text-on-primary" />
          </motion.div>
          <div>
            <h2 className="text-lg font-semibold text-ink-primary">Set your learning goal</h2>
            <p className="text-sm text-ink-secondary">Generate one path, or compare fast vs deep first</p>
          </div>
        </div>
      ) : (
        <p className="mb-4 text-sm font-medium text-ink-secondary">Start a new path</p>
      )}

      <form onSubmit={submit} className="grid gap-5">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-secondary">
              <GraduationCap className="h-3.5 w-3.5" />
              Learning goal
            </label>
            <span className={`text-xs transition ${goalOk ? 'text-success' : 'text-ink-secondary'}`}>
              {goalLen > 0 ? `${goalLen} chars` : 'Min 3 chars'}
            </span>
          </div>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="e.g. Become job-ready in machine learning"
            disabled={busy}
            className="input-field"
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((s) => (
              <motion.button
                key={s}
                type="button"
                disabled={busy}
                whileTap={{ scale: 0.95 }}
                onClick={() => setGoal(s)}
                className={`chip ${goal === s ? 'chip-active' : ''}`}
              >
                {s}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-secondary">
            <Calendar className="h-3.5 w-3.5" />
            Timeline
          </label>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <motion.button
                key={d.value}
                type="button"
                disabled={busy}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDuration(d.value)}
                className={`pill flex flex-col items-center px-4 py-2 ${duration === d.value ? 'pill-active' : ''}`}
              >
                <span className="font-semibold">{d.label}</span>
                <span className="text-[10px] opacity-70">{d.hint}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-ink-secondary">Exam / deadline (optional)</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              disabled={busy}
              className="input-field py-2.5"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-ink-secondary">Path language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={busy} className="input-field py-2.5">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ur">Urdu</option>
              <option value="hi">Hindi</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-subtle/60 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {onCompare ? (
            <button
              type="button"
              disabled={!canCompare}
              onClick={handleCompare}
              className="btn-secondary order-2 w-full touch-manipulation sm:order-1 sm:w-auto disabled:cursor-not-allowed disabled:opacity-45"
            >
              {compareLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Comparing paths…
                </>
              ) : (
                <>
                  <GitCompare className="h-4 w-4" />
                  Compare fast vs deep
                </>
              )}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary order-1 w-full touch-manipulation sm:order-2 sm:w-auto disabled:cursor-not-allowed disabled:opacity-45"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Building your AuraPath…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate learning path
              </>
            )}
          </button>
        </div>

        {!goalOk ? (
          <p className="text-center text-xs text-ink-secondary">Enter a goal (at least 3 characters) to generate or compare paths.</p>
        ) : null}

        {compareLoading ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-primary/25 bg-primary-soft p-4 text-center"
          >
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium text-ink-primary">Building fast & deep previews…</p>
            <p className="mt-1 text-xs text-ink-secondary">This takes about 15–30 seconds — two AI paths at once.</p>
          </motion.div>
        ) : null}

        {!compareLoading && variants.length > 0 ? (
          <motion.div
            id="compare-results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-primary/20 bg-surface-raised/60 p-4"
          >
            <h3 className="mb-1 text-center text-sm font-semibold text-ink-primary">Choose your path</h3>
            <p className="mb-4 text-center text-xs text-ink-secondary">Tap a variant to start with that roadmap</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {variants.map((v, i) => {
                const key = v._id || `${v.variant}-${i}`
                const meta = VARIANT_META[v.variant] || VARIANT_META.standard
                const Icon = meta.icon
                const levelCount = v.levels?.length || 0
                const taskCount = (v.levels || []).reduce((n, l) => n + (l.tasks?.length || 0), 0)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onPickVariant?.(v)}
                    className="glass-card-interactive group w-full touch-manipulation p-4 text-left transition hover:border-primary/40"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          v.variant === 'fast' ? 'bg-accent-muted text-accent' : 'bg-primary-muted text-primary'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-primary">{meta.label}</span>
                        <div className="line-clamp-1 text-sm font-semibold text-ink-primary">{v.title}</div>
                      </div>
                    </div>
                    <p className="line-clamp-2 text-xs text-ink-secondary">{v.description || meta.desc}</p>
                    <p className="mt-2 text-xs text-ink-secondary">
                      {levelCount} levels · {taskCount} tasks
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                      Select this path →
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        ) : null}
      </form>
    </motion.div>
  )
}

export default GoalInput
