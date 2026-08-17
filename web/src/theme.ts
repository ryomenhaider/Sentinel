export const COLORS = {
  bg: '#070B12',
  bg2: '#0A0F1A',
  card: '#0E1522',
  cardHover: '#121A2B',
  elevated: '#182132',
  border: '#1B2940',
  borderStrong: '#2A3D5F',
  blue: '#00D4FF',
  green: '#00FF94',
  red: '#FF4D6D',
  amber: '#FFB800',
  purple: '#A855F7',
  text: '#E8EDF5',
  muted: '#8B9AB3',
  dim: '#5C6B85',
} as const

export const MONO = "'IBM Plex Mono',monospace"
export const SANS = "'IBM Plex Sans',sans-serif"

export const RADIUS = { sm: 6, md: 10, lg: 14 } as const

export const SPACE = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
} as const

export const FONT = {
  caption: 10,
  small: 11,
  body: 12.5,
  label: 13,
  title: 18,
  display: 24,
} as const

export const SHADOW_SM = '0 1px 2px rgba(0, 0, 0, 0.25)'
export const SHADOW_MD = '0 8px 24px rgba(0, 0, 0, 0.4)'

export const TRANSITION = 'all 0.18s ease'

export const GLOW: Record<string, string> = {
  [COLORS.blue]: 'rgba(0, 212, 255, 0.35)',
  [COLORS.green]: 'rgba(0, 255, 148, 0.3)',
  [COLORS.red]: 'rgba(255, 77, 109, 0.3)',
  [COLORS.amber]: 'rgba(255, 184, 0, 0.3)',
  [COLORS.purple]: 'rgba(168, 85, 247, 0.3)',
}

export const PLOT_BASE: Record<string, unknown> = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: COLORS.bg,
  font: { color: COLORS.text, family: MONO, size: 10 },
  xaxis: {
    gridcolor: 'rgba(27, 41, 64, 0.6)',
    linecolor: COLORS.border,
    tickfont: { color: COLORS.muted, size: 9 },
    zerolinecolor: COLORS.border,
    automargin: true,
  },
  yaxis: {
    gridcolor: 'rgba(27, 41, 64, 0.6)',
    linecolor: COLORS.border,
    tickfont: { color: COLORS.muted, size: 9 },
    zerolinecolor: COLORS.border,
    automargin: true,
  },
  margin: { l: 55, r: 20, t: 40, b: 45 },
  legend: {
    bgcolor: 'rgba(24, 33, 50, 0.9)',
    bordercolor: COLORS.border,
    font: { color: COLORS.muted },
    orientation: 'h',
    x: 0,
    y: 1.12,
  },
  hoverlabel: {
    bgcolor: COLORS.elevated,
    bordercolor: COLORS.borderStrong,
    font: { color: COLORS.text, family: MONO },
  },
}
