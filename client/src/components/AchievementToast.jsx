import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Award, X } from 'lucide-react'

const AUTO_DISMISS_MS = 4500

const AchievementToast = ({ badges, onDismiss }) => {
  const list = Array.isArray(badges) ? badges : []

  useEffect(() => {
    if (!list.length) return undefined
    const timer = setTimeout(() => onDismiss?.(), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [list, onDismiss])

  if (!list.length) return null

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key={list.map((b) => b.id).join('-')}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        className="fixed bottom-28 left-1/2 z-[10040] w-[min(92vw,380px)] -translate-x-1/2 rounded-2xl border border-amber-500/40 bg-surface/95 p-4 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2 text-amber-300">
              <Award className="h-5 w-5 shrink-0" />
              <span className="font-semibold">Achievement unlocked!</span>
            </div>
            {list.map((b) => (
              <div key={b.id} className="text-sm">
                <span className="font-medium text-zinc-100">{b.title}</span>
                <span className="text-zinc-400"> — {b.desc}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg p-1 text-zinc-500 transition hover:bg-surface-elevated hover:text-zinc-200"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-surface-elevated">
          <motion.div
            className="h-full origin-left bg-amber-400/80"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}

export default AchievementToast
