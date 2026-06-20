import mongoose from 'mongoose'

const ChunkTextSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
  },
  { _id: false },
)

const PdfKnowledgeSchema = new mongoose.Schema({
  roadmapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
    required: true,
    unique: true,
  },
  filename: { type: String, default: '' },
  chunks: { type: [ChunkTextSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model('PdfKnowledge', PdfKnowledgeSchema)
