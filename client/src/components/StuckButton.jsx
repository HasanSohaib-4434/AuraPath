import { useState } from 'react'
import { HelpCircle, Loader2 } from 'lucide-react'
import { api } from '../utils/api.js'
import ResponsiveSheet from './ResponsiveSheet.jsx'

const StuckButton = ({ roadmapId, levelIndex, taskIndex, taskLabel }) => {
  const [open, setOpen] = useState(false)
  const [hint, setHint] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async (e) => {
    e.stopPropagation()
    if (hint && open) {
      setOpen(false)
      return
    }
    setOpen(true)
    if (hint) return
    setLoading(true)
    try {
      const data = await api.post(`/api/student/${roadmapId}/stuck`, { levelIndex, taskIndex, taskLabel })
      setHint(data.hint || '')
    } catch (err) {
      setHint(err?.message || 'Could not get hint')
    } finally {
      setLoading(false)
    }
  }

  const close = () => setOpen(false)

  return (
    <>
      <button
        type="button"
        title="I'm stuck"
        onClick={load}
        className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[10px] font-medium text-amber-300 sm:text-xs"
      >
        {loading && !hint ? <Loader2 className="h-3 w-3 animate-spin" /> : <HelpCircle className="h-3 w-3" />}
        Stuck?
      </button>
      <ResponsiveSheet
        open={open}
        onClose={close}
        title="You're stuck — here's help"
        icon={HelpCircle}
        subtitle={taskLabel}
        loading={loading && !hint}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{hint}</div>
      </ResponsiveSheet>
    </>
  )
}

export default StuckButton
