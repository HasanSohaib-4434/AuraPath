import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, HelpCircle, Loader2, XCircle } from 'lucide-react'
import { api } from '../utils/api.js'

const QuizPanel = ({ roadmapId, levelIndex, levelTitle, onComplete }) => {
  const [questions, setQuestions] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const start = async () => {
    setLoading(true)
    setResult(null)
    setAnswers({})
    try {
      const data = await api.post(`/api/roadmaps/${roadmapId}/levels/${levelIndex}/quiz`, {})
      setQuestions(data.questions || [])
    } catch (e) {
      alert(e?.message || 'Quiz failed')
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    const ans = (questions || []).map((_, i) => answers[i] ?? -1)
    try {
      const data = await api.post(`/api/roadmaps/${roadmapId}/levels/${levelIndex}/quiz/submit`, {
        questions,
        answers: ans,
      })
      setResult(data)
      onComplete?.(data)
    } catch (e) {
      alert(e?.message || 'Submit failed')
    }
  }

  if (!questions) {
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        disabled={loading}
        onClick={(e) => {
          e.stopPropagation()
          start()
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HelpCircle className="h-3.5 w-3.5" />}
        Take quiz
      </motion.button>
    )
  }

  return (
    <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4" onClick={(e) => e.stopPropagation()}>
      <div className="mb-3 text-sm font-medium text-violet-200">Quiz: {levelTitle}</div>
      {!result ? (
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <div key={qi}>
              <p className="mb-2 text-sm text-zinc-200">{qi + 1}. {q.question}</p>
              <div className="space-y-1">
                {(q.options || []).map((opt, oi) => (
                  <label key={oi} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface/60">
                    <input
                      type="radio"
                      name={`q-${qi}`}
                      checked={answers[qi] === oi}
                      onChange={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                    />
                    <span className="text-zinc-300">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button type="button" onClick={submit} className="btn-primary text-sm">
            Submit quiz
          </button>
        </div>
      ) : (
        <div className="text-center">
          {result.passed ? (
            <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-emerald-400" />
          ) : (
            <XCircle className="mx-auto mb-2 h-10 w-10 text-amber-400" />
          )}
          <p className="text-lg font-bold text-zinc-100">{result.score}%</p>
          <p className="text-sm text-zinc-400">
            {result.correct}/{result.total} correct {result.passed ? '— Passed!' : '— Try again'}
          </p>
        </div>
      )}
    </div>
  )
}

export default QuizPanel
