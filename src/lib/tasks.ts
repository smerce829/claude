import raw from '../data/tasks.json'
import type { Duration, Energy, State, Task } from './types'

const TASKS = raw as Task[]

/**
 * Filters on energy, duration and profile, then picks at random excluding the
 * last three served — so the same task cannot come back immediately and make
 * the app feel broken.
 */
export function pickTask(
  energy: Energy,
  duration: Duration,
  profile: State['profile'],
  lastTaskIds: string[],
  extraPool: Task[] = [],
): Task | null {
  const eligible = [...TASKS, ...extraPool].filter((t) => {
    if (t.energy !== energy || t.duration !== duration) return false
    if (!t.requires) return true
    return t.requires.every((r) =>
      r === 'kids' ? profile.kids : r === 'pets' ? profile.pets : profile.worksFromHome,
    )
  })
  if (eligible.length === 0) return null

  const recent = new Set(lastTaskIds.slice(-3))
  // Fall back to the full set rather than returning nothing when the filtered
  // pool is small enough that the last three cover it.
  const pool = eligible.filter((t) => !recent.has(t.id))
  const from = pool.length > 0 ? pool : eligible
  return from[Math.floor(Math.random() * from.length)]
}

/** Items triaged to "today" join the pool for the rest of that day. */
export function braindumpPool(state: State, energy: Energy, duration: Duration): Task[] {
  return state.braindump.today.map((text, i) => ({
    id: `bd-${i}`,
    text,
    energy,
    duration,
    room: 'any',
  }))
}

/** Rooms that have enough tasks to sequence a reset. */
export const ROOMS = ['kitchen', 'bathroom', 'bedroom', 'living room', 'entryway', 'laundry']

/**
 * A sequenced set for one room: shortest tasks first, so the set front-loads
 * finished work. The timer runs across the whole set, not per task, and the
 * set is never padded to fill the time — running out is the end.
 */
export function roomSet(room: string, profile: State['profile']): Task[] {
  return TASKS
    .filter((t) => t.room === room)
    .filter((t) => !t.requires || t.requires.every((r) =>
      r === 'kids' ? profile.kids : r === 'pets' ? profile.pets : profile.worksFromHome))
    .sort((a, b) => a.duration - b.duration)
}

/**
 * Low-Energy mode shows three ready micro-actions instead of a chooser.
 * Deterministic per profile so the set does not shuffle under the user.
 */
export function microTasks(profile: State['profile']): Task[] {
  return TASKS
    .filter((t) => t.energy === 'low' && t.duration === 5)
    .filter((t) => !t.requires || t.requires.every((r) =>
      r === 'kids' ? profile.kids : r === 'pets' ? profile.pets : profile.worksFromHome))
    .slice(0, 3)
}
