import { Zap, Settings2 } from 'lucide-react'
import './Chrome.css'

/** Physical-feel switch. Amber when Low-Energy mode is on. */
export function EnergyToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      className={'switch' + (on ? ' switch--on' : '')}
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      aria-label="Low-energy mode"
    >
      <span className="switch__track">
        <span className="switch__knob" />
      </span>
    </button>
  )
}

export function StreakBadge({ days }: { days: number }) {
  if (days < 1) return null
  return (
    <div className="streak" aria-label={`${days} day streak`}>
      <Zap size={14} strokeWidth={2.5} aria-hidden="true" />
      <span>{days}-day streak</span>
    </div>
  )
}

export function Header({ lowEnergy, streak, onToggle, onSettings }:
  { lowEnergy: boolean; streak: number; onToggle: () => void; onSettings: () => void }) {
  return (
    <header className="hdr">
      <div className="hdr__mark" aria-hidden="true"><span /></div>
      <div className="hdr__right">
        <div className="dim-on-low"><StreakBadge days={streak} /></div>
        <EnergyToggle on={lowEnergy} onToggle={onToggle} />
        <button className="hdr__gear" onClick={onSettings} aria-label="Your data">
          <Settings2 size={19} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
