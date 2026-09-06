import './TimerBar.css'

/**
 * Full-bleed, top edge, 6px, depleting left to right.
 * No digits, no ring, no percentage — numbers create pressure, a shrinking
 * bar reads as information.
 *
 * Driven by transform, not width: the value changes every animation frame, and
 * scaleX stays on the compositor instead of forcing layout 60 times a second.
 * No CSS transition — the rAF loop already supplies every intermediate value,
 * and a transition on top of it fights the loop rather than smoothing it.
 */
export function TimerBar({ fraction }: { fraction: number }) {
  const f = Math.max(0, Math.min(1, fraction))
  return (
    <div className="timerbar" role="presentation">
      <div className="timerbar__fill" style={{ transform: `scaleX(${f})` }} />
    </div>
  )
}
