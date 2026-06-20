import mongoose from 'mongoose'

const LevelSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    tasks: { type: [mongoose.Schema.Types.Mixed], default: [] },
    resources: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { _id: false },
)

const RoadmapSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  goal: { type: String, default: '' },
  duration: { type: String, default: '' },
  levels: { type: [LevelSchema], default: [] },
  shareToken: { type: String, default: '', index: true },
  isPublic: { type: Boolean, default: false },
  forkedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', default: null },
  variant: { type: String, default: '' },
  examDate: { type: Date, default: null },
  language: { type: String, default: 'en' },
  templateId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model('Roadmap', RoadmapSchema)
