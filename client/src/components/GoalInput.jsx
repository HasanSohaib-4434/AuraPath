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
  { value: '2 weeks', label: '2 weeks · Sprint' },
  { value: '4 weeks', label: '4 weeks · Focused' },
  { value: '8 weeks', label: '8 weeks · Standard' },
  { value: '12 weeks', label: '12 weeks · Deep dive' },
  { value: '3 months', label: '3 months · Comprehensive' },
  { value: '6 months', label: '6 months · Mastery' },
]

const GoalInput = ({ loading, onSubmit }) => {
  const [goal, setGoal] = useState('')
  const [duration, setDuration] = useState('8 weeks')

  const canSubmit = useMemo(() => goal.trim().length > 2 && !loading, [goal, loading])

  const submit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({ goal: goal.trim(), duration })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="glass-card mx-auto max-w-2xl overflow-hidden p-6 sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-lumina-500 to-lumina-700 shadow-glow-sm">
          <Target className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Set your learning goal</h2>
          <p className="text-sm text-zinc-500">Tell us what you want to learn and how long you have</p>
        </div>
      </div>
      <form onSubmit={submit} className="grid gap-5">
        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            <GraduationCap className="h-3.5 w-3.5" />
            Learning goal
          </label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Become job-ready in machine learning"
            disabled={loading}
            className="input-field"
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={loading}
                onClick={() => setGoal(s)}
                className={`chip ${goal === s ? 'chip-active' : ''}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            <Calendar className="h-3.5 w-3.5" />
            Timeline
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={loading}
            className="input-field cursor-pointer"
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <motion.button
          type="submit"
          disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.01 } : {}}
          whileTap={canSubmit ? { scale: 0.98 } : {}}
          className="btn-primary w-full sm:w-auto sm:self-end"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Building your path…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate learning path
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  )
}

export default GoalInput
