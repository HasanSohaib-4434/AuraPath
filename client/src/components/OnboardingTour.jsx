import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, X } from 'lucide-react'

const STEPS = [
  { title: 'Set your goal', body: 'Tell AuraPath what you want to learn and pick a timeline or template.' },
  { title: 'Follow your path', body: 'Complete tasks level by level. Watch videos, read docs, take quizzes.' },
  { title: 'Study daily', body: 'Open Today for your plan, flashcards, and pomodoro focus sessions.' },
  { title: 'Track progress', body: 'Earn XP, badges, and download your certificate when you finish.' },
]

const OnboardingTour = ({ onDone }) => {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem('aurapath-onboarded')
    } catch {
      return true
    }
  })

  const finish = () => {
    try {
      localStorage.setItem('aurapath-onboarded', '1')
    } catch {}
    setVisible(false)
    onDone?.()
  }

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[20000] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      >
        <motion.div
          initial={{ y: 40 }}
          animate={{ y: 0 }}
          className="w-full max-w-md rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl"
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-aura-400">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="mt-1 text-lg font-bold text-zinc-100">{STEPS[step].title}</h2>
            </div>
            <button type="button" onClick={finish} className="text-zinc-500 hover:text-zinc-300">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">{STEPS[step].body}</p>
          <div className="mt-6 flex gap-2">
            {step > 0 ? (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-secondary flex-1 text-sm">
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => (step < STEPS.length - 1 ? setStep((s) => s + 1) : finish())}
              className="btn-primary flex-1 text-sm"
            >
              {step < STEPS.length - 1 ? (
                <>
                  Next <ChevronRight className="h-4 w-4" />
                </>
              ) : (
                'Get started'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default OnboardingTour
