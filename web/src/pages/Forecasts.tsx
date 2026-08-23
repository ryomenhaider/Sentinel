import { useEffect, useMemo, useState } from 'react'
import type { Data, Layout } from 'plotly.js'
import { api } from '../api'
import type { FeatureImportance, ForecastRow, ModelVersion, PriceRow } from '../types'
import { COLORS, MONO, PLOT_BASE } from '../theme'
import PlotView from '../components/Plot'
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Panel,
  Segmented,
  Select,
  Skeleton,
  StatCard,
} from '../components/ui'

const TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'BTC-USD', 'ETH-USD', 'SPY']
const HORIZON_OPTIONS = [
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
]

function dedupe(rows: ForecastRow[]): ForecastRow[] {
  const byDate = new Map<string, ForecastRow>()
  for (const r of [...rows].sort((a, b) => (b.predicted_at ?? '').localeCompare(a.predicted_at ?? ''))) {
    const d = (r.forecast_date ?? '').slice(0, 10)
    if (!d) continue
    if (!byDate.has(d)) byDate.set(d, r)
  }
  return [...byDate.values()].sort((a, b) => (a.forecast_date ?? '').localeCompare(b.forecast_date ?? ''))
}

export default function Forecasts() {
  const [ticker, setTicker] = useState('AAPL')
  const [horizon, setHorizon] = useState('30')
  const [fc, setFc] = useState<ForecastRow[]>([])
  const [hist, setHist] = useState<PriceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [compareInput, setCompareInput] = useState('')
  const [comparePayload, setComparePayload] = useState<Record<string, ForecastRow[] | ForecastRow> | null>(null)
  const [compareBusy, setCompareBusy] = useState(false)
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([])
  const [models, setModels] = useState<ModelVersion[]>([])

  useEffect(() => {
    api.models().then(setModels).catch(() => {})
  }, [])

  useEffect(() => {
    api.explain(ticker).then(setFeatureImportance).catch(() => setFeatureImportance([]))
  }, [ticker])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    ;(async () => {
      try {
        const [f, h] = await Promise.all([
          api.forecast(ticker, Number(horizon)),
          api.priceHistory(ticker, 90),
        ])
        if (!cancelled) {
          setFc(f ?? [])
          setHist(h ?? [])
        }
      } catch {
        if (!cancelled) {
          setFc([])
          setHist([])
          setError(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ticker, horizon])

  const runCompare = async () => {
    if (!compareInput.trim() || compareBusy) return
    setCompareBusy(true)
    try {
      const tickers = compareInput
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .join(',')
      setComparePayload(await api.forecastCompare(tickers, Number(horizon)))
    } catch {
      setComparePayload(null)
    } finally {
      setCompareBusy(false)
    }
  }

  const latestDataDate = useMemo(() => {
    if (hist.length === 0) return null
    return hist.reduce((max, r) => (r.date > max ? r.date : max), hist[0].date)
  }, [hist])

  const { chartData, chartLayout, tableRows, latest, upper, lower, model } = useMemo(() => {
    const deduped = dedupe(fc)
    const empty = {
      chartData: [] as Data[],
      chartLayout: {} as Partial<Layout>,
      tableRows: [] as ForecastRow[],
      latest: '—',
      upper: '—',
      lower: '—',
      model: '—',
    }
    if (deduped.length === 0) return empty

    const data: Data[] = []
    const sortedHist = [...hist].sort((a, b) => a.date.localeCompare(b.date))
    if (sortedHist.length > 0) {
      data.push({
        type: 'scatter',
        x: sortedHist.map((p) => p.date),
        y: sortedHist.map((p) => Number(p.close)),
        name: 'Historical',
        mode: 'lines',
        line: { color: COLORS.blue, width: 2 },
      })
    }

    const fDates = deduped.map((r) => r.forecast_date ?? '')
    const hasBand = deduped.every((r) => r.yhat_upper != null && r.yhat_lower != null)
    if (hasBand) {
      data.push({
        type: 'scatter',
        x: [...fDates, ...[...fDates].reverse()],
        y: [
          ...deduped.map((r) => r.yhat_upper),
          ...[...deduped].reverse().map((r) => r.yhat_lower),
        ],
        fill: 'toself',
        fillcolor: 'rgba(0, 255, 148, 0.09)',
        line: { color: 'rgba(0,0,0,0)' },
        name: '95% Confidence Band',
        hoverinfo: 'skip',
      } as Data)
    }

    data.push({
      type: 'scatter',
      x: fDates,
      y: deduped.map((r) => r.yhat),
      name: 'Forecast',
      mode: 'lines+markers',
      line: { color: COLORS.green, width: 2, dash: 'dash' },
    })

    const layout: Partial<Layout> = {
      ...PLOT_BASE,
      height: 400,
      title: {
        text: `<b>${ticker}</b>  ·  ${horizon}-Day Forecast`,
        font: { size: 12, color: COLORS.text },
      },
    }

    const last = deduped[deduped.length - 1]
    const fmt = (v: number | null | undefined) => (v != null ? `$${Number(v).toFixed(2)}` : '—')

    return {
      chartData: data,
      chartLayout: layout,
      tableRows: deduped.slice(0, 10),
      latest: fmt(last.yhat),
      upper: fmt(last.yhat_upper),
      lower: fmt(last.yhat_lower),
      model: (last.model_used ?? 'Prophet').slice(0, 15),
    }
  }, [fc, hist, ticker, horizon])

  const compareChart = useMemo<{ data: Data[]; layout: Partial<Layout> }>(() => {
    const colors = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.red, COLORS.purple]
    const data: Data[] = []
    if (comparePayload) {
      Object.entries(comparePayload).forEach(([t, rows], idx) => {
        const list = Array.isArray(rows) ? rows : [rows]
        const df = dedupe(list)
        if (df.length === 0) return
        data.push({
          type: 'scatter',
          x: df.map((r) => r.forecast_date ?? ''),
          y: df.map((r) => r.yhat),
          name: t,
          mode: 'lines+markers',
          line: { color: colors[idx % colors.length], width: 2 },
        })
      })
    }
    return {
      data,
      layout: {
        ...PLOT_BASE,
        height: 350,
        hovermode: 'x unified',
        title: { text: 'FORECAST COMPARISON', font: { size: 11, color: COLORS.muted } },
      },
    }
  }, [comparePayload])

  return (
    <div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: '9px',
          letterSpacing: '2px',
          color: COLORS.amber,
          background: `${COLORS.amber}10`,
          border: `1px solid ${COLORS.amber}30`,
          borderRadius: '7px',
          padding: '8px 16px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: COLORS.amber, display: 'inline-block' }} />
        MODEL PREDICTIONS ONLY — NOT INVESTMENT ADVICE
      </div>

      {latestDataDate && !loading && (
        <div style={{
          fontFamily: MONO, fontSize: '9px', color: COLORS.dim, marginTop: '-12px',
          marginBottom: '12px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%', display: 'inline-block',
            background: (Date.now() - new Date(latestDataDate).getTime()) < 48 * 3600_000 ? COLORS.green : COLORS.amber,
          }} />
          Data as of {new Date(latestDataDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}

      <PageHeader
        eyebrow="ANALYSIS"
        title="FORECASTING CENTER"
        subtitle="Prophet (trend + seasonality) · XGBoost (feature-based ensemble)"
        controls={
          <>
            <Select value={ticker} onChange={setTicker} options={TICKERS.map((t) => ({ label: t, value: t }))} width={140} ariaLabel="Ticker" />
            <Segmented value={horizon} onChange={setHorizon} options={HORIZON_OPTIONS} ariaLabel="Horizon" />
          </>
        }
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
          <StatCard label="YHAT" value={latest} accent={COLORS.blue} />
          <StatCard label="YHAT_UPPER" value={upper} accent={COLORS.green} />
          <StatCard label="YHAT_LOWER" value={lower} accent={COLORS.red} />
          <StatCard label="MODEL" value={model} accent={COLORS.purple} />
          <StatCard label="HORIZON" value={`${horizon}D`} accent={COLORS.muted} />
        </div>
      )}

      <Panel style={{ marginBottom: '20px' }}>
        {loading ? (
          <Skeleton height={400} radius={8} />
        ) : error ? (
          <ErrorState hint="The forecast service didn't respond." onRetry={() => {}} />
        ) : chartData.length === 0 ? (
          <ErrorState title="No forecast available" hint={`No forecast rows for ${ticker}. Run the pipeline scheduler first.`} />
        ) : (
          <PlotView data={chartData} layout={chartLayout} />
        )}
      </Panel>

      <Card title="FORECAST COMPARISON" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <Input
            value={compareInput}
            onChange={setCompareInput}
            onEnter={runCompare}
            placeholder="Enter tickers — e.g. AAPL,MSFT,GOOGL"
            ariaLabel="Tickers to compare"
          />
          <Button onClick={runCompare} loading={compareBusy}>
            COMPARE
          </Button>
        </div>
        <PlotView data={compareChart.data} layout={compareChart.layout} />
      </Card>

      <Card title="FORECAST TABLE — NEXT 10 DAYS">
        {tableRows.length === 0 ? (
          <div style={{ color: COLORS.dim, fontFamily: MONO, fontSize: '11px', padding: '12px' }}>No data</div>
        ) : (
          <DataTable
            headers={['DATE', 'FORECAST', 'LOWER BOUND', 'UPPER BOUND']}
            rows={tableRows.map((r) => [
              { value: (r.forecast_date ?? '—').slice(0, 10), color: COLORS.muted },
              { value: r.yhat != null ? `$${Number(r.yhat).toFixed(2)}` : '—', color: COLORS.green, right: true },
              { value: r.yhat_lower != null ? `$${Number(r.yhat_lower).toFixed(2)}` : '—', color: COLORS.dim, right: true },
              { value: r.yhat_upper != null ? `$${Number(r.yhat_upper).toFixed(2)}` : '—', color: COLORS.dim, right: true },
            ])}
          />
        )}
      </Card>

      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
        <Card title="FEATURE IMPORTANCE" style={{ flex: '1' }}>
          {featureImportance.length === 0 ? (
            <EmptyState title="No explainability data" hint="Run the training pipeline to generate SHAP values." />
          ) : (
            <PlotView
              data={[{
                type: 'bar',
                x: featureImportance.map((f) => f.importance),
                y: featureImportance.map((f) => f.feature),
                orientation: 'h',
                marker: { color: COLORS.blue, opacity: 0.8 },
              }]}
              layout={{
                ...PLOT_BASE,
                height: Math.max(250, featureImportance.length * 28),
                xaxis: { ...(PLOT_BASE.xaxis as object), title: { text: 'Importance', font: { size: 10, color: COLORS.dim } } },
                yaxis: { ...(PLOT_BASE.yaxis as object), autorange: 'reversed' },
                margin: { l: 130, r: 20, t: 10, b: 40 },
                title: undefined,
              }}
              title="feature-importance"
            />
          )}
        </Card>

        <Card title="MODEL REGISTRY" style={{ width: '320px', flex: 'none' }}>
          {models.length === 0 ? (
            <EmptyState title="No models registered" hint="Train models to populate the registry." />
          ) : (
            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {models.map((m) => (
                <div
                  key={`${m.name}-v${m.version}`}
                  style={{
                    padding: '10px 12px',
                    borderBottom: `1px solid ${COLORS.border}40`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: '11px', color: COLORS.text, fontWeight: 500 }}>
                      {m.name}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: COLORS.dim, marginTop: '2px' }}>
                      {m.stage} · {new Date(m.created_at * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge
                    text={`v${m.version}`}
                    color={m.stage === 'Production' ? COLORS.green : m.stage === 'Staging' ? COLORS.amber : COLORS.dim}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}