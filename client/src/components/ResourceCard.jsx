import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Code2, ExternalLink, Play, Video } from 'lucide-react'
import { hostnameLabel, isYoutubeUrl, youtubeThumb } from '../utils/resourceLinks.js'

const typeStyles = {
  youtube: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    badge: 'bg-red-500/15 text-red-300',
    icon: Video,
    action: 'Watch',
  },
  docs: {
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/5',
    badge: 'bg-sky-500/15 text-sky-300',
    icon: BookOpen,
    action: 'Read docs',
  },
  github: {
    border: 'border-zinc-500/30',
    bg: 'bg-zinc-500/5',
    badge: 'bg-zinc-500/15 text-zinc-300',
    icon: Code2,
    action: 'View repo',
  },
  course: {
    border: 'border-aura-500/30',
    bg: 'bg-aura-500/5',
    badge: 'bg-aura-500/15 text-aura-300',
    icon: BookOpen,
    action: 'Open course',
  },
  article: {
    border: 'border-cyan-500/25',
    bg: 'bg-cyan-500/5',
    badge: 'bg-cyan-500/15 text-cyan-300',
    icon: ExternalLink,
    action: 'Open',
  },
  link: {
    border: 'border-surface-border',
    bg: 'bg-surface/40',
    badge: 'bg-surface-elevated text-zinc-400',
    icon: ExternalLink,
    action: 'Open',
  },
}

const ResourceCard = ({ resource, index, subtitle, onYoutubeClick }) => {
  const { title, url, type } = resource
  const isYoutube = isYoutubeUrl(url)
  const displayType = isYoutube ? 'youtube' : type
  const style = typeStyles[displayType] || typeStyles.link
  const Icon = style.icon
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
      className={`overflow-hidden rounded-xl border ${style.border} ${style.bg}`}
    >
      <Wrapper {...wrapperProps} className="group flex w-full gap-3 p-3 text-left transition">
        {thumb && !thumbFailed ? (
          <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
            <img
              src={thumb}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition group-hover:scale-105"
              onError={() => setThumbFailed(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/35 transition group-hover:bg-black/20">
              <Play className="h-7 w-7 fill-white text-white drop-shadow" />
            </div>
          </div>
        ) : (
          <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-elevated">
            <Icon className="h-5 w-5 text-zinc-400 transition group-hover:text-aura-300" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.badge}`}>
              {displayType}
            </span>
            <span className="truncate text-[11px] text-zinc-500">{hostnameLabel(url)}</span>
          </div>
          <div className="mt-1 line-clamp-2 text-sm font-medium text-zinc-100 transition group-hover:text-white">
            {title}
          </div>
          {subtitle ? <div className="mt-0.5 text-[11px] text-zinc-500">{subtitle}</div> : null}
          <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-aura-300">
            {useInlinePlayer ? 'Watch here' : style.action}
            {!useInlinePlayer ? <ExternalLink className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
          </div>
        </div>
      </Wrapper>
    </motion.li>
  )
}

export default ResourceCard
