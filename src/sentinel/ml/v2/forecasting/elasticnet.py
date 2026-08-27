from sklearn.linear_model import ElasticNet
from sentinel.database.crud_v2 import get_crypto_history_data

FEATURES = [

]

class TrainElasticNet:
    
    def __init__(self, symbol: str = 'BTCUSDT', limit:int = 17400):
        self.symbol = symbol
        self.limit = limit

    async def _load_data(self):
        data = await get_crypto_history_data(symbol=self.symbol, limit=self.limit)
        data
    
    async def train_model():
        model = ElasticNet()
        model