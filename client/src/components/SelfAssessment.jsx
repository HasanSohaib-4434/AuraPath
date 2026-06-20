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
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
        <TrendingUp className="h-5 w-5 text-emerald-400" />
        <span className="text-zinc-300">
          Confidence: {before}/10 → {after}/10
          {growth > 0 ? ` (+${growth})` : ''}
        </span>
      </div>
    )
  }

  return (
    <div className="glass-card p-4">
      <p className="mb-2 text-sm font-medium text-zinc-200">
        {before == null ? 'Rate your confidence before starting (1–10)' : 'Rate your confidence now (1–10)'}
      </p>
      <input
        type="range"
        min={1}
        max={10}
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        className="w-full accent-aura-500"
      />
      <div className="mt-1 flex justify-between text-xs text-zinc-500">
        <span>Beginner</span>
        <span className="font-bold text-aura-400">{val}/10</span>
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
