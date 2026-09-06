import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Complete } from './screens/Complete'
import { Gate } from './screens/Gate'
import { StartInput } from './screens/StartInput'
import { TaskScreen } from './screens/TaskScreen'
import { InstallPrompt } from './components/InstallPrompt'
import { load, save, saveNow } from './lib/storage'
import { braindumpPool, pickTask } from './lib/tasks'
import { useTimer } from './lib/timer'
import type { Duration, Energy, State, Task } from './lib/types'

type Screen = 'gate' | 'input' | 'task' | 'complete'

export function App() {
  const [state, setState] = useState<State>(() => load())
  const [screen, setScreen] = useState<Screen>(() =>
    load().license.key ? 'input' : 'gate',
  )
  const [task, setTask] = useState<Task | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [durationMs, setDurationMs] = useState(0)
  const choice = useRef<{ energy: Energy; duration: Duration } | null>(null)

  useEffect(() => { save(state) }, [state])

  // Debounced writes lose the last change if the tab dies first.
  useEffect(() => {
    const flush = () => saveNow(state)
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [state])

  const { fraction, expired } = useTimer(startedAt, durationMs)

  // Time is up: the task screen ends. Ending on schedule is the feature.
  useEffect(() => {
    if (expired && screen === 'task') setScreen('complete')
  }, [expired, screen])

  const serve = useCallback((energy: Energy, duration: Duration, restart: boolean) => {
    const extra = braindumpPool(state, energy, duration)
    const next = pickTask(energy, duration, state.profile, state.session.lastTaskIds, extra)
    if (!next) return
    setTask(next)
    setState((s) => ({
      ...s,
      session: { ...s.session, lastTaskIds: [...s.session.lastTaskIds, next.id].slice(-3) },
    }))
    if (restart) {
      setDurationMs(duration * 60_000)
      setStartedAt(Date.now())
    }
    setScreen('task')
  }, [state])

  const onStart = (energy: Energy, duration: Duration) => {
    choice.current = { energy, duration }
    serve(energy, duration, true)
  }

  // Swapping keeps the same energy and duration, and does not restart the
  // timer — the time was already spent.
  const onSwap = () => {
    const c = choice.current
    if (c) serve(c.energy, c.duration, false)
  }

  const onDone = () => {
    const today = new Date().toDateString()
    setState((s) => ({
      ...s,
      session: {
        ...s.session,
        completedToday: s.session.lastCompletedDate === today ? s.session.completedToday + 1 : 1,
        lastCompletedDate: today,
      },
    }))
    setStartedAt(null)
    setScreen('complete')
  }

  const onAgain = () => {
    setTask(null)
    setStartedAt(null)
    setScreen('input')
  }

  const onValidKey = (key: string) => {
    setState((s) => ({ ...s, license: { key, validatedAt: Date.now() } }))
    setScreen('input')
  }

  // Shown once, after the first completed task. Never on first load.
  const canPromptInstall = useMemo(
    () => screen === 'complete' && state.session.completedToday > 0 && !state.meta.installPromptShown,
    [screen, state.session.completedToday, state.meta.installPromptShown],
  )

  return (
    <>
      {screen === 'gate' && <Gate onValid={onValidKey} />}
      {screen === 'input' && <StartInput onStart={onStart} />}
      {screen === 'task' && task && (
        <TaskScreen task={task} fraction={fraction} onDone={onDone} onSwap={onSwap} />
      )}
      {screen === 'complete' && <Complete onAgain={onAgain} />}

      {canPromptInstall && (
        <InstallPrompt
          onSettled={() =>
            setState((s) => ({ ...s, meta: { ...s.meta, installPromptShown: true } }))
          }
        />
      )}
    </>
  )
}
