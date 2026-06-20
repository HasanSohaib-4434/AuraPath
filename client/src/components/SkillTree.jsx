import { motion } from 'framer-motion'

const SkillTree = ({ levels = [], completedTasks = new Set() }) => {
  if (!levels.length) return null

  return (
    <div className="-mx-1 overflow-x-auto px-3 pb-2 sm:mx-0 sm:px-1">
      <div className="flex min-w-max items-center gap-2 py-1 sm:gap-4">
        {levels.map((level, idx) => {
          const tasks = level.tasks || []
          const done = tasks.filter((_, ti) => completedTasks.has(`${idx}-${ti}`)).length
          const complete = tasks.length > 0 && done === tasks.length

          return (
            <div key={idx} className="flex items-center gap-2 sm:gap-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="flex w-[100px] flex-col items-center sm:w-[120px]"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold shadow-glow-sm sm:h-14 sm:w-14 ${
                    complete
                      ? 'bg-accent text-on-accent ring-2 ring-accent/50 ring-offset-2 ring-offset-surface'
                      : 'bg-primary text-on-primary'
                  }`}
                >
                  {complete ? '✓' : idx + 1}
                </div>
                <p className="mt-2 line-clamp-2 text-center text-[10px] font-medium text-ink-primary sm:text-xs">
                  {level.title || `Level ${idx + 1}`}
                </p>
                <p className="text-[10px] text-ink-secondary">
                  {done}/{tasks.length}
                </p>
              </motion.div>
              {idx < levels.length - 1 ? (
                <div className={`h-0.5 w-6 sm:w-10 ${complete ? 'bg-accent/60' : 'bg-subtle'}`} />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SkillTree
