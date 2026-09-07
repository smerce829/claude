import { CompletionButton, SecondaryAction } from '../components/Controls'
import './Complete.css'

/**
 * One state. The only screen where lime appears.
 * No stats, no summary, no streak, no confetti. The reward is that it is over.
 */
export function Complete(
  { onAgain, nudgeBackup, onBackup }:
  { onAgain: () => void; nudgeBackup?: boolean; onBackup?: () => void },
) {
  return (
    <main className="complete">
      <p className="complete__word">done</p>
      <div className="complete__controls">
        <CompletionButton onClick={onAgain}>go again</CompletionButton>
      {/* Uses the secondary-action slot, not a lime element — this screen is
          the only place lime appears and it belongs to "go again". */}
        {nudgeBackup && onBackup && (
          <SecondaryAction onClick={onBackup}>back up your data</SecondaryAction>
        )}
      </div>
    </main>
  )
}
