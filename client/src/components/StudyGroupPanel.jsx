import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Loader2, Users } from 'lucide-react'
import { api } from '../utils/api.js'

const StudyGroupPanel = ({ roadmapId }) => {
  const [code, setCode] = useState('')
  const [group, setGroup] = useState(null)
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [joinCode, setJoinCode] = useState('')

  const create = async () => {
    setLoading(true)
    try {
      const g = await api.post('/api/student/groups', { roadmapId, name: 'My study group' })
      setGroup(g)
      setCode(g.code)
    } catch (e) {
      alert(e?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const join = async () => {
    setLoading(true)
    try {
      const data = await api.post('/api/student/groups/join', { code: joinCode })
      setGroup(data.group)
      setCode(data.group.code)
      loadBoard(data.group.code)
    } catch (e) {
      alert(e?.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  const loadBoard = async (c) => {
    try {
      const data = await api.get(`/api/student/groups/${c}/leaderboard`)
      setBoard(data)
    } catch {}
  }

  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
        <Users className="h-4 w-4 text-cyan-400" />
        Study group
      </div>
      {!code ? (
        <div className="space-y-2">
          <button type="button" onClick={create} disabled={loading} className="btn-primary w-full text-sm">
            Create group
          </button>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Join code"
              className="input-field flex-1 py-2 text-sm uppercase"
            />
            <button type="button" onClick={join} disabled={loading} className="btn-secondary shrink-0 text-sm">
              Join
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between rounded-xl bg-surface-elevated px-3 py-2">
            <span className="font-mono text-lg font-bold text-aura-300">{code}</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(code)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">Share this code with classmates</p>
          {board?.leaderboard?.length ? (
            <ul className="mt-3 space-y-1">
              {board.leaderboard.map((m, i) => (
                <li key={m.sessionId} className="flex justify-between text-xs text-zinc-400">
                  <span>
                    #{i + 1} …{m.sessionId}
                  </span>
                  <span>{m.xp} XP · {m.tasksDone} tasks</span>
                </li>
              ))}
            </ul>
          ) : (
            <button type="button" onClick={() => loadBoard(code)} className="mt-2 text-xs text-aura-400 underline">
              Load leaderboard
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default StudyGroupPanel
