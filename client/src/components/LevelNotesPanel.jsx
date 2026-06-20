import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pin, StickyNote } from 'lucide-react'

const LevelNotesPanel = ({ levelIndex, notes, pinned, resources, onNotesChange, onPinToggle }) => {
  const [text, setText] = useState(notes || '')

  const save = (val) => {
    setText(val)
    onNotesChange?.(levelIndex, val)
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-subtle/60 bg-surface/30 p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-secondary">
        <StickyNote className="h-3.5 w-3.5" />
        Notes
      </div>
      <textarea
        value={text}
        onChange={(e) => save(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder="What you learned, questions, next steps…"
        rows={3}
        className="input-field w-full resize-none text-sm"
      />
      {resources?.length ? (
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-ink-secondary">
            <Pin className="h-3 w-3" />
            Pin resources
          </div>
          <div className="flex flex-wrap gap-2">
            {resources.map((r) => {
              const isPinned = pinned?.includes(r.url)
              return (
                <motion.button
                  key={r.url}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onPinToggle?.(levelIndex, r.url)
                  }}
                  className={`chip text-xs ${isPinned ? 'chip-active' : ''}`}
                >
                  {r.title?.slice(0, 28) || r.url}
                </motion.button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default LevelNotesPanel
