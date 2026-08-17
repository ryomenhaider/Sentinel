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
