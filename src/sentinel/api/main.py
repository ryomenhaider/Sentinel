import time

import uvicorn
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from sentinel.api.routers.v1.anomalies import router as anomalies_router
from sentinel.api.routers.v1.forecasts import router as forecasts_router
from sentinel.api.routers.jobs import router as job_router
from sentinel.api.routers.v1.portfolio import router as portfolio_router
from sentinel.api.routers.v1.prices import router as prices_router
from sentinel.api.routers.v1.sentiment import router as sentiment_router
from sentinel.api.routers.v2.analysis import router as analysis_router

from sentinel.config.logging_config import get_logger

logger = get_logger(__name__)

app = FastAPI(
    title="Sentinel",
    description=(
        """
        A system that ingests real-time and historical financial data,
        detects anomalies, forecasts price movements, and visualises
        everything in a dashboard.
        """
    ),
    version="0.1.0",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    response.headers["X-Process-Time"] = f"{duration:.4f}s"
    logger.info(
        f"{request.method} {request.url.path} | {response.status_code} | {duration:.4f}s"
    )
    return response


@app.on_event("startup")
async def startup():
    try:
        from sentinel.database.connection import test_connection

        db_ok = test_connection()
        if db_ok:
            logger.info(
                f"Sentinel API v{app.version} started successfully | Database: connected"
            )
        else:
            logger.warning(
                f"Sentinel API v{app.version} started | Database: unreachable"
            )
    except Exception as e:
        logger.error(f"Startup error: {e}")


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def root():
    return HTMLResponse(
        content="""<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=/dashboard/" />
    <title>Sentinel — Redirecting…</title>
  </head>
  <body style="background:#0A0E17;color:#E8EDF5;font-family:monospace;padding:40px;">
    <p>Redirecting to <a href="/dashboard/" style="color:#00D4FF;">dashboard</a>…</p>
  </body>
</html>"""
    )


@app.get("/api/health")
async def health():
    try:
        from sentinel.database.connection import test_connection

        db_ok = test_connection()
    except Exception:
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "unreachable",
        "version": app.version,
    }


app.include_router(
    prices_router,
    prefix="/api/v1/prices",
    tags=["Prices"],
)
app.include_router(
    anomalies_router,
    prefix="/api/v1/anomalies",
    tags=["Anomalies"],
)
app.include_router(
    forecasts_router,
    prefix="/api/v1/forecasts",
    tags=["Forecasts"],
)
app.include_router(
    portfolio_router,
    prefix="/api/v1/portfolio",
    tags=["Portfolio"],
)
app.include_router(
    sentiment_router,
    prefix="/api/v1/sentiment",
    tags=["Sentiment"],
)
app.include_router(
    job_router, prefix="/api/v1/jobs", tags=["Jobs"]
)

app.include_router(
    analysis_router,
    prefix="/api/v2/analysis",
    tags=['Analysis']
)

if __name__ == "__main__":
    uvicorn.run("sentinel.api.main:app", host="0.0.0.0", port=7860, reload=True)
