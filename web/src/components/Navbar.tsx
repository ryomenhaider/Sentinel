import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { CandlestickChart, Radar, TrendingUp, PieChart, MessageSquareText, Shield } from 'lucide-react'
import { COLORS, MONO } from '../theme'

interface NavItem {
  icon: LucideIcon
  label: string
  to: string
}

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'ANALYSIS',
    items: [
      { icon: CandlestickChart, label: 'MARKET', to: '/' },
      { icon: Radar, label: 'ANOMALY', to: '/anomalies' },
      { icon: TrendingUp, label: 'FORECAST', to: '/forecasts' },
    ],
  },
  {
    title: 'STRATEGY',
    items: [
      { icon: PieChart, label: 'PORTFOLIO', to: '/portfolio' },
      { icon: MessageSquareText, label: 'SENTIMENT', to: '/sentiment' },
    ],
  },
]

const ALL_ITEMS = GROUPS.flatMap((g) => g.items)

function useHealth() {
  const [status, setStatus] = useState<{ label: string; color: string; version?: string }>({
    label: 'LIVE',
    color: COLORS.green,
  })

  useEffect(() => {
    let cancelled = false
    const ping = async () => {
      try {
        const r = await fetch('/api/health', { headers: { Accept: 'application/json' } })
        if (cancelled) return
        if (r.ok) {
          const j = await r.json().catch(() => null)
          setStatus({
            label: 'LIVE',
            color: COLORS.green,
            version: j?.version ?? undefined,
          })
        } else {
          setStatus({ label: 'DEGRADED', color: COLORS.amber })
        }
      } catch {
        if (!cancelled) setStatus({ label: 'OFFLINE', color: COLORS.red })
      }
    }
    ping()
    const id = setInterval(ping, 30_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return status
}

export function Navbar() {
  const health = useHealth()
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `sb-item${isActive ? ' sb-active' : ''}`

  return (
    <>
      <aside className="sb">
        <div className="sb-logo">
          <span className="sb-logo-mark">
            <Shield size={16} strokeWidth={2} />
          </span>
          <span>
            <div className="sb-logo-name">SENTINEL</div>
            <div className="sb-logo-sub">FINANCIAL INTELLIGENCE</div>
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {GROUPS.map((group) => (
            <div key={group.title}>
              <div className="sb-group">{group.title}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={linkClass}
                >
                  <span className="sb-ico">
                    <item.icon size={15} strokeWidth={2} />
                  </span>
                  <span className="sb-lbl">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sb-status">
          <span
            className="sb-status-dot"
            style={{ background: health.color, boxShadow: `0 0 8px ${health.color}66` }}
          />
          <span className="sb-status-txt" style={{ color: health.color }}>
            {health.label}
            {health.version ? ` · v${health.version}` : ''}
          </span>
        </div>
      </aside>

      <nav className="mobile-nav" aria-label="Primary">
        {ALL_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={linkClass}
            aria-label={item.label}
          >
            <item.icon size={19} strokeWidth={1.8} />
            <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '1px' }}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export default Navbar