
from fastapi import APIRouter, HTTPException
from sentinel.config.logging_config import get_logger
from sentinel.database.crud_v1 import get_latest_weights
from sentinel.api.schemas.responses import PortfolioWeightResponse
from sentinel.database.connection import get_session

logger = get_logger(__name__)
router = APIRouter()

@router.get('/weights', response_model=list[PortfolioWeightResponse])
def get_weights():
    with get_session() as session:
        try:
            row = get_latest_weights(session)
            if not row:
                raise HTTPException(status_code=404, detail='No weights found')
            return row
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f'Error: {e}')
            raise HTTPException(status_code=500, detail="Internal server error")


@router.get('/optimize')
def optimize():
    try:
        import sentinel.ml.portfolio_optimizer as Optimizer
        Optimizer.run()
        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'Error: {e}')
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get('/backtest')
def backtest():
    return {"message": "coming soon"}