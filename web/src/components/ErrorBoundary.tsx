import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { COLORS, MONO, SANS } from '../theme'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '48px 24px',
            background: COLORS.card,
            borderRadius: '12px',
            border: `1px solid ${COLORS.border}`,
            minHeight: '200px',
          }}
        >
          <AlertTriangle size={28} color={COLORS.amber} />
          <div style={{ fontFamily: SANS, fontSize: '14px', fontWeight: 600, color: COLORS.text }}>
            Something went wrong
          </div>
          <div style={{ fontFamily: MONO, fontSize: '11px', color: COLORS.dim, textAlign: 'center', maxWidth: 400 }}>
            {this.state.error?.message || 'Unexpected error'}
          </div>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            style={{
              fontFamily: MONO,
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '1.5px',
              padding: '8px 16px',
              background: `${COLORS.blue}18`,
              color: COLORS.blue,
              border: `1px solid ${COLORS.blue}40`,
              borderRadius: '7px',
              cursor: 'pointer',
            }}
          >
            RELOAD
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
