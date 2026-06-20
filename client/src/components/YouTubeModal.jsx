import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cleanUrl, isYoutubeUrl, youtubeVideoId } from '../utils/resourceLinks.js'

const normalizeWatchUrl = (raw) => cleanUrl(typeof raw === 'string' ? raw : raw?.url || raw?.title || '')

const YouTubeModal = ({ open, url, title, onClose }) => {
  const watchUrl = normalizeWatchUrl(url)
  const id = youtubeVideoId(watchUrl)

  useEffect(() => {
    if (!open) return undefined
    if (!id) {
      onClose?.()
      if (watchUrl) window.open(watchUrl, '_blank', 'noopener,noreferrer')
      return undefined
    }
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
  }, [open, id, watchUrl, onClose])

  if (!open || !id) return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-label="Close video"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title || 'YouTube video'}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-[10051] w-full max-w-4xl overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
              <h3 className="truncate pr-4 text-sm font-medium text-zinc-200">{title || 'Video'}</h3>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-surface-elevated hover:text-zinc-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <iframe
                title={title || 'YouTube video'}
                src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

export default YouTubeModal
