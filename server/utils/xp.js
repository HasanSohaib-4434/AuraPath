export const xpForLevel = (level) => level * 100
export const levelFromXp = (xp) => Math.max(1, Math.floor(Math.sqrt(xp / 50)) + 1)
export const xpPerTask = 15
export const xpPerQuiz = 40
export const xpPerPomodoro = 10
