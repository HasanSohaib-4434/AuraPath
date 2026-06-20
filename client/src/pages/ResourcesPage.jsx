import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Filter, Layers, Loader2, Search, Video } from 'lucide-react'
import ResourceCard from '../components/ResourceCard.jsx'
import YouTubeModal from '../components/YouTubeModal.jsx'
import { api } from '../utils/api.js'
import { collectResourcesFromRoadmap, isYoutubeUrl } from '../utils/resourceLinks.js'

const ResourcesPage = ({ roadmap: initialRoadmap, roadmapId, onNavigate, onYoutubeClick, onRoadmapUpdate }) => {
  const [roadmap, setRoadmap] = useState(initialRoadmap)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [ytModal, setYtModal] = useState(null)

  useEffect(() => {
    setRoadmap(initialRoadmap)
  }, [initialRoadmap])

  useEffect(() => {
    if (!roadmapId) return
    setLoading(true)
    api
      .get(`/api/roadmaps/${roadmapId}`)
      .then((data) => {
        setRoadmap(data)
        onRoadmapUpdate?.(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [roadmapId])

  const all = useMemo(() => collectResourcesFromRoadmap(roadmap), [roadmap])

  const stats = useMemo(
    () => ({
      total: all.length,
      videos: all.filter((r) => r.type === 'youtube' || isYoutubeUrl(r.url)).length,
      docs: all.filter((r) => r.type === 'docs').length,
    }),
    [all],
  )

  const types = useMemo(() => [...new Set(all.map((r) => r.type))], [all])

  const filtered = all.filter((r) => {
    if (typeFilter === 'videos' && r.type !== 'youtube' && !isYoutubeUrl(r.url)) return false
    if (typeFilter !== 'all' && typeFilter !== 'videos' && r.type !== typeFilter) return false
    const q = query.toLowerCase()
    if (!q) return true
    return r.title.toLowerCase().includes(q) || r.url.toLowerCase().includes(q) || r.levelTitle?.toLowerCase().includes(q)
  })

  const byLevel = useMemo(() => {
    const map = new Map()
    filtered.forEach((r) => {
      const key = r.levelIndex
      if (!map.has(key)) map.set(key, { title: r.levelTitle, items: [] })
      map.get(key).items.push(r)
    })
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [filtered])

  const openYoutube = (r) => {
    if (onYoutubeClick && isYoutubeUrl(r.url)) onYoutubeClick(r)
    else setYtModal(r)
  }

  const openAll = () => {
    filtered.slice(0, 5).forEach((r) => window.open(r.url, '_blank', 'noopener,noreferrer'))
  }

  if (loading && !all.length) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-aura-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 sm:text-3xl">Resources hub</h1>
        <p className="mt-2 text-sm text-zinc-400">
          All links and videos from <span className="text-aura-300">{roadmap?.title || 'your path'}</span>
        </p>
      </div>

      {all.length > 0 ? (
        <>
          <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="glass-card p-3 text-center sm:p-4">
              <div className="text-xl font-bold text-zinc-100">{stats.total}</div>
              <div className="text-[10px] text-zinc-500 sm:text-xs">Total</div>
            </div>
            <div className="glass-card p-3 text-center sm:p-4">
              <div className="flex items-center justify-center gap-1 text-xl font-bold text-red-300">
                <Video className="h-4 w-4" />
                {stats.videos}
              </div>
              <div className="text-[10px] text-zinc-500 sm:text-xs">Videos</div>
            </div>
            <div className="glass-card p-3 text-center sm:p-4">
              <div className="text-xl font-bold text-sky-300">{stats.docs}</div>
              <div className="text-[10px] text-zinc-500 sm:text-xs">Docs</div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'videos', label: 'Videos' },
              ...types.filter((t) => t !== 'youtube').map((t) => ({ id: t, label: t })),
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTypeFilter(id)}
                className={`chip capitalize ${typeFilter === id ? 'chip-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search resources…"
                className="input-field w-full pl-9"
              />
            </div>
            <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={openAll} className="chip inline-flex items-center justify-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              Open top 5
            </motion.button>
          </div>

          {byLevel.map(([levelIndex, { title, items }]) => (
            <section key={levelIndex} className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-aura-400" />
                <h2 className="text-sm font-semibold text-zinc-200">
                  Level {levelIndex + 1}: {title}
                </h2>
                <span className="text-xs text-zinc-500">({items.length})</span>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {items.map((r, i) => (
                  <ResourceCard
                    key={`${r.url}-${levelIndex}-${i}`}
                    resource={r}
                    index={i}
                    subtitle={r.searchFallback ? 'Search suggestion' : r.levelTitle}
                    onYoutubeClick={isYoutubeUrl(r.url) ? () => openYoutube(r) : undefined}
                  />
                ))}
              </ul>
            </section>
          ))}

          {!filtered.length ? (
            <p className="text-center text-sm text-zinc-500">No resources match your search. Clear filters to see all.</p>
          ) : null}
        </>
      ) : (
        <div className="glass-card py-12 text-center sm:py-16">
          <Video className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
          <h2 className="text-lg font-semibold text-zinc-200">No resources on this path yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            Generate a new learning path — AuraPath will add videos, docs, and tutorials to each level. Older paths may need
            to be recreated.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => onNavigate?.('home')} className="btn-primary">
              Create new path
            </button>
            <button type="button" onClick={() => onNavigate?.('active')} className="btn-secondary">
              View active path
            </button>
          </div>
        </div>
      )}

      {!onYoutubeClick ? (
        <YouTubeModal open={!!ytModal} url={ytModal?.url} title={ytModal?.title} onClose={() => setYtModal(null)} />
      ) : null}
    </div>
  )
}

export default ResourcesPage
