import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Flame, Loader2 } from 'lucide-react'
import { api } from '../utils/api.js'

const WeeklyRecap = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/api/recap')
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-secondary">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading recap…
      </div>
    )
  }
  if (!data) return null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card mb-8 p-6">
      <div className="mb-3 flex items-center gap-2 font-semibold text-ink-primary">
        <Calendar className="h-5 w-5 text-accent" />
        Weekly recap
      </div>
      <p className="text-sm text-ink-secondary">{data.message}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-raised p-3 text-center">
          <div className="text-xl font-bold text-ink-primary">{data.tasksThisWeek}</div>
          <div className="text-xs text-ink-secondary">Tasks this week</div>
        </div>
        <div className="rounded-xl bg-surface-raised p-3 text-center">
          <div className="text-xl font-bold text-ink-primary">{data.pathsActive}</div>
          <div className="text-xs text-ink-secondary">Active paths</div>
        </div>
        <div className="rounded-xl bg-surface-raised p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-xl font-bold text-accent">
            <Flame className="h-4 w-4" />
            {data.bestStreak}
          </div>
          <div className="text-xs text-ink-secondary">Best streak</div>
        </div>
      </div>
    </motion.div>
  )
}

export default WeeklyRecap
