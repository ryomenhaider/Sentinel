import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, X, Wifi, WifiOff } from 'lucide-react'
import { COLORS, MONO, SANS } from '../theme'

interface Alert {
  type: string
  ticker?: string
  severity?: string
  message?: string
  score?: number
  timestamp?: string
}

export function AlertToast() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [connected, setConnected] = useState(false)

  const dismiss = useCallback((idx: number) => {
    setAlerts((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  useEffect(() => {
    let es: EventSource | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      es = new EventSource('/api/v1/stream/alerts')
      es.onopen = () => setConnected(true)
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'connected') return
          setAlerts((prev) => [...prev.slice(-4), data])
        } catch {
          /* ignore malformed */
        }
      }
      es.onerror = () => {
        setConnected(false)
        es?.close()
        retryTimer = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      es?.close()
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [])

  if (alerts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '380px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: MONO,
          fontSize: '8px',
          letterSpacing: '1px',
          color: connected ? COLORS.green : COLORS.red,
          padding: '0 4px',
        }}
      >
        {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
        {connected ? 'LIVE' : 'RECONNECTING...'}
      </div>
      {alerts.map((alert, i) => (
        <div
          key={`${alert.timestamp}-${i}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 14px',
            background: `${COLORS.red}12`,
            border: `1px solid ${COLORS.red}35`,
            borderRadius: '8px',
            backdropFilter: 'blur(12px)',
            animation: 'slideIn 0.3s ease',
          }}
        >
          <AlertTriangle size={14} color={COLORS.red} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: SANS, fontSize: '11px', fontWeight: 600, color: COLORS.text }}>
              {alert.ticker ? `${alert.ticker} — ${(alert.severity ?? 'unknown').toUpperCase()}` : 'Alert'}
            </div>
            {alert.message && (
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: '9.5px',
                  color: COLORS.dim,
                  marginTop: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {alert.message}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(i)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              flexShrink: 0,
            }}
          >
            <X size={11} color={COLORS.dim} />
          </button>
        </div>
      ))}
    </div>
  )
}
