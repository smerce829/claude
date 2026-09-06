import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InstallPrompt } from './components/InstallPrompt'
import { SecondaryAction } from './components/Controls'
import { BrainDump, BrainDumpSort } from './screens/BrainDump'
import { Complete } from './screens/Complete'
import { DoomPileAdd, DoomPileName, DoomPileReview, DoomPileRun } from './screens/DoomPile'
import { Gate } from './screens/Gate'
import { Menu } from './screens/Menu'
import { Payday } from './screens/Payday'
import { Profile } from './screens/Profile'
import { RoomReset } from './screens/RoomReset'
import { Settings } from './screens/Settings'
import { StartInput } from './screens/StartInput'
import { TaskScreen } from './screens/TaskScreen'
import { importJSON, load, save, saveNow } from './lib/storage'
import { advanceCycles } from './lib/payday'
import { brainDumpText, isBrainDumpTask, nextUntagged, pickTask, roomSet } from './lib/tasks'
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
    const flush = () => saveNow(state)
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [state])

  // Roll the pay cycle forward on open. Bills that were due and left
  // unchecked carry over rather than silently resetting.
  useEffect(() => {
    const next = advanceCycles(state.payday)
    if (next.changed) setState((s) => ({ ...s, payday: next.payday }))
  }, [state.payday])

  // Items triaged to "today" belong to that day only.
  useEffect(() => {
    const today = new Date().toDateString()
    if (state.braindump.todayDate && state.braindump.todayDate !== today && state.braindump.today.length > 0) {
      setState((s) => ({ ...s, braindump: { ...s.braindump, today: [], todayDate: today } }))
    }
  }, [state.braindump.todayDate, state.braindump.today.length])

  const { fraction, expired } = useTimer(startedAt, durationMs)

  useEffect(() => {
    if (!expired) return
    // Time is up. The set ends where it is: it does not extend, and it does
    // not ask whether they want more. Ending on schedule is the feature.
    if (screen === 'task') setScreen('complete')
    if (screen === 'room-run') setScreen('room-done')
  }, [expired, screen])

  /* ---------------- Start Button ---------------- */

  /** `skipped` holds brain-dump items passed over with "not this one". */
  const skipped = useRef<string[]>([])

  const serve = useCallback((energy: Energy, duration: Duration, restart: boolean) => {
    const next =
      nextUntagged(state.braindump.today, energy, duration, skipped.current) ??
      pickTask(energy, duration, state.profile, state.session.lastTaskIds)
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
    skipped.current = []
    serve(energy, duration, true)
  }

  // Passing on a brain-dump item moves to the next one before the library.
  const onSwap = () => {
    if (task && isBrainDumpTask(task)) skipped.current = [...skipped.current, brainDumpText(task)]
    const c = choice.current
    if (c) serve(c.energy, c.duration, false)
  }

  const countCompleted = () => {
    const today = new Date().toDateString()
    setState((s) => ({
      ...s,
      session: {
        ...s.session,
        completedToday: s.session.lastCompletedDate === today ? s.session.completedToday + 1 : 1,
        lastCompletedDate: today,
      },
    }))
  }

  const onDone = () => {
    if (task && isBrainDumpTask(task)) {
      const text = brainDumpText(task)
      setState((s) => ({
        ...s,
        braindump: { ...s.braindump, today: s.braindump.today.filter((t) => t !== text) },
      }))
    }
    countCompleted()
    setStartedAt(null)
    setScreen('complete')
  }
  const onAgain = () => { setTask(null); setStartedAt(null); setScreen('start') }

  /* ---------------- Room Reset ---------------- */

  const startRoom = (room: string, minutes: ResetDuration) => {
    const s = roomSet(room, minutes)
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

  /* Data-loss nudge. All state lives only in this browser, so a long gap
     since the last export with real data on board earns one offer per
     session — skippable, never blocking. */
  const FOURTEEN_DAYS = 14 * 86_400_000
  const hasData =
    state.doompile.items.length > 0 ||
    state.braindump.inbox.length > 0 ||
    state.payday.bills.length > 0
  const staleExport =
    state.meta.lastExportAt === null
      ? Date.now() - state.meta.createdAt >= FOURTEEN_DAYS
      : Date.now() - state.meta.lastExportAt >= FOURTEEN_DAYS
  const nudgeBackup = hasData && staleExport && !state.meta.backupNudgeShown

  const takeBackup = () => {
    setState((s) => ({ ...s, meta: { ...s.meta, backupNudgeShown: true } }))
    setScreen('settings')
  }

  const canPromptInstall = useMemo(
    () => (screen === 'complete' || screen === 'room-done') &&
          state.session.completedToday > 0 && !state.meta.installPromptShown,
    [screen, state.session.completedToday, state.meta.installPromptShown],
  )

  return (
    <>
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
        <StartInput onStart={onStart} onElse={() => setScreen('menu')} />
      )}

      {screen === 'task' && task && (
        <TaskScreen task={task} fraction={fraction} onDone={onDone} onSwap={onSwap} />
      )}

      {screen === 'complete' && <Complete onAgain={onAgain} nudgeBackup={nudgeBackup} onBackup={takeBackup} />}

      {screen === 'menu' && (
        <Menu onGo={(s) => setScreen(s)} onBack={toStart} />
      )}

      {screen === 'room' && <RoomReset onStart={startRoom} onBack={() => setScreen('menu')} />}

      {screen === 'room-run' && set[step] && (
        <TaskScreen task={set[step]} fraction={fraction} onDone={nextInSet} />
      )}

      {screen === 'room-done' && <Complete onAgain={toStart} nudgeBackup={nudgeBackup} onBackup={takeBackup} />}

      {screen === 'doompile' && (
        <DoomPileName
          deferredCount={state.doompile.deferred.length}
          onReview={() => setScreen('doompile-review')}
          onNamed={(name) => {
            setState((s) => ({ ...s, doompile: { ...s.doompile, name, items: [] } }))
            setScreen('doompile-add')
          }}
          onBack={() => setScreen('menu')}
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
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'doompile-review' && state.doompile.deferred[0] && (
        <DoomPileReview
          item={state.doompile.deferred[0]}
          remaining={state.doompile.deferred.length}
          onDecide={() => {
            // Any of the three resolves the item and frees a slot.
            setState((s) => ({
              ...s,
              doompile: { ...s.doompile, deferred: s.doompile.deferred.slice(1) },
            }))
            if (state.doompile.deferred.length <= 1) setScreen('doompile')
          }}
          onBack={() => setScreen('doompile')}
        />
      )}

      {screen === 'doompile-done' && <Complete onAgain={toStart} nudgeBackup={nudgeBackup} onBackup={takeBackup} />}

      {screen === 'payday' && (
        <Payday
          payday={state.payday}
          onSetCycle={(day) => setState((s) => ({
            ...s, payday: { ...s.payday, cycle: day, lastRun: Date.now() },
          }))}
          onToggle={(name) => setState((s) => ({
            ...s,
            payday: {
              ...s.payday,
              bills: s.payday.bills.map((b) => b.name === name ? { ...b, checked: !b.checked } : b),
              // Checking a carried bill clears it from the pinned list.
              carryover: s.payday.bills.some((b) => b.name === name && !b.checked)
                ? s.payday.carryover.filter((n) => n !== name)
                : s.payday.carryover,
            },
          }))}
          onAdd={(name, frequency, months) => setState((s) => ({
            ...s,
            payday: {
              ...s.payday,
              bills: [...s.payday.bills, {
                name, frequency, months,
                anchorDay: s.payday.cycle ?? 1,
                anchorCycle: s.payday.cycleIndex,
                checked: false,
              }],
            },
          }))}
          onRemove={(name) => setState((s) => ({
            ...s,
            payday: {
              ...s.payday,
              bills: s.payday.bills.filter((b) => b.name !== name),
              carryover: s.payday.carryover.filter((n) => n !== name),
            },
          }))}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'braindump' && (
        <BrainDump
          inbox={state.braindump.inbox}
          onAdd={(t) => setState((s) => ({ ...s, braindump: { ...s.braindump, inbox: [...s.braindump.inbox, t] } }))}
          onSort={() => setScreen('braindump-sort')}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'braindump-sort' && state.braindump.inbox[0] && (
        <BrainDumpSort
          item={state.braindump.inbox[0]}
          warnNever={!state.meta.neverWarningShown}
          onSort={sortItem}
          onAckWarning={() => setState((s) => ({ ...s, meta: { ...s.meta, neverWarningShown: true } }))}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'braindump-done' && <Complete onAgain={toStart} nudgeBackup={nudgeBackup} onBackup={takeBackup} />}

      {screen === 'settings' && (
        <Settings
          state={state}
          onExported={() => setState((s) => ({ ...s, meta: { ...s.meta, lastExportAt: Date.now() } }))}
          onImport={(text) => {
            try { setState(importJSON(text)); setScreen('start') }
            catch { /* Malformed file. Keep what is already here. */ }
          }}
          onBack={() => setScreen('menu')}
        />
      )}

      {canPromptInstall && (
        <InstallPrompt
          onSettled={() => setState((s) => ({ ...s, meta: { ...s.meta, installPromptShown: true } }))}
        />
      )}
    </>
  )
}

export { SecondaryAction }
