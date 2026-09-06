import { CompletionButton } from '../components/Controls'
import './Complete.css'

/**
 * One state. The only screen where lime appears.
 * No stats, no summary, no streak, no confetti. The reward is that it is over.
 */
export function Complete({ onAgain }: { onAgain: () => void }) {
  return (
    <main className="complete">
      <p className="complete__word">done</p>
      <CompletionButton onClick={onAgain}>go again</CompletionButton>
    </main>
  )
}
