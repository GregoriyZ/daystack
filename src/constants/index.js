export const SUBJECT_COLORS = {
  ENG1012: { bg: '#4ADE80', text: '#166534', label: 'ENG1012' },
  ENG1013: { bg: '#FB923C', text: '#9a3412', label: 'ENG1013' },
  ENG1090: { bg: '#60A5FA', text: '#1e40af', label: 'ENG1090' },
  ACC1100: { bg: '#FACC15', text: '#78350f', label: 'ACC1100' },
  Gym:     { bg: '#F472B6', text: '#9d174d', label: 'Gym'     },
  Personal:{ bg: '#A78BFA', text: '#5b21b6', label: 'Personal'},
  Other:   { bg: '#E5E7EB', text: '#374151', label: 'Other'   },
}

export const DEFAULT_SUBJECTS = ['ENG1012', 'ENG1013', 'ENG1090', 'ACC1100', 'Other']

export const ASSIGNMENT_TYPES = ['Assignment', 'Quiz', 'Exam', 'Practical', 'Other']

export const FOCUS_AREAS = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio', 'Full Body',
]

export const TIME_OF_DAY = ['Morning', 'Afternoon', 'Evening']

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Free time algorithm bounds (minutes from midnight)
export const DAY_START_MIN = 7 * 60   // 07:00
export const DAY_END_MIN   = 22 * 60  // 22:00
export const MIN_FREE_GAP  = 45

// Preset swatches for calendar feeds
export const CALENDAR_PALETTE = [
  '#2563EB', // blue
  '#16A34A', // green
  '#DC2626', // red
  '#D97706', // amber
  '#7C3AED', // violet
  '#DB2777', // pink
  '#0891B2', // cyan
  '#65A30D', // lime
  '#EA580C', // orange
  '#6B7280', // grey
]
