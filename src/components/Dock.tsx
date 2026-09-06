import { Play, Sparkles, Layers, Wallet, Brain } from 'lucide-react'
import type { Screen } from '../lib/types.nav'
import './Dock.css'

/** Five is the cap for a bottom dock; a sixth would overload it. */
const TABS: Array<{ to: Screen; label: string; Icon: typeof Play; match: string[] }> = [
  { to: 'start',     label: 'Start',  Icon: Play,     match: ['start', 'task', 'complete'] },
  { to: 'room',      label: 'Reset',  Icon: Sparkles, match: ['room', 'room-run', 'room-done'] },
  { to: 'doompile',  label: 'Pile',   Icon: Layers,   match: ['doompile', 'doompile-add', 'doompile-run', 'doompile-done'] },
  { to: 'payday',    label: 'Money',  Icon: Wallet,   match: ['payday'] },
  { to: 'braindump', label: 'Brain',  Icon: Brain,    match: ['braindump', 'braindump-sort', 'braindump-done'] },
]

export function Dock({ screen, onGo }: { screen: Screen; onGo: (s: Screen) => void }) {
  return (
    <nav className="dock glass" aria-label="Main">
      {TABS.map(({ to, label, Icon, match }) => {
        const active = match.includes(screen)
        return (
          <button
            key={to}
            className={'dock__tab' + (active ? ' dock__tab--active' : '')}
            onClick={() => onGo(to)}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={21} strokeWidth={2.2} aria-hidden="true" />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
