import type { Bill, Frequency, State } from './types'

const key = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate()

/** The next time the given day-of-month comes round, from `from`. */
export function nextCycleDate(cycleDay: number, from = new Date()): Date {
  const y = from.getFullYear(), m = from.getMonth()
  // Clamp: a cycle on the 31st lands on the last day of a short month.
  const candidate = new Date(y, m, Math.min(cycleDay, daysIn(y, m)))
  if (key(candidate) >= key(from)) return candidate
  return new Date(y, m + 1, Math.min(cycleDay, daysIn(y, m + 1)))
}

export function formatCycle(cycleDay: number, now = new Date()): string {
  return nextCycleDate(cycleDay, now)
    .toLocaleDateString('en-US', { day: 'numeric', month: 'long' })
}

/** How many cycle dates have passed since `lastRun`. */
export function cyclesElapsed(cycleDay: number, lastRun: number, now = new Date()): number {
  const last = new Date(lastRun)
  let n = 0
  let due = nextCycleDate(cycleDay, last)
  // A run on the cycle date itself has already consumed that cycle.
  if (key(due) === key(last)) due = nextCycleDate(cycleDay, new Date(key(due) + 86_400_000))
  while (key(due) <= key(now) && n < 240) {
    n += 1
    due = nextCycleDate(cycleDay, new Date(key(due) + 86_400_000))
  }
  return n
}

/**
 * Whether a bill is actually due in the given cycle.
 *
 * A bill that is not due is simply absent from the list. That is not the same
 * as "unchecked", and must never be flagged as carryover — the v5 carryover
 * fix would otherwise mark an annual bill overdue for eleven months straight.
 */
export function isDue(bill: Bill, cycleIndex: number): boolean {
  const since = cycleIndex - bill.anchorCycle
  if (since < 0) return false
  switch (bill.frequency) {
    // These all recur at least once inside a monthly pay cycle.
    case 'monthly':
    case 'twiceMonthly':
    case 'biweekly':
    case 'weekly':
      return true
    case 'everyNMonths':
      return since % Math.max(1, bill.months ?? 1) === 0
    case 'once':
      // Shown until it is dealt with, then removed entirely.
      return since === 0 || !bill.checked
  }
}

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  monthly: 'monthly',
  twiceMonthly: 'twice a month',
  biweekly: 'every 2 weeks',
  weekly: 'weekly',
  everyNMonths: 'every few months',
  once: 'one-time',
}

/** The tiles offered when adding a bill. "Every N months" is expanded into
 *  concrete values so selecting one still fires immediately, with no second
 *  input and no confirm step. */
export const FREQUENCY_TILES: Array<{ label: string; frequency: Frequency; months?: number }> = [
  { label: 'monthly',       frequency: 'monthly' },
  { label: 'every 2 weeks', frequency: 'biweekly' },
  { label: 'every 3 months', frequency: 'everyNMonths', months: 3 },
  { label: 'every 6 months', frequency: 'everyNMonths', months: 6 },
  { label: 'yearly',        frequency: 'everyNMonths', months: 12 },
  { label: 'one-time',      frequency: 'once' },
]

export interface Advanced { payday: State['payday']; changed: boolean }

/**
 * Rolls the pay cycle forward. Any bill that was actually due and left
 * unchecked moves into carryover and stays pinned there until it is checked
 * off — silently forgetting it would recreate the missed-payment problem this
 * module exists to prevent.
 */
export function advanceCycles(payday: State['payday'], now = new Date()): Advanced {
  if (payday.cycle === null || payday.lastRun === null) return { payday, changed: false }
  const steps = cyclesElapsed(payday.cycle, payday.lastRun, now)
  if (steps < 1) return { payday, changed: false }

  let bills = payday.bills
  let carryover = [...payday.carryover]
  let index = payday.cycleIndex

  for (let i = 0; i < steps; i++) {
    for (const b of bills) {
      if (isDue(b, index) && !b.checked && !carryover.includes(b.name)) carryover.push(b.name)
    }
    index += 1
    // A one-time bill that was dealt with does not carry into the next cycle.
    bills = bills
      .filter((b) => !(b.frequency === 'once' && b.checked))
      .map((b) => ({ ...b, checked: false }))
  }

  // A bill deleted in the meantime should not haunt the carryover list.
  carryover = carryover.filter((n) => bills.some((b) => b.name === n))

  return {
    payday: { ...payday, bills, carryover, cycleIndex: index, lastRun: now.getTime() },
    changed: true,
  }
}

/** Carried bills first, then the ones due this cycle. */
export function visibleBills(payday: State['payday']): { carried: Bill[]; due: Bill[] } {
  const carried = payday.bills.filter((b) => payday.carryover.includes(b.name))
  const due = payday.bills.filter(
    (b) => !payday.carryover.includes(b.name) && isDue(b, payday.cycleIndex),
  )
  return { carried, due }
}
