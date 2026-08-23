import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

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

    symbol: str
    filing_date: date
    fiscal_period: str
    fiscal_year: int
    filing_type: str

    # Income Statement
    revenue: int
    cost_of_revenue: int
    gross_profit: int
    operating_expenses: int
    operating_income: int
    interest_expense: int | None = None
    pre_tax_income: int
    income_tax_expense: int
    net_income: int
    eps_basic: float
    eps_diluted: float

    # Balance Sheet
    cash: int
    short_term_investments: int | None = None
    accounts_receivable: int
    inventory: int | None = None
    current_assets: int
    total_assets: int
    current_liabilities: int
    short_term_debt: int | None = None
    long_term_debt: int
    total_liabilities: int
    equity: int

    # Cash Flow
    operating_cash_flow: int
    investing_cash_flow: int
    financing_cash_flow: int
    capital_expenditure: int

    # Shares
    shares_outstanding: int
    weighted_average_shares: int

    # Market Data
    current_price: float
    market_cap: int

    # Earnings & Estimates
    earnings: float
    eps_estimates: float
    revenue_estimates: int
    earnings_surprise: float
    revenue_surprise: float

    # Macro
    macro_gdp: int
    macro_gdp_growth: float
    macro_inflation: float
    macro_interest_rates: float
    macro_unemployment: float
    macro_government_debt: float
    macro_exchange_rates: dict[str, float] = Field(default_factory=dict)

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
    open: float
    high: float
    low: float
    close: float
    volume: float
    quote_volume: float
    trades_count: int

    # Returns
    ret_1b: float
    ret_5b: float
    ret_10b: float
    ret_60b: float
    ret_open_to_close: float

    # Price Structure
    hl_range: float
    body_range: float

    # Moving Averages
    dist_sma_20: float
    dist_sma_50: float
    dist_sma_200: float

    # EMA
    ema_diff_9_21: float
    ema_diff_21_50: float

    # Volatility
    vol_20: float
    vol_60: float
    atr_14_norm: float

    # Volume
    volume_rel_20: float
    taker_buy_vol_ratio: float

    # Trade Window
    trade_window_count: int
    trade_window_vol_base: float
    trade_window_vol_quote: float
    trade_buy_vol_ratio: float
    avg_trade_size: float
    median_trade_size: float
    large_trade_vol_ratio: float

    # Order Book
    bid_price: float
    ask_price: float
    bid_qty: float
    ask_qty: float
    spread_abs: float
    spread_bps: float
    top_book_imbalance: float

    # Market Depth
    depth_bid_total: float
    depth_ask_total: float
    depth_imbalance: float

    # 24H Market Data
    high_24h: float
    low_24h: float
    last_price_24h: float
    range_24h: float
    pct_change_24h: float
    pos_in_24h_range: float
    volume_24h: float
    quote_volume_24h: float

    # Funding
    funding_rate: float
    funding_rate_lag_3: float
    funding_rate_change: float
    funding_rate_zscore: float
    time_to_next_funding_min: float

    # Open Interest
    open_interest: float
    oi_change_1h: float
    oi_change_24h: float
    oi_to_volume_24h: float

    # Scores
    trend_score: float
    mean_reversion_score: float
    liquidity_score: float
    order_flow_score: float
    sentiment_score: float
