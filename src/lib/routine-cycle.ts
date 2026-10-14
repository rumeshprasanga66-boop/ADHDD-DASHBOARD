// 2-work / 2-off day cycle.
// Anchor: 2026-10-15 is a WORK day, and the cycle [work, work, off, off] repeats from there.
// Verified against the user's pattern:
//   Oct 13 (yesterday) = off, Oct 14 (today) = off,
//   Oct 15 (tomorrow) = work, Oct 16 (next tomorrow) = work,
//   Oct 17 = off, Oct 18 = off, Oct 19 = work, Oct 20 = work ...

const ANCHOR_DATE = new Date(2026, 9, 15) // Oct 15, 2026 (month is 0-indexed)
const CYCLE_LENGTH = 4
// position 0 = work, 1 = work, 2 = off, 3 = off
const PATTERN: ('work' | 'off')[] = ['work', 'work', 'off', 'off']

function daysBetween(from: Date, to: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b.getTime() - a.getTime()) / msPerDay)
}

export function getDayTypeForDate(date: Date | string): 'work' | 'off' {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = daysBetween(ANCHOR_DATE, d)
  const pos = ((diff % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH
  return PATTERN[pos]
}

export interface CycleDay {
  date: Date
  dateStr: string
  dayType: 'work' | 'off'
  label: string
  weekday: string
  dayNum: number
  isToday: boolean
}

export function getUpcomingDays(count: number = 10, from: Date = new Date()): CycleDay[] {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const todayStr = formatDateStr(today)
  const days: CycleDay[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dayType = getDayTypeForDate(d)
    const dateStr = formatDateStr(d)
    days.push({
      date: d,
      dateStr,
      dayType,
      label: dayType === 'work' ? 'Work' : 'Off',
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
    })
  }
  return days
}

export function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
