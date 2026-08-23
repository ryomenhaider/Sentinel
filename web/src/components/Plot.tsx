import { Suspense, lazy, useMemo } from 'react'
import { Download } from 'lucide-react'
import type { Data, Layout, Config } from 'plotly.js'
import { COLORS, MONO } from '../theme'
import { Skeleton } from './ui'

const Plotly = lazy(() => import('react-plotly.js'))

interface PlotProps {
  data: Data[]
  layout?: Partial<Layout>
  style?: React.CSSProperties
  title?: string
}

export default function PlotView({ data, layout, style, title }: PlotProps) {
  const finalLayout = useMemo<Partial<Layout>>(
    () => ({ autosize: true, ...layout }),
    [layout],
  )
  const config = useMemo<Partial<Config>>(
    () => ({ displayModeBar: false, responsive: true }),
    [],
  )

  const handleExport = () => {
    import('plotly.js-dist-min').then((PlotlyMod) => {
      PlotlyMod.default.downloadImage('.js-plotly-plot', {
        format: 'png',
        width: 1200,
        height: 600,
        filename: `sentinel-${title || 'chart'}-${new Date().toISOString().slice(0, 10)}`,
      })
    })
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {title && (
        <button
          type="button"
          onClick={handleExport}
          title="Export chart as PNG"
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: `${COLORS.elevated}cc`,
            border: `1px solid ${COLORS.border}88`,
            borderRadius: '5px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontFamily: MONO,
            fontSize: '8.5px',
            letterSpacing: '0.8px',
            color: COLORS.dim,
            transition: 'color 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = COLORS.text
            e.currentTarget.style.borderColor = COLORS.borderStrong
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = COLORS.dim
            e.currentTarget.style.borderColor = `${COLORS.border}88`
          }}
        >
          <Download size={10} />
          PNG
        </button>
      )}
      <Suspense
        fallback={
          <Skeleton
            height={finalLayout?.height ?? 400}
            radius={8}
            style={{ width: '100%' }}
          />
        }
      >
        <Plotly
          data={data}
          layout={finalLayout}
          config={config}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '100%',
            ...style,
          }}
          useResizeHandler
        />
      </Suspense>
    </div>
  )
}

export type { Data, Layout, Config }
