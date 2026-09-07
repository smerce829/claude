import { IconBack } from './Icons'
import './Shell.css'

/**
 * Back is one of the two icons allowed to stand without a text label
 * (section 6.5). Nothing else sits in this row — no title bar, no logo.
 */
export function Back({ onBack }: { onBack: () => void }) {
  return (
    <button className="back" onClick={onBack} aria-label="Back">
      <IconBack size={24} />
    </button>
  )
}

export function ScreenTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="screen-title">{children}</h1>
}

export function TextInput(
  { value, onChange, onEnter, label, placeholder }:
  { value: string; onChange: (v: string) => void; onEnter?: () => void; label: string; placeholder?: string },
) {
  return (
    <input
      className="input"
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
