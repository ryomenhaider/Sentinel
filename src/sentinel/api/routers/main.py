import time
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from sentinel.api.routers.v1.anomalies import router as anomalies_router
from sentinel.api.routers.v1.forecasts import router as forecasts_router
from sentinel.api.routers.jobs import router as job_router
from sentinel.api.routers.v1.portfolio import router as portfolio_router
from sentinel.api.routers.v1.prices import router as prices_router
from sentinel.api.routers.v1.sentiment import router as sentiment_router
from sentinel.api.routers.v2.analysis import router as analysis_router
from sentinel.api.routers.v2.crypto_history import router as crypto_data_router
from sentinel.config.logging_config import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
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
    yield


app_v1 = FastAPI(
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
    lifespan=lifespan,
)

app_v1.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app_v1.middleware("http")
async def add_timing_header_v1(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    response.headers["X-Process-Time"] = f"{duration:.4f}s"
    logger.info(
        f"{request.method} {request.url.path} | {response.status_code} | {duration:.4f}s"
    )
    return response



@app_v1.get("/v1/api/health")
async def health_v1():
    try:
        from sentinel.database.connection import test_connection

        db_ok = test_connection()
    except Exception:
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "unreachable",
        "version": app_v1.version,
    }


@app_v1.get("/v1-status")
def v1_status():
    return {"message": "Hello from V1"}


app_v1.include_router(
    prices_router,
    prefix="/api/v1/prices",
    tags=["Prices"],
)
app_v1.include_router(
    anomalies_router,
    prefix="/api/v1/anomalies",
    tags=["Anomalies"],
)
app_v1.include_router(
    forecasts_router,
    prefix="/api/v1/forecasts",
    tags=["Forecasts"],
)
app_v1.include_router(
    portfolio_router,
    prefix="/api/v1/portfolio",
    tags=["Portfolio"],
)
app_v1.include_router(
    sentiment_router,
    prefix="/api/v1/sentiment",
    tags=["Sentiment"],
)
app_v1.include_router(
    job_router, prefix="/api/v1/jobs", tags=["Jobs"]
)

app_v2 = FastAPI(
    title="Sentinel",
    description=(
        """
        A system that ingests real-time and historical financial data,
        detects anomalies, forecasts price movements, technical & fundamental analysis
        and visualises everything in a dashboard.
        """
    ),
    version="0.2.0",
    docs_url="/api/v2/docs",
    redoc_url="/api/v2/redoc",
)

app_v2.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app_v2.middleware("http")
async def add_timing_header_v2(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    response.headers["X-Process-Time"] = f"{duration:.4f}s"
    logger.info(
        f"{request.method} {request.url.path} | {response.status_code} | {duration:.4f}s"
    )
    return response



@app_v2.get("/v2/api/health")
async def health_v2():
    try:
        from sentinel.database.connection import test_connection

        db_ok = test_connection()
    except Exception:
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "unreachable",
        "version": app_v2.version,
    }


@app_v2.get("/v2-status")
def v2_status():
    return {"message": "Hello from V2"}


app_v1.include_router(
    analysis_router,
    prefix="/api/v2/analysis",
    tags=['Analysis']
)

app_v1.include_router(
    crypto_data_router,
    prefix='/api/v2/history'
)

app_v1.mount("/v2", app_v2)

if __name__ == "__main__":
    uvicorn.run("sentinel.api.routers.main:app_v1", host="0.0.0.0", port=7860, reload=False)
