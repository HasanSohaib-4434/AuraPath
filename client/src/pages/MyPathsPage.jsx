import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Calendar, ChevronRight, Layers, Loader2, RefreshCw } from 'lucide-react'

const MyPathsPage = ({ onOpenPath, activeId }) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const fetchList = async () => {
    setLoading(true)
    setErr('')
    try {
      const res = await fetch('/api/roadmaps')
      const raw = await res.text()
      const data = raw ? JSON.parse(raw) : []
      if (!res.ok) throw new Error(data?.error || 'Failed to load paths')
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      setErr(e?.message || 'Failed to load')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary sm:text-3xl">My Paths</h1>
          <p className="mt-2 text-sm text-ink-secondary">All learning roadmaps saved to your AuraPath account.</p>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={fetchList}
          disabled={loading}
          className="btn-secondary self-start"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-ink-secondary">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading your paths…
        </div>
      ) : null}

      {err ? <div className="rounded-xl border border-danger/30 bg-danger-muted p-4 text-sm text-danger">{err}</div> : null}

      {!loading && !err && items.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-ink-secondary" />
          <p className="text-ink-secondary">No paths yet. Generate one from Home.</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item, i) => {
          const id = String(item._id)
          const isActive = activeId === id
          return (
            <motion.button
              key={id}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onOpenPath(id)}
              className={`glass-card-interactive group w-full p-5 text-left ${isActive ? 'border-primary/40 ring-1 ring-primary/20' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {isActive ? (
                    <span className="mb-2 inline-block rounded-full bg-primary-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Active
                    </span>
                  ) : null}
                  <h3 className="truncate text-base font-semibold text-ink-primary">{item.title}</h3>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-ink-secondary">{item.description}</p>
                  ) : null}
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-ink-secondary transition group-hover:text-primary" />
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-secondary">
                <span className="inline-flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  {item.levelCount} levels
                </span>
                <span>{item.taskCount} tasks</span>
                {item.createdAt ? (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export default MyPathsPage
