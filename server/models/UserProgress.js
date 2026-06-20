import mongoose from 'mongoose'

const UserProgressSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true, index: true },
  completedTasks: { type: [String], default: [] },
  levelNotes: { type: mongoose.Schema.Types.Mixed, default: {} },
  pinnedResources: { type: mongoose.Schema.Types.Mixed, default: {} },
  achievements: { type: [String], default: [] },
  activityLog: { type: [{ date: String, tasksCompleted: Number }], default: [] },
  pomodoroCount: { type: Number, default: 0 },
  flashcardReviews: { type: Number, default: 0 },
  flashcards: {
    type: [
      {
        front: String,
        back: String,
        ease: { type: Number, default: 2.5 },
        interval: { type: Number, default: 0 },
        nextReview: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  quizScores: { type: mongoose.Schema.Types.Mixed, default: {} },
  streakDays: { type: Number, default: 0 },
  streakFreezes: { type: Number, default: 1 },
  lastActiveDate: { type: String, default: '' },
  xp: { type: Number, default: 0 },
  learnerLevel: { type: Number, default: 1 },
  confidenceBefore: { type: Number, default: null },
  confidenceAfter: { type: Number, default: null },
  updatedAt: { type: Date, default: Date.now },
})

UserProgressSchema.index({ sessionId: 1, roadmapId: 1 }, { unique: true })

export default mongoose.model('UserProgress', UserProgressSchema)
