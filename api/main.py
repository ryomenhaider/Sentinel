import time
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.wsgi import WSGIMiddleware
from fastapi.responses import HTMLResponse
import uvicorn

from config.logging_config import get_logger
from api.routers.prices import router as prices_router
from api.routers.anomalies import router as anomalies_router
from api.routers.forecasts import router as forecasts_router
from api.routers.portfolio import router as portfolio_router
from api.routers.sentiment import router as sentiment_router
from api.auth import verify_jwt

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
    docs_url="/api/docs",
    redoc_url="/api/redoc",
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
    logger.info(f"{request.method} {request.url.path} | {response.status_code} | {duration:.4f}s")
    return response

@app.on_event("startup")
async def startup():
    try:
        from database.connection import test_connection
        db_ok = test_connection()
        if db_ok:
            logger.info(f"Sentinel API v{app.version} started successfully | Database: connected")
        else:
            logger.warning(f"Sentinel API v{app.version} started | Database: unreachable")
    except Exception as e:
        logger.error(f"Startup error: {e}")

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def root():
    return HTMLResponse(content="""<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=/dashboard/" />
    <title>Sentinel — Redirecting…</title>
  </head>
  <body style="background:#0A0E17;color:#E8EDF5;font-family:monospace;padding:40px;">
    <p>Redirecting to <a href="/dashboard/" style="color:#00D4FF;">dashboard</a>…</p>
  </body>
</html>""")

@app.get("/api/health")
async def health():
    try:
        from database.connection import test_connection
        db_ok = test_connection()
    except Exception:
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "unreachable",
        "version": app.version,
    }


app.include_router(prices_router,    prefix="/api/prices",    tags=["Prices"],    dependencies=[Depends(verify_jwt)])
app.include_router(anomalies_router, prefix="/api/anomalies", tags=["Anomalies"], dependencies=[Depends(verify_jwt)])
app.include_router(forecasts_router, prefix="/api/forecasts", tags=["Forecasts"], dependencies=[Depends(verify_jwt)])
app.include_router(portfolio_router, prefix="/api/portfolio", tags=["Portfolio"], dependencies=[Depends(verify_jwt)])
app.include_router(sentiment_router, prefix="/api/sentiment", tags=["Sentiment"], dependencies=[Depends(verify_jwt)])

from dashboard.app import server as dash_server
app.mount("/", WSGIMiddleware(dash_server))

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=7860, reload=True)
