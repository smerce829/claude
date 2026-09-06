import { useState } from 'react'
import { PrimaryButton } from '../components/Controls'
import { ScreenTitle } from '../components/Shell'
import './Profile.css'

/**
 * Asked once, on first run, and never again — this is not a settings panel
 * (section 9 forbids one) but a content filter: it decides which of the
 * profile-tagged tasks are eligible to be served at all.
 *
 * Skippable by pressing start with nothing chosen, so it costs one tap and
 * never blocks the first task.
 */
const OPTIONS = [
  { key: 'kids' as const, label: 'Kids' },
  { key: 'pets' as const, label: 'Pets' },
  { key: 'wfh' as const, label: 'Work from home' },
]

export function Profile({ onDone }: { onDone: (p: { kids: boolean; pets: boolean; wfh: boolean }) => void }) {
  const [on, setOn] = useState({ kids: false, pets: false, wfh: false })
  const flip = (k: 'kids' | 'pets' | 'wfh') => setOn((s) => ({ ...s, [k]: !s[k] }))

  return (
    <main className="page">
      <div className="page__fill">
        <ScreenTitle>Any of these yours?</ScreenTitle>
        <p className="muted">Tap what applies. It only changes which tasks you get.</p>
        <div className="prof__row" role="group" aria-label="Living situation">
          {OPTIONS.map((o) => (
            <button
              key={o.key}
              className={'prof__tile' + (on[o.key] ? ' prof__tile--selected' : '')}
              onClick={() => flip(o.key)}
              aria-pressed={on[o.key]}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="page__foot">
        <PrimaryButton onClick={() => onDone(on)}>Start</PrimaryButton>
      </div>
    </main>
  )
}
