from hermes import Hermes
from sentinel.config.settings import (
    OPENSANCTIONS_API,
    NEWSDATA_API_KEY,
    FRED_API_KEY,
    SEC_EMAIL,
    SEC_USERNAME,
    FINNHUB_API,
)

hr = Hermes(
        opensanction_api=OPENSANCTIONS_API,
        new_data_api=NEWSDATA_API_KEY,
        fred_api=FRED_API_KEY,
        sec_email=SEC_EMAIL,
        sec_username=SEC_USERNAME,
        finnhub_api=FINNHUB_API,
        cache_dir='./raw',
    )

async def main():
    ta = await hr.ta_history.get_history(symbol='BTCUSDT', interval='1h')
    fa = await hr.fa_history.get_history(symbols=['GOOGL'])
    ta = ta.reset_index(drop=True)
    fa = fa.reset_index(drop=True)
    ta.to_csv('research/data/TA.csv')
    fa.to_csv('research/data/FA.csv')
        

import asyncio
asyncio.run(main())