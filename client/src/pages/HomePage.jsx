import { motion } from 'framer-motion'
import { BookOpen, Map, Sparkles, Target } from 'lucide-react'
import { useEffect } from 'react'
import GoalInput from '../components/GoalInput.jsx'

const STEPS = [
  { icon: Target, label: 'Set goal', desc: 'Choose what to learn' },
  { icon: Map, label: 'Get roadmap', desc: 'AI builds your path' },
  { icon: BookOpen, label: 'Study & ask', desc: 'Upload PDFs, chat with AI' },
]

const HomePage = ({
  loading,
  compareLoading,
  loadingTip,
  loadingTips,
  error,
  onSubmit,
  onCompare,
  onNavigate,
  compareVariants,
  onPickVariant,
}) => {
  useEffect(() => {
    if (compareVariants?.length && !compareLoading) {
      requestAnimationFrame(() => {
        document.getElementById('compare-results')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    }
  }, [compareVariants, compareLoading])

  return (
  <div>
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-soft px-4 py-1.5 text-xs font-medium text-primary-hover"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Welcome to AuraPath
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-4xl font-bold tracking-tight sm:text-5xl"
      >
        <span className="text-gradient">Your path.</span>
        <br />
        <span className="text-ink-primary">Your pace.</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mx-auto mt-4 max-w-lg text-base text-ink-secondary"
      >
        Generate AI roadmaps, track tasks, upload study PDFs, and chat with your materials.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {STEPS.map(({ icon: Icon, label, desc }, i) => (
          <motion.button
            key={label}
            type="button"
            whileHover={{ y: -6, scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(i === 2 ? 'study' : i === 1 ? 'paths' : 'home')}
            className="glass-card-interactive group flex flex-col items-center p-5 text-center"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-surface-raised text-primary transition group-hover:bg-primary-muted group-hover:text-primary-hover">
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold text-ink-primary">{label}</div>
            <div className="mt-0.5 text-xs text-ink-secondary">{desc}</div>
          </motion.button>
        ))}
      </motion.div>
    </motion.section>

    <GoalInput
      loading={loading}
      compareLoading={compareLoading}
      compareVariants={compareVariants}
      onSubmit={onSubmit}
      onCompare={onCompare}
      onPickVariant={onPickVariant}
    />

    {loading && !compareLoading ? (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto mt-8 max-w-md text-center">
        <div className="glass-card p-6">
          <div className="mx-auto mb-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: '90%' }}
              transition={{ duration: 10, ease: 'easeInOut' }}
            />
          </div>
          <motion.p key={loadingTip} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-ink-secondary">
            {loadingTips[loadingTip]}
          </motion.p>
        </div>
      </motion.div>
    ) : null}

    {error ? (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-6 rounded-xl border border-danger/30 bg-danger-muted p-4 text-sm text-danger"
      >
        {error}
      </motion.div>
    ) : null}
  </div>
  )
}

export default HomePage
