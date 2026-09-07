import { useState } from 'react'
import { PrimaryButton } from '../components/Controls'
import { validateLicense } from '../lib/license'
import './Gate.css'

/** One input: paste your key. Failure states are specific, never generic. */
export function Gate({ onValid }: { onValid: (key: string) => void }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState<'invalid' | 'network' | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (busy || key.trim() === '') return
    setBusy(true)
    setError(null)
    const result = await validateLicense(key)
    setBusy(false)
    if (result.ok) onValid(key.trim())
    else setError(result.reason)
  }

  return (
    <main className="gate">
      <div className="gate__body">
        <p className="label">license key</p>
        <h1 className="gate__title">Paste your key</h1>
        <input
          className="gate__input"
          value={key}
          onChange={(e) => { setKey(e.target.value); setError(null) }}
          onKeyDown={(e) => { if (e.key === 'Enter') void submit() }}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="License key"
          aria-invalid={error !== null}
        />

        {error === 'invalid' && (
          <p className="gate__error">
            That key wasn't recognised. Check the purchase email it came in.
          </p>
        )}
        {error === 'network' && (
          <p className="gate__error">The check couldn't run. Try again.</p>
        )}
      </div>

      <PrimaryButton onClick={() => void submit()}>
        {error === 'network' ? 'retry' : 'start'}
      </PrimaryButton>
    </main>
  )
}
