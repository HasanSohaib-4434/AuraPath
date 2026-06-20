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
        <Loader2 className="h-8 w-8 animate-spin text-aura-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 sm:text-3xl">Explore</h1>
        <p className="mt-2 text-sm text-zinc-400">Job-ready templates and community paths.</p>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-200">
          <Star className="h-5 w-5 text-amber-400" />
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
              <div className="mt-2 font-semibold text-zinc-100">{t.title}</div>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{t.goal}</p>
              <span className="mt-2 inline-block text-xs text-aura-400">{t.duration}</span>
            </motion.button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-200">
          <Users className="h-5 w-5 text-cyan-400" />
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
                  <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-aura-400" />
                  <div>
                    <div className="font-semibold text-zinc-100">{p.title}</div>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{p.description}</p>
                    <p className="mt-2 text-xs text-zinc-600">
                      {p.levelCount} levels · {p.taskCount} tasks
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No public paths yet. Share yours from Active Path!</p>
        )}
      </section>
    </div>
  )
}

export default CommunityPage
