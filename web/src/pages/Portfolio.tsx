import { useEffect, useMemo, useState } from 'react'
import type { Data, Layout } from 'plotly.js'
import { api } from '../api'
import type { WeightRow } from '../types'
import { COLORS, MONO, PLOT_BASE } from '../theme'
import PlotView from '../components/Plot'
import {
  Badge,
  Card,
  DataTable,
  ErrorState,
  PageHeader,
  Select,
  Skeleton,
  StatCard,
} from '../components/ui'

const METHOD_OPTIONS = [
  { label: 'Blended (40/40/20)', value: 'Blended' },
  { label: 'MPT (Max Sharpe)', value: 'mpt' },
  { label: 'Black-Litterman', value: 'black_litterman' },
  { label: 'Kelly Criterion', value: 'kelly' },
]

const PALETTE: Record<string, string> = {
  mpt: COLORS.blue,
  black_litterman: COLORS.green,
  kelly: COLORS.amber,
  Blended: COLORS.purple,
}

const RISK_FREE = 0.05
const TRADING_DAYS = 252

type RetMatrix = { tickers: string[]; dates: string[]; values: number[][] }

function logReturns(series: number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < series.length; i++) out.push(Math.log(series[i] / series[i - 1]))
  return out
}

function dirichletSample(n: number): number[] {
  const g = Array.from({ length: n }, () => -Math.log(Math.random()))
  const sum = g.reduce((a, b) => a + b, 0)
  return g.map((x) => x / sum)
}

export default function Portfolio() {
  const [method, setMethod] = useState('Blended')
  const [weights, setWeights] = useState<WeightRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [returns, setReturns] = useState<RetMatrix | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    ;(async () => {
      try {
        const w = await api.weights()
        if (!cancelled) setWeights(w ?? [])
      } catch {
        if (!cancelled) {
          setWeights([])
          setError(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const byMethod = useMemo(() => {
    const m: Record<string, Record<string, number>> = {}
    for (const row of weights) {
      const methodKey = row.method ?? 'unknown'
      const t = row.ticker
      if (!t) continue
      ;(m[methodKey] ??= {})[t] = Number(row.weight ?? 0)
    }
    return m
  }, [weights])

  const allTickers = useMemo(
    () => Array.from(new Set(weights.map((w) => w.ticker).filter((t): t is string => !!t))).sort(),
    [weights],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const series = new Map<string, Map<string, number>>()
        await Promise.all(
          allTickers.map(async (t) => {
            try {
              const d = await api.priceHistory(t, 252)
              series.set(t, new Map(d.map((r) => [r.date.slice(0, 10), Number(r.close)])))
            } catch {
              /* skip */
            }
          }),
        )
        if (cancelled) return
        const keySets = [...series.values()].map((m) => new Set(m.keys()))
        const dates = [...keySets[0] ?? []].filter((d) => keySets.every((s) => s.has(d))).sort()
        const tickers = [...series.keys()]
        const values = tickers.map((t) => dates.map((d) => series.get(t)!.get(d)!))
        const retValues = values.map(logReturns)
        setReturns({ tickers, dates, values: retValues })
      } catch {
        if (!cancelled) setReturns(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [allTickers])

  const { barData, barLayout, treeData, treeLayout, frontierData, frontierLayout, tableRows, kpis } =
    useMemo(() => {
      const emptyLayout: Partial<Layout> = { ...PLOT_BASE, height: 260 }
      const base = {
        barData: [] as Data[],
        barLayout: emptyLayout,
        treeData: [] as Data[],
        treeLayout: emptyLayout,
        frontierData: [] as Data[],
        frontierLayout: emptyLayout,
        tableRows: [] as WeightRow[],
        kpis: { sharpe: '—', var: '—', mdd: '—', beta: '—', sortino: '—' },
      }
      if (weights.length === 0) return base

      // ── Bar chart: all methods ──────────────────────────────────────────────
      const barData: Data[] = []
      if (byMethod && allTickers.length > 0) {
        for (const [m, d] of Object.entries(byMethod)) {
          barData.push({
            type: 'bar',
            name: m.toUpperCase(),
            x: allTickers,
            y: allTickers.map((t) => (d[t] ?? 0) * 100),
            marker: { color: PALETTE[m] ?? COLORS.blue, opacity: 0.85 },
          })
        }
      }
      const barLayout: Partial<Layout> = {
        ...PLOT_BASE,
        barmode: 'group',
        height: 300,
        yaxis: { ...(PLOT_BASE.yaxis as object), title: { text: 'Weight (%)' } },
        title: { text: 'ALLOCATION BY METHOD', font: { size: 11, color: COLORS.muted } },
      }

      // ── Treemap: selected method ────────────────────────────────────────────
      const selected = byMethod[method] ?? (Object.values(byMethod)[0] ?? {})
      const labels = Object.keys(selected)
      const treeValues = Object.values(selected).map((v) => v * 100)
      const treeData: Data[] = []
      const treeLayout: Partial<Layout> = {}
      if (labels.length > 0) {
        treeData.push({
          type: 'treemap',
          labels,
          parents: labels.map(() => ''),
          values: treeValues,
          textinfo: 'label+percent',
          textfont: { family: MONO, size: 12, color: COLORS.text },
          marker: {
            colors: treeValues,
            colorscale: [
              [0, COLORS.border],
              [1, COLORS.blue],
            ],
            line: { width: 2, color: COLORS.bg },
          },
        })
        treeLayout.paper_bgcolor = 'rgba(0,0,0,0)'
        treeLayout.margin = { l: 0, r: 0, t: 0, b: 0 }
        treeLayout.height = 280
      }

      // ── Efficient frontier + KPIs ───────────────────────────────────────────
      const frontierData: Data[] = []
      const frontierLayout: Partial<Layout> = { ...PLOT_BASE, height: 260 }
      const kpis = { sharpe: '—', var: '—', mdd: '—', beta: '—', sortino: '—' }

      if (returns && returns.tickers.length >= 2) {
        const n = returns.tickers.length
        const mu: number[] = returns.tickers.map((_, i) => {
          const r = returns.values[i]
          return (r.reduce((a, b) => a + b, 0) / r.length) * TRADING_DAYS
        })
        const cov: number[][] = []
        for (let i = 0; i < n; i++) {
          cov.push([])
          for (let j = 0; j < n; j++) {
            const a = returns.values[i]
            const b = returns.values[j]
            const meanA = mu[i] / TRADING_DAYS
            const meanB = mu[j] / TRADING_DAYS
            let s = 0
            for (let k = 0; k < a.length; k++) s += (a[k] - meanA) * (b[k] - meanB)
            cov[i].push((s / (a.length - 1)) * TRADING_DAYS)
          }
        }

        // Monte Carlo frontier
        const vols: number[] = []
        const rets: number[] = []
        for (let it = 0; it < 400; it++) {
          const w = dirichletSample(n)
          let r = 0
          let v2 = 0
          for (let i = 0; i < n; i++) {
            r += w[i] * mu[i]
            for (let j = 0; j < n; j++) v2 += w[i] * w[j] * cov[i][j]
          }
          vols.push(Math.sqrt(v2) * 100)
          rets.push(r * 100)
        }
        frontierData.push({
          type: 'scatter',
          x: vols,
          y: rets,
          mode: 'markers',
          marker: { size: 4, color: rets, colorscale: 'Viridis', opacity: 0.6 },
          name: 'Random Portfolios',
        })

        for (const [m, d] of Object.entries(byMethod)) {
          const w = returns.tickers.map((t) => d[t] ?? 0)
          if (w.reduce((a, b) => a + b, 0) <= 0) continue
          const wn = w.map((x) => x / w.reduce((a, b) => a + b, 0))
          let r = 0
          let v2 = 0
          for (let i = 0; i < n; i++) {
            r += wn[i] * mu[i]
            for (let j = 0; j < n; j++) v2 += wn[i] * wn[j] * cov[i][j]
          }
          const color = PALETTE[m] ?? COLORS.blue
          frontierData.push({
            type: 'scatter',
            x: [Math.sqrt(v2) * 100],
            y: [r * 100],
            mode: 'text+markers',
            name: m.toUpperCase(),
            text: [m.toUpperCase()],
            textposition: 'top center',
            textfont: { size: 9, color },
            marker: { size: 12, color, symbol: 'star' },
          })
        }
        frontierLayout.xaxis = { ...(PLOT_BASE.xaxis as object), title: { text: 'Volatility (%)' } }
        frontierLayout.yaxis = { ...(PLOT_BASE.yaxis as object), title: { text: 'Expected Return (%)' } }
        frontierLayout.title = { text: 'EFFICIENT FRONTIER', font: { size: 11, color: COLORS.muted } }

        // KPIs from daily series
        const wSel = returns.tickers.map((t) => selected[t] ?? 0)
        const wSum = wSel.reduce((a, b) => a + b, 0)
        if (wSum > 0 && Object.keys(selected).length > 0) {
          const wn = wSel.map((x) => x / wSum)
          const T = returns.values[0].length
          const port: number[] = []
          for (let k = 0; k < T; k++) {
            let s = 0
            for (let i = 0; i < n; i++) s += wn[i] * returns.values[i][k]
            port.push(s)
          }
          const annRet = (port.reduce((a, b) => a + b, 0) / T) * TRADING_DAYS
          const mean = annRet / TRADING_DAYS
          let variance = 0
          for (const r of port) variance += (r - mean) ** 2
          const std = Math.sqrt(variance / (T - 1))
          const annVol = std * Math.sqrt(TRADING_DAYS)
          kpis.sharpe = annVol > 0 ? ((annRet - RISK_FREE) / annVol).toFixed(2) : '0.00'

          const sorted = [...port].sort((a, b) => a - b)
          const var95 = sorted[Math.floor(T * 0.05)]
          kpis.var = `${(var95 * 100).toFixed(2)}%`

          let cum = 1
          let peak = 1
          let mdd = 0
          for (const r of port) {
            cum *= 1 + r
            peak = Math.max(peak, cum)
            mdd = Math.min(mdd, (cum - peak) / peak)
          }
          kpis.mdd = `${(mdd * 100).toFixed(1)}%`

          const market = returns.values[0].map((_, k) => {
            let s = 0
            for (let i = 0; i < n; i++) s += returns.values[i][k]
            return s / n
          })
          let mMean = 0
          for (const r of market) mMean += r
          mMean /= T
          let covPM = 0
          let varM = 0
          for (let k = 0; k < T; k++) {
            covPM += (port[k] - mean) * (market[k] - mMean)
            varM += (market[k] - mMean) ** 2
          }
          kpis.beta = varM > 0 ? (covPM / varM).toFixed(2) : '1.00'

          const downside = port.filter((r) => r < 0)
          if (downside.length > 0) {
            const dMean = downside.reduce((a, b) => a + b, 0) / downside.length
            let dv = 0
            for (const r of downside) dv += (r - dMean) ** 2
            const dVol = Math.sqrt(dv / downside.length) * Math.sqrt(TRADING_DAYS)
            kpis.sortino = dVol > 0 ? ((annRet - RISK_FREE) / dVol).toFixed(2) : '0.00'
          }
        }
      }

      // ── Weights table ───────────────────────────────────────────────────────
      const display = weights.filter((r) => r.method === method)
      const tableRows = [...(display.length ? display : weights)].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))

      return {
        barData,
        barLayout,
        treeData,
        treeLayout,
        frontierData,
        frontierLayout,
        tableRows,
        kpis,
      }
    }, [weights, byMethod, allTickers, method, returns])

  return (
    <div>
      <PageHeader
        eyebrow="STRATEGY"
        title="CAPITAL ALLOCATION ENGINE"
        subtitle="MPT · Black-Litterman · Kelly Criterion · 40/40/20 Blend"
        controls={<Select value={method} onChange={setMethod} options={METHOD_OPTIONS} width={220} ariaLabel="Optimization method" />}
      />

      {loading ? (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ flex: '1', minWidth: '120px', padding: '14px 18px', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
              <Skeleton width={64} height={9} style={{ marginBottom: 10 }} />
              <Skeleton width={80} height={22} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <StatCard label="SHARPE RATIO" value={kpis.sharpe} accent={COLORS.green} />
          <StatCard label="VAR (95%)" value={kpis.var} accent={COLORS.red} />
          <StatCard label="MAX DRAWDOWN" value={kpis.mdd} accent={COLORS.amber} />
          <StatCard label="PORTFOLIO BETA" value={kpis.beta} accent={COLORS.blue} />
          <StatCard label="SORTINO" value={kpis.sortino} accent={COLORS.purple} />
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Card title="WEIGHT COMPARISON — MPT · BL · KELLY" style={{ flex: '2' }}>
          {loading ? (
            <Skeleton height={300} radius={8} />
          ) : error ? (
            <ErrorState hint="The portfolio service didn't respond." onRetry={() => {}} />
          ) : (
            <PlotView data={barData} layout={barLayout} />
          )}
        </Card>
        <Card title="ALLOCATION TREEMAP" style={{ flex: '1' }}>
          {loading ? (
            <Skeleton height={280} radius={8} />
          ) : error ? (
            <ErrorState />
          ) : (
            <PlotView data={treeData} layout={treeLayout} />
          )}
        </Card>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Card title="EFFICIENT FRONTIER" style={{ flex: '1' }}>
          {loading ? (
            <Skeleton height={260} radius={8} />
          ) : error ? (
            <ErrorState />
          ) : (
            <PlotView data={frontierData} layout={frontierLayout} />
          )}
        </Card>
        <Card title="PORTFOLIO WEIGHTS" style={{ width: '400px', flex: 'none' }}>
          {loading ? (
            <Skeleton height={260} radius={8} />
          ) : tableRows.length === 0 ? (
            <div style={{ color: COLORS.dim, fontFamily: MONO, fontSize: '11px', padding: '16px' }}>
              No weights available
            </div>
          ) : (
            <DataTable
              maxHeight={286}
              headers={['TICKER', 'WEIGHT', 'METHOD', 'CALCULATED']}
              rows={tableRows.map((r) => {
                const m = r.method ?? '—'
                return [
                  { value: r.ticker ?? '—', color: COLORS.text },
                  { value: `${((r.weight ?? 0) * 100).toFixed(1)}%`, color: COLORS.blue, right: true },
                  { value: <Badge text={m.toUpperCase()} color={PALETTE[m] ?? COLORS.muted} /> },
                  { value: (r.calculated_at ?? '—').slice(0, 10), color: COLORS.dim },
                ]
              })}
            />
          )}
        </Card>
      </div>
    </div>
  )
}