import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { parseICalForDate, expandManualEvents } from './utils/ical'
import { getTodayStr } from './utils/date'
import NavBar from './components/NavBar'
import SettingsPanel from './components/SettingsPanel'
import TodayView from './components/views/TodayView'
import DeadlinesView from './components/views/DeadlinesView'
import GymView from './components/views/GymView'

export default function App() {
  const [view, setView]               = useState('today')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Persisted state
  const [deadlines,    setDeadlines]    = useLocalStorage('daystack_deadlines',     [])
  const [gymSessions,  setGymSessions]  = useLocalStorage('daystack_gym',           [])
  const [icalUrl,      setIcalUrl]      = useLocalStorage('daystack_ical_url',      '')
  const [manualEvents, setManualEvents] = useLocalStorage('daystack_manual_events', [])

  // iCal sync state (in-memory only)
  const [calendarEvents, setCalendarEvents] = useState([])
  const [lastSynced,     setLastSynced]     = useState(null)
  const [icalError,      setIcalError]      = useState('')

  const syncIcal = useCallback(async (url) => {
    if (!url) return
    setIcalError('')
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const events = parseICalForDate(text, getTodayStr())
      setCalendarEvents(events)
      setLastSynced(
        new Date().toLocaleTimeString('en-AU', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Australia/Melbourne',
        }),
      )
    } catch (err) {
      const msg =
        err instanceof TypeError
          ? "Can't fetch this URL directly from the browser (CORS). Try a CORS proxy or check Notion's export settings."
          : `Sync failed: ${err.message}`
      setIcalError(msg)
    }
  }, [])

  // Auto-sync on first load if a URL is already stored
  useEffect(() => {
    if (icalUrl) syncIcal(icalUrl)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Merge iCal events with manual recurring events for today
  const todayStr = getTodayStr()
  const allTodayEvents = useMemo(() => {
    const manual = expandManualEvents(manualEvents, todayStr)
    return [...calendarEvents, ...manual].sort((a, b) => a.start - b.start)
  }, [calendarEvents, manualEvents, todayStr])

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <NavBar view={view} setView={setView} onSettingsOpen={() => setSettingsOpen(true)} />

      {view === 'today' && (
        <TodayView events={allTodayEvents} deadlines={deadlines} setView={setView} />
      )}
      {view === 'deadlines' && (
        <DeadlinesView deadlines={deadlines} setDeadlines={setDeadlines} />
      )}
      {view === 'gym' && (
        <GymView sessions={gymSessions} setSessions={setGymSessions} />
      )}

      {settingsOpen && (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          icalUrl={icalUrl}
          setIcalUrl={setIcalUrl}
          manualEvents={manualEvents}
          setManualEvents={setManualEvents}
          onIcalSync={syncIcal}
          lastSynced={lastSynced}
          icalError={icalError}
        />
      )}
    </div>
  )
}
