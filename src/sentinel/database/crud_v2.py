import pandas as pd
import numpy as np
from sentinel.database.models import (
    TechnicalSnapshot, CompanyFundamental, market_features,
    macro_data, BaselineResult
)
from sentinel.database.connection import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert

async def insert_ta_data(session: AsyncSession, data: dict):
    data = {
        key: value.item() if isinstance(value, np.generic) else value
        for key, value in data.items()
    }
    stmt = insert(TechnicalSnapshot).values(data)
    stmt = stmt.on_conflict_do_nothing(
        index_elements=["symbol", "timestamp_ms"]
    )
    await session.execute(stmt)


async def get_ta_data(session: AsyncSession, symbol: str, limit: int = 1) -> TechnicalSnapshot:
    result = await session.execute(
        select(TechnicalSnapshot)
        .where(TechnicalSnapshot.symbol == symbol)
        .limit(limit)
    )
    return result.scalars().first()

async def insert_fa_data(session: AsyncSession, data: dict):
    data = {
        key: value.item() if isinstance(value, np.generic) else value
        for key, value in data.items()
    }
    stmt = insert(CompanyFundamental).values(data)
    stmt = stmt.on_conflict_do_nothing(
        index_elements=["ticker", "filing_date"]
    )
    await session.execute(stmt)

async def insert_crypto_history_data(session: AsyncSession, data: pd.DataFrame):
    df = data.copy()
    for col in ["drawdown_duration", "trades_count"]:
        if col in df.columns:
            df[col] = np.where(df[col].isna(), None, df[col])

    for col in ["date_time", "close_time"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], utc=True)

    mappings = df.to_dict(orient='records')

    batch_size = 300
    for i in range(0, len(mappings), batch_size):
        batch = mappings[i:i + batch_size]
        stmt = insert(market_features).values(batch)
        stmt = stmt.on_conflict_do_nothing(
            index_elements=["symbol", "interval", "open_time"]
        )
        await session.execute(stmt)

async def get_crypto_history_data(session: AsyncSession, symbol: str, limit: int = 1000):
    result = await session.execute(
        select(market_features)
        .where(market_features.symbol == symbol)
        .limit(limit)
    )
    return result.scalars().all()

async def get_fa_data(session: AsyncSession, ticker: str, limit: int = 1) -> CompanyFundamental:
    result = await session.execute(
        select(CompanyFundamental)
        .where(CompanyFundamental.ticker == ticker)
        .limit(limit)
    )
    return result.scalars().first()

async def insert_macro_data(
    session: AsyncSession,
    data: pd.DataFrame,
) -> None:

    df = data[
        ["date", "value", "series_id", "unit"]
    ].copy()

    df["date"] = pd.to_datetime(
        df["date"],
        utc=True,
    )

    df["value"] = df["value"].where(
        df["value"].notna(),
        None,
    )

    records = df.to_dict(orient="records")

    for i in range(0, len(records), 5000):
        batch = records[i:i + 5000]

        stmt = (
            insert(macro_data)
            .values(batch)
            .on_conflict_do_nothing(
                index_elements=[
                    "date",
                    "series_id",
                ],
            )
        )

        await session.execute(stmt)

async def get_macro_data(session: AsyncSession, series_id: str, limit: int = 100) -> macro_data:
    result = await session.execute(
        select(macro_data)
        .where(macro_data.series_id == series_id)
        .limit(limit)
    )
    return result.scalars().all()


def insert_baseline_results_sync(results: list[BaselineResult]) -> None:
    from sentinel.database.connection import engine

    with engine.connect() as conn:
        for result in results:
            conn.execute(
                text("""
                    INSERT INTO baseline_results
                        (symbol, baseline_name, target_column, horizon, window_size, metric_name, metric_value)
                    VALUES
                        (:symbol, :baseline_name, :target_column, :horizon, :window_size, :metric_name, :metric_value)
                """),
                {
                    "symbol": result.symbol,
                    "baseline_name": result.baseline_name,
                    "target_column": result.target_column,
                    "horizon": result.horizon,
                    "window_size": result.window_size,
                    "metric_name": result.metric_name,
                    "metric_value": result.metric_value,
                },
            )
        conn.commit()


def get_baseline_results_sync(
    symbol: str | None = None,
    baseline_name: str | None = None,
    target_column: str | None = None,
) -> pd.DataFrame:
    from sentinel.database.connection import engine

    query = "SELECT * FROM baseline_results WHERE 1=1"
    params: dict = {}

    if symbol:
        query += " AND symbol = :symbol"
        params["symbol"] = symbol
    if baseline_name:
        query += " AND baseline_name = :baseline_name"
        params["baseline_name"] = baseline_name
    if target_column:
        query += " AND target_column = :target_column"
        params["target_column"] = target_column

    query += " ORDER BY symbol, target_column, baseline_name, metric_name"

    with engine.connect() as conn:
        return pd.read_sql(sql=text(query), con=conn, params=params)
