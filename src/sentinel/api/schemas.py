
from pydantic import BaseModel, ConfigDict, Field
from datetime import date, datetime
from typing import Optional


class MarketDataResponse(BaseModel):
    ticker: str
    date: date                
    open: Optional[float]      
    high: Optional[float]
    low: Optional[float]
    close: float
    volume: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class AnomalyResponse(BaseModel):
    id: int
    ticker: Optional[str]
    date: Optional[date]
    anomaly_score: Optional[float]
    severity: Optional[str]
    model_used: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ForecastResponse(BaseModel):
    id: int
    ticker: Optional[str]
    forecast_date: Optional[date] 
    predicted_at: Optional[datetime]
    yhat: Optional[float]
    yhat_upper: Optional[float]
    yhat_lower: Optional[float]
    model_used: Optional[str]
    horizon_days: Optional[int]
    created_at: datetime
    model_config = ConfigDict(protected_namespaces=())
    model_config = {"from_attributes": True}


class PortfolioWeightResponse(BaseModel):
    id: int
    ticker: Optional[str]
    weight: Optional[float]
    method: Optional[str]
    calculated_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class SentimentResponse(BaseModel):
    id: int
    ticker: Optional[str]
    headline: Optional[str]
    source: Optional[str]
    published_at: datetime
    sentiment: Optional[str]
    score: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


class CompanyFundamental(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ticker: str
    filing_date: date
    fiscal_period: str
    fiscal_year: int
    filing_type: str

    # Income Statement
    revenue: int | None
    cost_of_revenue: int | None
    gross_profit: int | None
    operating_expenses: int | None
    operating_income: int | None
    interest_expense: int | None 
    pre_tax_income: int | None
    income_tax_expense: int | None
    net_income: int | None
    eps_basic: float | None
    eps_diluted: float | None

    # Balance Sheet
    cash: int
    short_term_investments: int | None 
    accounts_receivable: int | None
    inventory: int | None 
    current_assets: int | None
    total_assets: int | None
    current_liabilities: int | None
    short_term_debt: int | None 
    long_term_debt: int | None
    total_liabilities: int | None
    equity: int | None

    # Cash Flow
    operating_cash_flow: int | None
    investing_cash_flow: int | None
    financing_cash_flow: int | None
    capital_expenditure: int | None

    # Shares
    shares_outstanding: int | None
    weighted_average_shares: int | None | float

    # Market Data
    current_price: float
    market_cap: int | None

    # Earnings & Estimates
    earnings: float | None
    eps_estimates: float | None
    revenue_estimates: int | None
    earnings_surprise: float | None
    revenue_surprise: float | None

    # Macro
    macro_gdp: int | None | float
    macro_gdp_growth: float | None | int 
    macro_inflation: float | None | int 
    macro_interest_rates: float | None 
    macro_unemployment: float | None
    macro_government_debt: float | None
    macro_exchange_rates: int | float | None

    # Company
    company_peers: list[str] = Field(default_factory=list)
    dividends: int | None = None
    buybacks: int | None = None

    # Valuation
    pe_ratio: float | None = Field(default=None, alias="P/E")
    ps_ratio: float | None = Field(default=None, alias="P/S")
    pb_ratio: float | None = Field(default=None, alias="P/B")
    ev_ebitda: float | None = Field(default=None, alias="EV/EBITDA")
    roe: float | None = Field(default=None, alias="ROE")
    roa: float | None = Field(default=None, alias="ROA")
    debt_equity: float | None = Field(default=None, alias="Debt/Equity")

class TechnicalSnapshot(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    symbol: str
    timestamp_ms: int

    # OHLCV
    open: float | None
    high: float | None
    low: float | None
    close: float | None
    volume: float | None
    quote_volume: float | None
    trades_count: int | None

    # Returns
    ret_1b: float | None
    ret_5b: float | None
    ret_10b: float | None
    ret_60b: float | None
    ret_open_to_close: float | None

    # Price Structure
    hl_range: float | None
    body_range: float | None

    # Moving Averages
    dist_sma_20: float | None
    dist_sma_50: float | None
    dist_sma_200: float | None

    # EMA
    ema_diff_9_21: float | None
    ema_diff_21_50: float | None

    # Volatility
    vol_20: float | None
    vol_60: float | None
    atr_14_norm: float | None

    # Volume
    volume_rel_20: float | None
    taker_buy_vol_ratio: float | None

    # Trade Window
    trade_window_count: int | None
    trade_window_vol_base: float | None
    trade_window_vol_quote: float | None
    trade_buy_vol_ratio: float | None
    avg_trade_size: float | None
    median_trade_size: float | None
    large_trade_vol_ratio: float | None

    # Order Book
    bid_price: float | None
    ask_price: float | None
    bid_qty: float | None
    ask_qty: float | None
    spread_abs: float | None
    spread_bps: float | None
    top_book_imbalance: float | None

    # Market Depth
    depth_bid_total: float | None
    depth_ask_total: float | None
    depth_imbalance: float | None

    # 24H Market Data
    high_24h: float | None
    low_24h: float | None
    last_price_24h: float | None
    range_24h: float | None
    pct_change_24h: float | None
    pos_in_24h_range: float | None
    volume_24h: float | None
    quote_volume_24h: float | None

    # Funding
    funding_rate: float | None
    funding_rate_lag_3: float | None
    funding_rate_change: float | None
    funding_rate_zscore: float | None
    time_to_next_funding_min: float | None

    # Open Interest
    open_interest: float | None
    oi_change_1h: float | None
    oi_change_24h: float | None
    oi_to_volume_24h: float | None

    # Scores
    trend_score: float | None
    mean_reversion_score: float | None
    liquidity_score: float | None
    order_flow_score: float | None
    sentiment_score: float | None
