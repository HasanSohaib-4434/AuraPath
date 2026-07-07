import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Brain, RotateCcw, Trophy } from 'lucide-react'
import { recordFocusMatchPlayed, recordFocusMatchWin } from '../../utils/refreshGameStorage.js'

const PAIRS = ['📚', '☕', '🧠', '✨', '🎯', '🌱']

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const buildDeck = () => {
  const cards = PAIRS.flatMap((emoji, id) => [
    { uid: `${id}-a`, pairId: id, emoji },
    { uid: `${id}-b`, pairId: id, emoji },
  ])
  return shuffle(cards)
}

const FocusMatchGame = ({ onRecordsUpdate }) => {
  const [deck, setDeck] = useState(() => buildDeck())
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState(new Set())
  const [moves, setMoves] = useState(0)
  const [lock, setLock] = useState(false)
  const [startedAt, setStartedAt] = useState(null)
  const [won, setWon] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const movesRef = useRef(0)
  const startedAtRef = useRef(null)

  const totalPairs = PAIRS.length

  useEffect(() => {
    movesRef.current = moves
  }, [moves])

  useEffect(() => {
    if (!startedAt || won) return undefined
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500)
    return () => clearInterval(id)
  }, [startedAt, won])

  const reset = useCallback(() => {
    setDeck(buildDeck())
    setFlipped([])
    setMatched(new Set())
    setMoves(0)
    movesRef.current = 0
    setLock(false)
    setStartedAt(null)
    startedAtRef.current = null
    setWon(false)
    setElapsed(0)
  }, [])

  const flip = (idx) => {
    if (lock || matched.has(idx) || flipped.includes(idx)) return
    if (!startedAt) {
      const now = Date.now()
      setStartedAt(now)
      startedAtRef.current = now
      recordFocusMatchPlayed()
    }

    const next = [...flipped, idx]
    setFlipped(next)

    if (next.length === 2) {
      setMoves((m) => m + 1)
      setLock(true)
      const [a, b] = next
      if (deck[a].pairId === deck[b].pairId) {
        setTimeout(() => {
          setMatched((prev) => {
            const updated = new Set(prev)
            updated.add(a)
            updated.add(b)
            if (updated.size === totalPairs * 2) {
              setWon(true)
              const timeSec = Math.max(1, Math.floor((Date.now() - (startedAtRef.current || Date.now())) / 1000))
              const updatedRecord = recordFocusMatchWin(timeSec, movesRef.current)
              onRecordsUpdate?.('focusMatch', updatedRecord)
            }
            return updated
          })
          setFlipped([])
          setLock(false)
        }, 400)
      } else {
        setTimeout(() => {
          setFlipped([])
          setLock(false)
        }, 700)
      }
    }
  }

  const matchedCount = matched.size / 2

  const gridClass = useMemo(() => 'grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3', [])

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="text-ink-secondary">
          Moves: <strong className="text-ink-primary">{moves}</strong>
        </span>
        <span className="text-ink-secondary">
          Time: <strong className="tabular-nums text-ink-primary">{elapsed}s</strong>
        </span>
        <span className="text-ink-secondary">
          Pairs: <strong className="text-primary">{matchedCount}/{totalPairs}</strong>
        </span>
      </div>

      <div className={gridClass}>
        {deck.map((card, idx) => {
          const isFlipped = flipped.includes(idx) || matched.has(idx)
          return (
            <motion.button
              key={card.uid}
              type="button"
              disabled={lock && !isFlipped}
              whileTap={{ scale: 0.95 }}
              onClick={() => flip(idx)}
              className="aspect-square min-h-[72px] w-full [perspective:600px] sm:min-h-[80px]"
              aria-label={isFlipped ? `Card ${card.emoji}` : 'Hidden card'}
            >
              <motion.div
                className="relative h-full min-h-[72px] w-full sm:min-h-[80px]"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.35, type: 'spring', stiffness: 260, damping: 22 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-xl border border-subtle bg-surface-raised shadow-card"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <Brain className="h-6 w-6 text-primary/50" />
                </div>
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-xl border text-3xl shadow-glow-sm ${
                    matched.has(idx) ? 'border-success/40 bg-success-muted' : 'border-primary/30 bg-primary-muted'
                  }`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  {card.emoji}
                </div>
              </motion.div>
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {won ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="celebration-panel mt-6 text-center"
          >
            <Trophy className="mx-auto mb-2 h-8 w-8 text-accent" />
            <p className="font-semibold text-ink-primary">Sharp mind restored!</p>
            <p className="mt-1 text-sm text-ink-secondary">
              {moves} moves in {elapsed}s
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-6 flex justify-center">
        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={reset} className="btn-secondary">
          <RotateCcw className="h-4 w-4" />
          New game
        </motion.button>
      </div>
    </div>
  )
}

export default FocusMatchGame
