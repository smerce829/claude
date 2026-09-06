import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { ChoiceTile, PrimaryButton } from '../components/Controls'
import { Back, ScreenTitle, TextInput } from '../components/Shell'
import { FREQUENCY_TILES, formatCycle, visibleBills } from '../lib/payday'
import type { Bill, Frequency, State } from '../lib/types'
import './Payday.css'

/** Common enough to be worth one tap. Never added without one. */
const COMMON = ['rent', 'phone', 'electricity', 'internet', 'car payment', 'insurance']

function Row(
  { bill, onToggle, onRemove }:
  { bill: Bill; onToggle: () => void; onRemove: () => void },
) {
  return (
    <div className={'pd__bill' + (bill.checked ? ' pd__bill--paid' : '')}>
      <button className="pd__tick" onClick={onToggle} aria-pressed={bill.checked}>
        <span className="pd__name">{bill.name}</span>
        <span className="pd__box" aria-hidden="true">
          {bill.checked && <Check size={24} strokeWidth={2} />}
        </span>
      </button>
      <button className="pd__remove" onClick={onRemove} aria-label={`Remove ${bill.name}`}>
        <X size={24} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  )
}

/**
 * One screen. Bills with a checkbox each, separated by dividers, cycle date at
 * the top. Not a budget app: no categories, no charts, no totals, no amounts.
 *
 * Bills carried over from a previous cycle sit above the divider, with no
 * styling beyond that position — still ink text, still a plain checkbox.
 */
export function Payday(
  { payday, onSetCycle, onToggle, onAdd, onRemove, onBack }:
  {
    payday: State['payday']
    onSetCycle: (day: number) => void
    onToggle: (name: string) => void
    onAdd: (name: string, frequency: Frequency, months?: number) => void
    onRemove: (name: string) => void
    onBack: () => void
  },
) {
  const [day, setDay] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  const [name, setName] = useState('')

  const saveCycle = () => {
    const n = parseInt(day, 10)
    if (n >= 1 && n <= 31) onSetCycle(n)
  }

  if (payday.cycle === null) {
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

  // Asking how often it repeats is the second half of adding a bill, so it
  // replaces the screen rather than stacking on top of it.
  if (pending !== null) {
    return (
      <div className="page">
        <Back onBack={() => setPending(null)} />
        <div className="page__fill">
          <ScreenTitle>How often is {pending} due</ScreenTitle>
          <div className="pd__freq" role="group" aria-label="How often">
            {FREQUENCY_TILES.map((t) => (
              <ChoiceTile
                key={t.label}
                label={t.label}
                selected={false}
                onClick={() => { onAdd(pending, t.frequency, t.months); setPending(null) }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const { carried, due } = visibleBills(payday)
  const unadded = COMMON.filter((c) => !payday.bills.some((b) => b.name === c))

  return (
    <div className="page">
      <Back onBack={onBack} />
      <p className="pd__cycle">Next {formatCycle(payday.cycle)}</p>

      <div className="pd__list">
        {carried.map((b) => (
          <Row key={b.name} bill={b} onToggle={() => onToggle(b.name)} onRemove={() => onRemove(b.name)} />
        ))}
        {carried.length > 0 && due.length > 0 && <hr className="divider" />}
        {due.map((b) => (
          <Row key={b.name} bill={b} onToggle={() => onToggle(b.name)} onRemove={() => onRemove(b.name)} />
        ))}
        {carried.length === 0 && due.length === 0 && (
          <p className="pd__hint">Nothing due. Add a bill to start.</p>
        )}
      </div>

      <div className="page__foot">
        {unadded.length > 0 && (
          <div className="pd__suggest">
            {unadded.map((c) => (
              <button key={c} className="pd__chip" onClick={() => setPending(c)}>{c}</button>
            ))}
          </div>
        )}
        <TextInput
          value={name}
          onChange={setName}
          onEnter={() => { if (name.trim()) { setPending(name.trim()); setName('') } }}
          label="Bill name"
          placeholder="add a bill"
        />
      </div>
    </div>
  )
}
