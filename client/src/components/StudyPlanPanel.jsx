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
      <div className="flex items-center gap-2 text-sm text-ink-secondary">
        <Loader2 className="h-4 w-4 animate-spin" /> Building study schedule…
      </div>
    )
  }
  if (!plan?.weeks?.length) return null

  return (
    <div className="mt-6 rounded-2xl border border-subtle bg-surface/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-primary">
        <CalendarDays className="h-4 w-4 text-primary" />
        Weekly study plan
      </div>
      <div className="space-y-3">
        {plan.weeks.map((w) => (
          <motion.div
            key={w.week}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-subtle/80 bg-surface/50 p-3"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-primary">{w.label}</span>
              <span className="text-xs text-ink-secondary">{w.taskCount} tasks</span>
            </div>
            <div className="text-xs text-ink-secondary">
              {w.levels?.map((l) => l.title).join(' · ')}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default StudyPlanPanel
