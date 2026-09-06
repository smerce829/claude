import type { State } from './types'

const KEY = 'adhdos:v1'
export const SCHEMA_VERSION = 2

function fresh(): State {
  return {
    license: { key: null, validatedAt: null },
    profile: { home: null, kids: false, pets: false, worksFromHome: false },
    session: { lastTaskIds: [], completedToday: 0, lastCompletedDate: null },
    rooms: {},
    doompile: { name: null, items: [], deferred: [], deferredCap: 10 },
    payday: { cycle: null, bills: [], lastRun: null, carryover: [], cycleIndex: 0 },
    braindump: { inbox: [], today: [], thisWeek: [], todayDate: null },
    meta: {
      version: SCHEMA_VERSION,
      createdAt: Date.now(),
      lastExportAt: null,
      installPromptShown: false,
      neverWarningShown: false,
      profileSet: false,
      backupNudgeShown: false,
    },
  }
}

/**
 * Upgrades old shapes to the current schema. Written on day one because the
 * schema will change while there are live users, and their data is the only
 * copy — there is no server to rebuild it from.
 *
 * Each version gets its own step and falls through to the next.
 */
export function migrate(raw: unknown): State {
  const base = fresh()
  if (!raw || typeof raw !== 'object') return base

  let s = raw as Partial<State> & { meta?: Partial<State['meta']> }
  const from = s.meta?.version ?? 0

  // v1 -> v2: bills gained a frequency, an anchor and a `checked` field, and
  // payday gained carryover + cycleIndex. A v1 bill was implicitly monthly and
  // used `paid`, so carry that across rather than dropping the user's list.
  if (from < 2 && s.payday && Array.isArray(s.payday.bills)) {
    s = {
      ...s,
      payday: {
        ...s.payday,
        bills: (s.payday.bills as unknown as Array<Record<string, unknown>>).map((b) => ({
          name: String(b.name ?? ''),
          frequency: 'monthly' as const,
          anchorDay: typeof s.payday?.cycle === 'number' ? s.payday.cycle : 1,
          anchorCycle: 0,
          checked: Boolean(b.checked ?? b.paid ?? false),
        })),
      },
    }
  }

  const merged: State = {
    ...base,
    ...s,
    license: { ...base.license, ...s.license },
    profile: { ...base.profile, ...s.profile },
    session: { ...base.session, ...s.session },
    rooms: { ...base.rooms, ...s.rooms },
    doompile: { ...base.doompile, ...s.doompile },
    payday: { ...base.payday, ...s.payday },
    braindump: { ...base.braindump, ...s.braindump },
    meta: { ...base.meta, ...s.meta, version: SCHEMA_VERSION },
  }

  if (from > SCHEMA_VERSION) {
    // Data written by a newer build than this one. Keep it rather than
    // clobbering it — an older cached shell must not destroy real data.
    return { ...merged, meta: { ...merged.meta, version: from } }
  }
  return merged
}

/** One read on boot. */
export function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    return migrate(raw ? JSON.parse(raw) : null)
  } catch {
    // Private mode, quota, or corrupt JSON. Run on defaults rather than
    // showing an error the user cannot act on.
    return migrate(null)
  }
}

let pending: number | null = null

/** Debounced write. Storage is not the hot path; the timer is. */
export function save(state: State): void {
  if (pending !== null) clearTimeout(pending)
  pending = window.setTimeout(() => {
    pending = null
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // Out of quota or blocked. The session still works in memory.
    }
  }, 250)
}

/** Flush immediately — used before the tab goes away. */
export function saveNow(state: State): void {
  if (pending !== null) { clearTimeout(pending); pending = null }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* see above */ }
}

export function exportJSON(state: State): string {
  return JSON.stringify(state, null, 2)
}

export function importJSON(text: string): State {
  return migrate(JSON.parse(text))
}
