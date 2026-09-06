import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { PrimaryButton } from '../components/Controls'
import { Back, ScreenTitle, TextInput } from '../components/Shell'
import { formatCycle } from '../lib/payday'
import type { Bill } from '../lib/types'
import './Payday.css'

/** Common enough to be worth one tap. Never added without one. */
const COMMON = ['rent', 'phone', 'electricity', 'internet', 'car payment', 'insurance']

/**
 * One screen. Bills with a checkbox each, separated by dividers, cycle date at
 * the top. Not a budget app: no categories, no charts, no spending analysis,
 * no income tracking, no totals.
 */
export function Payday(
  { cycle, bills, onSetCycle, onToggle, onAdd, onRemove, onBack }:
  {
    cycle: number | null
    bills: Bill[]
    onSetCycle: (day: number) => void
    onToggle: (i: number) => void
    onAdd: (name: string) => void
    onRemove: (i: number) => void
    onBack: () => void
  },
) {
  const [day, setDay] = useState('')
  const [name, setName] = useState('')

  const saveCycle = () => {
    const n = parseInt(day, 10)
    if (n >= 1 && n <= 31) onSetCycle(n)
  }
  const add = () => { if (name.trim()) { onAdd(name.trim()); setName('') } }

  if (cycle === null) {
    return (
      <div className="page">
        <Back onBack={onBack} />
        <div className="page__fill">
          <ScreenTitle>What day are you paid</ScreenTitle>
          <TextInput value={day} onChange={setDay} onEnter={saveCycle}
            label="Day of the month" placeholder="25" />
          <p className="pd__hint">The day of the month, 1 to 31.</p>
        </div>
        <div className="page__foot">
          <PrimaryButton onClick={saveCycle}>save</PrimaryButton>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Back onBack={onBack} />
      <p className="pd__cycle">Next {formatCycle(cycle)}</p>

      <div className="pd__list">
        {bills.length === 0 && (
          <>
            <p className="pd__hint">Nothing here yet. Tap what you pay.</p>
            {/* Pre-populated so the screen is usable on the first visit rather
                than a blank input. Suggestions are one-tap adds, never
                pre-added — nobody should have to delete a bill they don't have. */}
            <div className="pd__suggest">
              {COMMON.filter((c) => !bills.some((b) => b.name === c)).map((c) => (
                <button key={c} className="pd__chip" onClick={() => onAdd(c)}>{c}</button>
              ))}
            </div>
          </>
        )}
        {bills.map((b, i) => (
          <div key={`${b.name}-${i}`} className={'pd__bill' + (b.paid ? ' pd__bill--paid' : '')}>
            <button className="pd__tick" onClick={() => onToggle(i)} aria-pressed={b.paid}>
              <span className="pd__name">{b.name}</span>
              <span className="pd__box" aria-hidden="true">
                {b.paid && <Check size={24} strokeWidth={2} />}
              </span>
            </button>
            {/* A mistyped bill would otherwise be permanent — there is no
                other way to correct this screen. */}
            <button className="pd__remove" onClick={() => onRemove(i)} aria-label={`Remove ${b.name}`}>
              <X size={24} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <div className="page__foot">
        <TextInput value={name} onChange={setName} onEnter={add}
          label="Bill name" placeholder="add a bill" />
      </div>
    </div>
  )
}
