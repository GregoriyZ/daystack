import { useState } from 'react'
import { DAY_NAMES, SUBJECT_COLORS, DEFAULT_SUBJECTS } from '../constants'
import SubjectTag from './SubjectTag'

export default function SettingsPanel({
  onClose,
  icalUrl,
  setIcalUrl,
  manualEvents,
  setManualEvents,
  onIcalSync,
  lastSynced,
  icalError,
}) {
  const [urlInput, setUrlInput] = useState(icalUrl || '')
  const [eventForm, setEventForm] = useState({
    days: [],
    startTime: '09:00',
    endTime: '10:00',
    name: '',
    subject: 'ENG1012',
  })

  const toggleDay = (day) =>
    setEventForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }))

  const addManualEvent = () => {
    if (!eventForm.name.trim() || !eventForm.days.length) return
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
    setManualEvents((prev) => [...prev, { id, ...eventForm, name: eventForm.name.trim() }])
    setEventForm({ days: [], startTime: '09:00', endTime: '10:00', name: '', subject: 'ENG1012' })
  }

  const deleteManualEvent = (id) =>
    setManualEvents((prev) => prev.filter((e) => e.id !== id))

  const handleSync = () => {
    const url = urlInput.trim()
    setIcalUrl(url)
    if (url) onIcalSync(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex justify-between items-center">
          <h2 className="font-semibold text-lg">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-8 flex-1">
          {/* ── Notion Calendar ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Notion Calendar (iCal)
            </h3>
            <p className="text-xs text-gray-400 mb-2">
              Notion Calendar → Settings → Integrations → Copy iCal link and paste it here.
            </p>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="https://calendar.notion.so/feed/..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            {icalError && <p className="text-xs text-red-500 mt-1">{icalError}</p>}
            {lastSynced && !icalError && (
              <p className="text-xs text-green-600 mt-1">Last synced: {lastSynced}</p>
            )}
            <button
              onClick={handleSync}
              className="mt-2 w-full py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Sync Now
            </button>
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
                {Object.keys(SUBJECT_COLORS).map((s) => (
                  <option key={s}>{s}</option>
                ))}
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
                    <span className="text-xs text-gray-400 shrink-0">
                      {e.startTime}–{e.endTime}
                    </span>
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
