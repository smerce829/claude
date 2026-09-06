import { useState } from 'react'
import { PrimaryButton, SecondaryAction } from '../components/Controls'
import { Back, ScreenTitle, TextInput } from '../components/Shell'
import './DoomPile.css'

/** Entry: name the pile. */
export function DoomPileName(
  { onNamed, onBack }: { onNamed: (name: string) => void; onBack: () => void },
) {
  const [name, setName] = useState('')
  const go = () => { if (name.trim()) onNamed(name.trim()) }
  return (
    <div className="page">
      <Back onBack={onBack} />
      <div className="page__fill">
        <ScreenTitle>Name the pile</ScreenTitle>
        <TextInput value={name} onChange={setName} onEnter={go}
          label="Pile name" placeholder="the chair" />
      </div>
      <div className="page__foot">
        <PrimaryButton onClick={go}>next</PrimaryButton>
      </div>
    </div>
  )
}

/** List what is in it, one line at a time. */
export function DoomPileAdd(
  { name, items, onAdd, onStart, onBack }:
  { name: string; items: string[]; onAdd: (t: string) => void; onStart: () => void; onBack: () => void },
) {
  const [text, setText] = useState('')
  const add = () => { if (text.trim()) { onAdd(text.trim()); setText('') } }
  return (
    <div className="page">
      <Back onBack={onBack} />
      <div className="page__fill">
        <ScreenTitle>What's in {name}</ScreenTitle>
        <TextInput value={text} onChange={setText} onEnter={add}
          label="Item" placeholder="one thing" />
        <p className="dp__count">
          {items.length === 0 ? 'Nothing yet. Add something to start.' :
            `${items.length} ${items.length === 1 ? 'thing' : 'things'}`}
        </p>
      </div>
      <div className="page__foot">
        <PrimaryButton onClick={items.length > 0 ? onStart : add}>
          {items.length > 0 ? 'start sorting' : 'add'}
        </PrimaryButton>
      </div>
    </div>
  )
}

/**
 * One item at a time, four decisions. All four are secondary style: none is
 * primary, because none is the right answer.
 *
 * The deferred pile is hard-capped. When it is full the refusal is specific,
 * and it is never made configurable — the constraint is the product.
 */
export function DoomPileRun(
  { item, deferredFull, onDecide, onBack }:
  {
    item: string
    deferredFull: boolean
    onDecide: (d: 'keep' | 'bin' | 'relocate' | 'later') => void
    onBack: () => void
  },
) {
  const [refused, setRefused] = useState(false)

  const later = () => {
    if (deferredFull) { setRefused(true); return }
    setRefused(false)
    onDecide('later')
  }
  const decide = (d: 'keep' | 'bin' | 'relocate') => { setRefused(false); onDecide(d) }

  return (
    <div className="page">
      <Back onBack={onBack} />
      <div className="page__fill">
        <ScreenTitle>{item}</ScreenTitle>
        {refused && (
          <p className="dp__refused">
            The deferred pile is full. Clear one to defer another.
          </p>
        )}
      </div>
      <div className="dp__grid">
        <SecondaryAction onClick={() => decide('keep')}>keep</SecondaryAction>
        <SecondaryAction onClick={() => decide('bin')}>bin</SecondaryAction>
        <SecondaryAction onClick={() => decide('relocate')}>relocate</SecondaryAction>
        <SecondaryAction onClick={later}>decide later</SecondaryAction>
      </div>
    </div>
  )
}
