import crypto from 'crypto'
import axios from 'axios'
import FormData from 'form-data'
import mongoose from 'mongoose'
import PdfKnowledge from '../models/PdfKnowledge.js'
import Roadmap from '../models/Roadmap.js'

const aiBase = () => process.env.AI_SERVICE_URL || 'http://localhost:8000'

const pdfIdFor = (doc) => doc.pdfId || String(doc._id)

export const listPdfsForRoadmap = async (req, res) => {
  try {
    const { roadmapId } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ error: 'Invalid roadmap id' })
    }
    const docs = await PdfKnowledge.find({ roadmapId }).select('pdfId filename label chunks createdAt').lean()
    const items = docs.map((d) => ({
      pdfId: pdfIdFor(d),
      filename: d.filename || '',
      label: d.label || d.filename || 'PDF',
      chunkCount: Array.isArray(d.chunks) ? d.chunks.length : 0,
      createdAt: d.createdAt,
    }))
    const totalChunks = items.reduce((n, i) => n + i.chunkCount, 0)
    return res.json({ pdfs: items, ready: totalChunks > 0, totalChunks })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

export const getPdfMetaForRoadmap = async (req, res) => {
  try {
    const { roadmapId } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ error: 'Invalid roadmap id' })
    }
    const docs = await PdfKnowledge.find({ roadmapId }).lean()
    if (!docs.length) return res.json({ ready: false, pdfs: [] })

    const pdfs = docs.map((d) => ({
      pdfId: pdfIdFor(d),
      filename: d.filename || '',
      label: d.label || d.filename || 'PDF',
      chunkCount: Array.isArray(d.chunks) ? d.chunks.length : 0,
    }))
    const totalChunks = pdfs.reduce((n, p) => n + p.chunkCount, 0)
    const primary = pdfs[0]
    return res.json({
      ready: totalChunks > 0,
      filename: primary?.filename || '',
      chunkCount: totalChunks,
      pdfs,
    })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

export const uploadPdfForRoadmap = async (req, res) => {
  try {
    const { roadmapId } = req.params
    const label = typeof req.body?.label === 'string' ? req.body.label.trim() : ''
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ error: 'Invalid roadmap id' })
    }
    const exists = await Roadmap.exists({ _id: roadmapId })
    if (!exists) return res.status(404).json({ error: 'Roadmap not found' })
    if (!req.file?.buffer) return res.status(400).json({ error: 'PDF file required' })

    const pdfId = crypto.randomUUID()
    const indexKey = `${roadmapId}:${pdfId}`

    const form = new FormData()
    form.append('roadmap_id', indexKey)
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'document.pdf',
      contentType: req.file.mimetype || 'application/pdf',
    })

    const { data } = await axios.post(`${aiBase()}/process-pdf`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 300000,
    })

    const chunks = data?.chunks
    if (!Array.isArray(chunks)) {
      return res.status(502).json({ error: 'Invalid AI service response' })
    }

    const bundle = chunks.map((text) => ({ text: String(text) }))
    const filename = data?.filename || req.file.originalname || ''

    const doc = await PdfKnowledge.create({
      roadmapId,
      pdfId,
      filename,
      label: label || filename,
      chunks: bundle,
    })

    return res.json({
      ok: true,
      pdfId: doc.pdfId,
      chunkCount: doc.chunks.length,
      filename: doc.filename,
      label: doc.label,
      roadmapId: String(doc.roadmapId),
    })
  } catch (e) {
    const d = e?.response?.data?.detail
    let msg = e?.message || 'Upload failed'
    if (typeof d === 'string') msg = d
    else if (Array.isArray(d)) msg = d.map((x) => x?.msg || JSON.stringify(x)).join(' ')
    else if (d && typeof d === 'object') msg = JSON.stringify(d)
    const code = typeof e?.response?.status === 'number' ? e.response.status : 500
    return res.status(code).json({ error: msg })
  }
}

export const deletePdfForRoadmap = async (req, res) => {
  try {
    const { roadmapId, pdfId } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ error: 'Invalid roadmap id' })
    }
    await PdfKnowledge.deleteOne({ roadmapId, pdfId })
    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

const gatherChunks = async (roadmapId, pdfId) => {
  if (pdfId) {
    const doc = await PdfKnowledge.findOne({ roadmapId, pdfId })
    if (!doc?.chunks?.length) return []
    return doc.chunks.map((c) => String(c?.text || '').trim()).filter(Boolean)
  }
  const docs = await PdfKnowledge.find({ roadmapId })
  return docs.flatMap((d) =>
    (d.chunks || []).map((c) => String(c?.text || '').trim()).filter(Boolean),
  )
}

export const chatPdfForRoadmap = async (req, res) => {
  try {
    const { roadmapId } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ error: 'Invalid roadmap id' })
    }
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
    if (!message) return res.status(400).json({ error: 'message is required' })

    const pdfId = typeof req.body?.pdfId === 'string' ? req.body.pdfId : ''
    const chunkTexts = await gatherChunks(roadmapId, pdfId)
    if (!chunkTexts.length) {
      return res.status(404).json({ error: 'No PDF indexed for this roadmap' })
    }

    const roadmap = await Roadmap.findById(roadmapId).lean()
    const progress = req.sessionId
      ? await import('../models/UserProgress.js').then((m) =>
          m.default.findOne({ sessionId: req.sessionId, roadmapId }).lean(),
        )
      : null

    const raw = Array.isArray(req.body?.history) ? req.body.history : []
    const history = raw
      .filter(
        (h) =>
          h &&
          (h.role === 'user' || h.role === 'assistant') &&
          typeof h.content === 'string' &&
          h.content.trim(),
      )
      .slice(-3)
      .map((h) => ({ role: h.role, content: h.content.trim() }))

    const roadmapContext = roadmap
      ? {
          title: roadmap.title,
          goal: roadmap.goal,
          duration: roadmap.duration,
          completedTasks: progress?.completedTasks?.length || 0,
          totalTasks: (roadmap.levels || []).reduce(
            (n, l) => n + (Array.isArray(l?.tasks) ? l.tasks.length : 0),
            0,
          ),
          currentLevels: (roadmap.levels || []).map((l, i) => ({
            index: i,
            title: l.title,
            tasksDone: (l.tasks || []).filter((_, ti) =>
              (progress?.completedTasks || []).includes(`${i}-${ti}`),
            ).length,
            taskCount: (l.tasks || []).length,
          })),
        }
      : null

    const { data } = await axios.post(
      `${aiBase()}/chat`,
      {
        roadmap_id: pdfId ? `${roadmapId}:${pdfId}` : String(roadmapId),
        message,
        history,
        chunks: chunkTexts,
        roadmap_context: roadmapContext,
        stream: false,
      },
      { timeout: 120000 },
    )

    return res.json({
      reply: data?.reply || '',
      sources: Array.isArray(data?.sources) ? data.sources : [],
    })
  } catch (e) {
    const d = e?.response?.data?.detail
    let msg = e?.message || 'Chat failed'
    if (typeof d === 'string') msg = d
    else if (Array.isArray(d)) msg = d.map((x) => x?.msg || JSON.stringify(x)).join(' ')
    else if (d && typeof d === 'object') msg = JSON.stringify(d)
    const code = typeof e?.response?.status === 'number' ? e.response.status : 500
    return res.status(code).json({ error: msg })
  }
}

export const chatStreamPdfForRoadmap = async (req, res) => {
  try {
    const { roadmapId } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ error: 'Invalid roadmap id' })
    }
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
    if (!message) return res.status(400).json({ error: 'message is required' })

    const pdfId = typeof req.body?.pdfId === 'string' ? req.body.pdfId : ''
    const chunkTexts = await gatherChunks(roadmapId, pdfId)
    if (!chunkTexts.length) return res.status(404).json({ error: 'No PDF indexed' })

    const roadmap = await Roadmap.findById(roadmapId).lean()
    const raw = Array.isArray(req.body?.history) ? req.body.history : []
    const history = raw.slice(-3)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const response = await axios.post(
      `${aiBase()}/chat/stream`,
      {
        roadmap_id: pdfId ? `${roadmapId}:${pdfId}` : String(roadmapId),
        message,
        history,
        chunks: chunkTexts,
        roadmap_context: roadmap ? { title: roadmap.title, goal: roadmap.goal } : null,
      },
      { responseType: 'stream', timeout: 120000 },
    )

    response.data.on('data', (chunk) => res.write(chunk))
    response.data.on('end', () => res.end())
    response.data.on('error', () => res.end())
  } catch (e) {
    if (!res.headersSent) return res.status(500).json({ error: e?.message || 'Stream failed' })
    res.end()
  }
}

export const generateFlashcardsFromPdf = async (req, res) => {
  try {
    const { roadmapId } = req.params
    const pdfId = req.body?.pdfId
    const chunkTexts = await gatherChunks(roadmapId, pdfId)
    if (!chunkTexts.length) return res.status(404).json({ error: 'No PDF indexed' })

    const sample = chunkTexts.slice(0, 8).join('\n\n').slice(0, 6000)
    const { data } = await axios.post(
      `${aiBase()}/generate-flashcards`,
      { text: sample },
      { timeout: 120000 },
    )
    return res.json(data)
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}
