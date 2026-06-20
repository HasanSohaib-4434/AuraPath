const checkUrl = async (url) => {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, redirect: 'follow' })
    clearTimeout(timer)
    return { url, ok: res.status >= 200 && res.status < 400, status: res.status }
  } catch {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 8000)
      const res = await fetch(url, { method: 'GET', signal: ctrl.signal, redirect: 'follow' })
      clearTimeout(timer)
      return { url, ok: res.status >= 200 && res.status < 400, status: res.status }
    } catch (e) {
      return { url, ok: false, status: 0, error: e?.message || 'unreachable' }
    }
  }
}

export const validateResourceList = async (resources, { limit = 20 } = {}) => {
  const list = (Array.isArray(resources) ? resources : []).slice(0, limit)
  const results = await Promise.all(list.map((r) => checkUrl(r.url || r)))
  return results
}

export const validateRoadmapResources = async (roadmap) => {
  const levels = Array.isArray(roadmap?.levels) ? roadmap.levels : []
  const all = []
  levels.forEach((l, li) => {
    ;(Array.isArray(l?.resources) ? l.resources : []).forEach((r, ri) => {
      const url = typeof r === 'string' ? r : r?.url
      if (url) all.push({ levelIndex: li, resourceIndex: ri, url, title: r?.title || url })
    })
  })
  const checked = await validateResourceList(all.map((x) => x.url), { limit: 30 })
  return all.map((item, i) => ({ ...item, ...checked[i] }))
}
