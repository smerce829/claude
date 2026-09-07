import raw from '../data/tasks.json'
import type { Duration, Energy, State, Task } from './types'

const TASKS = raw as Task[]

function eligible(t: Task, profile: State['profile']): boolean {
  if (!t.requires) return true
  return t.requires.every((r) =>
    r === 'kids' ? profile.kids : r === 'pets' ? profile.pets : profile.worksFromHome)
}

/**
 * Filters on energy, duration and profile, then picks at random excluding the
 * last three served. Tolerates a small pool: when the last three cover
 * everything eligible, it repeats rather than returning nothing.
 */
export function pickTask(
  energy: Energy,
  duration: Duration,
  profile: State['profile'],
  lastTaskIds: string[],
): Task | null {
  const pool = TASKS.filter((t) => t.energy === energy && t.duration === duration && eligible(t, profile))
  if (pool.length === 0) return null
  const recent = new Set(lastTaskIds.slice(-3))
  const fresh = pool.filter((t) => !recent.has(t.id))
  const from = fresh.length > 0 ? fresh : pool
  return from[Math.floor(Math.random() * from.length)]
}

/**
 * Brain-dump handoff. Items sorted to "today" carry no energy, duration or
 * room tag, so they cannot be filtered like the library. Instead they take
 * priority: the oldest untagged item is served before the library is queried
 * at all, whatever tiles were selected. "Not this one" moves to the next
 * untagged item before falling through to the filtered library.
 *
 * The user never sees or picks between the two pools — one quietly wins.
 */
export function nextUntagged(
  today: string[],
  energy: Energy,
  duration: Duration,
  skip: string[],
): Task | null {
  const remaining = today.filter((t) => !skip.includes(t))
  if (remaining.length === 0) return null
  const text = remaining[0]
  return { id: `bd:${text}`, text, energy, duration, room: 'any' }
}

export const isBrainDumpTask = (t: Task) => t.id.startsWith('bd:')
export const brainDumpText = (t: Task) => t.id.slice(3)

export const ROOMS = ['kitchen', 'bathroom', 'bedroom', 'living room', 'entryway', 'laundry']

/**
 * Sequenced sets. Kitchen and bathroom are the spec 7.2 drafts verbatim; the
 * remaining four follow the same shape — each longer duration extends the
 * shorter one rather than replacing it, shortest and most visible first, and
 * every step is one action on one object in under nine words.
 */
const SEQUENCES: Record<string, Record<number, string[]>> = {
  kitchen: {
    5: ['Clear the sink', 'Wipe the counters', 'Take out the trash'],
    10: ['Load the dishwasher', 'Wipe the stovetop', 'Sweep the floor'],
    20: [
      'Clean the microwave', 'Wipe the cabinet fronts', 'Organize one drawer',
      'Take out the recycling', 'Wipe the fridge front', 'Restock the paper towels',
    ],
  },
  bathroom: {
    5: ['Wipe the sink', 'Wipe the toilet seat', 'Straighten the towels'],
    10: ['Clean the mirror', 'Wipe the shower walls', 'Empty the trash'],
    20: [
      'Scrub the toilet', 'Mop the floor', 'Restock the toilet paper',
      'Wipe the light switch', 'Organize the drawer',
    ],
  },
  bedroom: {
    5: ['Make the bed', 'Put the clothes in the hamper', 'Clear the nightstand'],
    10: ['Put away the clothes on the chair', 'Clear the floor', 'Straighten the dresser top'],
    20: [
      'Change the sheets', 'Vacuum the floor', 'Sort one dresser drawer',
      'Clear under the bed', 'Wipe the mirror', 'Empty the trash',
    ],
  },
  'living room': {
    5: ['Clear the coffee table', 'Straighten the cushions', 'Put the remotes back'],
    10: ['Put away anything out of place', 'Fold the throw blankets', 'Clear the side tables'],
    20: [
      'Vacuum the floor', 'Wipe the coffee table', 'Dust the shelves',
      'Sort the mail pile', 'Wipe the TV screen', 'Straighten the rug',
    ],
  },
  entryway: {
    5: ['Line up the shoes', 'Hang up the coats', 'Clear the console table'],
    10: ['Sort the mail into two piles', 'Shake out the doormat', 'Empty the key bowl'],
    20: [
      'Sweep the floor', 'Wipe the door handles', 'Sort the shoe rack',
      'Wipe the console table', 'Take out anything for the car', 'Clear the closet floor',
    ],
  },
  laundry: {
    5: ['Move the wash to the dryer', 'Sort one pile into darks and lights', 'Empty the lint trap'],
    10: ['Fold what is in the dryer', 'Start a new load', 'Clear the folding surface'],
    20: [
      'Put away all the clean laundry', 'Wipe the machine tops', 'Sort the odd socks',
      'Sweep the floor', 'Restock the detergent shelf', 'Empty the trash',
    ],
  },
}

export function roomSet(room: string, minutes: number): Task[] {
  const seq = SEQUENCES[room]
  if (!seq) return []
  const steps = [...seq[5], ...(minutes >= 10 ? seq[10] : []), ...(minutes >= 20 ? seq[20] : [])]
  return steps.map((text, i) => ({
    id: `${room}-${minutes}-${i}`,
    text,
    energy: 'medium' as Energy,
    duration: 5 as Duration,
    room,
  }))
}
