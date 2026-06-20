export const ACHIEVEMENTS = {
  first_path: { id: 'first_path', title: 'Pathfinder', desc: 'Created your first learning path' },
  pdf_upload: { id: 'pdf_upload', title: 'Researcher', desc: 'Uploaded study material' },
  level_complete: { id: 'level_complete', title: 'Level up', desc: 'Completed a full level' },
  path_complete: { id: 'path_complete', title: 'Graduate', desc: 'Finished every task on a path' },
  streak_3: { id: 'streak_3', title: 'On fire', desc: '3-day study streak' },
  streak_7: { id: 'streak_7', title: 'Dedicated', desc: '7-day study streak' },
  quiz_pass: { id: 'quiz_pass', title: 'Quiz master', desc: 'Passed a level quiz (70%+)' },
  flashcards_10: { id: 'flashcards_10', title: 'Memory builder', desc: 'Reviewed 10 flashcards' },
  pomodoro_5: { id: 'pomodoro_5', title: 'Focus mode', desc: 'Completed 5 pomodoro sessions' },
  shared_path: { id: 'shared_path', title: 'Mentor', desc: 'Shared a path with others' },
}

export const computeAchievements = ({
  existing = [],
  completedTasks = [],
  totalTasks = 0,
  levels = [],
  streakDays = 0,
  pdfCount = 0,
  quizPassed = false,
  flashcardReviews = 0,
  pomodoroCount = 0,
  shared = false,
  isNewPath = false,
}) => {
  const earned = new Set(existing)
  if (isNewPath) earned.add('first_path')
  if (pdfCount > 0) earned.add('pdf_upload')
  if (shared) earned.add('shared_path')
  if (quizPassed) earned.add('quiz_pass')
  if (flashcardReviews >= 10) earned.add('flashcards_10')
  if (pomodoroCount >= 5) earned.add('pomodoro_5')
  if (streakDays >= 3) earned.add('streak_3')
  if (streakDays >= 7) earned.add('streak_7')
  if (totalTasks > 0 && completedTasks.length >= totalTasks) earned.add('path_complete')

  levels.forEach((level, idx) => {
    const tasks = Array.isArray(level?.tasks) ? level.tasks : []
    if (!tasks.length) return
    const done = tasks.filter((_, ti) => completedTasks.includes(`${idx}-${ti}`)).length
    if (done === tasks.length) earned.add(`level_${idx}_done`)
    if (done === tasks.length && !earned.has('level_complete')) earned.add('level_complete')
  })

  return [...earned]
}

export const achievementDetails = (ids) =>
  ids.map((id) => ACHIEVEMENTS[id] || { id, title: id.replace(/_/g, ' '), desc: 'Achievement unlocked' })
