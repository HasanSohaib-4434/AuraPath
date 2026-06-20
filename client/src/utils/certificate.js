export const generateCertificate = ({ title, displayName, progressPct, date = new Date() }) => {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 850
  const ctx = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, 1200, 850)
  grad.addColorStop(0, '#0f172a')
  grad.addColorStop(1, '#1e1b4b')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1200, 850)

  ctx.strokeStyle = '#6366f1'
  ctx.lineWidth = 4
  ctx.strokeRect(40, 40, 1120, 770)

  ctx.fillStyle = '#e2e8f0'
  ctx.font = 'bold 48px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('AuraPath Certificate', 600, 140)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '24px system-ui, sans-serif'
  ctx.fillText('This certifies that', 600, 220)

  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 36px system-ui, sans-serif'
  ctx.fillText(displayName || 'Dedicated Learner', 600, 290)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '22px system-ui, sans-serif'
  ctx.fillText('has completed the learning path', 600, 350)

  ctx.fillStyle = '#a5b4fc'
  ctx.font = 'bold 32px system-ui, sans-serif'
  const pathTitle = title?.length > 50 ? `${title.slice(0, 47)}…` : title || 'Learning Path'
  ctx.fillText(pathTitle, 600, 420)

  ctx.fillStyle = '#64748b'
  ctx.font = '20px system-ui, sans-serif'
  ctx.fillText(`${progressPct}% completion · ${date.toLocaleDateString()}`, 600, 500)

  ctx.fillStyle = '#6366f1'
  ctx.font = 'italic 18px system-ui, sans-serif'
  ctx.fillText('Keep learning — your AuraPath continues.', 600, 720)

  return canvas.toDataURL('image/png')
}
