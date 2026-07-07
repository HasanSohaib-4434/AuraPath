import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Sparkles, Star, Timer, Trophy, Zap } from 'lucide-react'
import { readRefreshRecords, recordZenPopRound } from '../../utils/refreshGameStorage.js'

const ROUND_SEC = 45

/** Percent of playfield height moved per frame (60fps, dt≈1). */
const SPEED_SCALE = 0.62

const BUBBLE_TYPES = {
  normal: {
    label: 'Calm',
    points: 1,
    weight: 65,
    size: [52, 64],
    speed: [0.14, 0.2],
    ring: 'border-primary/55 bg-gradient-to-br from-primary/35 to-primary/10',
    glow: 'shadow-glow-sm',
    icon: null,
  },
  golden: {
    label: 'Golden',
    points: 4,
    weight: 16,
    size: [58, 70],
    speed: [0.1, 0.15],
    ring: 'border-accent/70 bg-gradient-to-br from-accent/45 to-accent/15',
    glow: 'shadow-accent-glow',
    icon: Star,
  },
  lotus: {
    label: 'Lotus',
    points: 3,
    weight: 12,
    size: [60, 72],
    speed: [0.09, 0.13],
    ring: 'border-success/50 bg-gradient-to-br from-success/30 to-primary/10',
    glow: 'shadow-glow-sm',
    icon: null,
    emoji: '🪷',
  },
  cloud: {
    label: 'Cloud',
    points: -2,
    weight: 7,
    size: [50, 60],
    speed: [0.16, 0.22],
    ring: 'border-danger/45 bg-gradient-to-br from-danger/20 to-surface-raised/80',
    glow: '',
    icon: null,
    emoji: '☁️',
    trap: true,
  },
}

const pickType = () => {
  const roll = Math.random() * 100
  let acc = 0
  for (const [key, cfg] of Object.entries(BUBBLE_TYPES)) {
    acc += cfg.weight
    if (roll <= acc) return key
  }
  return 'normal'
}

const rand = (min, max) => min + Math.random() * (max - min)

const spawnBubble = (id, frenzy, startY = 96) => {
  const typeKey = pickType()
  const cfg = BUBBLE_TYPES[typeKey]
  const speedMul = frenzy ? 1.12 : 1
  return {
    id,
    type: typeKey,
    x: 12 + Math.random() * 76,
    y: startY + Math.random() * 6,
    size: rand(cfg.size[0], cfg.size[1]),
    speed: rand(cfg.speed[0], cfg.speed[1]) * speedMul,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.4 + Math.random() * 0.5,
  }
}

const ZenPopGame = ({ onRecordsUpdate }) => {
  const [playing, setPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SEC)
  const [bubbles, setBubbles] = useState([])
  const [effects, setEffects] = useState([])
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [roundDone, setRoundDone] = useState(false)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [shake, setShake] = useState(false)

  const idRef = useRef(0)
  const effectIdRef = useRef(0)
  const rafRef = useRef(null)
  const lastTsRef = useRef(0)
  const spawnAccRef = useRef(0)
  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const maxComboRef = useRef(0)
  const playingRef = useRef(false)
  const timeLeftRef = useRef(ROUND_SEC)
  const timerRef = useRef(null)

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  useEffect(() => {
    comboRef.current = combo
    maxComboRef.current = Math.max(maxComboRef.current, combo)
    setMaxCombo(maxComboRef.current)
  }, [combo])

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    timerRef.current = null
    rafRef.current = null
  }

  const addEffect = (effect) => {
    effectIdRef.current += 1
    const id = effectIdRef.current
    setEffects((prev) => [...prev.slice(-18), { ...effect, id }])
    setTimeout(() => setEffects((prev) => prev.filter((e) => e.id !== id)), 650)
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 180)
  }

  const endRound = useCallback(() => {
    playingRef.current = false
    clearTimers()
    setPlaying(false)
    setRoundDone(true)
    setBubbles([])
    const finalScore = scoreRef.current
    const prevHigh = readRefreshRecords().zenPop.highScore
    setIsNewRecord(finalScore > prevHigh && finalScore > 0)
    const updated = recordZenPopRound(finalScore, maxComboRef.current)
    onRecordsUpdate?.('zenPop', updated)
  }, [onRecordsUpdate])

  useEffect(() => () => clearTimers(), [])

  const gameLoop = useCallback((ts) => {
    if (!playingRef.current) return
    if (!lastTsRef.current) lastTsRef.current = ts
    const dt = Math.min(32, ts - lastTsRef.current) / 16.67
    lastTsRef.current = ts

    const frenzy = timeLeftRef.current <= 12
    const elapsed = ROUND_SEC - timeLeftRef.current
    const spawnEvery = frenzy ? 950 : elapsed < 15 ? 1500 : elapsed < 30 ? 1200 : 1400

    spawnAccRef.current += dt * 16.67
    if (spawnAccRef.current >= spawnEvery) {
      spawnAccRef.current = 0
      idRef.current += 1
      setBubbles((prev) => {
        if (prev.length >= 7) return prev
        const b = spawnBubble(idRef.current, frenzy)
        return [...prev, b]
      })
    }

    setBubbles((prev) => {
      const next = []
      let missed = 0
      for (const b of prev) {
        const cfg = BUBBLE_TYPES[b.type]
        const wobbleX = Math.sin(b.wobble) * 0.025
        const ny = b.y - b.speed * dt * SPEED_SCALE
        const nx = b.x + wobbleX
        const nw = b.wobble + b.wobbleSpeed * dt * 0.03
        if (ny < -8) {
          if (!cfg.trap) missed += 1
          continue
        }
        next.push({ ...b, x: nx, y: ny, wobble: nw })
      }
      if (missed > 0 && elapsed > 8) {
        setCombo(0)
        comboRef.current = 0
      }
      return next
    })

    rafRef.current = requestAnimationFrame(gameLoop)
  }, [])

  const start = () => {
    clearTimers()
    idRef.current = 0
    effectIdRef.current = 0
    lastTsRef.current = 0
    spawnAccRef.current = 0
    scoreRef.current = 0
    comboRef.current = 0
    maxComboRef.current = 0
    timeLeftRef.current = ROUND_SEC
    playingRef.current = true

    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setTimeLeft(ROUND_SEC)
    setBubbles([])
    setEffects([])
    setRoundDone(false)
    setIsNewRecord(false)
    setPlaying(true)

    const starters = [76, 84, 92].map((y, i) => {
      idRef.current += 1
      const typeKey = i === 1 ? 'golden' : 'normal'
      const cfg = BUBBLE_TYPES[typeKey]
      return {
        id: idRef.current,
        type: typeKey,
        x: 24 + i * 26,
        y,
        size: rand(cfg.size[0], cfg.size[1]),
        speed: rand(cfg.speed[0], cfg.speed[1]) * 0.75,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.35,
      }
    })
    setBubbles(starters)

    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1
      setTimeLeft(timeLeftRef.current)
      if (timeLeftRef.current <= 0) endRound()
    }, 1000)

    rafRef.current = requestAnimationFrame(gameLoop)
  }

  const pop = (bubble, e) => {
    if (!playingRef.current) return
    e.preventDefault()
    e.stopPropagation()

    const cfg = BUBBLE_TYPES[bubble.type]
    const rect = e.currentTarget.getBoundingClientRect()
    const popX = rect.left + rect.width / 2
    const popY = rect.top + rect.height / 2

    if (cfg.trap) {
      setCombo(0)
      comboRef.current = 0
      setScore((s) => Math.max(0, s + cfg.points))
      scoreRef.current = Math.max(0, scoreRef.current + cfg.points)
      triggerShake()
      addEffect({ kind: 'bad', x: popX, y: popY, text: cfg.points })
    } else {
      const mult = Math.min(5, 1 + Math.floor(comboRef.current / 3))
      const gained = cfg.points * mult
      setCombo((c) => c + 1)
      comboRef.current += 1
      setScore((s) => s + gained)
      scoreRef.current += gained
      addEffect({
        kind: mult >= 3 ? 'mega' : 'good',
        x: popX,
        y: popY,
        text: mult > 1 ? `+${gained} x${mult}` : `+${gained}`,
      })
      if (cfg.points >= 4 || mult >= 3) triggerShake()
    }

    setBubbles((prev) => prev.filter((b) => b.id !== bubble.id))

    for (let i = 0; i < 6; i += 1) {
      addEffect({
        kind: 'particle',
        x: popX,
        y: popY,
        angle: (Math.PI * 2 * i) / 6,
        dist: 20 + Math.random() * 24,
        tone: cfg.trap ? 'danger' : bubble.type === 'golden' ? 'accent' : 'primary',
      })
    }
  }

  const frenzy = playing && timeLeft <= 12
  const comboMult = Math.min(5, 1 + Math.floor(combo / 3))

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-subtle bg-surface-raised px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-ink-secondary">
            <Sparkles className="h-3 w-3 text-accent" />
            Score
          </div>
          <div className="text-xl font-bold tabular-nums text-accent">{score}</div>
        </div>
        <div className="rounded-xl border border-subtle bg-surface-raised px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-ink-secondary">
            <Flame className="h-3 w-3 text-primary" />
            Combo
          </div>
          <div className="text-xl font-bold tabular-nums text-primary">
            {combo > 0 ? `${combo}${comboMult > 1 ? ` · x${comboMult}` : ''}` : '—'}
          </div>
        </div>
        <div className="rounded-xl border border-subtle bg-surface-raised px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-ink-secondary">
            <Timer className="h-3 w-3" />
            Time
          </div>
          <div className={`text-xl font-bold tabular-nums ${timeLeft <= 5 && playing ? 'text-danger' : 'text-ink-primary'}`}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {playing ? (
        <div className="progress-track mb-3 h-1.5">
          <div
            className={`progress-fill ${frenzy ? 'from-accent to-danger' : ''}`}
            style={{ width: `${(timeLeft / ROUND_SEC) * 100}%` }}
          />
        </div>
      ) : null}

      <motion.div
        animate={shake ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.18 }}
        className={`relative h-80 overflow-hidden rounded-2xl border shadow-card sm:h-[22rem] ${
          frenzy ? 'border-accent/50 ring-2 ring-accent/25' : 'border-subtle'
        } bg-gradient-to-b from-primary-soft/50 via-surface to-accent-soft/25`}
      >
        {!playing && !roundDone ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <motion.div
              animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/25 text-4xl shadow-glow"
            >
              🫧
              <motion.span
                className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-on-accent shadow-accent-glow"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                x3
              </motion.span>
            </motion.div>
            <div>
              <p className="font-medium text-ink-primary">Pop bubbles, build combos, dodge clouds</p>
              <p className="mt-1 text-xs text-ink-secondary">
                Tap gently — bubbles float slowly. Golden +4 · Lotus +3 · {ROUND_SEC}s round
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-[10px]">
              {Object.entries(BUBBLE_TYPES).map(([key, cfg]) => (
                <span key={key} className="rounded-full border border-subtle bg-surface-raised px-2.5 py-1 text-ink-secondary">
                  {cfg.emoji || (cfg.icon ? '★' : '○')} {cfg.label}{' '}
                  <strong className={cfg.trap ? 'text-danger' : 'text-primary'}>
                    {cfg.points > 0 ? `+${cfg.points}` : cfg.points}
                  </strong>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {frenzy && playing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/90 px-3 py-1 text-xs font-bold text-on-accent shadow-accent-glow">
              <Zap className="h-3.5 w-3.5" />
              Frenzy mode!
            </span>
          </motion.div>
        ) : null}

        {bubbles.map((b) => {
          const cfg = BUBBLE_TYPES[b.type]
          const Icon = cfg.icon
          return (
            <motion.button
              key={b.id}
              type="button"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              whileTap={{ scale: 0.9 }}
              onPointerDown={(e) => pop(b, e)}
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: b.size,
                height: b.size,
                transform: 'translate(-50%, -50%)',
                touchAction: 'manipulation',
              }}
              className={`absolute z-10 flex items-center justify-center rounded-full border-2 backdrop-blur-sm before:absolute before:-inset-3 before:rounded-full before:content-[''] ${cfg.ring} ${cfg.glow} ${
                b.type === 'golden' ? 'animate-pulse-soft' : ''
              }`}
              aria-label={`Pop ${cfg.label} bubble`}
            >
              <span className="pointer-events-none absolute inset-[18%] rounded-full bg-white/20" />
              {cfg.emoji ? (
                <span className="relative text-lg sm:text-xl">{cfg.emoji}</span>
              ) : Icon ? (
                <Icon className="relative mx-auto h-5 w-5 text-on-accent" />
              ) : (
                <span className="relative mx-auto block h-2 w-2 rounded-full bg-white/50" />
              )}
            </motion.button>
          )
        })}

        {effects.map((fx) => {
          if (fx.kind === 'particle') {
            return (
              <motion.span
                key={fx.id}
                initial={{ opacity: 0.9, scale: 1, x: fx.x, y: fx.y }}
                animate={{
                  opacity: 0,
                  scale: 0,
                  x: fx.x + Math.cos(fx.angle) * fx.dist,
                  y: fx.y + Math.sin(fx.angle) * fx.dist,
                }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className={`pointer-events-none fixed z-[9999] h-2.5 w-2.5 rounded-full ${
                  fx.tone === 'accent' ? 'bg-accent' : fx.tone === 'danger' ? 'bg-danger' : 'bg-primary'
                }`}
              />
            )
          }
          return (
            <motion.span
              key={fx.id}
              initial={{ opacity: 1, scale: 0.6, x: fx.x, y: fx.y }}
              animate={{ opacity: 0, scale: 1.4, y: fx.y - 36 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className={`pointer-events-none fixed z-[9999] -translate-x-1/2 text-sm font-bold ${
                fx.kind === 'bad' ? 'text-danger' : fx.kind === 'mega' ? 'text-accent' : 'text-primary'
              }`}
            >
              {fx.text}
            </motion.span>
          )
        })}

        {roundDone ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-surface/85 p-6 backdrop-blur-md"
          >
            {isNewRecord ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="celebration-panel mb-4 px-4 py-2 text-xs font-semibold text-accent"
              >
                <Trophy className="mr-1 inline h-4 w-4" />
                New high score!
              </motion.div>
            ) : null}
            <p className="text-3xl font-bold tabular-nums text-ink-primary">{score}</p>
            <p className="text-sm text-ink-secondary">points this round</p>
            <div className="mt-4 flex gap-4 text-center text-xs">
              <div>
                <div className="font-bold text-primary">{maxCombo}</div>
                <div className="text-ink-secondary">Best combo</div>
              </div>
              <div>
                <div className="font-bold text-accent">x{Math.min(5, 1 + Math.floor(maxCombo / 3))}</div>
                <div className="text-ink-secondary">Peak mult</div>
              </div>
            </div>
            <p className="mt-4 text-xs text-ink-secondary">Mind refreshed — ready to jump back in?</p>
          </motion.div>
        ) : null}
      </motion.div>

      <div className="mt-6 flex justify-center">
        {!playing ? (
          <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={start} className="btn-primary">
            {roundDone ? 'Play again' : 'Start round'}
          </motion.button>
        ) : null}
      </div>
    </div>
  )
}

export default ZenPopGame
