import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Data, Layout } from 'plotly.js'
import { api } from '../api'
import type { PriceRow } from '../types'
import { COLORS, MONO, PLOT_BASE } from '../theme'
import PlotView from '../components/Plot'
import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  Panel,
  Segmented,
  Select,
  Skeleton,
  StatCard,
} from '../components/ui'

const TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'AMZN', 'META', 'BTC-USD', 'ETH-USD', 'SPY']
const DAY_OPTIONS = [
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
  { label: '1Y', value: '365' },
]

function toDate(v: string): Date {
  const d = new Date(v)
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000)
}

export default function Overview() {
  const [ticker, setTicker] = useState('AAPL')
  const [days, setDays] = useState('90')
  const [rows, setRows] = useState<PriceRow[] | null>(null)
  const [movers, setMovers] = useState<{ t: string; c: number; chg: number }[]>([])
  const [updated, setUpdated] = useState('')
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const load = useCallback(async () => {
    try {
      const data = await api.priceHistory(ticker, Number(days))
      setRows(data)
      setError(false)
      setUpdated(new Date().toISOString())
    } catch {
      setRows(null)
      setError(true)
    }
  }, [ticker, days])

  useEffect(() => {
    load()
  }, [load, tick])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const out: { t: string; c: number; chg: number }[] = []
      await Promise.all(
        TICKERS.map(async (t) => {
          try {
            const d = await api.priceHistory(t, 2)
            if (d.length < 2) return
            const sorted = [...d].sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime())
            const c = Number(sorted[sorted.length - 1].close)
            const p = Number(sorted[sorted.length - 2].close)
            out.push({ t, c, chg: ((c - p) / p) * 100 })
          } catch {
            /* skip */
          }
        }),
      )
      if (!cancelled) setMovers(out.sort((a, b) => Math.abs(b.chg) - Math.abs(a.chg)))
    })()
    return () => {
      cancelled = true
    }
  }, [tick])

  const { chartData, chartLayout, kpis } = useMemo(() => {
    const emptyKpis = {
      close: '—',
      chg: null as string | null,
      chgCol: COLORS.muted,
      vol: '—',
      rsi: 'N/A',
      rsiSig: 'NEUTRAL',
      hi52: '—',
      lo52: '—',
    }
    if (!rows || rows.length === 0) {
      return { chartData: [] as Data[], chartLayout: {} as Partial<Layout>, kpis: emptyKpis }
    }
    type DfRow = Record<string, unknown> & {
      date: Date
      close: number | null
      open: number | null
      high: number | null
      low: number | null
      volume: number | null
    }
    const df: DfRow[] = [...rows]
      .map((r) => ({ ...r, date: toDate(r.date) }))
      .sort((a, b) => (a.date as Date).getTime() - (b.date as Date).getTime())
      .filter((r) => r.close != null && !Number.isNaN(Number(r.close)))

    const x = df.map((r) => r.date)
    const open = df.map((r) => Number(r.open))
    const high = df.map((r) => Number(r.high))
    const low = df.map((r) => Number(r.low))
    const close = df.map((r) => Number(r.close))
    const volume = df.map((r) => Number(r.volume ?? 0))

    const data: Data[] = [
      {
        type: 'candlestick',
        x,
        open,
        high,
        low,
        close,
        name: ticker,
        increasing: { line: { color: COLORS.green } },
        decreasing: { line: { color: COLORS.red } },
        opacity: 0.75,
      },
    ]
    if ('bb_upper' in df[0] && 'bb_lower' in df[0]) {
      const bbUp = df.map((r) => r.bb_upper as number)
      const bbLo = df.map((r) => r.bb_lower as number)
      data.push(
        {
          type: 'scatter',
          x,
          y: bbUp,
          line: { color: 'rgba(168, 85, 247, 0.5)', width: 1, dash: 'dot' },
          showlegend: false,
          hoverinfo: 'skip',
        } as Data,
        {
          type: 'scatter',
          x,
          y: bbLo,
          line: { color: 'rgba(168, 85, 247, 0.5)', width: 1, dash: 'dot' },
          fill: 'tonexty',
          fillcolor: 'rgba(168, 85, 247, 0.1)',
          showlegend: false,
          hoverinfo: 'skip',
        } as Data,
      )
    }
    data.push({
      type: 'bar',
      x,
      y: volume,
      marker: {
        color: close.map((c, i) => (c >= open[i] ? COLORS.green : COLORS.red)),
        opacity: 0.5,
      },
      showlegend: false,
      xaxis: 'x',
      yaxis: 'y2',
    } as Data)

    const layout: Partial<Layout> = {
      ...PLOT_BASE,
      height: 460,
      margin: { l: 55, r: 20, t: 40, b: 45 },
      title: {
        text: `<b>${ticker}</b>  |  ${days}D`,
        font: { family: MONO, size: 13, color: COLORS.text },
      },
      xaxis: {
        ...(PLOT_BASE.xaxis as object),
        rangeslider: { visible: false },
      },
      yaxis: { ...(PLOT_BASE.yaxis as object), domain: [0.3, 1] },
      yaxis2: { ...(PLOT_BASE.yaxis as object), domain: [0, 0.28], anchor: 'x' },
    }

    const last = df[df.length - 1]
    const prev = df.length > 1 ? df[df.length - 2] : last
    const closeVal = Number(last.close)
    const prevClose = Number(prev.close)
    const chg = ((closeVal - prevClose) / prevClose) * 100
    const chgCol = chg >= 0 ? COLORS.green : COLORS.red

    let rsiVal: number | null = null
    const rawRsi = last.rsi
    if (rawRsi !== undefined && rawRsi !== null && String(rawRsi) !== '' && String(rawRsi) !== 'nan') {
      const v = Number(rawRsi)
      if (!Number.isNaN(v)) rsiVal = v
    }
    const rsiStr = rsiVal != null ? rsiVal.toFixed(1) : 'N/A'
    const rsiSig = rsiVal != null ? (rsiVal > 70 ? 'OVERBOUGHT' : rsiVal < 30 ? 'OVERSOLD' : 'NEUTRAL') : 'NEUTRAL'

    const volM = last.volume ? `${(Number(last.volume) / 1_000_000).toFixed(1)}M` : '—'
    const hi52 = `$${Math.max(...df.map((r) => Number(r.high ?? r.close))).toFixed(2)}`
    const lo52 = `$${Math.min(...df.map((r) => Number(r.low ?? r.close))).toFixed(2)}`

    return {
      chartData: data,
      chartLayout: layout,
      kpis: {
        close: `$${closeVal.toFixed(2)}`,
        chg: `${chg >= 0 ? '▲' : '▼'} ${Math.abs(chg).toFixed(2)}%`,
        chgCol,
        vol: volM,
        rsi: rsiStr,
        rsiSig,
        hi52,
        lo52,
      },
    }
  }, [rows, ticker, days])

  const loading = rows === null && !error

  return (
    <div>
      <PageHeader
        eyebrow="ANALYSIS"
        title="MARKET OVERVIEW"
        subtitle="OHLCV · Bollinger Bands · RSI(14)"
        controls={
          <>
            <Select
              value={ticker}
              onChange={setTicker}
              options={TICKERS.map((t) => ({ label: t, value: t }))}
              width={150}
              ariaLabel="Ticker"
            />
            <Segmented value={days} onChange={setDays} options={DAY_OPTIONS} ariaLabel="Time range" />
          </>
        }
      />

      {updated && !loading && (
        <div
          style={{
            fontFamily: MONO,
            fontSize: '9px',
            color: COLORS.dim,
            marginTop: '-12px',
            marginBottom: '14px',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: COLORS.green,
              display: 'inline-block',
            }}
          />
          Updated {updated.slice(11, 16)} UTC
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{ flex: '1', minWidth: '130px', padding: '14px 18px', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10 }}
            >
              <Skeleton width={64} height={9} style={{ marginBottom: 10 }} />
              <Skeleton width={90} height={22} />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState hint="The price service didn't respond." onRetry={load} />
      ) : (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <StatCard
              label="LAST CLOSE"
              value={kpis.close}
              accent={kpis.chgCol ?? COLORS.blue}
              trend={kpis.chg ? { value: kpis.chg, positive: (kpis.chgCol ?? COLORS.blue) === COLORS.green } : undefined}
            />
            <StatCard label="DAILY VOLUME" value={kpis.vol} accent={COLORS.purple} />
            <StatCard
              label="RSI (14)"
              value={kpis.rsi}
              accent={COLORS.amber}
              sub={<Badge text={kpis.rsiSig} color={kpis.rsiSig === 'OVERBOUGHT' ? COLORS.red : kpis.rsiSig === 'OVERSOLD' ? COLORS.green : COLORS.muted} dot />}
            />
            <StatCard label="52W HIGH" value={kpis.hi52} accent={COLORS.green} />
            <StatCard label="52W LOW" value={kpis.lo52} accent={COLORS.red} />
          </div>

          <Panel style={{ marginBottom: '20px' }}>
            {loading ? (
              <Skeleton height={460} radius={8} />
            ) : rows ? (
              <PlotView data={chartData} layout={chartLayout} />
            ) : (
              <ErrorState onRetry={load} />
            )}
          </Panel>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Card title="MACRO INDICATORS" style={{ flex: '1' }}>
              <EmptyState title="Macro feed not configured" hint="Add a /macro endpoint to the FastAPI service to populate macro indicators here." />
            </Card>
            <Card title="TOP MOVERS — 24H" style={{ width: '360px', flex: 'none' }}>
              <DataTable
                maxHeight={268}
                headers={['TICKER', 'PRICE', 'CHG %']}
                rows={movers.map((m) => [
                  { value: m.t, color: COLORS.text },
                  { value: `$${m.c.toFixed(2)}`, color: COLORS.muted, right: true },
                  {
                    value: `${m.chg >= 0 ? '▲' : '▼'} ${Math.abs(m.chg).toFixed(2)}%`,
                    color: m.chg >= 0 ? COLORS.green : COLORS.red,
                    right: true,
                  },
                ])}
              />
              {movers.length === 0 && (
                <EmptyState title="No movers data" hint="Market feed will populate this table." />
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}