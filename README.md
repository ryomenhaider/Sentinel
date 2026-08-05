---
title: Sentinel
emoji: 📊
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
sdk_version: "latest"
python_version: "3.11"
app_file: dashboard/app.py
pinned: false
---
# Sentinel

> **Financial intelligence platform: real-time data ingestion, anomaly detection, time-series forecasting, and news-sentiment analytics, served through a Bloomberg-style dashboard.**

[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688)](https://fastapi.tiangolo.com/)
[![Dash](https://img.shields.io/badge/Dash-3.0.4-04C8F6)](https://dash.plotly.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-SQLAlchemy-336791)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)

## 🎯 Overview

Sentinel ingests financial data from multiple public sources, engineers features, trains and serves ML models (anomaly detection, forecasting, sentiment), and exposes everything through a REST API and an interactive dashboard. It is built to run as a **single container** (FastAPI serves the API and mounts Dash via WSGI), backed by **any PostgreSQL** — including Supabase's hosted Postgres, which makes it deployable on free-tier platforms with ephemeral storage (e.g. Hugging Face Spaces).

**What's real in this repo today:** every pipeline, model, endpoint, and dashboard page listed below runs. See [Roadmap](#-roadmap) for what's next.

---

## ✨ Key Features

### 📈 Data Ingestion
- **Multi-source collection:** stocks (yfinance), crypto (CCXT), macro indicators (FRED), financial news (newsdata.io)
- **Feature engineering:** log returns, lags, rolling stats, RSI, Bollinger %B, volume ratios
- Pipeline runner with per-stage pass/fail reporting (`ingestion/ingestion_pipeline.py`)

### 🤖 Machine Learning
- **Anomaly detection** — Isolation Forest + LOF (PyOD), written to DB with severity labels
- **Time-series forecasting** — Prophet + XGBoost with walk-forward cross-validation (30/90-day horizons)
- **Sentiment analysis** — FinBERT (Hugging Face `transformers`) scoring news headlines
- **Portfolio optimization** — risk-constrained weight allocation via scipy
- **Model tracking** — MLflow registry with metrics, params, and artifacts

### 🚨 MLOps — Drift Detection
- **PSI + Kolmogorov–Smirnov** tests per feature against a rolling baseline
- Email + Slack alerting on drift
- CLI runner: `python mlops/drift_detector.py --tickers AAPL,MSFT`
- (Roadmap: persist drift runs, expose via API, visualize, add Prometheus/Grafana — see [Phase 3](res/PHASE_3_OBSERVABILITY.md))

### 📊 Interactive Dashboard
- 5 pages: Market Overview, Anomalies, Forecasts, Portfolio, Sentiment
- Dark "Bloomberg-style" theme (IBM Plex, terminal accents), Plotly candlesticks + KPIs
- Live API health indicator in the navbar (30s polling)

### 🔌 RESTful API
- OpenAPI/Swagger at `/api/docs`
- Health check at `/api/health`
- Routers: prices, anomalies, forecasts, sentiment, portfolio

---

## 🏗️ Architecture

```
                 ┌──────────────────────────────┐
                 │        Single Container      │
                 │   (uvicorn → FastAPI :7860)  │
                 │                              │
  Browser ──────►│  /api/*        FastAPI       │
                 │               routers        │
                 │                              │
                 │  /dashboard/   Dash app      │
                 │               (WSGIMiddleware)│
                 └──────────────┬───────────────┘
                                │
                 ┌──────────────▼───────────────┐
                 │   PostgreSQL (SQLAlchemy)    │
                 │  Supabase / local / managed  │
                 └──────────────────────────────┘

    Data sources: yfinance · CCXT · FRED · newsdata.io
    ML: PyOD · Prophet · XGBoost · FinBERT · scipy   → MLflow registry
    MLOps: drift detection (PSI + KS) → email/Slack alerts
```

No docker-compose, no separate services: one image, one process, one port. PostgreSQL is the only external dependency.

---

## 🔧 Tech Stack

| Component     | Technology                     |
|---------------|--------------------------------|
| Backend       | FastAPI 0.111 + uvicorn        |
| Frontend      | Dash 3.0.4 + Plotly + DBC      |
| Database      | PostgreSQL via SQLAlchemy 2.0  |
| ML            | scikit-learn, PyOD, Prophet, XGBoost, scipy |
| NLP           | FinBERT (`transformers`, CPU)  |
| ML Ops        | MLflow 2.13, PSI/KS drift detection |
| Python        | 3.11 (pinned)                  |

---

## 🚀 Quick Start (local)

```bash
# 1. Install (uv recommended — pinned in pyproject.toml / uv.lock)
uv sync

# 2. Configure environment
cp .env.example .env
#    - DB_URL must point to a reachable PostgreSQL
#      (local, Docker, or Supabase pooler URL)

# 3. Initialize schema + seed data
python init_db.py

# 4. Ingest data (see Orchestration for automation)
python -m ingestion.ingestion_pipeline        # or individually:
python -m ingestion.price_fetcher
python -m ingestion.crypto_fetcher
python -m ingestion.macro_fetcher
python -m ingestion.news_fetcher
python -m ingestion.feature_engineer

# 5. Train models
python -m ml.train_pipeline

# 6. Run the app
uvicorn api.main:app --host 0.0.0.0 --port 7860

# 7. Verify
python test_api.py        # endpoint + DB diagnostics
```

### Access
| Service           | URL                       |
|-------------------|---------------------------|
| Dashboard         | http://localhost:7860/dashboard/ |
| API Docs (Swagger)| http://localhost:7860/api/docs |
| Health            | http://localhost:7860/api/health |

---

## 📁 Project Structure

```
├── api/                        # FastAPI application
│   ├── main.py                # App factory, CORS, Dash mount, routers
│   ├── schemas.py             # Pydantic response models
│   └── routers/               # prices · anomalies · forecasts · sentiment · portfolio
├── dashboard/                  # Dash application (mounted at /dashboard/)
│   ├── app.py                 # Layout, navbar, live status tick
│   ├── theme.py               # Colors + plot theme (Bloomberg dark)
│   ├── assets/custom.css
│   └── pages/                 # overview · anomalies · forecasts · portfolio · sentiment
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
├── database/                   # SQLAlchemy models, CRUD, alembic migrations
├── config/                     # settings.py, logging_config.py (JSON logs)
├── airflow/dags/               # LEGACY Airflow DAGs (retired — see Roadmap)
├── res/                        # Roadmap docs (Phase 1–5)
├── Dockerfile                  # single-container build (CPU torch)
├── test_api.py                 # endpoint diagnostics
└── init_db.py                  # schema + seed loader
```

---

## 🔌 API Reference

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

## ⚙️ Configuration

All configuration is environment-driven (`config/settings.py`). See `.env.example`.

| Variable            | Purpose                                    |
|---------------------|--------------------------------------------|
| `DB_URL`            | SQLAlchemy PostgreSQL URL (Supabase-ready) |
| `API_KEYS`          | `service:key,service:key` map              |
| `FRED_API_KEY`      | FRED macro data                            |
| `NEWSDATA_API_KEY`  | News ingestion                             |
| `MLFLOW_URI`        | MLflow tracking URI (default `file:./mlruns` recommended) |
| `LOG_LEVEL`         | INFO / DEBUG / WARNING                     |
| `API_BASE_URL`      | Base URL the dashboard uses for API calls  |
| `DASHBOARD_API_KEY` | Sent with dashboard→API requests           |

---

## ⚙️ Orchestration & Scheduling

- **Today:** ingestion and training are CLI-driven (`python -m ...`); Airflow DAGs under `airflow/` are **legacy and no longer used** (their dependencies conflict with the pinned stack).
- **Planned:** lightweight APScheduler inside the app + GitHub Actions cron for cloud scheduling, replacing Airflow entirely — see [Phase 2](res/PHASE_2_SCHEDULER.md).

---

## 🐳 Docker

```bash
docker build -t sentinel .
docker run -p 7860:7860 --env-file .env sentinel
```

The image installs CPU-only torch from the PyTorch CPU index to keep it small, and runs a single uvicorn process (API + dashboard). Healthcheck hits `/api/health`.

---

## 🧪 Testing

```bash
# Quick endpoint + DB diagnostics (needs the app running)
python test_api.py

# Pipelines (each exits non-zero on failure)
python -m ingestion.ingestion_pipeline
python -m ml.train_pipeline

# Drift detection CLI
python mlops/drift_detector.py --tickers AAPL,MSFT --send-alerts
```

---

## 🗺️ Roadmap

| Phase | What | Doc |
|-------|------|-----|
| 1 | Migrate to Supabase (hosted Postgres + Auth) | [res/PHASE_1_SUPABASE_MIGRATION.md](res/PHASE_1_SUPABASE_MIGRATION.md) |
| 2 | Replace Airflow with APScheduler + GitHub Actions | [res/PHASE_2_SCHEDULER.md](res/PHASE_2_SCHEDULER.md) |
| 3 | Observability: Prometheus + Grafana, drift API | [res/PHASE_3_OBSERVABILITY.md](res/PHASE_3_OBSERVABILITY.md) |
| 4 | UI: MLOps page, macro endpoint, polish | [res/PHASE_4_UI.md](res/PHASE_4_UI.md) |
| 5 | Deploy to Hugging Face Spaces | [res/PHASE_5_DEPLOY_HUGGINGFACE.md](res/PHASE_5_DEPLOY_HUGGINGFACE.md) |

---

## 📝 Changelog

### v0.1.0
- FastAPI API with 5 routers, Dash dashboard mounted via WSGI
- Ingestion: stocks, crypto, macro, news (FinBERT), feature engineering
- ML: PyOD anomalies, Prophet+XGBoost forecasts, MVO portfolio, MLflow registry
- Drift detection (PSI + KS) with email/Slack alerts
- Single-container Docker image (CPU torch), JSON logging
- Phase 0 hygiene: dependency unification, honest docs, dead code removed

---

**Made with ❤️ for the financial-intelligence portfolio**

*For issues or questions, open a GitHub issue.*
