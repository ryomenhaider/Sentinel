from sentinel.ingestion.hermes_c import hr

from sentinel.database.connection import get_session
from sentinel.database.crud import insert_crypto_history_data
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

async def run():
    with get_session() as session:
        try:
            for symbol in SYMBOLS:
                try:
                    ta = await hr.ta_history.get_history(symbol=symbol, interval='1h')

                    logger.info(f'technical data fetched for {symbol}')
                    logger.info(f'The Target features are being created')

                    ta['date_time'] = pd.to_datetime(ta['open_time'], unit='ms')
                    ta['close_time'] = pd.to_datetime(ta['close_time'], unit='ms')

                    ta["target_return_1h"] = ta["close"].shift(-1) / ta["close"] - 1
                    ta["target_return_4h"] = ta["close"].shift(-4) / ta["close"] - 1
                    ta["target_return_12h"] = ta["close"].shift(-12) / ta["close"] - 1
                    ta["target_return_24h"] = ta["close"].shift(-24) / ta["close"] - 1
                    ta["target_return_72h"] = ta["close"].shift(-72) / ta["close"] - 1

                    ta["target_direction_1h"] = (ta["target_return_1h"] > 0).astype(int)
                    ta["target_direction_4h"] = (ta["target_return_4h"] > 0).astype(int)
                    ta["target_direction_12h"] = (ta["target_return_12h"] > 0).astype(int)
                    ta["target_direction_24h"] = (ta["target_return_24h"] > 0).astype(int)
                    ta["target_direction_72h"] = (ta["target_return_72h"] > 0).astype(int)

                    ta["target_volatility_4h"] = forward_std(ta["ret_1b"], 4)
                    ta["target_volatility_24h"] = forward_std(ta["ret_1b"], 24)
                    ta["target_volatility_72h"] = forward_std(ta["ret_1b"], 72)

                    ta["target_log_return_1h"] = np.log(ta["close"].shift(-1) / ta["close"])
                    ta["target_log_return_4h"] = np.log(ta["close"].shift(-4) / ta["close"])
                    ta["target_log_return_12h"] = np.log(ta["close"].shift(-12) / ta["close"])
                    ta["target_log_return_24h"] = np.log(ta["close"].shift(-24) / ta["close"])
                    ta["target_log_return_72h"] = np.log(ta["close"].shift(-72) / ta["close"])

                    logger.info(f'Target Features are engineered for {symbol}')

                    insert_crypto_history_data(session=session, data=ta)
                    logger.info('Data is inserted in the DB')

                except Exception as e:
                    print(f'[{symbol} Unexpected Error: {e}]')
                    session.rollback()        

        except Exception as e:
                print(f'Unexpected Error: {e}]')
                session.rollback()

import asyncio

asyncio.run(main=run())