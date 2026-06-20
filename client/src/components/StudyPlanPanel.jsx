import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Loader2 } from 'lucide-react'
import { api } from '../utils/api.js'

const StudyPlanPanel = ({ roadmapId }) => {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!roadmapId) return
    setLoading(true)
    api
      .get(`/api/roadmaps/${roadmapId}/study-plan`)
      .then(setPlan)
      .catch(() => setPlan(null))
      .finally(() => setLoading(false))
  }, [roadmapId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Building study schedule…
      </div>
    )
  }
  if (!plan?.weeks?.length) return null

  return (
    <div className="mt-6 rounded-2xl border border-surface-border bg-surface/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
        <CalendarDays className="h-4 w-4 text-aura-400" />
        Weekly study plan
      </div>
      <div className="space-y-3">
        {plan.weeks.map((w) => (
          <motion.div
            key={w.week}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-surface-border/80 bg-surface-card/50 p-3"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-aura-300">{w.label}</span>
              <span className="text-xs text-zinc-500">{w.taskCount} tasks</span>
            </div>
            <div className="text-xs text-zinc-400">
              {w.levels?.map((l) => l.title).join(' · ')}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default StudyPlanPanel
