import './TimerBar.css'

/**
 * The instrument. Full-bleed at the top edge, depleting left to right.
 * No digits, no ring, no percentage — numbers create pressure, a shrinking
 * bar reads as information.
 *
 * Three things it does that a plain shrinking strip does not:
 *
 *  - It sits on a visible spent track, so the bar reads as a proportion of
 *    something rather than an unanchored length. This is the difference
 *    between "some time left" and "about a third left" at a glance.
 *  - Quarter ticks sit above it, so the eye lands on a position instead of
 *    estimating a width — the telemetry convention, and it costs no colour.
 *  - Inside the last tenth it thickens from 6px to 9px. Not a colour change,
 *    not a pulse, not a glow: a physical change you catch peripherally while
 *    your hands are busy and your eyes are on the room.
 */
export function TimerBar({ fraction, finished = false }: { fraction: number; finished?: boolean }) {
  const f = Math.max(0, Math.min(1, fraction))
  const ending = f > 0 && f <= 0.1

  return (
    <div
      className={
        'timerbar' + (ending ? ' timerbar--ending' : '') + (finished ? ' timerbar--done' : '')
      }
      role="presentation"
    >
      <div className="timerbar__track" />
      <div className="timerbar__fill" style={{ transform: `scaleX(${finished ? 1 : f})` }} />
      <div className="timerbar__ticks" aria-hidden="true">
        <span style={{ left: '25%' }} />
        <span style={{ left: '50%' }} />
        <span style={{ left: '75%' }} />
      </div>
    </div>
  )
}
