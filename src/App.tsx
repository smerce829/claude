import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InstallPrompt } from './components/InstallPrompt'
import { Header } from './components/Chrome'
import { Dock } from './components/Dock'
import { SecondaryAction } from './components/Controls'
import { BrainDump, BrainDumpSort } from './screens/BrainDump'
import { Complete } from './screens/Complete'
import { DoomPileAdd, DoomPileName, DoomPileRun } from './screens/DoomPile'
import { Gate } from './screens/Gate'
import { Payday } from './screens/Payday'
import { Profile } from './screens/Profile'
import { RoomReset } from './screens/RoomReset'
import { Settings } from './screens/Settings'
import { StartInput } from './screens/StartInput'
import { TaskScreen } from './screens/TaskScreen'
import { importJSON, load, save, saveNow } from './lib/storage'
import { shouldReset } from './lib/payday'
import { advanceStreak, liveStreak } from './lib/streak'
import { braindumpPool, microTasks, pickTask, roomSet } from './lib/tasks'
import { useTimer } from './lib/timer'
import type { Duration, Energy, ResetDuration, State, Task } from './lib/types'
import type { Screen } from './lib/types.nav'

export function App() {
  const [state, setState] = useState<State>(() => load())
  const [screen, setScreen] = useState<Screen>(() => {
    const s = load()
    if (!s.license.key) return 'gate'
    // Existing installs that predate the question still get asked once.
    return s.meta.profileSet ? 'start' : 'profile'
  })

  const [task, setTask] = useState<Task | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [durationMs, setDurationMs] = useState(0)
  const choice = useRef<{ energy: Energy; duration: Duration } | null>(null)

  // Room Reset runs one sequenced set against a single timer.
  const [set, setSet] = useState<Task[]>([])
  const [step, setStep] = useState(0)

  useEffect(() => { save(state) }, [state])

  useEffect(() => {
    const root = document.documentElement
    if (state.ui.lowEnergy) root.setAttribute('data-energy', 'low')
    else root.removeAttribute('data-energy')
  }, [state.ui.lowEnergy])

  useEffect(() => {
    const flush = () => saveNow(state)
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [state])

  // Bills clear themselves once the cycle date comes round again.
  useEffect(() => {
    if (!shouldReset(state.payday)) return
    setState((s) => ({
      ...s,
      payday: { ...s.payday, bills: s.payday.bills.map((b) => ({ ...b, paid: false })), lastRun: Date.now() },
    }))
  }, [state.payday])

  // Items triaged to "today" belong to that day only.
  useEffect(() => {
    const today = new Date().toDateString()
    if (state.braindump.todayDate && state.braindump.todayDate !== today && state.braindump.today.length > 0) {
      setState((s) => ({ ...s, braindump: { ...s.braindump, today: [], todayDate: today } }))
    }
  }, [state.braindump.todayDate, state.braindump.today.length])

  const { fraction, expired, remaining } = useTimer(startedAt, durationMs)

  useEffect(() => {
    if (!expired) return
    // Time is up. The set ends where it is: it does not extend, and it does
    // not ask whether they want more. Ending on schedule is the feature.
    if (screen === 'task') setScreen('complete')
    if (screen === 'room-run') setScreen('room-done')
  }, [expired, screen])

  /* ---------------- Start Button ---------------- */

  const serve = useCallback((energy: Energy, duration: Duration, restart: boolean) => {
    const extra = braindumpPool(state, energy, duration)
    const next = pickTask(energy, duration, state.profile, state.session.lastTaskIds, extra)
    if (!next) return
    setTask(next)
    setState((s) => ({
      ...s,
      session: { ...s.session, lastTaskIds: [...s.session.lastTaskIds, next.id].slice(-3) },
    }))
    if (restart) { setDurationMs(duration * 60_000); setStartedAt(Date.now()) }
    setScreen('task')
  }, [state])

  const onStart = (energy: Energy, duration: Duration) => {
    choice.current = { energy, duration }
    serve(energy, duration, true)
  }
  const onSwap = () => { const c = choice.current; if (c) serve(c.energy, c.duration, false) }

  const countCompleted = () => {
    setState((s) => ({ ...s, session: advanceStreak(s.session) }))
  }

  const onDone = () => { countCompleted(); setStartedAt(null); setScreen('complete') }
  const onAgain = () => { setTask(null); setStartedAt(null); setScreen('start') }

  /* ---------------- Room Reset ---------------- */

  const startRoom = (room: string, minutes: ResetDuration) => {
    const s = roomSet(room, state.profile)
    if (s.length === 0) return
    setSet(s); setStep(0)
    setDurationMs(minutes * 60_000)
    setStartedAt(Date.now())
    setState((p) => ({
      ...p,
      rooms: { ...p.rooms, [room]: { lastReset: Date.now(), customTasks: p.rooms[room]?.customTasks ?? [] } },
    }))
    setScreen('room-run')
  }

  const nextInSet = () => {
    countCompleted()
    // Running out of tasks ends the reset just as running out of time does.
    if (step + 1 >= set.length) { setStartedAt(null); setScreen('room-done'); return }
    setStep(step + 1)
  }

  /* ---------------- Doom-Pile ---------------- */

  const decide = (d: 'keep' | 'bin' | 'relocate' | 'later') => {
    setState((s) => {
      const [head, ...rest] = s.doompile.items
      return {
        ...s,
        doompile: {
          ...s.doompile,
          items: rest,
          deferred: d === 'later' ? [...s.doompile.deferred, head] : s.doompile.deferred,
        },
      }
    })
    if (state.doompile.items.length <= 1) setScreen('doompile-done')
  }

  /* ---------------- Brain-Dump ---------------- */

  const sortItem = (to: 'today' | 'week' | 'never') => {
    setState((s) => {
      const [head, ...rest] = s.braindump.inbox
      return {
        ...s,
        braindump: {
          ...s.braindump,
          inbox: rest,
          today: to === 'today' ? [...s.braindump.today, head] : s.braindump.today,
          thisWeek: to === 'week' ? [...s.braindump.thisWeek, head] : s.braindump.thisWeek,
          todayDate: new Date().toDateString(),
        },
      }
    })
    if (state.braindump.inbox.length <= 1) setScreen('braindump-done')
  }

  /* ---------------- Shell ---------------- */

  const toStart = () => setScreen('start')

  const streak = liveStreak(state.session)
  const micro = useMemo(() => microTasks(state.profile), [state.profile])

  /* The gate and the one-time profile question run before the app chrome
     exists, so neither shows the header or the dock. */
  const chrome = screen !== 'gate' && screen !== 'profile'

  const canPromptInstall = useMemo(
    () => (screen === 'complete' || screen === 'room-done') &&
          state.session.completedToday > 0 && !state.meta.installPromptShown,
    [screen, state.session.completedToday, state.meta.installPromptShown],
  )

  return (
    <>
      {chrome && (
        <Header
          lowEnergy={state.ui.lowEnergy}
          streak={streak}
          onToggle={() => setState((s) => ({ ...s, ui: { ...s.ui, lowEnergy: !s.ui.lowEnergy } }))}
          onSettings={() => setScreen('settings')}
        />
      )}

      {screen === 'gate' && (
        <Gate onValid={(key) => {
          setState((s) => ({ ...s, license: { key, validatedAt: Date.now() } }))
          setScreen('profile')
        }} />
      )}

      {screen === 'profile' && (
        <Profile onDone={(p) => {
          setState((s) => ({
            ...s,
            profile: { ...s.profile, kids: p.kids, pets: p.pets, worksFromHome: p.wfh },
            meta: { ...s.meta, profileSet: true },
          }))
          setScreen('start')
        }} />
      )}

      {screen === 'start' && (
        <StartInput
          onStart={onStart}
          lowEnergy={state.ui.lowEnergy}
          micro={micro}
          onMicro={(t) => { setTask(t); setDurationMs(5 * 60_000); setStartedAt(Date.now()); setScreen('task') }}
        />
      )}

      {screen === 'task' && task && (
        <TaskScreen task={task} fraction={fraction} remainingMs={remaining} onDone={onDone} onSwap={onSwap} />
      )}

      {screen === 'complete' && <Complete onAgain={onAgain} streak={streak} />}


      {screen === 'room' && <RoomReset onStart={startRoom} onBack={toStart} />}

      {screen === 'room-run' && set[step] && (
        <TaskScreen task={set[step]} fraction={fraction} remainingMs={remaining} onDone={nextInSet} />
      )}

      {screen === 'room-done' && <Complete onAgain={toStart} streak={streak} />}

      {screen === 'doompile' && (
        <DoomPileName
          onNamed={(name) => {
            setState((s) => ({ ...s, doompile: { ...s.doompile, name, items: [] } }))
            setScreen('doompile-add')
          }}
          onBack={toStart}
        />
      )}

      {screen === 'doompile-add' && (
        <DoomPileAdd
          name={state.doompile.name ?? 'the pile'}
          items={state.doompile.items}
          onAdd={(t) => setState((s) => ({ ...s, doompile: { ...s.doompile, items: [...s.doompile.items, t] } }))}
          onStart={() => setScreen('doompile-run')}
          onBack={() => setScreen('doompile')}
        />
      )}

      {screen === 'doompile-run' && state.doompile.items[0] && (
        <DoomPileRun
          item={state.doompile.items[0]}
          deferredFull={state.doompile.deferred.length >= state.doompile.deferredCap}
          onDecide={decide}
          onBack={toStart}
        />
      )}

      {screen === 'doompile-done' && <Complete onAgain={toStart} streak={streak} />}

      {screen === 'payday' && (
        <Payday
          cycle={state.payday.cycle}
          bills={state.payday.bills}
          onSetCycle={(day) => setState((s) => ({ ...s, payday: { ...s.payday, cycle: day, lastRun: Date.now() } }))}
          onToggle={(i) => setState((s) => ({
            ...s,
            payday: { ...s.payday, bills: s.payday.bills.map((b, j) => j === i ? { ...b, paid: !b.paid } : b) },
          }))}
          onAdd={(name) => setState((s) => ({ ...s, payday: { ...s.payday, bills: [...s.payday.bills, { name, paid: false }] } }))}
          onRemove={(i) => setState((s) => ({ ...s, payday: { ...s.payday, bills: s.payday.bills.filter((_, j) => j !== i) } }))}
          onBack={toStart}
        />
      )}

      {screen === 'braindump' && (
        <BrainDump
          inbox={state.braindump.inbox}
          onAdd={(t) => setState((s) => ({ ...s, braindump: { ...s.braindump, inbox: [...s.braindump.inbox, t] } }))}
          onSort={() => setScreen('braindump-sort')}
          onBack={toStart}
        />
      )}

      {screen === 'braindump-sort' && state.braindump.inbox[0] && (
        <BrainDumpSort
          item={state.braindump.inbox[0]}
          warnNever={!state.meta.neverWarningShown}
          onSort={sortItem}
          onAckWarning={() => setState((s) => ({ ...s, meta: { ...s.meta, neverWarningShown: true } }))}
          onBack={toStart}
        />
      )}

      {screen === 'braindump-done' && <Complete onAgain={toStart} streak={streak} />}

      {screen === 'settings' && (
        <Settings
          state={state}
          onImport={(text) => {
            try { setState(importJSON(text)); setScreen('start') }
            catch { /* Malformed file. Keep what is already here. */ }
          }}
          onBack={toStart}
        />
      )}

      {chrome && <Dock screen={screen} onGo={(t) => setScreen(t)} />}

      {canPromptInstall && (
        <InstallPrompt
          onSettled={() => setState((s) => ({ ...s, meta: { ...s.meta, installPromptShown: true } }))}
        />
      )}
    </>
  )
}

export { SecondaryAction }
