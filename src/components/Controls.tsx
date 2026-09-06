import './Controls.css'

type Tone = 'action' | 'success' | 'warn'

export function PrimaryButton(
  { children, onClick, tone = 'action' }:
  { children: React.ReactNode; onClick: () => void; tone?: Tone },
) {
  return <button className={`btn btn--${tone}`} onClick={onClick}>{children}</button>
}

/** Kept as a named export so completion screens read as intent, not colour. */
export function CompletionButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <PrimaryButton tone="success" onClick={onClick}>{children}</PrimaryButton>
}

export function SecondaryAction({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button className="btn btn--ghost" onClick={onClick}>{children}</button>
}

export function ChoiceTile(
  { label, selected, onClick }: { label: string; selected: boolean; onClick: () => void },
) {
  return (
    <button
      className={'pill' + (selected ? ' pill--on' : '')}
      onClick={onClick}
      aria-pressed={selected}
    >
      {label}
    </button>
  )
}

export function Divider() { return <hr className="rule" /> }
