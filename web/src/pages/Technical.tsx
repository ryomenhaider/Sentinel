import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { api } from '../api'
import type { TechnicalSnapshot } from '../types'
import { COLORS, MONO, RADIUS } from '../theme'
import {
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StatCard,
} from '../components/ui'
import type { Cell } from '../components/ui'

const SYMBOLS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', pair: 'BTC/USDT' },
  { symbol: 'ETHUSDT', name: 'Ethereum', pair: 'ETH/USDT' },
  { symbol: 'BNBUSDT', name: 'BNB', pair: 'BNB/USDT' },
  { symbol: 'XRPUSDT', name: 'XRP', pair: 'XRP/USDT' },
  { symbol: 'SOLUSDT', name: 'Solana', pair: 'SOL/USDT' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', pair: 'DOGE/USDT' },
  { symbol: 'TRXUSDT', name: 'TRON', pair: 'TRX/USDT' },
  { symbol: 'ADAUSDT', name: 'Cardano', pair: 'ADA/USDT' },
  { symbol: 'LINKUSDT', name: 'Chainlink', pair: 'LINK/USDT' },
  { symbol: 'AVAXUSDT', name: 'Avalanche', pair: 'AVAX/USDT' },
  { symbol: 'SUIUSDT', name: 'Sui', pair: 'SUI/USDT' },
  { symbol: 'LTCUSDT', name: 'Litecoin', pair: 'LTC/USDT' },
  { symbol: 'BCHUSDT', name: 'Bitcoin Cash', pair: 'BCH/USDT' },
  { symbol: 'HBARUSDT', name: 'Hedera', pair: 'HBAR/USDT' },
  { symbol: 'NEARUSDT', name: 'NEAR', pair: 'NEAR/USDT' },
  { symbol: 'UNIUSDT', name: 'Uniswap', pair: 'UNI/USDT' },
  { symbol: 'DOTUSDT', name: 'Polkadot', pair: 'DOT/USDT' },
  { symbol: 'APTUSDT', name: 'Aptos', pair: 'APT/USDT' },
  { symbol: 'ARBUSDT', name: 'Arbitrum', pair: 'ARB/USDT' },
  { symbol: 'OPUSDT', name: 'Optimism', pair: 'OP/USDT' },
]

const fmtPrice = (v: number | null) =>
  v != null ? `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'

const fmtPct = (v: number | null, decimals = 2) =>
  v != null ? `${v >= 0 ? '+' : ''}${(v * 100).toFixed(decimals)}%` : '—'

const fmtInt = (v: number | null) =>
  v != null ? v.toLocaleString('en-US') : '—'

const fmtVol = (v: number | null) => {
  if (v == null) return '—'
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`
  return `$${v.toFixed(2)}`
}

const fmtAssetVol = (v: number | null) => {
  if (v == null) return '—'
  if (v >= 1e3) return v.toLocaleString('en-US', { maximumFractionDigits: 0 })
  return v.toFixed(4)
}

const fmtRatio = (v: number | null, d = 4) => (v != null ? v.toFixed(d) : '—')

const fmtTime = (v: number | null) => {
  if (v == null) return '—'
  const h = Math.floor(v / 60)
  const m = Math.round(v % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const scoreColor = (v: number | null) =>
  v == null ? COLORS.muted : v > 0.6 ? COLORS.green : v > 0.3 ? COLORS.amber : COLORS.red

const rc = (label: string, value: React.ReactNode, color?: string): Cell[] => [
  { value: <span style={{ color: COLORS.muted }}>{label}</span> },
  { value, color: color ?? COLORS.text, right: true },
]

function SymbolSearch({
  onSelect,
  initial,
}: {
  onSelect: (symbol: string) => void
  initial?: string
}) {
  const [query, setQuery] = useState(initial ?? '')
  const [open, setOpen] = useState(!initial)

  const filtered = useMemo(() => {
    if (!query) return SYMBOLS
    const q = query.toLowerCase()
    return SYMBOLS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.pair.toLowerCase().includes(q),
    )
  }, [query])

  const pick = (symbol: string) => {
    onSelect(symbol)
    setQuery('')
    setOpen(false)
  }

  if (!open && initial) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 14px',
          fontFamily: MONO,
          fontSize: '10.5px',
          fontWeight: 600,
          letterSpacing: '1px',
          background: COLORS.elevated,
          color: COLORS.blue,
          border: `1px solid ${COLORS.borderStrong}`,
          borderRadius: '7px',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = COLORS.blue)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = COLORS.borderStrong)}
      >
        <Search size={13} strokeWidth={2} />
        {initial.replace('USDT', '')}
      </button>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
      <div style={{ position: 'relative' }}>
        <Search
          size={14}
          strokeWidth={2}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: COLORS.dim,
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search crypto - Bitcoin, ETH, SOL..."
          autoFocus={!initial}
          style={{
            width: '100%',
            padding: '10px 36px 10px 36px',
            fontFamily: MONO,
            fontSize: '12px',
            background: COLORS.elevated,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            color: COLORS.text,
            outline: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = COLORS.blue
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.14)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = COLORS.border
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setOpen(true) }}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: COLORS.dim,
              cursor: 'pointer',
              padding: '2px',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: '280px',
            overflowY: 'auto',
            background: COLORS.elevated,
            border: `1px solid ${COLORS.borderStrong}`,
            borderRadius: '8px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            zIndex: 20,
            padding: '4px',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '16px', fontFamily: MONO, fontSize: '11px', color: COLORS.dim, textAlign: 'center' }}>
              No matches
            </div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.symbol}
                type="button"
                onClick={() => pick(s.symbol)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '9px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,212,255,0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 600, color: COLORS.text, width: '80px', flexShrink: 0 }}>
                  {s.symbol.replace('USDT', '')}
                </span>
                <span style={{ fontSize: '11px', color: COLORS.muted, flex: 1 }}>{s.name}</span>
                <span style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '1px', color: COLORS.dim }}>
                  {s.pair}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function Technical() {
  const [symbol, setSymbol] = useState<string | null>(null)
  const [data, setData] = useState<TechnicalSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async (sym: string) => {
    setLoading(true)
    setError(false)
    try {
      const d = await api.technical(sym)
      setData(d)
    } catch {
      setData(null)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (symbol) load(symbol)
  }, [symbol, load])

  const d = data

  return (
    <div>
      <PageHeader
        eyebrow="ANALYSIS"
        title="TECHNICAL ANALYSIS"
        subtitle={d ? `${d.symbol}  ·  ${new Date(d.timestamp_ms).toLocaleString()}` : undefined}
        accent={COLORS.amber}
        controls={symbol ? <SymbolSearch onSelect={setSymbol} initial={symbol} /> : undefined}
      />

      {!symbol && (
        <EmptyState
          title="Select a crypto symbol"
          hint="Choose from 20 Binance perpetual futures - BTC, ETH, SOL, and more."
          action={<SymbolSearch onSelect={setSymbol} />}
        />
      )}

      {symbol && loading && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ flex: '1', minWidth: '130px', padding: '14px 18px', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.md }}>
                <Skeleton width={64} height={9} style={{ marginBottom: 10 }} />
                <Skeleton width={90} height={22} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[0, 1, 2].map((i) => (
              <Card key={i} title="LOADING" style={{ flex: '1' }}>
                <Skeleton height={180} radius={6} />
              </Card>
            ))}
          </div>
        </>
      )}

      {symbol && error && (
        <ErrorState hint={`No data found for ${symbol}. It may not have been ingested yet.`} onRetry={() => load(symbol)} />
      )}

      {symbol && d && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <StatCard
              label="LAST PRICE"
              value={fmtPrice(d.last_price_24h)}
              accent={d.pct_change_24h != null ? (d.pct_change_24h >= 0 ? COLORS.green : COLORS.red) : COLORS.blue}
              trend={d.pct_change_24h != null ? { value: fmtPct(d.pct_change_24h), positive: d.pct_change_24h >= 0 } : undefined}
            />
            <StatCard label="24H HIGH" value={fmtPrice(d.high_24h)} accent={COLORS.green} />
            <StatCard label="24H LOW" value={fmtPrice(d.low_24h)} accent={COLORS.red} />
            <StatCard label="24H VOLUME" value={fmtVol(d.quote_volume_24h)} accent={COLORS.purple} />
            <StatCard
              label="FUNDING RATE"
              value={d.funding_rate != null ? `${(d.funding_rate * 100).toFixed(3)}%` : '—'}
              accent={COLORS.amber}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Card title="PRICE SNAPSHOT" style={{ flex: '1' }}>
              <DataTable
                headers={['METRIC', 'VALUE']}
                rows={[
                  rc('Open', fmtPrice(d.open)),
                  rc('High', fmtPrice(d.high)),
                  rc('Low', fmtPrice(d.low)),
                  rc('Close', fmtPrice(d.close)),
                  rc('Volume (base)', fmtAssetVol(d.volume)),
                  rc('Volume (quote)', fmtVol(d.quote_volume)),
                  rc('Trades', fmtInt(d.trades_count)),
                  rc('HL Range', fmtRatio(d.hl_range, 6)),
                  rc('Body Range', fmtRatio(d.body_range, 6)),
                ]}
              />
            </Card>

            <Card title="RETURNS" style={{ flex: '1' }}>
              <DataTable
                headers={['PERIOD', 'RETURN']}
                rows={[
                  rc('1 Bar', d.ret_1b != null ? fmtPct(d.ret_1b) : '—', d.ret_1b != null ? (d.ret_1b >= 0 ? COLORS.green : COLORS.red) : undefined),
                  rc('5 Bars', d.ret_5b != null ? fmtPct(d.ret_5b) : '—', d.ret_5b != null ? (d.ret_5b >= 0 ? COLORS.green : COLORS.red) : undefined),
                  rc('10 Bars', d.ret_10b != null ? fmtPct(d.ret_10b) : '—', d.ret_10b != null ? (d.ret_10b >= 0 ? COLORS.green : COLORS.red) : undefined),
                  rc('60 Bars', d.ret_60b != null ? fmtPct(d.ret_60b) : '—', d.ret_60b != null ? (d.ret_60b >= 0 ? COLORS.green : COLORS.red) : undefined),
                  rc('Open to Close', d.ret_open_to_close != null ? fmtPct(d.ret_open_to_close) : '—', d.ret_open_to_close != null ? (d.ret_open_to_close >= 0 ? COLORS.green : COLORS.red) : undefined),
                ]}
              />
            </Card>

            <Card title="MOVING AVERAGES" style={{ flex: '1' }}>
              <DataTable
                headers={['INDICATOR', 'DISTANCE']}
                rows={[
                  rc('SMA 20', d.dist_sma_20 != null ? fmtPct(d.dist_sma_20) : '—', d.dist_sma_20 != null ? (d.dist_sma_20 >= 0 ? COLORS.green : COLORS.red) : undefined),
                  rc('SMA 50', d.dist_sma_50 != null ? fmtPct(d.dist_sma_50) : '—', d.dist_sma_50 != null ? (d.dist_sma_50 >= 0 ? COLORS.green : COLORS.red) : undefined),
                  rc('SMA 200', d.dist_sma_200 != null ? fmtPct(d.dist_sma_200) : '—', d.dist_sma_200 != null ? (d.dist_sma_200 >= 0 ? COLORS.green : COLORS.red) : undefined),
                  rc('EMA 9 - 21', d.ema_diff_9_21 != null ? fmtPct(d.ema_diff_9_21) : '—', d.ema_diff_9_21 != null ? (d.ema_diff_9_21 >= 0 ? COLORS.green : COLORS.red) : undefined),
                  rc('EMA 21 - 50', d.ema_diff_21_50 != null ? fmtPct(d.ema_diff_21_50) : '—', d.ema_diff_21_50 != null ? (d.ema_diff_21_50 >= 0 ? COLORS.green : COLORS.red) : undefined),
                ]}
              />
            </Card>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            <Card title="VOLATILITY" style={{ flex: '1' }}>
              <DataTable
                headers={['METRIC', 'VALUE']}
                rows={[
                  rc('Volatility (20)', d.vol_20 != null ? `${(d.vol_20 * 100).toFixed(2)}%` : '—'),
                  rc('Volatility (60)', d.vol_60 != null ? `${(d.vol_60 * 100).toFixed(2)}%` : '—'),
                  rc('ATR (14) Norm', d.atr_14_norm != null ? `${(d.atr_14_norm * 100).toFixed(3)}%` : '—'),
                  rc('Position in 24H Range', d.pos_in_24h_range != null ? `${(d.pos_in_24h_range * 100).toFixed(1)}%` : '—'),
                ]}
              />
            </Card>

            <Card title="ORDER BOOK" style={{ flex: '1' }}>
              <DataTable
                headers={['METRIC', 'VALUE']}
                rows={[
                  rc('Bid', fmtPrice(d.bid_price)),
                  rc('Ask', fmtPrice(d.ask_price)),
                  rc('Spread (abs)', d.spread_abs != null ? `$${d.spread_abs.toFixed(4)}` : '—'),
                  rc('Spread (bps)', d.spread_bps != null ? `${d.spread_bps.toFixed(4)} bps` : '—'),
                  rc('Book Imbalance', d.top_book_imbalance != null ? `${(d.top_book_imbalance * 100).toFixed(1)}%` : '—', d.top_book_imbalance != null ? (d.top_book_imbalance > 0 ? COLORS.green : COLORS.red) : undefined),
                  rc('Depth Bid', fmtAssetVol(d.depth_bid_total)),
                  rc('Depth Ask', fmtAssetVol(d.depth_ask_total)),
                  rc('Depth Imbalance', d.depth_imbalance != null ? `${(d.depth_imbalance * 100).toFixed(1)}%` : '—', d.depth_imbalance != null ? (d.depth_imbalance > 0 ? COLORS.green : COLORS.red) : undefined),
                ]}
              />
            </Card>

            <Card title="FUNDING & OPEN INTEREST" style={{ flex: '1' }}>
              <DataTable
                headers={['METRIC', 'VALUE']}
                rows={[
                  rc('Funding Rate', d.funding_rate != null ? `${(d.funding_rate * 100).toFixed(4)}%` : '—'),
                  rc('FR (Lag 3)', d.funding_rate_lag_3 != null ? `${(d.funding_rate_lag_3 * 100).toFixed(4)}%` : '—'),
                  rc('FR Change', d.funding_rate_change != null ? `${(d.funding_rate_change * 100).toFixed(4)}%` : '—'),
                  rc('FR Z-Score', d.funding_rate_zscore != null ? d.funding_rate_zscore.toFixed(3) : '—'),
                  rc('Next Funding', fmtTime(d.time_to_next_funding_min)),
                  rc('OI', d.open_interest != null ? d.open_interest.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'),
                  rc('OI 1H', d.oi_change_1h != null ? fmtPct(d.oi_change_1h) : '—', d.oi_change_1h != null ? (d.oi_change_1h >= 0 ? COLORS.green : COLORS.red) : undefined),
                  rc('OI 24H', d.oi_change_24h != null ? fmtPct(d.oi_change_24h) : '—', d.oi_change_24h != null ? (d.oi_change_24h >= 0 ? COLORS.green : COLORS.red) : undefined),
                  rc('OI / Vol 24H', d.oi_to_volume_24h != null ? d.oi_to_volume_24h.toFixed(6) : '—'),
                ]}
              />
            </Card>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            <Card title="TRADE ACTIVITY" style={{ flex: '1' }}>
              <DataTable
                headers={['METRIC', 'VALUE']}
                rows={[
                  rc('Trades (window)', fmtInt(d.trade_window_count)),
                  rc('Base Vol (window)', fmtAssetVol(d.trade_window_vol_base)),
                  rc('Quote Vol (window)', fmtVol(d.trade_window_vol_quote)),
                  rc('Buy Vol Ratio', d.trade_buy_vol_ratio != null ? `${(d.trade_buy_vol_ratio * 100).toFixed(1)}%` : '—', d.trade_buy_vol_ratio != null ? (d.trade_buy_vol_ratio > 0.5 ? COLORS.green : COLORS.red) : undefined),
                  rc('Taker Buy Ratio', d.taker_buy_vol_ratio != null ? `${(d.taker_buy_vol_ratio * 100).toFixed(1)}%` : '—', d.taker_buy_vol_ratio != null ? (d.taker_buy_vol_ratio > 0.5 ? COLORS.green : COLORS.red) : undefined),
                  rc('Avg Trade Size', d.avg_trade_size != null ? `$${d.avg_trade_size.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'),
                  rc('Median Trade Size', d.median_trade_size != null ? `$${d.median_trade_size.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'),
                  rc('Large Trade Ratio', d.large_trade_vol_ratio != null ? `${(d.large_trade_vol_ratio * 100).toFixed(1)}%` : '—'),
                ]}
              />
            </Card>

            <Card title="COMPOSITE SCORES" style={{ flex: '1' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '4px 0' }}>
                {([
                  { label: 'TREND', value: d.trend_score },
                  { label: 'MEAN REVERSION', value: d.mean_reversion_score },
                  { label: 'LIQUIDITY', value: d.liquidity_score },
                  { label: 'ORDER FLOW', value: d.order_flow_score },
                  { label: 'SENTIMENT', value: d.sentiment_score },
                ] as const).map((s) => (
                  <div
                    key={s.label}
                    style={{
                      flex: '1',
                      minWidth: '100px',
                      padding: '12px 14px',
                      background: COLORS.bg2,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: RADIUS.sm,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontFamily: MONO, fontSize: '8px', letterSpacing: '1.5px', color: COLORS.dim, marginBottom: '6px' }}>
                      {s.label}
                    </div>
                    <div
                      className="num"
                      style={{ fontFamily: MONO, fontSize: '18px', fontWeight: 600, color: scoreColor(s.value) }}
                    >
                      {s.value != null ? s.value.toFixed(2) : '—'}
                    </div>
                    {s.value != null && (
                      <div style={{ marginTop: '6px', height: '3px', borderRadius: 2, background: COLORS.border, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(100, Math.max(0, s.value * 100))}%`,
                            background: scoreColor(s.value),
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
