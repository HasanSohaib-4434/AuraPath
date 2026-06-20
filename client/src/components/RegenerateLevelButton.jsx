import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, RefreshCw } from 'lucide-react'
import { api } from '../utils/api.js'

const RegenerateLevelButton = ({ roadmapId, levelIndex, onUpdate }) => {
  const [loading, setLoading] = useState(false)

  const run = async (e) => {
    e.stopPropagation()
    const instruction = window.prompt('How should this level change?', 'Add more hands-on projects and update resources')
    if (instruction === null) return
    setLoading(true)
    try {
      const data = await api.post(`/api/roadmaps/${roadmapId}/levels/${levelIndex}/regenerate`, { instruction })
      onUpdate?.(data.roadmap)
    } catch (err) {
      alert(err?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      disabled={loading}
      onClick={run}
      className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
      Refine level
    </motion.button>
  )
}

export default RegenerateLevelButton
