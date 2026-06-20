import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Loader2, Star, Users } from 'lucide-react'
import { api } from '../utils/api.js'

const CommunityPage = ({ onOpenPath, onUseTemplate }) => {
  const [paths, setPaths] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/api/student/community').catch(() => []), api.get('/api/student/templates').catch(() => [])])
      .then(([c, t]) => {
        setPaths(Array.isArray(c) ? c : [])
        setTemplates(Array.isArray(t) ? t : [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink-primary sm:text-3xl">Explore</h1>
        <p className="mt-2 text-sm text-ink-secondary">Job-ready templates and community paths.</p>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-primary">
          <Star className="h-5 w-5 text-primary" />
          Career templates
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <motion.button
              key={t.id}
              type="button"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onUseTemplate?.(t)}
              className="glass-card-interactive p-4 text-left"
            >
              <span className="text-2xl">{t.icon}</span>
              <div className="mt-2 font-semibold text-ink-primary">{t.title}</div>
              <p className="mt-1 line-clamp-2 text-xs text-ink-secondary">{t.goal}</p>
              <span className="mt-2 inline-block text-xs text-primary">{t.duration}</span>
            </motion.button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-primary">
          <Users className="h-5 w-5 text-primary" />
          Community paths
        </h2>
        {paths.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {paths.map((p) => (
              <motion.button
                key={p._id}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenPath(p._id)}
                className="glass-card-interactive p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <div className="font-semibold text-ink-primary">{p.title}</div>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-secondary">{p.description}</p>
                    <p className="mt-2 text-xs text-ink-secondary">
                      {p.levelCount} levels · {p.taskCount} tasks
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-secondary">No public paths yet. Share yours from Active Path!</p>
        )}
      </section>
    </div>
  )
}

export default CommunityPage
