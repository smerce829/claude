import { useState } from 'react'
import { PrimaryButton, SecondaryAction } from '../components/Controls'
import { Back, ScreenTitle, Steps, TextInput } from '../components/Shell'
import './DoomPile.css'

export function DoomPileName(
  { onNamed, onBack }: { onNamed: (name: string) => void; onBack: () => void },
) {
  const [name, setName] = useState('')
  const go = () => { if (name.trim()) onNamed(name.trim()) }
  return (
    <main className="page">
      <Back onBack={onBack} />
      <div className="page__fill">
        <ScreenTitle>Name the pile</ScreenTitle>
        <p className="muted">The chair. The counter. That corner.</p>
        <TextInput value={name} onChange={setName} onEnter={go} label="Pile name" placeholder="the chair" />
      </div>
      <div className="page__foot"><PrimaryButton onClick={go}>Next</PrimaryButton></div>
    </main>
  )
}

export function DoomPileAdd(
  { name, items, onAdd, onStart, onBack }:
  { name: string; items: string[]; onAdd: (t: string) => void; onStart: () => void; onBack: () => void },
) {
  const [text, setText] = useState('')
  const add = () => { if (text.trim()) { onAdd(text.trim()); setText('') } }
  return (
    <main className="page">
      <Back onBack={onBack} />
      <div className="page__fill">
        <ScreenTitle>What's in {name}?</ScreenTitle>
        <TextInput value={text} onChange={setText} onEnter={add} label="Item" placeholder="one thing" />
        {items.length === 0
          ? <p className="muted">Nothing yet. Add one thing to start.</p>
          : <div className="dp__chips">
              {items.map((it, i) => <span key={`${it}-${i}`} className="dp__chip">{it}</span>)}
            </div>}
      </div>
      <div className="page__foot">
        <PrimaryButton onClick={items.length > 0 ? onStart : add}>
          {items.length > 0 ? `Sort ${items.length}` : 'Add'}
        </PrimaryButton>
      </div>
    </main>
  )
}

/**
 * Two binary questions resolve to the same four outcomes the engine already
 * stores, so the decision logic and the deferral cap are unchanged — only the
 * way the question is asked has changed.
 *
 *   1. Trash, or keep it?          -> bin | continue
 *   2. Lives here, or elsewhere?   -> keep | relocate
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
  const [step, setStep] = useState<1 | 2>(1)
  const [refused, setRefused] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const settle = (d: 'keep' | 'bin' | 'relocate') => {
    setLeaving(true)
    window.setTimeout(() => { setLeaving(false); setStep(1); setRefused(false); onDecide(d) }, 160)
  }

  const later = () => {
    if (deferredFull) { setRefused(true); return }
    setRefused(false); setStep(1); onDecide('later')
  }

  return (
    <main className="page dp">
      <div className="dp__top">
        <Back onBack={onBack} />
        <Steps current={step} total={2} />
      </div>

      <div className="page__fill">
        <div className={'dp__card glass' + (leaving ? ' dp__card--out' : '')} key={item + step}>
          <p className="dp__item">{item}</p>
          <p className="dp__q">{step === 1 ? 'Is it rubbish?' : 'Does it live in this room?'}</p>
        </div>

        {refused && (
          <p className="dp__refused">
            Deferred pile is full. Clear one to defer another.
          </p>
        )}

        <div className="dp__choices">
          {step === 1 ? (
            <>
              <button className="dp__choice dp__choice--no" onClick={() => settle('bin')}>
                <span className="dp__emoji" aria-hidden="true">🗑️</span>
                <span>Trash</span>
              </button>
              <button className="dp__choice dp__choice--yes" onClick={() => setStep(2)}>
                <span className="dp__emoji" aria-hidden="true">📦</span>
                <span>Keep</span>
              </button>
            </>
          ) : (
            <>
              <button className="dp__choice dp__choice--yes" onClick={() => settle('keep')}>
                <span className="dp__emoji" aria-hidden="true">🏠</span>
                <span>Lives here</span>
              </button>
              <button className="dp__choice dp__choice--no" onClick={() => settle('relocate')}>
                <span className="dp__emoji" aria-hidden="true">📍</span>
                <span>Elsewhere</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="page__foot">
        <SecondaryAction onClick={later}>Decide later</SecondaryAction>
      </div>
    </main>
  )
}
