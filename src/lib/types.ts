export type Energy = 'low' | 'medium' | 'good'
export type Duration = 5 | 15 | 30

export interface Task {
  id: string
  text: string
  energy: Energy
  duration: Duration
  room: string
  /** Task only served when the profile flag is true. */
  requires?: Array<'kids' | 'pets' | 'wfh'>
}

export interface State {
  license: { key: string | null; validatedAt: number | null }
  profile: { home: string | null; kids: boolean; pets: boolean; worksFromHome: boolean }
  session: { lastTaskIds: string[]; completedToday: number; lastCompletedDate: string | null }
  rooms: Record<string, { lastReset: number | null; customTasks: string[] }>
  doompile: { items: string[]; deferred: string[]; deferredCap: number }
  payday: { cycle: number | null; bills: Array<{ name: string; paid: boolean }>; lastRun: number | null }
  braindump: { inbox: string[]; today: string[]; thisWeek: string[] }
  meta: { version: number; createdAt: number; installPromptShown: boolean }
}
