import ICAL from 'ical.js'
import { toAEST } from './date'
import { detectSubject } from './subjects'

let _idCounter = 0
const uid = () => `ev-${Date.now()}-${_idCounter++}`

/**
 * Parse an iCal string and return all events (including recurring expansions)
 * that fall on targetDateStr (YYYY-MM-DD, interpreted in AEST).
 */
export const parseICalForDate = (icsText, targetDateStr) => {
  const jcal = ICAL.parse(icsText)
  const comp  = new ICAL.Component(jcal)
  const vevents = comp.getAllSubcomponents('vevent')

  const targetDate = new Date(targetDateStr + 'T00:00:00')
  const targetEnd  = new Date(targetDateStr + 'T23:59:59')
  const events = []

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent)

    if (event.isRecurring()) {
      const expand = new ICAL.RecurExpansion({
        component: vevent,
        dtstart: event.startDate,
      })

      let next
      let guard = 500
      while ((next = expand.next()) && guard-- > 0) {
        const occStart = next.toJSDate()
        if (occStart > targetEnd) break
        if (occStart < targetDate) continue

        const dur    = event.duration
        const occEnd = new Date(occStart.getTime() + dur.toSeconds() * 1000)

        if (toAEST(occStart).toDateString() === toAEST(targetDate).toDateString()) {
          events.push({
            id: uid(),
            name: event.summary || 'Event',
            start: occStart,
            end: occEnd,
            subject: detectSubject(event.summary),
          })
        }
      }
    } else {
      const start = event.startDate.toJSDate()
      const end   = event.endDate.toJSDate()

      if (toAEST(start).toDateString() === toAEST(targetDate).toDateString()) {
        events.push({
          id: uid(),
          name: event.summary || 'Event',
          start,
          end,
          subject: detectSubject(event.summary),
        })
      }
    }
  }

  return events.sort((a, b) => a.start - b.start)
}

/**
 * Expand stored manual recurring events into concrete events for targetDateStr.
 * Manual event shape: { id, name, subject, days: ['Mon','Tue',...], startTime: 'HH:MM', endTime: 'HH:MM' }
 */
export const expandManualEvents = (manualEvents, targetDateStr) => {
  const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }
  const targetDate = new Date(targetDateStr + 'T00:00:00')
  const dow = targetDate.getDay()

  return manualEvents
    .filter(e => Array.isArray(e.days) && e.days.some(d => dayMap[d] === dow))
    .map(e => ({
      id: e.id,
      name: e.name,
      subject: e.subject || detectSubject(e.name),
      start: new Date(`${targetDateStr}T${e.startTime}:00`),
      end:   new Date(`${targetDateStr}T${e.endTime}:00`),
    }))
}
