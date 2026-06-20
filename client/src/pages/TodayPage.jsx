import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Calendar, Flame, Layers, Loader2, Play, Target, Timer, Zap } from 'lucide-react'
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
        <Calendar className="mx-auto mb-3 h-10 w-10 text-ink-secondary" />
        <p className="text-ink-secondary">Open a learning path to see today&apos;s plan.</p>
        <button type="button" onClick={() => onNavigate('home')} className="btn-primary mt-4">
          Create path
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <p className="text-sm text-ink-secondary">{data?.greeting || 'Hello'}</p>
        <h1 className="text-2xl font-bold text-ink-primary sm:text-3xl">Today&apos;s plan</h1>
        <p className="mt-1 text-sm text-ink-secondary">{roadmap.title}</p>
      </div>

      {data?.examCountdown != null && data.examCountdown >= 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl border border-danger/30 bg-danger-muted p-5"
        >
          <div className="text-sm font-semibold text-danger">Exam countdown</div>
          <div className="text-2xl font-bold text-ink-primary">{data.examCountdown} days left</div>
        </motion.div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Zap, label: 'Level', value: data?.learnerLevel || 1, sub: `${data?.xp || 0} XP`, gamify: true },
          { icon: Target, label: 'Progress', value: `${data?.progressPct || 0}%`, sub: 'on path', gamify: false },
          { icon: Layers, label: 'Flashcards', value: data?.dueFlashcards || 0, sub: 'due today', gamify: false },
          { icon: Flame, label: 'Focus', value: data?.weekFocus || 'Week 1', sub: 'this week', gamify: true },
        ].map(({ icon: Icon, label, value, sub, gamify }) => (
          <div key={label} className="glass-card p-4 sm:p-5">
            <Icon className={`mb-2 h-4 w-4 ${gamify ? 'text-accent' : 'text-primary'}`} />
            <div className={`text-lg font-bold sm:text-xl ${gamify ? 'text-accent' : 'text-ink-primary'}`}>{value}</div>
            <div className="text-xs text-ink-secondary">{label}</div>
            <div className="text-[10px] text-ink-secondary">{sub}</div>
          </div>
        ))}
      </div>

      <div className="glass-card mb-6">
        <h2 className="mb-3 text-sm font-semibold text-ink-primary">Skill tree</h2>
        <SkillTree levels={roadmap.levels} completedTasks={checked} />
      </div>

      <div className="glass-card mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-primary">
          <BookOpen className="h-4 w-4 text-primary" />
          Do these 3 tasks today
        </h2>
        <ul className="space-y-2">
          {(data?.nextTasks || []).map((t) => (
            <li key={t.key} className="rounded-xl bg-surface-raised px-4 py-3 text-sm">
              <span className="text-xs text-ink-secondary">{t.levelTitle}</span>
              <p className="text-ink-primary">{t.label}</p>
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
            className="glass-card-interactive flex items-center gap-3 p-5 text-left"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-muted">
              <Play className="h-6 w-6 fill-primary text-primary" />
            </div>
            <div>
              <div className="text-xs text-ink-secondary">Watch today</div>
              <div className="line-clamp-2 text-sm font-medium text-ink-primary">
                {data.suggestedVideo.title || 'Suggested video'}
              </div>
            </div>
          </motion.button>
        ) : null}
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('study')}
          className="glass-card-interactive flex items-center gap-3 p-5 text-left"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-muted">
            <Timer className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-xs text-ink-secondary">Focus session</div>
            <div className="text-sm font-medium text-ink-primary">25-min Pomodoro + flashcards</div>
          </div>
        </motion.button>
      </div>
    </div>
  )
}

export default TodayPage
