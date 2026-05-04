import { SUBJECT_COLORS } from '../constants'

export default function SubjectTag({ subject, small = false }) {
  const colors = SUBJECT_COLORS[subject] ?? SUBJECT_COLORS['Other']
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium shrink-0 ${
        small ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
      style={{
        backgroundColor: colors.bg + '33',
        color: colors.text,
        border: `1px solid ${colors.bg}88`,
      }}
    >
      {colors.label}
    </span>
  )
}
