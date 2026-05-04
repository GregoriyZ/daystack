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

    // Normalise webcal:// → https://
    const normalise = (u) => u.replace(/^webcal:\/\//i, 'https://')

    const fetchIcal = async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.text()
    }

    const applyEvents = (text) =>
      parseICalForDate(text, getTodayStr()).map((e) => ({
        ...e,
        calendarId:    feed.id,
        calendarColor: feed.color,
        calendarName:  feed.name,
      }))

    const url = normalise(feed.url)
    let text

    try {
      text = await fetchIcal(url)
    } catch (directErr) {
      // CORS or network error — silently retry through a proxy
      if (directErr instanceof TypeError) {
        try {
          const proxied = `https://corsproxy.io/?url=${encodeURIComponent(url)}`
          text = await fetchIcal(proxied)
        } catch (proxyErr) {
          setFeedStatus(feed.id, {
            state: 'error',
            message: `Direct fetch blocked by CORS; proxy also failed: ${proxyErr.message}`,
          })
          return
        }
      } else {
        setFeedStatus(feed.id, { state: 'error', message: directErr.message })
        return
      }
    }

    setFeedEvents((prev) => ({ ...prev, [feed.id]: applyEvents(text) }))
    setFeedStatus(feed.id, {
      state: 'ok',
      message: '',
      lastSynced: new Date().toLocaleTimeString('en-AU', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Australia/Melbourne',
      }),
    })
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
