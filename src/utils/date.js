// All date helpers operate in AEST (Australia/Melbourne, UTC+10/+11).

export const toAEST = (date) =>
  new Date(new Date(date).toLocaleString('en-US', { timeZone: 'Australia/Melbourne' }))

export const todayAEST = () => toAEST(new Date())

export const getTodayStr = () => {
  const d = todayAEST()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const getHeaderDate = () =>
  todayAEST().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Australia/Melbourne',
  })

export const formatDateShort = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
  })

export const getDaysRemaining = (dueDateStr) => {
  const today = todayAEST()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDateStr + 'T00:00:00')
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24))
}

export const getGreeting = () => {
  const h = todayAEST().getHours()
  if (h < 9)  return "Good morning — here's your day."
  if (h < 12) return 'Morning block. Stay focused.'
  if (h < 17) return 'Afternoon. Check your next class.'
  return 'Evening. Wrap up and recover.'
}

export const minutesSinceMidnight = (date) => {
  const d = toAEST(date)
  return d.getHours() * 60 + d.getMinutes()
}

export const minutesToTimeStr = (minutes) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

// Return the Monday-anchored start of the current week as a Date (midnight AEST).
export const getWeekStart = () => {
  const d = todayAEST()
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay() // 0 = Sun
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  return d
}
