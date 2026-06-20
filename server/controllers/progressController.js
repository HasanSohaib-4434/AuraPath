import mongoose from 'mongoose'
import UserProgress from '../models/UserProgress.js'
import Roadmap from '../models/Roadmap.js'
import PdfKnowledge from '../models/PdfKnowledge.js'
import { achievementDetails, computeAchievements } from '../utils/achievements.js'
import { levelFromXp, xpPerTask } from '../utils/xp.js'

const today = () => new Date().toDateString()

export const getProgress = async (req, res) => {
  try {
    const { roadmapId } = req.params
    const sessionId = req.sessionId
    if (!sessionId) return res.status(400).json({ error: 'X-Session-Id required' })
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) return res.status(400).json({ error: 'Invalid roadmap id' })

    let doc = await UserProgress.findOne({ sessionId, roadmapId }).lean()
    if (!doc) {
      doc = {
        sessionId,
        roadmapId,
        completedTasks: [],
        levelNotes: {},
        pinnedResources: {},
        achievements: [],
        activityLog: [],
        pomodoroCount: 0,
        flashcardReviews: 0,
        flashcards: [],
        quizScores: {},
        streakDays: 0,
      }
    }
    return res.json(doc)
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

export const saveProgress = async (req, res) => {
  try {
    const { roadmapId } = req.params
    const sessionId = req.sessionId
    if (!sessionId) return res.status(400).json({ error: 'X-Session-Id required' })
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) return res.status(400).json({ error: 'Invalid roadmap id' })

    const roadmap = await Roadmap.findById(roadmapId).lean()
    if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' })

    const body = req.body || {}
    const completedTasks = Array.isArray(body.completedTasks)
      ? body.completedTasks.filter((t) => typeof t === 'string')
      : []

    const totalTasks = (roadmap.levels || []).reduce(
      (n, l) => n + (Array.isArray(l?.tasks) ? l.tasks.length : 0),
      0,
    )

    const pdfCount = await PdfKnowledge.countDocuments({ roadmapId })
    const existing = await UserProgress.findOne({ sessionId, roadmapId }).lean()
    const prevDone = existing?.completedTasks?.length || 0
    const newDone = completedTasks.length
    const delta = Math.max(0, newDone - prevDone)

    let activityLog = Array.isArray(existing?.activityLog) ? [...existing.activityLog] : []
    if (delta > 0) {
      const d = today()
      const idx = activityLog.findIndex((a) => a.date === d)
      if (idx >= 0) activityLog[idx] = { date: d, tasksCompleted: (activityLog[idx].tasksCompleted || 0) + delta }
      else activityLog.push({ date: d, tasksCompleted: delta })
    }

    let streakDays = Number(body.streakDays) || existing?.streakDays || 0
    if (delta > 0) {
      const d = today()
      const last = existing?.lastActiveDate
      if (last !== d) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        streakDays = last === yesterday.toDateString() ? streakDays + 1 : 1
      }
    }

    const achievements = computeAchievements({
      existing: existing?.achievements || [],
      completedTasks,
      totalTasks,
      levels: roadmap.levels,
      streakDays,
      pdfCount,
      quizPassed: Object.values(existing?.quizScores || {}).some((s) => s?.passed),
      flashcardReviews: existing?.flashcardReviews || 0,
      pomodoroCount: existing?.pomodoroCount || 0,
    })

    const xp = (existing?.xp || 0) + delta * xpPerTask
    const learnerLevel = levelFromXp(xp)

    const update = {
      completedTasks,
      levelNotes: body.levelNotes ?? existing?.levelNotes ?? {},
      pinnedResources: body.pinnedResources ?? existing?.pinnedResources ?? {},
      achievements,
      activityLog: activityLog.slice(-60),
      streakDays,
      lastActiveDate: today(),
      xp,
      learnerLevel,
      updatedAt: new Date(),
    }
    if (typeof body.pomodoroCount === 'number') update.pomodoroCount = body.pomodoroCount
    if (typeof body.flashcardReviews === 'number') update.flashcardReviews = body.flashcardReviews

    const doc = await UserProgress.findOneAndUpdate(
      { sessionId, roadmapId },
      { $set: update, $setOnInsert: { sessionId, roadmapId, flashcards: [], quizScores: {} } },
      { upsert: true, new: true, lean: true },
    )

    const newBadges = achievements.filter((a) => !(existing?.achievements || []).includes(a))
    return res.json({ ...doc, newAchievements: achievementDetails(newBadges) })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

export const getWeeklyRecap = async (req, res) => {
  try {
    const sessionId = req.sessionId
    if (!sessionId) return res.status(400).json({ error: 'X-Session-Id required' })

    const docs = await UserProgress.find({ sessionId }).lean()
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekDates = new Set()
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      weekDates.add(d.toDateString())
    }

    let tasksThisWeek = 0
    let pathsActive = 0
    let bestStreak = 0
    const achievements = new Set()

    docs.forEach((d) => {
      if (d.completedTasks?.length) pathsActive += 1
      bestStreak = Math.max(bestStreak, d.streakDays || 0)
      ;(d.activityLog || []).forEach((a) => {
        if (weekDates.has(a.date)) tasksThisWeek += a.tasksCompleted || 0
      })
      ;(d.achievements || []).forEach((a) => achievements.add(a))
    })

    return res.json({
      tasksThisWeek,
      pathsActive,
      bestStreak,
      achievements: achievementDetails([...achievements]),
      message:
        tasksThisWeek > 0
          ? `Great week! You completed ${tasksThisWeek} task${tasksThisWeek === 1 ? '' : 's'}.`
          : 'Start a session this week to build your streak.',
    })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

export const incrementPomodoro = async (req, res) => {
  try {
    const { roadmapId } = req.params
    const sessionId = req.sessionId
    if (!sessionId) return res.status(400).json({ error: 'X-Session-Id required' })

    const doc = await UserProgress.findOneAndUpdate(
      { sessionId, roadmapId },
      { $inc: { pomodoroCount: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true, lean: true },
    )
    return res.json({ pomodoroCount: doc.pomodoroCount })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}
