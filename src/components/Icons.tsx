/**
 * The app's icon set, drawn to match the logomark rather than imported.
 *
 * Lucide read as a friendly general-purpose line set; these are thinner
 * (1.5px against its 2px), squarer in the joins, and built from the same
 * arcs and right angles as the mark. Six marks plus share is the whole set —
 * per the design system, a seventh means that screen has grown too complex.
 *
 * Never coloured: they take currentColor and sit at ink or ink-muted.
 */
type P = { size?: number; label?: string; className?: string }

const base = (label?: string, className?: string) => ({
  width: 24, height: 24, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.5, strokeLinecap: 'square' as const, strokeLinejoin: 'miter' as const,
  className,
  role: label ? 'img' : 'presentation',
  'aria-label': label,
  'aria-hidden': label ? undefined : true,
})

export const IconBack = ({ size = 24, label, className }: P) => (
  <svg {...base(label, className)} width={size} height={size}><path d="M14.5 5 7.5 12l7 7" /></svg>
)

export const IconClose = ({ size = 24, label, className }: P) => (
  <svg {...base(label, className)} width={size} height={size}><path d="M6 6l12 12M18 6L6 18" /></svg>
)

/** A check drawn as two strokes of a gauge needle, not a rounded tick. */
export const IconCheck = ({ size = 24, label, className }: P) => (
  <svg {...base(label, className)} width={size} height={size}><path d="M4.5 12.5 9.5 17.5 19.5 6.5" /></svg>
)

/** Swap: the gauge arc, reopened, with the direction marked. */
export const IconSwap = ({ size = 24, label, className }: P) => (
  <svg {...base(label, className)} width={size} height={size}>
    <path d="M4.2 12a7.8 7.8 0 1 1 2.6 5.8" />
    <path d="M3 8.6V12h3.4" />
  </svg>
)

export const IconExport = ({ size = 24, label, className }: P) => (
  <svg {...base(label, className)} width={size} height={size}>
    <path d="M12 3.5v11" /><path d="M7.5 10.2 12 14.7l4.5-4.5" /><path d="M4.5 18.5h15" />
  </svg>
)

export const IconImport = ({ size = 24, label, className }: P) => (
  <svg {...base(label, className)} width={size} height={size}>
    <path d="M12 14.7v-11" /><path d="M7.5 8 12 3.5 16.5 8" /><path d="M4.5 18.5h15" />
  </svg>
)

/** iOS share, drawn to the same rules — the one mark outside the set of six,
 *  asked for by name in the install overlay spec. */
export const IconShare = ({ size = 24, label, className }: P) => (
  <svg {...base(label, className)} width={size} height={size}>
    <path d="M12 15V3.8" /><path d="M8.4 7.4 12 3.8l3.6 3.6" />
    <path d="M6.5 11H4.5v9h15v-9h-2" />
  </svg>
)
