import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ExternalLink, Play, Video } from 'lucide-react'
import { hostnameLabel, isYoutubeUrl, youtubeThumb } from '../utils/resourceLinks.js'

const cardClass =
  'overflow-hidden rounded-xl border border-subtle bg-surface-raised transition hover:border-primary/30 hover:shadow-glow-sm'

const ResourceCard = ({ resource, index, subtitle, onYoutubeClick }) => {
  const { title, url, type } = resource
  const isYoutube = isYoutubeUrl(url)
  const displayType = isYoutube ? 'youtube' : type || 'link'
  const Icon = isYoutube ? Video : BookOpen
  const thumb = isYoutube ? youtubeThumb(url) : ''
  const [thumbFailed, setThumbFailed] = useState(false)

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isYoutube && onYoutubeClick) onYoutubeClick(resource)
    else if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const useInlinePlayer = isYoutube && onYoutubeClick
  const Wrapper = useInlinePlayer ? 'button' : 'a'
  const wrapperProps = useInlinePlayer
    ? { type: 'button', onClick: handleClick }
    : {
        href: url || '#',
        target: '_blank',
        rel: 'noopener noreferrer',
        onClick: (e) => {
          if (!url) e.preventDefault()
          e.stopPropagation()
        },
      }

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className={cardClass}
    >
      <Wrapper {...wrapperProps} className="group flex w-full gap-3 p-4 text-left transition">
        {thumb && !thumbFailed ? (
          <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-base">
            <img
              src={thumb}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition group-hover:scale-105"
              onError={() => setThumbFailed(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-base/40 transition group-hover:bg-base/25">
              <Play className="h-7 w-7 fill-ink-primary text-ink-primary drop-shadow" />
            </div>
          </div>
        ) : (
          <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-muted">
            <Icon className="h-5 w-5 text-primary transition group-hover:text-primary-hover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              {displayType}
            </span>
            <span className="truncate text-[11px] text-ink-secondary">{hostnameLabel(url)}</span>
          </div>
          <div className="mt-1 line-clamp-2 text-sm font-medium text-ink-primary transition group-hover:text-primary-hover">
            {title}
          </div>
          {subtitle ? <div className="mt-0.5 text-[11px] text-ink-secondary">{subtitle}</div> : null}
          <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
            {useInlinePlayer ? 'Watch here' : 'Open'}
            {!useInlinePlayer ? <ExternalLink className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
          </div>
        </div>
      </Wrapper>
    </motion.li>
  )
}

export default ResourceCard
