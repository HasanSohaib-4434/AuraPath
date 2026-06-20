const URL_RE = /https?:\/\/[^\s)\]"'<>]+/i

export const inferResourceType = (url) => {
  if (!url) return 'link'
  const u = url.toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('github.com')) return 'github'
  if (u.includes('docs.') || u.includes('/docs/') || u.includes('developer.')) return 'docs'
  return 'article'
}

export const cleanUrl = (raw) => {
  if (typeof raw !== 'string' || !raw.trim()) return ''
  const match = raw.trim().match(URL_RE)
  if (!match) return ''
  return match[0].replace(/[.,;:)\]"']+$/, '')
}

const searchUrlFor = (title, context = '') => {
  const q = [title, context].filter(Boolean).join(' ').trim()
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`
}

export const parseResourceEntry = (entry, context = '') => {
  if (typeof entry === 'string') {
    const url = cleanUrl(entry)
    let title = entry.replace(URL_RE, '').replace(/^[\s\-–—:|•]+|[\s\-–—:|•]+$/g, '').trim()
    if (!title && url) {
      try {
        title = new URL(url).hostname.replace(/^www\./, '')
      } catch {
        title = 'Resource'
      }
    }
    if (url) return { title: title || 'Resource', url, type: inferResourceType(url) }
    if (title) {
      return { title, url: searchUrlFor(title, context), type: 'article', searchFallback: true }
    }
    return null
  }
  if (entry && typeof entry === 'object') {
    const url = cleanUrl(entry.url || entry.link || entry.href || '')
    const title =
      (typeof entry.title === 'string' && entry.title.trim()) ||
      (typeof entry.name === 'string' && entry.name.trim()) ||
      ''
    if (url) {
      let finalTitle = title
      if (!finalTitle) {
        try {
          finalTitle = new URL(url).hostname.replace(/^www\./, '')
        } catch {
          finalTitle = 'Resource'
        }
      }
      const type =
        typeof entry.type === 'string' && entry.type.trim()
          ? entry.type.trim().toLowerCase()
          : inferResourceType(url)
      return { title: finalTitle, url, type }
    }
    if (title) {
      return { title, url: searchUrlFor(title, context), type: 'article', searchFallback: true }
    }
    return null
  }
  return null
}

export const normalizeResourceList = (list, context = '') => {
  if (!Array.isArray(list)) return []
  const out = []
  const seen = new Set()
  for (const item of list) {
    const r = parseResourceEntry(item, context)
    if (!r || !r.url || seen.has(r.url)) continue
    seen.add(r.url)
    out.push(r)
  }
  return out
}

export const harvestUrlsFromTasks = (tasks, context = '') => {
  if (!Array.isArray(tasks)) return []
  const out = []
  const seen = new Set()
  for (const task of tasks) {
    if (typeof task !== 'string' || !cleanUrl(task)) continue
    const r = parseResourceEntry(task, context)
    if (!r || !r.url || seen.has(r.url)) continue
    seen.add(r.url)
    out.push(r)
  }
  return out
}

export const levelResources = (level, context = '') => {
  const base = normalizeResourceList(level?.resources || [], context)
  const seen = new Set(base.map((r) => r.url))
  const extra = harvestUrlsFromTasks(level?.tasks || [], context).filter((r) => !seen.has(r.url))
  return [...base, ...extra]
}
