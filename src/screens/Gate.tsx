import { useState } from 'react'
import { PrimaryButton } from '../components/Controls'
import { Mark } from '../components/Mark'
import { validateLicense } from '../lib/license'
import { ErrorState } from './ErrorState'
import type { ErrorKind } from './ErrorState'
import './Gate.css'

/**
 * One input: paste your key. The mark carries the identity so no wordmark is
 * needed, and the marketing name never appears here — the copy rule holds
 * inside the app, and this screen is inside the app.
 *
 * Failures are real screens, not inline red text under a field: an
 * unrecognised key and a check that could not run are different situations
 * and deserve different pages.
 */
export function Gate({ onValid }: { onValid: (key: string) => void }) {
  const [key, setKey] = useState('')
  const [failure, setFailure] = useState<ErrorKind | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (busy || key.trim() === '') return
    setBusy(true)
    const result = await validateLicense(key)
    setBusy(false)
    if (result.ok) { onValid(key.trim()); return }
    setFailure(
      result.reason === 'invalid' ? 'not-allowed'
      : result.reason === 'unconfigured' ? 'unconfigured'
      : navigator.onLine === false ? 'offline'
      : 'server',
    )
  }

  if (failure) {
    return (
      <ErrorState
        kind={failure}
        onAction={() => { setFailure(null); void submit() }}
        onSecondary={() => { setFailure(null); setKey('') }}
        secondaryLabel="use a different key"
      />
    )
  }

  return (
    <main className="gate">
      <div className="gate__body">
        <Mark size={36} />
        <p className="label">license key</p>
        <h1 className="gate__title">Paste your key</h1>
        <input
          className="gate__input"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void submit() }}
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          aria-label="License key"
          placeholder="XXXXXX-XXXXXX-XXXXXX"
        />
      </div>
      <div className="page__foot">
        <PrimaryButton onClick={() => void submit()}>start</PrimaryButton>
      </div>
    </main>
  )
}
