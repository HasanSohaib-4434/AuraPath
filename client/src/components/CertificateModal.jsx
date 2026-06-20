import { motion } from 'framer-motion'
import { Award, Download } from 'lucide-react'
import { generateCertificate } from '../utils/certificate.js'
import { getDisplayName } from '../utils/session.js'

const CertificateModal = ({ open, onClose, title, progressPct }) => {
  if (!open || progressPct < 100) return null

  const download = () => {
    const url = generateCertificate({
      title,
      displayName: getDisplayName() || 'AuraPath Learner',
      progressPct,
    })
    const a = document.createElement('a')
    a.href = url
    a.download = `aurapath-certificate.png`
    a.click()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="celebration-panel mb-8 p-6 text-center"
    >
      <Award className="mx-auto mb-3 h-10 w-10 text-accent" />
      <h3 className="text-lg font-bold text-ink-primary">Path complete!</h3>
      <p className="mt-2 text-sm text-ink-secondary">Download your completion certificate.</p>
      <div className="mt-4 flex justify-center gap-3">
        <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={download} className="btn-primary inline-flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download certificate
        </motion.button>
        {onClose ? (
          <button type="button" onClick={onClose} className="chip">
            Dismiss
          </button>
        ) : null}
      </div>
    </motion.div>
  )
}

export default CertificateModal
