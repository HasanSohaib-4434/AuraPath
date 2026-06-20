import { motion } from 'framer-motion'
import { Calendar, GraduationCap, Loader2, Sparkles, Target } from 'lucide-react'
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

const GoalInput = ({ loading, onSubmit, onCompare, compact = false, initialGoal = '', initialDuration = '' }) => {
  const [goal, setGoal] = useState(initialGoal)
  const [duration, setDuration] = useState(initialDuration || '8 weeks')
  const [examDate, setExamDate] = useState('')
  const [language, setLanguage] = useState('en')
  const [focused, setFocused] = useState(false)

  const canSubmit = useMemo(() => goal.trim().length > 2 && !loading, [goal, loading])
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={`glass-card mx-auto max-w-2xl overflow-hidden ${compact ? 'mt-6 p-5' : 'p-6 sm:p-8'}`}
    >
      {!compact ? (
        <div className="mb-6 flex items-center gap-3">
          <motion.div
            animate={focused ? { scale: 1.05 } : { scale: 1 }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-aura-500 to-aura-700 shadow-glow-sm"
          >
            <Target className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Set your learning goal</h2>
            <p className="text-sm text-zinc-500">AuraPath will design your curriculum</p>
          </div>
        </div>
      ) : (
        <p className="mb-4 text-sm font-medium text-zinc-400">Start a new path</p>
      )}
      <form onSubmit={submit} className="grid gap-5">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <GraduationCap className="h-3.5 w-3.5" />
              Learning goal
            </label>
            <span className={`text-xs transition ${goalLen > 2 ? 'text-emerald-400' : 'text-zinc-600'}`}>
              {goalLen > 0 ? `${goalLen} chars` : 'Min 3 chars'}
            </span>
          </div>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="e.g. Become job-ready in machine learning"
            disabled={loading}
            className="input-field"
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((s) => (
              <motion.button
                key={s}
                type="button"
                disabled={loading}
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
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            <Calendar className="h-3.5 w-3.5" />
            Timeline
          </label>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <motion.button
                key={d.value}
                type="button"
                disabled={loading}
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
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Exam / deadline (optional)</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              disabled={loading}
              className="input-field py-2.5"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Path language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={loading} className="input-field py-2.5">
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
        <motion.button
          type="submit"
          disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.02, y: -1 } : {}}
          whileTap={canSubmit ? { scale: 0.98 } : {}}
          className="btn-primary w-full sm:w-auto sm:self-end"
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
        </motion.button>
        {onCompare ? (
          <motion.button
            type="button"
            disabled={!canSubmit}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCompare(payload())}
            className="btn-secondary w-full text-sm sm:w-auto sm:self-end"
          >
            Compare fast vs deep paths
          </motion.button>
        ) : null}
      </form>
    </motion.div>
  )
}

export default GoalInput
