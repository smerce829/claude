import './Mark.css'

/**
 * The logomark: a gauge arc that deliberately does not close, with a single
 * lime dot sitting in the gap.
 *
 * It is the same vocabulary as everything else — the timer bar is a gauge
 * that empties, the deferred count is a gauge that fills, and the arc is
 * those distilled. The gap is the point: the product exists for the part
 * that isn't finished, and lime marks it because lime means "done" here and
 * the dot is where done isn't yet.
 *
 * No wordmark. At icon sizes text is noise.
 */
export function Mark({ size = 40, title }: { size?: number; title?: string }) {
  // 300° of arc from -135°, leaving a 60° gap at the lower right.
  const r = 34
  const c = 50
  const start = (-135 * Math.PI) / 180
  const end = (165 * Math.PI) / 180
  const x1 = c + r * Math.cos(start)
  const y1 = c + r * Math.sin(start)
  const x2 = c + r * Math.cos(end)
  const y2 = c + r * Math.sin(end)

  return (
    <svg
      className="mark"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${x2} ${y2}`}
        fill="none"
        stroke="var(--cyan)"
        strokeWidth="7"
        strokeLinecap="butt"
      />
      {/* The dot sits on the arc's own radius, centred in the gap. */}
      <circle cx={c + r * Math.cos((15 * Math.PI) / 180)}
              cy={c + r * Math.sin((15 * Math.PI) / 180)}
              r="6" fill="var(--lime)" />
    </svg>
  )
}
