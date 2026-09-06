export type Energy = 'low' | 'medium' | 'good'
export type Duration = 5 | 15 | 30
export type ResetDuration = 5 | 10 | 20

export interface Task {
  id: string
  text: string
  energy: Energy
  duration: Duration
  room: string
  /** Task only served when the profile flag is true. */
  requires?: Array<'kids' | 'pets' | 'wfh'>
}

export type Frequency =
  | 'monthly' | 'twiceMonthly' | 'biweekly' | 'weekly' | 'everyNMonths' | 'once'

export interface Bill {
  name: string
  frequency: Frequency
  /** Only for everyNMonths. The spec's schema names the frequency but not N. */
  months?: number
  /** Day of the month this bill anchors to. */
  anchorDay: number
  /** Cycle index the bill was added on, so "every N" counts from here. */
  anchorCycle: number
  checked: boolean
}

export interface State {
  license: { key: string | null; validatedAt: number | null }
  profile: { home: string | null; kids: boolean; pets: boolean; worksFromHome: boolean }
  session: { lastTaskIds: string[]; completedToday: number; lastCompletedDate: string | null }
  rooms: Record<string, { lastReset: number | null; customTasks: string[] }>
  doompile: { name: string | null; items: string[]; deferred: string[]; deferredCap: number }
  payday: {
    cycle: number | null
    bills: Bill[]
    lastRun: number | null
    /** Bills that were due and left unchecked. Pinned above the divider. */
    carryover: string[]
    /** Monotonic count of pay cycles, so "every N months" can be counted. */
    cycleIndex: number
  }
  braindump: { inbox: string[]; today: string[]; thisWeek: string[]; todayDate: string | null }
  meta: {
    version: number
    createdAt: number
    lastExportAt: number | null
    installPromptShown: boolean
    /** "Never" deletes permanently — said plainly once, and never again. */
    neverWarningShown: boolean
    /** The living-situation question is asked once, on first run only. */
    profileSet: boolean
    /** The backup nudge shows at most once per session. */
    backupNudgeShown: boolean
  }
}
