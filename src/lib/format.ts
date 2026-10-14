export function fmtLei(n: number) {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
    maximumFractionDigits: 0,
  }).format(n || 0)
}

export function fmtLeiDetailed(n: number) {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
    maximumFractionDigits: 2,
  }).format(n || 0)
}

export function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(month: string) {
  const [y, m] = month.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function fmtDate(d: string | Date) {
  const date = new Date(d)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function fmtDateTime(d: string | Date) {
  const date = new Date(d)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtTime(d: string | Date) {
  const date = new Date(d)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeUntil(d: string | Date) {
  const target = new Date(d).getTime()
  const now = Date.now()
  const diff = target - now
  if (diff <= 0) return 'Passed'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `in ${days}d ${hours}h`
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `in ${hours}h ${mins}m`
}
