# Sentinel

> **A financial intelligence platform** — ingests market data, detects anomalies, forecasts prices, and scores news sentiment, all served through a dark, Bloomberg-style React dashboard.

[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF)](https://vite.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791)](https://www.postgresql.org/)
[![MLflow](https://img.shields.io/badge/MLflow-1.27-0194E2)](https://mlflow.org/)

---

## Overview

Sentinel is a full-stack pipeline that turns raw financial data into decisions:

1. **Ingest** — collect stocks, crypto, macro indicators, and news from public sources.
2. **Engineer** — build features (returns, lags, rolling stats, RSI, Bollinger %B).
3. **Model** — train anomaly detection, forecasting, sentiment, and portfolio models.
4. **Serve** — expose everything through a REST API and a single-page React dashboard.
5. **Monitor** — track model drift (PSI + KS) and alert via email/Slack.

The backend and frontend are fully decoupled: the API is a pure JSON service, and the SPA can be hosted anywhere. **PostgreSQL is the only external dependency of the backend.**

> **Status:** every pipeline, model, endpoint, and dashboard page listed below is implemented and runnable. See [Roadmap](#roadmap) for what's next.

---

## Highlights

| Area | What you get |
|------|--------------|
| **Data ingestion** | Stocks (yfinance), crypto (CCXT), macro (FRED), news (newsdata.io); feature engineering; stage-runner with pass/fail reporting |
| **Anomaly detection** | Isolation Forest + LOF (PyOD), written to DB with severity labels |
| **Forecasting** | Prophet + XGBoost with walk-forward cross-validation (30/90-day horizons) |
| **Sentiment analysis** | FinBERT (`transformers`, CPU) scoring news headlines |
| **Portfolio optimization** | Risk-constrained weight allocation via scipy |
| **Technical analysis** | Real-time crypto technicals: RSI, MACD, Bollinger, ATR, funding rate, open interest, composite scores |
| **Fundamental analysis** | Stock fundamentals: income, balance sheet, cash flow, valuation ratios, earnings estimates, macro indicators |
| **Model tracking** | MLflow registry with metrics, params, and artifacts |
| **Drift detection** | PSI + Kolmogorov–Smirnov tests vs. a rolling baseline, with email/Slack alerting |
| **Dashboard** | 7 pages: Market Overview, Anomalies, Forecasts, Technical, Fundamental, Portfolio, Sentiment — Plotly charts, KPI cards |
| **API** | OpenAPI docs at `/api/docs`, health check at `/api/health`, 7 routers |
| **Automation** | Job runner for `ingest · features · retrain · drift`, plus a `stl` CLI |

---

## Architecture

```
┌──────────────┐        ┌──────────────────────────────────────┐
│   Browser    │  CORS  │           FastAPI backend             │
│              │◄──────►│  /api/v1/prices      /api/v1/jobs     │
│  React SPA   │  JSON  │  /api/v1/anomalies   /api/v1/sentiment│
│  (web/, Vite)│        │  /api/v1/forecasts   /api/v1/portfolio│
│  7 pages     │        │  /api/v1/analysis                     │
└──────────────┘        └──────────────┬───────────────────────┘
                                       │
                        ┌──────────────▼────────────────┐
                        │   PostgreSQL (SQLAlchemy 2.0)  │
                        │   local · Docker · Supabase    │
                        └───────────────────────────────┘

  Data sources:  yfinance · CCXT · FRED · newsdata.io
  ML:            PyOD · Prophet · XGBoost · FinBERT · scipy   →  MLflow registry
  MLOps:         drift detection (PSI + KS)                   →  email / Slack alerts
  Automation:    scheduler/ job runner · stl CLI
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI + uvicorn |
| Frontend | React 19 + TypeScript + Vite 8 + Plotly |
| Database | PostgreSQL via SQLAlchemy 2.0 |
| ML | scikit-learn, PyOD, Prophet, XGBoost, scipy |
| NLP | FinBERT (`transformers`, CPU) |
| MLOps | MLflow 1.27, PSI/KS drift detection |
| Python | 3.12 (pinned `>=3.11,<3.13`, uv) |

---

## Getting Started

### 1. Backend (API)

```bash
# Install dependencies (uv recommended — pinned in pyproject.toml / uv.lock)
uv sync

# Configure environment
cp .env.example .env
#   DB_URL must point to a reachable PostgreSQL
#   (local, Docker, or Supabase pooler URL)

# Initialize schema + seed data
#   Option A — Supabase: paste src/sentinel/database/schema.sql then
#              src/sentinel/database/seed_data.sql into the SQL Editor (recommended)
#   Option B — any Postgres:
psql "$DB_URL" -f src/sentinel/database/schema.sql && psql "$DB_URL" -f src/sentinel/database/seed_data.sql

# Ingest data (individual fetchers also available, see below)
python -m sentinel.ingestion.v1.ingestion_pipeline

# Train models
python -m sentinel.ml.train_pipeline

# Run the API
uvicorn sentinel.api.main:app --host 0.0.0.0 --port 7860

# Verify
curl http://localhost:7860/api/health
```

Individual pipeline stages:

```bash
python -m sentinel.ingestion.v1.price_fetcher      # stocks  (yfinance)
python -m sentinel.ingestion.v1.crypto_fetcher      # crypto  (CCXT)
python -m sentinel.ingestion.v1.macro_fetcher       # macro   (FRED)
python -m sentinel.ingestion.v1.news_fetcher        # news    (newsdata.io)
python -m sentinel.ingestion.v1.feature_engineer    # features
```

### 2. Frontend (`web/`)

```bash
cd web
npm install
npm run dev        # → http://localhost:5173
npm run lint       # oxlint
npm run build      # production build (dist/)
```

The frontend calls the API at the URL in `web/.env.production` (`VITE_API_URL`); for local dev, Vite proxies `/api/*` to `http://localhost:7860`. CORS is open (`allow_origins=["*"]`) — safe since the API serves public data with no auth.

### 3. CLI (`stl`)

The `stl` entrypoint wraps the common workflows:

```bash
stl ingest        # run the ingestion pipeline
stl ml-train      # train all models
stl api-start     # start the API (uvicorn, reload on)
stl all           # ingest → train → start the API
```

### Access

| Service | URL |
|---------|-----|
| Dashboard (dev) | http://localhost:5173 |
| API Docs (Swagger) | http://localhost:7860/api/v1/docs |
| ReDoc | http://localhost:7860/api/v1/redoc |
| Health | http://localhost:7860/api/health |

---

## Project Structure

```
├── src/sentinel/                   # Main Python package
│   ├── api/
│   │   ├── main.py                # app factory, CORS, middleware, routers
│   │   ├── auth.py                # stubbed JWT/API-key auth
│   │   ├── schemas/               # Pydantic response models
│   │   └── routers/
│   │       ├── v1/                # prices · anomalies · forecasts · sentiment · portfolio
│   │       ├── v2/                # analysis (technical + fundamental)
│   │       └── jobs.py            # job trigger endpoint
│   ├── cli/
│   │   └── cli.py                 # `stl` Typer CLI
│   ├── config/
│   │   ├── settings.py            # env-var driven configuration
│   │   └── logging_config.py      # JSON structured logging (rotating file + console)
│   ├── database/
│   │   ├── connection.py          # SQLAlchemy engine + session factory
│   │   ├── models.py              # ORM models (MarketData, CryptoPrice, …)
│   │   ├── crud.py                # insert/select/upsert operations
│   │   ├── schema.sql             # DDL for core tables
│   │   ├── seed_data.sql          # seed data
│   │   ├── 002_crypto_data.sql    # crypto schema
│   │   └── analysis.sql           # analysis tables DDL
│   ├── ingestion/
│   │   ├── v1/                    # price · crypto · macro · news · feature_engineer · pipeline
│   │   └── v2/                    # analysis_data · hermes · historical · macro_data
│   ├── ml/
│   │   ├── anomaly_detector.py    # PyOD IForest + LOF
│   │   ├── forecaster.py          # Prophet + XGBoost, walk-forward CV
│   │   ├── sentiment_engine.py    # FinBERT scoring
│   │   ├── portfolio_optimizer.py # scipy MVO, Black-Litterman, Kelly
│   │   ├── feature_store.py       # in-memory cached feature retrieval
│   │   ├── model_registry.py      # MLflow save/load/promote
│   │   └── train_pipeline.py      # orchestrated training with metrics
│   ├── mlops/
│   │   └── drift_detector.py      # PSI + KS drift detection, Slack/email alerts
│   ├── scheduler/
│   │   └── jobs.py                # job runner: ingest · features · retrain · drift
│   ├── constants.py               # default tickers (18 stocks) & crypto symbols (20)
│   └── __main__.py                # package entrypoint
├── web/                            # React SPA (Vite + TypeScript + Plotly)
│   ├── src/
│   │   ├── pages/                 # overview · anomalies · forecasts · technical · fundamental · portfolio · sentiment
│   │   ├── components/            # Navbar, AlertToast, ErrorBoundary, Plot, ui
│   │   ├── api.ts                 # API client (dev proxy-aware)
│   │   ├── types.ts               # TypeScript interfaces
│   │   └── theme.ts               # dark Bloomberg-style theme
│   └── vite.config.ts
├── res/
│   └── chechlist.md               # v1 implementation checklist (25 areas)
├── .github/workflows/
│   └── scheduled_jobs.yml         # GitHub Actions (placeholder)
├── pyproject.toml                  # Python project + dependencies
├── uv.lock                         # uv lockfile
├── .env.example                    # environment variable template
├── .python-version                 # Python 3.12 (uv)
└── README.md
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | App + DB health |
| GET | `/api/v1/prices/compare?tickers=AAPL,MSFT` | Latest quotes, multi-asset |
| GET | `/api/v1/prices/{ticker}` | Latest quote for one asset |
| GET | `/api/v1/prices/{ticker}/history?limit=90` | OHLCV history |
| GET | `/api/v1/anomalies/latest` | Most recent detected anomaly |
| GET | `/api/v1/anomalies/?ticker=AAPL&days=30` | Anomalies for one asset |
| POST | `/api/v1/anomalies/detect/{ticker}` | Run on-demand anomaly detection |
| GET | `/api/v1/forecasts/{ticker}?horizon=30` | Forecast for one asset |
| GET | `/api/v1/forecasts/compare?tickers=...&horizon=30` | Forecasts across assets |
| GET | `/api/v1/forecasts/accuracy` | Forecast accuracy (WIP) |
| GET | `/api/v1/sentiment/heatmap` | Latest sentiment per ticker |
| GET | `/api/v1/sentiment/timeline?ticker=&days=` | Sentiment history for an asset |
| GET | `/api/v1/sentiment/{ticker}?days=` | Sentiment for one asset |
| GET | `/api/v1/portfolio/weights` | Latest optimized weights |
| GET | `/api/v1/portfolio/optimize` | Re-run portfolio optimization |
| GET | `/api/v1/portfolio/backtest` | Backtest (WIP) |
| GET | `/api/v1/analysis/technical/{symbol}` | Crypto technical snapshot (BTCUSDT, ETHUSDT, …) |
| GET | `/api/v1/analysis/fundamental/{ticker}` | Stock fundamental snapshot (NVDA, AAPL, …) |

Interactive docs: `/api/docs` (Swagger) · `/api/redoc` (ReDoc)

---

## Configuration

All configuration is environment-driven (`config/settings.py`). See `.env.example`.

| Variable | Purpose |
|----------|---------|
| `DB_URL` | SQLAlchemy PostgreSQL URL (Supabase-ready) |
| `API_KEYS` | `service:key,service:key` map |
| `FRED_API_KEY` | FRED macro data |
| `NEWSDATA_API_KEY` | News ingestion |
| `MLFLOW_URI` | MLflow tracking URI (default `http://localhost:5000`) |
| `LOG_LEVEL` | INFO / DEBUG / WARNING |
| `DATA_DIR` | Local data directory (default `./data`) |

Frontend build-time config lives in `web/.env.production` (`VITE_API_URL`). In dev mode, requests are proxied through Vite to the backend automatically.

---

## Orchestration & Scheduling

- **Today:** ingestion and training are CLI-driven (`python -m ...`), or run through the job runner:

  ```bash
  python -m sentinel.scheduler.jobs ingest     # also: features · retrain · drift
  ```

- **Planned:** APScheduler inside the app + GitHub Actions cron for cloud scheduling (see `res/chechlist.md`).

---

## Testing

```bash
# Pipelines (each exits non-zero on failure)
python -m sentinel.ingestion.v1.ingestion_pipeline
python -m sentinel.ml.train_pipeline

# Scheduled jobs
python -m sentinel.scheduler.jobs ingest

# Drift detection CLI
python -m sentinel.mlops.drift_detector --tickers AAPL,MSFT --send-alerts

# API smoke checks
curl http://localhost:7860/api/health
curl http://localhost:7860/api/v1/prices/AAPL/history?limit=5

# Frontend
cd web && npm run lint && npm run build
```

---

## Changelog

### v0.3.0
- Added Technical Analysis page (crypto technicals: RSI, MACD, Bollinger, ATR, funding/OI, composite scores)
- Added Fundamental Analysis page (stock fundamentals: income, balance sheet, cash flow, valuation, earnings, macro indicators)
- Sidebar wake-up button with 60s countdown (for Render free-tier cold starts)
- CORS opened to `allow_origins=["*"]` (public data API, no auth)
- Frontend API client uses Vite proxy in dev mode (no CORS issues locally)
- Unified all API paths under `/api/v1/`

### v0.2.0
- Python 3.12 (was 3.11)
- Replaced the Dash dashboard with a React 19 + Vite + TypeScript SPA (`web/`)
- API is now a pure JSON backend (Dash/WSGI mount removed); CORS for all origins
- Added `scheduler/` job runner (ingest · features · retrain · drift)
- Retired Airflow DAGs and the Dockerfile

### v0.1.0
- FastAPI API with 5 routers
- Ingestion: stocks, crypto, macro, news (FinBERT), feature engineering
- ML: PyOD anomalies, Prophet+XGBoost forecasts, MVO portfolio, MLflow registry
- Drift detection (PSI + KS) with email/Slack alerts
- JSON logging
- Phase 0 hygiene: dependency unification, honest docs, dead code removed

---

*For issues or questions, open a GitHub issue.*
