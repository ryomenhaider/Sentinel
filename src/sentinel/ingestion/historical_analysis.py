from sentinel.ingestion.hermes_c import hr

from sentinel.database.connection import get_session
from sentinel.database.crud import insert_fa_data, insert_ta_data

import logging

from dataclasses import asdict

logger = logging.getLogger(__name__)

SYMBOLS = [
    "BTCUSDT",
    "ETHUSDT",
    "BNBUSDT",
    "XRPUSDT",
    "SOLUSDT",
    "DOGEUSDT",
    "TRXUSDT",
    "ADAUSDT",
    "LINKUSDT",
    "AVAXUSDT",
    "SUIUSDT",
    "LTCUSDT",
    "BCHUSDT",
    "HBARUSDT",
    "NEARUSDT",
    "UNIUSDT",
    "DOTUSDT",
    "APTUSDT",
    "ARBUSDT",
    "OPUSDT",
]

TICKERS = [
    "NVDA",
    "AAPL",
    "GOOGL",
    "MSFT",
    "AMZN",
    "AVGO",
    "META",
    "TSLA",
    "LLY",
    "WMT",
    "AMD",
    "V",
    "XOM",
    "JNJ",
    "ORCL",
    "COST",
    "NFLX",
    "CRM",
]


async def run():
    with get_session() as session:
        try:
            for symbol in SYMBOLS:
                try:
                    data = await hr.ta_history.get_history(symbol=symbol)
                    logger.info(f'technical data fetched for {symbol}')
                    insert_ta_data(session=session, data=asdict(data))
                    logger.info('Data is inserted in the DB')

                except Exception as e:
                    print(f'[{symbol} Unexpected Error: {e}]')
                    session.rollback()                       
            for ticker in TICKERS:
                try:
                    data = await hr.fa_features.get_fundamentels(ticker=ticker)
                    logger.info(f'fundamental data fetched for {ticker}')
                    insert_fa_data(session=session, data=asdict(data))
                    logger.info('Data is inserted in the DB')

                except Exception as e:
                    print(f'[{ticker} Unexpected Error: {e}]')
                    session.rollback()

        except Exception as e:
                print(f'Unexpected Error: {e}]')
                session.rollback()