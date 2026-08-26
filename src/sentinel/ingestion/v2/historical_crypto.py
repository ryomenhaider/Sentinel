import asyncio

from sentinel.ingestion.v2.hermes_c import hr

from sentinel.database.connection import get_async_session
from sentinel.database.crud_v2 import insert_crypto_history_data
import logging

import numpy as np
import pandas as pd

from sentinel.constants import SYMBOLS

logger = logging.getLogger(__name__)

def forward_std(series: pd.Series, horizon: int) -> pd.Series:
    return (
        series
        .shift(-1)
        .iloc[::-1]
        .rolling(horizon)
        .std()
        .iloc[::-1]
    )

async def main():
    async with get_async_session() as session:
        try:
            for symbol in SYMBOLS:
                try:
                    ta = await hr.ta_history.get_history(symbol=symbol, interval='1h')

                    logger.info(f'technical data fetched for {symbol}')
                    logger.info(f'The Target features are being created for {symbol}')

                    ta['date_time'] = pd.to_datetime(ta['open_time'], unit='ms')
                    ta['close_time'] = pd.to_datetime(ta['close_time'], unit='ms')

                    close = ta["close"]
                    ret_1b = ta["ret_1b"]

                    targets = pd.DataFrame({
                        "target_return_1h": close.shift(-1) / close - 1,
                        "target_return_4h": close.shift(-4) / close - 1,
                        "target_return_12h": close.shift(-12) / close - 1,
                        "target_return_24h": close.shift(-24) / close - 1,
                        "target_return_72h": close.shift(-72) / close - 1,
                        "target_direction_1h": (close.shift(-1) / close - 1 > 0).astype(int),
                        "target_direction_4h": (close.shift(-4) / close - 1 > 0).astype(int),
                        "target_direction_12h": (close.shift(-12) / close - 1 > 0).astype(int),
                        "target_direction_24h": (close.shift(-24) / close - 1 > 0).astype(int),
                        "target_direction_72h": (close.shift(-72) / close - 1 > 0).astype(int),
                        "target_volatility_4h": forward_std(ret_1b, 4),
                        "target_volatility_24h": forward_std(ret_1b, 24),
                        "target_volatility_72h": forward_std(ret_1b, 72),
                        "target_log_return_1h": np.log(close.shift(-1) / close),
                        "target_log_return_4h": np.log(close.shift(-4) / close),
                        "target_log_return_12h": np.log(close.shift(-12) / close),
                        "target_log_return_24h": np.log(close.shift(-24) / close),
                        "target_log_return_72h": np.log(close.shift(-72) / close),
                    }, index=ta.index)

                    ta = pd.concat([ta, targets], axis=1)

                    logger.info(f'Target Features are engineered for {symbol}')
                    await insert_crypto_history_data(session=session, data=ta)
                    logger.info('Data is inserted in the DB')

                except Exception as e:
                    print(f'[{symbol} Unexpected Error: {e}]')
                    await session.rollback()        
            
        except Exception as e:
                print(f'Unexpected Error: {e}]')
                await session.rollback()

if __name__ == "__main__":
    asyncio.run(main())
