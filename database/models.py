from sqlalchemy import Column, Date, Text, Numeric, BigInteger, Integer, text, Float
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import TIMESTAMP

class Base(DeclarativeBase):
    pass


class MarketData(Base):
    __tablename__ = "market_data"
    
    ticker = Column(Text, primary_key=True, nullable=False)
    date = Column(Date, primary_key=True, nullable=False)
    open = Column(Numeric)
    high = Column(Numeric)
    low = Column(Numeric)
    close = Column(Numeric, nullable=False)
    volume = Column(BigInteger)
    created_at = Column(TIMESTAMP(timezone=True),server_default=text("NOW()"))
    

class CryptoPrice(Base):
    __tablename__ = "crypto_prices"
    
    symbol = Column(Text,primary_key=True, nullable=False)
    date = Column(Date, primary_key=True, nullable=False)
    open = Column(Numeric)
    high = Column(Numeric)
    low = Column(Numeric)
    close = Column(Numeric)
    volume = Column(Numeric)
    market_cap = Column(Numeric)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))


class EconomicIndicator(Base):
    __tablename__ = "economic_indicators"

    series_id = Column(Text,primary_key=True, nullable=False)
    date = Column(Date,primary_key=True, nullable=False)
    value = Column(Numeric)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))

class NewsSentiment(Base):
    __tablename__ = "news_sentiment"
    
    id = Column(Integer, primary_key=True)
    ticker = Column(Text)
    headline = Column(Text)
    source = Column(Text)
    published_at = Column(TIMESTAMP(timezone=True))
    sentiment = Column(Text)
    score = Column(Numeric)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))

class Anomaly(Base):
    __tablename__ = "anomalies"
    
    id = Column(Integer, primary_key=True)
    ticker = Column(Text)
    date = Column(Date)
    anomaly_score = Column(Numeric)
    severity = Column(Text)
    model_used = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))


class Forecast(Base):
    __tablename__ = "forecasts"
    
    id = Column(Integer, primary_key=True)
    ticker = Column(Text)
    forecast_date = Column(Date)
    predicted_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    yhat = Column(Numeric)
    yhat_lower=  Column(Numeric)
    yhat_upper = Column(Numeric)
    model_used = Column(Text)
    horizon_days=  Column(Integer)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))


class PortfolioWeight(Base):
    __tablename__ = "portfolio_weights"
    
    id = Column(Integer, primary_key=True)
    ticker = Column(Text)
    weight = Column(Numeric)
    method = Column(Text)
    calculated_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))


class ModelRun(Base):
    __tablename__ = "model_runs"
    
    id = Column(Integer, primary_key=True)
    model_name = Column(Text)
    ticker = Column(Text)
    mae = Column(Numeric)
    rmse = Column(Numeric)
    r2 = Column(Numeric)
    parameters = Column(JSONB)
    trained_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('NOW()'))


class Features(Base):
    __tablename__ = "features"

    ticker = Column(Text, primary_key=True, nullable=False)
    date = Column(Date, primary_key=True, nullable=False)
    log_return = Column(Numeric)
    lag_1d = Column(Numeric)
    lag_5d = Column(Numeric)
    lag_21d = Column(Numeric)
    lag_63d = Column(Numeric)
    rolling_mean_21 = Column(Numeric)
    rolling_std_21 = Column(Numeric)
    rolling_skew_21 = Column(Numeric)
    rsi_14 = Column(Numeric)
    bb_pct_b = Column(Numeric)
    volume_ratio = Column(Numeric)

class CompanyFundamental(Base):
    __tablename__ = "company_fundamentals"

    # Filing metadata
    symbol = Column(Text, primary_key=True, nullable=False)
    filing_date = Column(Date, primary_key=True, nullable=False)
    fiscal_period = Column(Text, nullable=False)
    fiscal_year = Column(Integer, nullable=False)
    filing_type = Column(Text, nullable=False)

    # Income Statement
    revenue = Column(BigInteger, nullable=False)
    cost_of_revenue = Column(BigInteger, nullable=False)
    gross_profit = Column(BigInteger, nullable=False)
    operating_expenses = Column(BigInteger, nullable=False)
    operating_income = Column(BigInteger, nullable=False)
    interest_expense = Column(BigInteger)
    pre_tax_income = Column(BigInteger, nullable=False)
    income_tax_expense = Column(BigInteger, nullable=False)
    net_income = Column(BigInteger, nullable=False)
    eps_basic = Column(Numeric)
    eps_diluted = Column(Numeric)

    # Balance Sheet
    cash = Column(BigInteger, nullable=False)
    short_term_investments = Column(BigInteger)
    accounts_receivable = Column(BigInteger, nullable=False)
    inventory = Column(BigInteger)
    current_assets = Column(BigInteger, nullable=False)
    total_assets = Column(BigInteger, nullable=False)
    current_liabilities = Column(BigInteger, nullable=False)
    short_term_debt = Column(BigInteger)
    long_term_debt = Column(BigInteger, nullable=False)
    total_liabilities = Column(BigInteger, nullable=False)
    equity = Column(BigInteger, nullable=False)

    # Cash Flow
    operating_cash_flow = Column(BigInteger, nullable=False)
    investing_cash_flow = Column(BigInteger, nullable=False)
    financing_cash_flow = Column(BigInteger, nullable=False)
    capital_expenditure = Column(BigInteger, nullable=False)

    # Shares
    shares_outstanding = Column(BigInteger, nullable=False)
    weighted_average_shares = Column(BigInteger, nullable=False)

    # Market Data
    current_price = Column(Numeric, nullable=False)
    market_cap = Column(BigInteger, nullable=False)

    # Earnings & Estimates
    earnings = Column(Numeric, nullable=False)
    eps_estimates = Column(Numeric, nullable=False)
    revenue_estimates = Column(BigInteger, nullable=False)
    earnings_surprise = Column(Numeric, nullable=False)
    revenue_surprise = Column(Numeric, nullable=False)

    # Macro
    macro_gdp = Column(BigInteger, nullable=False)
    macro_gdp_growth = Column(Numeric, nullable=False)
    macro_inflation = Column(Numeric, nullable=False)
    macro_interest_rates = Column(Numeric, nullable=False)
    macro_unemployment = Column(Numeric, nullable=False)
    macro_government_debt = Column(Numeric, nullable=False)

    macro_exchange_rates = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    # Company
    company_peers = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    dividends = Column(BigInteger)
    buybacks = Column(BigInteger)

    # Valuation / Ratios
    pe_ratio = Column(Numeric)
    ps_ratio = Column(Numeric)
    pb_ratio = Column(Numeric)
    ev_ebitda = Column(Numeric)
    roe = Column(Numeric)
    roa = Column(Numeric)
    debt_equity = Column(Numeric)

    # Metadata
    created_at = Column(
        TIMESTAMP(timezone=True),
        server_default=text("NOW()"),
        nullable=False,
    )

class TechnicalSnapshot(Base):
    __tablename__ = "technical_snapshots"

    # Metadata
    symbol = Column(Text, primary_key=True, nullable=False)
    timestamp_ms = Column(BigInteger, primary_key=True, nullable=False)

    # OHLCV
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)
    quote_volume = Column(Float, nullable=False)
    trades_count = Column(BigInteger, nullable=False)

    # Returns
    ret_1b = Column(Float, nullable=False)
    ret_5b = Column(Float, nullable=False)
    ret_10b = Column(Float, nullable=False)
    ret_60b = Column(Float, nullable=False)
    ret_open_to_close = Column(Float, nullable=False)

    # Price Structure
    hl_range = Column(Float, nullable=False)
    body_range = Column(Float, nullable=False)

    # Moving Average Distance
    dist_sma_20 = Column(Float, nullable=False)
    dist_sma_50 = Column(Float, nullable=False)
    dist_sma_200 = Column(Float, nullable=False)

    # EMA
    ema_diff_9_21 = Column(Float, nullable=False)
    ema_diff_21_50 = Column(Float, nullable=False)

    # Volatility
    vol_20 = Column(Float, nullable=False)
    vol_60 = Column(Float, nullable=False)
    atr_14_norm = Column(Float, nullable=False)

    # Volume
    volume_rel_20 = Column(Float, nullable=False)
    taker_buy_vol_ratio = Column(Float, nullable=False)

    # Trade Window
    trade_window_count = Column(BigInteger, nullable=False)
    trade_window_vol_base = Column(Float, nullable=False)
    trade_window_vol_quote = Column(Float, nullable=False)
    trade_buy_vol_ratio = Column(Float, nullable=False)
    avg_trade_size = Column(Float, nullable=False)
    median_trade_size = Column(Float, nullable=False)
    large_trade_vol_ratio = Column(Float, nullable=False)

    # Order Book
    bid_price = Column(Float, nullable=False)
    ask_price = Column(Float, nullable=False)
    bid_qty = Column(Float, nullable=False)
    ask_qty = Column(Float, nullable=False)

    spread_abs = Column(Float, nullable=False)
    spread_bps = Column(Float, nullable=False)
    top_book_imbalance = Column(Float, nullable=False)

    # Market Depth
    depth_bid_total = Column(Float, nullable=False)
    depth_ask_total = Column(Float, nullable=False)
    depth_imbalance = Column(Float, nullable=False)

    # 24H Market Data
    high_24h = Column(Float, nullable=False)
    low_24h = Column(Float, nullable=False)
    last_price_24h = Column(Float, nullable=False)
    range_24h = Column(Float, nullable=False)
    pct_change_24h = Column(Float, nullable=False)
    pos_in_24h_range = Column(Float, nullable=False)
    volume_24h = Column(Float, nullable=False)
    quote_volume_24h = Column(Float, nullable=False)

    # Funding
    funding_rate = Column(Float, nullable=False)
    funding_rate_lag_3 = Column(Float, nullable=False)
    funding_rate_change = Column(Float, nullable=False)
    funding_rate_zscore = Column(Float, nullable=False)
    time_to_next_funding_min = Column(Float, nullable=False)

    # Open Interest
    open_interest = Column(Float, nullable=False)
    oi_change_1h = Column(Float, nullable=False)
    oi_change_24h = Column(Float, nullable=False)
    oi_to_volume_24h = Column(Float, nullable=False)

    # Derived Scores
    trend_score = Column(Float, nullable=False)
    mean_reversion_score = Column(Float, nullable=False)
    liquidity_score = Column(Float, nullable=False)
    order_flow_score = Column(Float, nullable=False)
    sentiment_score = Column(Float, nullable=False)

    # Metadata
    created_at = Column(
        TIMESTAMP(timezone=True),
        server_default=text("NOW()"),
        nullable=False,
    )