import { motion } from 'framer-motion'

const levelColors = ['bg-aura-500', 'bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']

const SkillTree = ({ levels = [], completedTasks = new Set() }) => {
  if (!levels.length) return null

  return (
    <div className="-mx-1 overflow-x-auto px-3 pb-2 sm:mx-0 sm:px-1">
      <div className="flex min-w-max items-center gap-2 py-1 sm:gap-4">
        {levels.map((level, idx) => {
          const tasks = level.tasks || []
          const done = tasks.filter((_, ti) => completedTasks.has(`${idx}-${ti}`)).length
          const complete = tasks.length > 0 && done === tasks.length
          const color = levelColors[idx % levelColors.length]

          return (
            <div key={idx} className="flex items-center gap-2 sm:gap-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="flex w-[100px] flex-col items-center sm:w-[120px]"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} text-sm font-bold text-white shadow-glow-sm sm:h-14 sm:w-14 ${complete ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-surface' : ''}`}
                >
                  {complete ? '✓' : idx + 1}
                </div>
                <p className="mt-2 line-clamp-2 text-center text-[10px] font-medium text-zinc-300 sm:text-xs">
                  {level.title || `Level ${idx + 1}`}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {done}/{tasks.length}
                </p>
              </motion.div>
              {idx < levels.length - 1 ? (
                <div className={`h-0.5 w-6 sm:w-10 ${complete ? 'bg-emerald-500/60' : 'bg-surface-border'}`} />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SkillTree
