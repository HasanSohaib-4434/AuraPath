import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, BarChart3, Briefcase, Flame, Target, TrendingUp, Trophy, Zap } from 'lucide-react'
import CertificateModal from '../components/CertificateModal.jsx'
import SelfAssessment from '../components/SelfAssessment.jsx'
import StudyGroupPanel from '../components/StudyGroupPanel.jsx'
import WeeklyRecap from '../components/WeeklyRecap.jsx'
import { api } from '../utils/api.js'

const ProgressPage = ({ roadmap, roadmapId, progressStats, onNavigate }) => {
  const { totalTasks, doneTasks, progressPct, streakDays, pathsTracked } = progressStats
  const [portfolio, setPortfolio] = useState(null)
  const [assessment, setAssessment] = useState({ before: null, after: null })
  const [xpInfo, setXpInfo] = useState({ xp: 0, learnerLevel: 1 })

  useEffect(() => {
    if (!roadmapId) return
    api.get(`/api/student/${roadmapId}/portfolio`).then(setPortfolio).catch(() => {})
    api.get(`/api/roadmaps/${roadmapId}/progress`).then((d) => {
      setAssessment({ before: d.confidenceBefore, after: d.confidenceAfter })
      setXpInfo({ xp: d.xp || 0, learnerLevel: d.learnerLevel || 1 })
    }).catch(() => {})
  }, [roadmapId])

  const stats = [
    { icon: Target, label: 'Tasks completed', value: doneTasks, sub: totalTasks ? `of ${totalTasks} on active path` : 'Open a path first' },
    { icon: TrendingUp, label: 'Active path progress', value: `${progressPct}%`, sub: roadmap?.title || 'No active path' },
    { icon: Zap, label: 'Learner level', value: xpInfo.learnerLevel, sub: `${xpInfo.xp} XP` },
    { icon: Flame, label: 'Study streak', value: streakDays, sub: streakDays === 1 ? 'day' : 'days' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 sm:text-3xl">Progress</h1>
        <p className="mt-2 text-sm text-zinc-400">Track growth, portfolio, and weekly stats.</p>
      </div>

      <WeeklyRecap />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {stats.map(({ icon: Icon, label, value, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -4 }}
            className="glass-card-interactive p-4 sm:p-5"
          >
            <Icon className="mb-2 h-5 w-5 text-aura-400" />
            <div className="text-xl font-bold text-zinc-100 sm:text-2xl">{value}</div>
            <div className="mt-1 text-xs font-medium text-zinc-300 sm:text-sm">{label}</div>
            <div className="mt-0.5 text-[10px] text-zinc-500 sm:text-xs">{sub}</div>
          </motion.div>
        ))}
      </div>

      {roadmapId ? (
        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <SelfAssessment
            roadmapId={roadmapId}
            before={assessment.before}
            after={assessment.after}
            onSave={(field, val) => setAssessment((a) => ({ ...a, [field === 'confidenceBefore' ? 'before' : 'after']: val }))}
          />
          <StudyGroupPanel roadmapId={roadmapId} />
        </div>
      ) : null}

      {portfolio?.resumeBullets?.length ? (
        <div className="glass-card mb-8 p-5">
          <div className="mb-3 flex items-center gap-2 font-semibold text-zinc-200">
            <Briefcase className="h-5 w-5 text-aura-400" />
            Resume bullets
          </div>
          <ul className="space-y-2 text-sm text-zinc-400">
            {portfolio.resumeBullets.map((b, i) => (
              <li key={i}>{b.replace(/^[-•]\s*/, '')}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {totalTasks > 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card mb-8 p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-medium text-zinc-200">Active path completion</span>
            <span className="text-aura-400">{progressPct}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-surface-elevated sm:h-4">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-aura-600 via-cyan-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
        </motion.div>
      ) : null}

      {progressPct >= 100 && totalTasks > 0 ? (
        <>
          <CertificateModal open title={roadmap?.title} progressPct={progressPct} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card flex flex-col items-start gap-4 border-emerald-500/30 bg-emerald-500/5 p-5 sm:flex-row sm:items-center sm:p-6"
          >
            <Trophy className="h-10 w-10 shrink-0 text-emerald-400" />
            <div>
              <div className="font-semibold text-emerald-200">Path complete!</div>
              <p className="text-sm text-zinc-400">Download your certificate above or revisit Study Hub.</p>
            </div>
          </motion.div>
        </>
      ) : (
        <div className="glass-card p-5 text-center sm:p-6">
          <Award className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
          <p className="text-sm text-zinc-400">
            {roadmap ? 'Keep going — check Today for your daily plan.' : 'Generate or open a path to start tracking progress.'}
          </p>
          <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={() => onNavigate(roadmap ? 'today' : 'home')} className="btn-primary mt-4">
            {roadmap ? 'Open Today' : 'Create a path'}
          </motion.button>
        </div>
      )}
    </div>
  )
}

export default ProgressPage
