import xgboost as xgb
import lightgbm as lgbm

from sentinel.database.crud_v2 import get_crypto_history_data

class TrainXGBoost:

    def __init__(self):
        ...
        
    async def _load_data(self):
        data = await get_crypto_history_data()
        data