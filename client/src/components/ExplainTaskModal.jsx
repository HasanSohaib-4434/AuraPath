import { useEffect, useState } from 'react'
import { Bot } from 'lucide-react'
import { api } from '../utils/api.js'
import ResponsiveSheet from './ResponsiveSheet.jsx'

const ExplainTaskModal = ({ open, onClose, roadmapId, levelIndex, taskIndex, taskLabel }) => {
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')

  useEffect(() => {
    if (!open) {
      setText('')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setText('')
    api
      .post(`/api/roadmaps/${roadmapId}/explain-task`, { levelIndex, taskIndex, taskLabel })
      .then((data) => {
        if (!cancelled) setText(data.explanation || '')
      })
      .catch((e) => {
        if (!cancelled) setText(e?.message || 'Failed to explain')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, roadmapId, levelIndex, taskIndex, taskLabel])

  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      title="Explain this task"
      icon={Bot}
      subtitle={taskLabel}
      loading={loading}
    >
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">{text}</div>
    </ResponsiveSheet>
  )
}

export default ExplainTaskModal
