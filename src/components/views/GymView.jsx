import { useState, useMemo } from 'react'
import { todayAEST, getWeekStart, formatDateShort } from '../../utils/date'
import { FOCUS_AREAS, TIME_OF_DAY, DAY_NAMES } from '../../constants'

const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)

const PINK = '#F472B6'

export default function GymView({ sessions, setSessions }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    timeOfDay: 'Morning',
    durationMinutes: 60,
    focusAreas: [],
    notes: '',
  })

  const today = todayAEST()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const toggleFocus = (area) =>
    setForm((f) => ({
      ...f,
      focusAreas: f.focusAreas.includes(area)
        ? f.focusAreas.filter((a) => a !== area)
        : [...f.focusAreas, area],
    }))

  const saveSession = () => {
    setSessions((prev) => [
      {
        id: uid(),
        date: todayStr,
        timeOfDay: form.timeOfDay,
        durationMinutes: Number(form.durationMinutes),
        focusAreas: form.focusAreas,
        notes: form.notes.trim(),
        loggedAt: new Date().toISOString(),
      },
      ...prev,
    ])
    setForm({ timeOfDay: 'Morning', durationMinutes: 60, focusAreas: [], notes: '' })
    setShowForm(false)
  }

  const deleteSession = (id) => {
    if (window.confirm('Delete this session?'))
      setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  // ── Week strip ──────────────────────────────────────────────────────────────
  const weekDays = useMemo(() => {
    const weekStart = getWeekStart()
    return DAY_NAMES.map((label, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return { label, dateStr }
    })
  }, [])

  const sessionsByDate = useMemo(
    () =>
      sessions.reduce((acc, s) => {
        ;(acc[s.date] = acc[s.date] || []).push(s)
        return acc
      }, {}),
    [sessions],
  )

  // ── Stats ───────────────────────────────────────────────────────────────────
  const { weekCount, monthCount } = useMemo(() => {
    const weekStart   = getWeekStart()
    const monthStart  = new Date(today.getFullYear(), today.getMonth(), 1)
    return {
      weekCount:  sessions.filter((s) => new Date(s.date) >= weekStart).length,
      monthCount: sessions.filter((s) => new Date(s.date) >= monthStart).length,
    }
  }, [sessions])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Gym Log</h1>
        <p className="text-sm text-gray-400">
          <span className="font-semibold text-gray-700">{weekCount}</span> this week ·{' '}
          <span className="font-semibold text-gray-700">{monthCount}</span> this month
        </p>
      </div>

      {/* ── Quick Log ── */}
      <div className="card p-5">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: PINK }}
          >
            + Log Today's Session
          </button>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              New Session
            </h2>

            {/* Time of day */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Time of day</p>
              <div className="flex gap-2">
                {TIME_OF_DAY.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, timeOfDay: t }))}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={
                      form.timeOfDay === t
                        ? { backgroundColor: PINK, color: '#fff' }
                        : { backgroundColor: '#F3F4F6', color: '#6B7280' }
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Duration (minutes)</p>
              <input
                type="number"
                min="1"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
              />
            </div>

            {/* Focus areas */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Focus areas</p>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map((area) => (
                  <button
                    key={area}
                    onClick={() => toggleFocus(area)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={
                      form.focusAreas.includes(area)
                        ? { backgroundColor: PINK, color: '#fff' }
                        : { backgroundColor: '#F3F4F6', color: '#6B7280' }
                    }
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Notes (optional)</p>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="e.g. Heavy bench day"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && saveSession()}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={saveSession}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
                style={{ backgroundColor: PINK }}
              >
                Save Session
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-500 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Week Strip ── */}
      <div className="card p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
          This Week
        </h2>
        <div className="flex justify-between">
          {weekDays.map(({ label, dateStr }) => {
            const daySessions = sessionsByDate[dateStr] || []
            const isToday     = dateStr === todayStr
            const hasSession  = daySessions.length > 0
            const areas       = [...new Set(daySessions.flatMap((s) => s.focusAreas))].slice(0, 2)

            return (
              <div key={dateStr} className="flex flex-col items-center gap-1.5">
                <span className={`text-xs ${isToday ? 'font-semibold text-blue-500' : 'text-gray-400'}`}>
                  {label}
                </span>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={
                    hasSession
                      ? { backgroundColor: PINK, color: '#fff' }
                      : { border: '2px solid #E5E7EB', color: '#D1D5DB' }
                  }
                >
                  {hasSession ? daySessions.length : ''}
                </div>
                <span className="text-xs text-gray-300 text-center leading-tight max-w-12">
                  {areas.join('/')}
                </span>
              </div>
            )
          })}
        </div>
        {weekCount === 0 && (
          <p className="text-sm text-center text-gray-400 mt-4">
            No sessions logged yet this week — first one's the hardest.
          </p>
        )}
      </div>

      {/* ── Session History ── */}
      <div className="card p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Session History
        </h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-400">No sessions logged yet.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                  style={{ backgroundColor: PINK }}
                >
                  {s.timeOfDay[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm font-medium text-gray-900">{s.timeOfDay}</span>
                    <span className="text-xs text-gray-400">{s.durationMinutes} min</span>
                    {s.focusAreas.map((a) => (
                      <span
                        key={a}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: PINK + '22', color: '#9d174d' }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                  {s.notes && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{s.notes}</p>
                  )}
                  <p className="text-xs text-gray-300 mt-0.5">{formatDateShort(s.date)}</p>
                </div>
                <button
                  onClick={() => deleteSession(s.id)}
                  className="text-gray-300 hover:text-red-400 shrink-0"
                  title="Delete session"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
