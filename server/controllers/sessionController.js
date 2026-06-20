import { ensureSession } from '../middleware/session.js'
import UserSession from '../models/UserSession.js'

export const createSession = async (req, res) => {
  try {
    const { sessionId, displayName } = req.body || {}
    const sid = await ensureSession(sessionId, displayName)
    const doc = await UserSession.findOne({ sessionId: sid }).lean()
    return res.json({ sessionId: sid, displayName: doc?.displayName || '' })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

export const getSession = async (req, res) => {
  try {
    const sid = req.sessionId
    if (!sid) return res.json({ sessionId: null })
    const doc = await UserSession.findOne({ sessionId: sid }).lean()
    if (!doc) return res.json({ sessionId: sid, displayName: '' })
    return res.json({ sessionId: doc.sessionId, displayName: doc.displayName || '' })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const sid = req.sessionId
    if (!sid) return res.status(400).json({ error: 'X-Session-Id required' })
    const displayName = typeof req.body?.displayName === 'string' ? req.body.displayName.trim().slice(0, 80) : ''
    await UserSession.findOneAndUpdate({ sessionId: sid }, { displayName }, { upsert: true })
    return res.json({ sessionId: sid, displayName })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' })
  }
}
