import { getSessionId } from './session.js'

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  'X-Session-Id': getSessionId(),
  ...extra,
})

const parse = async (res) => {
  const raw = await res.text()
  const data = raw ? JSON.parse(raw) : null
  if (!res.ok) throw new Error(data?.error || 'Request failed')
  return data
}

export const api = {
  get: (url) => fetch(url, { headers: headers({ 'Content-Type': undefined }) }).then(parse),
  post: (url, body) => fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(parse),
  put: (url, body) => fetch(url, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }).then(parse),
  del: (url) => fetch(url, { method: 'DELETE', headers: headers({ 'Content-Type': undefined }) }).then(parse),
}

export const ensureSession = async () => {
  let sid = getSessionId()
  if (!sid) {
    const data = await fetch('/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(parse)
    sid = data.sessionId
    localStorage.setItem('aurapath-session', sid)
  }
  return sid
}

export const streamChat = async (roadmapId, { message, history, onToken, onSources, onDone, onError }) => {
  const res = await fetch(`/api/roadmaps/${roadmapId}/chat/stream`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ message, history }),
  })
  if (!res.ok) {
    const raw = await res.text()
    let err = 'Stream failed'
    try {
      err = JSON.parse(raw)?.error || err
    } catch {}
    throw new Error(err)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const evt = JSON.parse(line.slice(6))
        if (evt.type === 'token') onToken?.(evt.text)
        if (evt.type === 'sources') onSources?.(evt.sources)
        if (evt.type === 'done') onDone?.()
        if (evt.type === 'error') onError?.(evt.message)
      } catch {}
    }
  }
  onDone?.()
}
