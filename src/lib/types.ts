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

export interface Bill {
  name: string
  paid: boolean
}

export interface State {
  license: { key: string | null; validatedAt: number | null }
  profile: { home: string | null; kids: boolean; pets: boolean; worksFromHome: boolean }
  session: { lastTaskIds: string[]; completedToday: number; lastCompletedDate: string | null }
  rooms: Record<string, { lastReset: number | null; customTasks: string[] }>
  doompile: { name: string | null; items: string[]; deferred: string[]; deferredCap: number }
  payday: { cycle: number | null; bills: Bill[]; lastRun: number | null }
  braindump: { inbox: string[]; today: string[]; thisWeek: string[]; todayDate: string | null }
  meta: {
    version: number
    createdAt: number
    installPromptShown: boolean
    /** "Never" deletes permanently — said plainly once, and never again. */
    neverWarningShown: boolean
    /** The living-situation question is asked once, on first run only. */
    profileSet: boolean
  }
}
