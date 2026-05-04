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

    // Proxies tried in order when a direct fetch is CORS-blocked.
    // corsproxy.io format: https://corsproxy.io/?{url}  (no "url=" key)
    // allorigins format:   https://api.allorigins.win/raw?url={encoded}
    const PROXIES = [
      (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    ]

    try {
      text = await fetchIcal(url)
    } catch (directErr) {
      if (!(directErr instanceof TypeError)) {
        // Non-CORS error (e.g. HTTP 4xx on the direct URL) — no point proxying
        setFeedStatus(feed.id, { state: 'error', message: directErr.message })
        return
      }

      // CORS blocked — try each proxy in turn
      let lastErr
      for (const buildProxy of PROXIES) {
        try {
          text = await fetchIcal(buildProxy(url))
          lastErr = null
          break
        } catch (proxyErr) {
          lastErr = proxyErr
        }
      }

      if (lastErr) {
        setFeedStatus(feed.id, {
          state: 'error',
          message:
            lastErr.message.includes('403')
              ? 'Google returned 403 — make sure you copied the Secret address in iCal format (Calendar settings → Integrate calendar), not the public sharing link.'
              : `All proxy attempts failed: ${lastErr.message}`,
        })
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
