import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Pause, Play, Timer } from 'lucide-react'
import { api } from '../utils/api.js'

const WORK = 25 * 60
const BREAK = 5 * 60

const PomodoroTimer = ({ roadmapId, onComplete }) => {
  const [seconds, setSeconds] = useState(WORK)
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState('work')
  const tickRef = useRef(null)

  useEffect(() => {
    if (!running) return undefined
    tickRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(tickRef.current)
          setRunning(false)
          if (mode === 'work') {
            api.post(`/api/roadmaps/${roadmapId}/pomodoro`, {}).catch(() => {})
            onComplete?.()
            setMode('break')
            return BREAK
          }
          setMode('work')
          return WORK
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(tickRef.current)
  }, [running, mode, roadmapId, onComplete])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className="glass-card p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-200">
        <Timer className="h-4 w-4 text-orange-400" />
        Pomodoro · {mode === 'work' ? 'Focus' : 'Break'}
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold tabular-nums text-zinc-100">
          {mm}:{ss}
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => setRunning((r) => !r)}
          className="btn-primary mx-auto mt-3 inline-flex items-center gap-2 text-sm"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? 'Pause' : 'Start'}
        </motion.button>
      </div>
    </div>
  )
}

export default PomodoroTimer
