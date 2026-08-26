from fastapi import APIRouter, HTTPException
from sentinel.config.logging_config import get_logger
from sentinel.database.crud_v2 import get_fa_data, get_ta_data
from sentinel.api.schemas.analyis import CompanyFundamental, TechnicalSnapshot
from sentinel.database.connection import get_async_session

logger = get_logger(__name__)
router = APIRouter()

@router.get("/technical/{symbol}", response_model=TechnicalSnapshot)
async def get_technical_data(symbol: str):
    async with get_async_session() as session:
        try:
            row = await get_ta_data(session, symbol=symbol)
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
    async with get_async_session() as session:
        try:
            row = await get_fa_data(session, ticker=ticker)
            if not row:
                raise HTTPException(status_code=404, detail="No latest Data found")
            return row
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f'Error: {e}')
            raise HTTPException(status_code=500, detail="Internal server error")
