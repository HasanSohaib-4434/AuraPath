import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Copy,
  Download,
  Link2,
  Loader2,
  RefreshCw,
  Share2,
  ShieldCheck,
} from 'lucide-react'
import { api } from '../utils/api.js'

const PathActionsBar = ({ roadmapId, onRoadmapUpdate, onShare }) => {
  const [busy, setBusy] = useState('')
  const [validation, setValidation] = useState(null)
  const [shareUrl, setShareUrl] = useState('')

  const run = async (key, fn) => {
    setBusy(key)
    try {
      await fn()
    } catch (e) {
      alert(e?.message || 'Action failed')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        disabled={!!busy}
        onClick={() =>
          run('share', async () => {
            const data = await api.post(`/api/roadmaps/${roadmapId}/share`, {})
            const url = `${window.location.origin}?share=${data.shareToken}`
            setShareUrl(url)
            onShare?.(url)
            await navigator.clipboard.writeText(url)
          })
        }
        className="chip inline-flex items-center gap-1.5"
      >
        {busy === 'share' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
        Share
      </motion.button>

      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        disabled={!!busy}
        onClick={() => run('dup', async () => {
          const copy = await api.post(`/api/roadmaps/${roadmapId}/duplicate`, {})
          onRoadmapUpdate?.(copy)
        })}
        className="chip inline-flex items-center gap-1.5"
      >
        <Copy className="h-3.5 w-3.5" />
        Duplicate
      </motion.button>

      <a
        href={`/api/roadmaps/${roadmapId}/export?format=markdown`}
        download
        className="chip inline-flex items-center gap-1.5 no-underline"
      >
        <Download className="h-3.5 w-3.5" />
        Export MD
      </a>

      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        disabled={!!busy}
        onClick={() =>
          run('validate', async () => {
            const data = await api.post(`/api/roadmaps/${roadmapId}/validate-resources`, {})
            setValidation(data)
          })
        }
        className="chip inline-flex items-center gap-1.5"
      >
        {busy === 'validate' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
        Check links
      </motion.button>

      {validation ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          disabled={!!busy || !validation.broken}
          onClick={() =>
            run('fix', async () => {
              await api.post(`/api/roadmaps/${roadmapId}/fix-resources`, {})
              const updated = await api.get(`/api/roadmaps/${roadmapId}`)
              onRoadmapUpdate?.(updated)
              setValidation(null)
            })
          }
          className="chip inline-flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Fix {validation.broken} broken
        </motion.button>
      ) : null}

      {shareUrl ? (
        <span className="flex items-center gap-1 text-xs text-emerald-400">
          <Link2 className="h-3 w-3" />
          Link copied!
        </span>
      ) : null}
    </div>
  )
}

export default PathActionsBar
