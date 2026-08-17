import type { ReactNode } from 'react'
import { AlertTriangle, ChevronDown, Inbox } from 'lucide-react'
import { COLORS, MONO, RADIUS, SHADOW_SM } from '../theme'

/* ── Card ────────────────────────────────────────────────── */
export function Card({
  title,
  children,
  style,
  flex,
  titleColor = COLORS.muted,
  headerRight,
  noPad = false,
}: {
  title?: string
  children: ReactNode
  style?: React.CSSProperties
  flex?: string
  titleColor?: string
  headerRight?: ReactNode
  noPad?: boolean
}) {
  return (
    <div
      className="card-hover"
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.md,
        boxShadow: SHADOW_SM,
        flex: flex ?? '1',
        minWidth: 0,
        overflow: 'hidden',
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            padding: '11px 16px',
            borderBottom: `1px solid ${COLORS.border}66`,
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: '9.5px',
              letterSpacing: '1.8px',
              color: titleColor,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span
              style={{
                width: '2px',
                height: '12px',
                borderRadius: '2px',
                background: titleColor,
                display: 'inline-block',
                opacity: 0.85,
              }}
            />
            {title}
          </span>
          {headerRight}
        </div>
      )}
      <div style={{ padding: noPad ? 0 : '14px 16px' }}>{children}</div>
    </div>
  )
}

/* ── Panel (chart canvas) ────────────────────────────────── */
export function Panel({
  children,
  style,
}: {
  children: ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.md,
        boxShadow: SHADOW_SM,
        padding: '10px 12px',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ── Stat card ───────────────────────────────────────────── */
export function StatCard({
  label,
  value,
  accent,
  sub,
  trend,
}: {
  label: string
  value: ReactNode
  accent: string
  sub?: ReactNode
  trend?: { value: string; positive: boolean }
}) {
  return (
    <div
      className="card-hover"
      style={{
        position: 'relative',
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.md,
        boxShadow: SHADOW_SM,
        padding: '14px 18px 13px',
        flex: '1',
        minWidth: '130px',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: accent,
          opacity: 0.75,
        }}
      />
      <div
        style={{
          fontFamily: MONO,
          fontSize: '8.5px',
          letterSpacing: '1.8px',
          color: COLORS.dim,
          marginBottom: '7px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {label}
        {trend && (
          <span
            style={{
              fontFamily: MONO,
              fontSize: '9px',
              fontWeight: 600,
              color: trend.positive ? COLORS.green : COLORS.red,
            }}
          >
            {trend.value}
          </span>
        )}
      </div>
      <div
        className="kpi-value num"
        style={{
          fontSize: '21px',
          fontWeight: 600,
          color: COLORS.text,
          lineHeight: 1.2,
          letterSpacing: '-0.5px',
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: MONO,
            fontSize: '9px',
            letterSpacing: '1.2px',
            color: accent,
            marginTop: '5px',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}

/* ── Badge ───────────────────────────────────────────────── */
export function Badge({
  text,
  color,
  dot = false,
}: {
  text: string
  color: string
  dot?: boolean
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: `${color}14`,
        color,
        border: `1px solid ${color}40`,
        borderRadius: '5px',
        padding: '2px 8px',
        fontFamily: MONO,
        fontSize: '8.5px',
        letterSpacing: '1px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {dot && (
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: color,
            display: 'inline-block',
          }}
        />
      )}
      {text}
    </span>
  )
}

/* ── Page header ─────────────────────────────────────────── */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  controls,
  accent = COLORS.blue,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  controls?: ReactNode
  accent?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '18px',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ minWidth: 0 }}>
        {eyebrow && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              marginBottom: '5px',
            }}
          >
            <span
              style={{
                width: '14px',
                height: '2px',
                borderRadius: '1px',
                background: accent,
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontFamily: MONO,
                fontSize: '8.5px',
                letterSpacing: '2px',
                color: COLORS.dim,
              }}
            >
              {eyebrow}
            </span>
          </div>
        )}
        <h1
          style={{
            margin: 0,
            fontFamily: MONO,
            fontWeight: 600,
            fontSize: '16px',
            color: COLORS.text,
            letterSpacing: '2.5px',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <div
            style={{
              fontFamily: MONO,
              fontSize: '9px',
              color: COLORS.dim,
              marginTop: '5px',
              letterSpacing: '1px',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {controls && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {controls}
        </div>
      )}
    </div>
  )
}

/* ── Select ──────────────────────────────────────────────── */
export function Select({
  value,
  onChange,
  options,
  width,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
  width?: number
  ariaLabel?: string
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <select
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: width ?? 150,
          fontFamily: MONO,
          fontSize: '10.5px',
          letterSpacing: '0.5px',
          background: COLORS.elevated,
          color: COLORS.text,
          border: `1px solid ${COLORS.border}`,
          borderRadius: '7px',
          padding: '7px 30px 7px 11px',
          outline: 'none',
          cursor: 'pointer',
          appearance: 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = COLORS.blue
          e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,212,255,0.14)`
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = COLORS.border
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: COLORS.muted,
          pointerEvents: 'none',
        }}
        strokeWidth={2.2}
      />
    </div>
  )
}

/* ── Segmented control ───────────────────────────────────── */
export function Segmented({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
  ariaLabel?: string
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        padding: '2px',
        gap: '2px',
        background: COLORS.bg2,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '8px',
      }}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            style={{
              fontFamily: MONO,
              fontSize: '9.5px',
              letterSpacing: '1px',
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: active ? COLORS.blue : 'transparent',
              color: active ? '#04121a' : COLORS.muted,
              fontWeight: active ? 600 : 500,
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── Button ──────────────────────────────────────────────── */
export function Button({
  children,
  onClick,
  variant = 'primary',
  loading = false,
  disabled,
  type = 'button',
  ariaLabel,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
  ariaLabel?: string
}) {
  const isPrimary = variant === 'primary'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        padding: '8px 16px',
        fontFamily: MONO,
        fontSize: '9.5px',
        fontWeight: 600,
        letterSpacing: '1.5px',
        background: isPrimary ? COLORS.blue : COLORS.elevated,
        color: isPrimary ? '#04121a' : COLORS.text,
        border: isPrimary ? 'none' : `1px solid ${COLORS.border}`,
        borderRadius: '7px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'opacity 0.15s ease, transform 0.1s ease',
      }}
    >
      {loading && <Spinner inline size={12} color={isPrimary ? '#04121a' : COLORS.blue} />}
      {children}
    </button>
  )
}

/* ── Input ───────────────────────────────────────────────── */
export function Input({
  value,
  onChange,
  placeholder,
  onEnter,
  ariaLabel,
  width,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  onEnter?: () => void
  ariaLabel?: string
  width?: string | number
}) {
  return (
    <input
      type="text"
      value={value}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
      style={{
        flex: '1',
        minWidth: 0,
        width,
        padding: '8px 12px',
        fontFamily: MONO,
        fontSize: '11px',
        background: COLORS.elevated,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '7px',
        color: COLORS.text,
        outline: 'none',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = COLORS.blue
        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,212,255,0.14)`
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = COLORS.border
        e.currentTarget.style.boxShadow = 'none'
      }}
    />
  )
}

/* ── Skeleton ────────────────────────────────────────────── */
export function Skeleton({
  height = 14,
  width = '100%',
  radius = 5,
  style,
}: {
  height?: number | string
  width?: number | string
  radius?: number
  style?: React.CSSProperties
}) {
  return (
    <div className="skeleton" style={{ height, width, borderRadius: radius, ...style }} />
  )
}

/* ── Empty state ─────────────────────────────────────────── */
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '36px 20px',
        textAlign: 'center',
      }}
    >
      <Inbox size={26} strokeWidth={1.6} style={{ color: COLORS.dim }} />
      <div style={{ fontFamily: MONO, fontSize: '11px', color: COLORS.muted }}>{title}</div>
      {hint && (
        <div style={{ fontFamily: MONO, fontSize: '9.5px', color: COLORS.dim, maxWidth: 320 }}>
          {hint}
        </div>
      )}
      {action}
    </div>
  )
}

/* ── Error state ─────────────────────────────────────────── */
export function ErrorState({
  title = 'Unable to load data',
  hint,
  onRetry,
}: {
  title?: string
  hint?: string
  onRetry?: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '36px 20px',
        textAlign: 'center',
      }}
    >
      <AlertTriangle size={26} strokeWidth={1.6} style={{ color: COLORS.amber }} />
      <div style={{ fontFamily: MONO, fontSize: '11px', color: COLORS.text }}>{title}</div>
      {hint && (
        <div style={{ fontFamily: MONO, fontSize: '9.5px', color: COLORS.dim, maxWidth: 320 }}>
          {hint}
        </div>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: '6px',
            fontFamily: MONO,
            fontSize: '9.5px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            padding: '7px 14px',
            background: 'transparent',
            color: COLORS.blue,
            border: `1px solid ${COLORS.borderStrong}`,
            borderRadius: '7px',
            cursor: 'pointer',
            transition: 'background 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,212,255,0.08)'
            e.currentTarget.style.borderColor = COLORS.blue
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = COLORS.borderStrong
          }}
        >
          RETRY
        </button>
      )}
    </div>
  )
}

/* ── Table ───────────────────────────────────────────────── */
const thStyle: React.CSSProperties = {
  fontSize: '8.5px',
  color: COLORS.dim,
  letterSpacing: '1.8px',
  padding: '7px 10px',
  textAlign: 'left',
  borderBottom: `1px solid ${COLORS.border}`,
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  background: COLORS.card,
  zIndex: 1,
  fontWeight: 600,
}

const tdStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: '10.5px',
  padding: '7px 10px',
  borderBottom: `1px solid ${COLORS.border}30`,
}

export interface Cell {
  value: ReactNode
  color?: string
  right?: boolean
}

export function DataTable({
  headers,
  rows,
  maxHeight,
  hover = true,
}: {
  headers: string[]
  rows: Cell[][]
  maxHeight?: number
  hover?: boolean
}) {
  const table = (
    <table
      className={hover ? 'tbl-hover' : undefined}
      style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO }}
    >
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} style={thStyle}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((cells, i) => (
          <tr key={i}>
            {cells.map((cell, j) => (
              <td
                key={j}
                className={cell.right ? 'num' : undefined}
                style={{
                  ...tdStyle,
                  color: cell.color ?? COLORS.muted,
                  textAlign: cell.right ? 'right' : 'left',
                }}
              >
                {cell.value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )

  if (maxHeight) {
    return <div style={{ maxHeight, overflowY: 'auto' }}>{table}</div>
  }
  return table
}

/* ── Inline spinner ──────────────────────────────────────── */
export function Spinner({
  size = 22,
  color = COLORS.blue,
  inline = false,
}: {
  size?: number
  color?: string
  inline?: boolean
}) {
  const ring = (
    <div
      style={{
        width: size,
        height: size,
        border: `2.5px solid ${COLORS.elevated}`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.85s linear infinite',
        flexShrink: 0,
      }}
    />
  )
  if (inline) return ring
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '28px',
      }}
    >
      {ring}
    </div>
  )
}
