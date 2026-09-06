import { PrimaryButton, SecondaryAction } from '../components/Controls'
import { TimerBar } from '../components/TimerBar'
import type { Task } from '../lib/types'
import './TaskScreen.css'

/**
 * Timer bar at the top edge. Task text and two controls. Nothing above the
 * task — no title, no icon, no room name, no step counter. No back button,
 * because there is no list to go back to.
 */
export function TaskScreen(
  { task, fraction, onDone, onSwap }:
  { task: Task; fraction: number; onDone: () => void; onSwap: () => void },
) {
  return (
    <>
      <TimerBar fraction={fraction} />
      <main className="task">
        <p className="task__text">{task.text}</p>
        <div className="task__controls">
          <PrimaryButton onClick={onDone}>done</PrimaryButton>
          <SecondaryAction onClick={onSwap}>not this one</SecondaryAction>
        </div>
      </main>
    </>
  )
}
