import { useMemo } from 'react'
import Plot from 'react-plotly.js'
import type { Layout, Config, Data } from 'plotly.js'

interface PlotProps {
  data: Data[]
  layout?: Partial<Layout>
  style?: React.CSSProperties
}

export default function PlotView({ data, layout, style }: PlotProps) {
  const finalLayout = useMemo<Partial<Layout>>(
    () => ({ autosize: true, ...layout }),
    [layout],
  )
  const config = useMemo<Partial<Config>>(
    () => ({ displayModeBar: false, responsive: true }),
    [],
  )
  return (
    <Plot
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
  )
}
