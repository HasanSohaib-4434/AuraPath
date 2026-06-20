import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Loader2, X } from 'lucide-react'

const ResponsiveSheet = ({ open, onClose, title, icon: Icon, subtitle, loading, children }) => {
  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[10050] flex items-end justify-center sm:items-center sm:p-4">
          <motion.button
            type="button"
            className="absolute inset-0 overlay-backdrop backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-label="Close"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            className="relative z-[10051] flex max-h-[min(88vh,720px)] w-full flex-col overflow-hidden rounded-t-xl border border-subtle bg-surface shadow-card sm:max-h-[85vh] sm:w-[min(100%,540px)] sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-subtle/60 px-5 py-4">
              <div className="flex min-w-0 items-center gap-2">
                {Icon ? <Icon className="h-5 w-5 shrink-0 text-primary" /> : null}
                <h3 className="font-semibold text-ink-primary">{title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 text-ink-secondary transition hover:bg-surface-raised hover:text-ink-primary"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {subtitle ? (
              <div className="shrink-0 border-b border-subtle/60 px-5 py-3">
                <p className="text-sm leading-snug text-ink-secondary">{subtitle}</p>
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-ink-secondary">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Thinking…
                </div>
              ) : (
                children
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

export default ResponsiveSheet
