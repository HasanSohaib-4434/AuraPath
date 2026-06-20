import mongoose from 'mongoose'

const StudyGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, index: true },
  roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true },
  ownerSessionId: { type: String, required: true },
  members: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model('StudyGroup', StudyGroupSchema)
