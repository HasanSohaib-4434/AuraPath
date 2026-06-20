import mongoose from 'mongoose'

const UserSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model('UserSession', UserSessionSchema)
