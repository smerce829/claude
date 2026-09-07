import { useState } from 'react'
import { PrimaryButton, SecondaryAction } from '../components/Controls'
import { Back, ScreenTitle, TextInput } from '../components/Shell'
import './BrainDump.css'

/**
 * Phase one: a single input field. Enter adds a line.
 * No editing, no reordering, no tagging. Dump until empty.
 */
export function BrainDump(
  { inbox, onAdd, onSort, onBack }:
  { inbox: string[]; onAdd: (t: string) => void; onSort: () => void; onBack: () => void },
) {
  const [text, setText] = useState('')
  const add = () => { if (text.trim()) { onAdd(text.trim()); setText('') } }

  return (
    <div className="page">
      <Back onBack={onBack} />
      <div className="page__fill">
        <ScreenTitle>Get it out</ScreenTitle>
        <TextInput value={text} onChange={setText} onEnter={add}
          label="One thing" placeholder="one thing" />
        <p className="bd__count">
          {inbox.length === 0 ? 'Nothing yet \u00b7 add one thing to start' :
            `${inbox.length} ${inbox.length === 1 ? 'thing' : 'things'}`}
        </p>
      </div>
      <div className="page__foot">
        <PrimaryButton onClick={inbox.length > 0 ? onSort : add}>
          {inbox.length > 0 ? 'sort it' : 'add'}
        </PrimaryButton>
      </div>
    </div>
  )
}

/**
 * Phase two: each item once, three choices. "Never" deletes permanently — said
 * plainly before the first use, once, and never again.
 */
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
    setConfirming(false)
    onAckWarning()
    onSort('never')
  }

  return (
    <div className="page">
      <Back onBack={onBack} />
      <div className="page__fill">
        <ScreenTitle>{item}</ScreenTitle>
        {confirming && (
          <p className="bd__warn">Never deletes it for good. There is no undo.</p>
        )}
      </div>
      <div className="page__foot">
        <SecondaryAction onClick={() => { setConfirming(false); onSort('today') }}>today</SecondaryAction>
        <SecondaryAction onClick={() => { setConfirming(false); onSort('week') }}>this week</SecondaryAction>
        <SecondaryAction onClick={never}>{confirming ? 'yes, never' : 'never'}</SecondaryAction>
      </div>
    </div>
  )
}
