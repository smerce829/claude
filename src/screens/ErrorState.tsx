import { PrimaryButton, SecondaryAction } from '../components/Controls'
import { Mark } from '../components/Mark'
import './ErrorState.css'

/**
 * Every failure in the app renders through here, so a dropped connection
 * reads the same at the licence gate as it does mid-session.
 *
 * The voice is the app's: sentence case, no apology, no illustration. Say
 * what happened, then what to do. The label above the message names the
 * condition the way an instrument would — it is the one place a user sees
 * the machine's own word for the state.
 */
export type ErrorKind =
  | 'not-found'
  | 'offline'
  | 'server'
  | 'maintenance'
  | 'not-allowed'
  | 'unconfigured'

const COPY: Record<ErrorKind, { label: string; title: string; body: string; action?: string }> = {
  'not-found': {
    label: 'not found',
    title: "That screen isn't here",
    body: 'The link points at something this app does not have.',
    action: 'go to start',
  },
  offline: {
    label: 'no connection',
    title: "You're offline",
    body: 'Everything you have already is still here and still works. Anything that needs the network will wait.',
    action: 'try again',
  },
  server: {
    label: 'server error',
    title: "The server didn't answer",
    body: 'Nothing on this phone was lost. Try again in a moment.',
    action: 'try again',
  },
  maintenance: {
    label: 'maintenance',
    title: 'Back shortly',
    body: 'The licence check is down for maintenance. Your data is on this phone and is not affected.',
    action: 'try again',
  },
  'not-allowed': {
    label: 'not allowed',
    title: "That key isn't valid here",
    body: 'It was not recognised. Check the purchase email it came in.',
  },
  unconfigured: {
    label: 'setup incomplete',
    title: 'This install is not finished',
    body: 'The licence check is not set up on this server, so it cannot verify anyone yet. If you bought this, contact support and quote setup incomplete.',
    action: 'try again',
  },
}

export function ErrorState(
  { kind, onAction, onSecondary, secondaryLabel }:
  {
    kind: ErrorKind
    onAction?: () => void
    onSecondary?: () => void
    secondaryLabel?: string
  },
) {
  const c = COPY[kind]
  return (
    <main className="err">
      <div className="err__body">
        <Mark size={36} />
        <p className="label">{c.label}</p>
        <h1 className="err__title">{c.title}</h1>
        <p className="err__text">{c.body}</p>
      </div>
      <div className="page__foot">
        {c.action && onAction && <PrimaryButton onClick={onAction}>{c.action}</PrimaryButton>}
        {onSecondary && secondaryLabel && (
          <SecondaryAction onClick={onSecondary}>{secondaryLabel}</SecondaryAction>
        )}
      </div>
    </main>
  )
}
