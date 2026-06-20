import axios from 'axios'
import FormData from 'form-data'
import mongoose from 'mongoose'
import PdfKnowledge from '../models/PdfKnowledge.js'
import Roadmap from '../models/Roadmap.js'

const aiBase = () => process.env.AI_SERVICE_URL || 'http://localhost:8000'

export const uploadPdfForRoadmap = async (req, res) => {
  try {
    const { roadmapId } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ error: 'Invalid roadmap id' })
    }
    const exists = await Roadmap.exists({ _id: roadmapId })
    if (!exists) return res.status(404).json({ error: 'Roadmap not found' })
    if (!req.file?.buffer) return res.status(400).json({ error: 'PDF file required' })

    const form = new FormData()
    form.append('roadmap_id', roadmapId)
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

    const doc = await PdfKnowledge.findOneAndUpdate(
      { roadmapId },
      {
        roadmapId,
        filename: data?.filename || req.file.originalname || '',
        chunks: bundle,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )

    return res.json({
      ok: true,
      chunkCount: doc.chunks.length,
      filename: doc.filename,
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

export const chatPdfForRoadmap = async (req, res) => {
  try {
    const { roadmapId } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ error: 'Invalid roadmap id' })
    }
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
    if (!message) return res.status(400).json({ error: 'message is required' })

    const doc = await PdfKnowledge.findOne({ roadmapId })
    if (!doc || !doc.chunks?.length) {
      return res.status(404).json({ error: 'No PDF indexed for this roadmap' })
    }

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

    const chunkTexts = doc.chunks.map((c) => String(c?.text || '').trim()).filter(Boolean)

    const { data } = await axios.post(
      `${aiBase()}/chat`,
      {
        roadmap_id: String(roadmapId),
        message,
        history,
        chunks: chunkTexts,
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
