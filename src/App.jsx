import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { parseICalForDate, expandManualEvents } from './utils/ical'
import { getTodayStr } from './utils/date'
import NavBar from './components/NavBar'
import SettingsPanel from './components/SettingsPanel'
import TodayView from './components/views/TodayView'
import DeadlinesView from './components/views/DeadlinesView'
import GymView from './components/views/GymView'

// icalFeeds shape stored in localStorage:
// [{ id, name, url, color, enabled }]
//
// feedStatuses shape (in-memory only, not persisted):
// { [id]: { state: 'idle'|'syncing'|'ok'|'error', message: string, lastSynced: string } }

export default function App() {
  const [view, setView]                 = useState('today')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Persisted state
  const [deadlines,    setDeadlines]    = useLocalStorage('daystack_deadlines',     [])
  const [gymSessions,  setGymSessions]  = useLocalStorage('daystack_gym',           [])
  const [icalFeeds,    setIcalFeeds]    = useLocalStorage('daystack_ical_feeds',    [])
  const [manualEvents, setManualEvents] = useLocalStorage('daystack_manual_events', [])

  // Per-feed sync status (in-memory only)
  const [feedStatuses, setFeedStatuses] = useState({})

  // Events fetched from all feeds, keyed by feed id
  const [feedEvents, setFeedEvents] = useState({})

  const setFeedStatus = useCallback((id, patch) =>
    setFeedStatuses((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } })),
  [])

  const syncFeed = useCallback(async (feed) => {
    if (!feed.url) return
    setFeedStatus(feed.id, { state: 'syncing', message: '' })
    try {
      const res = await fetch(feed.url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const events = parseICalForDate(text, getTodayStr()).map((e) => ({
        ...e,
        calendarId:    feed.id,
        calendarColor: feed.color,
        calendarName:  feed.name,
      }))
      setFeedEvents((prev) => ({ ...prev, [feed.id]: events }))
      setFeedStatus(feed.id, {
        state: 'ok',
        message: '',
        lastSynced: new Date().toLocaleTimeString('en-AU', {
          hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Australia/Melbourne',
        }),
      })
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Can't fetch directly from the browser (CORS). Try prefixing with https://corsproxy.io/? or use a Google Calendar public URL."
          : `Sync failed: ${err.message}`
      setFeedStatus(feed.id, { state: 'error', message })
    }
  }, [setFeedStatus])

  const syncAllFeeds = useCallback((feeds) => {
    const enabled = (feeds ?? icalFeeds).filter((f) => f.enabled !== false)
    enabled.forEach(syncFeed)
  }, [icalFeeds, syncFeed])

  // Auto-sync all feeds on first load
  useEffect(() => {
    if (icalFeeds.length) syncAllFeeds(icalFeeds)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Merge all feed events + manual events for today
  const todayStr = getTodayStr()
  const allTodayEvents = useMemo(() => {
    const fromFeeds = Object.values(feedEvents).flat()
    const manual    = expandManualEvents(manualEvents, todayStr)
    return [...fromFeeds, ...manual].sort((a, b) => a.start - b.start)
  }, [feedEvents, manualEvents, todayStr])

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
          icalFeeds={icalFeeds}
          setIcalFeeds={setIcalFeeds}
          feedStatuses={feedStatuses}
          onSyncFeed={syncFeed}
          onSyncAll={() => syncAllFeeds()}
          manualEvents={manualEvents}
          setManualEvents={setManualEvents}
        />
      )}
    </div>
  )
}
