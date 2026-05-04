import { useState, useEffect, useMemo } from 'react'
import {
  todayAEST,
  getHeaderDate,
  getGreeting,
  minutesSinceMidnight,
  minutesToTimeStr,
  getDaysRemaining,
} from '../../utils/date'
import { findFreeWindows, freeWindowLabel, freeWindowClasses } from '../../utils/freeTime'
import { SUBJECT_COLORS } from '../../constants'
import SubjectTag from '../SubjectTag'

const DAY_START = 7 * 60

function daysRemainingColor(days) {
  if (days <= 2) return 'text-red-500'
  if (days <= 5) return 'text-orange-400'
  return 'text-gray-400'
}

function daysRemainingLabel(days) {
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today!'
  if (days === 1) return 'Tomorrow'
  return `in ${days} days`
}

export default function TodayView({ events, deadlines, setView }) {
  const [now, setNow] = useState(todayAEST())

  useEffect(() => {
    const t = setInterval(() => setNow(todayAEST()), 60_000)
    return () => clearInterval(t)
  }, [])

  const freeWindows = useMemo(() => findFreeWindows(events), [events])
  const totalFreeMin = freeWindows.reduce((s, w) => s + w.durationMinutes, 0)
  const totalFreeLabel = `${Math.floor(totalFreeMin / 60)}h ${totalFreeMin % 60 > 0 ? `${totalFreeMin % 60}m` : ''}`.trim()

  const upcomingDeadlines = useMemo(
    () =>
      [...deadlines]
        .filter((d) => !d.completed)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 3),
    [deadlines],
  )

  const nowMin = now.getHours() * 60 + now.getMinutes()

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* ── Header ── */}
      <header>
        <h1 className="text-3xl font-semibold text-gray-900">{getHeaderDate()}</h1>
        <p className="mt-1 text-sm text-gray-500">{getGreeting()}</p>
      </header>

      {/* ── Timeline ── */}
      <div className="card p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Today's Schedule
        </h2>

        {events.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            🏄 No classes scheduled today. Enjoy the free time.
          </p>
        ) : (
          <div className="space-y-0">
            {events.map((event) => {
              const startMin  = minutesSinceMidnight(event.start)
              const endMin    = minutesSinceMidnight(event.end)
              const isPast    = endMin < nowMin
              const colors    = SUBJECT_COLORS[event.subject] ?? SUBJECT_COLORS['Other']
              // Use the calendar's assigned colour for the bar; fall back to subject colour
              const barColor  = event.calendarColor ?? colors.bg

              return (
                <div
                  key={event.id}
                  className="flex gap-3 py-2 border-b border-gray-50 last:border-0"
                  style={{ opacity: isPast ? 0.4 : 1 }}
                >
                  <div className="text-right shrink-0 w-24">
                    <span className="text-xs text-gray-500 block">{minutesToTimeStr(startMin)}</span>
                    <span className="text-xs text-gray-300">→ {minutesToTimeStr(endMin)}</span>
                  </div>
                  <div
                    className="w-1 rounded-full shrink-0 self-stretch"
                    style={{ backgroundColor: barColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{event.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <SubjectTag subject={event.subject} small />
                      {event.calendarName && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: barColor + '22', color: barColor }}
                        >
                          {event.calendarName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Current time red line */}
            {nowMin >= DAY_START && nowMin <= 22 * 60 && (
              <div className="flex items-center gap-2 py-1">
                <div className="w-24 shrink-0 text-right">
                  <span className="text-xs font-semibold text-red-500">{minutesToTimeStr(nowMin)}</span>
                </div>
                <div className="w-1 shrink-0" />
                <div className="flex-1 h-px bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Free Windows ── */}
      <div className="card p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Free Windows
        </h2>
        {freeWindows.length === 0 ? (
          <p className="text-sm text-gray-400">No gaps of 45+ minutes found today.</p>
        ) : (
          <div className="space-y-2">
            {freeWindows.map((w, i) => (
              <div
                key={i}
                className={`flex justify-between items-center px-3 py-2 rounded-lg ${freeWindowClasses(w.durationMinutes)}`}
              >
                <span className="text-sm font-medium">{freeWindowLabel(w)}</span>
                <span className="text-xs font-medium">{w.durationMinutes} min free</span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Total free time today</span>
              <span className="font-semibold text-gray-900">{totalFreeLabel}</span>
            </div>
            {totalFreeMin < 60 && (
              <p className="text-xs text-orange-500">⚠ Tight day — protect your breaks.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Upcoming Deadlines widget ── */}
      {upcomingDeadlines.length > 0 ? (
        <div className="card p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Upcoming Deadlines
            </h2>
            <button
              onClick={() => setView('deadlines')}
              className="text-xs text-blue-500 hover:text-blue-700 font-medium"
            >
              See all →
            </button>
          </div>
          <div className="space-y-2.5">
            {upcomingDeadlines.map((d) => {
              const days = getDaysRemaining(d.dueDate)
              return (
                <div key={d.id} className="flex items-center gap-3">
                  <SubjectTag subject={d.subject} small />
                  <span className="text-sm flex-1 truncate">{d.name}</span>
                  <span className={`text-xs font-medium shrink-0 ${daysRemainingColor(days)}`}>
                    {daysRemainingLabel(days)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="card p-5 text-center">
          <p className="text-sm text-gray-400">🎉 No upcoming deadlines — you're all caught up.</p>
        </div>
      )}
    </div>
  )
}
