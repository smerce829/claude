import { useState } from 'react'
import { PrimaryButton, SecondaryAction } from '../components/Controls'
import { Back, ScreenTitle, TextInput } from '../components/Shell'
import './DoomPile.css'

/** Entry: name the pile. */
export function DoomPileName(
  { onNamed, deferredCount, onReview, onBack }:
  { onNamed: (name: string) => void; deferredCount: number; onReview: () => void; onBack: () => void },
) {
  const [name, setName] = useState('')
  const go = () => { if (name.trim()) onNamed(name.trim()) }
  return (
    <div className="page">
      <Back onBack={onBack} />
      <div className="page__fill">
        <ScreenTitle>Name this pile</ScreenTitle>
        <TextInput value={name} onChange={setName} onEnter={go}
          label="Name this pile" placeholder="e.g. desk, junk drawer, car" />
      </div>
      <div className="page__foot">
        <PrimaryButton onClick={go}>next</PrimaryButton>
        {/* The cap message tells the user to clear a deferred item; this is
            the only place that lets them. Hidden when the pile is empty. */}
        {deferredCount > 0 && (
          <SecondaryAction onClick={onReview}>review deferred ({deferredCount})</SecondaryAction>
        )}
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


/**
 * Deferred review. The same one-item loop, restricted to deferred items, with
 * three buttons instead of four — "decide later" is not a valid choice for
 * something already deferred once. Resolving an item frees a slot.
 */
export function DoomPileReview(
  { item, remaining, onDecide, onBack }:
  {
    item: string
    remaining: number
    onDecide: (d: 'keep' | 'bin' | 'relocate') => void
    onBack: () => void
  },
) {
  return (
    <div className="page">
      <Back onBack={onBack} />
      <div className="page__fill">
        <ScreenTitle>{item}</ScreenTitle>
        <p className="dp__count">{remaining} deferred</p>
      </div>
      <div className="dp__grid dp__grid--three">
        <SecondaryAction onClick={() => onDecide('keep')}>keep</SecondaryAction>
        <SecondaryAction onClick={() => onDecide('bin')}>bin</SecondaryAction>
        <SecondaryAction onClick={() => onDecide('relocate')}>relocate</SecondaryAction>
      </div>
    </div>
  )
}
