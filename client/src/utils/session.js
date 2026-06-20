const KEY = 'aurapath-session'
const NAME_KEY = 'aurapath-display-name'

export const getSessionId = () => {
  try {
    return localStorage.getItem(KEY) || ''
  } catch {
    return ''
  }
}

export const setSessionId = (id) => {
  try {
    localStorage.setItem(KEY, id)
  } catch {}
}

export const getDisplayName = () => {
  try {
    return localStorage.getItem(NAME_KEY) || ''
  } catch {
    return ''
  }
}

export const setDisplayName = (name) => {
  try {
    localStorage.setItem(NAME_KEY, name)
  } catch {}
}
