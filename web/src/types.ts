export interface PriceRow {
  ticker: string
  date: string
  open: number | null
  high: number | null
  low: number | null
  close: number
  volume: number | null
  created_at: string
  [key: string]: unknown
}

export interface AnomalyRow {
  id: number
  ticker: string | null
  date: string | null
  anomaly_score: number | null
  severity: string | null
  model_used: string | null
  created_at: string
}

export interface ForecastRow {
  id: number
  ticker: string | null
  forecast_date: string | null
  predicted_at: string | null
  yhat: number | null
  yhat_upper: number | null
  yhat_lower: number | null
  model_used: string | null
  horizon_days: number | null
  created_at: string
}

export interface WeightRow {
  id: number
  ticker: string | null
  weight: number | null
  method: string | null
  calculated_at: string | null
  created_at: string
}

export interface SentimentRow {
  id: number
  ticker: string | null
  headline: string | null
  source: string | null
  published_at: string
  sentiment: string | null
  score: number | null
  created_at: string
}

export interface HealthStatus {
  status: string
  database: string
  version: string
}

export type ComparePayload = Record<string, ForecastRow[] | ForecastRow>

export interface TechnicalSnapshot {
  symbol: string
  timestamp_ms: number
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  volume: number | null
  quote_volume: number | null
  trades_count: number | null
  ret_1b: number | null
  ret_5b: number | null
  ret_10b: number | null
  ret_60b: number | null
  ret_open_to_close: number | null
  hl_range: number | null
  body_range: number | null
  dist_sma_20: number | null
  dist_sma_50: number | null
  dist_sma_200: number | null
  ema_diff_9_21: number | null
  ema_diff_21_50: number | null
  vol_20: number | null
  vol_60: number | null
  atr_14_norm: number | null
  volume_rel_20: number | null
  taker_buy_vol_ratio: number | null
  trade_window_count: number | null
  trade_window_vol_base: number | null
  trade_window_vol_quote: number | null
  trade_buy_vol_ratio: number | null
  avg_trade_size: number | null
  median_trade_size: number | null
  large_trade_vol_ratio: number | null
  bid_price: number | null
  ask_price: number | null
  bid_qty: number | null
  ask_qty: number | null
  spread_abs: number | null
  spread_bps: number | null
  top_book_imbalance: number | null
  depth_bid_total: number | null
  depth_ask_total: number | null
  depth_imbalance: number | null
  high_24h: number | null
  low_24h: number | null
  last_price_24h: number | null
  range_24h: number | null
  pct_change_24h: number | null
  pos_in_24h_range: number | null
  volume_24h: number | null
  quote_volume_24h: number | null
  funding_rate: number | null
  funding_rate_lag_3: number | null
  funding_rate_change: number | null
  funding_rate_zscore: number | null
  time_to_next_funding_min: number | null
  open_interest: number | null
  oi_change_1h: number | null
  oi_change_24h: number | null
  oi_to_volume_24h: number | null
  trend_score: number | null
  mean_reversion_score: number | null
  liquidity_score: number | null
  order_flow_score: number | null
  sentiment_score: number | null
}

export interface CompanyFundamental {
  ticker: string
  filing_date: string
  fiscal_period: string
  fiscal_year: number
  filing_type: string
  revenue: number | null
  cost_of_revenue: number | null
  gross_profit: number | null
  operating_expenses: number | null
  operating_income: number | null
  interest_expense: number | null
  pre_tax_income: number | null
  income_tax_expense: number | null
  net_income: number | null
  eps_basic: number | null
  eps_diluted: number | null
  cash: number
  short_term_investments: number | null
  accounts_receivable: number | null
  inventory: number | null
  current_assets: number | null
  total_assets: number | null
  current_liabilities: number | null
  short_term_debt: number | null
  long_term_debt: number | null
  total_liabilities: number | null
  equity: number | null
  operating_cash_flow: number | null
  investing_cash_flow: number | null
  financing_cash_flow: number | null
  capital_expenditure: number | null
  shares_outstanding: number | null
  weighted_average_shares: number | null | number
  current_price: number
  market_cap: number | null
  earnings: number | null
  eps_estimates: number | null
  revenue_estimates: number | null
  earnings_surprise: number | null
  revenue_surprise: number | null
  macro_gdp: number | null
  macro_gdp_growth: number | null
  macro_inflation: number | null
  macro_interest_rates: number | null
  macro_unemployment: number | null
  macro_government_debt: number | null
  macro_exchange_rates: number | null
  company_peers: string[]
  dividends: number | null
  buybacks: number | null
  'P/E': number | null
  'P/S': number | null
  'P/B': number | null
  'EV/EBITDA': number | null
  ROE: number | null
  ROA: number | null
  'Debt/Equity': number | null
}
