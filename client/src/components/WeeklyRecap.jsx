import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Loader2 } from 'lucide-react'
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
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading recap…
      </div>
    )
  }
  if (!data) return null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card mb-8 p-6">
      <div className="mb-3 flex items-center gap-2 font-semibold text-zinc-200">
        <Calendar className="h-5 w-5 text-aura-400" />
        Weekly recap
      </div>
      <p className="text-sm text-zinc-400">{data.message}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-elevated p-3 text-center">
          <div className="text-xl font-bold text-zinc-100">{data.tasksThisWeek}</div>
          <div className="text-xs text-zinc-500">Tasks this week</div>
        </div>
        <div className="rounded-xl bg-surface-elevated p-3 text-center">
          <div className="text-xl font-bold text-zinc-100">{data.pathsActive}</div>
          <div className="text-xs text-zinc-500">Active paths</div>
        </div>
        <div className="rounded-xl bg-surface-elevated p-3 text-center">
          <div className="text-xl font-bold text-zinc-100">{data.bestStreak}</div>
          <div className="text-xs text-zinc-500">Best streak</div>
        </div>
      </div>
    </motion.div>
  )
}

export default WeeklyRecap
