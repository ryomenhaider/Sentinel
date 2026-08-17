import { useEffect, useMemo, useState } from 'react'
import type { Data, Layout } from 'plotly.js'
import { api } from '../api'
import type { SentimentRow } from '../types'
import { COLORS, MONO, PLOT_BASE } from '../theme'
import PlotView from '../components/Plot'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
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

const SENT_COLORS: Record<string, string> = {
  positive: COLORS.green,
  negative: COLORS.red,
  neutral: COLORS.muted,
}

function parseDate(v: string): Date {
  const d = new Date(v)
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000)
}

export default function Sentiment() {
  const [ticker, setTicker] = useState('AAPL')
  const [days, setDays] = useState('30')
  const [rows, setRows] = useState<SentimentRow[]>([])
  const [heatmap, setHeatmap] = useState<{ t: string; s: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    ;(async () => {
      try {
        const d = await api.sentiment(ticker, Number(days))
        if (!cancelled) setRows(d ?? [])
      } catch {
        if (!cancelled) {
          setRows([])
          setError(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ticker, days])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const out: { t: string; s: number }[] = []
      await Promise.all(
        TICKERS.map(async (t) => {
          try {
            const d = await api.sentiment(t, 7)
            if (d && d.length > 0) {
              const avg = d.reduce((a, r) => a + Number(r.score ?? 0), 0) / d.length
              out.push({ t, s: Number(avg.toFixed(3)) })
            }
          } catch {
            /* skip */
          }
        }),
      )
      if (!cancelled) setHeatmap(out)
    })()
    return () => {
      cancelled = true
    }
  }, [ticker, days])

  const { timelineData, timelineLayout, gaugeValue, gaugeColor, gaugeLayout, heatData, heatLayout, news, kpis } =
    useMemo(() => {
      const timelineData: Data[] = []
      const emptyLayout: Partial<Layout> = { ...PLOT_BASE, height: 260 }
      const empty = {
        timelineData,
        timelineLayout: emptyLayout,
        gaugeValue: 0,
        gaugeColor: COLORS.muted,
        gaugeLayout: emptyLayout,
        heatData: [] as Data[],
        heatLayout: emptyLayout,
        news: [] as { headline: string | null; sentiment: string | null; score: number; publishedRaw: string }[],
        kpis: { total: 0, pos: 0, neg: 0, neu: 0, avg: '+0.000' },
      }
      if (rows.length === 0) return empty

      const df = [...rows]
        .map((r) => ({ ...r, date: parseDate(r.published_at), publishedRaw: r.published_at, score: Number(r.score ?? 0) }))
        .sort((a, b) => a.date.getTime() - b.date.getTime())

      for (const [sent, color] of Object.entries(SENT_COLORS)) {
        const grp = df.filter((r) => r.sentiment === sent)
        if (grp.length === 0) continue
        timelineData.push({
          type: 'scatter',
          x: grp.map((r) => r.date),
          y: grp.map((r) => r.score),
          mode: 'markers',
          name: sent.toUpperCase(),
          marker: { size: 8, color, opacity: 0.8 },
        })
      }
      if (df.length > 2) {
        const moving = df.map((_, i) => {
          const window = df.slice(Math.max(0, i - 2), i + 1)
          return window.reduce((a, r) => a + r.score, 0) / window.length
        })
        timelineData.push({
          type: 'scatter',
          x: df.map((r) => r.date),
          y: moving,
          mode: 'lines',
          name: '3-pt avg',
          line: { color: COLORS.blue, width: 2, dash: 'dot' },
        })
      }

      const timelineLayout: Partial<Layout> = {
        ...PLOT_BASE,
        height: 260,
        title: { text: `<b>${ticker}</b>  ·  Sentiment Scores`, font: { size: 12, color: COLORS.text } },
        yaxis: { ...(PLOT_BASE.yaxis as object), range: [-1.1, 1.1] },
        shapes: [
          {
            type: 'line',
            xref: 'paper',
            x0: 0,
            x1: 1,
            yref: 'y',
            y0: 0,
            y1: 0,
            line: { color: COLORS.border, dash: 'dot', width: 1 },
          },
        ],
      }

      const avgScore = df.reduce((a, r) => a + r.score, 0) / df.length
      const gaugeColor = avgScore > 0.1 ? COLORS.green : avgScore < -0.1 ? COLORS.red : COLORS.muted
      const gaugeLayout: Partial<Layout> = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: COLORS.text, family: MONO },
        margin: { l: 30, r: 30, t: 30, b: 20 },
        height: 230,
      }

      const heatData: Data[] = []
      const heatLayout: Partial<Layout> = { ...PLOT_BASE, height: 200 }
      if (heatmap.length > 0) {
        heatData.push({
          type: 'bar',
          x: heatmap.map((h) => h.t),
          y: heatmap.map((h) => h.s),
          marker: {
            color: heatmap.map((h) => (h.s > 0.1 ? COLORS.green : h.s < -0.1 ? COLORS.red : COLORS.muted)),
            opacity: 0.85,
          },
        })
        heatLayout.title = { text: 'AVG SENTIMENT BY TICKER', font: { size: 11, color: COLORS.muted } }
        heatLayout.yaxis = { ...(PLOT_BASE.yaxis as object), range: [-1.1, 1.1] }
        heatLayout.shapes = [
          {
            type: 'line',
            xref: 'paper',
            x0: 0,
            x1: 1,
            yref: 'y',
            y0: 0,
            y1: 0,
            line: { color: COLORS.border, dash: 'dot', width: 1 },
          },
        ]
      }

      const news = [...df]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 15)
        .map((r) => ({
          headline: r.headline,
          sentiment: r.sentiment,
          score: r.score,
          publishedRaw: r.publishedRaw,
        }))

      const pos = df.filter((r) => r.sentiment === 'positive').length
      const neg = df.filter((r) => r.sentiment === 'negative').length
      const neu = df.filter((r) => r.sentiment === 'neutral').length

      return {
        timelineData,
        timelineLayout,
        gaugeValue: Number(avgScore.toFixed(3)),
        gaugeColor,
        gaugeLayout,
        heatData,
        heatLayout,
        news,
        kpis: { total: df.length, pos, neg, neu, avg: `${avgScore >= 0 ? '+' : ''}${avgScore.toFixed(3)}` },
      }
    }, [rows, ticker, heatmap])

  return (
    <div>
      <PageHeader
        eyebrow="STRATEGY"
        title="SENTIMENT ANALYSIS"
        subtitle="FinBERT NLP · News sentiment scoring"
        controls={
          <>
            <Select value={ticker} onChange={setTicker} options={TICKERS.map((t) => ({ label: t, value: t }))} width={140} ariaLabel="Ticker" />
            <Segmented value={days} onChange={setDays} options={DAY_OPTIONS} ariaLabel="Time range" />
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
          <StatCard label="TOTAL NEWS" value={kpis.total} accent={COLORS.blue} />
          <StatCard label="POSITIVE" value={kpis.pos} accent={COLORS.green} />
          <StatCard label="NEGATIVE" value={kpis.neg} accent={COLORS.red} />
          <StatCard label="NEUTRAL" value={kpis.neu} accent={COLORS.muted} />
          <StatCard label="AVG SCORE" value={kpis.avg} accent={gaugeColor} />
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Card title="SENTIMENT SCORE TIMELINE" style={{ flex: '2' }}>
          {loading ? (
            <Skeleton height={260} radius={8} />
          ) : error ? (
            <ErrorState hint="The sentiment service didn't respond." onRetry={() => {}} />
          ) : timelineData.length === 0 ? (
            <EmptyState title="No sentiment data" hint="News ingestion hasn't produced rows for this ticker yet." />
          ) : (
            <PlotView data={timelineData} layout={timelineLayout} />
          )}
        </Card>
        <Card title="OVERALL SENTIMENT" style={{ flex: '1' }}>
          {loading ? (
            <Skeleton height={230} radius={8} />
          ) : error ? (
            <ErrorState />
          ) : (
            <PlotView
              data={[
                {
                  type: 'indicator',
                  mode: 'gauge+number',
                  value: gaugeValue,
                  number: { font: { color: gaugeColor, family: MONO, size: 28 } },
                  gauge: {
                    axis: {
                      range: [-1, 1],
                      tickcolor: COLORS.muted,
                      tickfont: { color: COLORS.muted, size: 10 },
                    },
                    bar: { color: gaugeColor, thickness: 0.3 },
                    bgcolor: COLORS.elevated,
                    bordercolor: COLORS.border,
                    steps: [
                      { range: [-1, -0.1], color: 'rgba(255,77,109,0.13)' },
                      { range: [-0.1, 0.1], color: 'rgba(139,154,179,0.13)' },
                      { range: [0.1, 1], color: 'rgba(0,255,148,0.13)' },
                    ],
                    threshold: {
                      line: { color: COLORS.amber, width: 2 },
                      thickness: 0.75,
                      value: gaugeValue,
                    },
                  },
                } as Data,
              ]}
              layout={gaugeLayout}
            />
          )}
        </Card>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Card title="AVG SENTIMENT — ALL TICKERS" style={{ flex: '1' }}>
          {loading ? (
            <Skeleton height={200} radius={8} />
          ) : error ? (
            <ErrorState />
          ) : (
            <PlotView data={heatData} layout={heatLayout} />
          )}
        </Card>
        <Card title="LATEST NEWS" style={{ width: '440px', flex: 'none' }}>
          {loading ? (
            <Skeleton height={240} radius={8} />
          ) : news.length === 0 ? (
            <EmptyState title="No news data" hint="Sentiment pipeline output will appear here." />
          ) : (
            <div style={{ maxHeight: '246px', overflowY: 'auto' }}>
              {news.map((r, i) => {
                const sent = r.sentiment ?? 'neutral'
                const color = SENT_COLORS[sent] ?? COLORS.muted
                const dateStr = r.publishedRaw.slice(0, 16)
                return (
                  <div
                    key={i}
                    style={{
                      padding: '10px 2px',
                      borderBottom: `1px solid ${COLORS.border}33`,
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,212,255,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge text={sent.toUpperCase()} color={color} dot />
                      <span className="num" style={{ fontFamily: MONO, fontSize: '10px', color }}>
                        {r.score >= 0 ? '+' : ''}
                        {r.score.toFixed(2)}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: '9px', color: COLORS.dim, marginLeft: 'auto' }}>
                        {dateStr}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: COLORS.text, lineHeight: '1.45' }}>{r.headline}</div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}