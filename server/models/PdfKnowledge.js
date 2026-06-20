import mongoose from 'mongoose'

const ChunkTextSchema = new mongoose.Schema(
  { text: { type: String, required: true } },
  { _id: false },
)

const PdfKnowledgeSchema = new mongoose.Schema({
  roadmapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
    required: true,
    index: true,
  },
  pdfId: { type: String, required: true },
  filename: { type: String, default: '' },
  label: { type: String, default: '' },
  chunks: { type: [ChunkTextSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
})

PdfKnowledgeSchema.index({ roadmapId: 1, pdfId: 1 }, { unique: true })

export default mongoose.model('PdfKnowledge', PdfKnowledgeSchema)
