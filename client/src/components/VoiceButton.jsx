import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { createRecognizer, getSpeechErrorMessage, isSpeechSupported } from '../utils/voice.js'

const VoiceButton = ({ onTranscript, disabled, showLabel = false }) => {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const recRef = useRef(null)

  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop()
      } catch {}
    }
  }, [])

  const stop = () => {
    try {
      recRef.current?.stop()
    } catch {}
    recRef.current = null
    setListening(false)
  }

  const start = () => {
    setError('')
    const rec = createRecognizer(
      (text) => {
        onTranscript?.(text)
        stop()
      },
      () => {
        setListening(false)
        recRef.current = null
      },
      (err) => {
        setError(getSpeechErrorMessage(err))
        setListening(false)
        recRef.current = null
      },
    )
    if (!rec) {
      setError('Voice not supported in this browser. Use Chrome or Edge.')
      return
    }
    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      setError('Could not start microphone. Allow mic permission and try again.')
      setListening(false)
    }
  }

  const toggle = () => {
    if (disabled) return
    if (listening) stop()
    else start()
  }

  if (!isSpeechSupported()) {
    return (
      <div className="shrink-0 rounded-xl border border-surface-border bg-surface-elevated px-2 py-2 text-[10px] leading-tight text-zinc-500 sm:max-w-[88px]">
        Mic needs Chrome/Edge. Type your answer below.
      </div>
    )
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={`rounded-xl p-2.5 transition ${
          listening
            ? 'animate-pulse bg-red-500/25 text-red-300 ring-2 ring-red-500/50'
            : 'bg-surface-elevated text-zinc-400 hover:text-aura-300'
        } disabled:opacity-40`}
        aria-label={listening ? 'Stop listening' : 'Start voice input'}
        title={listening ? 'Listening… tap to stop' : 'Tap to speak your answer'}
      >
        {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>
      {showLabel ? (
        <span className={`text-[10px] ${listening ? 'font-medium text-red-300' : 'text-zinc-500'}`}>
          {listening ? 'Listening…' : 'Tap mic'}
        </span>
      ) : null}
      {error ? <span className="max-w-[100px] text-center text-[10px] leading-tight text-amber-400">{error}</span> : null}
    </div>
  )
}

export default VoiceButton
