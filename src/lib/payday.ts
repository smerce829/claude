import type { State } from './types'

/** The next time the given day-of-month comes round, from `from`. */
export function nextCycleDate(cycleDay: number, from = new Date()): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), 1)
  // Clamp: a cycle on the 31st lands on the last day of a short month.
  const inThis = Math.min(cycleDay, daysIn(d.getFullYear(), d.getMonth()))
  const candidate = new Date(d.getFullYear(), d.getMonth(), inThis)
  if (candidate >= stripTime(from)) return candidate
  const n = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  return new Date(n.getFullYear(), n.getMonth(), Math.min(cycleDay, daysIn(n.getFullYear(), n.getMonth())))
}

function daysIn(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function stripTime(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }

/**
 * Bills reset once the cycle date has come round again since the last run.
 * Ticking them off is the whole interaction; nothing is carried or scored.
 */
export function shouldReset(payday: State['payday'], now = new Date()): boolean {
  if (payday.cycle === null || payday.lastRun === null) return false
  const last = new Date(payday.lastRun)
  const due = nextCycleDate(payday.cycle, last)
  return stripTime(now) >= stripTime(due) && stripTime(last) < stripTime(due)
}

export function formatCycle(cycleDay: number, now = new Date()): string {
  const d = nextCycleDate(cycleDay, now)
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })
}
