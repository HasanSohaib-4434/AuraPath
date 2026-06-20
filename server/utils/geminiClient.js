import { GoogleGenAI } from '@google/genai'

export const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY')
  return new GoogleGenAI({ apiKey })
}

export const MODEL = 'gemini-3.1-flash-lite'

export const stripMarkdownCodeFence = (s) => {
  if (!s) return ''
  const trimmed = String(s).trim()
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (match) return match[1].trim()
  return trimmed
}

export const extractJsonObject = (s) => {
  const str = stripMarkdownCodeFence(s)
  const start = str.indexOf('{')
  const end = str.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    const arrStart = str.indexOf('[')
    const arrEnd = str.lastIndexOf(']')
    if (arrStart >= 0 && arrEnd > arrStart) return str.slice(arrStart, arrEnd + 1)
    return null
  }
  return str.slice(start, end + 1)
}

export const generateText = async (prompt, { temperature = 0.4, system } = {}) => {
  const ai = getAI()
  const contents = [{ role: 'user', parts: [{ text: prompt }] }]
  const config = { temperature }
  if (system) config.systemInstruction = system
  const resp = await ai.models.generateContent({ model: MODEL, contents, config })
  return stripMarkdownCodeFence(resp?.text || '')
}

export const generateJson = async (prompt, { temperature = 0.35, system } = {}) => {
  const raw = await generateText(`${prompt}\n\nReturn ONLY valid JSON.`, { temperature, system })
  const candidate = extractJsonObject(raw) || raw
  return JSON.parse(candidate)
}
