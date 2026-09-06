import { PrimaryButton, SecondaryAction } from '../components/Controls'
import { RadialTimer } from '../components/RadialTimer'
import type { Task } from '../lib/types'
import './TaskScreen.css'

export function TaskScreen(
  { task, fraction, remainingMs, onDone, onSwap }:
  { task: Task; fraction: number; remainingMs: number; onDone: () => void; onSwap?: () => void },
) {
  return (
    <main className="page task">
      <RadialTimer fraction={fraction} remainingMs={remainingMs} />
      <div className="task__card glass card">
        <p className="task__text">{task.text}</p>
      </div>
      <div className="page__foot">
        <PrimaryButton onClick={onDone}>Done</PrimaryButton>
        {onSwap && <SecondaryAction onClick={onSwap}>Not this one</SecondaryAction>}
      </div>
    </main>
  )
}
