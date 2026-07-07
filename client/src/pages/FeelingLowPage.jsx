import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Brain,
  CloudSun,
  Heart,
  Sparkles,
  Trophy,
  Wind,
} from 'lucide-react'
import BreathBloomGame from '../components/refreshGames/BreathBloomGame.jsx'
import FocusMatchGame from '../components/refreshGames/FocusMatchGame.jsx'
import ZenPopGame from '../components/refreshGames/ZenPopGame.jsx'
import { formatLastPlayed, readRefreshRecords } from '../utils/refreshGameStorage.js'

const GAMES = [
  {
    id: 'breathBloom',
    title: 'Breath Bloom',
    desc: 'Calm box breathing with a growing circle — reset in under a minute.',
    icon: Wind,
    color: 'primary',
    emoji: '🌬️',
  },
  {
    id: 'focusMatch',
    title: 'Focus Match',
    desc: 'Flip cards and find pairs — a quick memory warm-up for your brain.',
    icon: Brain,
    color: 'accent',
    emoji: '🧩',
  },
  {
    id: 'zenPop',
    title: 'Zen Pop',
    desc: 'Pop bubbles, chain combos, dodge clouds — 45s of satisfying focus reset.',
    icon: Sparkles,
    color: 'primary',
    emoji: '🫧',
  },
]

const RecordStat = ({ label, value }) => (
  <div className="rounded-lg bg-surface-raised/80 px-3 py-2 text-center">
    <div className="text-lg font-bold tabular-nums text-ink-primary">{value}</div>
    <div className="text-[10px] uppercase tracking-wide text-ink-secondary">{label}</div>
  </div>
)

const FeelingLowPage = () => {
  const [records, setRecords] = useState(() => readRefreshRecords())
  const [activeGame, setActiveGame] = useState(null)

  const refreshRecords = useCallback((key, partial) => {
    setRecords((prev) => ({ ...prev, [key]: partial }))
  }, [])

  const activeMeta = GAMES.find((g) => g.id === activeGame)

  const renderRecords = (gameId) => {
    if (gameId === 'breathBloom') {
      const r = records.breathBloom
      return (
        <>
          <RecordStat label="Best session" value={`${r.bestCycles} cycles`} />
          <RecordStat label="All-time cycles" value={r.totalCycles} />
          <RecordStat label="Sessions" value={r.sessions} />
        </>
      )
    }
    if (gameId === 'focusMatch') {
      const r = records.focusMatch
      return (
        <>
          <RecordStat label="Best time" value={r.bestTimeSec != null ? `${r.bestTimeSec}s` : '—'} />
          <RecordStat label="Fewest moves" value={r.bestMoves ?? '—'} />
          <RecordStat label="Wins" value={r.wins} />
        </>
      )
    }
    const r = records.zenPop
    return (
      <>
        <RecordStat label="High score" value={r.highScore} />
        <RecordStat label="Best combo" value={r.bestCombo || 0} />
        <RecordStat label="Rounds" value={r.gamesPlayed} />
      </>
    )
  }

  const GameComponent =
    activeGame === 'breathBloom'
      ? BreathBloomGame
      : activeGame === 'focusMatch'
        ? FocusMatchGame
        : activeGame === 'zenPop'
          ? ZenPopGame
          : null

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent-soft px-4 py-1.5 text-xs font-medium text-accent">
          <Heart className="h-3.5 w-3.5" />
          Take a mindful break
        </div>
        <h1 className="text-2xl font-bold text-ink-primary sm:text-3xl">Feeling Low?</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-secondary">
          Study marathons drain everyone. Pick a quick game, reset your head, and come back sharper. Your records stay
          on this device so you can beat your own best.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!activeGame ? (
          <motion.div
            key="hub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <section className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-secondary">
                <Trophy className="h-4 w-4 text-accent" />
                Your refresh records
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {GAMES.map((game) => {
                  const Icon = game.icon
                  const last =
                    game.id === 'breathBloom'
                      ? records.breathBloom.lastPlayed
                      : game.id === 'focusMatch'
                        ? records.focusMatch.lastPlayed
                        : records.zenPop.lastPlayed
                  return (
                    <div key={game.id} className="glass-card p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-xl">{game.emoji}</span>
                        <span className="font-semibold text-ink-primary">{game.title}</span>
                      </div>
                      <div className="mb-3 grid grid-cols-3 gap-2">{renderRecords(game.id)}</div>
                      <p className="text-[11px] text-ink-secondary">Last played: {formatLastPlayed(last)}</p>
                    </div>
                  )
                })}
              </div>
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-primary">
                <CloudSun className="h-5 w-5 text-primary" />
                Pick a game
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {GAMES.map((game, i) => {
                  const Icon = game.icon
                  return (
                    <motion.button
                      key={game.id}
                      type="button"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileHover={{ y: -6 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveGame(game.id)}
                      className="glass-card-interactive group flex flex-col p-5 text-left"
                    >
                      <div
                        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-glow-sm transition group-hover:scale-105 ${
                          game.color === 'accent' ? 'bg-accent-muted' : 'bg-primary-muted'
                        }`}
                      >
                        {game.emoji}
                      </div>
                      <div className="flex items-center gap-2 font-semibold text-ink-primary">
                        <Icon className={`h-4 w-4 ${game.color === 'accent' ? 'text-accent' : 'text-primary'}`} />
                        {game.title}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-ink-secondary">{game.desc}</p>
                      <span className="mt-4 text-xs font-medium text-primary">Play now →</span>
                    </motion.button>
                  )
                })}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key={activeGame}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            <div className="mb-6 flex items-center gap-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveGame(null)}
                className="btn-secondary !rounded-xl !py-2 !px-3 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </motion.button>
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-ink-primary">
                  <span>{activeMeta?.emoji}</span>
                  {activeMeta?.title}
                </h2>
                <p className="text-xs text-ink-secondary">{activeMeta?.desc}</p>
              </div>
            </div>

            <div className="glass-card p-5 sm:p-8">
              <div className="mb-6 grid grid-cols-3 gap-2 sm:max-w-md">{renderRecords(activeGame)}</div>
              {GameComponent ? <GameComponent onRecordsUpdate={refreshRecords} /> : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FeelingLowPage
