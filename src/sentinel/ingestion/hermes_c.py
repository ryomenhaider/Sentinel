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
    ta = await hr.ta_history.get_history(symbol='BTCUSDT')
    print('==== TA DATA  of BTCUSDT(test)====')
    print("features for crypto", list(ta.columns))
    total_nans = ta.isnull().sum().sum()
    total_zeros = (ta == 0).sum().sum()
    print(f'Shape: {ta.shape}')
    print(f"Total NaNs: {total_nans}")
    print(f"Total Zeros: {total_zeros}")
    fa = await hr.fa_history.get_history(symbols=['GOOGL'])
    print('==== FA DATA of GOOGL(test) ====')
    print("features for stocks", list(fa.columns))
    total_nans = fa.isnull().sum().sum()
    total_zeros = (fa == 0).sum().sum()
    print(f'Shape: {fa.shape}')
    print(f"Total NaNs: {total_nans}")
    print(f"Total Zeros: {total_zeros}")

import asyncio
asyncio.run(main())