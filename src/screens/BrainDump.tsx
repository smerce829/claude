import { useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { SecondaryAction, PrimaryButton } from '../components/Controls'
import { Back, ScreenTitle } from '../components/Shell'
import './BrainDump.css'

/** Floating catcher: type and fire without leaving the screen. */
export function BrainDump(
  { inbox, onAdd, onSort, onBack }:
  { inbox: string[]; onAdd: (t: string) => void; onSort: () => void; onBack: () => void },
) {
  const [text, setText] = useState('')
  const add = () => { if (text.trim()) { onAdd(text.trim()); setText('') } }

  return (
    <main className="page bd">
      <Back onBack={onBack} />
      <ScreenTitle>Get it out of your head</ScreenTitle>

      <div className="bd__list">
        {inbox.length === 0
          ? <p className="muted">Brain clear. Type anything that is taking up space.</p>
          : inbox.map((t, i) => <div key={`${t}-${i}`} className="bd__pill glass">{t}</div>)}
      </div>

      <div className="bd__foot">
        {inbox.length > 0 && <PrimaryButton onClick={onSort}>Sort {inbox.length}</PrimaryButton>}
        <div className="bd__catcher glass">
          <input
            className="bd__input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add() }}
            aria-label="One thing"
            placeholder="one thing"
            autoComplete="off"
          />
          <button className="bd__fire" onClick={add} aria-label="Add">
            <ArrowUp size={20} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      </div>
    </main>
  )
}

export function BrainDumpSort(
  { item, warnNever, onSort, onAckWarning, onBack }:
  {
    item: string
    warnNever: boolean
    onSort: (to: 'today' | 'week' | 'never') => void
    onAckWarning: () => void
    onBack: () => void
  },
) {
  const [confirming, setConfirming] = useState(false)
  const never = () => {
    if (warnNever && !confirming) { setConfirming(true); return }
    setConfirming(false); onAckWarning(); onSort('never')
  }
  return (
    <main className="page">
      <Back onBack={onBack} />
      <div className="page__fill">
        <div className="bd__card glass card" key={item}>
          <p className="bd__item">{item}</p>
        </div>
        {confirming && <p className="bd__warn">Never deletes it for good. There is no undo.</p>}
      </div>
      <div className="page__foot">
        <PrimaryButton onClick={() => { setConfirming(false); onSort('today') }}>Today</PrimaryButton>
        <SecondaryAction onClick={() => { setConfirming(false); onSort('week') }}>This week</SecondaryAction>
        <SecondaryAction onClick={never}>{confirming ? 'Yes, never' : 'Never'}</SecondaryAction>
      </div>
    </main>
  )
}
