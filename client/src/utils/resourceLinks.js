const URL_RE = /https?:\/\/[^\s)\]"'<>]+/i

export const cleanUrl = (raw) => {
  if (typeof raw !== 'string' || !raw.trim()) return ''
  const match = raw.trim().match(URL_RE)
  if (!match) return ''
  return match[0].replace(/[.,;:)\]"']+$/, '')
}

export const youtubeVideoId = (url) => {
  if (!url) return ''
  let normalized = String(url).trim()
  if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`
  try {
    const u = new URL(normalized)
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0].split('?')[0]
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtube-nocookie.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      const parts = u.pathname.split('/').filter(Boolean)
      for (const key of ['embed', 'shorts', 'live', 'v']) {
        const i = parts.indexOf(key)
        if (i >= 0 && parts[i + 1]) return parts[i + 1]
      }
    }
  } catch {}
  return ''
}

export const isYoutubeUrl = (url) => !!youtubeVideoId(url)

export const youtubeThumb = (url) => {
  const id = youtubeVideoId(url)
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : ''
}

export const hostnameLabel = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'link'
  }
}

const inferType = (url) => {
  if (!url) return 'link'
  const u = url.toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('github.com')) return 'github'
  if (u.includes('docs.') || u.includes('/docs/') || u.includes('developer.')) return 'docs'
  if (u.includes('coursera') || u.includes('udemy') || u.includes('edx')) return 'course'
  return 'article'
}

const searchUrlFor = (title, context = '') => {
  const q = [title, context].filter(Boolean).join(' ').trim()
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`
}

export const normalizeClientResource = (r, context = '') => {
  if (typeof r === 'string') {
    const trimmed = r.trim()
    if (!trimmed) return null
    const url = cleanUrl(trimmed)
    if (url) {
      const title = trimmed.replace(URL_RE, '').replace(/^[\s\-–—:|•]+|[\s\-–—:|•]+$/g, '').trim() || hostnameLabel(url)
      return { title, url, type: inferType(url) }
    }
    return {
      title: trimmed,
      url: searchUrlFor(trimmed, context),
      type: 'article',
      searchFallback: true,
    }
  }

  if (r && typeof r === 'object') {
    const title = (typeof r.title === 'string' && r.title.trim()) || (typeof r.name === 'string' && r.name.trim()) || ''
    let url = cleanUrl(r.url || r.link || r.href || '')
    if (!url && title) url = cleanUrl(title)
    if (url) {
      const type = r.type || inferType(url)
      return {
        title: title || hostnameLabel(url),
        url,
        type: inferType(url) === 'youtube' ? 'youtube' : type,
      }
    }
    if (title) {
      return {
        title,
        url: searchUrlFor(title, context),
        type: 'article',
        searchFallback: true,
      }
    }
  }

  return null
}

export const resourcesForLevel = (level, context = '') => {
  const out = []
  const seen = new Set()
  const add = (r) => {
    const norm = normalizeClientResource(r, context)
    if (!norm || !norm.url || seen.has(norm.url)) return
    seen.add(norm.url)
    out.push(norm)
  }
  ;(Array.isArray(level?.resources) ? level.resources : []).forEach(add)
  ;(Array.isArray(level?.tasks) ? level.tasks : []).forEach((t) => {
    if (typeof t === 'string' && cleanUrl(t)) add(t)
  })
  return out
}

export const collectResourcesFromRoadmap = (roadmap) => {
  const context = roadmap?.goal || roadmap?.title || ''
  const out = []
  const seen = new Set()

  const addResource = (r, li, level) => {
    const norm = normalizeClientResource(r, context)
    if (!norm) return
    const key = norm.url || `${li}-${norm.title}`
    if (seen.has(key)) return
    seen.add(key)
    out.push({
      ...norm,
      levelIndex: li,
      levelTitle: level?.title || `Level ${li + 1}`,
    })
  }

  ;(roadmap?.levels || []).forEach((level, li) => {
    const list = Array.isArray(level?.resources) ? level.resources : []
    list.forEach((r) => addResource(r, li, level))

    const tasks = Array.isArray(level?.tasks) ? level.tasks : []
    tasks.forEach((t) => {
      if (typeof t === 'string' && cleanUrl(t)) addResource(t, li, level)
    })
  })

  return out
}
