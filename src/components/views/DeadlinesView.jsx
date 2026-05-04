import { useState, useMemo } from 'react'
import { todayAEST, getDaysRemaining, formatDateShort, getWeekStart } from '../../utils/date'
import { DEFAULT_SUBJECTS, ASSIGNMENT_TYPES } from '../../constants'
import SubjectTag from '../SubjectTag'

const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)

function daysRemainingColor(days) {
  if (days <= 2) return 'text-red-500'
  if (days <= 5) return 'text-orange-400'
  return 'text-gray-400'
}

function daysRemainingLabel(days) {
  if (days < 0)  return `${Math.abs(days)}d ago`
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `${days}d`
}

// ── Collapsible group ─────────────────────────────────────────────────────────
function DeadlineGroup({ title, items, defaultOpen = true, renderItem }) {
  const [open, setOpen] = useState(defaultOpen)
  if (!items.length) return null
  return (
    <div className="card p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center mb-1"
      >
        <span className="text-sm font-semibold text-gray-500">{title}</span>
        <span className="text-xs text-gray-400">
          {open ? '▲' : '▼'} {items.length}
        </span>
      </button>
      {open && <div className="mt-2">{items.map(renderItem)}</div>}
    </div>
  )
}

// ── Single deadline row ───────────────────────────────────────────────────────
function DeadlineItem({ d, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState({ name: d.name, dueDate: d.dueDate })
  const days = getDaysRemaining(d.dueDate)

  const save = () => {
    onEdit(d.id, draft)
    setEditing(false)
  }

  return (
    <div
      className={`flex items-center gap-2 py-2.5 border-b border-gray-50 last:border-0 ${
        d.completed ? 'opacity-50' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={d.completed}
        onChange={() => onToggle(d.id)}
        className="w-4 h-4 rounded shrink-0 cursor-pointer"
      />

      <SubjectTag subject={d.subject} small />

      {editing ? (
        <div className="flex flex-1 gap-2 flex-wrap">
          <input
            className="flex-1 min-w-0 text-sm border border-gray-200 rounded px-2 py-1"
            value={draft.name}
            onChange={(e) => setDraft((x) => ({ ...x, name: e.target.value }))}
          />
          <input
            type="date"
            className="text-sm border border-gray-200 rounded px-2 py-1"
            value={draft.dueDate}
            onChange={(e) => setDraft((x) => ({ ...x, dueDate: e.target.value }))}
          />
          <button onClick={save} className="text-xs text-blue-500 font-medium">Save</button>
          <button onClick={() => setEditing(false)} className="text-xs text-gray-400">Cancel</button>
        </div>
      ) : (
        <>
          <span
            className={`text-sm flex-1 truncate ${d.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}
          >
            {d.name}
          </span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
            {d.type}
          </span>
          <span className="text-xs text-gray-400 shrink-0">{formatDateShort(d.dueDate)}</span>
          <span className={`text-xs font-medium shrink-0 ${daysRemainingColor(days)}`}>
            {daysRemainingLabel(days)}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="text-gray-300 hover:text-gray-500 shrink-0 text-sm"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(d.id)}
            className="text-gray-300 hover:text-red-400 shrink-0 text-sm"
            title="Delete"
          >
            🗑
          </button>
        </>
      )}
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function DeadlinesView({ deadlines, setDeadlines }) {
  const [form, setForm] = useState({
    subject: 'ENG1012',
    name: '',
    dueDate: '',
    type: 'Assignment',
  })

  const addDeadline = () => {
    if (!form.name.trim() || !form.dueDate) return
    const today = todayAEST()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    setDeadlines((prev) => [
      ...prev,
      {
        id: uid(),
        subject: form.subject,
        name: form.name.trim(),
        type: form.type,
        dueDate: form.dueDate,
        completed: false,
        createdAt: todayStr,
      },
    ])
    setForm((f) => ({ ...f, name: '', dueDate: '' }))
  }

  const toggleComplete = (id) =>
    setDeadlines((prev) =>
      prev.map((d) => (d.id === id ? { ...d, completed: !d.completed } : d)),
    )

  const deleteDeadline = (id) => {
    if (window.confirm('Delete this deadline?'))
      setDeadlines((prev) => prev.filter((d) => d.id !== id))
  }

  const editDeadline = (id, patch) =>
    setDeadlines((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))

  // Group into This Week / Next Week / Later / Completed
  const { thisWeek, nextWeek, later, completed } = useMemo(() => {
    const weekStart = getWeekStart()
    const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23, 59, 59)
    const nextEnd   = new Date(weekStart); nextEnd.setDate(weekStart.getDate() + 13); nextEnd.setHours(23, 59, 59)

    const incomplete = [...deadlines]
      .filter((d) => !d.completed)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

    return {
      thisWeek:  incomplete.filter((d) => new Date(d.dueDate + 'T23:59:59') <= weekEnd),
      nextWeek:  incomplete.filter((d) => {
        const dd = new Date(d.dueDate + 'T23:59:59')
        return dd > weekEnd && dd <= nextEnd
      }),
      later:     incomplete.filter((d) => new Date(d.dueDate + 'T23:59:59') > nextEnd),
      completed: [...deadlines].filter((d) => d.completed),
    }
  }, [deadlines])

  const renderItem = (d) => (
    <DeadlineItem
      key={d.id}
      d={d}
      onToggle={toggleComplete}
      onDelete={deleteDeadline}
      onEdit={editDeadline}
    />
  )

  const allIncompleteEmpty = !thisWeek.length && !nextWeek.length && !later.length

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-semibold text-gray-900">Deadlines</h1>

      {/* ── Add form ── */}
      <div className="card p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Add Deadline
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          >
            {DEFAULT_SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>

          <input
            className="col-span-2 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Assignment name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && addDeadline()}
          />

          <input
            type="date"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
          />
        </div>

        <div className="flex gap-2">
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          >
            {ASSIGNMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>

          <button
            onClick={addDeadline}
            className="flex-1 text-sm font-semibold py-2 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* ── Empty / All-done state ── */}
      {allIncompleteEmpty && completed.length > 0 && (
        <div className="card p-8 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="font-semibold text-gray-700">All caught up!</p>
          <p className="text-sm text-gray-400">Every deadline is marked complete.</p>
        </div>
      )}
      {allIncompleteEmpty && !completed.length && (
        <div className="card p-8 text-center">
          <p className="text-sm text-gray-400">No deadlines yet — add one above.</p>
        </div>
      )}

      {/* ── Groups ── */}
      <DeadlineGroup title="This Week"  items={thisWeek}  defaultOpen renderItem={renderItem} />
      <DeadlineGroup title="Next Week"  items={nextWeek}  defaultOpen={!thisWeek.length} renderItem={renderItem} />
      <DeadlineGroup title="Later"      items={later}     defaultOpen={!thisWeek.length && !nextWeek.length} renderItem={renderItem} />
      <DeadlineGroup title="Completed"  items={completed} defaultOpen={false} renderItem={renderItem} />
    </div>
  )
}
