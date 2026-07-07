const STORAGE_KEY = 'auraPathRefreshGames'

const DEFAULT_RECORDS = {
  breathBloom: { bestCycles: 0, totalCycles: 0, sessions: 0, lastPlayed: null },
  focusMatch: { bestTimeSec: null, bestMoves: null, wins: 0, gamesPlayed: 0, lastPlayed: null },
  zenPop: { highScore: 0, bestCombo: 0, totalPops: 0, gamesPlayed: 0, lastPlayed: null },
}

export const readRefreshRecords = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_RECORDS }
    const parsed = JSON.parse(raw)
    return {
      breathBloom: { ...DEFAULT_RECORDS.breathBloom, ...parsed.breathBloom },
      focusMatch: { ...DEFAULT_RECORDS.focusMatch, ...parsed.focusMatch },
      zenPop: { ...DEFAULT_RECORDS.zenPop, ...parsed.zenPop },
    }
  } catch {
    return { ...DEFAULT_RECORDS }
  }
}

const writeRecords = (records) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {}
}

export const recordBreathSession = (cyclesCompleted) => {
  const records = readRefreshRecords()
  const n = Math.max(0, Math.floor(cyclesCompleted))
  records.breathBloom = {
    bestCycles: Math.max(records.breathBloom.bestCycles, n),
    totalCycles: records.breathBloom.totalCycles + n,
    sessions: records.breathBloom.sessions + 1,
    lastPlayed: new Date().toISOString(),
  }
  writeRecords(records)
  return records.breathBloom
}

export const recordFocusMatchWin = (timeSec, moves) => {
  const records = readRefreshRecords()
  const prev = records.focusMatch
  records.focusMatch = {
    bestTimeSec: prev.bestTimeSec == null ? timeSec : Math.min(prev.bestTimeSec, timeSec),
    bestMoves: prev.bestMoves == null ? moves : Math.min(prev.bestMoves, moves),
    wins: prev.wins + 1,
    gamesPlayed: prev.gamesPlayed + 1,
    lastPlayed: new Date().toISOString(),
  }
  writeRecords(records)
  return records.focusMatch
}

export const recordFocusMatchPlayed = () => {
  const records = readRefreshRecords()
  records.focusMatch = {
    ...records.focusMatch,
    gamesPlayed: records.focusMatch.gamesPlayed + 1,
    lastPlayed: new Date().toISOString(),
  }
  writeRecords(records)
  return records.focusMatch
}

export const recordZenPopRound = (score, bestCombo = 0) => {
  const records = readRefreshRecords()
  const n = Math.max(0, Math.floor(score))
  const combo = Math.max(0, Math.floor(bestCombo))
  records.zenPop = {
    highScore: Math.max(records.zenPop.highScore, n),
    bestCombo: Math.max(records.zenPop.bestCombo || 0, combo),
    totalPops: records.zenPop.totalPops + n,
    gamesPlayed: records.zenPop.gamesPlayed + 1,
    lastPlayed: new Date().toISOString(),
  }
  writeRecords(records)
  return records.zenPop
}

export const formatLastPlayed = (iso) => {
  if (!iso) return 'Never'
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now - d
    if (diffMs < 60_000) return 'Just now'
    if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`
    if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return 'Recently'
  }
}
