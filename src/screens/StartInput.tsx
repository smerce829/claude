import { useState } from 'react'
import { ChoiceTile, PrimaryButton } from '../components/Controls'
import type { Duration, Energy, Task } from '../lib/types'
import './StartInput.css'

const ENERGY: Array<{ v: Energy; label: string }> = [
  { v: 'low', label: 'Low' },
  { v: 'medium', label: 'Medium' },
  { v: 'good', label: 'Good' },
]
const TIME: Array<{ v: Duration; label: string }> = [
  { v: 5, label: '5 min' },
  { v: 15, label: '15 min' },
  { v: 30, label: '30 min' },
]

/**
 * In Low-Energy mode the choosers are replaced by three ready micro-actions,
 * so the screen asks for nothing at all.
 */
export function StartInput(
  { onStart, lowEnergy, micro, onMicro }:
  {
    onStart: (e: Energy, d: Duration) => void
    lowEnergy: boolean
    micro: Task[]
    onMicro: (t: Task) => void
  },
) {
  const [energy, setEnergy] = useState<Energy | null>(null)
  const [time, setTime] = useState<Duration | null>(null)

  if (lowEnergy) {
    return (
      <main className="page start start--low">
        <div className="page__fill">
          <h1 className="start__lead">Just one of these.</h1>
          <div className="micro">
            {micro.map((t) => (
              <button key={t.id} className="micro__card glass" onClick={() => onMicro(t)}>
                {t.text}
              </button>
            ))}
          </div>
        </div>
      </main>
    )
  }

  const chooseEnergy = (v: Energy) => { setEnergy(v); if (time !== null) onStart(v, time) }
  const chooseTime = (v: Duration) => { setTime(v); if (energy !== null) onStart(energy, v) }

  return (
    <main className="page start">
      <div className="page__fill">
        <div className="start__group">
          <p className="start__label">Energy</p>
          <div className="start__row" role="group" aria-label="Energy">
            {ENERGY.map((o) => (
              <ChoiceTile key={o.v} label={o.label} selected={energy === o.v}
                onClick={() => chooseEnergy(o.v)} />
            ))}
          </div>
        </div>
        <div className="start__group">
          <p className="start__label">Time</p>
          <div className="start__row" role="group" aria-label="Time">
            {TIME.map((o) => (
              <ChoiceTile key={o.v} label={o.label} selected={time === o.v}
                onClick={() => chooseTime(o.v)} />
            ))}
          </div>
        </div>
      </div>
      {energy !== null && time === null && (
        <div className="page__foot dim-on-low">
          <PrimaryButton onClick={() => chooseTime(5)}>Pick a length</PrimaryButton>
        </div>
      )}
    </main>
  )
}
