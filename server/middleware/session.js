import crypto from 'crypto'
import UserSession from '../models/UserSession.js'

export const sessionMiddleware = async (req, res, next) => {
  try {
    let sid = req.headers['x-session-id']
    if (typeof sid === 'string' && sid.trim()) {
      req.sessionId = sid.trim()
    } else {
      req.sessionId = null
    }
    next()
  } catch (e) {
    next(e)
  }
}

export const requireSession = (req, res, next) => {
  if (!req.sessionId) return res.status(400).json({ error: 'X-Session-Id header required' })
  next()
}

export const ensureSession = async (sessionId, displayName) => {
  const sid = sessionId || crypto.randomUUID()
  await UserSession.findOneAndUpdate(
    { sessionId: sid },
    { sessionId: sid, ...(displayName ? { displayName: String(displayName).slice(0, 80) } : {}) },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
  return sid
}
