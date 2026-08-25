from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class MarketFeatures(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    symbol: str
    interval: str
    open_time: datetime

    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[float] = None
    close_time: Optional[datetime] = None
    quote_volume: Optional[float] = None
    trades_count: Optional[int] = None
    taker_buy_volume: Optional[float] = None
    taker_buy_quote_volume: Optional[float] = None

    ret_1b: Optional[float] = None
    ret_open_to_close: Optional[float] = None
    ret_3b: Optional[float] = None
    ret_5b: Optional[float] = None
    ret_10b: Optional[float] = None
    ret_20b: Optional[float] = None
    ret_60b: Optional[float] = None

    hl_range: Optional[float] = None
    body_range: Optional[float] = None
    dist_sma_20: Optional[float] = None
    dist_sma_50: Optional[float] = None
    dist_sma_200: Optional[float] = None
    ema_diff_9_21: Optional[float] = None
    ema_diff_21_50: Optional[float] = None
    vol_20: Optional[float] = None
    vol_60: Optional[float] = None
    atr_14_norm: Optional[float] = None
    volume_sma_20: Optional[float] = None
    volume_rel_20: Optional[float] = None
    taker_buy_vol_ratio: Optional[float] = None

    rsi_14: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_hist: Optional[float] = None

    bb_upper: Optional[float] = None
    bb_lower: Optional[float] = None
    bb_width: Optional[float] = None
    bb_pct: Optional[float] = None
    obv: Optional[float] = None

    returns_skew_20: Optional[float] = None
    returns_kurt_20: Optional[float] = None
    drawdown: Optional[float] = None
    amihud_illiquidity: Optional[float] = None
    return_mean_20: Optional[float] = None
    return_std_20: Optional[float] = None
    return_zscore_20: Optional[float] = None
    return_zscore_60: Optional[float] = None

    upper_wick: Optional[float] = None
    lower_wick: Optional[float] = None
    upper_wick_ratio: Optional[float] = None
    lower_wick_ratio: Optional[float] = None
    body_to_range: Optional[float] = None

    price_zscore_20: Optional[float] = None
    price_zscore_50: Optional[float] = None
    price_zscore_200: Optional[float] = None
    high_distance_20: Optional[float] = None
    low_distance_20: Optional[float] = None

    volume_zscore_20: Optional[float] = None
    volume_zscore_60: Optional[float] = None
    volume_change_1: Optional[float] = None
    volume_change_5: Optional[float] = None
    vol_ratio_20_60: Optional[float] = None
    volume_trend_20: Optional[float] = None
    vol_change_1: Optional[float] = None
    vol_change_5: Optional[float] = None

    atr_ratio: Optional[float] = None
    rsi_change_1: Optional[float] = None
    rsi_change_5: Optional[float] = None
    macd_hist_change_1: Optional[float] = None
    macd_hist_change_5: Optional[float] = None
    macd_hist_zscore_20: Optional[float] = None

    bb_width_change: Optional[float] = None
    bb_width_zscore_20: Optional[float] = None
    bb_pct_change: Optional[float] = None
    buy_pressure_change: Optional[float] = None
    trade_count_change: Optional[float] = None
    trade_count_zscore_20: Optional[float] = None

    avg_trade_size: Optional[float] = None
    avg_trade_size_zscore_20: Optional[float] = None
    drawdown_change: Optional[float] = None
    drawdown_duration: Optional[int] = None
    recovery_from_drawdown: Optional[float] = None

    target_return_1h: Optional[float] = None
    target_return_4h: Optional[float] = None
    target_return_12h: Optional[float] = None
    target_return_24h: Optional[float] = None
    target_return_72h: Optional[float] = None

    target_direction_1h: Optional[int] = None
    target_direction_4h: Optional[int] = None
    target_direction_12h: Optional[int] = None
    target_direction_24h: Optional[int] = None
    target_direction_72h: Optional[int] = None

    target_volatility_4h: Optional[float] = None
    target_volatility_24h: Optional[float] = None
    target_volatility_72h: Optional[float] = None

    target_log_return_1h: Optional[float] = None
    target_log_return_4h: Optional[float] = None
    target_log_return_12h: Optional[float] = None
    target_log_return_24h: Optional[float] = None
    target_log_return_72h: Optional[float] = None