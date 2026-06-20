import { motion } from 'framer-motion'
import { BookOpen, Calendar, Compass, Home, Sparkles, Users } from 'lucide-react'
import { NAV_ITEMS } from './Navbar.jsx'

const MOBILE_NAV = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'today', icon: Calendar, label: 'Today', needsRoadmap: true },
  { id: 'active', icon: BookOpen, label: 'Path', needsRoadmap: true },
  { id: 'study', icon: Sparkles, label: 'Study', needsRoadmap: true },
  { id: 'community', icon: Users, label: 'Explore' },
]

const MobileBottomNav = ({ page, onNavigate, hasRoadmap }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-border/80 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
    <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-1">
      {MOBILE_NAV.map(({ id, icon: Icon, label, needsRoadmap }) => {
        const disabled = needsRoadmap && !hasRoadmap
        const active = page === id
        return (
          <motion.button
            key={id}
            type="button"
            disabled={disabled}
            whileTap={disabled ? {} : { scale: 0.92 }}
            onClick={() => !disabled && onNavigate(id)}
            className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition ${
              disabled ? 'opacity-40' : active ? 'text-aura-300' : 'text-zinc-500'
            }`}
          >
            <Icon className={`h-5 w-5 ${active ? 'text-aura-400' : ''}`} />
            <span className="truncate">{label}</span>
            {active ? <span className="h-0.5 w-4 rounded-full bg-aura-500" /> : <span className="h-0.5 w-4" />}
          </motion.button>
        )
      })}
    </div>
  </nav>
)

export default MobileBottomNav
