import { useEffect, useMemo, useState } from 'react'
import Loader from './Loader'

const BACKEND = import.meta.env.VITE_BACKEND_URL

function KidCard({ kid, onOpen, active }) {
  return (
    <button
      onClick={() => onOpen(kid)}
      className={`group text-left w-full bg-slate-800/60 border rounded-xl p-4 transition-colors ${
        active ? 'border-blue-500/70' : 'border-slate-700 hover:border-blue-500/50'
      }`}
    >
      <div className="flex items-center gap-4">
        <img
          src={kid.avatar_url || 'https://placehold.co/96x96?text=Ava'}
          alt={kid.name}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div>
          <div className="text-white font-semibold text-lg">
            {kid.name}
            {kid.nickname ? ` (${kid.nickname})` : ''}
          </div>
          <div className="text-slate-400 text-sm">
            Authorized viewers: {kid.allowed_grandparents?.length || 0}
          </div>
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
        <div className="text-white font-semibold flex items-center gap-2">
          {m.title}
          <span
            className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${
              m.visibility === 'public'
                ? 'text-emerald-300 border-emerald-700/60 bg-emerald-900/20'
                : 'text-amber-300 border-amber-700/60 bg-amber-900/20'
            }`}
          >
            {m.visibility}
          </span>
        </div>
        {m.description && <div className="text-slate-400 text-sm mt-1">{m.description}</div>}
      </div>
    </div>
  )
}

export default function Portal() {
  const [loadingKids, setLoadingKids] = useState(true)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [kids, setKids] = useState([])
  const [activeKid, setActiveKid] = useState(null)
  const [timeline, setTimeline] = useState(null)
  const [error, setError] = useState('')
  const [viewerEmail, setViewerEmail] = useState('grandma@family.demo')
  const [includePrivate, setIncludePrivate] = useState(false)

  const kidCountLabel = useMemo(() => {
    if (!kids?.length) return 'No kids'
    if (kids.length === 1) return '1 kid'
    return `${kids.length} kids`
  }, [kids])

  const fetchKids = async (email = viewerEmail) => {
    setLoadingKids(true)
    setError('')
    try {
      const res = await fetch(`${BACKEND}/api/kids?grandparent=${encodeURIComponent(email)}`)
      if (!res.ok) throw new Error(`Failed to load kids (${res.status})`)
      const data = await res.json()
      setKids(data)
      // auto-open first kid if none selected or selected not in list
      if (data.length > 0) {
        const toOpen = activeKid && data.find(k => k.id === activeKid.id) ? activeKid : data[0]
        openKid(toOpen, includePrivate, email)
      } else {
        setActiveKid(null)
        setTimeline(null)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingKids(false)
    }
  }

  const openKid = async (kid, withPrivate = includePrivate, email = viewerEmail) => {
    setActiveKid(kid)
    setTimeline(null)
    setLoadingTimeline(true)
    try {
      const res = await fetch(
        `${BACKEND}/api/kids/${kid.id}/timeline?grandparent=${encodeURIComponent(email)}&include_private=${withPrivate}`
      )
      if (!res.ok) throw new Error(`Failed to load timeline (${res.status})`)
      const data = await res.json()
      setTimeline(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingTimeline(false)
    }
  }

  const seed = async () => {
    setError('')
    setLoadingKids(true)
    try {
      const res = await fetch(`${BACKEND}/api/seed`, { method: 'POST' })
      if (!res.ok) throw new Error('Seeding failed')
      await fetchKids(viewerEmail)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingKids(false)
    }
  }

  // Effects
  useEffect(() => {
    fetchKids()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handlers
  const onChangeViewer = (e) => {
    const email = e.target.value
    setViewerEmail(email)
  }
  const applyViewer = () => {
    fetchKids(viewerEmail)
  }
  const onTogglePrivate = () => {
    const val = !includePrivate
    setIncludePrivate(val)
    if (activeKid) {
      openKid(activeKid, val)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.06),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.06),transparent_40%)]"></div>

      <div className="relative max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="text-white">
            <div className="text-2xl font-bold">Little Years – Grandparent Portal</div>
            <div className="text-slate-400 text-sm">Signed in as {viewerEmail}</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2">
              <input
                value={viewerEmail}
                onChange={onChangeViewer}
                placeholder="grandparent email"
                className="bg-transparent placeholder-slate-500 text-white text-sm focus:outline-none min-w-[220px]"
              />
              <button onClick={applyViewer} className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-sm">Apply</button>
            </div>
            <button onClick={seed} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white">Seed demo data</button>
            <button onClick={() => fetchKids(viewerEmail)} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white">Refresh</button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 text-red-300 bg-red-900/30 border border-red-700/40 p-3 rounded">{error}</div>
        )}

        {/* Kids + state */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-slate-300 text-sm">{kidCountLabel} visible to this viewer</div>
          <label className="inline-flex items-center gap-2 text-slate-200 text-sm select-none">
            <input type="checkbox" checked={includePrivate} onChange={onTogglePrivate} className="accent-blue-500" />
            Show private moments (if authorized)
          </label>
        </div>

        {loadingKids ? (
          <div className="mb-6"><Loader label="Loading kids..." /></div>
        ) : kids.length === 0 ? (
          <div className="text-slate-300">No kids found for this viewer. Try seeding demo data.</div>
        ) : null}

        {/* Kids list */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kids.map(k => (
            <KidCard key={k.id} kid={k} onOpen={openKid} active={activeKid?.id === k.id} />)
          )}
        </div>

        {/* Timeline */}
        {activeKid && (
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <img src={activeKid.avatar_url} className="w-10 h-10 rounded-lg object-cover" />
              <div className="text-white font-semibold text-lg">{activeKid.name}'s moments</div>
            </div>

            {loadingTimeline && (
              <div className="mb-4"><Loader label="Loading timeline..." /></div>
            )}

            {timeline && (
              <>
                {!timeline.includes_private && includePrivate && (
                  <div className="mb-4 text-amber-200 bg-amber-900/30 border border-amber-700/40 p-3 rounded text-sm">
                    Private moments are hidden for this viewer.
                  </div>
                )}
                {timeline.moments.length === 0 ? (
                  <div className="text-slate-300">No moments yet.</div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {timeline.moments.map(m => (
                      <MomentCard key={m.id} m={m} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
