
from fastapi import APIRouter, HTTPException
from typing import List
from sentinel.config.logging_config import get_logger
from sentinel.database.crud import get_anomalies as fetch_anomalies, get_latest_anomaly as fetch_latest_anomaly
from sentinel.api.schemas.small import AnomalyResponse
from sentinel.database.connection import get_session

logger = get_logger(__name__)
router = APIRouter()

@router.get("/latest", response_model=AnomalyResponse)
def get_latest_anomaly_endpoint():
    with get_session() as session:
        try:
            row = fetch_latest_anomaly(session)
            if not row:
                raise HTTPException(status_code=404, detail="No latest anomaly found")
            return row
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f'Error: {e}')
            raise HTTPException(status_code=500, detail="Internal server error")


@router.get("", response_model=List[AnomalyResponse], include_in_schema=False)
async def get_anomalies_no_slash(ticker: str, days: int = 30):
    return await get_anomalies(ticker, days)

@router.get("/", response_model=List[AnomalyResponse])
def get_anomalies(ticker: str, days: int = 30):
    with get_session() as session:
        try:
            rows = fetch_anomalies(session, ticker, limit=days)
            if not rows:
                return []
            return rows 
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f'Error: {e}')
            raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/detect/{ticker}")
def detect_anomalies(ticker: str):
    try:
        from sentinel.ml.anomaly_detector import run
        run(ticker)
        return {"status": "ok", "ticker": ticker, "message": f"Anomaly detection completed for {ticker}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'Error: {e}')
        raise HTTPException(status_code=500, detail="Internal server error")