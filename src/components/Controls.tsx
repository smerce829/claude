import './Controls.css'

export function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button className="btn btn--primary" onClick={onClick}>{children}</button>
}

/** Lime. Completion screen only — lime on screen means something is over. */
export function CompletionButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button className="btn btn--completion" onClick={onClick}>{children}</button>
}

export function SecondaryAction({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button className="btn btn--secondary" onClick={onClick}>{children}</button>
}

export function ChoiceTile(
  { label, selected, onClick }: { label: string; selected: boolean; onClick: () => void },
) {
  return (
    <button
      className={'tile' + (selected ? ' tile--selected' : '')}
      onClick={onClick}
      aria-pressed={selected}
    >
      {label}
    </button>
  )
}

export function Divider() {
  return <hr className="divider" />
}
