# Sentinel

> **Financial intelligence platform: real-time data ingestion, anomaly detection, time-series forecasting, and news-sentiment analytics, served through a React dashboard.**

[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF)](https://vite.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-SQLAlchemy-336791)](https://www.postgresql.org/)

## Overview

Sentinel ingests financial data from multiple public sources, engineers features, trains and serves ML models (anomaly detection, forecasting, sentiment), and exposes everything through a REST API and a React single-page app.

- **Backend** — FastAPI serves the REST API only (no embedded frontend).
- **Frontend** — a Vite + React + TypeScript SPA in [`web/`](web/) with a dark, Bloomberg-style dashboard (Plotly charts). It calls the API via CORS (dev: `localhost:5173`, prod: Vercel).

**What's real in this repo today:** every pipeline, model, endpoint, and dashboard page listed below runs. See [Roadmap](#-roadmap) for what's next.

---

## Key Features

### Data Ingestion
- **Multi-source collection:** stocks (yfinance), crypto (CCXT), macro indicators (FRED), financial news (newsdata.io)
- **Feature engineering:** log returns, lags, rolling stats, RSI, Bollinger %B, volume ratios
- Pipeline runner with per-stage pass/fail reporting (`ingestion/ingestion_pipeline.py`)

### Machine Learning
- **Anomaly detection** — Isolation Forest + LOF (PyOD), written to DB with severity labels
- **Time-series forecasting** — Prophet + XGBoost with walk-forward cross-validation (30/90-day horizons)
- **Sentiment analysis** — FinBERT (Hugging Face `transformers`) scoring news headlines
- **Portfolio optimization** — risk-constrained weight allocation via scipy
- **Model tracking** — MLflow registry with metrics, params, and artifacts

### MLOps — Drift Detection
- **PSI + Kolmogorov–Smirnov** tests per feature against a rolling baseline
- Email + Slack alerting on drift
- CLI runner: `python mlops/drift_detector.py --tickers AAPL,MSFT`
- (Roadmap: persist drift runs, expose via API, visualize, add Prometheus/Grafana — see [Phase 3](res/PHASE_3_OBSERVABILITY.md))

### React Dashboard (`web/`)
- 5 pages: Market Overview, Anomalies, Forecasts, Portfolio, Sentiment
- Dark "Bloomberg-style" theme, Plotly candlesticks + KPIs
- Vite + React 19 + TypeScript, deployable to any static host (Vercel, Netlify…)

### RESTful API
- OpenAPI/Swagger at `/api/docs`
- Health check at `/api/health`
- Routers: prices, anomalies, forecasts, sentiment, portfolio

---

## Architecture

```
┌──────────────┐        ┌───────────────────────────┐
│   Browser    │        │     FastAPI backend       │
│              │  CORS  │                           │
│  React SPA   │◄──────►│  /api/prices              │
│  (web/,      │  JSON  │  /api/anomalies           │
│  Vite/Vercel)│        │  /api/forecasts           │
└──────────────┘        │  /api/sentiment           │
                        │  /api/portfolio           │
                        └─────────────┬─────────────┘
                                      │
                        ┌─────────────▼─────────────┐
                        │  PostgreSQL (SQLAlchemy)  │
                        │  Supabase / local /       │
                        │  managed                  │
                        └───────────────────────────┘

    Data sources: yfinance · CCXT · FRED · newsdata.io
    ML: PyOD · Prophet · XGBoost · FinBERT · scipy   → MLflow registry
    MLOps: drift detection (PSI + KS) → email/Slack alerts
    Scheduling: scheduler/ job runner (ingest · features · retrain · drift)
```

The frontend and API are decoupled: the API is a pure JSON backend, and the SPA can be served from any static host. PostgreSQL is the only external dependency of the backend.

---

## Tech Stack

| Component     | Technology                         |
|---------------|------------------------------------|
| Backend       | FastAPI 0.111 + uvicorn            |
| Frontend      | React 19 + TypeScript + Vite + Plotly |
| Database      | PostgreSQL via SQLAlchemy 2.0      |
| ML            | scikit-learn, PyOD, Prophet, XGBoost, scipy |
| NLP           | FinBERT (`transformers`, CPU)      |
| ML Ops        | MLflow 2.13, PSI/KS drift detection |
| Python        | 3.12 (pinned, `>=3.11,<3.13`)     |

---

## Quick Start

### Backend (API)

```bash
# 1. Install (uv recommended — pinned in pyproject.toml / uv.lock)
uv sync

# 2. Configure environment
cp .env.example .env
#    - DB_URL must point to a reachable PostgreSQL
#      (local, Docker, or Supabase pooler URL)

# 3. Initialize schema + seed data
#    Option A — Supabase: paste database/schema.sql then database/seed_data.sql
#              into the SQL Editor (recommended)
#    Option B — any Postgres: psql "$DB_URL" -f database/schema.sql && psql "$DB_URL" -f database/seed_data.sql

# 4. Ingest data (see Orchestration for automation)
python -m ingestion.ingestion_pipeline        # or individually:
python -m ingestion.price_fetcher
python -m ingestion.crypto_fetcher
python -m ingestion.macro_fetcher
python -m ingestion.news_fetcher
python -m ingestion.feature_engineer

# 5. Train models
python -m ml.train_pipeline

# 6. Run the API
uvicorn api.main:app --host 0.0.0.0 --port 7860

# 7. Verify
curl http://localhost:7860/api/health          # {"status":"ok","database":"connected",...}
```

### Frontend (web/)

```bash
cd web
npm install
npm run dev          # → http://localhost:5173
npm run build        # production build (dist/)
```

The frontend calls the API at the URL in `web/.env.production` (`VITE_API_URL`); for local dev, point it at `http://localhost:7860`. The API currently allows CORS origins `http://localhost:5173` and the Vercel deployment (see `api/main.py`).

### Access
| Service           | URL                       |
|-------------------|---------------------------|
| Dashboard (dev)   | http://localhost:5173     |
| API Docs (Swagger)| http://localhost:7860/api/docs |
| Health            | http://localhost:7860/api/health |

---

## Project Structure

```
├── api/                        # FastAPI application
│   ├── main.py                # App factory, CORS, routers
│   ├── schemas.py             # Pydantic response models
│   └── routers/               # prices · anomalies · forecasts · sentiment · portfolio
├── web/                        # React SPA (Vite + TypeScript + Plotly)
│   ├── src/pages/             # overview · anomalies · forecasts · portfolio · sentiment
│   ├── src/api.ts             # API client
│   └── vite.config.ts
├── ingestion/                  # Data collection
│   ├── price_fetcher.py       # yfinance OHLCV
│   ├── crypto_fetcher.py      # CCXT
│   ├── macro_fetcher.py       # FRED
│   ├── news_fetcher.py        # newsdata.io + FinBERT sentiment
│   ├── feature_engineer.py    # RSI, Bollinger, lags, rolling stats
│   └── ingestion_pipeline.py  # stage runner
├── ml/                         # Models
│   ├── anomaly_detector.py    # PyOD IForest + LOF
│   ├── forecaster.py          # Prophet + XGBoost, walk-forward CV
│   ├── sentiment_engine.py    # FinBERT scoring
│   ├── portfolio_optimizer.py # scipy MVO
│   ├── feature_store.py
│   ├── model_registry.py      # MLflow save/load/promote
│   └── train_pipeline.py      # orchestrated training with metrics
├── mlops/
│   └── drift_detector.py      # PSI + KS drift detection, Slack/email alerts
├── scheduler/
│   └── jobs.py                # job runner: ingest · features · retrain · drift
├── cli/                        # CLI entrypoints
├── database/                   # SQLAlchemy models, CRUD, schema.sql + seed_data.sql
├── config/                     # settings.py, logging_config.py (JSON logs)
├── res/                        # Roadmap docs (Phase 1–5)
└── .python-version             # Python 3.12 (uv)
```

---

## API Reference

| Endpoint                     | Description                        |
|------------------------------|------------------------------------|
| `GET /api/health`            | App + DB health                     |
| `GET /api/prices/compare?tickers=AAPL,MSFT` | Latest quotes, multi-asset |
| `GET /api/prices/{ticker}`   | Latest price                        |
| `GET /api/prices/{ticker}/history?limit=90` | OHLCV history          |
| `GET /api/anomalies/detected?ticker=&days=` | Detected anomalies      |
| `GET /api/anomalies/{ticker}`| Anomalies for one asset             |
| `GET /api/forecasts/{ticker}?days=30` | Prophet/XGBoost forecast     |
| `GET /api/forecasts/compare/{ticker}` | Actual vs predicted           |
| `GET /api/sentiment/heatmap` | Latest sentiment per ticker         |
| `GET /api/sentiment/timeline?ticker=&days=` | Sentiment history      |
| `GET /api/portfolio/metrics` | Portfolio metrics                   |
| `POST /api/portfolio/optimize` | Run optimization                  |

Full interactive docs: `/api/docs`

---

## Configuration

All configuration is environment-driven (`config/settings.py`). See `.env.example`.

| Variable            | Purpose                                    |
|---------------------|--------------------------------------------|
| `DB_URL`            | SQLAlchemy PostgreSQL URL (Supabase-ready) |
| `API_KEYS`          | `service:key,service:key` map              |
| `FRED_API_KEY`      | FRED macro data                            |
| `NEWSDATA_API_KEY`  | News ingestion                             |
| `MLFLOW_URI`        | MLflow tracking URI (default `http://localhost:5000`) |
| `LOG_LEVEL`         | INFO / DEBUG / WARNING                     |
| `DATA_DIR`          | Local data directory (default `./data`)    |

Frontend build-time config lives in `web/.env.production` (`VITE_API_URL`).

---

## Orchestration & Scheduling

- **Today:** ingestion and training are CLI-driven (`python -m ...`), or run through the job runner: `python -m scheduler.jobs ingest` (also `features`, `retrain`, `drift`).
- **Planned:** APScheduler inside the app + GitHub Actions cron for cloud scheduling.

---

## Testing

```bash
# Pipelines (each exits non-zero on failure)
python -m ingestion.ingestion_pipeline
python -m ml.train_pipeline

# Scheduled jobs
python -m scheduler.jobs ingest

# Drift detection CLI
python mlops/drift_detector.py --tickers AAPL,MSFT --send-alerts

# API smoke checks
curl http://localhost:7860/api/health
curl http://localhost:7860/api/prices/AAPL/history?limit=5

# Frontend
cd web && npm run lint && npm run build
```

---

## Changelog

### v0.2.0
- Python 3.12 (was 3.11)
- Replaced Dash dashboard with a React 19 + Vite + TypeScript SPA (`web/`)
- API is now a pure JSON backend (Dash/WSGI mount removed); CORS for Vercel + localhost:5173
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

**Made with ❤️**

*For issues or questions, open a GitHub issue.*