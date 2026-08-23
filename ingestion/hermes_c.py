from hermes import Hermes
from config.settings import (
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

