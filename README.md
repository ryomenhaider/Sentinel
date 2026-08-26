<div align="center">

  # Sentinel

A financial data pipeline and dashboard. It ingests market data, runs ML models, and displays results through a React frontend.

[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF)](https://vite.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791)](https://www.postgresql.org/)
[![MLflow](https://img.shields.io/badge/MLflow-1.27-0194E2)](https://mlflow.org/)
</div>

1. Fetches stock prices (yfinance), crypto (CCXT), macro indicators (FRED), and news (newsdata.io)
2. Engineers features (returns, lags, rolling stats, RSI, Bollinger %B)
3. Runs anomaly detection (Isolation Forest + LOF), price forecasting (Prophet + XGBoost), sentiment analysis (FinBERT), and portfolio optimization (scipy)
4. Serves results via a REST API
5. Displays everything in a 7-page React dashboard

## Tech

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, PostgreSQL
- **Frontend:** React 19, TypeScript, Vite 8, Plotly
- **ML:** scikit-learn, PyOD, Prophet, XGBoost, FinBERT, scipy
- **MLOps:** MLflow (local file tracking), PSI/KS drift detection
- **CLI:** Typer (`stl`)

## Setup

### Backend

```bash
uv sync

cp .env.example .env
# Edit .env — DB_URL must point to a PostgreSQL instance

# Initialize schema
psql "$DB_URL" -f src/sentinel/database/schema.sql
psql "$DB_URL" -f src/sentinel/database/seed_data.sql

# Ingest data
python -m sentinel.ingestion.v1.ingestion_pipeline

# Train models
python -m sentinel.ml.train_pipeline

# Start API
uvicorn sentinel.api.main:app --host 0.0.0.0 --port 7860
```

Individual ingestion stages:

```bash
python -m sentinel.ingestion.v1.price_fetcher
python -m sentinel.ingestion.v1.crypto_fetcher
python -m sentinel.ingestion.v1.macro_fetcher
python -m sentinel.ingestion.v1.news_fetcher
python -m sentinel.ingestion.v1.feature_engineer
```

### Frontend

```bash
cd web
npm install
npm run dev        # → http://localhost:5173
npm run build      # production build
```

In dev mode, Vite proxies `/api/*` to `http://localhost:7860`.

### CLI

```bash
stl ingest        # run ingestion pipeline
stl ml-train      # train all models
stl api-start     # start the API
stl all           # ingest → train → start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/v1/prices/compare?tickers=AAPL,MSFT` | Latest quotes |
| GET | `/api/v1/prices/{ticker}` | Quote for one asset |
| GET | `/api/v1/prices/{ticker}/history?limit=90` | OHLCV history |
| GET | `/api/v1/anomalies/latest` | Most recent anomaly |
| GET | `/api/v1/anomalies/?ticker=AAPL&days=30` | Anomalies for one asset |
| POST | `/api/v1/anomalies/detect/{ticker}` | On-demand detection |
| GET | `/api/v1/forecasts/{ticker}?horizon=30` | Forecast |
| GET | `/api/v1/forecasts/compare?tickers=...&horizon=30` | Compare forecasts |
| GET | `/api/v1/sentiment/heatmap` | Sentiment per ticker |
| GET | `/api/v1/sentiment/timeline?ticker=&days=` | Sentiment history |
| GET | `/api/v1/sentiment/{ticker}?days=` | Sentiment for one asset |
| GET | `/api/v1/portfolio/weights` | Optimized weights |
| GET | `/api/v1/portfolio/optimize` | Re-run optimization |
| GET | `/api/v1/analysis/technical/{symbol}` | Crypto technicals |
| GET | `/api/v1/analysis/fundamental/{ticker}` | Stock fundamentals |

Docs at `/api/v1/docs` (Swagger) and `/api/v1/redoc` (ReDoc).

## Configuration

All config is env-var driven. See `.env.example`.

| Variable | Purpose |
|----------|---------|
| `DB_URL` | PostgreSQL connection string |
| `FRED_API_KEY` | FRED macro data |
| `NEWSDATA_API_KEY` | News ingestion |
| `MLFLOW_TRACKING_URI` | MLflow URI (default: `http://localhost:5000`) |
| `LOG_LEVEL` | INFO / DEBUG / WARNING |
| `DATA_DIR` | Local data directory (default: `./data`) |
| `SEC_USERNAME` | SEC EDGAR username (for fundamental data) |
| `SEC_EMAIL` | SEC EDGAR email |
| `FINNHUB_API` | Finnhub API key |
| `SMTP_*` | Email alert config (for drift alerts) |
| `SLACK_WEBHOOK_URL` | Slack alert config |

Frontend: `web/.env.production` sets `VITE_API_URL`.

## Project Structure

```
src/sentinel/
  api/
    main.py                  # app factory, CORS, routers
    routers/v1/              # prices, anomalies, forecasts, sentiment, portfolio
    routers/v2/              # analysis (technical + fundamental)
    schemas/                 # Pydantic response models
  cli/cli.py                 # stl Typer CLI
  config/settings.py         # env-var config
  database/
    connection.py            # SQLAlchemy engine + sessions
    models.py                # ORM models
    crud_v1.py / crud_v2.py  # DB operations
    schema.sql               # DDL
    seed_data.sql            # seed data
  ingestion/
    v1/                      # price, crypto, macro, news, feature_engineer, pipeline
    v2/                      # analysis_data, hermes, historical, macro_data
  ml/
    anomaly_detector.py      # PyOD IForest + LOF
    forecaster.py            # Prophet + XGBoost
    sentiment_engine.py      # FinBERT scoring
    portfolio_optimizer.py   # MPT, Black-Litterman, Kelly
    feature_store.py         # cached feature retrieval
    model_registry.py        # MLflow save/load
    train_pipeline.py        # orchestrated training
  mlops/drift_detector.py    # PSI + KS drift detection
  scheduler/jobs.py          # job runner

web/                         # React SPA (Vite + TypeScript + Plotly)
  src/pages/                 # 7 pages
  src/components/            # Navbar, AlertToast, ErrorBoundary, Plot
  src/api.ts                 # API client
  src/types.ts               # TypeScript interfaces
  src/theme.ts               # dark theme
```

## Dashboard Pages

1. **Market Overview** — candlestick chart, Bollinger Bands, RSI, KPI cards
2. **Anomalies** — detected anomalies with severity labels
3. **Forecasts** — price predictions with confidence intervals
4. **Technical** — crypto technicals (RSI, MACD, Bollinger, ATR, funding rate, open interest)
5. **Fundamental** — stock financials (income, balance sheet, cash flow, valuation ratios)
6. **Portfolio** — optimized weight allocation
7. **Sentiment** — news sentiment heatmap and timelines

## Known limitations

- Auth is stubbed out (code exists but is commented out, no enforcement)
- The jobs endpoint is commented out
- MLflow uses local file tracking, not a remote server
- No unit tests
- Default ML training only runs on 5 tickers (AAPL, MSFT, NVDA, TSLA, GOOGL) even though ingestion fetches more
- The `__main__.py` is a stub (prints "Hello from sentinel!")
- Production runs on Render free-tier with cold starts
