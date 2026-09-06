import { SecondaryAction } from '../components/Controls'
import { Back, ScreenTitle } from '../components/Shell'
import type { Screen } from '../lib/types.nav'
import './Menu.css'

/**
 * Not a dashboard and not a home screen — section 9 forbids both. It carries
 * no counts, no state, no overview: it exists only because five modules have
 * to be reachable and section 7.1 keeps the start screen bare.
 * The app still opens on the Start Button; nobody is routed through here.
 */
const ITEMS: Array<{ to: Screen; label: string }> = [
  { to: 'room', label: 'reset a room' },
  { to: 'doompile', label: 'sort a pile' },
  { to: 'payday', label: 'payday' },
  { to: 'braindump', label: 'brain dump' },
  { to: 'settings', label: 'your data' },
]

export function Menu({ onGo, onBack }: { onGo: (s: Screen) => void; onBack: () => void }) {
  return (
    <div className="page">
      <Back onBack={onBack} />
      <div className="menu">
        {ITEMS.map((i) => (
          <button key={i.to} className="menu__item" onClick={() => onGo(i.to)}>
            {i.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export { ScreenTitle, SecondaryAction }
