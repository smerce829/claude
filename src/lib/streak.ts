import type { State } from './types'

const DAY = 86_400_000
const key = (d: Date) => d.toDateString()

/**
 * Consecutive days with at least one completion. Completing twice in one day
 * does not advance it; missing a day resets it to 1 on the next completion.
 */
export function advanceStreak(session: State['session'], now = new Date()): State['session'] {
  const today = key(now)
  if (session.lastCompletedDate === today) {
    return { ...session, completedToday: session.completedToday + 1 }
  }
  const yesterday = key(new Date(now.getTime() - DAY))
  const streak = session.lastCompletedDate === yesterday ? session.streak + 1 : 1
  return { ...session, completedToday: 1, lastCompletedDate: today, streak }
}

/** A streak only counts while it is still live — today or yesterday. */
export function liveStreak(session: State['session'], now = new Date()): number {
  if (!session.lastCompletedDate) return 0
  const today = key(now)
  const yesterday = key(new Date(now.getTime() - DAY))
  if (session.lastCompletedDate === today || session.lastCompletedDate === yesterday) {
    return session.streak
  }
  return 0
}
