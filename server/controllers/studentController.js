import crypto from 'crypto'
import mongoose from 'mongoose'
import Roadmap from '../models/Roadmap.js'
import StudyGroup from '../models/StudyGroup.js'
import UserProgress from '../models/UserProgress.js'
import { levelFromXp } from '../utils/xp.js'
import { generateText } from '../utils/geminiClient.js'
import { levelResources } from '../utils/resourceNormalizer.js'
import { PATH_TEMPLATES } from '../utils/pathTemplates.js'

const daysUntil = (date) => {
  if (!date) return null
  const d = new Date(date)
  const now = new Date()
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24))
}

export const getTodayDashboard = async (req, res) => {
  try {
    const { roadmapId } = req.params
    const sessionId = req.sessionId
    if (!sessionId) return res.status(400).json({ error: 'X-Session-Id required' })
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) return res.status(400).json({ error: 'Invalid id' })

    const roadmap = await Roadmap.findById(roadmapId).lean()
    if (!roadmap) return res.status(404).json({ error: 'Not found' })

    const progress = await UserProgress.findOne({ sessionId, roadmapId }).lean()
    const completed = new Set(progress?.completedTasks || [])
    const plan = buildStudyPlan(roadmap, roadmap.duration)

    const todayWeek = plan.weeks[0]
    const nextTasks = []
    ;(roadmap.levels || []).forEach((level, li) => {
      ;(level.tasks || []).forEach((t, ti) => {
        const key = `${li}-${ti}`
        if (!completed.has(key) && nextTasks.length < 5) {
          nextTasks.push({
            key,
            levelIndex: li,
            taskIndex: ti,
            label: typeof t === 'string' ? t : t?.title || '',
            levelTitle: level.title,
          })
        }
      })
    })

    const now = new Date()
    const dueFlashcards = (progress?.flashcards || []).filter((c) => new Date(c.nextReview) <= now)

    const context = roadmap.goal || roadmap.title || ''
    const allResources = (roadmap.levels || []).flatMap((l, li) =>
      levelResources(l, context).map((r) => ({ ...r, levelIndex: li })),
    )
    const youtubeResource = allResources.find(
      (r) => r.type === 'youtube' || /youtube|youtu\.be/i.test(r.url || ''),
    )

    const daysToExam = daysUntil(roadmap.examDate)
    const xp = progress?.xp || 0
    const learnerLevel = levelFromXp(xp)

    return res.json({
      greeting: getGreeting(),
      nextTasks: nextTasks.slice(0, 3),
      dueFlashcards: dueFlashcards.length,
      suggestedVideo: youtubeResource || null,
      weekFocus: todayWeek?.label || 'Week 1',
      weekLevels: todayWeek?.levels || [],
      examCountdown: daysToExam,
      xp,
      learnerLevel,
      xpToNext: learnerLevel * 100 - xp,
      pomodoroSuggested: true,
      progressPct: progress?.completedTasks?.length
        ? Math.round(
            (progress.completedTasks.length /
              (roadmap.levels || []).reduce((n, l) => n + (l.tasks?.length || 0), 0)) *
              100,
          )
        : 0,
    })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export const getStuckHint = async (req, res) => {
  try {
    const { roadmapId } = req.params
    const { levelIndex, taskIndex, taskLabel } = req.body || {}
    const roadmap = await Roadmap.findById(roadmapId).lean()
    if (!roadmap) return res.status(404).json({ error: 'Not found' })

    const level = roadmap.levels?.[levelIndex]
    const task = taskLabel || level?.tasks?.[taskIndex]
    const hint = await generateText(
      [
        `Student is stuck on: "${task}" in path "${roadmap.title}", level "${level?.title}".`,
        'Give 3 progressive hints (hint 1 gentle, hint 3 more direct).',
        'Include one 15-minute micro-step they can do right now. Do NOT give the full answer.',
      ].join('\n'),
      { system: 'You are a supportive tutor.', temperature: 0.5 },
    )
    return res.json({ hint })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

export const mockInterview = async (req, res) => {
  try {
    const { roadmapId } = req.params
    const { answer, questionIndex, questions } = req.body || {}
    const roadmap = await Roadmap.findById(roadmapId).lean()
    if (!roadmap) return res.status(404).json({ error: 'Not found' })

    if (!questions) {
      const raw = await generateText(
        `Generate 5 oral exam questions for "${roadmap.title}". Goal: ${roadmap.goal || roadmap.title}. Return numbered list only.`,
        { temperature: 0.5 },
      )
      const qs = raw.split('\n').filter((l) => /^\d+[\.)]/.test(l.trim())).slice(0, 5)
      return res.json({ questions: qs.length ? qs : [raw] })
    }

    const q = questions[questionIndex] || 'Question'
    const feedback = await generateText(
      [`Question: ${q}`, `Student answer: ${answer || '(no answer)'}`, 'Give brief feedback: score /10, what was good, one improvement.'].join('\n\n'),
      { temperature: 0.4 },
    )
    return res.json({ feedback })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

export const getPortfolio = async (req, res) => {
  try {
    const { roadmapId } = req.params
    const sessionId = req.sessionId
    const roadmap = await Roadmap.findById(roadmapId).lean()
    const progress = await UserProgress.findOne({ sessionId, roadmapId }).lean()
    if (!roadmap) return res.status(404).json({ error: 'Not found' })

    const completed = progress?.completedTasks || []
    const projects = (roadmap.levels || [])
      .map((l, li) => ({
        level: l.title,
        tasksDone: (l.tasks || []).filter((_, ti) => completed.includes(`${li}-${ti}`)).length,
        total: (l.tasks || []).length,
      }))
      .filter((p) => p.tasksDone > 0)

    let resumeBullets = []
    try {
      const raw = await generateText(
        `Write 5 resume bullet points for completing learning path "${roadmap.title}". Tasks completed: ${completed.length}. Use action verbs.`,
        { temperature: 0.4 },
      )
      resumeBullets = raw.split('\n').filter((l) => l.trim().startsWith('-') || l.trim().startsWith('•')).slice(0, 6)
      if (!resumeBullets.length) resumeBullets = raw.split('\n').filter(Boolean).slice(0, 5)
    } catch {}

    return res.json({
      title: roadmap.title,
      goal: roadmap.goal,
      progressPct: completed.length,
      projects,
      resumeBullets,
      confidenceBefore: progress?.confidenceBefore,
      confidenceAfter: progress?.confidenceAfter,
    })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

export const saveAssessment = async (req, res) => {
  try {
    const { roadmapId } = req.params
    const sessionId = req.sessionId
    if (!sessionId) return res.status(400).json({ error: 'Session required' })
    const { confidenceBefore, confidenceAfter } = req.body || {}

    const update = {}
    if (typeof confidenceBefore === 'number') update.confidenceBefore = confidenceBefore
    if (typeof confidenceAfter === 'number') update.confidenceAfter = confidenceAfter

    const doc = await UserProgress.findOneAndUpdate(
      { sessionId, roadmapId },
      { $set: update },
      { upsert: true, new: true, lean: true },
    )
    return res.json(doc)
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

export const listTemplates = async (req, res) => {
  return res.json(PATH_TEMPLATES)
}

export const listCommunity = async (req, res) => {
  try {
    const docs = await Roadmap.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(30)
      .select('title description goal duration createdAt levels shareToken')
      .lean()
    const items = docs.map((d) => ({
      _id: d._id,
      title: d.title,
      description: d.description,
      goal: d.goal,
      duration: d.duration,
      levelCount: d.levels?.length || 0,
      taskCount: (d.levels || []).reduce((n, l) => n + (l.tasks?.length || 0), 0),
      shareToken: d.shareToken,
    }))
    return res.json(items)
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

export const createStudyGroup = async (req, res) => {
  try {
    const { roadmapId, name } = req.body || {}
    const sessionId = req.sessionId
    if (!sessionId) return res.status(400).json({ error: 'Session required' })
    const code = crypto.randomBytes(3).toString('hex').toUpperCase()
    const group = await StudyGroup.create({
      name: name || 'Study Group',
      code,
      roadmapId,
      ownerSessionId: sessionId,
      members: [sessionId],
    })
    return res.json(group)
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

export const joinStudyGroup = async (req, res) => {
  try {
    const { code } = req.body || {}
    const sessionId = req.sessionId
    if (!sessionId || !code) return res.status(400).json({ error: 'Code required' })

    const group = await StudyGroup.findOne({ code: String(code).toUpperCase() })
    if (!group) return res.status(404).json({ error: 'Group not found' })

    if (!group.members.includes(sessionId)) {
      group.members.push(sessionId)
      await group.save()
    }
    const roadmap = await Roadmap.findById(group.roadmapId).lean()
    return res.json({ group, roadmap, memberCount: group.members.length })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

export const getGroupLeaderboard = async (req, res) => {
  try {
    const { code } = req.params
    const group = await StudyGroup.findOne({ code: String(code).toUpperCase() }).lean()
    if (!group) return res.status(404).json({ error: 'Not found' })

    const progresses = await UserProgress.find({
      roadmapId: group.roadmapId,
      sessionId: { $in: group.members },
    }).lean()

    const board = progresses
      .map((p) => ({
        sessionId: p.sessionId.slice(0, 8),
        tasksDone: p.completedTasks?.length || 0,
        xp: p.xp || 0,
      }))
      .sort((a, b) => b.xp - a.xp || b.tasksDone - a.tasksDone)

    return res.json({ name: group.name, code: group.code, leaderboard: board })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

export const getFlashcardQueue = async (req, res) => {
  try {
    const { roadmapId } = req.params
    const sessionId = req.sessionId
    const progress = await UserProgress.findOne({ sessionId, roadmapId }).lean()
    const now = new Date()
    const due = (progress?.flashcards || [])
      .map((c, i) => ({ ...c, index: i }))
      .filter((c) => new Date(c.nextReview) <= now)
    return res.json({ due, total: progress?.flashcards?.length || 0 })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}
