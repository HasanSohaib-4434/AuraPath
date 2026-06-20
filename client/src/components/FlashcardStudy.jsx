import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Layers, Loader2, RotateCcw } from 'lucide-react'
import { api } from '../utils/api.js'

const FlashcardStudy = ({ roadmapId, pdfReady }) => {
  const [cards, setCards] = useState([])
  const [dueCount, setDueCount] = useState(0)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      const [data, queue] = await Promise.all([
        api.get(`/api/roadmaps/${roadmapId}/flashcards`),
        api.get(`/api/student/${roadmapId}/flashcards/queue`).catch(() => ({ due: [] })),
      ])
      setCards(data.cards || [])
      setDueCount(queue.due?.length || 0)
    } catch {}
  }

  useEffect(() => {
    if (roadmapId) load()
  }, [roadmapId])

  const generate = async (fromPdf = false) => {
    setLoading(true)
    try {
      if (fromPdf && pdfReady) {
        const data = await api.post(`/api/roadmaps/${roadmapId}/pdf/flashcards`, {})
        const newCards = (data.cards || []).map((c) => ({
          front: c.front,
          back: c.back,
          ease: 2.5,
          interval: 0,
        }))
        await api.post(`/api/roadmaps/${roadmapId}/flashcards/generate`, {
          sourceText: newCards.map((c) => `${c.front}: ${c.back}`).join('\n'),
        })
      } else {
        await api.post(`/api/roadmaps/${roadmapId}/flashcards/generate`, {})
      }
      await load()
      setIdx(0)
      setFlipped(false)
    } catch (e) {
      alert(e?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const review = async (quality) => {
    if (!cards[idx]) return
    await api.post(`/api/roadmaps/${roadmapId}/flashcards/review`, { cardIndex: idx, quality })
    setFlipped(false)
    setIdx((i) => (i + 1) % cards.length)
  }

  const card = cards[idx]

  return (
    <div className="glass-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-primary">
          <Layers className="h-4 w-4 text-primary" />
          Flashcards
          {dueCount > 0 ? (
            <span className="rounded-full bg-accent-muted px-2 py-0.5 text-[10px] text-accent">{dueCount} due</span>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => generate(false)} disabled={loading} className="chip text-xs">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'From path'}
          </button>
          {pdfReady ? (
            <button type="button" onClick={() => generate(true)} disabled={loading} className="chip text-xs">
              From PDF
            </button>
          ) : null}
        </div>
      </div>

      {!cards.length ? (
        <p className="text-sm text-ink-secondary">Generate flashcards from your path or PDF material.</p>
      ) : (
        <>
          <motion.button
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={() => setFlipped((f) => !f)}
            className="mb-3 flashcard-face"
          >
            <span className="text-sm text-ink-primary">{flipped ? card.back : card.front}</span>
            <span className="mt-2 text-xs text-ink-secondary">Tap to flip · {idx + 1}/{cards.length}</span>
          </motion.button>
          {flipped ? (
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { q: 1, label: 'Again' },
                { q: 3, label: 'Good' },
                { q: 5, label: 'Easy' },
              ].map(({ q, label }) => (
                <button key={q} type="button" onClick={() => review(q)} className="chip text-xs">
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <button type="button" onClick={() => setFlipped(true)} className="mx-auto flex items-center gap-1 text-xs text-ink-secondary">
              <RotateCcw className="h-3 w-3" /> Reveal answer
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default FlashcardStudy
