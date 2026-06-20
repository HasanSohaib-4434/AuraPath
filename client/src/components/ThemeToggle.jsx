import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'

const ThemeToggle = ({ compact = false }) => {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileTap={{ scale: 0.92 }}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`relative flex shrink-0 items-center justify-center rounded-xl border border-subtle bg-surface-raised text-ink-secondary transition hover:border-primary/40 hover:text-ink-primary active:bg-primary-muted ${
        compact ? 'h-9 w-9' : 'h-10 w-10'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isDark ? <Sun className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4 text-primary" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

export default ThemeToggle
