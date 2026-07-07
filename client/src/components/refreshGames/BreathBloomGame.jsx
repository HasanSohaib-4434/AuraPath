import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Pause, Play, RotateCcw, Wind } from 'lucide-react'
import { recordBreathSession } from '../../utils/refreshGameStorage.js'

const PHASES = [
  { key: 'inhale', label: 'Breathe in', duration: 4 },
  { key: 'holdIn', label: 'Hold', duration: 4 },
  { key: 'exhale', label: 'Breathe out', duration: 4 },
  { key: 'holdOut', label: 'Hold', duration: 4 },
]

const scaleForPhase = (key) => {
  if (key === 'inhale' || key === 'holdIn') return 1
  return 0.55
}

const BreathBloomGame = ({ onRecordsUpdate }) => {
  const [running, setRunning] = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [cycles, setCycles] = useState(0)
  const [tick, setTick] = useState(PHASES[0].duration)
  const cyclesRef = useRef(0)
  const timerRef = useRef(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    cyclesRef.current = cycles
  }, [cycles])

  const finishSession = useCallback(() => {
    clearTimer()
    setRunning(false)
    const completed = cyclesRef.current
    if (completed > 0) {
      const updated = recordBreathSession(completed)
      onRecordsUpdate?.('breathBloom', updated)
    }
  }, [onRecordsUpdate])

  useEffect(() => {
    if (!running) {
      clearTimer()
      return undefined
    }
    timerRef.current = setInterval(() => {
      setTick((t) => {
        if (t > 1) return t - 1
        setPhaseIdx((pi) => {
          const next = (pi + 1) % PHASES.length
          if (next === 0) setCycles((c) => c + 1)
          setTick(PHASES[next].duration)
          return next
        })
        return t
      })
    }, 1000)
    return clearTimer
  }, [running])

  const start = () => {
    setPhaseIdx(0)
    setTick(PHASES[0].duration)
    setCycles(0)
    cyclesRef.current = 0
    setRunning(true)
  }

  const phase = PHASES[phaseIdx]
  const targetScale = scaleForPhase(phase.key)

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-64 w-full max-w-sm items-center justify-center sm:h-72">
        <motion.div
          className="absolute h-48 w-48 rounded-full bg-primary/10 sm:h-56 sm:w-56"
          animate={{ scale: running ? targetScale * 1.15 : 0.9, opacity: running ? 0.6 : 0.3 }}
          transition={{ duration: phase.duration, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute h-36 w-36 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 shadow-glow sm:h-44 sm:w-44"
          animate={{ scale: running ? targetScale : 0.75 }}
          transition={{ duration: phase.duration, ease: 'easeInOut' }}
        />
        <motion.div
          className="relative flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-primary/40 bg-surface shadow-glow-sm sm:h-32 sm:w-32"
          animate={{ scale: running ? targetScale * 0.85 + 0.15 : 1 }}
          transition={{ duration: phase.duration, ease: 'easeInOut' }}
        >
          <Wind className="mb-1 h-6 w-6 text-primary" />
          <span className="text-xs font-medium text-ink-secondary">{running ? phase.label : 'Ready'}</span>
          {running ? <span className="mt-1 text-2xl font-bold tabular-nums text-ink-primary">{tick}</span> : null}
        </motion.div>
      </div>

      <div className="mb-6 flex items-center gap-6 text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold tabular-nums text-primary">{cycles}</div>
          <div className="text-xs text-ink-secondary">Cycles this session</div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {!running ? (
          <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={start} className="btn-primary">
            <Play className="h-4 w-4" />
            Start breathing
          </motion.button>
        ) : (
          <>
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setRunning(false)} className="btn-secondary">
              <Pause className="h-4 w-4" />
              Pause
            </motion.button>
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={finishSession} className="btn-primary">
              Done — save session
            </motion.button>
          </>
        )}
        {!running && cycles > 0 ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setCycles(0)
              cyclesRef.current = 0
              setPhaseIdx(0)
              setTick(PHASES[0].duration)
            }}
            className="btn-secondary"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </motion.button>
        ) : null}
      </div>

      <p className="mt-6 max-w-md text-center text-xs text-ink-secondary">
        Follow the circle — inhale, hold, exhale, hold. Even 2–3 cycles can reset your focus before you dive back in.
      </p>
    </div>
  )
}

export default BreathBloomGame
