import asyncio

from sentinel.ingestion.v2.hermes_c import hr

from sentinel.database.connection import get_async_session
from sentinel.database.crud_v2 import insert_fa_data, insert_ta_data

import logging

from dataclasses import asdict

from sentinel.constants import (
    SYMBOLS, TICKERS
)

logger = logging.getLogger(__name__)


async def main():
    async with get_async_session() as session:
        try:
            for symbol in SYMBOLS:
                try:
                    data = await hr.ta_feature.get_technical(symbol=symbol)
                    logger.info(f'technical data fetched for {symbol}')
                    await insert_ta_data(session=session, data=asdict(data))
                    logger.info('Data is inserted in the DB')

                except Exception as e:
                    print(f'[{symbol} Unexpected Error: {e}]')
                    await session.rollback()                       
            for ticker in TICKERS:
                try:
                    data = await hr.fa_features.get_fundamentels(ticker=ticker)
                    logger.info(f'fundamental data fetched for {ticker}')
                    await insert_fa_data(session=session, data=asdict(data))
                    logger.info('Data is inserted in the DB')

                except Exception as e:
                    print(f'[{ticker} Unexpected Error: {e}]')
                    await session.rollback()

        except Exception as e:
                print(f'Unexpected Error: {e}]')
                await session.rollback()


if __name__ == "__main__":
    asyncio.run(main())
