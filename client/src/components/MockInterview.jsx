import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Mic, MessageSquare } from 'lucide-react'
import { api } from '../utils/api.js'
import { isSpeechSupported, speak, stopSpeaking } from '../utils/voice.js'
import VoiceButton from './VoiceButton.jsx'
import ListenButton from './ListenButton.jsx'

const MockInterview = ({ roadmapId }) => {
  const [questions, setQuestions] = useState(null)
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const speechOk = isSpeechSupported()

  useEffect(() => {
    if (questions?.[idx] && !feedback) {
      speak(questions[idx].replace(/^\d+[\.)]\s*/, '').slice(0, 200), `mock-q-${idx}`)
    }
    return () => stopSpeaking()
  }, [questions, idx, feedback])

  const start = async () => {
    setLoading(true)
    try {
      const data = await api.post(`/api/student/${roadmapId}/mock-interview`, {})
      setQuestions(data.questions || [])
      setIdx(0)
      setAnswer('')
      setFeedback('')
    } catch (e) {
      alert(e?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    setLoading(true)
    try {
      const data = await api.post(`/api/student/${roadmapId}/mock-interview`, {
        questions,
        questionIndex: idx,
        answer,
      })
      setFeedback(data.feedback || '')
    } catch (e) {
      setFeedback(e?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const next = () => {
    setIdx((i) => i + 1)
    setAnswer('')
    setFeedback('')
  }

  const questionText = questions?.[idx]?.replace(/^\d+[\.)]\s*/, '') || ''

  if (!questions) {
    return (
      <div className="glass-card space-y-3 p-4">
        <p className="text-xs text-zinc-500">
          Practice oral exam questions. {speechOk ? 'Use the mic button to speak answers, or type them.' : 'Use Chrome/Edge for mic support, or type answers.'}
        </p>
        <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={start} disabled={loading} className="btn-secondary w-full text-sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
          Start mock interview
        </motion.button>
      </div>
    )
  }

  if (idx >= questions.length) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-200">
        Mock interview complete! Great practice.
        <button type="button" onClick={() => setQuestions(null)} className="mt-2 block w-full text-xs text-zinc-400 underline">
          Start again
        </button>
      </div>
    )
  }

  return (
    <div className="glass-card space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Mic className="h-4 w-4 text-rose-400" />
          Mock interview {idx + 1}/{questions.length}
        </div>
        <ListenButton
          text={questionText}
          messageKey={`mock-q-${idx}`}
          className="!mt-0 text-zinc-500 hover:text-aura-300"
        />
      </div>

      <p className="text-sm text-zinc-300">{questions[idx]}</p>

      {!feedback ? (
        <>
          <div className="rounded-xl border border-surface-border/80 bg-surface/40 px-3 py-2 text-xs text-zinc-500">
            <strong className="text-zinc-400">How to use the mic:</strong>
            <ol className="mt-1 list-inside list-decimal space-y-0.5">
              <li>Tap the <Mic className="inline h-3 w-3" /> button (it turns red)</li>
              <li>Allow microphone when the browser asks</li>
              <li>Speak your answer clearly, then wait — text appears in the box</li>
              <li>Tap Submit answer (or edit the text first)</li>
            </ol>
            {!speechOk ? (
              <p className="mt-2 text-amber-400/90">Mic works best in Google Chrome or Microsoft Edge on desktop.</p>
            ) : null}
          </div>

          <div className="flex items-start gap-2">
            <VoiceButton showLabel onTranscript={(t) => setAnswer((a) => (a ? `${a} ${t}` : t))} disabled={loading} />
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              placeholder="Your answer appears here after you speak, or type directly…"
              className="input-field min-w-0 flex-1 resize-none text-sm"
            />
          </div>
          <button type="button" onClick={submit} disabled={loading || !answer.trim()} className="btn-primary w-full text-sm">
            {loading ? 'Grading…' : 'Submit answer'}
          </button>
        </>
      ) : (
        <>
          <div className="rounded-xl bg-surface-elevated p-3 text-sm text-zinc-300 whitespace-pre-wrap">{feedback}</div>
          <button type="button" onClick={next} className="btn-secondary w-full text-sm">
            Next question
          </button>
        </>
      )}
    </div>
  )
}

export default MockInterview
