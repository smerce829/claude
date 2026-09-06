import { useEffect, useRef, useState } from 'react'

/**
 * Elapsed time is always computed from a stored wall-clock timestamp, never by
 * incrementing a counter. Mobile browsers throttle or suspend timers in
 * background tabs, so a counter silently drifts — the spec calls this the most
 * likely thing to break after launch.
 *
 * The repaint loop only decides *when* to re-read the clock. It never decides
 * what the value is.
 */
function compute(startedAt: number | null, durationMs: number): number {
  if (startedAt === null) return durationMs
  return Math.max(0, durationMs - (Date.now() - startedAt))
}

export function useTimer(startedAt: number | null, durationMs: number) {
  const [remaining, setRemaining] = useState(() => compute(startedAt, durationMs))
  const frame = useRef<number | null>(null)
  const inputs = useRef({ startedAt, durationMs })

  // Re-read the clock during the same render that starts the timer. Waiting
  // for the effect would leave `remaining` at its previous value for one
  // frame, which reads as expired and skips the task screen entirely.
  if (inputs.current.startedAt !== startedAt || inputs.current.durationMs !== durationMs) {
    inputs.current = { startedAt, durationMs }
    setRemaining(compute(startedAt, durationMs))
  }

  useEffect(() => {
    if (startedAt === null) return

    const read = () => compute(startedAt, durationMs)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      // Step in one-second jumps rather than animating continuously.
      const id = window.setInterval(() => {
        const r = read()
        setRemaining(r)
        if (r <= 0) window.clearInterval(id)
      }, 1000)
      return () => window.clearInterval(id)
    }

    const tick = () => {
      const r = read()
      setRemaining(r)
      if (r > 0) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)

    // Returning from a backgrounded tab: recompute at once rather than waiting
    // for the next frame, so the bar never shows a stale position.
    const onVisible = () => { if (!document.hidden) setRemaining(read()) }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [startedAt, durationMs])

  return {
    remaining,
    /** 1 at start, 0 at end. */
    fraction: durationMs > 0 ? remaining / durationMs : 0,
    expired: startedAt !== null && remaining <= 0,
  }
}
