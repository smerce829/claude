import { Check } from 'lucide-react'
import { CompletionButton } from '../components/Controls'
import './Complete.css'

export function Complete({ onAgain, streak }: { onAgain: () => void; streak: number }) {
  return (
    <main className="page done">
      <div className="page__fill">
        <div className="done__mark" aria-hidden="true">
          <Check size={44} strokeWidth={3} />
        </div>
        <h1 className="done__word">Done.</h1>
        {streak > 1 && <p className="muted">{streak} days running.</p>}
      </div>
      <div className="page__foot">
        <CompletionButton onClick={onAgain}>Go again</CompletionButton>
      </div>
    </main>
  )
}
