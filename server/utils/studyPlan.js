const parseWeeks = (duration) => {
  const d = String(duration || '8 weeks').toLowerCase()
  const w = d.match(/(\d+)\s*week/)
  if (w) return Math.max(1, parseInt(w[1], 10))
  const m = d.match(/(\d+)\s*month/)
  if (m) return Math.max(1, parseInt(m[1], 10) * 4)
  return 8
}

export const buildStudyPlan = (roadmap, duration) => {
  const levels = Array.isArray(roadmap?.levels) ? roadmap.levels : []
  const weeks = parseWeeks(duration || roadmap?.duration)
  if (!levels.length) return { weeks: [], totalWeeks: weeks }

  const perWeek = Math.max(1, Math.ceil(levels.length / weeks))
  const plan = []
  let weekNum = 1
  for (let i = 0; i < levels.length; i += perWeek) {
    const slice = levels.slice(i, i + perWeek)
    const tasks = slice.flatMap((l, li) =>
      (Array.isArray(l.tasks) ? l.tasks : []).map((t, ti) => ({
        levelIndex: i + li,
        taskIndex: ti,
        label: typeof t === 'string' ? t : t?.title || '',
        levelTitle: l.title || `Level ${i + li + 1}`,
      })),
    )
    plan.push({
      week: weekNum,
      label: `Week ${weekNum}`,
      levels: slice.map((l, li) => ({ index: i + li, title: l.title || `Level ${i + li + 1}` })),
      tasks,
      taskCount: tasks.length,
    })
    weekNum += 1
  }
  return { weeks: plan, totalWeeks: plan.length, durationWeeks: weeks }
}
