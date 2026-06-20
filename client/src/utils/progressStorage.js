const PREFIX = 'aurapath-progress-'

export const loadProgress = (roadmapId) => {
  if (!roadmapId) return new Set()
  try {
    const raw = localStorage.getItem(`${PREFIX}${roadmapId}`)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

export const saveProgress = (roadmapId, checkedSet) => {
  if (!roadmapId) return
  try {
    localStorage.setItem(`${PREFIX}${roadmapId}`, JSON.stringify([...checkedSet]))
  } catch {}
}

export const listAllProgress = () => {
  const out = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(PREFIX)) continue
      const roadmapId = key.slice(PREFIX.length)
      const checked = loadProgress(roadmapId)
      out.push({ roadmapId, doneCount: checked.size, keys: [...checked] })
    }
  } catch {}
  return out
}

export const mergeProgressFromServer = (roadmapId, completedTasks) => {
  if (!roadmapId || !Array.isArray(completedTasks)) return loadProgress(roadmapId)
  const local = loadProgress(roadmapId)
  const merged = new Set([...local, ...completedTasks])
  saveProgress(roadmapId, merged)
  return merged
}
