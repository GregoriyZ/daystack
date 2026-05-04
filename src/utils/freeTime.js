import { minutesSinceMidnight, minutesToTimeStr } from './date'
import { DAY_START_MIN, DAY_END_MIN, MIN_FREE_GAP } from '../constants'

/**
 * Given an array of today's events (each with .start and .end Date objects),
 * return an array of free windows >= MIN_FREE_GAP minutes within the day bounds.
 *
 * Algorithm:
 *   1. Convert events to {start, end} minute-offsets.
 *   2. Sort and merge overlapping blocks.
 *   3. Walk DAY_START → DAY_END, collect gaps >= MIN_FREE_GAP.
 */
export const findFreeWindows = (events) => {
  const blocks = events
    .map(e => ({
      start: minutesSinceMidnight(e.start),
      end:   minutesSinceMidnight(e.end),
    }))
    .sort((a, b) => a.start - b.start)

  // Merge overlapping / adjacent blocks
  const merged = []
  for (const b of blocks) {
    if (!merged.length) { merged.push({ ...b }); continue }
    const last = merged[merged.length - 1]
    if (b.start <= last.end) {
      last.end = Math.max(last.end, b.end)
    } else {
      merged.push({ ...b })
    }
  }

  const windows = []
  let cursor = DAY_START_MIN

  for (const block of merged) {
    const gapStart = cursor
    const gapEnd   = Math.min(block.start, DAY_END_MIN)
    if (gapEnd > gapStart) {
      const duration = gapEnd - gapStart
      if (duration >= MIN_FREE_GAP) {
        windows.push({ startMin: gapStart, endMin: gapEnd, durationMinutes: duration })
      }
    }
    cursor = Math.max(cursor, block.end)
  }

  // Trailing gap after last block
  if (cursor < DAY_END_MIN && DAY_END_MIN - cursor >= MIN_FREE_GAP) {
    windows.push({
      startMin: cursor,
      endMin: DAY_END_MIN,
      durationMinutes: DAY_END_MIN - cursor,
    })
  }

  return windows
}

export const freeWindowLabel = (w) =>
  `${minutesToTimeStr(w.startMin)} – ${minutesToTimeStr(w.endMin)}`

/** Tailwind classes for a free-window chip based on duration */
export const freeWindowClasses = (durationMinutes) => {
  if (durationMinutes >= 90) return 'bg-green-50 text-green-700'
  if (durationMinutes >= 60) return 'bg-blue-50 text-blue-600'
  return 'bg-gray-100 text-gray-500'
}
