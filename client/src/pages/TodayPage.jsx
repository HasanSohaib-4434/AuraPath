import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Calendar,
  Flame,
  Layers,
  Loader2,
  Play,
  Sparkles,
  Target,
  Timer,
  Zap,
} from 'lucide-react'
import SkillTree from '../components/SkillTree.jsx'
import { api } from '../utils/api.js'
import { loadProgress } from '../utils/progressStorage.js'
import { cleanUrl, isYoutubeUrl } from '../utils/resourceLinks.js'

const TodayPage = ({ roadmap, roadmapId, onNavigate, onYoutubeClick }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roadmapId) return
    setLoading(true)
    api
      .get(`/api/student/${roadmapId}/today`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [roadmapId])

  if (!roadmap) {
    return (
      <div className="glass-card py-16 text-center">
        <Calendar className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
        <p className="text-zinc-400">Open a learning path to see today&apos;s plan.</p>
        <button type="button" onClick={() => onNavigate('home')} className="btn-primary mt-4">
          Create path
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-aura-400" />
      </div>
    )
  }

  const checked = loadProgress(roadmapId)

  const handleWatchToday = () => {
    const v = data?.suggestedVideo
    if (!v) return
    const url = cleanUrl(v.url || v.title || '')
    if (!url) return
    if (isYoutubeUrl(url)) onYoutubeClick?.({ ...v, url })
    else window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="pb-4">
      <div className="mb-6">
        <p className="text-sm text-zinc-500">{data?.greeting || 'Hello'}</p>
        <h1 className="text-2xl font-bold text-zinc-100 sm:text-3xl">Today&apos;s plan</h1>
        <p className="mt-1 text-sm text-zinc-400">{roadmap.title}</p>
      </div>

      {data?.examCountdown != null && data.examCountdown >= 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4"
        >
          <div className="text-sm font-semibold text-rose-200">Exam countdown</div>
          <div className="text-2xl font-bold text-zinc-100">{data.examCountdown} days left</div>
        </motion.div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Zap, label: 'Level', value: data?.learnerLevel || 1, sub: `${data?.xp || 0} XP` },
          { icon: Target, label: 'Progress', value: `${data?.progressPct || 0}%`, sub: 'on path' },
          { icon: Layers, label: 'Flashcards', value: data?.dueFlashcards || 0, sub: 'due today' },
          { icon: Flame, label: 'Focus', value: data?.weekFocus || 'Week 1', sub: 'this week' },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="glass-card p-3 sm:p-4">
            <Icon className="mb-2 h-4 w-4 text-aura-400" />
            <div className="text-lg font-bold text-zinc-100 sm:text-xl">{value}</div>
            <div className="text-xs text-zinc-500">{label}</div>
            <div className="text-[10px] text-zinc-600">{sub}</div>
          </div>
        ))}
      </div>

      <div className="glass-card mb-6 p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-200">Skill tree</h2>
        <SkillTree levels={roadmap.levels} completedTasks={checked} />
      </div>

      <div className="glass-card mb-6 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <BookOpen className="h-4 w-4 text-aura-400" />
          Do these 3 tasks today
        </h2>
        <ul className="space-y-2">
          {(data?.nextTasks || []).map((t) => (
            <li key={t.key} className="rounded-xl border border-surface-border bg-surface/50 px-3 py-2.5 text-sm">
              <span className="text-xs text-zinc-500">{t.levelTitle}</span>
              <p className="text-zinc-200">{t.label}</p>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => onNavigate('active')} className="btn-primary mt-4 w-full text-sm sm:w-auto">
          Go to path
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {data?.suggestedVideo ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleWatchToday}
            className="glass-card-interactive flex items-center gap-3 p-4 text-left"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
              <Play className="h-6 w-6 fill-red-300 text-red-300" />
            </div>
            <div>
              <div className="text-xs text-zinc-500">Watch today</div>
              <div className="line-clamp-2 text-sm font-medium text-zinc-200">
                {data.suggestedVideo.title || 'Suggested video'}
              </div>
            </div>
          </motion.button>
        ) : null}
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('study')}
          className="glass-card-interactive flex items-center gap-3 p-4 text-left"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20">
            <Timer className="h-6 w-6 text-orange-300" />
          </div>
          <div>
            <div className="text-xs text-zinc-500">Focus session</div>
            <div className="text-sm font-medium text-zinc-200">25-min Pomodoro + flashcards</div>
          </div>
        </motion.button>
      </div>
    </div>
  )
}

export default TodayPage
