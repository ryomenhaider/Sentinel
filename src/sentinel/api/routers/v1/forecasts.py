
from fastapi import APIRouter, HTTPException
from typing import List
from sentinel.config.logging_config import get_logger
from sentinel.database.crud_v1 import get_forecasts as fetch_forecast
from sentinel.api.schemas.responses import ForecastResponse
from sentinel.database.connection import get_session

logger = get_logger(__name__)
router = APIRouter()

@router.get('/compare')
def compare_forecast(tickers: str, horizon: int = 30):
    with get_session() as session:
        try:
            ticker_list = [t.strip() for t in tickers.split(',') if t.strip()]
            if not ticker_list:
                raise HTTPException(status_code=400, detail='Provide at least one ticker')
            rows = {}
            for ticker in ticker_list:
                row = fetch_forecast(session, ticker, horizon_days=horizon)
                if not row:
                    raise HTTPException(status_code=404, detail=f"{ticker} not found")
                rows[ticker] = row[0]
            return rows
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f'Error: {e}')
            raise HTTPException(status_code=500, detail="Internal server error")


@router.get('/accuracy')
def forecast_accuracy():
    return {"message": "coming soon"}


@router.get("/{ticker}", response_model=List[ForecastResponse])
def get_forecast(ticker: str, horizon: int = 30):
    with get_session() as session:
        try:
            row = fetch_forecast(session, ticker, horizon_days=horizon)
            if not row:
                raise HTTPException(status_code=404, detail=f'No forecast for {ticker}')
            return row
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f'Error: {e}')
            raise HTTPException(status_code=500, detail="Internal server error")