import { useState } from 'react'
import { DAY_NAMES, SUBJECT_COLORS, CALENDAR_PALETTE } from '../constants'
import SubjectTag from './SubjectTag'

const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)

// ── Small status badge shown next to each calendar row ───────────────────────
function SyncBadge({ status }) {
  if (!status || status.state === 'idle') return null
  if (status.state === 'syncing')
    return <span className="text-xs text-blue-400 animate-pulse">Syncing…</span>
  if (status.state === 'ok')
    return <span className="text-xs text-green-500">{status.lastSynced}</span>
  if (status.state === 'error')
    return (
      <span className="text-xs text-red-400 truncate max-w-40" title={status.message}>
        Error
      </span>
    )
  return null
}

// ── Color swatch picker ───────────────────────────────────────────────────────
function ColorPicker({ value, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {CALENDAR_PALETTE.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: c,
            borderColor: value === c ? '#1A1A1A' : 'transparent',
          }}
          title={c}
        />
      ))}
    </div>
  )
}

// ── Main settings panel ───────────────────────────────────────────────────────
export default function SettingsPanel({
  onClose,
  icalFeeds,
  setIcalFeeds,
  feedStatuses,
  onSyncFeed,
  onSyncAll,
  manualEvents,
  setManualEvents,
}) {
  const [addForm, setAddForm] = useState({
    name: '',
    url: '',
    color: CALENDAR_PALETTE[0],
  })
  const [expandedError, setExpandedError] = useState(null)

  const [eventForm, setEventForm] = useState({
    days: [],
    startTime: '09:00',
    endTime: '10:00',
    name: '',
    subject: 'ENG1012',
  })

  // ── Calendar feed actions ─────────────────────────────────────────────────
  const addFeed = () => {
    const url = addForm.url.trim()
    const name = addForm.name.trim()
    if (!url || !name) return
    const newFeed = { id: uid(), name, url, color: addForm.color, enabled: true }
    const next = [...icalFeeds, newFeed]
    setIcalFeeds(next)
    onSyncFeed(newFeed)
    setAddForm({ name: '', url: '', color: CALENDAR_PALETTE[0] })
  }

  const deleteFeed = (id) => {
    if (window.confirm('Remove this calendar?')) {
      setIcalFeeds((prev) => prev.filter((f) => f.id !== id))
    }
  }

  const toggleFeed = (id) =>
    setIcalFeeds((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
    )

  // ── Manual event actions ──────────────────────────────────────────────────
  const toggleDay = (day) =>
    setEventForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }))

  const addManualEvent = () => {
    if (!eventForm.name.trim() || !eventForm.days.length) return
    setManualEvents((prev) => [
      ...prev,
      { id: uid(), ...eventForm, name: eventForm.name.trim() },
    ])
    setEventForm({ days: [], startTime: '09:00', endTime: '10:00', name: '', subject: 'ENG1012' })
  }

  const deleteManualEvent = (id) =>
    setManualEvents((prev) => prev.filter((e) => e.id !== id))

  const syncingCount = Object.values(feedStatuses).filter((s) => s.state === 'syncing').length

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      <div className="relative ml-auto w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex justify-between items-center z-10">
          <h2 className="font-semibold text-lg">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-8 flex-1">

          {/* ── Google Calendars ── */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Google Calendars
              </h3>
              {icalFeeds.length > 0 && (
                <button
                  onClick={onSyncAll}
                  disabled={syncingCount > 0}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium disabled:opacity-40"
                >
                  {syncingCount > 0 ? 'Syncing…' : 'Sync all'}
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-4">
              In Google Calendar, click the <strong>⋮</strong> next to a calendar →
              <em> Settings and sharing</em> → scroll to <em>Secret address in iCal format</em> →
              copy and paste the URL below.
            </p>

            {/* Feed list */}
            {icalFeeds.length > 0 && (
              <div className="space-y-2 mb-4">
                {icalFeeds.map((feed) => {
                  const status = feedStatuses[feed.id]
                  const hasError = status?.state === 'error'
                  return (
                    <div
                      key={feed.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        {/* Enable/disable toggle */}
                        <button
                          onClick={() => toggleFeed(feed.id)}
                          title={feed.enabled ? 'Disable' : 'Enable'}
                          className="shrink-0 w-4 h-4 rounded-full border-2 transition-colors"
                          style={{
                            backgroundColor: feed.enabled ? feed.color : 'transparent',
                            borderColor: feed.color,
                          }}
                        />
                        <span className="text-sm font-medium text-gray-800 flex-1 truncate">
                          {feed.name}
                        </span>
                        <SyncBadge status={status} />
                        <button
                          onClick={() => onSyncFeed(feed)}
                          className="text-xs text-gray-400 hover:text-blue-500 shrink-0"
                          title="Sync this calendar"
                        >
                          ↻
                        </button>
                        <button
                          onClick={() => deleteFeed(feed.id)}
                          className="text-gray-300 hover:text-red-400 shrink-0 text-sm"
                          title="Remove"
                        >
                          🗑
                        </button>
                      </div>

                      {/* URL (truncated, expandable on error) */}
                      <p className="text-xs text-gray-400 mt-1 truncate">{feed.url}</p>

                      {/* Error detail */}
                      {hasError && (
                        <div className="mt-1.5">
                          {expandedError === feed.id ? (
                            <p className="text-xs text-red-500 break-words">{status.message}</p>
                          ) : (
                            <button
                              onClick={() => setExpandedError(feed.id)}
                              className="text-xs text-red-400 underline"
                            >
                              Show error
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add calendar form */}
            <div className="border border-gray-200 rounded-xl p-3 space-y-2.5">
              <p className="text-xs font-medium text-gray-500">Add a calendar</p>

              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Name (e.g. Uni Timetable)"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              />

              <textarea
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="iCal URL (webcal:// or https://...)"
                value={addForm.url}
                onChange={(e) => setAddForm((f) => ({ ...f, url: e.target.value }))}
              />

              <div>
                <p className="text-xs text-gray-400 mb-1.5">Calendar colour</p>
                <ColorPicker
                  value={addForm.color}
                  onChange={(c) => setAddForm((f) => ({ ...f, color: c }))}
                />
              </div>

              <button
                onClick={addFeed}
                disabled={!addForm.name.trim() || !addForm.url.trim()}
                className="w-full py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                Add &amp; Sync
              </button>
            </div>
          </section>

          {/* ── Manual Recurring Events ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Manual Recurring Events
            </h3>
            <div className="space-y-2 mb-4">
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Event name"
                value={eventForm.name}
                onChange={(e) => setEventForm((f) => ({ ...f, name: e.target.value }))}
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-400">Start</label>
                  <input
                    type="time"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm((f) => ({ ...f, startTime: e.target.value }))}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400">End</label>
                  <input
                    type="time"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm((f) => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
              </div>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={eventForm.subject}
                onChange={(e) => setEventForm((f) => ({ ...f, subject: e.target.value }))}
              >
                {Object.keys(SUBJECT_COLORS).map((s) => <option key={s}>{s}</option>)}
              </select>
              <div className="flex gap-1.5 flex-wrap">
                {DAY_NAMES.map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={
                      eventForm.days.includes(d)
                        ? { backgroundColor: '#2563EB', color: '#fff' }
                        : { backgroundColor: '#F3F4F6', color: '#6B7280' }
                    }
                  >
                    {d}
                  </button>
                ))}
              </div>
              <button
                onClick={addManualEvent}
                className="w-full py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Add Event
              </button>
            </div>

            {manualEvents.length > 0 ? (
              <div className="space-y-2">
                {manualEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-sm py-1">
                    <SubjectTag subject={e.subject} small />
                    <span className="flex-1 truncate text-gray-700">{e.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">{e.startTime}–{e.endTime}</span>
                    <span className="text-xs text-gray-300 shrink-0">{e.days.join(', ')}</span>
                    <button
                      onClick={() => deleteManualEvent(e.id)}
                      className="text-gray-300 hover:text-red-400 shrink-0"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No manual events yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
