from fastapi import APIRouter, HTTPException
from sentinel.config.logging_config import get_logger
from sentinel.database.crud_v2 import get_crypto_history_data
from sentinel.api.schemas.crypto_historical import MarketFeatures
from sentinel.database.connection import get_async_session

logger = get_logger(__name__)
router = APIRouter()

@router.get("/crypto_data/{symbol}", response_model=list[MarketFeatures])
async def get_crypto_history(symbol: str, limit: int = 1000):
    async with get_async_session() as session:
        try:
            rows = await get_crypto_history_data(session, symbol=symbol, limit=limit)
            if not rows:
                raise HTTPException(status_code=404, detail="No Data is found")
            return rows
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f'Error: {e}')
            raise HTTPException(status_code=500, detail="Internal server error")
