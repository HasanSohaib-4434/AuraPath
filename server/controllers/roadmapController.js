import crypto from 'crypto'
import mongoose from 'mongoose'
import Roadmap from '../models/Roadmap.js'
import UserProgress from '../models/UserProgress.js'
import { generateJson, generateText, MODEL, stripMarkdownCodeFence, extractJsonObject } from '../utils/geminiClient.js'
import { levelResources, normalizeResourceList } from '../utils/resourceNormalizer.js'
import { validateRoadmapResources } from '../utils/resourceValidator.js'
import { buildStudyPlan } from '../utils/studyPlan.js'

const normalizeRoadmap = (obj) => {
  const title = typeof obj?.title === 'string' ? obj.title.trim() : ''
  const description = typeof obj?.description === 'string' ? obj.description.trim() : ''
  const levels = Array.isArray(obj?.levels)
    ? obj.levels
        .filter((l) => l && typeof l === 'object')
        .map((l) => ({
          title: typeof l.title === 'string' ? l.title.trim() : '',
          tasks: Array.isArray(l.tasks)
            ? l.tasks.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim())
            : [],
          resources: levelResources(l, title),
        }))
        .filter((l) => l.title)
    : []
  if (!title || !levels.length) return null
  return { title, description, levels }
}

const roadmapPrompt = (variant = 'standard') => {
  const variantRules =
    variant === 'fast'
      ? '- fewer levels (3-5), shorter task lists, focus on essentials only'
      : variant === 'deep'
        ? '- more levels (6-10), deeper tasks, include advanced projects and reading'
        : '- balanced depth for the given duration'

  return [
    'Return ONLY a raw JSON object with no markdown and no extra text.',
    'The JSON must match exactly this shape:',
    '{ "title": string, "description": string, "levels": [{ "title": string, "tasks": [string], "resources": [{ "title": string, "url": string, "type": string }] }] }',
    'Rules:',
    variantRules,
    '- levels must be ordered from beginner to advanced',
    '- each level must have 5-12 concrete tasks',
    '- each level must have 3-6 resources',
    '- every resource MUST include a real working https URL in the "url" field',
    '- resource "title" is a short human-readable name (not the URL alone)',
    '- resource "type" must be one of: youtube, docs, article, github, course',
    '- include at least 1 YouTube video (youtube.com or youtu.be) per level when helpful',
    '- prefer reputable sources: official docs, freeCodeCamp, MDN, Coursera, GitHub repos',
    '- never invent fake URLs; use well-known real pages only',
    '- keep descriptions concise and actionable',
  ].join('\n')
}

const callGeminiRoadmap = async (goal, duration, variant = 'standard', language = 'en') => {
  const langNote = language && language !== 'en' ? `\nGenerate all titles, tasks, and descriptions in language code: ${language}. Keep resource URLs in English sites.` : ''
  const system = roadmapPrompt(variant) + langNote
  const user = [`Goal: ${goal.trim()}`, `Duration: ${duration.trim()}`].join('\n')
  const raw = await generateText(`${system}\n\n${user}`, { temperature: variant === 'fast' ? 0.35 : 0.45 })
  const candidate = extractJsonObject(raw) || raw
  return JSON.parse(candidate)
}

export const listRoadmaps = async (req, res) => {
  try {
    const docs = await Roadmap.find()
      .sort({ createdAt: -1 })
      .limit(40)
      .select('title description createdAt levels goal duration variant')
      .lean()
    const items = docs.map((d) => ({
      _id: d._id,
      title: d.title,
      description: d.description,
      goal: d.goal,
      duration: d.duration,
      variant: d.variant,
      createdAt: d.createdAt,
      levelCount: Array.isArray(d.levels) ? d.levels.length : 0,
      taskCount: Array.isArray(d.levels)
        ? d.levels.reduce((n, l) => n + (Array.isArray(l?.tasks) ? l.tasks.length : 0), 0)
        : 0,
    }))
    return res.json(items)
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const getRoadmapById = async (req, res) => {
  try {
    const { roadmapId } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ error: 'Invalid roadmap id' })
    }
    const doc = await Roadmap.findById(roadmapId)
    if (!doc) return res.status(404).json({ error: 'Roadmap not found' })
    const obj = doc.toObject()
    if (Array.isArray(obj.levels)) {
      obj.levels = obj.levels.map((l) => ({
        ...l,
        resources: levelResources(l, obj.goal || obj.title),
      }))
    }
    return res.json(obj)
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const getRoadmapByShareToken = async (req, res) => {
  try {
    const { token } = req.params
    const doc = await Roadmap.findOne({ shareToken: token, isPublic: true })
    if (!doc) return res.status(404).json({ error: 'Shared path not found' })
    const obj = doc.toObject()
    if (Array.isArray(obj.levels)) {
      obj.levels = obj.levels.map((l) => ({
        ...l,
        resources: levelResources(l, obj.goal || obj.title),
      }))
    }
    return res.json(obj)
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const generateRoadmap = async (req, res) => {
  try {
    const { goal, duration, variant, examDate, language, templateId } = req.body || {}
    if (!goal || typeof goal !== 'string' || goal.trim().length < 3) return res.status(400).json({ error: 'Goal is required' })
    if (!duration || typeof duration !== 'string' || !duration.trim()) return res.status(400).json({ error: 'Duration is required' })

    let parsed
    try {
      parsed = await callGeminiRoadmap(goal, duration, variant || 'standard', language || 'en')
    } catch {
      return res.status(502).json({ error: 'AI returned invalid JSON' })
    }

    const normalized = normalizeRoadmap(parsed)
    if (!normalized) return res.status(502).json({ error: 'AI returned an unexpected structure' })

    const doc = await Roadmap.create({
      ...normalized,
      goal: goal.trim(),
      duration: duration.trim(),
      variant: variant || 'standard',
      examDate: examDate ? new Date(examDate) : null,
      language: language || 'en',
      templateId: templateId || '',
    })
    return res.json(doc.toObject())
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const compareRoadmaps = async (req, res) => {
  try {
    const { goal, duration } = req.body || {}
    if (!goal?.trim() || !duration?.trim()) return res.status(400).json({ error: 'Goal and duration required' })

    const [fastRaw, deepRaw] = await Promise.all([
      callGeminiRoadmap(goal, duration, 'fast').catch(() => null),
      callGeminiRoadmap(goal, duration, 'deep').catch(() => null),
    ])

    const fast = fastRaw ? normalizeRoadmap(fastRaw) : null
    const deep = deepRaw ? normalizeRoadmap(deepRaw) : null
    if (!fast && !deep) return res.status(502).json({ error: 'Failed to generate comparison paths' })

    const saved = []
    if (fast) {
      saved.push(
        (
          await Roadmap.create({
            ...fast,
            title: `${fast.title} (Fast track)`,
            goal: goal.trim(),
            duration: duration.trim(),
            variant: 'fast',
          })
        ).toObject(),
      )
    }
    if (deep) {
      saved.push(
        (
          await Roadmap.create({
            ...deep,
            title: `${deep.title} (Deep dive)`,
            goal: goal.trim(),
            duration: duration.trim(),
            variant: 'deep',
          })
        ).toObject(),
      )
    }
    return res.json({ variants: saved })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const regenerateLevel = async (req, res) => {
  try {
    const { roadmapId, levelIndex } = req.params
    const { instruction } = req.body || {}
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) return res.status(400).json({ error: 'Invalid roadmap id' })

    const doc = await Roadmap.findById(roadmapId)
    if (!doc) return res.status(404).json({ error: 'Roadmap not found' })
    const idx = parseInt(levelIndex, 10)
    const level = doc.levels[idx]
    if (!level) return res.status(404).json({ error: 'Level not found' })

    const prompt = [
      `Regenerate level ${idx + 1} for learning path "${doc.title}".`,
      `Goal: ${doc.goal || doc.title}`,
      `Current level title: ${level.title}`,
      `Instruction: ${instruction || 'Improve tasks and resources, keep same difficulty band.'}`,
      'Return JSON: { "title": string, "tasks": [string], "resources": [{ "title", "url", "type" }] }',
    ].join('\n')

    const parsed = await generateJson(prompt)
    const updated = {
      title: parsed.title || level.title,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks.filter((t) => typeof t === 'string') : level.tasks,
      resources: levelResources({ resources: parsed.resources || [], tasks: parsed.tasks || [] }, doc.goal || doc.title),
    }
    doc.levels[idx] = updated
    await doc.save()
    return res.json({ level: updated, levelIndex: idx, roadmap: doc.toObject() })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const duplicateRoadmap = async (req, res) => {
  try {
    const { roadmapId } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) return res.status(400).json({ error: 'Invalid roadmap id' })

    const src = await Roadmap.findById(roadmapId).lean()
    if (!src) return res.status(404).json({ error: 'Roadmap not found' })

    const copy = await Roadmap.create({
      title: `${src.title} (Copy)`,
      description: src.description,
      goal: src.goal,
      duration: src.duration,
      levels: src.levels,
      variant: src.variant,
      forkedFrom: src._id,
    })
    return res.json(copy.toObject())
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const enableShare = async (req, res) => {
  try {
    const { roadmapId } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) return res.status(400).json({ error: 'Invalid roadmap id' })

    const token = crypto.randomBytes(12).toString('hex')
    const doc = await Roadmap.findByIdAndUpdate(
      roadmapId,
      { shareToken: token, isPublic: true },
      { new: true },
    )
    if (!doc) return res.status(404).json({ error: 'Roadmap not found' })
    return res.json({ shareToken: token, shareUrl: `/share/${token}` })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const exportRoadmap = async (req, res) => {
  try {
    const { roadmapId } = req.params
    const format = req.query.format || 'markdown'
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) return res.status(400).json({ error: 'Invalid roadmap id' })

    const doc = await Roadmap.findById(roadmapId).lean()
    if (!doc) return res.status(404).json({ error: 'Roadmap not found' })

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="aurapath-${roadmapId}.json"`)
      return res.send(JSON.stringify(doc, null, 2))
    }

    let md = `# ${doc.title}\n\n${doc.description || ''}\n\n`
    if (doc.goal) md += `**Goal:** ${doc.goal}\n\n`
    if (doc.duration) md += `**Duration:** ${doc.duration}\n\n`
    ;(doc.levels || []).forEach((l, i) => {
      md += `## Level ${i + 1}: ${l.title}\n\n`
      ;(l.tasks || []).forEach((t, ti) => {
        md += `- [ ] ${typeof t === 'string' ? t : t?.title || ''}\n`
      })
      md += '\n### Resources\n\n'
      normalizeResourceList(l.resources, doc.goal || doc.title).forEach((r) => {
        md += `- [${r.title}](${r.url})\n`
      })
      md += '\n'
    })
    res.setHeader('Content-Type', 'text/markdown')
    res.setHeader('Content-Disposition', `attachment; filename="aurapath-${roadmapId}.md"`)
    return res.send(md)
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const validateResources = async (req, res) => {
  try {
    const { roadmapId } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) return res.status(400).json({ error: 'Invalid roadmap id' })

    const doc = await Roadmap.findById(roadmapId).lean()
    if (!doc) return res.status(404).json({ error: 'Roadmap not found' })

    const results = await validateRoadmapResources(doc)
    const broken = results.filter((r) => !r.ok)
    return res.json({ total: results.length, broken: broken.length, results })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const getStudyPlan = async (req, res) => {
  try {
    const { roadmapId } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) return res.status(400).json({ error: 'Invalid roadmap id' })

    const doc = await Roadmap.findById(roadmapId).lean()
    if (!doc) return res.status(404).json({ error: 'Roadmap not found' })

    const plan = buildStudyPlan(doc, doc.duration)
    return res.json(plan)
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const explainTask = async (req, res) => {
  try {
    const { roadmapId } = req.params
    const { levelIndex, taskIndex, taskLabel } = req.body || {}
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) return res.status(400).json({ error: 'Invalid roadmap id' })

    const doc = await Roadmap.findById(roadmapId).lean()
    if (!doc) return res.status(404).json({ error: 'Roadmap not found' })

    const level = doc.levels?.[levelIndex]
    const task = taskLabel || level?.tasks?.[taskIndex] || 'this task'
    const resources = levelResources(level || {}, doc.goal || doc.title)
      .slice(0, 3)
      .map((r) => `${r.title}: ${r.url}`)
      .join('\n')

    const reply = await generateText(
      [
        `Learning path: ${doc.title}`,
        `Level: ${level?.title || levelIndex + 1}`,
        `Task: ${task}`,
        resources ? `Related resources:\n${resources}` : '',
        'Explain this task clearly in 2-3 short paragraphs. Include a 30-minute action plan with concrete steps.',
      ]
        .filter(Boolean)
        .join('\n\n'),
      {
        system: 'You are a friendly learning coach. Be concise and actionable.',
        temperature: 0.5,
      },
    )
    return res.json({ explanation: reply })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const generateQuiz = async (req, res) => {
  try {
    const { roadmapId, levelIndex } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) return res.status(400).json({ error: 'Invalid roadmap id' })

    const doc = await Roadmap.findById(roadmapId).lean()
    if (!doc) return res.status(404).json({ error: 'Roadmap not found' })
    const idx = parseInt(levelIndex, 10)
    const level = doc.levels?.[idx]
    if (!level) return res.status(404).json({ error: 'Level not found' })

    const quiz = await generateJson(
      [
        `Create a quiz for level "${level.title}" in path "${doc.title}".`,
        `Tasks covered:\n${(level.tasks || []).join('\n')}`,
        'Return JSON: { "questions": [{ "question": string, "options": [string x4], "correctIndex": number, "explanation": string }] }',
        'Generate 5 questions.',
      ].join('\n\n'),
    )

    const questions = Array.isArray(quiz?.questions) ? quiz.questions.slice(0, 8) : []
    return res.json({ levelIndex: idx, questions })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const submitQuiz = async (req, res) => {
  try {
    const { roadmapId, levelIndex } = req.params
    const { answers, questions } = req.body || {}
    const sessionId = req.sessionId
    if (!sessionId) return res.status(400).json({ error: 'X-Session-Id required' })

    const qs = Array.isArray(questions) ? questions : []
    const ans = Array.isArray(answers) ? answers : []
    let correct = 0
    qs.forEach((q, i) => {
      if (Number(ans[i]) === Number(q.correctIndex)) correct += 1
    })
    const score = qs.length ? Math.round((correct / qs.length) * 100) : 0
    const passed = score >= 70

    await UserProgress.findOneAndUpdate(
      { sessionId, roadmapId },
      {
        $set: {
          [`quizScores.${levelIndex}`]: { score, passed, at: new Date() },
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    )

    return res.json({ score, passed, correct, total: qs.length })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const generateFlashcards = async (req, res) => {
  try {
    const { roadmapId } = req.params
    const { sourceText } = req.body || {}
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) return res.status(400).json({ error: 'Invalid roadmap id' })
    const sessionId = req.sessionId
    if (!sessionId) return res.status(400).json({ error: 'X-Session-Id required' })

    const doc = await Roadmap.findById(roadmapId).lean()
    if (!doc) return res.status(404).json({ error: 'Roadmap not found' })

    const context =
      sourceText ||
      (doc.levels || [])
        .flatMap((l) => l.tasks || [])
        .slice(0, 15)
        .join('\n')

    const data = await generateJson(
      [
        `Create flashcards for learning path "${doc.title}".`,
        `Content:\n${context}`,
        'Return JSON: { "cards": [{ "front": string, "back": string }] }',
        'Generate 10 cards.',
      ].join('\n\n'),
    )

    const cards = (Array.isArray(data?.cards) ? data.cards : []).slice(0, 20).map((c) => ({
      front: c.front || '',
      back: c.back || '',
      ease: 2.5,
      interval: 0,
      nextReview: new Date(),
    }))

    await UserProgress.findOneAndUpdate(
      { sessionId, roadmapId },
      { $set: { flashcards: cards, updatedAt: new Date() } },
      { upsert: true },
    )

    return res.json({ cards })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const getFlashcards = async (req, res) => {
  try {
    const { roadmapId } = req.params
    const sessionId = req.sessionId
    if (!sessionId) return res.status(400).json({ error: 'X-Session-Id required' })

    const doc = await UserProgress.findOne({ sessionId, roadmapId }).select('flashcards flashcardReviews').lean()
    return res.json({ cards: doc?.flashcards || [], flashcardReviews: doc?.flashcardReviews || 0 })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const reviewFlashcard = async (req, res) => {
  try {
    const { roadmapId } = req.params
    const { cardIndex, quality } = req.body || {}
    const sessionId = req.sessionId
    if (!sessionId) return res.status(400).json({ error: 'X-Session-Id required' })

    const doc = await UserProgress.findOne({ sessionId, roadmapId })
    if (!doc) return res.status(404).json({ error: 'No flashcards' })

    const cards = [...(doc.flashcards || [])]
    const card = cards[cardIndex]
    if (!card) return res.status(404).json({ error: 'Card not found' })

    const q = Math.min(5, Math.max(0, Number(quality) || 3))
    let { ease = 2.5, interval = 0 } = card
    if (q < 3) {
      interval = 1
    } else {
      interval = interval === 0 ? 1 : Math.round(interval * ease)
      ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
    }
    const next = new Date()
    next.setDate(next.getDate() + interval)
    cards[cardIndex] = { ...card, ease, interval, nextReview: next }

    doc.flashcards = cards
    doc.flashcardReviews = (doc.flashcardReviews || 0) + 1
    doc.updatedAt = new Date()
    await doc.save()

    return res.json({ card: cards[cardIndex], flashcardReviews: doc.flashcardReviews })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}

export const fixBrokenResources = async (req, res) => {
  try {
    const { roadmapId } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) return res.status(400).json({ error: 'Invalid roadmap id' })

    const doc = await Roadmap.findById(roadmapId)
    if (!doc) return res.status(404).json({ error: 'Roadmap not found' })

    const validation = await validateRoadmapResources(doc.toObject())
    const broken = validation.filter((r) => !r.ok)
    if (!broken.length) return res.json({ fixed: 0, message: 'All links look good' })

    const replacements = await generateJson(
      [
        `Suggest replacement URLs for broken learning resources in path "${doc.title}".`,
        `Broken links:\n${broken.map((b) => `- ${b.title}: ${b.url}`).join('\n')}`,
        'Return JSON: { "replacements": [{ "url": string, "newUrl": string, "newTitle": string, "type": string }] }',
        'Use real working https URLs only.',
      ].join('\n\n'),
    )

    let fixed = 0
    const reps = Array.isArray(replacements?.replacements) ? replacements.replacements : []
    reps.forEach(({ url, newUrl, newTitle, type }) => {
      doc.levels.forEach((level) => {
        level.resources = (level.resources || []).map((r) => {
          const ru = typeof r === 'string' ? r : r?.url
          if (ru === url && newUrl) {
            fixed += 1
            return { title: newTitle || r?.title || 'Resource', url: newUrl, type: type || r?.type || 'article' }
          }
          return r
        })
      })
    })
    if (fixed) await doc.save()
    return res.json({ fixed, replacements: reps })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}
