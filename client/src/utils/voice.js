let speaking = false
let speakingKey = null
const speakingListeners = new Set()

const notifySpeaking = () => {
  const state = { speaking, speakingKey }
  queueMicrotask(() => speakingListeners.forEach((fn) => fn(state)))
}

export const subscribeSpeaking = (fn) => {
  speakingListeners.add(fn)
  fn({ speaking, speakingKey })
  return () => speakingListeners.delete(fn)
}

export const isSpeaking = () => speaking

export const isSpeechSupported = () =>
  typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

export const getSpeechErrorMessage = (error) => {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone blocked. Click the lock icon in your browser address bar and allow microphone access, then try again.'
    case 'no-speech':
      return 'No speech detected. Tap the mic and speak clearly for a few seconds.'
    case 'audio-capture':
      return 'No microphone found. Connect a mic or type your answer instead.'
    case 'network':
      return 'Speech recognition needs internet (Chrome uses Google servers). Check your connection.'
    default:
      return 'Voice input failed. Use Chrome or Edge, allow mic access, or type your answer.'
  }
}

export const createRecognizer = (onResult, onEnd, onError) => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return null
  const rec = new SR()
  rec.continuous = false
  rec.interimResults = true
  rec.lang = 'en-US'
  rec.maxAlternatives = 1

  rec.onresult = (e) => {
    let text = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        text += e.results[i][0].transcript
      }
    }
    if (text.trim()) onResult?.(text.trim())
  }

  rec.onend = () => onEnd?.()
  rec.onerror = (e) => onError?.(e.error || 'unknown')

  return rec
}

const finishSpeaking = () => {
  speaking = false
  speakingKey = null
  notifySpeaking()
}

export const speak = (text, key = null) => {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text.slice(0, 500))
  u.rate = 1
  speaking = true
  speakingKey = key
  notifySpeaking()
  u.onend = finishSpeaking
  u.onerror = finishSpeaking
  window.speechSynthesis.speak(u)
}

export const stopSpeaking = () => {
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
  finishSpeaking()
}
