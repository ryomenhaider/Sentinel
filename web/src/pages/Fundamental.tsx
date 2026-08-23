import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { api } from '../api'
import type { CompanyFundamental } from '../types'
import { COLORS, MONO, RADIUS } from '../theme'
import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StatCard,
} from '../components/ui'
import type { Cell } from '../components/ui'

const TICKERS = [
  { ticker: 'NVDA', name: 'NVIDIA', sector: 'Tech' },
  { ticker: 'AAPL', name: 'Apple', sector: 'Tech' },
  { ticker: 'GOOGL', name: 'Alphabet', sector: 'Tech' },
  { ticker: 'MSFT', name: 'Microsoft', sector: 'Tech' },
  { ticker: 'AMZN', name: 'Amazon', sector: 'Tech' },
  { ticker: 'AVGO', name: 'Broadcom', sector: 'Tech' },
  { ticker: 'META', name: 'Meta', sector: 'Tech' },
  { ticker: 'TSLA', name: 'Tesla', sector: 'Auto' },
  { ticker: 'LLY', name: 'Eli Lilly', sector: 'Health' },
  { ticker: 'WMT', name: 'Walmart', sector: 'Retail' },
  { ticker: 'AMD', name: 'AMD', sector: 'Tech' },
  { ticker: 'V', name: 'Visa', sector: 'Finance' },
  { ticker: 'XOM', name: 'Exxon Mobil', sector: 'Energy' },
  { ticker: 'JNJ', name: 'J&J', sector: 'Health' },
  { ticker: 'ORCL', name: 'Oracle', sector: 'Tech' },
  { ticker: 'COST', name: 'Costco', sector: 'Retail' },
  { ticker: 'NFLX', name: 'Netflix', sector: 'Tech' },
  { ticker: 'CRM', name: 'Salesforce', sector: 'Tech' },
]

const fmtBig = (v: number | null) => {
  if (v == null) return '—'
  const abs = Math.abs(v)
  if (abs >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  if (abs >= 1e3) return `$${(v / 1e3).toFixed(1)}K`
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const fmtDollar = (v: number | null) =>
  v != null ? `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'

const fmtPct = (v: number | null, decimals = 2) =>
  v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%` : '—'

const fmtRatio = (v: number | null, d = 2) => (v != null ? v.toFixed(d) : '—')

const fmtInt = (v: number | null) =>
  v != null ? v.toLocaleString('en-US') : '—'

const rc = (label: string, value: React.ReactNode, color?: string): Cell[] => [
  { value: <span style={{ color: COLORS.muted }}>{label}</span> },
  { value, color: color ?? COLORS.text, right: true },
]

const SECTOR_COLORS: Record<string, string> = {
  Tech: COLORS.blue,
  Health: COLORS.green,
  Retail: COLORS.amber,
  Finance: COLORS.purple,
  Energy: COLORS.red,
  Auto: COLORS.blue,
}

function TickerSearch({
  onSelect,
  initial,
}: {
  onSelect: (ticker: string) => void
  initial?: string
}) {
  const [query, setQuery] = useState(initial ?? '')
  const [open, setOpen] = useState(!initial)

  const filtered = useMemo(() => {
    if (!query) return TICKERS
    const q = query.toLowerCase()
    return TICKERS.filter(
      (t) =>
        t.ticker.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.sector.toLowerCase().includes(q),
    )
  }, [query])

  const pick = (ticker: string) => {
    onSelect(ticker)
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
        {initial}
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
          placeholder="Search stocks - Apple, NVDA, TSLA..."
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
            filtered.map((t) => (
              <button
                key={t.ticker}
                type="button"
                onClick={() => pick(t.ticker)}
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
                <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 600, color: COLORS.text, width: '56px', flexShrink: 0 }}>
                  {t.ticker}
                </span>
                <span style={{ fontSize: '11px', color: COLORS.muted, flex: 1 }}>{t.name}</span>
                <Badge text={t.sector} color={SECTOR_COLORS[t.sector] ?? COLORS.muted} />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function Fundamental() {
  const [ticker, setTicker] = useState<string | null>(null)
  const [data, setData] = useState<CompanyFundamental | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async (t: string) => {
    setLoading(true)
    setError(false)
    try {
      const d = await api.fundamental(t)
      setData(d)
    } catch {
      setData(null)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (ticker) load(ticker)
  }, [ticker, load])

  const d = data

  return (
    <div>
      <PageHeader
        eyebrow="ANALYSIS"
        title="FUNDAMENTAL ANALYSIS"
        subtitle={d ? `${d.ticker}  ·  ${d.filing_type}  ·  ${d.fiscal_period} ${d.fiscal_year}` : undefined}
        accent={COLORS.green}
        controls={ticker ? <TickerSearch onSelect={setTicker} initial={ticker} /> : undefined}
      />

      {!ticker && (
        <EmptyState
          title="Select a stock ticker"
          hint="Choose from 18 US equities across tech, healthcare, retail, and energy."
          action={<TickerSearch onSelect={setTicker} />}
        />
      )}

      {ticker && loading && (
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

      {ticker && error && (
        <ErrorState hint={`No fundamental data found for ${ticker}. It may not have been ingested yet.`} onRetry={() => load(ticker)} />
      )}

      {ticker && d && (
        <>
          {d.company_peers && d.company_peers.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px', alignItems: 'center' }}>
              <span style={{ fontFamily: MONO, fontSize: '8.5px', letterSpacing: '1.5px', color: COLORS.dim }}>PEERS</span>
              {d.company_peers.map((p) => (
                <Badge key={p} text={p} color={COLORS.muted} />
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <StatCard label="MARKET CAP" value={fmtBig(d.market_cap)} accent={COLORS.blue} />
            <StatCard label="P/E" value={fmtRatio(d['P/E'])} accent={COLORS.purple} />
            <StatCard label="ROE" value={d.ROE != null ? `${(d.ROE * 100).toFixed(1)}%` : '—'} accent={COLORS.green} />
            <StatCard label="EPS (DILUTED)" value={fmtDollar(d.eps_diluted)} accent={COLORS.amber} />
            <StatCard label="NET INCOME" value={fmtBig(d.net_income)} accent={d.net_income != null && d.net_income >= 0 ? COLORS.green : COLORS.red} />
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Card title="INCOME STATEMENT" style={{ flex: '1' }}>
              <DataTable
                headers={['METRIC', 'VALUE']}
                rows={[
                  rc('Revenue', fmtBig(d.revenue)),
                  rc('Cost of Revenue', fmtBig(d.cost_of_revenue)),
                  rc('Gross Profit', fmtBig(d.gross_profit), d.gross_profit != null && d.gross_profit >= 0 ? COLORS.green : COLORS.red),
                  rc('Operating Expenses', fmtBig(d.operating_expenses)),
                  rc('Operating Income', fmtBig(d.operating_income), d.operating_income != null && d.operating_income >= 0 ? COLORS.green : COLORS.red),
                  rc('Interest Expense', fmtBig(d.interest_expense)),
                  rc('Pre-Tax Income', fmtBig(d.pre_tax_income)),
                  rc('Income Tax', fmtBig(d.income_tax_expense)),
                  rc('Net Income', fmtBig(d.net_income), d.net_income != null && d.net_income >= 0 ? COLORS.green : COLORS.red),
                  rc('EPS (basic)', fmtDollar(d.eps_basic)),
                  rc('EPS (diluted)', fmtDollar(d.eps_diluted)),
                ]}
              />
            </Card>

            <Card title="BALANCE SHEET" style={{ flex: '1' }}>
              <DataTable
                headers={['METRIC', 'VALUE']}
                rows={[
                  rc('Cash', fmtBig(d.cash)),
                  rc('Short-Term Investments', fmtBig(d.short_term_investments)),
                  rc('Accounts Receivable', fmtBig(d.accounts_receivable)),
                  rc('Inventory', fmtBig(d.inventory)),
                  rc('Current Assets', fmtBig(d.current_assets)),
                  rc('Total Assets', fmtBig(d.total_assets)),
                  rc('Current Liabilities', fmtBig(d.current_liabilities)),
                  rc('Short-Term Debt', fmtBig(d.short_term_debt)),
                  rc('Long-Term Debt', fmtBig(d.long_term_debt)),
                  rc('Total Liabilities', fmtBig(d.total_liabilities)),
                  rc('Equity', fmtBig(d.equity), d.equity != null && d.equity >= 0 ? COLORS.green : COLORS.red),
                ]}
              />
            </Card>

            <Card title="CASH FLOW" style={{ flex: '1' }}>
              <DataTable
                headers={['METRIC', 'VALUE']}
                rows={[
                  rc('Operating', fmtBig(d.operating_cash_flow), d.operating_cash_flow != null && d.operating_cash_flow >= 0 ? COLORS.green : COLORS.red),
                  rc('Investing', fmtBig(d.investing_cash_flow), d.investing_cash_flow != null && d.investing_cash_flow >= 0 ? COLORS.green : COLORS.red),
                  rc('Financing', fmtBig(d.financing_cash_flow), d.financing_cash_flow != null && d.financing_cash_flow >= 0 ? COLORS.green : COLORS.red),
                  rc('CapEx', fmtBig(d.capital_expenditure)),
                ]}
              />
            </Card>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            <Card title="VALUATION RATIOS" style={{ flex: '1' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '4px 0' }}>
                {([
                  { label: 'P/E', value: d['P/E'] },
                  { label: 'P/S', value: d['P/S'] },
                  { label: 'P/B', value: d['P/B'] },
                  { label: 'EV/EBITDA', value: d['EV/EBITDA'] },
                  { label: 'ROA', value: d.ROA },
                ] as const).map((r) => (
                  <div
                    key={r.label}
                    style={{
                      flex: '1',
                      minWidth: '90px',
                      padding: '12px 14px',
                      background: COLORS.bg2,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: RADIUS.sm,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontFamily: MONO, fontSize: '8px', letterSpacing: '1.5px', color: COLORS.dim, marginBottom: '6px' }}>
                      {r.label}
                    </div>
                    <div className="num" style={{ fontFamily: MONO, fontSize: '18px', fontWeight: 600, color: COLORS.text }}>
                      {r.value != null ? r.value.toFixed(2) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="BALANCE SHEET RATIOS" style={{ flex: '1' }}>
              <DataTable
                headers={['METRIC', 'VALUE']}
                rows={[
                  rc('Debt/Equity', fmtRatio(d['Debt/Equity'])),
                  rc('ROE', d.ROE != null ? `${(d.ROE * 100).toFixed(2)}%` : '—'),
                  rc('ROA', d.ROA != null ? `${(d.ROA * 100).toFixed(2)}%` : '—'),
                ]}
              />
            </Card>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            <Card title="EARNINGS & ESTIMATES" style={{ flex: '1' }}>
              <DataTable
                headers={['METRIC', 'VALUE']}
                rows={[
                  rc('Earnings', fmtBig(d.earnings as number | null)),
                  rc('EPS Estimates', fmtDollar(d.eps_estimates)),
                  rc('Revenue Estimates', fmtBig(d.revenue_estimates)),
                  rc('Earnings Surprise', d.earnings_surprise != null ? fmtPct(d.earnings_surprise * 100) : '—', d.earnings_surprise != null ? (d.earnings_surprise >= 0 ? COLORS.green : COLORS.red) : undefined),
                  rc('Revenue Surprise', d.revenue_surprise != null ? fmtPct(d.revenue_surprise * 100) : '—', d.revenue_surprise != null ? (d.revenue_surprise >= 0 ? COLORS.green : COLORS.red) : undefined),
                ]}
              />
            </Card>

            <Card title="SHARES & RETURNS" style={{ flex: '1' }}>
              <DataTable
                headers={['METRIC', 'VALUE']}
                rows={[
                  rc('Shares Outstanding', fmtInt(d.shares_outstanding)),
                  rc('Weighted Avg Shares', fmtInt(typeof d.weighted_average_shares === 'number' ? d.weighted_average_shares : null)),
                  rc('Dividends', fmtBig(d.dividends)),
                  rc('Buybacks', fmtBig(d.buybacks)),
                ]}
              />
            </Card>

            <Card title="MACRO INDICATORS" style={{ flex: '1' }}>
              <DataTable
                headers={['INDICATOR', 'VALUE']}
                rows={[
                  rc('GDP', d.macro_gdp != null ? `${d.macro_gdp.toLocaleString('en-US')}B` : '—'),
                  rc('GDP Growth', d.macro_gdp_growth != null ? `${d.macro_gdp_growth}%` : '—'),
                  rc('Inflation', d.macro_inflation != null ? d.macro_inflation.toFixed(1) : '—'),
                  rc('Interest Rates', d.macro_interest_rates != null ? `${d.macro_interest_rates}%` : '—'),
                  rc('Unemployment', d.macro_unemployment != null ? `${d.macro_unemployment}%` : '—'),
                  rc('Gov Debt', d.macro_government_debt != null ? `$${d.macro_government_debt.toLocaleString('en-US')}B` : '—'),
                  rc('Exchange Rates', d.macro_exchange_rates != null ? d.macro_exchange_rates.toFixed(2) : '—'),
                ]}
              />
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
