import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { speak, stopSpeaking, subscribeSpeaking } from '../utils/voice.js'

const ListenButton = ({ text, messageKey, className = '' }) => {
  const [active, setActive] = useState(false)
  const safeText = typeof text === 'string' ? text : text == null ? '' : String(text)

  useEffect(() => {
    return subscribeSpeaking(({ speaking, speakingKey }) => {
      setActive(speaking && speakingKey === messageKey)
    })
  }, [messageKey])

  if (!safeText.trim()) return null

  const handleClick = () => {
    if (active) stopSpeaking()
    else speak(safeText.slice(0, 400), messageKey)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`mt-2 inline-flex items-center gap-1 text-xs transition ${
        active ? 'font-medium text-red-300 hover:text-red-200' : 'opacity-70 hover:opacity-100'
      } ${className}`}
      aria-label={active ? 'Stop speaking' : 'Listen to response'}
    >
      {active ? (
        <>
          <VolumeX className="h-3 w-3" /> Stop
        </>
      ) : (
        <>
          <Volume2 className="h-3 w-3" /> Listen
        </>
      )}
    </button>
  )
}

export default ListenButton
