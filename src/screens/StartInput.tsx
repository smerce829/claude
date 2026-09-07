import { useState } from 'react'
import { ChoiceTile, SecondaryAction } from '../components/Controls'
import type { Duration, Energy } from '../lib/types'
import './StartInput.css'

const ENERGY: Array<{ v: Energy; label: string }> = [
  { v: 'low', label: 'low' },
  { v: 'medium', label: 'medium' },
  { v: 'good', label: 'good' },
]
const TIME: Array<{ v: Duration; label: string }> = [
  { v: 5, label: '5 min' },
  { v: 15, label: '15 min' },
  { v: 30, label: '30 min' },
]

/**
 * Nothing on screen but the two rows — no header, no nav, no logo.
 * No confirm button: selecting the second value fires immediately.
 */
export function StartInput(
  { onStart, onElse }: { onStart: (e: Energy, d: Duration) => void; onElse: () => void },
) {
  const [energy, setEnergy] = useState<Energy | null>(null)
  const [time, setTime] = useState<Duration | null>(null)

  const chooseEnergy = (v: Energy) => {
    setEnergy(v)
    if (time !== null) onStart(v, time)
  }
  const chooseTime = (v: Duration) => {
    setTime(v)
    if (energy !== null) onStart(energy, v)
  }

  return (
    <main className="start">
      <div className="start__group">
        <p className="label">energy</p>
        <div className="start__row" role="group" aria-label="energy">
          {ENERGY.map((o) => (
            <ChoiceTile key={o.v} label={o.label} selected={energy === o.v}
              onClick={() => chooseEnergy(o.v)} />
          ))}
        </div>
      </div>

      <div className="start__group">
        <p className="label">time</p>
        <div className="start__row" role="group" aria-label="time">
          {TIME.map((o) => (
            <ChoiceTile key={o.v} label={o.label} selected={time === o.v}
              onClick={() => chooseTime(o.v)} />
          ))}
        </div>
      </div>

      {/* The only way to reach the other four modules. Section 7.1 keeps this
          screen bare, and section 9 forbids a home screen, so this is one
          secondary action rather than a nav bar. */}
      <SecondaryAction onClick={onElse}>something else</SecondaryAction>
    </main>
  )
}
