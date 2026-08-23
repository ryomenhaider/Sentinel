import type {
  AnomalyRow,
  CompanyFundamental,
  ComparePayload,
  ForecastRow,
  HealthStatus,
  PriceRow,
  SentimentRow,
  TechnicalSnapshot,
  WeightRow,
} from './types'

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const baseUrl =
    import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://sentinel-ggi8.onrender.com')
  const url = new URL(path, baseUrl)
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
    get<PriceRow[]>(`/api/v1/prices/${ticker}/history`, { limit }),
  anomalies: (ticker: string, days: number) =>
    get<AnomalyRow[]>(`/api/v1/anomalies`, { ticker, days }),
  forecast: (ticker: string, horizon: number) =>
    get<ForecastRow[]>(`/api/v1/forecasts/${ticker}`, { horizon }),
  forecastCompare: (tickers: string, horizon: number) =>
    get<ComparePayload>(`/api/v1/forecasts/compare`, { tickers, horizon }),
  weights: () => get<WeightRow[]>(`/api/v1/portfolio/weights`),
  sentiment: (ticker: string, days: number) =>
    get<SentimentRow[]>(`/api/v1/sentiment/${ticker}`, { days }),
  technical: (symbol: string) =>
    get<TechnicalSnapshot>(`/api/v1/analysis/technical/${symbol}`),
  fundamental: (ticker: string) =>
    get<CompanyFundamental>(`/api/v1/analysis/fundamental/${ticker}`),
}
