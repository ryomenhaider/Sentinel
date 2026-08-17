import type {
  AnomalyRow,
  ComparePayload,
  ForecastRow,
  HealthStatus,
  PriceRow,
  SentimentRow,
  WeightRow,
} from './types'

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const backendUrl = import.meta.env.VITE_API_URL || 'https://sentinel-ggi8.onrender.com'
  const url = new URL(path, backendUrl)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    }
  }
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
  health: () => get<HealthStatus>('/api/health'),
  priceHistory: (ticker: string, limit: number) =>
    get<PriceRow[]>(`/api/prices/${ticker}/history`, { limit }),
  anomalies: (ticker: string, days: number) =>
    get<AnomalyRow[]>(`/api/anomalies`, { ticker, days }),
  forecast: (ticker: string, horizon: number) =>
    get<ForecastRow[]>(`/api/forecasts/${ticker}`, { horizon }),
  forecastCompare: (tickers: string, horizon: number) =>
    get<ComparePayload>(`/api/forecasts/compare`, { tickers, horizon }),
  weights: () => get<WeightRow[]>(`/api/portfolio/weights`),
  sentiment: (ticker: string, days: number) =>
    get<SentimentRow[]>(`/api/sentiment/${ticker}`, { days }),
}
