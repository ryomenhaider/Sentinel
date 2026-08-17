import { useEffect, useMemo, useState } from 'react'
import type { Data, Layout } from 'plotly.js'
import { api } from '../api'
import type { AnomalyRow, PriceRow } from '../types'
import { COLORS, MONO, PLOT_BASE } from '../theme'
import PlotView from '../components/Plot'
import {
  Badge,
  Card,
  DataTable,
  ErrorState,
  PageHeader,
  Panel,
  Segmented,
  Select,
  Skeleton,
  StatCard,
} from '../components/ui'

const TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'BTC-USD', 'ETH-USD', 'SPY']
const DAY_OPTIONS = [
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
]
const SEVERITY_OPTIONS = [
  { label: 'ALL SEVERITY', value: 'all' },
  { label: 'CRITICAL', value: 'critical' },
  { label: 'HIGH', value: 'high' },
  { label: 'MEDIUM', value: 'medium' },
  { label: 'LOW', value: 'low' },
]

const SEV_COLORS: Record<string, string> = {
  critical: '#FF0055',
  high: COLORS.red,
  medium: COLORS.amber,
  low: COLORS.purple,
}

const dayOnly = (s: string) => s.slice(0, 10)

export default function Anomalies() {
  const [ticker, setTicker] = useState('AAPL')
  const [days, setDays] = useState('30')
  const [severity, setSeverity] = useState('all')
  const [prices, setPrices] = useState<PriceRow[] | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = () => {
    let cancelled = false
    setLoading(true)
    setError(false)
    ;(async () => {
      try {
        const [p, a] = await Promise.all([
          api.priceHistory(ticker, Number(days)),
          api.anomalies(ticker, Number(days)),
        ])
        if (!cancelled) {
          setPrices(p)
          setAnomalies(a ?? [])
        }
      } catch {
        if (!cancelled) {
          setPrices(null)
          setAnomalies([])
          setError(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }

  useEffect(load, [ticker, days])

  const { priceData, priceLayout, scoreData, scoreLayout, events, total, highs, avg } =
    useMemo(() => {
      const base: Partial<Layout> = PLOT_BASE
      const priceData: Data[] = []
      const scoreData: Data[] = []
      const events: AnomalyRow[] = []
      const empty = { priceData, scoreData, priceLayout: base, scoreLayout: base, events, total: '—', highs: '—', avg: '—' }

      if (!prices || prices.length === 0) return empty

      let an = [...anomalies]
      // dedupe: one anomaly per date, keep highest score
      const best = new Map<string, AnomalyRow>()
      for (const row of an) {
        const d = dayOnly(row.date ?? row.created_at ?? '')
        if (!d) continue
        const cur = best.get(d)
        if (!cur || (row.anomaly_score ?? 0) > (cur.anomaly_score ?? 0)) best.set(d, row)
      }
      an = [...best.values()]

      if (severity !== 'all') an = an.filter((r) => r.severity === severity)

      const sortedPrices = [...prices].sort((a, b) => a.date.localeCompare(b.date))
      const closeByDate = new Map<string, number>()
      for (const p of sortedPrices) closeByDate.set(dayOnly(p.date), Number(p.close))

      priceData.push({
        type: 'scatter',
        x: sortedPrices.map((p) => p.date),
        y: sortedPrices.map((p) => Number(p.close)),
        name: 'Close',
        mode: 'lines',
        line: { color: COLORS.blue, width: 1.5 },
      })

      for (const [sev, color] of Object.entries(SEV_COLORS)) {
        const grp = an
          .filter((r) => r.severity === sev)
          .filter((r) => closeByDate.has(dayOnly(r.date ?? r.created_at ?? '')))
        if (grp.length === 0) continue
        priceData.push({
          type: 'scatter',
          x: grp.map((r) => r.date ?? r.created_at ?? ''),
          y: grp
            .map((r) => closeByDate.get(dayOnly(r.date ?? r.created_at ?? '')))
            .filter((v): v is number => v !== undefined),
          mode: 'markers',
          name: sev.toUpperCase(),
          marker: { symbol: 'x', size: 12, color, line: { width: 2 } },
        })
      }

      const priceLayout: Partial<Layout> = {
        ...PLOT_BASE,
        height: 340,
        title: {
          text: `<b>${ticker}</b>  ·  Price + Anomaly Events`,
          font: { size: 12, color: COLORS.text },
        },
      }

      const anSorted = [...an].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
      if (anSorted.length > 0) {
        scoreData.push({
          type: 'scatter',
          x: anSorted.map((r) => r.date ?? r.created_at ?? ''),
          y: anSorted.map((r) => r.anomaly_score ?? 0),
          mode: 'lines+markers',
          line: { color: COLORS.red, width: 1.5 },
          marker: { size: 5, color: COLORS.amber },
          fill: 'tozeroy',
          fillcolor: 'rgba(255, 77, 109, 0.13)',
          name: 'Score',
        })
      }
      const scoreLayout: Partial<Layout> = {
        ...PLOT_BASE,
        height: 240,
        title: { text: 'ANOMALY SCORE  (0–1)', font: { size: 11, color: COLORS.muted } },
        yaxis: { ...(PLOT_BASE.yaxis as object), range: [0, 1] },
        shapes: [
          {
            type: 'line',
            xref: 'paper',
            x0: 0,
            x1: 1,
            yref: 'y',
            y0: 0.7,
            y1: 0.7,
            line: { color: COLORS.amber, dash: 'dot' },
          },
        ],
      }

      const sortedEvents = [...an].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
      events.push(...sortedEvents.slice(0, 20))

      const total = an.length
      const highs = an.filter((r) => r.severity === 'high' || r.severity === 'critical').length
      const scores = an.map((r) => r.anomaly_score).filter((s): s is number => s != null)
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null

      return {
        priceData,
        priceLayout,
        scoreData,
        scoreLayout,
        events: sortedEvents,
        total: String(total),
        highs: String(highs),
        avg: avg != null ? avg.toFixed(3) : '—',
      }
    }, [prices, anomalies, severity, ticker])

  const sevOf = (r: AnomalyRow) => (r.severity ?? 'low').toLowerCase()

  return (
    <div>
      <PageHeader
        eyebrow="ANALYSIS"
        title="ANOMALY INTELLIGENCE"
        subtitle="Isolation Forest · AutoEncoder · Ensemble Voting"
        controls={
          <>
            <Select value={ticker} onChange={setTicker} options={TICKERS.map((t) => ({ label: t, value: t }))} width={140} ariaLabel="Ticker" />
            <Segmented value={days} onChange={setDays} options={DAY_OPTIONS} ariaLabel="Time range" />
            <Select value={severity} onChange={setSeverity} options={SEVERITY_OPTIONS} width={130} ariaLabel="Severity" />
          </>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ flex: '1', minWidth: '130px', padding: '14px 18px', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
              <Skeleton width={70} height={9} style={{ marginBottom: 10 }} />
              <Skeleton width={80} height={22} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <StatCard label="TOTAL FLAGS" value={total} accent={COLORS.red} />
          <StatCard label="HIGH / CRITICAL" value={highs} accent={COLORS.amber} />
          <StatCard label="AVG SCORE" value={avg} accent={COLORS.purple} />
        </div>
      )}

      <Panel style={{ marginBottom: '20px' }}>
        {loading ? (
          <Skeleton height={340} radius={8} />
        ) : error ? (
          <ErrorState hint="The anomaly service didn't respond." onRetry={load} />
        ) : (
          <PlotView data={priceData} layout={priceLayout} />
        )}
      </Panel>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Card title="ANOMALY SCORE TIMELINE" style={{ flex: '1' }}>
          {loading ? (
            <Skeleton height={240} radius={8} />
          ) : error ? (
            <ErrorState onRetry={load} />
          ) : scoreData.length === 0 ? (
            <EmptyAnomalies />
          ) : (
            <PlotView data={scoreData} layout={scoreLayout} />
          )}
        </Card>
        <Card title="FLAGGED EVENTS" style={{ width: '440px', flex: 'none' }}>
          {loading ? (
            <Skeleton height={240} radius={8} />
          ) : events.length === 0 ? (
            <EmptyAnomalies />
          ) : (
            <DataTable
              maxHeight={264}
              headers={['TIMESTAMP', 'MODEL', 'SEVERITY', 'SCORE']}
              rows={events.map((r) => {
                const sev = sevOf(r)
                const color = SEV_COLORS[sev] ?? COLORS.muted
                return [
                  { value: (r.date ?? r.created_at ?? '—').slice(0, 16), color: COLORS.muted },
                  { value: r.model_used ?? '—', color: COLORS.text },
                  { value: <Badge text={sev.toUpperCase()} color={color} dot /> },
                  { value: (r.anomaly_score ?? 0).toFixed(3), color: COLORS.amber, right: true },
                ]
              })}
            />
          )}
        </Card>
      </div>
    </div>
  )
}

function EmptyAnomalies() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '30px 20px',
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: '11px',
          color: COLORS.green,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: COLORS.green, display: 'inline-block' }} />
        NO ANOMALIES DETECTED
      </span>
      <span style={{ fontFamily: MONO, fontSize: '9.5px', color: COLORS.dim }}>
        The window is clean — nothing flagged by the ensemble.
      </span>
    </div>
  )
}