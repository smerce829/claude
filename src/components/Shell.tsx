import { ChevronLeft } from 'lucide-react'
import './Shell.css'

export function Back({ onBack }: { onBack: () => void }) {
  return (
    <button className="back" onClick={onBack} aria-label="Back">
      <ChevronLeft size={22} strokeWidth={2.4} aria-hidden="true" />
    </button>
  )
}

export function ScreenTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="title">{children}</h1>
}

export function TextInput(
  { value, onChange, onEnter, label, placeholder }:
  { value: string; onChange: (v: string) => void; onEnter?: () => void; label: string; placeholder?: string },
) {
  return (
    <input
      className="field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter() }}
      aria-label={label}
      placeholder={placeholder}
      autoComplete="off"
      autoCapitalize="sentences"
      autoCorrect="off"
    />
  )
}

/** Step dots for a multi-step wizard. */
export function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="steps" aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={'steps__dot' + (i < current ? ' steps__dot--on' : '')} />
      ))}
      <span className="steps__text">Step {current} of {total}</span>
    </div>
  )
}
