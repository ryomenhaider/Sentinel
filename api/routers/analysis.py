from fastapi import APIRouter, HTTPException
from typing import List
from config.logging_config import get_logger
from database.crud import get_fa_data, get_ta_data
from api.schemas import CompanyFundamental, TechnicalSnapshot
from database.connection import get_session

logger = get_logger(__name__)
router = APIRouter()

@router.get("/technical/{symbol}", response_model=TechnicalSnapshot)
async def get_technical_data(symbol):
    with get_session() as session:
        try:
            row = get_ta_data(session, symbol=symbol)
            if not row:
                raise HTTPException(status_code=404, detail="No latest anomaly found")
            return row
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f'Error: {e}')
            raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/fundamental/{ticker}", response_model=CompanyFundamental)
async def get_fundamentals_data(ticker: str):
    with get_session() as session:
        try:
            row = get_fa_data(session, ticker=ticker)
            if not row:
                raise HTTPException(status_code=404, detail="No latest Data found")
            return row
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f'Error: {e}')
            raise HTTPException(status_code=500, detail="Internal server error")