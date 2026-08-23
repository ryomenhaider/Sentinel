CREATE TABLE company_fundamentals (
    ticker TEXT NOT NULL,
    filing_date DATE NOT NULL,
    fiscal_period TEXT NOT NULL,
    fiscal_year INTEGER NOT NULL,
    filing_type TEXT NOT NULL,

    -- Income Statement
    revenue BIGINT NOT NULL,
    cost_of_revenue BIGINT NOT NULL,
    gross_profit BIGINT NOT NULL,
    operating_expenses BIGINT NOT NULL,
    operating_income BIGINT NOT NULL,
    interest_expense BIGINT,
    pre_tax_income BIGINT NOT NULL,
    income_tax_expense BIGINT NOT NULL,
    net_income BIGINT NOT NULL,
    eps_basic NUMERIC,
    eps_diluted NUMERIC,

    -- Balance Sheet
    cash BIGINT NOT NULL,
    short_term_investments BIGINT,
    accounts_receivable BIGINT NOT NULL,
    inventory BIGINT,
    current_assets BIGINT NOT NULL,
    total_assets BIGINT NOT NULL,
    current_liabilities BIGINT NOT NULL,
    short_term_debt BIGINT,
    long_term_debt BIGINT NOT NULL,
    total_liabilities BIGINT NOT NULL,
    equity BIGINT NOT NULL,

    -- Cash Flow
    operating_cash_flow BIGINT NOT NULL,
    investing_cash_flow BIGINT NOT NULL,
    financing_cash_flow BIGINT NOT NULL,
    capital_expenditure BIGINT NOT NULL,

    -- Shares
    shares_outstanding BIGINT NOT NULL,
    weighted_average_shares BIGINT NOT NULL,

    -- Market Data
    current_price NUMERIC NOT NULL,
    market_cap BIGINT NOT NULL,

    -- Earnings & Estimates
    earnings NUMERIC NOT NULL,
    eps_estimates NUMERIC NOT NULL,
    revenue_estimates BIGINT NOT NULL,
    earnings_surprise NUMERIC NOT NULL,
    revenue_surprise NUMERIC NOT NULL,

    -- Macro
    macro_gdp BIGINT NOT NULL,
    macro_gdp_growth NUMERIC NOT NULL,
    macro_inflation NUMERIC NOT NULL,
    macro_interest_rates NUMERIC NOT NULL,
    macro_unemployment NUMERIC NOT NULL,
    macro_government_debt NUMERIC NOT NULL,
    macro_exchange_rates JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Company
    company_peers JSONB NOT NULL DEFAULT '[]'::jsonb,
    dividends BIGINT,
    buybacks BIGINT,

    -- Valuation
    pe_ratio NUMERIC,
    ps_ratio NUMERIC,
    pb_ratio NUMERIC,
    ev_ebitda NUMERIC,
    roe NUMERIC,
    roa NUMERIC,
    debt_equity NUMERIC,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (ticker, filing_date)
);

CREATE TABLE technical_snapshots (
    symbol TEXT NOT NULL,
    timestamp_ms BIGINT NOT NULL,

    -- OHLCV
    open DOUBLE PRECISION NOT NULL,
    high DOUBLE PRECISION NOT NULL,
    low DOUBLE PRECISION NOT NULL,
    close DOUBLE PRECISION NOT NULL,
    volume DOUBLE PRECISION NOT NULL,
    quote_volume DOUBLE PRECISION NOT NULL,
    trades_count BIGINT NOT NULL,

    -- Returns
    ret_1b DOUBLE PRECISION NOT NULL,
    ret_5b DOUBLE PRECISION NOT NULL,
    ret_10b DOUBLE PRECISION NOT NULL,
    ret_60b DOUBLE PRECISION NOT NULL,
    ret_open_to_close DOUBLE PRECISION NOT NULL,

    -- Price Structure
    hl_range DOUBLE PRECISION NOT NULL,
    body_range DOUBLE PRECISION NOT NULL,

    -- Moving Averages
    dist_sma_20 DOUBLE PRECISION NOT NULL,
    dist_sma_50 DOUBLE PRECISION NOT NULL,
    dist_sma_200 DOUBLE PRECISION NOT NULL,

    -- EMA
    ema_diff_9_21 DOUBLE PRECISION NOT NULL,
    ema_diff_21_50 DOUBLE PRECISION NOT NULL,

    -- Volatility
    vol_20 DOUBLE PRECISION NOT NULL,
    vol_60 DOUBLE PRECISION NOT NULL,
    atr_14_norm DOUBLE PRECISION NOT NULL,

    -- Volume
    volume_rel_20 DOUBLE PRECISION NOT NULL,
    taker_buy_vol_ratio DOUBLE PRECISION NOT NULL,

    -- Trade Window
    trade_window_count BIGINT NOT NULL,
    trade_window_vol_base DOUBLE PRECISION NOT NULL,
    trade_window_vol_quote DOUBLE PRECISION NOT NULL,
    trade_buy_vol_ratio DOUBLE PRECISION NOT NULL,
    avg_trade_size DOUBLE PRECISION NOT NULL,
    median_trade_size DOUBLE PRECISION NOT NULL,
    large_trade_vol_ratio DOUBLE PRECISION NOT NULL,

    -- Order Book
    bid_price DOUBLE PRECISION NOT NULL,
    ask_price DOUBLE PRECISION NOT NULL,
    bid_qty DOUBLE PRECISION NOT NULL,
    ask_qty DOUBLE PRECISION NOT NULL,
    spread_abs DOUBLE PRECISION NOT NULL,
    spread_bps DOUBLE PRECISION NOT NULL,
    top_book_imbalance DOUBLE PRECISION NOT NULL,

    -- Market Depth
    depth_bid_total DOUBLE PRECISION NOT NULL,
    depth_ask_total DOUBLE PRECISION NOT NULL,
    depth_imbalance DOUBLE PRECISION NOT NULL,

    -- 24H Data
    high_24h DOUBLE PRECISION NOT NULL,
    low_24h DOUBLE PRECISION NOT NULL,
    last_price_24h DOUBLE PRECISION NOT NULL,
    range_24h DOUBLE PRECISION NOT NULL,
    pct_change_24h DOUBLE PRECISION NOT NULL,
    pos_in_24h_range DOUBLE PRECISION NOT NULL,
    volume_24h DOUBLE PRECISION NOT NULL,
    quote_volume_24h DOUBLE PRECISION NOT NULL,

    -- Funding
    funding_rate DOUBLE PRECISION NOT NULL,
    funding_rate_lag_3 DOUBLE PRECISION NOT NULL,
    funding_rate_change DOUBLE PRECISION NOT NULL,
    funding_rate_zscore DOUBLE PRECISION NOT NULL,
    time_to_next_funding_min DOUBLE PRECISION NOT NULL,

    -- Open Interest
    open_interest DOUBLE PRECISION NOT NULL,
    oi_change_1h DOUBLE PRECISION NOT NULL,
    oi_change_24h DOUBLE PRECISION NOT NULL,
    oi_to_volume_24h DOUBLE PRECISION NOT NULL,

    -- Scores
    trend_score DOUBLE PRECISION NOT NULL,
    mean_reversion_score DOUBLE PRECISION NOT NULL,
    liquidity_score DOUBLE PRECISION NOT NULL,
    order_flow_score DOUBLE PRECISION NOT NULL,
    sentiment_score DOUBLE PRECISION NOT NULL,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (symbol, timestamp_ms)
);