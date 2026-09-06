import './RadialTimer.css'

const R = 86
const C = 2 * Math.PI * R

/**
 * SVG radial ring. `fraction` is 1 at the start and 0 at the end; the ring
 * empties clockwise from twelve o'clock.
 *
 * The value still comes from the timestamp-based hook — the ring only draws it.
 */
export function RadialTimer({ fraction, remainingMs }: { fraction: number; remainingMs: number }) {
  const f = Math.max(0, Math.min(1, fraction))
  const total = Math.max(0, Math.ceil(remainingMs / 1000))
  const mm = Math.floor(total / 60)
  const ss = String(total % 60).padStart(2, '0')

  return (
    <div className="ring" role="timer" aria-label={`${mm} minutes ${ss} seconds left`}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle className="ring__track" cx="100" cy="100" r={R} />
        <circle
          className="ring__fill"
          cx="100" cy="100" r={R}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - f)}
        />
      </svg>
      <div className="ring__read">
        <span className="ring__time">{mm}:{ss}</span>
        <span className="ring__cap">left</span>
      </div>
    </div>
  )
}
