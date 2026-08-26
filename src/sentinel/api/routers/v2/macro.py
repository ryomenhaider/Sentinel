from fastapi import APIRouter, HTTPException
from sentinel.config.logging_config import get_logger
from sentinel.database.crud_v2 import get_macro_data
from sentinel.api.schemas.responses import MacroData
from sentinel.database.connection import get_async_session

logger = get_logger(__name__)
router = APIRouter()

@router.get("/macro/{series_id}", response_model=list[MacroData])
async def get_technical_data(series_id: str, limit: int):
    async with get_async_session() as session:
        try:
            row = await get_macro_data(session, series_id=series_id, limit=limit)
            if not row:
                raise HTTPException(status_code=404, detail="No macro data found")
            return row
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f'Error: {e}')
            raise HTTPException(status_code=500, detail="Internal server error")

