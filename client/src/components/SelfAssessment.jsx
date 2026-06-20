import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { api } from '../utils/api.js'

const SelfAssessment = ({ roadmapId, before, after, onSave }) => {
  const [open, setOpen] = useState(!before)
  const [val, setVal] = useState(before || 5)

  const save = async (field, value) => {
    await api.put(`/api/student/${roadmapId}/assessment`, { [field]: value })
    onSave?.(field, value)
    setOpen(false)
  }

  if (after != null && before != null) {
    const growth = after - before
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success-muted p-3 text-sm">
        <TrendingUp className="h-5 w-5 text-success" />
        <span className="text-ink-secondary">
          Confidence: {before}/10 → {after}/10
          {growth > 0 ? ` (+${growth})` : ''}
        </span>
      </div>
    )
  }

  return (
    <div className="glass-card p-4">
      <p className="mb-2 text-sm font-medium text-ink-primary">
        {before == null ? 'Rate your confidence before starting (1–10)' : 'Rate your confidence now (1–10)'}
      </p>
      <input
        type="range"
        min={1}
        max={10}
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="mt-1 flex justify-between text-xs text-ink-secondary">
        <span>Beginner</span>
        <span className="font-bold text-primary">{val}/10</span>
        <span>Expert</span>
      </div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => save(before == null ? 'confidenceBefore' : 'confidenceAfter', val)}
        className="btn-primary mt-3 w-full text-sm"
      >
        Save
      </motion.button>
    </div>
  )
}

export default SelfAssessment
