import { useEffect, useState } from 'react'
import Loader from './Loader'

const BACKEND = import.meta.env.VITE_BACKEND_URL

function KidCard({ kid, onOpen }) {
  return (
    <button onClick={() => onOpen(kid)} className="group text-left w-full bg-slate-800/60 border border-slate-700 hover:border-blue-500/50 rounded-xl p-4 transition-colors">
      <div className="flex items-center gap-4">
        <img src={kid.avatar_url || 'https://placehold.co/96x96?text=Ava'} alt={kid.name} className="w-16 h-16 rounded-lg object-cover" />
        <div>
          <div className="text-white font-semibold text-lg">{kid.name}{kid.nickname ? ` (${kid.nickname})` : ''}</div>
          <div className="text-slate-400 text-sm">Authorized viewers: {kid.allowed_grandparents?.length || 0}</div>
        </div>
      </div>
    </button>
  )
}

function MomentCard({ m }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
      {m.type === 'photo' || m.type === 'art' ? (
        <img src={m.thumbnail_url || m.media_url} alt={m.title} className="w-full h-56 object-cover" />
      ) : m.type === 'audio' ? (
        <div className="p-4">
          <audio controls className="w-full">
            <source src={m.media_url} />
          </audio>
        </div>
      ) : null}
      <div className="p-4">
        <div className="text-white font-semibold">{m.title}</div>
        {m.description && <div className="text-slate-400 text-sm mt-1">{m.description}</div>}
        <div className="text-xs mt-2 text-slate-500 uppercase tracking-wide">{m.visibility}</div>
      </div>
    </div>
  )
}

export default function Portal() {
  const [loading, setLoading] = useState(true)
  const [kids, setKids] = useState([])
  const [activeKid, setActiveKid] = useState(null)
  const [timeline, setTimeline] = useState(null)
  const [error, setError] = useState('')

  const grandparentEmail = 'grandma@family.demo' // demo viewer

  const fetchKids = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BACKEND}/api/kids?grandparent=${encodeURIComponent(grandparentEmail)}`)
      if (!res.ok) throw new Error(`Failed to load kids (${res.status})`)
      const data = await res.json()
      setKids(data)
      if (data.length > 0) {
        openKid(data[0])
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const openKid = async (kid) => {
    setActiveKid(kid)
    setTimeline(null)
    try {
      const res = await fetch(`${BACKEND}/api/kids/${kid.id}/timeline?grandparent=${encodeURIComponent(grandparentEmail)}`)
      if (!res.ok) throw new Error(`Failed to load timeline (${res.status})`)
      const data = await res.json()
      setTimeline(data)
    } catch (e) {
      setError(e.message)
    }
  }

  const seed = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/api/seed`, { method: 'POST' })
      if (!res.ok) throw new Error('Seeding failed')
      await fetchKids()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKids()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.06),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.06),transparent_40%)]"></div>

      <div className="relative max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="text-white">
            <div className="text-2xl font-bold">Little Years – Grandparent Portal</div>
            <div className="text-slate-400 text-sm">Signed in as {grandparentEmail}</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={seed} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white">Seed demo data</button>
            <button onClick={fetchKids} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white">Refresh</button>
          </div>
        </div>

        {error && (
          <div className="mb-6 text-red-300 bg-red-900/30 border border-red-700/40 p-3 rounded">{error}</div>
        )}

        {loading && (
          <div className="mb-6"><Loader label="Loading portal..." /></div>
        )}

        {!loading && kids.length === 0 && (
          <div className="text-slate-300">No kids found for this viewer. Try seeding demo data.</div>
        )}

        {/* Kids list */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kids.map(k => (
            <KidCard key={k.id} kid={k} onOpen={openKid} />
          ))}
        </div>

        {/* Timeline */}
        {activeKid && timeline && (
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <img src={activeKid.avatar_url} className="w-10 h-10 rounded-lg object-cover" />
              <div className="text-white font-semibold text-lg">{activeKid.name}'s moments</div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {timeline.moments.map(m => (
                <MomentCard key={m.id} m={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
