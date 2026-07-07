import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  BookOpen,
  Calendar,
  Heart,
  Home,
  LayoutDashboard,
  Link2,
  Menu,
  Route,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle.jsx'

export const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'today', label: 'Today', icon: Calendar, needsRoadmap: true },
  { id: 'paths', label: 'My Paths', icon: LayoutDashboard },
  { id: 'active', label: 'Active Path', icon: BookOpen, needsRoadmap: true },
  { id: 'resources', label: 'Resources', icon: Link2, needsRoadmap: true },
  { id: 'study', label: 'Study Hub', icon: Sparkles, needsRoadmap: true },
  { id: 'refresh', label: 'Feeling Low?', icon: Heart },
  { id: 'community', label: 'Explore', icon: Users },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
]

const Navbar = ({ page, onNavigate, hasRoadmap }) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  const go = (id) => {
    onNavigate(id)
    setMobileOpen(false)
  }

  const NavLink = ({ item, compact = false }) => {
    const active = page === item.id
    const disabled = item.needsRoadmap && !hasRoadmap
    const Icon = item.icon
    return (
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && go(item.id)}
        whileHover={disabled ? {} : { scale: 1.03 }}
        whileTap={disabled ? {} : { scale: 0.97 }}
        className={`relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
          compact ? 'w-full justify-start' : ''
        } ${
          disabled
            ? 'cursor-not-allowed text-ink-secondary opacity-50'
            : active
              ? 'text-on-primary'
              : 'text-ink-secondary hover:text-ink-primary'
        }`}
      >
        {active && !disabled ? (
          <motion.span
            layoutId="nav-pill"
            className="absolute inset-0 rounded-full bg-primary shadow-glow-sm"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        ) : null}
        <Icon className="relative h-4 w-4 shrink-0" />
        <span className="relative">{item.label}</span>
      </motion.button>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-subtle/60 bg-base/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <motion.button
          type="button"
          onClick={() => go('home')}
          className="flex items-center gap-2.5"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-glow-sm">
            <Route className="h-4 w-4 text-on-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-gradient-brand">Aura</span>
            <span className="text-ink-primary">Path</span>
          </span>
        </motion.button>

        <nav className="hidden items-center gap-1 rounded-full border border-subtle/80 bg-surface p-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.id} item={item} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
          <ThemeToggle compact />
          <button
            type="button"
            className="rounded-xl border border-subtle p-2 text-ink-secondary lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-subtle/60 lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.id} item={item} compact />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
